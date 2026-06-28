import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, ArrowLeft, Plus, Loader2, CreditCard, IndianRupee, Shield, Lock, Building, Smartphone, AlertCircle, ShoppingBag, RefreshCw, Check } from 'lucide-react';
import CustomerLayout from '../../../../components/CustomerLayout';
import { useAddress } from '@core/contexts';
import AddressFormModal from '@core/components/shared/AddressFormModal';
import { validateCheckout, createCommerceOrder, createPayment, verifyPayment, getCart } from '@core/services';
import PremiumImage from '@core/components/ui/PremiumImage';
import Button from '@core/components/ui/Button';
import IconButton from '@core/components/ui/IconButton';
import Stepper from '@core/components/ui/Stepper';
import Card from '@core/components/ui/Card';

const STEPS = ['Address', 'Review', 'Payment'];

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive', icon: IndianRupee },
  { id: 'razorpay', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, Rupay', icon: CreditCard },
  { id: 'razorpay_upi', label: 'UPI', desc: 'Google Pay, PhonePe, Paytm', icon: Smartphone },
  { id: 'razorpay_netbanking', label: 'Net Banking', desc: 'All major banks', icon: Building },
];

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
};

const useRazorpay = () => {
  const [paymentState, setPaymentState] = useState('idle');
  const [paymentError, setPaymentError] = useState('');

  const launchRazorpay = async ({ orderId, key, amount, currency, razorpayOrderId, onSuccess, onDismiss }) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setPaymentError('Failed to load payment gateway. Please try again.');
      return;
    }
    const options = {
      key,
      amount,
      currency,
      name: 'VS Boutique',
      description: `Order ${orderId}`,
      order_id: razorpayOrderId,
      handler: async function (response) {
        setPaymentState('verifying');
        try {
          const verifyRes = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId,
          });
          if (verifyRes?.success) {
            setPaymentState('success');
            onSuccess();
          } else {
            setPaymentError(verifyRes?.message || 'Payment verification failed');
            setPaymentState('failed');
          }
        } catch (err) {
          setPaymentError(err?.response?.data?.message || err?.message || 'Payment verification failed');
          setPaymentState('failed');
        }
      },
      modal: {
        ondismiss: () => {
          setPaymentState('dismissed');
          setPaymentError('Payment cancelled');
          if (onDismiss) onDismiss();
        },
      },
      theme: { color: '#8B0000' },
    };
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      setPaymentError(response.error?.description || 'Payment failed');
      setPaymentState('failed');
    });
    rzp.open();
    setPaymentState('open');
  };

  return { paymentState, paymentError, setPaymentError, launchRazorpay };
};

const CustomerCheckout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);
  const [orderError, setOrderError] = useState('');
  const { paymentState, paymentError, setPaymentError, launchRazorpay } = useRazorpay();

  const { addresses, addAddress } = useAddress();
  const { data: cart } = useQuery({ queryKey: ['cart'], queryFn: getCart });
  const { data: checkoutData } = useQuery({ queryKey: ['checkout-validate'], queryFn: validateCheckout, enabled: true });

  const items = cart?.items || [];
  const checkout = checkoutData?.data;
  const subtotal = checkout?.subtotal || items.reduce((s, i) => s + (i.variant?.price || i.product?.basePrice || 0) * i.quantity, 0);

  const handleAddAddress = async (data) => {
    setSavingAddr(true);
    try {
      const result = await addAddress(data);
      setSelectedAddress(result?.id);
      setShowAddAddress(false);
    } finally {
      setSavingAddr(false);
    }
  };

  const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
  const addr = addresses.find(a => a.id === selectedAddress) || defaultAddr;

  const onPlaceSuccess = (id) => {
    queryClient.invalidateQueries({ queryKey: ['cart'] });
    queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    navigate(`/customer/order-success/${id}`);
  };

  const handlePlaceOrder = async () => {
    setOrderError('');
    setPaymentError('');
    if (!addr) { setOrderError('Please select a shipping address'); return; }
    if (items.length === 0) { setOrderError('Your cart is empty'); return; }

    setPlacing(true);
    try {
      const result = await createCommerceOrder({ shippingAddressId: addr.id });
      const created = result?.data || result;
      const { orderId, id } = created;

      if (paymentMethod === 'cod') {
        onPlaceSuccess(id);
        return;
      }

      const payResult = await createPayment({ orderId });
      const payData = payResult?.data;
      if (!payData) {
        setOrderError(payResult?.message || 'Failed to initialize payment');
        setPlacing(false);
        return;
      }

      setPlacing(false);
      await launchRazorpay({
        orderId,
        key: payData.key,
        amount: payData.amount,
        currency: payData.currency,
        razorpayOrderId: payData.razorpayOrderId,
        onSuccess: () => onPlaceSuccess(id),
        onDismiss: () => {},
      });
    } catch (err) {
      setPlacing(false);
      const msg = err?.response?.data?.message || err?.message || 'Failed to place order';
      setOrderError(msg);
    }
  };

  const isPlacing = placing || paymentState === 'open' || paymentState === 'verifying';
  const canContinueToReview = !!addr && items.length > 0;

  return (
    <CustomerLayout>
      <div className="max-w-[1400px] mx-auto px-4 pt-4 pb-4">
        <div className="flex items-center space-x-3 mb-6">
          <IconButton
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
            ariaLabel="Go back"
          />
          <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
        </div>

        <Stepper
          steps={STEPS}
          activeStep={step}
          className="max-w-md mx-auto mb-8"
        />

        {/* Error Banner */}
        {(orderError || paymentError) && (
          <div className="flex items-start space-x-2 bg-red-50 border border-red-100 rounded-2xl p-4 mb-4 animate-fade-in">
            <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-red-700">{orderError || paymentError}</p>
              {(paymentError || paymentState === 'failed' || paymentState === 'dismissed') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePlaceOrder}
                  isLoading={isPlacing}
                  className="mt-2 text-red-700 hover:bg-red-100/50 animate-pulse"
                >
                  <RefreshCw size={12} className="mr-1" /> Retry Payment
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="lg:flex lg:space-x-8 lg:items-start">
          {/* Main Checkout Content */}
          <div className="flex-1">
            {/* Step 1: Address Selection */}
            {step === 0 && (
              <div className="space-y-3 animate-fade-in">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Shipping Address</h2>
                {addresses.map(a => {
                  const isSelected = addr?.id === a.id;
                  return (
                    <Card
                      key={a.id}
                      onClick={() => setSelectedAddress(a.id)}
                      className={`p-4 border-2 transition-all duration-200 ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                          isSelected ? 'border-primary' : 'border-gray-200'
                        }`}>
                          {isSelected && <div className="w-3 h-3 bg-primary rounded-full scale-in" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-semibold text-gray-900">{a.fullName}</p>
                            {a.isDefault && <span className="text-[9px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded">DEFAULT</span>}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}</p>
                          <p className="text-xs text-gray-500">{a.city}, {a.state} - {a.pincode}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{a.phone}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                <Button
                  variant="secondary"
                  onClick={() => setShowAddAddress(true)}
                  className="w-full border-dashed border-2 text-gray-500 hover:text-primary hover:border-primary"
                >
                  <Plus size={16} className="mr-2" /> Add New Address
                </Button>
                {!addr && items.length === 0 && (
                  <div className="flex items-center space-x-2 bg-amber-50 rounded-2xl p-3">
                    <ShoppingBag size={14} className="text-amber-600" />
                    <p className="text-xs font-medium text-amber-700">Your cart is empty. Add items before checkout.</p>
                  </div>
                )}
                <Button
                  onClick={() => setStep(1)}
                  disabled={!canContinueToReview}
                  className="w-full mt-4"
                >
                  Continue to Review
                </Button>
              </div>
            )}

            {/* Step 2: Review */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-sm font-bold text-gray-900">Order Review</h2>
                {items.map(item => (
                  <Card key={item.id} className="p-4 flex space-x-3 animate-fade-in">
                    <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 relative">
                      <PremiumImage
                        src={item.product?.images?.[0]?.url}
                        alt={item.product?.name}
                        productName={item.product?.name}
                        category={item.product?.category?.name || item.product?.category}
                        aspectRatio="aspect-square"
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{item.product?.name}</p>
                      <p className="text-[11px] text-gray-400">{item.variant?.name} × {item.quantity}</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">₹{(item.variant?.price || item.product?.basePrice) * item.quantity}</p>
                    </div>
                  </Card>
                ))}
                {addr && (
                  <Card className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin size={14} className="text-primary" />
                      <span className="text-xs font-semibold text-gray-500">Delivering to</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{addr.fullName}</p>
                    <p className="text-xs text-gray-500">{addr.addressLine1}, {addr.city} - {addr.pincode}</p>
                  </Card>
                )}
                <Card className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">₹{subtotal}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="font-semibold text-green-600">Free</span></div>
                  <div className="flex justify-between pt-3 border-t border-gray-100"><span className="font-bold text-gray-900">Total</span><span className="font-bold text-lg">₹{subtotal}</span></div>
                </Card>
                <Button
                  onClick={() => setStep(2)}
                  className="w-full"
                >
                  Continue to Payment
                </Button>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-sm font-bold text-gray-900">Payment Method</h2>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map(pm => {
                    const Icon = pm.icon;
                    const isSelected = paymentMethod === pm.id;
                    return (
                      <label key={pm.id} className="block cursor-pointer">
                        <Card
                          className={`p-4 border-2 transition-all duration-200 ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected ? 'border-primary' : 'border-gray-200'
                            }`}>
                              {isSelected && <div className="w-3 h-3 bg-primary rounded-full" />}
                            </div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-primary/10' : 'bg-gray-50'
                            }`}>
                              <Icon size={20} className={isSelected ? 'text-primary' : 'text-gray-400'} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{pm.label}</p>
                              <p className="text-xs text-gray-400">{pm.desc}</p>
                            </div>
                            <input type="radio" name="payment" value={pm.id} checked={isSelected} onChange={() => setPaymentMethod(pm.id)} className="sr-only" />
                          </div>
                        </Card>
                      </label>
                    );
                  })}
                </div>

                {/* Security Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 flex items-start space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Lock size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Secure Checkout</p>
                    <p className="text-xs text-gray-500">Your payment information is encrypted with 256-bit SSL technology. We never store your card details.</p>
                  </div>
                </div>

                <Card className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Total Amount</span><span className="font-bold text-lg text-gray-900">₹{subtotal}</span></div>
                  <div className="flex items-center space-x-1 text-[10px] text-gray-400">
                    <Shield size={10} />
                    <span>100% Safe & Secure</span>
                  </div>
                </Card>

                {paymentMethod === 'cod' && (
                  <div className="bg-amber-50 rounded-2xl p-3 flex items-start space-x-2 animate-fade-in">
                    <IndianRupee size={14} className="text-amber-600 mt-0.5" />
                    <p className="text-xs text-amber-700 font-medium">Pay when your order is delivered. No online payment needed.</p>
                  </div>
                )}

                <Button
                  onClick={handlePlaceOrder}
                  isLoading={isPlacing}
                  disabled={items.length === 0}
                  className="w-full py-4 text-sm font-bold"
                >
                  {paymentMethod === 'cod' ? `Place Order • ₹${subtotal}` : `Pay ₹${subtotal}`}
                </Button>
              </div>
            )}
          </div>

          {/* Desktop Summary Sidebar */}
          {items.length > 0 && (
            <div className="hidden lg:block w-80 flex-shrink-0">
              <Card className="p-5 sticky top-20">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-3">
                  {items.slice(0, 3).map(item => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 relative">
                        <PremiumImage
                          src={item.product?.images?.[0]?.url}
                          alt={item.product?.name}
                          productName={item.product?.name}
                          category={item.product?.category?.name || item.product?.category}
                          aspectRatio="aspect-square"
                          className="w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{item.product?.name}</p>
                        <p className="text-[10px] text-gray-400">×{item.quantity}</p>
                      </div>
                      <p className="text-xs font-bold text-gray-900">₹{(item.variant?.price || item.product?.basePrice) * item.quantity}</p>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <p className="text-[11px] text-gray-400 font-medium text-center">+{items.length - 3} more items</p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">₹{subtotal}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="font-semibold text-green-600">Free</span></div>
                  <div className="flex justify-between pt-2 border-t border-gray-100"><span className="font-bold text-gray-900">Total</span><span className="font-bold text-lg text-gray-900">₹{subtotal}</span></div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <AddressFormModal
        visible={showAddAddress}
        onClose={() => setShowAddAddress(false)}
        onSave={handleAddAddress}
        saving={savingAddr}
      />
    </CustomerLayout>
  );
};

export default CustomerCheckout;

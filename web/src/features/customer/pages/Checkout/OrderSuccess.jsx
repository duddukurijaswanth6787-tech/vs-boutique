import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Package, ShoppingBag, ChevronRight, Loader2, AlertCircle, RefreshCw, Clock, CreditCard, IndianRupee, Smartphone } from 'lucide-react';
import CustomerLayout from '../../../../components/CustomerLayout';
import { getMyCommerceOrder, createPayment, verifyPayment } from '@core/services';

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

const PAYMENT_METHOD_LABELS = {
  cod: 'Cash on Delivery',
  razorpay: 'Card Payment',
  razorpay_upi: 'UPI',
  razorpay_netbanking: 'Net Banking',
};

const PAYMENT_METHOD_ICONS = {
  cod: IndianRupee,
  razorpay: CreditCard,
  razorpay_upi: Smartphone,
  razorpay_netbanking: CreditCard,
};

const PAYMENT_STATUS_CONFIG = {
  PAID: { label: 'Paid', bg: 'bg-green-50', text: 'text-green-600', icon: Check },
  PENDING: { label: 'Pending', bg: 'bg-yellow-50', text: 'text-yellow-600', icon: Clock },
  FAILED: { label: 'Failed', bg: 'bg-red-50', text: 'text-red-500', icon: AlertCircle },
  REFUNDED: { label: 'Refunded', bg: 'bg-blue-50', text: 'text-blue-600', icon: RefreshCw },
};

const OrderSuccess = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState('');

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getMyCommerceOrder(orderId),
    enabled: !!orderId,
    retry: 1,
  });

  const handleRetryPayment = async () => {
    setRetryError('');
    setRetrying(true);
    try {
      const payResult = await createPayment({ orderId: order.orderId });
      const payData = payResult?.data || payResult;
      if (!payData?.razorpayOrderId) {
        setRetryError(payResult?.message || 'Failed to initialize payment');
        setRetrying(false);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setRetryError('Failed to load payment gateway');
        setRetrying(false);
        return;
      }

      const options = {
        key: payData.key,
        amount: payData.amount,
        currency: payData.currency,
        name: 'VS Boutique',
        description: `Order ${order.orderId}`,
        order_id: payData.razorpayOrderId,
        handler: async function (response) {
          try {
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order.orderId,
            });
            if (verifyRes?.success) {
              queryClient.invalidateQueries({ queryKey: ['order', orderId] });
            } else {
              setRetryError(verifyRes?.message || 'Payment verification failed');
            }
          } catch (err) {
            setRetryError(err?.response?.data?.message || err?.message || 'Payment verification failed');
          }
          setRetrying(false);
        },
        modal: {
          ondismiss: () => {
            setRetryError('Payment cancelled');
            setRetrying(false);
          },
        },
        theme: { color: '#8B0000' },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setRetryError(response.error?.description || 'Payment failed');
        setRetrying(false);
      });
      rzp.open();
    } catch (err) {
      setRetrying(false);
      setRetryError(err?.response?.data?.message || err?.message || 'Failed to retry payment');
    }
  };

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="px-4 pt-12 pb-4 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse" />
          <div className="h-6 w-48 bg-gray-100 rounded-xl mx-auto mb-2 animate-pulse" />
          <div className="h-4 w-64 bg-gray-50 rounded-lg mx-auto animate-pulse" />
        </div>
      </CustomerLayout>
    );
  }

  if (!orderId || error || !order) {
    return (
      <CustomerLayout>
        <div className="px-4 pt-12 pb-4 text-center">
          <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order not found</h2>
          <p className="text-sm text-gray-400 mb-6">{error?.message || 'We could not locate this order'}</p>
          <button onClick={() => navigate('/customer/shop')} className="px-8 py-3.5 bg-primary text-white rounded-2xl text-sm font-semibold">
            Continue Shopping
          </button>
        </div>
      </CustomerLayout>
    );
  }

  const { paymentStatus, paymentMethod, totalAmount, items } = order;
  const isPaid = paymentStatus === 'PAID';
  const canRetry = paymentStatus === 'PENDING';
  const payCfg = PAYMENT_STATUS_CONFIG[paymentStatus] || PAYMENT_STATUS_CONFIG.PENDING;
  const PayIcon = payCfg.icon;
  const PayMethodIcon = PAYMENT_METHOD_ICONS[paymentMethod] || IndianRupee;

  return (
    <CustomerLayout>
      <div className="px-4 pt-12 pb-4 text-center">
        {isPaid ? (
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-green-500" />
          </div>
        ) : (
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock size={40} className="text-amber-500" />
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isPaid ? 'Order Placed!' : 'Order Created'}
        </h2>
        <p className="text-gray-500 mb-1 font-medium">
          {isPaid ? 'Your order has been placed successfully' : 'Your order has been created'}
        </p>
        <p className="text-sm text-gray-400">
          {isPaid ? "We'll notify you when it ships" : 'Complete payment to confirm your order'}
        </p>

        <div className="bg-white rounded-3xl p-5 border border-gray-50 shadow-sm mt-8 text-left">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-primary/5 rounded-2xl flex items-center justify-center">
              <Package size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Order Number</p>
              <p className="text-sm font-bold text-gray-900 font-mono">{order.orderId || orderId}</p>
            </div>
          </div>

          <div className="border-t border-gray-50 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Total Amount</span>
              <span className="text-sm font-bold text-gray-900">₹{Number(totalAmount).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Payment Method</span>
              <div className="flex items-center space-x-1.5">
                <PayMethodIcon size={14} className="text-gray-500" />
                <span className="text-xs font-semibold text-gray-700">{PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod || 'N/A'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Payment Status</span>
              <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full ${payCfg.bg}`}>
                <PayIcon size={12} className={payCfg.text} />
                <span className={`text-[11px] font-bold ${payCfg.text}`}>{payCfg.label}</span>
              </div>
            </div>
            {items?.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Items</span>
                <span className="text-xs font-semibold text-gray-700">{items.length} item{items.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {!isPaid && !canRetry && paymentStatus === 'FAILED' && (
          <div className="bg-red-50 rounded-2xl p-4 mt-6 text-left flex items-start space-x-3">
            <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700 font-medium">Payment failed. Please contact support for assistance.</p>
          </div>
        )}

        {retryError && (
          <div className="bg-red-50 rounded-2xl p-4 mt-4 text-left flex items-start space-x-3">
            <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-red-700">{retryError}</p>
              {canRetry && (
                <button onClick={handleRetryPayment} disabled={retrying}
                  className="mt-2 flex items-center space-x-1 text-xs font-semibold text-red-700 hover:underline">
                  <RefreshCw size={12} /> <span>Try Again</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-3 mt-8">
          <button onClick={() => navigate(`/customer/orders/${orderId}`)}
            className="w-full py-4 bg-primary text-white rounded-2xl font-semibold text-sm shadow-lg shadow-primary/20 flex items-center justify-center space-x-2">
            <span>View Order Details</span>
            <ChevronRight size={18} />
          </button>
          <button onClick={() => navigate('/customer/orders')}
            className="w-full py-4 border border-gray-200 rounded-2xl font-semibold text-sm text-gray-600 flex items-center justify-center space-x-2">
            <span>My Orders</span>
          </button>
          <button onClick={() => navigate('/customer/shop')}
            className="w-full py-3 text-sm text-primary font-semibold flex items-center justify-center space-x-2">
            <ShoppingBag size={16} /> <span>Continue Shopping</span>
          </button>
        </div>

        {canRetry && !retryError && (
          <button onClick={handleRetryPayment} disabled={retrying}
            className="mt-6 w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-60">
            {retrying ? <Loader2 className="animate-spin" size={20} /> : 'Complete Payment'}
          </button>
        )}
      </div>
    </CustomerLayout>
  );
};

export default OrderSuccess;

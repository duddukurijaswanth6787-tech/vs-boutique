import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Minus, Plus, ChevronRight, Loader2, ArrowLeft, Gift, Truck, CheckCircle, Percent } from 'lucide-react';
import CustomerLayout from '../../../../components/CustomerLayout';
import { validateCoupon } from '@core/services';
import { useCart } from '@core/contexts';
import { useCustomerAuth } from '@core/contexts';
import PremiumImage from '@core/components/ui/PremiumImage';
import { IMAGES } from '@core/services';
import Input from '@core/components/ui/Input';
import Button from '@core/components/ui/Button';
import IconButton from '@core/components/ui/IconButton';
import EmptyState from '@core/components/ui/EmptyState';
import Skeleton from '@core/components/ui/Skeleton';
import Card from '@core/components/ui/Card';

const FREE_DELIVERY_MIN = 499;

const CartItemSkeleton = () => (
  <div className="bg-white rounded-2xl p-4 border border-gray-50">
    <div className="flex space-x-3">
      <Skeleton variant="rect" width="80px" height="80px" className="rounded-xl shrink-0 bg-gray-100" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="70%" className="bg-gray-100" />
        <Skeleton variant="text" width="40%" className="bg-gray-50" />
      </div>
    </div>
  </div>
);

const CustomerCart = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useCustomerAuth();
  const { cartItems, cartCount, subtotal, loading, updateQuantity, removeItem } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const items = cartItems || [];
  const discount = couponResult?.discountAmount || 0;
  const total = Math.max(0, subtotal - discount);
  const deliveryProgress = Math.min(100, (subtotal / FREE_DELIVERY_MIN) * 100);
  const freeDeliveryEarned = subtotal >= FREE_DELIVERY_MIN;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError('');
    try {
      const cartItemsForCoupon = items.map(item => ({
        productId: item.productId,
        unitPrice: item.variant?.price || item.product?.basePrice || 0,
        quantity: item.quantity,
      }));
      const result = await validateCoupon({ couponCode: couponCode.trim(), cartItems: cartItemsForCoupon });
      setCouponResult(result);
    } catch (err) {
      setCouponError(err?.response?.data?.message || 'Invalid coupon');
      setCouponResult(null);
    } finally {
      setApplyingCoupon(false);
    }
  };

  if (!isAuthenticated) return (
    <CustomerLayout>
      <EmptyState
        title="Sign in to view cart"
        description="Add items to your cart and they'll appear here"
        icon={ShoppingBag}
      />
    </CustomerLayout>
  );

  return (
    <CustomerLayout>
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-center space-x-3 mb-6">
          <IconButton
            icon={ArrowLeft}
            onClick={() => navigate('/customer/shop')}
            ariaLabel="Go back"
            className="-ml-2 text-gray-600"
          />
          <h1 className="text-xl font-bold text-gray-900">Shopping Cart</h1>
          {cartCount > 0 && <span className="text-sm text-gray-400 font-medium">({cartCount} items)</span>}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <CartItemSkeleton key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Your Cart is Empty"
            description="Looks like you haven't added anything yet"
            actionLabel="Start Shopping"
            onAction={() => navigate('/customer/shop')}
            icon={ShoppingBag}
          />
        ) : (
          <div className="lg:flex lg:space-x-6 lg:items-start">
            {/* Cart Items */}
            <div className="flex-1 space-y-4">
              {/* Free Delivery Progress */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/5 rounded-2xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  {freeDeliveryEarned ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <Truck size={16} className="text-primary" />
                  )}
                  <span className={`text-xs font-semibold ${freeDeliveryEarned ? 'text-green-600' : 'text-gray-700'}`}>
                    {freeDeliveryEarned ? 'Free Delivery Applied!' : `Add ₹${FREE_DELIVERY_MIN - subtotal} more for free delivery`}
                  </span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ease-out ${freeDeliveryEarned ? 'bg-green-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, deliveryProgress)}%` }} />
                </div>
              </div>              {items.map(item => (
                <Card key={item.id} className="p-4 hover:shadow-md transition-all">
                  <div className="flex space-x-3">
                    <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 relative">
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
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.product?.name}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{item.variant?.name || 'Default'}</p>
                        </div>
                        <IconButton
                          icon={Trash2}
                          onClick={() => removeItem(item.id)}
                          className="text-gray-300 hover:text-red-400 ml-2"
                          ariaLabel="Remove item"
                        />
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2 bg-gray-50 rounded-xl p-0.5">
                          <IconButton
                            icon={Minus}
                            size="sm"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            ariaLabel="Decrease quantity"
                          />
                          <span className="text-sm font-semibold w-8 text-center">{item.quantity}</span>
                          <IconButton
                            icon={Plus}
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            ariaLabel="Increase quantity"
                          />
                        </div>
                        <p className="text-sm font-bold text-gray-900">₹{(item.variant?.price || item.product?.basePrice) * item.quantity}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Coupon */}
              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Gift size={16} className="text-primary" />
                  <span className="text-sm font-semibold text-gray-900">Apply Coupon</span>
                </div>
                <div className="flex space-x-2 items-end">
                  <div className="flex-1">
                    <Input
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="w-full"
                    />
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                    isLoading={applyingCoupon}
                    className="py-3 px-5 text-xs h-[46px] select-none"
                  >
                    Apply
                  </Button>
                </div>
                {couponResult && (
                  <div className="mt-3 bg-green-50 rounded-xl p-3 flex items-center space-x-2 animate-fade-in">
                    <CheckCircle size={14} className="text-green-600" />
                    <div>
                      <p className="text-xs font-semibold text-green-700">Coupon Applied!</p>
                      <p className="text-[10px] text-green-600">You save ₹{couponResult.discountAmount}</p>
                    </div>
                  </div>
                )}
                {couponError && (
                  <p className="text-xs text-red-500 mt-2 font-medium animate-fade-in">{couponError}</p>
                )}
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:w-80 mt-4 lg:mt-0 lg:sticky lg:top-20">
              <Card className="p-5">
                <p className="text-sm font-bold text-gray-900 mb-4">Order Summary</p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-semibold">₹{subtotal}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Discount</span>
                      <span className="font-semibold text-green-600">-₹{discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span className={`font-semibold ${freeDeliveryEarned ? 'text-green-600' : 'text-gray-900'}`}>
                      {freeDeliveryEarned ? 'Free' : '₹49'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-100">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-lg text-gray-900">₹{total}</span>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/customer/checkout')}
                  variant="primary"
                  className="w-full mt-5 py-3.5 flex items-center justify-center space-x-2"
                >
                  <span>Proceed to Checkout</span>
                  <ChevronRight size={18} />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/customer/shop')}
                  className="w-full mt-3 py-2.5 text-xs text-gray-500 font-medium text-center"
                >
                  Continue Shopping
                </Button>
              </Card>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerCart;

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Package, Truck, Loader2, Clock, CheckCircle, XCircle, AlertTriangle, Star, RotateCcw, ArrowLeftRight } from 'lucide-react';
import CustomerLayout from '../../../../components/CustomerLayout';
import ReviewModal from '@core/components/shared/ReviewModal';
import ReturnRequestModal from '@core/components/shared/ReturnRequestModal';
import ExchangeRequestModal from '@core/components/shared/ExchangeRequestModal';
import { getMyCommerceOrder, customerCancelOrder, getCustomerOrderTracking } from '@core/services';
import { useReview } from '@core/contexts';
import { useReturns } from '@core/contexts';
import PremiumImage from '@core/components/ui/PremiumImage';
import Button from '@core/components/ui/Button';
import IconButton from '@core/components/ui/IconButton';
import Modal from '@core/components/ui/Modal';
import Card from '@core/components/ui/Card';
import Textarea from '@core/components/ui/Textarea';
import { useCustomerAuth } from '@core/contexts';
import OtpModal from '@core/components/shared/OtpModal';
import EmptyState from '@core/components/ui/EmptyState';

const STATUS_META = {
  PENDING: { label: 'Order Placed', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle },
  PROCESSING: { label: 'Processing', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Package },
  PACKED: { label: 'Packed', color: 'text-purple-600', bg: 'bg-purple-50', icon: Package },
  SHIPPED: { label: 'Shipped', color: 'text-cyan-600', bg: 'bg-cyan-50', icon: Truck },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'text-orange-600', bg: 'bg-orange-50', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-50', icon: XCircle },
};

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' at ' +
    dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const CustomerOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useCustomerAuth();
  const queryClient = useQueryClient();
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [returnItem, setReturnItem] = useState(null);
  const [exchangeItem, setExchangeItem] = useState(null);
  const [showOtp, setShowOtp] = useState(false);
  const { useReviews } = useReview();
  const { useReturnsData } = useReturns();
  const { createReturn, createExchange, isCreatingReturn, isCreatingExchange } = useReturnsData();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['my-order', id],
    queryFn: () => getMyCommerceOrder(id),
    enabled: isAuthenticated,
  });

  const { data: tracking } = useQuery({
    queryKey: ['order-tracking', id],
    queryFn: () => getCustomerOrderTracking(id),
    retry: false,
    enabled: isAuthenticated && !!order,
  });

  if (!isAuthenticated) return (
    <CustomerLayout>
      <EmptyState
        title="Order Details"
        description="Sign in to view details for this order"
        actionLabel="Sign In"
        onAction={() => setShowOtp(true)}
        icon={Package}
      />
      {showOtp && <OtpModal onClose={() => setShowOtp(false)} />}
    </CustomerLayout>
  );

  const cancelMutation = useMutation({
    mutationFn: (reason) => customerCancelOrder(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-order', id] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      setShowCancel(false);
    },
  });

  const { addReview, isAdding } = useReviews(reviewProduct?.productId || '');

  const handleWriteReview = (product) => {
    setReviewProduct(product);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (data) => {
    await addReview({ rating: data.rating, comment: data.comment, title: data.title });
    setReviewProduct(null);
  };

  const handleOpenReturn = (item) => {
    setReturnItem(item);
    setShowReturnModal(true);
  };

  const handleOpenExchange = (item) => {
    setExchangeItem(item);
    setShowExchangeModal(true);
  };

  const handleSubmitReturn = async (data) => {
    await createReturn({ orderId: order.id, orderItemId: returnItem.id, reason: data.reason, notes: data.notes });
    setReturnItem(null);
  };

  const handleSubmitExchange = async (data) => {
    await createExchange({ orderId: order.id, orderItemId: exchangeItem.id, reason: data.reason, notes: data.notes });
    setExchangeItem(null);
  };

  if (isLoading) return (
    <CustomerLayout>
      <div className="animate-pulse p-4 space-y-4">
        <div className="h-8 bg-gray-200 rounded-xl w-1/2" />
        <div className="h-32 bg-gray-200 rounded-3xl" />
        <div className="h-40 bg-gray-200 rounded-3xl" />
      </div>
    </CustomerLayout>
  );

  if (error || !order) return (
    <CustomerLayout>
      <div className="text-center py-20">
        <Package size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-1">Order Not Found</h3>
        <Button onClick={() => navigate('/customer/orders')} className="mt-4">My Orders</Button>
      </div>
    </CustomerLayout>
  );

  const statusMeta = STATUS_META[order.status] || STATUS_META.PENDING;
  const StatusIcon = statusMeta.icon;
  const currentIdx = ORDER_STATUSES.indexOf(order.status);
  const trackingEvents = tracking?.events || tracking?.trackingEvents || [];

  const showTimeline = order.status !== 'CANCELLED' && currentIdx >= 0;

  return (
    <CustomerLayout>
      <div className="px-4 pt-4 pb-4">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <IconButton
            icon={ArrowLeft}
            onClick={() => navigate('/customer/orders')}
            ariaLabel="Back to Orders"
          />
          <h1 className="text-xl font-bold text-gray-900">Order Details</h1>
        </div>

        {/* Status Banner */}
        <div className={`rounded-3xl p-5 ${statusMeta.bg} mb-4`}>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/80 rounded-2xl flex items-center justify-center">
              <StatusIcon size={24} className={statusMeta.color} />
            </div>
            <div>
              <p className={`text-base font-bold ${statusMeta.color}`}>{statusMeta.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">Order #{order.orderId} • {formatDate(order.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Amazon-Style Delivery Tracking Timeline */}
        {showTimeline && (
          <Card className="p-5 mb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
              <Truck size={14} className="text-primary mr-1.5" /> Delivery Timeline
            </h3>
            <div className="relative">
              {ORDER_STATUSES.slice(0, currentIdx + 1).map((s, i) => {
                const meta = STATUS_META[s];
                const done = i <= currentIdx;
                const isLast = i === currentIdx;
                const trackingEvent = trackingEvents.find(e => e.status === s) || trackingEvents.find(e => e.status?.toUpperCase() === s);
                const timeStr = trackingEvent ? formatDateTime(trackingEvent.timestamp || trackingEvent.createdAt) : '';
                return (
                  <div key={s} className="flex items-start space-x-3 pb-6 last:pb-0 relative">
                    {/* Connector line */}
                    {i < currentIdx && <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-green-200" />}
                    {/* Dot */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      done ? 'bg-green-500' : 'bg-gray-200'
                    }`}>
                      {done && <CheckCircle size={14} className="text-white" />}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                        {meta.label}
                      </p>
                      {timeStr && (
                        <p className="text-[11px] text-gray-400 mt-0.5">{timeStr}</p>
                      )}
                      {isLast && order.status === 'SHIPPED' && (
                        <p className="text-[11px] text-primary font-medium mt-0.5">Your package is on its way!</p>
                      )}
                      {isLast && order.status === 'OUT_FOR_DELIVERY' && (
                        <p className="text-[11px] text-primary font-medium mt-0.5">Delivery partner is heading to your location</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Carrier Tracking Info */}
        {tracking?.courierName && (
          <Card className="p-5 mb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Carrier Information</h3>
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between"><span className="text-xs text-gray-500">Courier</span><span className="text-xs font-semibold text-gray-900">{tracking.courierName}</span></div>
              {tracking.trackingNumber && <div className="flex justify-between"><span className="text-xs text-gray-500">Tracking #</span><span className="text-xs font-semibold text-gray-900">{tracking.trackingNumber}</span></div>}
              {tracking.estimatedDelivery && <div className="flex justify-between"><span className="text-xs text-gray-500">Est. Delivery</span><span className="text-xs font-semibold text-gray-900">{formatDate(tracking.estimatedDelivery)}</span></div>}
            </div>
          </Card>
        )}

        {/* Items */}
        <Card className="p-5 mb-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Items ({order.items?.length || 0})</h3>
          <div className="space-y-3">
            {order.items?.map(item => (
              <div key={item.id} className="flex space-x-3">
                <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 relative">
                  <PremiumImage
                    src={item.imageUrl}
                    alt={item.productName || item.name}
                    productName={item.productName || item.name}
                    aspectRatio="aspect-square"
                    className="w-full h-full"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{item.productName || item.name}</p>
                  <p className="text-[11px] text-gray-400">{item.variantName || 'Default'} × {item.quantity}</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">₹{item.price || item.unitPrice}</p>
                  {order.status === 'DELIVERED' && (
                    <div className="flex items-center space-x-1 mt-1.5">
                      <Button variant="ghost" size="sm" onClick={() => handleWriteReview(item)} className="text-[11px] font-semibold text-primary p-1">
                        <Star size={10} className="mr-1" /> Review
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenReturn(item)} className="text-[11px] font-semibold text-orange-500 p-1">
                        <RotateCcw size={10} className="mr-1" /> Return
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenExchange(item)} className="text-[11px] font-semibold text-blue-500 p-1">
                        <ArrowLeftRight size={10} className="mr-1" /> Exchange
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <Card className="p-5 mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <MapPin size={14} className="text-primary" />
              <h3 className="text-sm font-bold text-gray-900">Shipping Address</h3>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-sm font-semibold text-gray-900">{order.shippingAddress.fullName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{order.shippingAddress.addressLine1}{order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}</p>
              <p className="text-xs text-gray-500">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
              <p className="text-xs text-gray-400 mt-0.5">{order.shippingAddress.phone}</p>
            </div>
          </Card>
        )}

        {/* Payment Summary */}
        <Card className="p-5 mb-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Payment Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">₹{order.subtotalAmount || order.totalAmount}</span></div>
            {order.discountAmount > 0 && <div className="flex justify-between"><span className="text-green-600">Discount</span><span className="font-semibold text-green-600">-₹{order.discountAmount}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="font-semibold text-green-600">Free</span></div>
            <div className="flex justify-between pt-3 border-t border-gray-100">
              <span className="font-bold text-gray-900">Total Paid</span>
              <span className="font-bold text-lg text-gray-900">₹{order.totalAmount}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">Payment</span>
              <span className="font-medium text-gray-600">{order.paymentMethod || order.paymentMode || 'COD'}</span>
            </div>
          </div>
        </Card>

        {/* Cancel Order */}
        {!['DELIVERED', 'CANCELLED', 'SHIPPED'].includes(order.status) && (
          <Button
            onClick={() => setShowCancel(true)}
            className="w-full mt-6 bg-transparent text-red-500 border border-red-200 hover:bg-red-50 rounded-2xl py-3.5"
          >
            Cancel Order
          </Button>
        )}
      </div>

      <ReviewModal
        visible={showReviewModal}
        onClose={() => { setShowReviewModal(false); setReviewProduct(null); }}
        onSubmit={handleSubmitReview}
        saving={isAdding}
      />

      <ReturnRequestModal
        visible={showReturnModal}
        onClose={() => { setShowReturnModal(false); setReturnItem(null); }}
        onSubmit={handleSubmitReturn}
        saving={isCreatingReturn}
      />

      <ExchangeRequestModal
        visible={showExchangeModal}
        onClose={() => { setShowExchangeModal(false); setExchangeItem(null); }}
        onSubmit={handleSubmitExchange}
        saving={isCreatingExchange}
      />

      <Modal
        isOpen={showCancel}
        onClose={() => setShowCancel(false)}
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Cancel Order?</h3>
          <p className="text-sm text-gray-500 mb-6">This action cannot be undone. Please tell us why you're cancelling.</p>
          <Textarea
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            rows={3}
            placeholder="Reason for cancellation (optional)"
            className="mb-4"
          />
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowCancel(false)}
              variant="ghost"
              className="flex-1"
            >
              Keep Order
            </Button>
            <Button
              onClick={() => cancelMutation.mutate(cancelReason)}
              isLoading={cancelMutation.isPending}
              className="flex-1 bg-red-500 hover:bg-red-600 border-none text-white font-semibold"
            >
              Cancel Order
            </Button>
          </div>
        </div>
      </Modal>
    </CustomerLayout>
  );
};

export default CustomerOrderDetail;

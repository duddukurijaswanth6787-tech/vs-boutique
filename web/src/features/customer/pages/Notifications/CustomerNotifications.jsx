import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, ShoppingBag, CreditCard, RotateCcw, ArrowLeftRight, MessageSquare, Calendar, Tag, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import { useNotifications } from '@core/contexts';
import { useCustomerAuth } from '@core/contexts';
import CustomerLayout from '../../../../components/CustomerLayout';
import OtpModal from '@core/components/shared/OtpModal';
import EmptyState from '@core/components/ui/EmptyState';
import IconButton from '@core/components/ui/IconButton';
import Button from '@core/components/ui/Button';
import Card from '@core/components/ui/Card';

const TYPE_CONFIG = {
  ORDER_PLACED: { icon: ShoppingBag, bg: 'bg-blue-50', color: 'text-blue-500' },
  PAYMENT_SUCCESS: { icon: CreditCard, bg: 'bg-green-50', color: 'text-green-500' },
  PAYMENT_FAILED: { icon: CreditCard, bg: 'bg-red-50', color: 'text-red-500' },
  ORDER_SHIPPED: { icon: ShoppingBag, bg: 'bg-purple-50', color: 'text-purple-500' },
  ORDER_DELIVERED: { icon: ShoppingBag, bg: 'bg-emerald-50', color: 'text-emerald-500' },
  RETURN_REQUESTED: { icon: RotateCcw, bg: 'bg-orange-50', color: 'text-orange-500' },
  RETURN_APPROVED: { icon: RotateCcw, bg: 'bg-green-50', color: 'text-green-500' },
  RETURN_REJECTED: { icon: RotateCcw, bg: 'bg-red-50', color: 'text-red-500' },
  EXCHANGE_REQUESTED: { icon: ArrowLeftRight, bg: 'bg-orange-50', color: 'text-orange-500' },
  EXCHANGE_APPROVED: { icon: ArrowLeftRight, bg: 'bg-green-50', color: 'text-green-500' },
  EXCHANGE_SHIPPED: { icon: ArrowLeftRight, bg: 'bg-purple-50', color: 'text-purple-500' },
  REVIEW_REPLY: { icon: MessageSquare, bg: 'bg-pink-50', color: 'text-pink-500' },
  BOOKING_CONFIRMED: { icon: Calendar, bg: 'bg-indigo-50', color: 'text-indigo-500' },
  BOOKING_RESCHEDULED: { icon: Calendar, bg: 'bg-yellow-50', color: 'text-yellow-500' },
  PROMOTION: { icon: Tag, bg: 'bg-amber-50', color: 'text-amber-500' },
};

function getEntityPath(notification) {
  const { entityType, entityId } = notification;
  if (!entityType) return null;
  switch (entityType) {
    case 'commerce_order': return `/customer/orders/${entityId}`;
    case 'return': return '/customer/returns';
    case 'exchange': return '/customer/returns';
    case 'product_review': return entityId ? `/customer/products/${entityId}` : '/customer/orders';
    case 'booking': return '/customer/bookings';
    default: return null;
  }
}

function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function CustomerNotifications() {
  const navigate = useNavigate();
  const { isAuthenticated } = useCustomerAuth();
  const { notifications, unreadCount, loading, markRead, markAllRead, removeNotification } = useNotifications();
  const [showOtp, setShowOtp] = useState(false);

  const handleNotificationClick = (n) => {
    if (!n.isRead) markRead(n.id);
    const path = getEntityPath(n);
    if (path) navigate(path);
  };

  if (!isAuthenticated) return (
    <CustomerLayout>
      <EmptyState
        title="Notifications"
        description="Sign in to view your notification history"
        actionLabel="Sign In"
        onAction={() => setShowOtp(true)}
        icon={Bell}
      />
      {showOtp && <OtpModal onClose={() => setShowOtp(false)} />}
    </CustomerLayout>
  );

  return (
    <CustomerLayout>
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <IconButton
              icon={ArrowLeft}
              onClick={() => navigate('/customer/profile')}
              ariaLabel="Back to Profile"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center space-x-1.5 px-3 py-2 bg-primary/5 text-primary rounded-xl text-sm font-medium">
              <CheckCheck size={16} />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-50 p-6">
            <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Bell size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No notifications yet</h3>
            <p className="text-sm text-gray-400">We'll notify you when something happens</p>
            <button onClick={() => navigate('/customer/orders')} className="mt-6 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium">
              Browse Orders
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const config = TYPE_CONFIG[n.type] || { icon: Bell, bg: 'bg-gray-50', color: 'text-gray-500' };
              const Icon = config.icon;
              return (
                <div
                  key={n.id}
                  className={`relative flex items-start space-x-3 p-4 rounded-2xl cursor-pointer transition-all border ${
                    n.isRead 
                      ? 'bg-white border-gray-50 hover:bg-gray-50/50' 
                      : 'bg-primary/[0.03] border-primary/10 hover:bg-primary/[0.05]'
                  }`}
                  onClick={() => handleNotificationClick(n)}
                >
                  {!n.isRead && <div className="absolute top-4 left-0 w-2 h-2 bg-primary rounded-full" />}
                  <div className={`w-10 h-10 ${config.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                    <Icon size={20} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className={`text-sm ${n.isRead ? 'text-gray-900' : 'text-gray-900 font-semibold'}`}>{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-300 mt-1.5">{formatTime(n.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-center space-y-2 flex-shrink-0 self-center">
                    <ChevronRight size={16} className="text-gray-300" />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 size={14} className="text-gray-300 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}

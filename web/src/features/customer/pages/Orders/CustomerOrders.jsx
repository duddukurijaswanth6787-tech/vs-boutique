import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, ChevronRight, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import CustomerLayout from '../../../../components/CustomerLayout';
import { getMyCommerceOrders } from '@core/services';
import PremiumImage from '@core/components/ui/PremiumImage';
import { useCustomerAuth } from '@core/contexts';
import OtpModal from '@core/components/shared/OtpModal';
import EmptyState from '@core/components/ui/EmptyState';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', bg: 'bg-yellow-50', text: 'text-yellow-600', icon: Clock },
  CONFIRMED: { label: 'Confirmed', bg: 'bg-blue-50', text: 'text-blue-600', icon: CheckCircle },
  PROCESSING: { label: 'Processing', bg: 'bg-indigo-50', text: 'text-indigo-600', icon: Clock },
  PACKED: { label: 'Packed', bg: 'bg-purple-50', text: 'text-purple-600', icon: Package },
  SHIPPED: { label: 'Shipped', bg: 'bg-cyan-50', text: 'text-cyan-600', icon: Truck },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', bg: 'bg-orange-50', text: 'text-orange-600', icon: Truck },
  DELIVERED: { label: 'Delivered', bg: 'bg-green-50', text: 'text-green-600', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-500', icon: XCircle },
};

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const OrderTimeline = ({ status }) => {
  const currentIdx = STATUS_ORDER.indexOf(status);
  if (currentIdx === -1 || status === 'CANCELLED') return null;

  return (
    <div className="flex items-center space-x-1 mt-2 px-1">
      {STATUS_ORDER.slice(0, currentIdx + 1).map((s, i) => {
        const done = i <= currentIdx;
        return (
          <div key={s} className="flex items-center flex-1">
            <div className={`w-2 h-2 rounded-full transition-all ${done ? 'bg-green-500 shadow-sm' : 'bg-gray-200'}`} />
            {i < currentIdx && <div className={`flex-1 h-0.5 transition-all ${done ? 'bg-green-200' : 'bg-gray-100'}`} />}
          </div>
        );
      })}
    </div>
  );
};

const CustomerOrders = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useCustomerAuth();
  const [tab, setTab] = useState('all');
  const [showOtp, setShowOtp] = useState(false);

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['my-orders'],
    queryFn: getMyCommerceOrders,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return (
    <CustomerLayout>
      <EmptyState
        title="My Orders"
        description="Sign in to view and track your orders"
        actionLabel="Sign In"
        onAction={() => setShowOtp(true)}
        icon={Package}
      />
      {showOtp && <OtpModal onClose={() => setShowOtp(false)} />}
    </CustomerLayout>
  );

  const filtered = tab === 'all' ? orders : orders.filter(o => o.status === tab);

  return (
    <CustomerLayout>
      <div className="px-4 pt-4 pb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-serif mb-4">My Orders</h1>

        {/* Tabs */}
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide -mx-4 px-4 mb-4 pb-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                tab === t.key ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-white text-gray-500 border border-gray-100 hover:border-primary/20'
              }`}>{t.label}</button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-50 overflow-hidden animate-pulse">
                <div className="px-4 py-2.5 bg-gray-100" />
                <div className="p-4 space-y-3">
                  <div className="flex space-x-2">
                    {[1, 2, 3].map(j => <div key={j} className="w-14 h-14 bg-gray-100 rounded-xl" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-500 font-medium">Failed to load orders</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-sm text-primary font-semibold">Try Again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Orders Yet</h3>
            <p className="text-sm text-gray-400 mb-6">Start shopping to see your orders here</p>
            <button onClick={() => navigate('/customer/shop')}
              className="px-8 py-3.5 bg-primary text-white rounded-2xl text-sm font-semibold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all">
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
              const Icon = cfg.icon;
              return (
                <div key={order.id} onClick={() => navigate(`/customer/orders/${order.id}`)}
                  className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-transform hover:shadow-md hover:-translate-y-0.5">
                  <div className={`px-4 py-2.5 ${cfg.bg} flex items-center justify-between`}>
                    <div className="flex items-center space-x-2">
                      <Icon size={14} className={cfg.text} />
                      <span className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-[11px] text-gray-400 font-medium">Order #{order.orderId}</p>
                    </div>
                    <div className="flex space-x-2 overflow-x-hidden">
                      {order.items?.slice(0, 3).map(item => (
                        <div key={item.id} className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-50 relative">
                          <PremiumImage
                            src={item.imageUrl}
                            alt={item.productName || item.name}
                            productName={item.productName || item.name}
                            aspectRatio="aspect-square"
                            className="w-full h-full"
                          />
                        </div>
                      ))}
                      {(order.items?.length || 0) > 3 && (
                        <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center text-xs font-bold text-gray-400 border border-gray-50">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                    {order.status !== 'CANCELLED' && <OrderTimeline status={order.status} />}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                      <span className="text-sm font-bold text-gray-900">₹{order.totalAmount}</span>
                      <span className="text-xs text-primary font-semibold flex items-center hover:gap-0.5 transition-all">
                        {order.status === 'DELIVERED' ? 'Rate' : order.status === 'CANCELLED' ? '' : 'View Details'} <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerOrders;

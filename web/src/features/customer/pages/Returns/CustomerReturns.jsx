import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, RotateCcw, ArrowLeftRight, Clock, CheckCircle, XCircle, Package, RefreshCw, Truck, Search } from 'lucide-react';
import CustomerLayout from '../../../../components/CustomerLayout';
import { useReturns } from '@core/contexts';
import PremiumImage from '@core/components/ui/PremiumImage';
import { useCustomerAuth } from '@core/contexts';
import OtpModal from '@core/components/shared/OtpModal';
import EmptyState from '@core/components/ui/EmptyState';

const TABS = [
  { key: 'returns', label: 'Returns', icon: RotateCcw },
  { key: 'exchanges', label: 'Exchanges', icon: ArrowLeftRight },
];

const STATUS_CONFIG = {
  REQUESTED: { label: 'Requested', color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-amber-600', bg: 'bg-amber-50', icon: Search },
  APPROVED: { label: 'Approved', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-red-500', bg: 'bg-red-50', icon: XCircle },
  PICKUP_SCHEDULED: { label: 'Pickup Scheduled', color: 'text-purple-600', bg: 'bg-purple-50', icon: Truck },
  RECEIVED: { label: 'Received', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Package },
  REFUNDED: { label: 'Refunded', color: 'text-green-600', bg: 'bg-green-50', icon: RefreshCw },
  COMPLETED: { label: 'Completed', color: 'text-gray-600', bg: 'bg-gray-100', icon: CheckCircle },
  PROCESSING: { label: 'Processing', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: RefreshCw },
  SHIPPED: { label: 'Shipped', color: 'text-cyan-600', bg: 'bg-cyan-50', icon: Truck },
};

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const CustomerReturns = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useCustomerAuth();
  const [tab, setTab] = useState('returns');
  const [showOtp, setShowOtp] = useState(false);
  const { useReturnsData } = useReturns();
  const { returns, exchanges, loading } = useReturnsData();

  if (!isAuthenticated) return (
    <CustomerLayout>
      <EmptyState
        title="Returns & Exchanges"
        description="Sign in to view your returns and exchanges request history"
        actionLabel="Sign In"
        onAction={() => setShowOtp(true)}
        icon={RotateCcw}
      />
      {showOtp && <OtpModal onClose={() => setShowOtp(false)} />}
    </CustomerLayout>
  );

  const data = tab === 'returns' ? returns : exchanges;

  return (
    <CustomerLayout>
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-center space-x-3 mb-6">
          <button onClick={() => navigate('/customer/profile')} className="p-2 -ml-2"><ChevronRight size={20} className="text-gray-600 rotate-180" /></button>
          <h1 className="text-xl font-bold text-gray-900">Returns & Exchanges</h1>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                tab === t.key ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100'
              }`}>
              <t.icon size={14} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No {tab === 'returns' ? 'Returns' : 'Exchanges'}</h3>
            <p className="text-sm text-gray-400 mb-6">You haven't requested any {tab === 'returns' ? 'returns' : 'exchanges'} yet</p>
            <button onClick={() => navigate('/customer/orders')}
              className="px-8 py-3.5 bg-primary text-white rounded-2xl text-sm font-semibold">
              View Orders
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map(item => {
              const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.REQUESTED;
              const Icon = cfg.icon;
              return (
                <div key={item.id}
                  className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
                  {/* Status Header */}
                  <div className={`px-4 py-2.5 ${cfg.bg} flex items-center justify-between`}>
                    <div className="flex items-center space-x-2">
                      <Icon size={14} className={cfg.color} />
                      <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <span className="text-[10px] text-gray-500">
                      {tab === 'returns' ? item.returnNumber : item.exchangeNumber}
                    </span>
                  </div>
                  {/* Body */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs text-gray-400 font-medium">
                          Order #{item.order?.orderId || 'N/A'}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{item.reason}</p>
                      </div>
                    </div>
                    {item.orderItem && (
                      <div className="flex items-center space-x-3 mt-2 pt-2 border-t border-gray-50">
                        {item.orderItem.imageUrl && (
                          <div className="w-10 h-10 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 relative">
                            <PremiumImage
                              src={item.orderItem.imageUrl}
                              alt={item.orderItem.productName}
                              productName={item.orderItem.productName}
                              aspectRatio="aspect-square"
                              className="w-full h-full"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-900">{item.orderItem.productName}</p>
                          <p className="text-[10px] text-gray-400">{item.orderItem.variantName} × {item.orderItem.quantity}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                      <div className="flex items-center space-x-1 text-[10px] text-gray-400">
                        <Clock size={10} />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                      {item.refundAmount && (
                        <span className="text-xs font-bold text-gray-900">₹{Number(item.refundAmount).toLocaleString('en-IN')}</span>
                      )}
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

export default CustomerReturns;

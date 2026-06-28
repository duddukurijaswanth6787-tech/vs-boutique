import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, ShoppingBag, CreditCard, RotateCcw, ArrowLeftRight, MessageSquare, Calendar, Ruler, Star, Package, AlertTriangle, Layers, UserPlus, CreditCard as SubIcon, ShieldAlert, ChevronRight, Loader2, Search, Filter, X } from 'lucide-react';
import { useAdminNotifications } from '@core/contexts';

const TYPE_CONFIG = {
  NEW_ORDER: { icon: ShoppingBag, bg: 'bg-blue-50', color: 'text-blue-500', category: 'orders' },
  PAYMENT_RECEIVED: { icon: CreditCard, bg: 'bg-green-50', color: 'text-green-500', category: 'orders' },
  PAYMENT_FAILED: { icon: CreditCard, bg: 'bg-red-50', color: 'text-red-500', category: 'orders' },
  ORDER_CANCELLED: { icon: X, bg: 'bg-red-50', color: 'text-red-500', category: 'orders' },
  ORDER_RETURN_REQUEST: { icon: RotateCcw, bg: 'bg-orange-50', color: 'text-orange-500', category: 'returns' },
  ORDER_RETURN_APPROVED: { icon: RotateCcw, bg: 'bg-green-50', color: 'text-green-500', category: 'returns' },
  ORDER_RETURN_REJECTED: { icon: RotateCcw, bg: 'bg-red-50', color: 'text-red-500', category: 'returns' },
  ORDER_EXCHANGE_REQUEST: { icon: ArrowLeftRight, bg: 'bg-orange-50', color: 'text-orange-500', category: 'returns' },
  ORDER_EXCHANGE_APPROVED: { icon: ArrowLeftRight, bg: 'bg-green-50', color: 'text-green-500', category: 'returns' },
  NEW_BOOKING: { icon: Calendar, bg: 'bg-indigo-50', color: 'text-indigo-500', category: 'bookings' },
  BOOKING_CANCELLED: { icon: Calendar, bg: 'bg-red-50', color: 'text-red-500', category: 'bookings' },
  NEW_MEASUREMENT: { icon: Ruler, bg: 'bg-teal-50', color: 'text-teal-500', category: 'measurements' },
  NEW_REVIEW: { icon: Star, bg: 'bg-yellow-50', color: 'text-yellow-500', category: 'reviews' },
  LOW_STOCK: { icon: Package, bg: 'bg-amber-50', color: 'text-amber-500', category: 'inventory' },
  OUT_OF_STOCK: { icon: AlertTriangle, bg: 'bg-red-50', color: 'text-red-500', category: 'inventory' },
  PRODUCT_APPROVAL: { icon: Layers, bg: 'bg-purple-50', color: 'text-purple-500', category: 'products' },
  EMPLOYEE_ASSIGNED: { icon: UserPlus, bg: 'bg-cyan-50', color: 'text-cyan-500', category: 'staff' },
  SUBSCRIPTION_EXPIRING: { icon: SubIcon, bg: 'bg-amber-50', color: 'text-amber-500', category: 'subscriptions' },
  SUBSCRIPTION_EXPIRED: { icon: SubIcon, bg: 'bg-red-50', color: 'text-red-500', category: 'subscriptions' },
  SYSTEM_ALERT: { icon: ShieldAlert, bg: 'bg-red-50', color: 'text-red-500', category: 'system' },
};

const PRIORITY_STYLES = {
  LOW: { badge: 'bg-gray-100 text-gray-500', border: 'border-gray-200' },
  NORMAL: { badge: 'bg-blue-100 text-blue-600', border: 'border-blue-200' },
  HIGH: { badge: 'bg-orange-100 text-orange-600', border: 'border-orange-200' },
  CRITICAL: { badge: 'bg-red-100 text-red-600', border: 'border-red-200' },
};

const CATEGORIES = [
  { key: 'all', label: 'All', icon: Bell },
  { key: 'orders', label: 'Orders', icon: ShoppingBag },
  { key: 'returns', label: 'Returns', icon: RotateCcw },
  { key: 'bookings', label: 'Bookings', icon: Calendar },
  { key: 'reviews', label: 'Reviews', icon: Star },
  { key: 'inventory', label: 'Inventory', icon: Package },
  { key: 'subscriptions', label: 'Subscriptions', icon: SubIcon },
  { key: 'system', label: 'System', icon: ShieldAlert },
];

function getEntityPath(notification) {
  const { entityType, entityId } = notification;
  switch (entityType) {
    case 'commerce_order': return `/admin/commerce-orders/${entityId}`;
    case 'return': return `/owner/returns`;
    case 'exchange': return `/owner/returns`;
    case 'booking': return `/admin/bookings`;
    case 'product_review': return `/admin/product-reviews`;
    case 'product_variant': return `/owner/products`;
    case 'measurement': return `/customers`;
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

export default function AdminNotifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markRead, markAllRead, removeNotification } = useAdminNotifications();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const filtered = useMemo(() => {
    let result = notifications;
    if (categoryFilter !== 'all') {
      result = result.filter(n => TYPE_CONFIG[n.type]?.category === categoryFilter);
    }
    if (priorityFilter) {
      result = result.filter(n => n.priority === priorityFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q));
    }
    return result;
  }, [notifications, categoryFilter, priorityFilter, searchQuery]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleClick = (n) => {
    if (!n.isRead) markRead(n.id);
    const path = getEntityPath(n);
    if (path) navigate(path);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications Center</h1>
          <p className="text-sm text-gray-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread · ${notifications.length} total` : 'All caught up'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedIds.size > 0 && (
            <>
              <span className="text-sm text-gray-400">{selectedIds.size} selected</span>
              <button onClick={clearSelection} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">Clear</button>
            </>
          )}
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center space-x-1.5 px-4 py-2 bg-[#7C3AED]/5 text-[#7C3AED] rounded-xl text-sm font-medium hover:bg-[#7C3AED]/10 transition-colors">
              <CheckCheck size={16} />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search notifications..." className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#7C3AED]/40 focus:ring-2 focus:ring-[#7C3AED]/10" />
          {searchQuery && <X size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" onClick={() => setSearchQuery('')} />}
        </div>
        <div className="flex space-x-2 overflow-x-auto w-full sm:w-auto">
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setCategoryFilter(cat.key)} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${categoryFilter === cat.key ? 'bg-[#7C3AED] text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
              <cat.icon size={14} />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#7C3AED]/40">
          <option value="">All Priority</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="NORMAL">Normal</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Bell size={32} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No notifications found</h3>
          <p className="text-sm text-gray-400">{searchQuery || categoryFilter !== 'all' || priorityFilter ? 'Try adjusting your filters' : 'No notifications yet'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const config = TYPE_CONFIG[n.type] || { icon: Bell, bg: 'bg-gray-50', color: 'text-gray-500', category: 'other' };
            const Icon = config.icon;
            const priorityStyle = PRIORITY_STYLES[n.priority] || PRIORITY_STYLES.NORMAL;
            const isSelected = selectedIds.has(n.id);
            return (
              <div key={n.id} className={`relative flex items-start space-x-3 p-4 rounded-2xl cursor-pointer transition-all border ${n.isRead ? 'bg-white border-gray-100' : `bg-[#7C3AED]/[0.02] ${priorityStyle.border}`}`} onClick={() => handleClick(n)}>
                {!n.isRead && <div className="absolute top-4 left-0 w-2 h-2 bg-[#7C3AED] rounded-full" />}
                <div className="flex items-center h-10">
                  <input type="checkbox" checked={isSelected} onChange={(e) => { e.stopPropagation(); toggleSelect(n.id); }} className="w-4 h-4 rounded border-gray-300 text-[#7C3AED] focus:ring-[#7C3AED]/20" onClick={e => e.stopPropagation()} />
                </div>
                <div className={`w-10 h-10 ${config.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className={`text-sm ${n.isRead ? 'text-gray-900' : 'text-gray-900 font-semibold'}`}>{n.title}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${priorityStyle.badge}`}>{n.priority}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-gray-300 mt-1.5">{formatTime(n.createdAt)}</p>
                </div>
                <div className="flex flex-col items-center space-y-1 flex-shrink-0">
                  <ChevronRight size={16} className="text-gray-300" />
                  <button onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }} className="p-1 hover:bg-gray-100 rounded-lg">
                    <Trash2 size={14} className="text-gray-300 hover:text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

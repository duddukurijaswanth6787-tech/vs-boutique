import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminCommerceOrders, getOrderTracking,
  createOrderTracking, updateTrackingStatus
} from '@core/services';
import OwnerLayout from '../../../../components/OwnerLayout';
import { TableSkeleton } from '@core/components/ui/Skeleton';
import {
  Search, Truck, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useDebounce from '@core/hooks/useDebounce';

const statusConfig = {
  PENDING: { label: 'Pending', color: 'bg-gray-100 text-gray-500' },
  PICKED_UP: { label: 'Picked Up', color: 'bg-blue-50 text-blue-600' },
  IN_TRANSIT: { label: 'In Transit', color: 'bg-indigo-50 text-indigo-600' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-orange-50 text-orange-600' },
  DELIVERED: { label: 'Delivered', color: 'bg-green-50 text-green-600' },
  FAILED: { label: 'Failed', color: 'bg-red-50 text-red-500' },
  RETURNED: { label: 'Returned', color: 'bg-gray-100 text-gray-500' },
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const OwnerDeliveryTracking = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 15;

  const [expandedOrder, setExpandedOrder] = useState(null);

  const [showCreateForm, setShowCreateForm] = useState(null);
  const [createForm, setCreateForm] = useState({ courierName: '', trackingNumber: '', trackingUrl: '', expectedDeliveryDate: '' });

  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNote, setUpdateNote] = useState('');

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['owner-commerce-orders'],
    queryFn: getAdminCommerceOrders,
  });

  const { data: fetchedTracking, isLoading: trackingLoading, isError: trackingError } = useQuery({
    queryKey: ['owner-order-tracking', expandedOrder],
    queryFn: () => getOrderTracking(expandedOrder),
    enabled: !!expandedOrder,
  });

  const createMutation = useMutation({
    mutationFn: (data) => createOrderTracking(expandedOrder, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['owner-order-tracking', expandedOrder]);
      setShowCreateForm(null);
      setCreateForm({ courierName: '', trackingNumber: '', trackingUrl: '', expectedDeliveryDate: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateTrackingStatus(expandedOrder, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['owner-order-tracking', expandedOrder]);
      setUpdateStatus('');
      setUpdateNote('');
    },
  });

  const shippableOrders = useMemo(() => {
    const statuses = ['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    let result = orders.filter(o => statuses.includes(o.status));
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(o =>
        o.orderId?.toLowerCase().includes(q) ||
        o.user?.name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, debouncedSearch, statusFilter]);

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * perPage;
    return shippableOrders.slice(start, start + perPage);
  }, [shippableOrders, page]);

  const totalPages = Math.ceil(shippableOrders.length / perPage);

  const handleExpandOrder = async (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      setShowCreateForm(null);
      return;
    }
    setExpandedOrder(orderId);
    setShowCreateForm(null);
  };

  const handleCreateTracking = async () => {
    if (!createForm.courierName || !createForm.trackingNumber) return;
    createMutation.mutate(createForm);
  };

  const handleUpdateStatus = async () => {
    if (!updateStatus) return;
    updateMutation.mutate({ status: updateStatus, note: updateNote });
  };

  const nextStatusOptions = (currentStatus) => {
    const map = {
      PACKED: ['PICKED_UP', 'FAILED'],
      SHIPPED: ['IN_TRANSIT', 'FAILED'],
      OUT_FOR_DELIVERY: ['OUT_FOR_DELIVERY', 'FAILED'],
      IN_TRANSIT: ['OUT_FOR_DELIVERY', 'FAILED'],
    };
    return map[currentStatus] || ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'];
  };

  return (
    <OwnerLayout title="Delivery Tracking">
      <div className="space-y-8 pb-20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1 max-w-xl relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search by order ID or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-[1.5rem] shadow-card focus:ring-2 focus:ring-primary/10 outline-none transition-all font-semibold"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-5 py-4 bg-white border-none rounded-[1.5rem] shadow-card focus:ring-2 focus:ring-primary/10 outline-none font-semibold text-gray-600"
          >
            <option value="all">All Shippable</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="bg-red-50 rounded-[2.5rem] p-8 text-center">
            <p className="text-red-500 font-bold">Failed to load orders.</p>
            <p className="text-red-400 text-sm mt-2">{error.message}</p>
          </div>
        ) : shippableOrders.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] shadow-card p-16 text-center">
            <Truck size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-black text-gray-400 mb-2">No Trackable Orders</h3>
            <p className="text-gray-400 font-medium">No orders are in a shippable status.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {paginatedOrders.map(order => {
                  const isExpanded = expandedOrder === order.id;
                  return (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-[2.5rem] shadow-card border border-gray-50 overflow-hidden"
                    >
                      <div
                        onClick={() => handleExpandOrder(order.id)}
                        className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isExpanded ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                            <Truck size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">{order.orderId}</p>
                            <p className="text-sm text-gray-500">{order.user?.name || 'Unknown'} · {formatDate(order.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 flex-shrink-0">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${(statusConfig[order.status] || statusConfig.PENDING).color}`}>
                            {order.status}
                          </span>
                          <ChevronLeft size={18} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : '-rotate-90'}`} />
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-gray-50"
                          >
                            <div className="p-6 space-y-6">
                              {trackingLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
                              ) : fetchedTracking ? (
                                <div className="space-y-4">
                                  <div className="bg-gray-50 rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Courier</p>
                                      <p className="font-bold text-gray-900 mt-1">{fetchedTracking.courierName}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Tracking #</p>
                                      <p className="font-bold text-gray-900 mt-1">{fetchedTracking.trackingNumber}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Current Status</p>
                                      <p className={`font-bold mt-1 ${(statusConfig[fetchedTracking.status] || statusConfig.PENDING).color}`}>
                                        {fetchedTracking.status}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Expected</p>
                                      <p className="font-bold text-gray-900 mt-1">{formatDate(fetchedTracking.expectedDeliveryDate)}</p>
                                    </div>
                                  </div>

                                  <div className="bg-white border border-gray-100 rounded-2xl p-5">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Update Status</h4>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                      <select
                                        value={updateStatus}
                                        onChange={(e) => setUpdateStatus(e.target.value)}
                                        className="flex-1 px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/10 font-semibold text-gray-600"
                                      >
                                        <option value="">Select status...</option>
                                        {nextStatusOptions(fetchedTracking.status).map(s => (
                                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                        ))}
                                      </select>
                                      <input
                                        value={updateNote}
                                        onChange={(e) => setUpdateNote(e.target.value)}
                                        placeholder="Note (optional)"
                                        className="flex-1 px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/10 font-semibold"
                                      />
                                      <button
                                        onClick={handleUpdateStatus}
                                        disabled={!updateStatus || updateMutation.isPending}
                                        className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-60 flex items-center justify-center"
                                      >
                                        {updateMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : 'Update'}
                                      </button>
                                    </div>
                                  </div>

                                  {fetchedTracking.histories?.length > 0 && (
                                    <div className="bg-white border border-gray-100 rounded-2xl p-5">
                                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Tracking Timeline</h4>
                                      <div className="space-y-0">
                                        {fetchedTracking.histories.map((h, i) => (
                                          <div key={h.id} className="flex items-start space-x-3">
                                            <div className="flex flex-col items-center">
                                              <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                                              {i < fetchedTracking.histories.length - 1 && <div className="w-0.5 h-8 bg-gray-200" />}
                                            </div>
                                            <div className="pb-4">
                                              <p className="text-sm font-semibold text-gray-900">{h.toStatus?.replace(/_/g, ' ') || h.status?.replace(/_/g, ' ')}</p>
                                              <p className="text-xs text-gray-400">{h.note || ''} · {formatDate(h.createdAt)}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (trackingError && !fetchedTracking) || showCreateForm === 'form' ? (
                                <div className="bg-gray-50 rounded-2xl p-5">
                                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Create Shipment Tracking</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Courier Name *</label>
                                      <input value={createForm.courierName} onChange={e => setCreateForm(p => ({ ...p, courierName: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/10 font-semibold" />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Tracking Number *</label>
                                      <input value={createForm.trackingNumber} onChange={e => setCreateForm(p => ({ ...p, trackingNumber: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/10 font-semibold" />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Tracking URL</label>
                                      <input value={createForm.trackingUrl} onChange={e => setCreateForm(p => ({ ...p, trackingUrl: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/10 font-semibold" />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Expected Delivery</label>
                                      <input type="date" value={createForm.expectedDeliveryDate} onChange={e => setCreateForm(p => ({ ...p, expectedDeliveryDate: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/10 font-semibold" />
                                    </div>
                                  </div>
                                  <div className="flex space-x-4 mt-6">
                                    <button onClick={() => { setShowCreateForm(null); setExpandedOrder(null); }}
                                      className="px-6 py-3 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all">Cancel</button>
                                    <button onClick={handleCreateTracking} disabled={!createForm.courierName || !createForm.trackingNumber || createMutation.isPending}
                                      className="px-8 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-60">
                                      {createMutation.isPending ? <Loader2 className="animate-spin" /> : 'Create'}
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-4 pt-4">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="p-3 rounded-xl bg-white shadow-card text-gray-500 hover:text-primary disabled:opacity-40 transition-all">
                  <ChevronLeft size={18} />
                </button>
                <span className="font-semibold text-gray-500">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="p-3 rounded-xl bg-white shadow-card text-gray-500 hover:text-primary disabled:opacity-40 transition-all">
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </OwnerLayout>
  );
};

export default OwnerDeliveryTracking;

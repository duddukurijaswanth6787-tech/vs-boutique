import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminCommerceOrders, getAdminCommerceOrder,
  confirmCommerceOrder, packCommerceOrder, shipCommerceOrder,
  outForDeliveryCommerceOrder, deliverCommerceOrder, cancelCommerceOrder
} from '@core/services';
import { TableSkeleton } from '@core/components/ui/Skeleton';
import {
  Search, ShoppingBag, ChevronLeft, ChevronRight, X, IndianRupee,
  Package, Truck, CheckCircle, XCircle, Eye, Loader2, AlertTriangle,
  MapPin, User, Phone, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useDebounce from '@core/hooks/useDebounce';

const statusConfig = {
  PENDING: { label: 'Pending', color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  PROCESSING: { label: 'Processing', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  PACKED: { label: 'Packed', color: 'bg-purple-50 text-purple-600 border-purple-100' },
  SHIPPED: { label: 'Shipped', color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-orange-50 text-orange-600 border-orange-100' },
  DELIVERED: { label: 'Delivered', color: 'bg-green-50 text-green-600 border-green-100' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-50 text-red-500 border-red-100' },
  RETURNED: { label: 'Returned', color: 'bg-gray-100 text-gray-500 border-gray-200' },
  REFUNDED: { label: 'Refunded', color: 'bg-pink-50 text-pink-600 border-pink-100' },
};

const paymentStatusConfig = {
  PAID: { label: 'Paid', color: 'bg-green-50 text-green-600' },
  PENDING: { label: 'Pending', color: 'bg-yellow-50 text-yellow-600' },
  FAILED: { label: 'Failed', color: 'bg-red-50 text-red-500' },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-100 text-gray-500' },
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCurrency = (v) => {
  if (v == null) return '—';
  return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

const AdminCommerceOrders = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 15;

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelNote, setCancelNote] = useState('');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['admin-commerce-orders'],
    queryFn: getAdminCommerceOrders,
  });

  const { data: orderDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-commerce-order', detailOrder?.id],
    queryFn: () => getAdminCommerceOrder(detailOrder.id),
    enabled: !!detailOrder,
  });

  const confirmMutation = useMutation({
    mutationFn: confirmCommerceOrder,
    onSuccess: () => queryClient.invalidateQueries(['admin-commerce-orders']),
  });

  const shipMutation = useMutation({
    mutationFn: shipCommerceOrder,
    onSuccess: () => queryClient.invalidateQueries(['admin-commerce-orders']),
  });

  const deliverMutation = useMutation({
    mutationFn: deliverCommerceOrder,
    onSuccess: () => queryClient.invalidateQueries(['admin-commerce-orders']),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, note }) => cancelCommerceOrder(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-commerce-orders']);
      setIsCancelModalOpen(false);
      setCancelNote('');
    },
  });

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(o =>
        o.orderId?.toLowerCase().includes(q) ||
        o.user?.name?.toLowerCase().includes(q) ||
        o.user?.phone?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, debouncedSearch, statusFilter]);

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredOrders.slice(start, start + perPage);
  }, [filteredOrders, page]);

  const totalPages = Math.ceil(filteredOrders.length / perPage);

  const now = new Date();
  const unpaidExpired = (order) => {
    return order.paymentStatus === 'PENDING' && order.reservationExpiresAt && new Date(order.reservationExpiresAt) < now;
  };

  const handleQuickAction = (order, action) => {
    if (action === 'cancel') {
      setCancelTarget(order);
      setIsCancelModalOpen(true);
      return;
    }
    const id = order.id;
    if (action === 'confirm') confirmMutation.mutate(id);
    else if (action === 'ship') shipMutation.mutate(id);
    else if (action === 'deliver') deliverMutation.mutate(id);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1 max-w-xl relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search by order ID, customer, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-[1.5rem] shadow-card focus:ring-2 focus:ring-primary/10 outline-none transition-all font-semibold"
          />
        </div>
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-5 py-4 bg-white border-none rounded-[1.5rem] shadow-card focus:ring-2 focus:ring-primary/10 outline-none font-semibold text-gray-600"
          >
            <option value="all">All Orders</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <span className="text-sm font-semibold text-gray-400 bg-white px-4 py-3 rounded-[1.5rem] shadow-card">
            {filteredOrders.length} orders
          </span>
        </div>
      </div>

      {/* Loading / Error / Empty / Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <div className="bg-red-50 rounded-[2.5rem] p-8 text-center">
          <p className="text-red-500 font-bold">Failed to load orders.</p>
          <p className="text-red-400 text-sm mt-2">{error.message}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] shadow-card p-16 text-center">
          <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-black text-gray-400 mb-2">No Orders Found</h3>
          <p className="text-gray-400 font-medium">No commerce orders match your criteria.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            <AnimatePresence mode="popLayout">
              {paginatedOrders.map(order => {
                const sc = statusConfig[order.status] || statusConfig.PENDING;
                const ps = paymentStatusConfig[order.paymentStatus] || paymentStatusConfig.PENDING;
                return (
                  <motion.div
                    key={order.id}
                    layout initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{order.orderId}</p>
                        <p className="text-xs text-gray-500">{order.user?.name || 'Unknown'}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.color}`}>{sc.label}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                      <span className="font-bold text-primary">{formatCurrency(order.totalAmount)}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${ps.color}`}>{ps.label}</span>
                    </div>
                    <div className="flex items-center space-x-2 pt-2 border-t border-gray-50">
                      <button onClick={() => setDetailOrder(order)}
                        className="flex-1 py-2 text-xs font-bold text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                        View Details
                      </button>
                      {order.status === 'PENDING' && order.paymentStatus === 'PAID' && (
                        <button onClick={() => handleQuickAction(order, 'confirm')}
                          className="py-2 px-3 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all">
                          Confirm
                        </button>
                      )}
                      {(order.status === 'CONFIRMED' || order.status === 'PROCESSING') && (
                        <button onClick={() => handleQuickAction(order, 'ship')}
                          className="py-2 px-3 text-xs font-bold text-cyan-600 bg-cyan-50 rounded-xl hover:bg-cyan-100 transition-all">
                          Ship
                        </button>
                      )}
                      {order.status === 'SHIPPED' || order.status === 'OUT_FOR_DELIVERY' ? (
                        <button onClick={() => handleQuickAction(order, 'deliver')}
                          className="py-2 px-3 text-xs font-bold text-green-600 bg-green-50 rounded-xl hover:bg-green-100 transition-all">
                          Deliver
                        </button>
                      ) : null}
                      {(order.status !== 'DELIVERED' && order.status !== 'CANCELLED') && (
                        <button onClick={() => handleQuickAction(order, 'cancel')}
                          className="py-2 px-3 text-xs font-bold text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-all">
                          Cancel
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-[2.5rem] shadow-card border border-gray-50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Order</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Customer</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Items</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Total</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Payment</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Date</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence mode="popLayout">
                    {paginatedOrders.map(order => {
                      const sc = statusConfig[order.status] || statusConfig.PENDING;
                      const ps = paymentStatusConfig[order.paymentStatus] || paymentStatusConfig.PENDING;
                      const expired = unpaidExpired(order);
                      return (
                        <motion.tr
                          key={order.id}
                          layout initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`hover:bg-gray-50/30 transition-colors group ${expired ? 'bg-red-50/30' : ''}`}
                        >
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="font-bold text-gray-900 text-sm">{order.orderId}</span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-700">{order.user?.name || '—'}</span>
                              <span className="text-xs text-gray-400">{order.user?.phone || ''}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm text-gray-600">{order.items?.length || 0} item(s)</span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="font-bold">{formatCurrency(order.totalAmount)}</span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${ps.color}`}>{ps.label}</span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${sc.color}`}>{sc.label}</span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <button onClick={() => setDetailOrder(order)}
                                className="p-2 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/5 transition-all" title="View Details">
                                <Eye size={16} />
                              </button>
                              {order.status === 'PENDING' && order.paymentStatus === 'PAID' && (
                                <button onClick={() => handleQuickAction(order, 'confirm')}
                                  className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 transition-all" title="Confirm">
                                  <Package size={16} />
                                </button>
                              )}
                              {(order.status === 'CONFIRMED' || order.status === 'PROCESSING') && (
                                <button onClick={() => handleQuickAction(order, 'ship')}
                                  className="p-2 rounded-xl text-cyan-500 hover:bg-cyan-50 transition-all" title="Ship">
                                  <Truck size={16} />
                                </button>
                              )}
                              {(order.status === 'SHIPPED' || order.status === 'OUT_FOR_DELIVERY') && (
                                <button onClick={() => handleQuickAction(order, 'deliver')}
                                  className="p-2 rounded-xl text-green-500 hover:bg-green-50 transition-all" title="Deliver">
                                  <CheckCircle size={16} />
                                </button>
                              )}
                              {(order.status !== 'DELIVERED' && order.status !== 'CANCELLED') && (
                                <button onClick={() => handleQuickAction(order, 'cancel')}
                                  className="p-2 rounded-xl text-red-400 hover:bg-red-50 transition-all" title="Cancel">
                                  <XCircle size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
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

      {/* Order Detail Modal */}
      <AnimatePresence>
        {detailOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setDetailOrder(null); setSelectedOrder(null); }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl relative z-10 max-h-[85vh] overflow-y-auto">
              <div className="p-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-xl font-black text-gray-900">Order {detailOrder.orderId}</h3>
                <button onClick={() => { setDetailOrder(null); setSelectedOrder(null); }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
              </div>
              {detailLoading ? (
                <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
              ) : orderDetail ? (
                <div className="p-8 space-y-6">
                  {/* Status */}
                  <div className="flex items-center space-x-3">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${(statusConfig[orderDetail.status] || statusConfig.PENDING).color}`}>
                      {(statusConfig[orderDetail.status] || statusConfig.PENDING).label}
                    </span>
                    <span className={`px-3 py-1 rounded text-xs font-bold ${(paymentStatusConfig[orderDetail.paymentStatus] || paymentStatusConfig.PENDING).color}`}>
                      Payment: {(paymentStatusConfig[orderDetail.paymentStatus] || paymentStatusConfig.PENDING).label}
                    </span>
                  </div>

                  {/* Customer */}
                  <div className="bg-gray-50 rounded-2xl p-5 space-y-2">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Customer</h4>
                    <div className="flex items-center space-x-2 text-sm"><User size={16} className="text-gray-400" /><span className="font-semibold">{orderDetail.user?.name || '—'}</span></div>
                    <div className="flex items-center space-x-2 text-sm"><Phone size={16} className="text-gray-400" /><span>{orderDetail.user?.phone || '—'}</span></div>
                    <div className="flex items-center space-x-2 text-sm"><Calendar size={16} className="text-gray-400" /><span>{formatDate(orderDetail.createdAt)}</span></div>
                  </div>

                  {/* Shipping */}
                  {orderDetail.shippingAddress && (
                    <div className="bg-gray-50 rounded-2xl p-5 space-y-2">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Shipping Address</h4>
                      <div className="flex items-start space-x-2 text-sm">
                        <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>{orderDetail.shippingAddress.addressLine1}, {orderDetail.shippingAddress.city}, {orderDetail.shippingAddress.state} — {orderDetail.shippingAddress.pincode}</span>
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Items ({orderDetail.items?.length || 0})</h4>
                    <div className="space-y-3">
                      {orderDetail.items?.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4">
                          <div className="flex items-center space-x-4">
                            {item.imageUrl && <img src={item.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />}
                            <div>
                              <p className="font-bold text-gray-900">{item.productName}</p>
                              <p className="text-sm text-gray-500">{item.variantName || ''} x {item.quantity}</p>
                            </div>
                          </div>
                          <span className="font-bold">{formatCurrency(item.totalPrice)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  <div className="bg-gray-50 rounded-2xl p-5 space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-semibold">{formatCurrency(orderDetail.subtotal)}</span></div>
                    {Number(orderDetail.discountAmount) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="font-semibold text-green-600">-{formatCurrency(orderDetail.discountAmount)}</span></div>}
                    {Number(orderDetail.shippingAmount) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping</span><span className="font-semibold">{formatCurrency(orderDetail.shippingAmount)}</span></div>}
                    {Number(orderDetail.taxAmount) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Tax</span><span className="font-semibold">{formatCurrency(orderDetail.taxAmount)}</span></div>}
                    <div className="flex justify-between text-base pt-2 border-t border-gray-200"><span className="font-bold text-gray-900">Total</span><span className="font-bold text-primary">{formatCurrency(orderDetail.totalAmount)}</span></div>
                  </div>

                  {/* History */}
                  {orderDetail.histories?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Timeline</h4>
                      <div className="space-y-3">
                        {orderDetail.histories.map((h, i) => (
                          <div key={h.id} className="flex items-start space-x-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-primary' : 'bg-gray-300'}`} />
                              {i < orderDetail.histories.length - 1 && <div className="w-0.5 h-8 bg-gray-200" />}
                            </div>
                            <div className="pb-4">
                              <p className="text-sm font-semibold text-gray-900">{h.fromStatus || '—'} → {h.toStatus}</p>
                              <p className="text-xs text-gray-400">{h.note || ''} · {formatDate(h.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Order Modal */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setIsCancelModalOpen(false); setCancelNote(''); }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm relative z-10 p-8 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Cancel Order?</h3>
              <p className="text-gray-500 font-medium mb-4">Order {cancelTarget?.orderId} will be cancelled.</p>
              <textarea
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
                placeholder="Cancellation reason (optional)"
                className="w-full mb-4 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200 resize-none h-24"
              />
              <div className="flex flex-col space-y-3">
                <button disabled={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate({ id: cancelTarget?.id, note: cancelNote })}
                  className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center disabled:opacity-60">
                  {cancelMutation.isPending ? <Loader2 className="animate-spin" /> : 'Yes, Cancel Order'}
                </button>
                <button onClick={() => { setIsCancelModalOpen(false); setCancelNote(''); }}
                  className="w-full py-4 bg-gray-50 text-gray-400 font-bold rounded-2xl hover:bg-gray-100 transition-all">Keep Order</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCommerceOrders;

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  getAdminProductReviews, approveProductReview, rejectProductReview,
  hideProductReview, adminDeleteProductReview
} from '@core/services';
import { TableSkeleton } from '@core/components/ui/Skeleton';
import {
  Search, CheckCircle, XCircle, EyeOff, Trash2, Star, ChevronLeft, ChevronRight,
  MessageSquare, AlertTriangle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useDebounce from '@core/hooks/useDebounce';

const statusBadge = (status) => {
  const map = {
    APPROVED: 'bg-green-50 text-green-600',
    PENDING: 'bg-yellow-50 text-yellow-600',
    REJECTED: 'bg-red-50 text-red-500',
    HIDDEN: 'bg-gray-100 text-gray-500',
  };
  return map[status] || 'bg-gray-50 text-gray-400';
};

const renderStars = (rating) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star key={i} size={14} fill={i < rating ? '#8B0000' : 'none'} stroke={i < rating ? '#8B0000' : '#d1d5db'} />
  ));
};

const AdminProductReviews = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-product-reviews', statusFilter, page],
    queryFn: () => getAdminProductReviews({ status: statusFilter || undefined, page, limit: 20 }),
    placeholderData: keepPreviousData,
  });

  const reviews = data?.reviews || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const approveMutation = useMutation({
    mutationFn: ({ productId, reviewId }) => approveProductReview(productId, reviewId),
    onSuccess: () => queryClient.invalidateQueries(['admin-product-reviews']),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ productId, reviewId }) => rejectProductReview(productId, reviewId),
    onSuccess: () => queryClient.invalidateQueries(['admin-product-reviews']),
  });

  const hideMutation = useMutation({
    mutationFn: ({ productId, reviewId }) => hideProductReview(productId, reviewId),
    onSuccess: () => queryClient.invalidateQueries(['admin-product-reviews']),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ productId, reviewId }) => adminDeleteProductReview(productId, reviewId),
    onSuccess: () => { queryClient.invalidateQueries(['admin-product-reviews']); setIsDeleteModalOpen(false); },
  });

  const filteredReviews = useMemo(() => {
    if (!debouncedSearch) return reviews;
    const q = debouncedSearch.toLowerCase();
    return reviews.filter(r =>
      r.product?.name?.toLowerCase().includes(q) ||
      r.user?.name?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q)
    );
  }, [reviews, debouncedSearch]);

  const handleStatusChange = (review, action) => {
    const payload = { productId: review.productId, reviewId: review.id };
    if (action === 'approve') approveMutation.mutate(payload);
    else if (action === 'reject') rejectMutation.mutate(payload);
    else if (action === 'hide') hideMutation.mutate(payload);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1 max-w-xl relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search by product, user, or comment..."
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
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="HIDDEN">Hidden</option>
          </select>
          <span className="text-sm font-semibold text-gray-400 bg-white px-4 py-3 rounded-[1.5rem] shadow-card">
            {total} total
          </span>
        </div>
      </div>

      {/* Loading / Error / Empty / List */}
      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <div className="bg-red-50 rounded-[2.5rem] p-8 text-center">
          <p className="text-red-500 font-bold">Failed to load product reviews.</p>
          <p className="text-red-400 text-sm mt-2">{error.message}</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] shadow-card p-16 text-center">
          <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-black text-gray-400 mb-2">No Reviews Found</h3>
          <p className="text-gray-400 font-medium">
            {searchQuery || statusFilter ? 'Try adjusting your search or filters.' : 'No product reviews yet.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredReviews.map(review => (
                <motion.div
                  key={review.id}
                  layout initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{review.product?.name || 'Unknown Product'}</p>
                      <p className="text-xs text-gray-500">{review.user?.name || 'Anonymous'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(review.status)}`}>
                      {review.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-0.5 mb-1">
                    {renderStars(review.rating)}
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{review.comment}</p>
                  )}
                  <div className="flex items-center space-x-2 pt-2 border-t border-gray-50">
                    {review.status !== 'APPROVED' && (
                      <button onClick={() => handleStatusChange(review, 'approve')}
                        className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-all" title="Approve">
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {review.status !== 'REJECTED' && (
                      <button onClick={() => handleStatusChange(review, 'reject')}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-all" title="Reject">
                        <XCircle size={16} />
                      </button>
                    )}
                    {review.status !== 'HIDDEN' && (
                      <button onClick={() => handleStatusChange(review, 'hide')}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-all" title="Hide">
                        <EyeOff size={16} />
                      </button>
                    )}
                    <button onClick={() => { setDeleteTarget(review); setIsDeleteModalOpen(true); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-[2.5rem] shadow-card border border-gray-50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Product</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Customer</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Rating</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Review</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence mode="popLayout">
                    {filteredReviews.map(review => (
                      <motion.tr
                        key={review.id}
                        layout initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="hover:bg-gray-50/30 transition-colors group"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center space-x-3">
                            {review.product?.images?.[0] && (
                              <img src={review.product.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            )}
                            <span className="font-bold text-gray-900 text-sm truncate max-w-[180px]">
                              {review.product?.name || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="font-medium text-gray-700">{review.user?.name || 'Anonymous'}</span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center space-x-0.5">{renderStars(review.rating)}</div>
                        </td>
                        <td className="px-6 py-5 max-w-[280px]">
                          <p className="text-sm text-gray-600 truncate">{review.comment || '—'}</p>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge(review.status)}`}>
                            {review.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            {review.status !== 'APPROVED' && (
                              <button onClick={() => handleStatusChange(review, 'approve')}
                                className="p-2 rounded-xl text-green-500 hover:bg-green-50 transition-all" title="Approve">
                                <CheckCircle size={16} />
                              </button>
                            )}
                            {review.status !== 'REJECTED' && (
                              <button onClick={() => handleStatusChange(review, 'reject')}
                                className="p-2 rounded-xl text-red-400 hover:bg-red-50 transition-all" title="Reject">
                                <XCircle size={16} />
                              </button>
                            )}
                            {review.status !== 'HIDDEN' && (
                              <button onClick={() => handleStatusChange(review, 'hide')}
                                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-all" title="Hide">
                                <EyeOff size={16} />
                              </button>
                            )}
                            <button onClick={() => { setDeleteTarget(review); setIsDeleteModalOpen(true); }}
                              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-3 rounded-xl bg-white shadow-card text-gray-500 hover:text-primary disabled:opacity-40 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="font-semibold text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-3 rounded-xl bg-white shadow-card text-gray-500 hover:text-primary disabled:opacity-40 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm relative z-10 p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Delete Review?</h3>
              <p className="text-gray-500 font-medium mb-8">This action is permanent and cannot be reversed.</p>
              <div className="flex flex-col space-y-3">
                <button
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate({ productId: deleteTarget.productId, reviewId: deleteTarget.id })}
                  className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center disabled:opacity-60"
                >
                  {deleteMutation.isPending ? <Loader2 className="animate-spin" /> : 'Yes, Delete Review'}
                </button>
                <button onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full py-4 bg-gray-50 text-gray-400 font-bold rounded-2xl hover:bg-gray-100 transition-all">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProductReviews;

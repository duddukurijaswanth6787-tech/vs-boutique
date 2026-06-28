import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOwnerProducts, getOwnerProductReviews,
  replyToOwnerProductReview, deleteOwnerProductReviewReply
} from '@core/services';
import OwnerLayout from '../../../../components/OwnerLayout';
import { TableSkeleton } from '@core/components/ui/Skeleton';
import {
  Search, Star, ChevronLeft, MessageSquare, Trash2, Loader2,
  AlertTriangle, Send
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

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const OwnerProductReviews = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [expandedProduct, setExpandedProduct] = useState(null);

  const [replyText, setReplyText] = useState({});
  const [sendingReply, setSendingReply] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['owner-products'],
    queryFn: getOwnerProducts,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['owner-product-reviews', expandedProduct],
    queryFn: () => getOwnerProductReviews(expandedProduct, { status: undefined }),
    enabled: !!expandedProduct,
  });

  const replyMutation = useMutation({
    mutationFn: ({ productId, reviewId, data }) => replyToOwnerProductReview(productId, reviewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['owner-product-reviews', expandedProduct]);
      setSendingReply(null);
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: ({ productId, reviewId }) => deleteOwnerProductReviewReply(productId, reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries(['owner-product-reviews', expandedProduct]);
      setIsDeleteModalOpen(false);
    },
  });

  const filteredProducts = useMemo(() => {
    if (!debouncedSearch) return products;
    const q = debouncedSearch.toLowerCase();
    return products.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }, [products, debouncedSearch]);

  const handleReply = async (reviewId) => {
    const reply = replyText[reviewId]?.trim();
    if (!reply || !sendingReply) return;
    replyMutation.mutate({ productId: expandedProduct, reviewId, data: { reply } });
    setReplyText(p => ({ ...p, [reviewId]: '' }));
  };

  return (
    <OwnerLayout title="Product Reviews">
      <div className="space-y-8 pb-20">
        <div className="flex-1 max-w-xl relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-[1.5rem] shadow-card focus:ring-2 focus:ring-primary/10 outline-none transition-all font-semibold"
          />
        </div>

        {productsLoading ? (
          <TableSkeleton />
        ) : productsError ? (
          <div className="bg-red-50 rounded-[2.5rem] p-8 text-center">
            <p className="text-red-500 font-bold">Failed to load products.</p>
            <p className="text-red-400 text-sm mt-2">{productsError.message}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] shadow-card p-16 text-center">
            <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-black text-gray-400 mb-2">No Products Found</h3>
            <p className="text-gray-400 font-medium">
              {searchQuery ? 'Try adjusting your search.' : 'Add products to start receiving reviews.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map(product => {
                const isExpanded = expandedProduct === product.id;
                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-[2.5rem] shadow-card border border-gray-50 overflow-hidden"
                  >
                    <div
                      onClick={() => {
                        if (isExpanded) { setExpandedProduct(null); return; }
                        setExpandedProduct(product.id);
                      }}
                      className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isExpanded ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                          <Star size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.reviewCount || 0} reviews · {product.avgRating ? `${product.avgRating.toFixed(1)} avg` : 'No ratings'}</p>
                        </div>
                      </div>
                      <ChevronLeft size={18} className={`text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : '-rotate-90'}`} />
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-gray-50"
                        >
                          <div className="p-6">
                            {reviewsLoading ? (
                              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
                            ) : reviews.length === 0 ? (
                              <div className="text-center py-8">
                                <MessageSquare size={32} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-gray-400 font-medium">No reviews for this product yet.</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {reviews.map(review => (
                                  <div key={review.id} className="bg-gray-50 rounded-2xl p-5 space-y-3">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <div className="flex items-center space-x-3">
                                          <span className="font-bold text-gray-900 text-sm">{review.user?.name || 'Anonymous'}</span>
                                          <div className="flex items-center space-x-0.5">{renderStars(review.rating)}</div>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(review.createdAt)}</p>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(review.status)}`}>
                                        {review.status}
                                      </span>
                                    </div>

                                    {review.comment && (
                                      <p className="text-sm text-gray-700">{review.comment}</p>
                                    )}

                                    {review.reply && (
                                      <div className="ml-4 pl-4 border-l-2 border-primary/30 bg-white rounded-xl p-3">
                                        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Your Reply</p>
                                        <p className="text-sm text-gray-700">{review.reply}</p>
                                        <button
                                          onClick={() => { setDeleteTarget(review); setIsDeleteModalOpen(true); }}
                                          className="mt-2 text-xs text-red-400 hover:text-red-500 font-semibold flex items-center space-x-1"
                                        >
                                          <Trash2 size={12} /> <span>Delete reply</span>
                                        </button>
                                      </div>
                                    )}

                                    {!review.reply && (
                                      <div className="flex items-start space-x-2">
                                        <input
                                          value={replyText[review.id] || ''}
                                          onChange={e => setReplyText(p => ({ ...p, [review.id]: e.target.value }))}
                                          placeholder="Write a reply..."
                                          className="flex-1 px-4 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/10 text-sm font-semibold outline-none"
                                        />
                                        <button
                                          onClick={() => {
                                            setSendingReply(review.id);
                                            handleReply(review.id);
                                          }}
                                          disabled={!replyText[review.id]?.trim() || replyMutation.isPending}
                                          className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all disabled:opacity-60"
                                        >
                                          {replyMutation.isPending && sendingReply === review.id
                                            ? <Loader2 size={16} className="animate-spin" />
                                            : <Send size={16} />}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

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
                <h3 className="text-2xl font-black text-gray-900 mb-2">Delete Reply?</h3>
                <p className="text-gray-500 font-medium mb-8">This action is permanent and cannot be undone.</p>
                <div className="flex flex-col space-y-3">
                  <button
                    disabled={deleteReplyMutation.isPending}
                    onClick={() => deleteReplyMutation.mutate({ productId: expandedProduct, reviewId: deleteTarget.id })}
                    className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center disabled:opacity-60"
                  >
                    {deleteReplyMutation.isPending ? <Loader2 className="animate-spin" /> : 'Yes, Delete Reply'}
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
    </OwnerLayout>
  );
};

export default OwnerProductReviews;

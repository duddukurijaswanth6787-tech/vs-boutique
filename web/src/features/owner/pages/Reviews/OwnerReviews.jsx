import React, { useState, useEffect } from 'react';
import OwnerLayout from '../../../../components/OwnerLayout';
import { Star, MessageSquare, ShieldAlert, Heart, Calendar, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getOwnerReviews, replyToReview } from '@core/services';

const OwnerReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Reply operations
  const [replyToId, setReplyToId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      const res = await getOwnerReviews(params);
      if (res?.success) {
        setReviews(res.data);
        setTotal(res.total);
        setPages(res.pages);
      }
    } catch (err) {
      console.error('Error fetching boutique reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page]);

  const handleReplySubmit = async (e, reviewId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      const res = await replyToReview(reviewId, replyText);
      if (res?.success) {
        setReplyToId(null);
        setReplyText('');
        fetchReviews();
      }
    } catch (err) {
      console.error('Error replying to review:', err);
      alert(err.response?.data?.message || 'Failed to submit response');
    }
  };

  const renderStars = (rating, size = 14) => {
    return (
      <div className="flex space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            size={size} 
            className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} 
          />
        ))}
      </div>
    );
  };

  return (
    <OwnerLayout title="Customer Reviews">
      <div className="space-y-6">
        <div>
          <p className="text-gray-500 font-semibold text-sm">
            Read and respond to client reviews. Recalculates boutique rating score automatically.
          </p>
        </div>

        {/* Reviews Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-12 text-center text-gray-400 font-bold border border-gray-50 rounded-[2rem] shadow-sm">
              Loading client feedback...
            </div>
          ) : reviews.length > 0 ? (
            reviews.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-gray-900 text-base">{r.user?.name}</span>
                    <span className="text-gray-400 text-xs font-semibold">
                      on {new Date(r.createdAt || 0).toLocaleDateString()}
                    </span>
                    {r.verifiedPurchase && (
                      <span className="bg-green-50 text-green-700 text-[10px] font-black px-2 py-0.5 rounded border border-green-100 uppercase tracking-widest">
                        Verified Purchase
                      </span>
                    )}
                  </div>

                  {/* Multi-Dimensional Ratings Box */}
                  <div className="flex flex-wrap items-center gap-4 py-1">
                    <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-100/50 px-2.5 py-1 rounded-lg">
                      <span className="text-xs font-black text-amber-700">Overall</span>
                      {renderStars(r.rating)}
                    </div>
                    {/* Dimension details */}
                    {[
                      { label: 'Stitching', val: r.ratingStitching },
                      { label: 'Fit Accuracy', val: r.ratingMeasurement },
                      { label: 'Delivery', val: r.ratingDelivery },
                      { label: 'Communication', val: r.ratingCommunication },
                      { label: 'Value', val: r.ratingValue }
                    ].map((d, i) => d.val && (
                      <div key={i} className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100 flex items-center space-x-1">
                        <span>{d.label}:</span>
                        <span className="text-gray-700 font-extrabold">{d.val}/5</span>
                      </div>
                    ))}
                  </div>

                  {/* Comment */}
                  <p className="text-gray-700 text-sm md:text-base font-medium leading-relaxed">
                    {r.comment || <span className="text-gray-400 italic">No comment provided</span>}
                  </p>

                  {/* Images row */}
                  {r.reviewImages && r.reviewImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {r.reviewImages.map((img, idx) => (
                        <div 
                          key={idx} 
                          className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100"
                        >
                          <img 
                            src={img} 
                            alt={`Review ${idx + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply timeline / response */}
                  <div className="pt-2">
                    {r.reply ? (
                      <div className="bg-gray-50 border-l-4 border-primary p-4 rounded-r-xl space-y-1">
                        <p className="text-xs font-bold text-primary uppercase tracking-wider">Your Response</p>
                        <p className="text-sm text-gray-700 font-medium italic">"{r.reply}"</p>
                      </div>
                    ) : replyToId === r.id ? (
                      <form onSubmit={(e) => handleReplySubmit(e, r.id)} className="space-y-2 mt-2">
                        <textarea
                          rows={2}
                          required
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write Response to review..."
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white font-bold"
                        />
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-primary text-white text-xs font-black uppercase rounded-lg"
                          >
                            Submit Response
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReplyToId(null);
                              setReplyText('');
                            }}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs font-black uppercase rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => {
                          setReplyToId(r.id);
                          setReplyText('');
                        }}
                        className="flex items-center space-x-1.5 px-3.5 py-2 bg-primary/5 hover:bg-primary text-primary hover:text-white font-extrabold rounded-xl text-xs transition-all"
                      >
                        <MessageSquare size={13} className="mr-1" />
                        <span>Reply Feedback</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-white p-12 text-center text-gray-400 font-bold border border-gray-50 rounded-[2rem] shadow-sm">
              No customer reviews received yet.
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center space-x-2 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-gray-50 transition-all bg-white"
            >
              Prev
            </button>
            <span className="px-4 py-2 text-xs font-bold text-gray-500">
              Page {page} of {pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, pages))}
              disabled={page === pages}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-gray-50 transition-all bg-white"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
};

export default OwnerReviews;

import React, { useState, useEffect } from 'react';
import { 
  Star, ShieldAlert, CheckCircle, XCircle, Search, Filter, 
  MessageSquare, Trash2, ShieldCheck, AlertTriangle, ExternalLink, Eye, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getAllReviews, getReviewStats, moderateReview, replyToReview 
} from '@core/services';

const MODERATION_BADGES = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  APPROVED: 'bg-green-50 text-green-700 border-green-100',
  REJECTED: 'bg-red-50 text-red-700 border-red-100',
  FLAGGED: 'bg-orange-50 text-orange-700 border-orange-100'
};

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalApproved: 0,
    averageOverall: 0,
    averageStitching: 0,
    averageMeasurement: 0,
    averageDelivery: 0,
    averageCommunication: 0,
    averageValue: 0,
    starCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [suspiciousFilter, setSuspiciousFilter] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modal/Lightbox for review images
  const [activeImage, setActiveImage] = useState(null);
  // Owner reply state
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const fetchStats = async () => {
    try {
      const res = await getReviewStats();
      if (res?.success) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Error fetching review stats:', err);
    }
  };

  const fetchReviewsList = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 8,
        ...(statusFilter && { status: statusFilter }),
        ...(suspiciousFilter && { isSuspicious: 'true' })
      };
      const res = await getAllReviews(params);
      if (res?.success) {
        setReviews(res.data);
        setTotal(res.total);
        setPages(res.pages);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchReviewsList();
  }, [page, statusFilter, suspiciousFilter]);

  const handleModeration = async (reviewId, newStatus) => {
    try {
      const res = await moderateReview(reviewId, newStatus);
      if (res?.success) {
        fetchReviewsList();
        fetchStats();
      }
    } catch (err) {
      console.error('Error moderating review:', err);
      alert(err.response?.data?.message || 'Moderation action failed');
    }
  };

  const handleReplySubmit = async (e, reviewId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      const res = await replyToReview(reviewId, replyText);
      if (res?.success) {
        setReplyingToId(null);
        setReplyText('');
        fetchReviewsList();
      }
    } catch (err) {
      console.error('Error replying to review:', err);
      alert(err.response?.data?.message || 'Failed to submit response');
    }
  };

  const renderStars = (rating, size = 16) => {
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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl md:text-3xl font-black text-gray-900">Reviews & Ratings Moderation</h2>
        <p className="text-gray-500 mt-1 font-medium text-sm md:text-base">
          Moderate customer reviews, flag suspicious bot spam, and track quality aggregates.
        </p>
      </div>

      {/* Analytics widgets & dimensional ratings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall ratings card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-50 shadow-card flex items-center justify-between col-span-1">
          <div className="space-y-1">
            <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Overall Customer Score</h4>
            <p className="text-5xl font-black text-amber-500 flex items-baseline">
              {stats.averageOverall} <span className="text-base font-bold text-gray-400 ml-1">/ 5.0</span>
            </p>
            <div className="pt-2">
              {renderStars(Math.round(stats.averageOverall), 20)}
            </div>
            <p className="text-xs text-gray-400 font-semibold pt-1">Based on {stats.totalApproved} approved reviews</p>
          </div>
          
          <div className="h-28 w-px bg-gray-100 hidden md:block"></div>

          {/* Star progressive breakdowns */}
          <div className="flex-1 max-w-[180px] space-y-1.5 hidden md:block ml-6">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.starCounts[star] || 0;
              const percentage = stats.totalApproved > 0 ? (count / stats.totalApproved) * 100 : 0;
              return (
                <div key={star} className="flex items-center text-xs text-gray-500 font-semibold space-x-2">
                  <span className="w-3">{star}</span>
                  <Star size={10} className="fill-amber-400 text-amber-400" />
                  <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-5 text-right text-gray-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dimensional ratings breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-gray-50 shadow-card col-span-1 lg:col-span-2">
          <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Stitching & Delivery Dimensions</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Stitching Quality', val: stats.averageStitching, color: 'from-blue-500 to-indigo-500' },
              { label: 'Measurement Accuracy', val: stats.averageMeasurement, color: 'from-emerald-500 to-teal-500' },
              { label: 'Delivery Speed', val: stats.averageDelivery, color: 'from-amber-500 to-orange-500' },
              { label: 'Communication', val: stats.averageCommunication, color: 'from-purple-500 to-pink-500' },
              { label: 'Value For Money', val: stats.averageValue, color: 'from-rose-500 to-red-500' }
            ].map((dim, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-between h-28">
                <span className="text-gray-500 text-xs font-bold leading-tight">{dim.label}</span>
                <div>
                  <p className="text-2xl font-black text-gray-800">{dim.val}</p>
                  <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className="h-full bg-gradient-to-r" 
                      style={{ 
                        width: `${(dim.val / 5) * 100}%`,
                        backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Queue */}
      <div className="bg-white p-4 rounded-2xl shadow-card border border-gray-50 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'All Reviews', value: '' },
            { label: 'Pending Moderation', value: 'PENDING' },
            { label: 'Approved Feed', value: 'APPROVED' },
            { label: 'Flagged Spam', value: 'FLAGGED' },
            { label: 'Rejected', value: 'REJECTED' }
          ].map((status) => (
            <button
              key={status.value}
              onClick={() => {
                setStatusFilter(status.value);
                setPage(1);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                statusFilter === status.value
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/10'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        <label className="flex items-center space-x-2.5 bg-red-50/50 border border-red-100/50 px-4 py-2 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={suspiciousFilter}
            onChange={(e) => {
              setSuspiciousFilter(e.target.checked);
              setPage(1);
            }}
            className="w-4.5 h-4.5 text-red-600 rounded bg-white border-red-300 focus:ring-red-500 focus:ring-2"
          />
          <ShieldAlert size={16} className="text-red-500" />
          <span className="text-xs font-extrabold text-red-700">Suspicious Only</span>
        </label>
      </div>

      {/* Review Queue Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 text-center text-gray-400 font-bold border border-gray-50 rounded-2xl shadow-card">
            Loading customer responses...
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((r) => (
            <motion.div 
              key={r.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white p-6 rounded-2xl shadow-card border transition-all ${
                r.isSuspicious ? 'border-red-200 bg-red-50/10' : 'border-gray-50 hover:border-gray-100'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* User & Review Details */}
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-gray-900 text-base">{r.user?.name}</span>
                    <span className="text-gray-400 text-xs font-semibold">on {r.boutique?.name}</span>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${MODERATION_BADGES[r.moderationStatus]}`}>
                      {r.moderationStatus}
                    </span>
                    {r.verifiedPurchase && (
                      <span className="bg-green-100 text-green-800 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider border border-green-200">
                        Verified Purchase
                      </span>
                    )}
                  </div>

                  {/* Multi-Dimensional Ratings Box */}
                  <div className="flex flex-wrap items-center gap-4 py-1">
                    <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-100/50 px-2.5 py-1 rounded-lg">
                      <span className="text-xs font-black text-amber-700">Overall</span>
                      {renderStars(r.rating, 13)}
                    </div>
                    {/* Dimension details */}
                    {[
                      { label: 'Stitch', val: r.ratingStitching },
                      { label: 'Fit', val: r.ratingMeasurement },
                      { label: 'Delivery', val: r.ratingDelivery },
                      { label: 'Comm', val: r.ratingCommunication },
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
                          onClick={() => setActiveImage(img)}
                          className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100 cursor-zoom-in group/img"
                        >
                          <img 
                            src={img} 
                            alt={`Review ${idx + 1}`} 
                            className="w-full h-full object-cover transition-transform group-hover/img:scale-110 duration-300"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all">
                            <Eye size={14} className="text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suspicious spam guard box */}
                  {r.isSuspicious && (
                    <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start space-x-3 text-red-800">
                      <AlertTriangle size={18} className="mt-0.5 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-red-700">Fraud Flagged by Antigravity Spam Guard</p>
                        <p className="text-sm font-semibold mt-1">{r.suspiciousReason}</p>
                        <p className="text-[10px] text-red-500 font-bold mt-0.5">Submitter IP Address: {r.ipAddress}</p>
                      </div>
                    </div>
                  )}

                  {/* User Reports count indicator */}
                  {r.reportCount > 0 && (
                    <p className="text-xs font-bold text-orange-600 flex items-center space-x-1">
                      <AlertTriangle size={14} />
                      <span>Flagged by customers: Reported {r.reportCount} times</span>
                    </p>
                  )}

                  {/* Reply timeline / response */}
                  <div className="pt-2">
                    {r.reply ? (
                      <div className="bg-gray-50 border-l-4 border-primary p-4 rounded-r-xl space-y-1">
                        <p className="text-xs font-bold text-primary uppercase tracking-wider">Boutique Owner Response</p>
                        <p className="text-sm text-gray-700 font-medium italic">"{r.reply}"</p>
                      </div>
                    ) : replyingToId === r.id ? (
                      <form onSubmit={(e) => handleReplySubmit(e, r.id)} className="space-y-2 mt-2">
                        <textarea
                          rows={2}
                          required
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write Response to review..."
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                        />
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg"
                          >
                            Submit Reply
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingToId(null);
                              setReplyText('');
                            }}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs font-bold rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => {
                          setReplyingToId(r.id);
                          setReplyText('');
                        }}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-50 hover:bg-primary/5 hover:text-primary text-gray-500 font-bold rounded-lg text-xs transition-all border border-gray-100"
                      >
                        <MessageSquare size={13} />
                        <span>Respond to Review</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Moderation Actions Column */}
                <div className="flex flex-row lg:flex-col gap-2 justify-end mt-4 lg:mt-0 lg:border-l lg:border-gray-50 lg:pl-6">
                  <button
                    onClick={() => handleModeration(r.id, 'APPROVED')}
                    className="flex-1 lg:w-40 flex items-center justify-center space-x-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    <ShieldCheck size={14} />
                    <span>Approve Review</span>
                  </button>
                  <button
                    onClick={() => handleModeration(r.id, 'FLAGGED')}
                    className="flex-1 lg:w-40 flex items-center justify-center space-x-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    <AlertTriangle size={14} />
                    <span>Flag Spam</span>
                  </button>
                  <button
                    onClick={() => handleModeration(r.id, 'REJECTED')}
                    className="flex-1 lg:w-40 flex items-center justify-center space-x-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    <XCircle size={14} />
                    <span>Reject / Delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white p-12 text-center text-gray-400 font-bold border border-gray-50 rounded-2xl shadow-card">
            No customer reviews found matching standard criteria.
          </div>
        )}
      </div>

      {/* Pagination Controls */}
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

      {/* Image Lightbox Modal */}
      {activeImage && (
        <div 
          onClick={() => setActiveImage(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[85vh] p-2">
            <img 
              src={activeImage} 
              alt="Expanded view" 
              className="max-w-full max-h-[80vh] rounded-2xl border border-white/10 object-contain shadow-2xl" 
            />
            <button 
              onClick={() => setActiveImage(null)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2.5 rounded-full text-white backdrop-blur transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;

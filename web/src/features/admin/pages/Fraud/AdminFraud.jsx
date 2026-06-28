import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, AlertTriangle, ShieldCheck, UserX, Search, ChevronLeft, 
  ChevronRight, Loader2, Star, CheckCircle, RefreshCw, XCircle, Ban
} from 'lucide-react';
import { getAdminFraud, moderateReview, toggleCustomerBlock } from '@core/services';

const AdminFraud = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Moderation / Block Modal State
  const [blockUser, setBlockUser] = useState(null); // { id, name }
  const [blockReason, setBlockReason] = useState('');

  // Pagination & Search
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewPage, setReviewPage] = useState(1);
  const reviewsPerPage = 5;

  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketPage, setTicketPage] = useState(1);
  const ticketsPerPage = 5;

  const fetchFraudMetrics = async () => {
    try {
      const res = await getAdminFraud();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Error fetching fraud details:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchFraudMetrics().finally(() => setLoading(false));
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchFraudMetrics();
    setRefreshing(false);
  };

  // Review Moderation Handlers
  const handleReviewModerate = async (reviewId, status) => {
    setSubmitting(true);
    try {
      // Call backend moderate endpoint
      await moderateReview(reviewId, status);
      alert(`Review has been successfully set to ${status}`);
      await fetchFraudMetrics();
    } catch (err) {
      alert(err.response?.data?.message || 'Moderation action failed');
    } finally {
      setSubmitting(false);
    }
  };

  // User Suspension Handler
  const handleUserBlock = async () => {
    if (!blockUser || !blockReason) return;
    setSubmitting(true);
    try {
      await toggleCustomerBlock(blockUser.id, 'BLOCKED', blockReason);
      alert(`User ${blockUser.name} has been successfully suspended.`);
      setBlockUser(null);
      setBlockReason('');
      await fetchFraudMetrics();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to suspend account');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Running Spammer Audit Heuristics...</p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {
    highRiskTicketsCount: 0,
    suspiciousReviewsCount: 0,
    averageFraudScore: 0,
    excessiveTicketFlagsCount: 0
  };

  const reviews = data?.suspiciousReviews || [];
  const tickets = data?.highRiskTickets || [];

  // Filter lists
  const filteredReviews = reviews.filter(r => 
    (r.comment || '').toLowerCase().includes(reviewSearch.toLowerCase()) ||
    (r.suspiciousReason || '').toLowerCase().includes(reviewSearch.toLowerCase()) ||
    (r.user?.name || '').toLowerCase().includes(reviewSearch.toLowerCase()) ||
    (r.boutique?.name || '').toLowerCase().includes(reviewSearch.toLowerCase())
  );

  const filteredTickets = tickets.filter(t => 
    (t.subject || '').toLowerCase().includes(ticketSearch.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(ticketSearch.toLowerCase()) ||
    (t.user?.name || '').toLowerCase().includes(ticketSearch.toLowerCase())
  );

  // Pagination calculations
  const totalReviewPages = Math.ceil(filteredReviews.length / reviewsPerPage) || 1;
  const paginatedReviews = filteredReviews.slice((reviewPage - 1) * reviewsPerPage, reviewPage * reviewsPerPage);

  const totalTicketPages = Math.ceil(filteredTickets.length / ticketsPerPage) || 1;
  const paginatedTickets = filteredTickets.slice((ticketPage - 1) * ticketsPerPage, ticketPage * ticketsPerPage);

  return (
    <div className="space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Fraud & Spam Moderation</h2>
          <p className="text-gray-500 mt-1 font-medium">Flagged review logs, support ticket risk indexes, and customer account overrides.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-3.5 bg-white border border-gray-100 rounded-2xl text-xs font-black text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>FORCE SCAN</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'High-risk Tickets', value: kpis.highRiskTicketsCount, icon: ShieldAlert, color: kpis.highRiskTicketsCount > 0 ? 'text-rose-600 bg-rose-50 border-rose-100 animate-pulse' : 'text-gray-600 bg-gray-50 border-gray-100', desc: "Support requests exceeding threshold" },
          { label: 'Suspicious Reviews', value: kpis.suspiciousReviewsCount, icon: AlertTriangle, color: kpis.suspiciousReviewsCount > 0 ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-gray-600 bg-gray-50 border-gray-100', desc: "Flagged by automatic spam filter" },
          { label: 'Average Fraud Index', value: `${kpis.averageFraudScore}%`, icon: ShieldCheck, color: 'text-blue-600 bg-blue-50 border-blue-100', desc: "Ticket NLP heuristic spam score" },
          { label: 'Excessive Spammers', value: kpis.excessiveTicketFlagsCount, icon: Ban, color: kpis.excessiveTicketFlagsCount > 0 ? 'text-red-600 bg-red-50 border-red-100' : 'text-gray-600 bg-gray-50 border-gray-100', desc: "Users with > 5 tickets in 24 hours" }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm flex items-start gap-5">
              <div className={`p-4 rounded-2xl border ${card.color} shrink-0`}>
                <Icon size={24} />
              </div>
              <div className="space-y-1.5 min-w-0">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{card.label}</span>
                <span className="text-2xl font-black text-gray-900 block truncate">{card.value}</span>
                <span className="text-xs font-medium text-gray-400 block leading-tight">{card.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Suspicious Spam Reviews Ledger */}
        <div className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-50 pb-6">
            <div>
              <h3 className="text-xl font-black text-gray-900">Suspicious Reviews</h3>
              <p className="text-xs text-gray-400 mt-1">Comments flagged for potential keyword spam, competitor attack, or review-bombing.</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              placeholder="Search spam reviews..." 
              value={reviewSearch}
              onChange={e => { setReviewSearch(e.target.value); setReviewPage(1); }}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          <div className="space-y-6">
            {paginatedReviews.length > 0 ? (
              paginatedReviews.map((r) => (
                <div key={r.id} className="p-5 border border-gray-100 rounded-2xl space-y-4 hover:border-gray-200 transition-all">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h4 className="text-xs font-black text-gray-800">
                        {r.user?.name || 'Guest User'} <span className="font-medium text-gray-400">on</span> {r.boutique?.name || 'Unknown Store'}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">{new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-500 px-2.5 py-1 rounded-xl text-xs font-bold">
                      <Star size={12} fill="currentColor" />
                      <span>{r.rating}/5 Rating</span>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                    <p className="text-xs text-gray-700 italic">"{r.comment}"</p>
                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle size={11} /> Flagged Reason: {r.suspiciousReason || 'NLP Spam detection'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      disabled={submitting}
                      onClick={() => handleReviewModerate(r.id, 'APPROVED')}
                      className="flex-1 py-2.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Approve Review
                    </button>
                    <button
                      disabled={submitting}
                      onClick={() => handleReviewModerate(r.id, 'REJECTED')}
                      className="flex-1 py-2.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Delete Review
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-12 text-gray-400 font-bold text-xs">No spam reviews currently flagged.</p>
            )}
          </div>

          {/* Pagination */}
          {totalReviewPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-50 pt-6">
              <span className="text-xs font-semibold text-gray-400">
                Page {reviewPage} of {totalReviewPages} ({filteredReviews.length} reviews)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={reviewPage === 1}
                  onClick={() => setReviewPage(prev => Math.max(1, prev - 1))}
                  className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={reviewPage === totalReviewPages}
                  onClick={() => setReviewPage(prev => Math.min(totalReviewPages, prev + 1))}
                  className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* High Risk Support Tickets Ledger */}
        <div className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-50 pb-6">
            <div>
              <h3 className="text-xl font-black text-gray-900">High Risk Ticket Queue</h3>
              <p className="text-xs text-gray-400 mt-1">Active requests with high NLP spam scores, missing orders, or suspicious behavior flags.</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              placeholder="Search high-risk tickets..." 
              value={ticketSearch}
              onChange={e => { setTicketSearch(e.target.value); setTicketPage(1); }}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          <div className="space-y-6">
            {paginatedTickets.length > 0 ? (
              paginatedTickets.map((t) => (
                <div key={t.id} className="p-5 border border-gray-100 rounded-2xl space-y-4 hover:border-gray-200 transition-all">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h4 className="text-xs font-black text-gray-800">
                        {t.subject}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                        By {t.user?.name || 'Customer'} · Ticket ID: {t.id.substring(0, 8)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl ${
                        t.fraudScore >= 75 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        Spam score: {t.fraudScore}%
                      </span>
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-rose-50 text-rose-600 rounded-xl">
                        {t.riskLevel} RISK
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed italic">
                    "{t.description}"
                  </p>

                  <div className="flex items-center justify-between gap-4 border-t border-gray-50 pt-4 flex-wrap text-xs">
                    <div className="text-[10px] font-semibold text-gray-400">
                      Escalation level: <span className="font-bold text-gray-600 uppercase">{t.escalationLevel}</span>
                    </div>
                    <button
                      disabled={submitting}
                      onClick={() => setBlockUser({ id: t.userId, name: t.user?.name || 'Customer' })}
                      className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                    >
                      <UserX size={12} />
                      <span>Block Spammer Account</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-12 text-gray-400 font-bold text-xs">No high risk tickets currently open.</p>
            )}
          </div>

          {/* Pagination */}
          {totalTicketPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-50 pt-6">
              <span className="text-xs font-semibold text-gray-400">
                Page {ticketPage} of {totalTicketPages} ({filteredTickets.length} tickets)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={ticketPage === 1}
                  onClick={() => setTicketPage(prev => Math.max(1, prev - 1))}
                  className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={ticketPage === totalTicketPages}
                  onClick={() => setTicketPage(prev => Math.min(totalTicketPages, prev + 1))}
                  className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Account Suspension Modal */}
      {blockUser && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2.5rem] border max-w-md w-full space-y-6 shadow-2xl relative">
            <div>
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                <Ban className="text-red-500" size={20} /> Suspend Client Account
              </h3>
              <p className="text-xs text-gray-400 mt-1.5">
                Block <span className="font-bold text-gray-600">{blockUser.name}</span> from booking measurements, placing orders, or raising tickets.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason for suspension</label>
              <textarea
                rows="3"
                value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
                placeholder="Describe spam/fraud indicators..."
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={submitting}
                onClick={() => { setBlockUser(null); setBlockReason(''); }}
                className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-black text-gray-500 uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                disabled={submitting || !blockReason}
                onClick={handleUserBlock}
                className="flex-1 py-3 bg-red-600 text-white hover:bg-red-700 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
              >
                Confirm Block
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminFraud;

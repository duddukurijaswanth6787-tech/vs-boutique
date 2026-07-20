'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useReviews, useApproveReview, useRejectReview } from '@/features/reviews/review.hooks';
import { SectionLoader, PageError, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { Star, Check, X, ShieldAlert, User, Calendar, ThumbsUp } from 'lucide-react';
import { formatDate } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';

export default function ReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // URL States
  const pageParam = parseInt(searchParams.get('page') || '1');
  const ratingFilter = searchParams.get('rating') || '';
  const statusFilter = searchParams.get('status') || 'PENDING'; // Default to PENDING for moderation efficiency

  // Queries
  const { data: listData, isLoading, isError, refetch } = useReviews({
    page: pageParam,
    limit: 10,
    rating: ratingFilter ? parseInt(ratingFilter) : undefined,
    status: statusFilter || undefined,
  });

  const approveMut = useApproveReview();
  const rejectMut = useRejectReview();

  const updateQuery = (key: string, value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value.toString());
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/admin/customers/reviews?${params.toString()}`);
  };

  const handleApprove = async (id: string) => {
    try {
      await approveMut.mutateAsync(id);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectMut.mutateAsync(id);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const isEditor = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Reviews Moderation</h1>
          <p className="text-xs text-neutral-400 mt-1">Moderate customer product reviews, filter ratings, and approve or reject submissions.</p>
        </div>
      </div>

      {/* Filter and Tab Options */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Moderation status Tabs */}
        <div className="flex bg-neutral-100 p-1 rounded-xl">
          <button
            onClick={() => updateQuery('status', 'PENDING')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition
              ${statusFilter === 'PENDING' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}
            `}
          >
            Pending Approval
          </button>
          <button
            onClick={() => updateQuery('status', 'APPROVED')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition
              ${statusFilter === 'APPROVED' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}
            `}
          >
            Approved
          </button>
          <button
            onClick={() => updateQuery('status', 'REJECTED')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition
              ${statusFilter === 'REJECTED' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}
            `}
          >
            Rejected
          </button>
        </div>

        <div className="flex gap-3 w-full md:w-auto justify-end">
          <select
            value={ratingFilter}
            onChange={(e) => updateQuery('rating', e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Reviews Content Grid */}
      {isLoading ? (
        <SectionLoader message="Retrieving user feedback queue..." />
      ) : isError ? (
        <PageError title="Connection Failure" message="Could not fetch reviews from server." retry={refetch} />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {listData?.data?.map((review) => (
              <div
                key={review.id}
                className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm hover:border-neutral-300 transition flex flex-col md:flex-row gap-5 items-start justify-between"
              >
                <div className="space-y-2.5 w-full md:max-w-2xl">
                  {/* Rating star badges */}
                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400' : 'text-neutral-200'}`}
                        />
                      ))}
                    </div>
                    <span className="text-2xs font-semibold text-neutral-500 uppercase tracking-wider font-mono">
                      Rating: {review.rating}/5
                    </span>
                    {review.isVerifiedPurchase && (
                      <span className="text-[9px] bg-green-50 text-green-700 border border-green-100 font-bold px-1.5 py-0.5 rounded">
                        Verified Buyer
                      </span>
                    )}
                  </div>

                  {/* Title & Comment */}
                  <div>
                    {review.title && <h3 className="text-xs font-bold text-neutral-900">{review.title}</h3>}
                    <p className="text-xs text-neutral-600 leading-relaxed mt-1 whitespace-pre-wrap">{review.comment || 'No review message provided.'}</p>
                  </div>

                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2.5 overflow-x-auto py-1">
                      {review.images.map((img) => (
                        <img
                          key={img.id}
                          src={img.url}
                          alt="Review attachment"
                          className="w-20 h-20 object-cover rounded-lg border border-neutral-200 shadow-sm shrink-0"
                        />
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-neutral-400 font-medium">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Client ID: {review.customerId}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {formatDate(review.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5 text-neutral-350" /> Helpful count: {review.helpfulCount}
                    </span>
                  </div>
                </div>

                {/* Approvals action triggers */}
                {isEditor && review.status === 'PENDING' && (
                  <div className="flex md:flex-col gap-2 w-full md:w-auto shrink-0 justify-end">
                    <button
                      disabled={approveMut.isPending}
                      onClick={() => handleApprove(review.id)}
                      className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-3.5 rounded-xl text-2xs flex items-center gap-1.5 shadow-sm transition justify-center w-full md:w-28"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      disabled={rejectMut.isPending}
                      onClick={() => handleReject(review.id)}
                      className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-red-600 hover:text-red-750 font-bold py-2 px-3.5 rounded-xl text-2xs flex items-center gap-1.5 shadow-sm transition justify-center w-full md:w-28"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}

                {/* Static indicator for already moderated reviews */}
                {review.status !== 'PENDING' && (
                  <div className="shrink-0 pt-2 w-full md:w-auto text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase
                      ${review.status === 'APPROVED' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}
                    `}>
                      {review.status}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {(!listData?.data || listData.data.length === 0) && (
              <div className="bg-white p-12 text-center border border-neutral-200 rounded-2xl shadow-sm text-neutral-400 font-medium">
                No reviews found matching filters.
              </div>
            )}
          </div>

          {/* Pagination */}
          {listData?.meta && listData.meta.totalPages > 1 && (
            <div className="bg-white p-4 border border-neutral-200 rounded-2xl shadow-sm flex justify-between items-center">
              <span className="text-xs text-neutral-500 font-medium">
                Page {listData.meta.page} of {listData.meta.totalPages} (Total: {listData.meta.total})
              </span>
              <div className="flex gap-2">
                <button
                  disabled={!listData.meta.hasPrevious}
                  onClick={() => updateQuery('page', pageParam - 1)}
                  className="px-3 py-1.5 border border-neutral-200 rounded-lg bg-white text-xs font-semibold"
                >
                  Previous
                </button>
                <button
                  disabled={!listData.meta.hasNext}
                  onClick={() => updateQuery('page', pageParam + 1)}
                  className="px-3 py-1.5 border border-neutral-200 rounded-lg bg-white text-xs font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

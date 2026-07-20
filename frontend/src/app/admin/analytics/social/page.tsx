'use client';

import React from 'react';
import { useSocialAnalyticsSummary } from '@/features/analytics';
import { Heart, MessageSquare, Share2, Eye, Play, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';

export default function SocialAnalyticsPage() {
  const { data, isLoading, error, refetch } = useSocialAnalyticsSummary();

  if (isLoading) return <SectionLoader message="Loading social engagement metrics..." />;
  if (error) return <PageError title="Load Failure" message="Could not fetch social summary metrics." retry={refetch} />;

  const stats = data || {
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalSaves: 0,
    totalShares: 0,
    totalViews: 0,
    totalPlays: 0,
    topPosts: [],
  };

  const cards = [
    { title: 'Total Posts', value: stats.totalPosts, icon: Sparkles },
    { title: 'Total Likes', value: stats.totalLikes, icon: Heart },
    { title: 'Comments', value: stats.totalComments, icon: MessageSquare },
    { title: 'Saves', value: stats.totalSaves, icon: Share2 },
    { title: 'Views', value: stats.totalViews + stats.totalPlays, icon: Eye },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Social Commerce Analytics</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Monitor social post views, reels plays, and user interaction engagement.
        </p>
      </div>

      {/* KPI Panel */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{card.title}</span>
              <div className="flex items-center justify-between mt-3">
                <h3 className="text-xl font-bold text-neutral-900">{card.value}</h3>
                <Icon className="h-4 w-4 text-neutral-450" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Performing Posts Table */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col">
        <h3 className="text-sm font-bold text-neutral-900 mb-4">Top Performing Posts</h3>
        {stats.topPosts && stats.topPosts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider">
                  <th className="py-2">Caption Excerpt</th>
                  <th className="py-2">Type</th>
                  <th className="py-2"><Heart className="h-3 w-3 inline mr-1" /> Likes</th>
                  <th className="py-2"><MessageSquare className="h-3 w-3 inline mr-1" /> Comments</th>
                  <th className="py-2"><Share2 className="h-3 w-3 inline mr-1" /> Saves</th>
                  <th className="py-2"><Eye className="h-3 w-3 inline mr-1" /> Views</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-neutral-700">
                {stats.topPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-neutral-50/50 transition">
                    <td className="py-3 font-semibold text-neutral-900 truncate max-w-[240px]">
                      {post.caption || 'No caption'}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-100 text-neutral-700">
                        {post.contentType}
                      </span>
                    </td>
                    <td className="py-3 font-medium">{post.likeCount}</td>
                    <td className="py-3 font-medium">{post.commentCount}</td>
                    <td className="py-3 font-medium">{post.saveCount}</td>
                    <td className="py-3 font-medium">{post.viewCount + post.playCount}</td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/social`}
                        className="text-[11px] font-bold text-neutral-950 hover:underline"
                      >
                        Moderate
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-xs text-neutral-450">No social posts registered or tracked.</p>
          </div>
        )}
      </div>
    </div>
  );
}

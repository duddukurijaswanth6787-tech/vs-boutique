'use client';

import React from 'react';
import {
  useRagSummaryAnalytics,
  useIntents,
} from '@/features/rag-agent/rag-agent.hooks';
import {
  BarChart3,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';

export default function RagMetricsPage() {
  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useRagSummaryAnalytics();

  const {
    data: intents,
    isLoading: intentsLoading,
    error: intentsError,
    refetch: refetchIntents,
  } = useIntents();

  const handleRetry = () => {
    refetchAnalytics();
    refetchIntents();
  };

  if (analyticsLoading || intentsLoading) {
    return <SectionLoader message="Loading RAG performance analytics..." />;
  }

  if (analyticsError || intentsError) {
    return (
      <PageError
        title="Metrics Load Failure"
        message="Could not retrieve historical time-series analytics from the RAG service."
        retry={handleRetry}
      />
    );
  }

  const successRate =
    analytics && analytics.totalRequests > 0
      ? `${((analytics.successfulRequests / analytics.totalRequests) * 100).toFixed(1)}%`
      : '0.0%';

  const cards = [
    {
      title: 'Total Requests',
      value: analytics?.totalRequests ?? 0,
      icon: Activity,
      desc: 'Total messages received',
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'LLM Success Rate',
      value: successRate,
      icon: CheckCircle2,
      desc: 'Successful completions',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Average Latency',
      value: analytics?.averageLatencyMs ? `${(analytics.averageLatencyMs / 1000).toFixed(2)}s` : 'N/A',
      icon: Clock,
      desc: 'Mean LLM generation time',
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      title: 'Average Relevance',
      value: analytics?.averageRelevanceScore ? `${(analytics.averageRelevanceScore * 100).toFixed(1)}%` : 'N/A',
      icon: ThumbsUp,
      desc: 'Knowledge match confidence',
      color: 'text-orange-600 bg-orange-50 border-orange-100',
    },
  ];

  const totalIntentCount = intents?.reduce((acc, curr) => acc + curr.count, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">RAG Metrics & Performance</h1>
        <p className="text-sm text-neutral-500 mt-1">Real-time analytical graphs mapping RAG efficiency logs.</p>
      </div>

      {/* KPI Cards Panel */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`rounded-lg border p-1.5 ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-neutral-900">{card.value}</h3>
                <p className="text-[11px] text-neutral-400 mt-1">{card.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Intent Breakdown horizontal bars */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-neutral-900 mb-2 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-neutral-500" /> Message Intent breakdown
          </h2>
          <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
            Summary counts of classified user queries mapped to automated actions.
          </p>

          <div className="space-y-4 flex-1 justify-center flex flex-col">
            {intents && intents.length > 0 ? (
              intents.map((item) => {
                const percentage = ((item.count / totalIntentCount) * 100).toFixed(0);
                return (
                  <div key={item.intent} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-neutral-800">
                      <span>{item.intent}</span>
                      <span>
                        {item.count} hits ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-neutral-900 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-neutral-400 py-6 text-center">No intent classification data found.</p>
            )}
          </div>
        </div>

        {/* Execution Summary Table */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-neutral-500" /> Operational stats
            </h2>
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-neutral-50 pb-3">
                <span className="font-semibold text-neutral-500">Total System Conversations</span>
                <span className="font-bold text-neutral-800">{analytics?.totalConversations ?? 0} sessions</span>
              </div>
              <div className="flex items-center justify-between border-b border-neutral-50 pb-3">
                <span className="font-semibold text-neutral-500">Total Managed Messages</span>
                <span className="font-bold text-neutral-800">{analytics?.totalMessages ?? 0} messages</span>
              </div>
              <div className="flex items-center justify-between border-b border-neutral-50 pb-3">
                <span className="font-semibold text-neutral-500">Failed Executions</span>
                <span className="font-bold text-red-600">{analytics?.failedRequests ?? 0} queries</span>
              </div>
              <div className="flex items-center justify-between pb-1">
                <span className="font-semibold text-neutral-500">Successful Executions</span>
                <span className="font-bold text-green-600">{analytics?.successfulRequests ?? 0} queries</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

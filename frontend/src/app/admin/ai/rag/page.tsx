'use client';

import React from 'react';
import Link from 'next/link';
import {
  useRagSummaryAnalytics,
  useHealth,
} from '@/features/rag-agent/rag-agent.hooks';
import {
  Bot,
  Brain,
  MessageSquare,
  Activity,
  BarChart3,
  Sliders,
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { RagHealthIndicator } from '@/features/rag-agent/rag-agent.types';

export default function RagDashboardPage() {
  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useRagSummaryAnalytics();

  const {
    data: healthData,
    isLoading: healthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useHealth();

  const handleRetry = () => {
    refetchAnalytics();
    refetchHealth();
  };

  if (analyticsLoading || healthLoading) {
    return <SectionLoader message="Loading RAG metrics and system health..." />;
  }

  if (analyticsError || healthError) {
    return (
      <PageError
        title="RAG Control Center Load Failure"
        message="Could not connect to the RAG backend. Please verify that the NestJS server is running."
        retry={handleRetry}
      />
    );
  }

  // Extract health info safely
  const ragHealth: RagHealthIndicator | Record<string, never> =
    healthData?.info?.rag || healthData?.details?.rag || {};
  const isRagEnabled = ragHealth.enabled !== false;
  const llmStatus = ragHealth.llm?.status || 'UNCONFIGURED';
  const llmProvider = ragHealth.llm?.provider || 'gemini';
  const embeddingStatus = ragHealth.embedding?.status || 'UNCONFIGURED';
  const embeddingProvider = ragHealth.embedding?.provider || 'gemini';
  const queueStatus = ragHealth.ingestionQueue?.status || 'DOWN';
  const vectorDbStatus = ragHealth.vectorDatabase?.status || 'DOWN';

  const renderHealthBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'UP' || s === 'HEALTHY') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-50 text-green-700 border border-green-100">
          <CheckCircle2 className="h-3 w-3" /> UP
        </span>
      );
    }
    if (s === 'UNCONFIGURED' || s === 'DISABLED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-100 text-neutral-600 border border-neutral-200">
          <HelpCircle className="h-3 w-3" /> {s}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-100">
        <XCircle className="h-3 w-3" /> {s || 'DOWN'}
      </span>
    );
  };

  const cards = [
    {
      title: 'Conversations',
      value: analytics?.totalConversations ?? 0,
      icon: MessageSquare,
      desc: 'Active sessions',
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Total Messages',
      value: analytics?.totalMessages ?? 0,
      icon: Activity,
      desc: 'Dispatched messages',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Avg relevance score',
      value: analytics?.averageRelevanceScore ? `${(analytics.averageRelevanceScore * 100).toFixed(1)}%` : 'N/A',
      icon: BarChart3,
      desc: 'Knowledge match confidence',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Avg Response Time',
      value: analytics?.averageLatencyMs ? `${(analytics.averageLatencyMs / 1000).toFixed(2)}s` : 'N/A',
      icon: Sliders,
      desc: 'Mean LLM generation latency',
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
  ];

  const quickNav = [
    {
      title: 'Agents',
      href: '/admin/ai/rag/agents',
      desc: 'Configure system roles, models, temperature, and tools mapping.',
      icon: Bot,
      color: 'text-purple-600 bg-purple-50 hover:bg-purple-100/50',
    },
    {
      title: 'Knowledge Base',
      href: '/admin/ai/rag/knowledge',
      desc: 'Manage websites, FAQs, PDFs, and custom text indexing sources.',
      icon: Brain,
      color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100/50',
    },
    {
      title: 'Ingestion queue',
      href: '/admin/ai/rag/ingestion',
      desc: 'Track BullMQ queue processing state and source document chunks.',
      icon: Activity,
      color: 'text-blue-600 bg-blue-50 hover:bg-blue-100/50',
    },
    {
      title: 'Conversations',
      href: '/admin/ai/rag/conversations',
      desc: 'Inspect user questions, tool dispatches, and citation histories.',
      icon: MessageSquare,
      color: 'text-orange-600 bg-orange-50 hover:bg-orange-100/50',
    },
    {
      title: 'Metrics',
      href: '/admin/ai/rag/metrics',
      desc: 'Review analytical logs, intent summaries, and latency graphs.',
      icon: BarChart3,
      color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100/50',
    },
    {
      title: 'RAG Playground',
      href: '/admin/ai/rag/playground',
      desc: 'Chat directly with RAG agents to evaluate retrieval quality.',
      icon: Sliders,
      color: 'text-neutral-600 bg-neutral-100 hover:bg-neutral-200/50 border border-neutral-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">RAG Agent Control Center</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Enterprise AI retrieval configuration, knowledge base monitoring, and chat inspection portal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 font-semibold uppercase">RAG Engine Status:</span>
          {isRagEnabled ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> ACTIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
              <XCircle className="h-3.5 w-3.5" /> INACTIVE
            </span>
          )}
        </div>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Provider Health Monitor */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-neutral-500" /> Infrastructure Health
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-50 pb-3">
              <div>
                <p className="text-sm font-semibold text-neutral-800">LLM Generation Provider</p>
                <p className="text-[11px] text-neutral-400 font-medium uppercase mt-0.5">{llmProvider}</p>
              </div>
              {renderHealthBadge(llmStatus)}
            </div>

            <div className="flex items-center justify-between border-b border-neutral-50 pb-3">
              <div>
                <p className="text-sm font-semibold text-neutral-800">Embedding Engine</p>
                <p className="text-[11px] text-neutral-400 font-medium uppercase mt-0.5">{embeddingProvider}</p>
              </div>
              {renderHealthBadge(embeddingStatus)}
            </div>

            <div className="flex items-center justify-between border-b border-neutral-50 pb-3">
              <div>
                <p className="text-sm font-semibold text-neutral-800">Vector database</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">PostgreSQL pgvector</p>
              </div>
              {renderHealthBadge(vectorDbStatus === 'UP' ? 'UP' : 'DOWN')}
            </div>

            <div className="flex items-center justify-between pb-1">
              <div>
                <p className="text-sm font-semibold text-neutral-800">Ingestion Queue</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Redis + BullMQ Worker</p>
              </div>
              {renderHealthBadge(queueStatus)}
            </div>
          </div>
        </div>

        {/* Quick Navigation Links */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-base font-bold text-neutral-900 mb-4">Quick Navigation</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickNav.map((nav, index) => {
              const Icon = nav.icon;
              return (
                <Link
                  key={index}
                  href={nav.href}
                  className="flex gap-4 p-4 rounded-xl border border-neutral-200 bg-white shadow-sm hover:border-neutral-300 transition-all group"
                >
                  <div className={`rounded-lg p-2.5 h-fit ${nav.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 group-hover:text-black transition-colors">
                      {nav.title}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{nav.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

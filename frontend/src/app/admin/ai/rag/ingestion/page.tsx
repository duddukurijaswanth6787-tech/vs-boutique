'use client';

import React, { useState } from 'react';
import {
  useKnowledgeSources,
  useReindex,
} from '@/features/rag-agent/rag-agent.hooks';
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Database,
} from 'lucide-react';
import { SectionLoader } from '@/components/feedback/FeedbackStates';
import { toast } from 'sonner';

export default function RagIngestionPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useKnowledgeSources(page, 10);
  const reindexMutation = useReindex();

  const handleReindex = async (id: string) => {
    try {
      await reindexMutation.mutateAsync(id);
      toast.success('Ingestion triggered for knowledge source.');
      refetch();
    } catch {}
  };

  if (isLoading) {
    return <SectionLoader message="Loading ingestion jobs statuses..." />;
  }

  const sources = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  const renderStatus = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'INDEXED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
          <CheckCircle2 className="h-3 w-3" /> INDEXED
        </span>
      );
    }
    if (s === 'PROCESSING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
          <RefreshCw className="h-3 w-3 animate-spin" /> PROCESSING
        </span>
      );
    }
    if (s === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <XCircle className="h-3 w-3" /> FAILED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
        <HelpCircle className="h-3 w-3" /> PENDING
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Ingestion Operations</h1>
          <p className="text-sm text-neutral-500 mt-1">Monitor document chunking and vector embeddings generation.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Queue
        </button>
      </div>

      {/* Ingestion Table */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 text-neutral-500 font-semibold uppercase tracking-wider">
              <th className="p-4">Knowledge Source</th>
              <th className="p-4">Status</th>
              <th className="p-4">Type</th>
              <th className="p-4">Vector Database</th>
              <th className="p-4">Last Ingestion</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-700">
            {sources.length > 0 ? (
              sources.map((source) => (
                <tr key={source.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="p-4 font-bold text-neutral-900">{source.name}</td>
                  <td className="p-4">{renderStatus(source.status)}</td>
                  <td className="p-4 font-mono font-bold text-neutral-500">{source.sourceType}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 font-semibold text-neutral-600">
                      <Database className="h-3.5 w-3.5 text-neutral-400" /> PostgreSQL pgvector
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-neutral-500">
                      <Clock className="h-3.5 w-3.5 text-neutral-400" />
                      {source.lastIndexedAt ? new Date(source.lastIndexedAt).toLocaleString() : 'Never'}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleReindex(source.id)}
                      disabled={source.status === 'PROCESSING'}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Reindex
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-400">
                  No knowledge sources ingestion tasks.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/50 px-4 py-3">
            <span className="text-xs text-neutral-500">
              Page {page} of {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
                disabled={page === meta.totalPages}
                className="rounded border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

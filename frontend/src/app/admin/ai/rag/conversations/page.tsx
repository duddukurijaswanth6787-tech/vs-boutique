'use client';

import React, { useState } from 'react';
import {
  useConversations,
  useRagAgents,
} from '@/features/rag-agent/rag-agent.hooks';
import {
  MessageSquare,
  Eye,
  Clock,
  User,
  Bot,
} from 'lucide-react';
import Link from 'next/link';
import { SectionLoader } from '@/components/feedback/FeedbackStates';

export default function RagConversationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useConversations(page, 10);
  const { data: agentsData } = useRagAgents(1, 100);

  // Filters state
  const [agentFilter, setAgentFilter] = useState('');

  if (isLoading) {
    return <SectionLoader message="Loading conversation histories..." />;
  }

  const conversations = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };
  const agents = agentsData?.data || [];

  // Filter local mapping
  const filteredConversations = conversations.filter((c) => {
    if (agentFilter) return c.agentId === agentFilter;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Conversations Inspector</h1>
          <p className="text-sm text-neutral-500 mt-1">Review chat history log streams with citations and tools execution metadata.</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-sm max-w-sm">
        <label className="text-xs font-bold text-neutral-500 uppercase block mb-1.5">Filter by Agent</label>
        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="w-full py-2 px-3 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950 bg-white"
        >
          <option value="">All Agents</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>

      {/* Conversations Table */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 text-neutral-500 font-semibold uppercase tracking-wider">
              <th className="p-4">Conversation ID</th>
              <th className="p-4">User Identity</th>
              <th className="p-4">Assigned Agent</th>
              <th className="p-4">Last message activity</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-700">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <tr key={conv.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-neutral-900 max-w-[150px] truncate">
                    {conv.id}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-neutral-400" />
                      <span className="font-semibold text-neutral-700">
                        {conv.customerId ? `Customer ID: ${conv.customerId.substring(0, 8)}...` : 'Guest Session'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-neutral-400" />
                      <span className="font-semibold text-neutral-800">{conv.agent?.name || 'RAG Assistant'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-neutral-500">
                      <Clock className="h-3.5 w-3.5 text-neutral-400" />
                      {new Date(conv.lastMessageAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/admin/ai/rag/conversations/${conv.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    >
                      <Eye className="h-3.5 w-3.5" /> Inspect Chat
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-400">
                  No conversation logs found.
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

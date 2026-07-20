'use client';

import React, { useState } from 'react';
import {
  useAuditLogs,
} from '@/features/audit/audit.hooks';
import { AuditLogResponse } from '@/features/audit/audit.types';
import {
  Search,
  Eye,
  Calendar,
  Clock,
  Layers,
  Database,
  ShieldAlert,
} from 'lucide-react';
import { SectionLoader } from '@/components/feedback/FeedbackStates';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, refetch } = useAuditLogs({
    page,
    limit: 15,
    search: search || undefined,
    module: module || undefined,
    status: status || undefined,
  });

  const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null);

  // Recursive Frontend Redaction Helper
  type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
  const redactSecrets = (obj: Json): Json => {
    if (!obj) return obj;
    try {
      const copy = JSON.parse(JSON.stringify(obj)) as Json;
      const sensitiveKeys = [
        'password',
        'passwordhash',
        'refreshtoken',
        'jwt',
        'token',
        'authorization',
        'cookie',
        'apikey',
        'aws',
        'gemini',
        'openai',
        'razorpay',
        'secret',
      ];

      const traverse = (item: Json) => {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          const record = item as Record<string, Json>;
          for (const key in record) {
            if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
              record[key] = '[REDACTED]';
            } else {
              traverse(record[key]);
            }
          }
        }
      };

      traverse(copy);
      return copy;
    } catch {
      return obj;
    }
  };

  if (isLoading) {
    return <SectionLoader message="Loading audit operations logs..." />;
  }

  const logs = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Audit Logs</h1>
        <p className="text-sm text-neutral-500 mt-1">Review ledger events, administrator mutations, and security transactions.</p>
      </div>

      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-3 bg-white border border-neutral-200 p-4 rounded-xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search action or entity..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950"
          />
        </div>

        <select
          value={module}
          onChange={(e) => {
            setModule(e.target.value);
            setPage(1);
          }}
          className="py-2 px-3 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950 bg-white"
        >
          <option value="">All Modules</option>
          <option value="auth">Auth</option>
          <option value="catalog">Catalog</option>
          <option value="orders">Orders</option>
          <option value="inventory">Inventory</option>
          <option value="wallet">Wallet</option>
          <option value="rag-agent">RAG Agent</option>
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="py-2 px-3 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILURE">Failure</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 text-neutral-500 font-semibold uppercase tracking-wider">
              <th className="p-4">Timestamp</th>
              <th className="p-4">Action</th>
              <th className="p-4">Module / Entity</th>
              <th className="p-4">Actor ID</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-700">
            {logs.length > 0 ? (
              logs.map((log: AuditLogResponse) => (
                <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="p-4 font-mono text-neutral-550">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 font-bold text-neutral-900">{log.action}</td>
                  <td className="p-4">
                    <span className="font-semibold text-neutral-705 capitalize">{log.module}</span>
                    <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{log.resource} ({log.resourceId || 'N/A'})</p>
                  </td>
                  <td className="p-4 font-mono text-neutral-500 max-w-[120px] truncate">
                    {log.userId || log.staffId || 'SYSTEM'}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase
                        ${log.status === 'SUCCESS' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}
                      `}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-400">
                  No audit logs found.
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

      {/* AUDIT LOG DETAIL DIALOG */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-neutral-100 bg-neutral-50 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-neutral-900">Audit transaction detail</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-xs text-neutral-400 hover:text-neutral-900"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-neutral-400 uppercase">Audit ID</span>
                  <p className="font-mono text-neutral-800 mt-1">{selectedLog.id}</p>
                </div>
                <div>
                  <span className="font-bold text-neutral-400 uppercase">Trigger Time</span>
                  <p className="font-semibold text-neutral-805 mt-1">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-neutral-400 uppercase">Actor ID</span>
                  <p className="font-mono text-neutral-800 mt-1">{selectedLog.userId || selectedLog.staffId || 'SYSTEM'}</p>
                </div>
                <div>
                  <span className="font-bold text-neutral-400 uppercase">IP Address</span>
                  <p className="font-mono text-neutral-850 mt-1">{selectedLog.ipAddress || '127.0.0.1'}</p>
                </div>
              </div>

              {selectedLog.oldValue != null && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-neutral-400 uppercase block">Before State (Redacted)</span>
                  <pre className="p-3 bg-neutral-950 rounded-lg text-neutral-200 text-[10px] font-mono overflow-x-auto">
                    {JSON.stringify(redactSecrets(selectedLog.oldValue as Json), null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValue != null && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-neutral-400 uppercase block">After State (Redacted)</span>
                  <pre className="p-3 bg-neutral-950 rounded-lg text-neutral-200 text-[10px] font-mono overflow-x-auto">
                    {JSON.stringify(redactSecrets(selectedLog.newValue as Json), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

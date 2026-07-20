'use client';

import React, { useState } from 'react';
import { useExportJobs, reportsService } from '@/features/reports';
import { Download, RefreshCw, FileSpreadsheet, AlertCircle, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { toast } from 'sonner';

export default function ExportJobsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useExportJobs(page, 10);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (isLoading) return <SectionLoader message="Loading export job histories..." />;
  if (error) return <PageError title="Load Failure" message="Could not fetch export job lists." retry={refetch} />;

  const jobs = data?.data || [];
  const meta = data?.meta || { totalPages: 1, hasNext: false, hasPrevious: false };

  const handleDownload = async (jobId: string) => {
    try {
      setDownloadingId(jobId);
      const res = await reportsService.getExportJobDownloadUrl(jobId);
      if (res.url) {
        window.open(res.url, '_blank');
      } else {
        toast.error('Could not retrieve secure download link.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Download failed: ${message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
        <Link href="/admin/reports" className="hover:text-neutral-900 flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Report Center
        </Link>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 border-neutral-100">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Background Export Jobs</h1>
          <p className="text-sm text-neutral-500 mt-1">
            View generated report logs and securely download private S3 output files.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-xs font-bold text-neutral-900 border border-neutral-300 rounded px-3 py-2 hover:bg-neutral-50 transition flex items-center gap-1 bg-white shadow-sm"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh List
        </button>
      </div>

      {/* Jobs list table */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        {jobs.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider">
                    <th className="py-2">Job ID</th>
                    <th className="py-2">Report Type</th>
                    <th className="py-2">Format</th>
                    <th className="py-2">Created At</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-neutral-700">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-neutral-50/50 transition">
                      <td className="py-3 font-mono text-[10px] text-neutral-500">{job.id}</td>
                      <td className="py-3 font-semibold text-neutral-900">{job.type}</td>
                      <td className="py-3">
                        <span className="flex items-center gap-1">
                          <FileSpreadsheet className="h-3.5 w-3.5 text-neutral-450" />
                          {job.format}
                        </span>
                      </td>
                      <td className="py-3 text-neutral-400">
                        {new Date(job.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase
                          ${job.status === 'COMPLETED' && 'bg-green-50 text-green-700 border border-green-100'}
                          ${job.status === 'FAILED' && 'bg-red-50 text-red-700 border border-red-100'}
                          ${job.status === 'PROCESSING' && 'bg-blue-50 text-blue-700 border border-blue-100'}
                          ${job.status === 'PENDING' && 'bg-yellow-50 text-yellow-700 border border-yellow-100'}
                        `}>
                          {job.status === 'PROCESSING' && <Clock className="h-2.5 w-2.5 animate-spin" />}
                          {job.status}
                        </span>
                        {job.error && (
                          <div className="text-[10px] text-red-500 mt-1 flex items-center gap-1 font-mono">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[150px]">{job.error}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {job.status === 'COMPLETED' ? (
                          <button
                            onClick={() => handleDownload(job.id)}
                            disabled={downloadingId === job.id}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-950 hover:underline disabled:opacity-50"
                          >
                            <Download className="h-3 w-3" />
                            {downloadingId === job.id ? 'Loading...' : 'Download'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-neutral-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center border-t pt-4">
              <span className="text-xs text-neutral-450">Page {page} of {meta.totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={!meta.hasPrevious}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="text-xs font-bold text-neutral-900 border border-neutral-350 rounded px-3 py-1 hover:bg-neutral-50 disabled:opacity-50 bg-white"
                >
                  Previous
                </button>
                <button
                  disabled={!meta.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-xs font-bold text-neutral-900 border border-neutral-350 rounded px-3 py-1 hover:bg-neutral-50 disabled:opacity-50 bg-white"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-xs text-neutral-450">No background export jobs spawned yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

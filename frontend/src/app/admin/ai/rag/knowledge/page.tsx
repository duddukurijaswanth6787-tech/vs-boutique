'use client';

import React, { useState } from 'react';
import {
  useKnowledgeSources,
  useCreateKnowledgeSource,
  useDeleteKnowledgeSource,
  useGetUploadUrl,
  useConfirmUpload,
  useReindex,
} from '@/features/rag-agent/rag-agent.hooks';
import { KnowledgeSource, KnowledgeSourceType } from '@/features/rag-agent/rag-agent.types';
import {
  Brain,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  FileText,
  Globe,
  Upload,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { SectionLoader } from '@/components/feedback/FeedbackStates';
import { toast } from 'sonner';

export default function RagKnowledgePage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useKnowledgeSources(page, 10);

  // Filters state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [sourceType, setSourceType] = useState<KnowledgeSourceType>('TEXT');

  // Form states
  const [name, setName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [rawText, setRawText] = useState('');

  // File Upload states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Mutations
  const createMutation = useCreateKnowledgeSource();
  const deleteMutation = useDeleteKnowledgeSource();
  const getUploadUrlMutation = useGetUploadUrl();
  const confirmUploadMutation = useConfirmUpload();
  const reindexMutation = useReindex();

  const handleOpenCreate = () => {
    setName('');
    setSourceUrl('');
    setRawText('');
    setUploadFile(null);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sourceType === 'DOCUMENT') {
      if (!uploadFile) {
        toast.error('Please select a file to upload.');
        return;
      }
      setIsUploading(true);
      try {
        // 1. Get presigned URL from NestJS backend
        const { uploadUrl, s3Key } = await getUploadUrlMutation.mutateAsync({
          fileName: uploadFile.name,
          mimeType: uploadFile.type || 'application/pdf',
          size: uploadFile.size,
        });

        // 2. Upload file directly to S3 Emulator (or real S3)
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: uploadFile,
          headers: {
            'Content-Type': uploadFile.type || 'application/pdf',
          },
        });

        if (!uploadRes.ok) {
          throw new Error('S3 upload request failed.');
        }

        // 3. Create knowledge source record first
        const source = await createMutation.mutateAsync({
          name: name || uploadFile.name,
          sourceType: 'DOCUMENT',
        });

        // 4. Confirm upload to trigger backend vector chunks parsing and indexing
        await confirmUploadMutation.mutateAsync({
          id: source.id,
          dto: {
            s3Key,
            fileName: uploadFile.name,
            mimeType: uploadFile.type || 'application/pdf',
            size: uploadFile.size,
          },
        });

        toast.success('Document uploaded and queued for vector index ingestion!');
        setIsCreateOpen(false);
        refetch();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        toast.error(`Ingestion failed: ${message}`);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Crawl URL / Raw Text creation
    await createMutation.mutateAsync({
      name,
      sourceType,
      sourceUrl: sourceType === 'URL' ? sourceUrl : undefined,
      rawText: sourceType === 'TEXT' ? rawText : undefined,
    });
    setIsCreateOpen(false);
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this knowledge source?')) {
      await deleteMutation.mutateAsync(id);
      refetch();
    }
  };

  const handleReindex = async (id: string) => {
    await reindexMutation.mutateAsync(id);
    toast.success('Ingestion re-indexing job triggered.');
    refetch();
  };

  if (isLoading) {
    return <SectionLoader message="Loading knowledge base sources..." />;
  }

  const sources = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  // Local filter mapping
  const filteredSources = sources.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter ? s.sourceType === typeFilter : true;
    const matchesStatus = statusFilter ? s.status === statusFilter : true;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Knowledge Base</h1>
          <p className="text-sm text-neutral-500 mt-1">Configure sources indexed into vector space.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" /> Add Source
        </button>
      </div>

      {/* Filters bar */}
      <div className="grid gap-3 sm:grid-cols-4 bg-white border border-neutral-200 p-4 rounded-xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search sources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="py-2 px-3 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950 bg-white"
        >
          <option value="">All Types</option>
          <option value="TEXT">Text</option>
          <option value="DOCUMENT">Document (PDF)</option>
          <option value="URL">URL Crawler</option>
          <option value="FAQ">FAQ Mapping</option>
          <option value="CMS">CMS Contents</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2 px-3 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="INDEXED">Indexed</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Sources List Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredSources.length > 0 ? (
          filteredSources.map((source) => (
            <div
              key={source.id}
              className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col justify-between hover:border-neutral-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-neutral-50 text-neutral-500">
                      {source.sourceType === 'URL' ? (
                        <Globe className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/admin/ai/rag/knowledge/${source.id}`}
                        className="text-sm font-bold text-neutral-900 hover:underline"
                      >
                        {source.name}
                      </Link>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Type: {source.sourceType}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase
                      ${source.status === 'INDEXED' && 'bg-green-50 text-green-700 border border-green-100'}
                      ${source.status === 'PENDING' && 'bg-yellow-50 text-yellow-700 border border-yellow-100'}
                      ${source.status === 'PROCESSING' && 'bg-blue-50 text-blue-700 border border-blue-100'}
                      ${source.status === 'FAILED' && 'bg-red-50 text-red-700 border border-red-100'}
                    `}
                  >
                    {source.status}
                  </span>
                </div>

                {source.sourceUrl && (
                  <p className="text-xs text-neutral-500 mt-3 truncate font-mono bg-neutral-50 p-2 rounded border border-neutral-100">
                    {source.sourceUrl}
                  </p>
                )}

                {source.indexingError && (
                  <p className="text-xs text-red-600 mt-3 bg-red-50/50 p-2 rounded border border-red-100 font-mono">
                    Error: {source.indexingError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-neutral-100 pt-4 mt-4">
                <span className="text-[10px] text-neutral-400">
                  Last updated: {new Date(source.updatedAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/admin/ai/rag/knowledge/${source.id}`}
                    className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                    title="Inspect chunks"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleReindex(source.id)}
                    className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                    title="Force Re-index"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(source.id)}
                    className="rounded p-1 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                    title="Delete source"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 p-12 text-center border border-dashed rounded-xl text-neutral-400">
            No knowledge sources found matching current filters.
          </div>
        )}
      </div>

      {/* ADD SOURCE DIALOG */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-neutral-100 bg-neutral-50 px-6 py-4">
              <h3 className="font-bold text-neutral-900">Add knowledge source</h3>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase">Source Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['TEXT', 'URL', 'DOCUMENT'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSourceType(type)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all
                        ${
                          sourceType === type
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                        }
                      `}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase">Friendly Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none"
                  placeholder="e.g. Return Policy Document"
                />
              </div>

              {sourceType === 'URL' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Crawl Target URL</label>
                  <input
                    type="url"
                    required
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none"
                    placeholder="https://example.com/refund-terms"
                  />
                  <p className="text-[10px] text-neutral-400">
                    The backend will crawl the web page and extract structural text.
                  </p>
                </div>
              )}

              {sourceType === 'TEXT' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Raw Text Content</label>
                  <textarea
                    required
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none h-40"
                    placeholder="Paste or write your custom text layout chunks..."
                  />
                </div>
              )}

              {sourceType === 'DOCUMENT' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Document File (PDF / TXT)</label>
                  <div className="flex items-center justify-center border-2 border-dashed border-neutral-200 rounded-lg p-6 bg-neutral-50 hover:bg-neutral-100/50 cursor-pointer transition-colors relative">
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center text-center">
                      <Upload className="h-8 w-8 text-neutral-400 mb-2" />
                      <span className="text-xs font-semibold text-neutral-700">
                        {uploadFile ? uploadFile.name : 'Select PDF or Text file'}
                      </span>
                      <span className="text-[10px] text-neutral-400 mt-1">
                        {uploadFile ? `${(uploadFile.size / 1024).toFixed(1)} KB` : 'Limit 10MB'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Save & Ingest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

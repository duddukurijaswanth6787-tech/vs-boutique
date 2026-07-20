'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  useReels, useCreateReel, useDeleteReel, useCloneReel, useReorderReels, useReelAnalytics,
} from '@/features/reels/reel.hooks';
import { reelService } from '@/features/reels/reel.service';
import type { ReelResponse } from '@/features/reels/reel.types';
import { useProducts } from '@/features/catalog/products/product.hooks';
import type { ProductResponse } from '@/features/catalog/products/product.types';
import { SectionLoader, PageError, ButtonLoader, EmptyState } from '@/components/feedback/FeedbackStates';
import BulkActionBar from '@/components/ui/BulkActionBar';
import { Search, Plus, Trash2, Edit3, X, Copy, Video, UploadCloud, Eye, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDate } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const reelSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
  videoUrl: z.string().optional().or(z.literal('')),
  thumbnailUrl: z.string().optional().or(z.literal('')),
  duration: z.number().int().min(0).optional(),
  displayOrder: z.number().int().min(0).optional(),
  featured: z.boolean().optional(),
  autoPlay: z.boolean().optional(),
  muted: z.boolean().optional(),
  loop: z.boolean().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']).optional(),
  visibility: z.enum(['PUBLIC', 'HIDDEN']).optional(),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof reelSchema>;

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-600',
  PUBLISHED: 'bg-green-50 text-green-700 border border-green-100',
  SCHEDULED: 'bg-blue-50 text-blue-700 border border-blue-100',
  ARCHIVED: 'bg-red-50 text-red-600 border border-red-100',
};
const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm'];
const MAX_VIDEO_SIZE_MB = 500;

export default function ReelsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const pageParam = parseInt(searchParams.get('page') || '1');
  const searchParam = searchParams.get('search') || '';
  const statusParam = searchParams.get('status') || '';

  const { data: listData, isLoading, isError, refetch } = useReels({
    page: pageParam, limit: 20, search: searchParam || undefined, status: statusParam || undefined,
  });

  const [activeReel, setActiveReel] = useState<ReelResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewReel, setPreviewReel] = useState<ReelResponse | null>(null);
  const [analyticsReel, setAnalyticsReel] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => Promise<void> } | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<ProductResponse[]>([]);
  const [bulkRunning, setBulkRunning] = useState(false);

  const deleteMut = useDeleteReel();
  const cloneMut = useCloneReel();
  const createMut = useCreateReel();
  const reorderMut = useReorderReels();
  const { data: analyticsData } = useReelAnalytics(analyticsReel || '');

  const { data: productResults } = useProducts(
    productSearch.length >= 2 ? { search: productSearch, limit: 20 } : { limit: 0 },
  );

  const {
    register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(reelSchema),
    defaultValues: {
      name: '', slug: '', description: '', videoUrl: '', thumbnailUrl: '',
      duration: 0, displayOrder: 0, featured: false, autoPlay: true,
      muted: true, loop: true, status: 'DRAFT', visibility: 'PUBLIC',
      startDate: '', endDate: '',
    },
  });

  const openCreate = () => {
    setActiveReel(null);
    setSelectedProducts([]);
    reset({ name: '', slug: '', description: '', videoUrl: '', thumbnailUrl: '', duration: 0, displayOrder: 0, featured: false, autoPlay: true, muted: true, loop: true, status: 'DRAFT', visibility: 'PUBLIC', startDate: '', endDate: '' });
    setIsDialogOpen(true);
  };

  const openEdit = (reel: ReelResponse) => {
    setActiveReel(reel);
    setSelectedProducts((reel.products || []).map((p: any) => ({ id: p.productId, name: p.productName, slug: p.productSlug, primaryImageUrl: p.primaryImageUrl } as ProductResponse)));
    reset({
      name: reel.name, slug: reel.slug, description: reel.description || '',
      videoUrl: reel.videoUrl || '', thumbnailUrl: reel.thumbnailUrl || '',
      duration: reel.duration, displayOrder: reel.displayOrder, featured: reel.featured,
      autoPlay: reel.autoPlay, muted: reel.muted, loop: reel.loop,
      status: reel.status as FormValues['status'],
      visibility: reel.visibility as FormValues['visibility'],
      startDate: reel.startDate ? reel.startDate.slice(0, 10) : '',
      endDate: reel.endDate ? reel.endDate.slice(0, 10) : '',
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const duration = data.duration && !isNaN(data.duration) ? data.duration : undefined;
      const displayOrder = data.displayOrder && !isNaN(data.displayOrder) ? data.displayOrder : undefined;
      const dto: any = { ...data, slug: data.slug || undefined, description: data.description || undefined, videoUrl: data.videoUrl || undefined, thumbnailUrl: data.thumbnailUrl || undefined, duration, displayOrder, startDate: data.startDate || undefined, endDate: data.endDate || undefined };
      if (activeReel) {
        await reelService.update(activeReel.id, dto);
        if (selectedProducts.length) {
          await reelService.attachProducts(activeReel.id, { productIds: selectedProducts.map(p => p.id) });
        }
      } else {
        const created = await createMut.mutateAsync(dto);
        if (selectedProducts.length && created?.id) {
          await reelService.attachProducts(created.id, { productIds: selectedProducts.map(p => p.id) });
        }
      }
      setIsDialogOpen(false);
      refetch();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || 'Failed to save reel');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setConfirmAction({
      title: 'Delete Reel', message: `Permanently delete "${name}"? This action cannot be undone.`,
      onConfirm: async () => { await deleteMut.mutateAsync(id); refetch(); },
    });
  };

  const handleClone = async (id: string, name: string) => {
    try { await cloneMut.mutateAsync(id); toast.success(`Duplicated "${name}"`); refetch(); }
    catch (err: unknown) { toast.error(getApiErrorMessage(err) || 'Failed to duplicate'); }
  };

  const handleStatusToggle = async (reel: ReelResponse) => {
    const nextStatus = reel.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED';
    const actionLabel = nextStatus === 'PUBLISHED' ? 'publish' : 'archive';
    setConfirmAction({
      title: `${actionLabel === 'publish' ? 'Publish' : 'Archive'} Reel`,
      message: `Are you sure you want to ${actionLabel} "${reel.name}"?`,
      onConfirm: async () => { await reelService.updateStatus(reel.id, { status: nextStatus }); refetch(); },
    });
  };

  const handleBulkAction = async (action: string) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setBulkRunning(true);
    try {
      let successCount = 0;
      for (const id of ids) {
        try {
          if (action === 'delete') await deleteMut.mutateAsync(id);
          else if (action === 'publish') await reelService.updateStatus(id, { status: 'PUBLISHED' });
          else if (action === 'archive') await reelService.updateStatus(id, { status: 'ARCHIVED' });
          else if (action === 'duplicate') await cloneMut.mutateAsync(id);
          successCount++;
        } catch { /* skip failed */ }
      }
      toast.success(`${successCount}/${ids.length} reels ${action === 'delete' ? 'deleted' : action === 'duplicate' ? 'duplicated' : `${action}ed`}`);
      setSelectedIds(new Set());
      refetch();
    } finally { setBulkRunning(false); }
  };

  const handleMoveOrder = async (reel: ReelResponse, direction: 'up' | 'down') => {
    if (!listData?.data) return;
    const sorted = [...listData.data].sort((a, b) => a.displayOrder - b.displayOrder);
    const idx = sorted.findIndex(r => r.id === reel.id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;
    const swap = sorted[idx + (direction === 'up' ? -1 : 1)];
    await reorderMut.mutateAsync({ items: [{ id: reel.id, displayOrder: swap.displayOrder }, { id: swap.id, displayOrder: reel.displayOrder }] });
    refetch();
  };

  const validateVideo = (file: File): string | null => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_VIDEO_EXTENSIONS.includes(ext)) return `Invalid format. Allowed: ${ALLOWED_VIDEO_EXTENSIONS.join(', ')}`;
    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) return `File too large. Max: ${MAX_VIDEO_SIZE_MB}MB`;
    return null;
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateVideo(file);
    if (error) { toast.error(error); return; }
    const ext = file.name.split('.').pop() || 'mp4';
    setVideoUploading(true);
    setVideoProgress(0);
    try {
      const { url, filePath } = await reelService.getUploadUrl({ extension: ext, type: 'video' });
      await reelService.uploadToS3(url, file, (pct) => setVideoProgress(pct));
      const baseUrl = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.example.com';
      setValue('videoUrl', `${baseUrl}/${filePath}`);
      toast.success('Video uploaded');
    } catch (err) { toast.error('Video upload failed'); }
    finally { setVideoUploading(false); setVideoProgress(0); }
  };

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop() || 'jpg';
    setThumbUploading(true);
    try {
      const { url, filePath } = await reelService.getUploadUrl({ extension: ext, type: 'thumbnail' });
      await reelService.uploadToS3(url, file);
      const baseUrl = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.example.com';
      setValue('thumbnailUrl', `${baseUrl}/${filePath}`);
      toast.success('Thumbnail uploaded');
    } catch (err) { toast.error('Thumbnail upload failed'); }
    finally { setThumbUploading(false); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleSelectAll = () => {
    if (!listData?.data) return;
    if (selectedIds.size === listData.data.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(listData.data.map(r => r.id)));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied')).catch(() => toast.error('Failed to copy'));
  };

  const now = new Date();
  const getScheduleLabel = (r: ReelResponse): { label: string; urgent: boolean } => {
    if (!r.startDate || r.status !== 'SCHEDULED') return { label: '', urgent: false };
    const diff = new Date(r.startDate).getTime() - now.getTime();
    const hours = Math.round(diff / 3600000);
    if (hours <= 0) return { label: 'Publishing now', urgent: true };
    if (hours < 24) return { label: `${hours}h remaining`, urgent: true };
    return { label: `${Math.round(hours / 24)}d remaining`, urgent: false };
  };

  const isEditor = user?.roles?.some(r => ['super_admin', 'admin', 'marketing_manager', 'content_manager'].includes(r));
  const isAdmin = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));

  const updateQuery = (key: string, value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value.toString()); else params.delete(key);
    params.set('page', '1');
    router.push(`/admin/reels?${params.toString()}`);
  };

  const allSelected = listData?.data?.length ? selectedIds.size === listData.data.length : false;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Instagram Reels</h1>
          <p className="text-xs text-neutral-400 mt-1">Manage shoppable Instagram-style video reels for the home page.</p>
        </div>
        {isEditor && (
          <button onClick={openCreate} className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition shadow-sm">
            <Plus className="w-4 h-4" /> Create Reel
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input placeholder="Search by name, slug, or description..." defaultValue={searchParam}
              onKeyDown={(e) => { if (e.key === 'Enter') updateQuery('search', (e.target as HTMLInputElement).value); }}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-800 focus:outline-none"
            />
          </div>
          <select value={statusParam} onChange={(e) => updateQuery('status', e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none">
            <option value="">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onClear={() => setSelectedIds(new Set())}
          isRunning={bulkRunning}
          actions={[
            { label: 'Publish', onClick: () => handleBulkAction('publish') },
            { label: 'Archive', onClick: () => handleBulkAction('archive') },
            { label: 'Duplicate', onClick: () => handleBulkAction('duplicate') },
            ...(isAdmin ? [{ label: 'Delete', onClick: () => handleBulkAction('delete'), variant: 'danger' as const }] : []),
          ]}
        />
      )}

      {/* Table */}
      {isLoading ? (
        <SectionLoader message="Loading reels..." />
      ) : isError ? (
        <PageError title="Connection Failure" message="Could not fetch reels." retry={refetch} />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4 w-8">
                    <input type="checkbox" className="h-4 w-4 rounded border-neutral-300" checked={allSelected} onChange={toggleSelectAll} />
                  </th>
                  <th className="p-4">Preview</th>
                  <th className="p-4">Name & Slug</th>
                  <th className="p-4 text-center w-20">Order</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Visibility</th>
                  <th className="p-4 text-center">Featured</th>
                  <th className="p-4 text-center">Views</th>
                  <th className="p-4">Schedule</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {listData?.data?.map((r) => {
                  const schedule = getScheduleLabel(r);
                  return (
                    <tr key={r.id} className={`hover:bg-neutral-50/50 transition-colors ${selectedIds.has(r.id) ? 'bg-blue-50/30' : ''}`}>
                      <td className="p-4">
                        <input type="checkbox" className="h-4 w-4 rounded border-neutral-300" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} />
                      </td>
                      <td className="p-4">
                        <button onClick={() => setPreviewReel(r)} className="block">
                          {r.thumbnailUrl ? (
                            <img src={r.thumbnailUrl} alt={r.name} className="w-12 h-16 object-cover rounded border border-neutral-200 hover:opacity-80 transition" />
                          ) : (
                            <div className="w-12 h-16 bg-neutral-100 flex items-center justify-center rounded border border-neutral-200 hover:bg-neutral-200 transition">
                              <Video className="w-5 h-5 text-neutral-400" />
                            </div>
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-neutral-900">{r.name}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">/{r.slug}</div>
                        {r.videoUrl && (
                          <button onClick={() => copyToClipboard(r.videoUrl!)} className="text-[9px] text-blue-600 hover:underline mt-0.5 flex items-center gap-1">
                            <Copy className="w-3 h-3" /> Copy URL
                          </button>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleMoveOrder(r, 'up')} className="p-0.5 hover:bg-neutral-100 rounded text-neutral-400" title="Move up"><span className="text-xs">▲</span></button>
                          <span className="font-semibold w-4 text-center text-xs">{r.displayOrder}</span>
                          <button onClick={() => handleMoveOrder(r, 'down')} className="p-0.5 hover:bg-neutral-100 rounded text-neutral-400" title="Move down"><span className="text-xs">▼</span></button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase w-fit ${STATUS_BADGE[r.status] || ''}`}>{r.status}</span>
                          {schedule.label && <span className={`text-[9px] ${schedule.urgent ? 'text-orange-500 font-bold' : 'text-neutral-400'}`}>{schedule.label}</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${r.visibility === 'PUBLIC' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{r.visibility}</span>
                      </td>
                      <td className="p-4 text-center">{r.featured ? <span className="text-amber-500 text-sm">★</span> : '—'}</td>
                      <td className="p-4 text-center font-semibold text-neutral-500">{r.viewCount}</td>
                      <td className="p-4 text-neutral-500 text-[10px]">
                        {r.startDate ? `${formatDate(r.startDate)} – ${r.endDate ? formatDate(r.endDate) : '∞'}` : 'Always'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setPreviewReel(r)} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600" title="Preview"><Eye className="w-3.5 h-3.5" /></button>
                          {isEditor && (
                            <>
                              <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setAnalyticsReel(r.id)} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600" title="Analytics"><BarChart3 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleStatusToggle(r)} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600" title={r.status === 'PUBLISHED' ? 'Archive' : 'Publish'}>
                                {r.status === 'PUBLISHED' ? <X className="w-3.5 h-3.5" /> : <UploadCloud className="w-3.5 h-3.5" />}
                              </button>
                            </>
                          )}
                          {isAdmin && (
                            <>
                              <button onClick={() => handleClone(r.id, r.name)} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDelete(r.id, r.name)} className="p-1.5 hover:bg-red-50 rounded text-red-650" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(!listData?.data || listData.data.length === 0) && (
                  <tr><td colSpan={10} className="p-8 text-center text-neutral-400 font-medium">No reels found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {listData?.meta && listData.meta.totalPages > 1 && (
            <div className="bg-neutral-50 p-4 border-t border-neutral-200 flex justify-between items-center">
              <span className="text-xs text-neutral-500 font-medium">Page {listData.meta.page} of {listData.meta.totalPages} (Total: {listData.meta.total})</span>
              <div className="flex gap-2">
                <button disabled={!listData.meta.hasPrevious} onClick={() => updateQuery('page', pageParam - 1)}
                  className="px-3 py-1.5 border border-neutral-200 rounded-lg bg-white text-xs font-semibold disabled:opacity-40">Previous</button>
                <button disabled={!listData.meta.hasNext} onClick={() => updateQuery('page', pageParam + 1)}
                  className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setIsDialogOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h2 className="text-base font-bold text-neutral-900">{activeReel ? 'Edit Reel' : 'Create Reel'}</h2>
              <button onClick={() => setIsDialogOpen(false)} className="p-1 hover:bg-neutral-100 rounded"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Name</label>
                <input className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-xs" {...register('name')} />
                {errors.name && <p className="text-[9px] text-red-650 mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Slug</label>
                  <input className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-xs" {...register('slug')} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Duration (sec)</label>
                  <input type="number" className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-xs" {...register('duration', { valueAsNumber: true })} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Description</label>
                <textarea rows={3} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-xs resize-none" {...register('description')} />
              </div>

              {/* Video Upload with Progress */}
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Video File</label>
                <div className="mt-1 flex items-center gap-3">
                  <label className="cursor-pointer bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-100 flex items-center gap-2">
                    <UploadCloud className="w-4 h-4" />
                    {videoUploading ? `Uploading ${videoProgress}%` : 'Upload Video'}
                    <input type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={handleVideoUpload} disabled={videoUploading} />
                  </label>
                  {watch('videoUrl') && (
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-neutral-400 truncate max-w-[200px]">{watch('videoUrl')?.split('/').pop()}</span>
                      <button type="button" onClick={() => copyToClipboard(watch('videoUrl')!)} className="text-blue-600"><Copy className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>
                {videoUploading && (
                  <div className="mt-2 bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-neutral-900 h-full rounded-full transition-all duration-300" style={{ width: `${videoProgress}%` }} />
                  </div>
                )}
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Thumbnail Image</label>
                <div className="mt-1 flex items-center gap-3">
                  <label className="cursor-pointer bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-100 flex items-center gap-2">
                    <UploadCloud className="w-4 h-4" />
                    {thumbUploading ? 'Uploading...' : 'Upload Thumbnail'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleThumbUpload} disabled={thumbUploading} />
                  </label>
                  {watch('thumbnailUrl') && <img src={watch('thumbnailUrl')} alt="" className="w-10 h-12 object-cover rounded border" />}
                </div>
              </div>

              {/* Product Manager */}
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Tagged Products</label>
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input placeholder="Search products..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none"
                  />
                </div>
                {productSearch.length >= 2 && productResults?.data && (
                  <div className="max-h-32 overflow-y-auto border border-neutral-200 rounded-lg mb-2">
                    {productResults.data.filter((p: any) => !selectedProducts.find(sp => sp.id === p.id)).slice(0, 10).map((p: any) => (
                      <button key={p.id} type="button" onClick={() => setSelectedProducts(prev => [...prev, p])}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-50 flex items-center gap-2 border-b border-neutral-100 last:border-0">
                        {p.primaryImageUrl && <img src={p.primaryImageUrl} alt="" className="w-6 h-6 object-cover rounded" />}
                        <span className="font-medium">{p.name}</span>
                        <span className="text-neutral-400 ml-auto">{p.basePrice ? `$${Number(p.basePrice).toFixed(2)}` : ''}</span>
                      </button>
                    ))}
                    {productResults.data.filter((p: any) => !selectedProducts.find(sp => sp.id === p.id)).length === 0 && (
                      <p className="px-3 py-2 text-[10px] text-neutral-400">All matching products already selected.</p>
                    )}
                  </div>
                )}
                {selectedProducts.length > 0 && (
                  <div className="space-y-1.5">
                    {selectedProducts.map((p, i) => (
                      <div key={p.id} className="flex items-center gap-2 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-200">
                        {p.primaryImageUrl && <img src={p.primaryImageUrl} alt="" className="w-8 h-8 object-cover rounded" />}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{p.name}</div>
                          <div className="text-[9px] text-neutral-400">{p.basePrice ? `$${Number(p.basePrice).toFixed(2)}` : ''}{(p as any).status ? ` · ${(p as any).status}` : ''}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-neutral-400 w-4 text-center">{i + 1}</span>
                          {i > 0 && <button type="button" onClick={() => { const arr = [...selectedProducts]; [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; setSelectedProducts(arr); }} className="p-0.5 hover:bg-neutral-200 rounded"><span className="text-xs">▲</span></button>}
                          {i < selectedProducts.length - 1 && <button type="button" onClick={() => { const arr = [...selectedProducts]; [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; setSelectedProducts(arr); }} className="p-0.5 hover:bg-neutral-200 rounded"><span className="text-xs">▼</span></button>}
                          <button type="button" onClick={() => setSelectedProducts(prev => prev.filter(sp => sp.id !== p.id))} className="p-0.5 hover:bg-red-50 rounded text-red-500"><X className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Order</label>
                  <input type="number" className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-xs" {...register('displayOrder', { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Status</label>
                  <select className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-xs" {...register('status')}>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Visibility</label>
                  <select className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-xs" {...register('visibility')}>
                    <option value="PUBLIC">Public</option>
                    <option value="HIDDEN">Hidden</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Start Date</label>
                  <input type="date" className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-xs" {...register('startDate')} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">End Date</label>
                  <input type="date" className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-xs" {...register('endDate')} />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                {[{ key: 'featured', label: 'Featured' }, { key: 'autoPlay', label: 'Auto Play' }, { key: 'muted', label: 'Muted' }, { key: 'loop', label: 'Loop' }].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-xs font-medium text-neutral-600">
                    <input type="checkbox" className="h-4 w-4 rounded border-neutral-300" {...register(key as any)} />
                    {label}
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-600">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs disabled:opacity-55 flex items-center gap-2">
                  {isSubmitting && <ButtonLoader />} {activeReel ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      {previewReel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPreviewReel(null)}>
          <div className="bg-black rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {previewReel.videoUrl ? (
              <video src={previewReel.videoUrl} controls autoPlay muted loop={previewReel.loop} playsInline
                poster={previewReel.thumbnailUrl || undefined}
                className="w-full aspect-[9/16] object-cover bg-black"
              />
            ) : (
              <div className="w-full aspect-[9/16] flex items-center justify-center bg-neutral-900">
                <Video className="w-12 h-12 text-neutral-600" />
              </div>
            )}
            <div className="p-4 bg-white">
              <h3 className="text-sm font-bold">{previewReel.name}</h3>
              {previewReel.description && <p className="text-xs text-neutral-500 mt-1">{previewReel.description}</p>}
              <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-400">
                <span>{previewReel.duration ? `${previewReel.duration}s` : '-'}</span>
                <span>{previewReel.viewCount} views</span>
                <span>{previewReel.playCount} plays</span>
              </div>
              {previewReel.products && previewReel.products.length > 0 && (
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Products in reel</p>
                  <div className="flex flex-wrap gap-2">
                    {previewReel.products.map((p: any) => (
                      <div key={p.productId} className="flex items-center gap-1.5 bg-neutral-50 rounded-lg px-2 py-1">
                        <span className="text-xs">{p.productName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Dialog */}
      {analyticsReel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setAnalyticsReel(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-neutral-200">
              <h2 className="text-base font-bold text-neutral-900">Reel Analytics</h2>
              <button onClick={() => setAnalyticsReel(null)} className="p-1 hover:bg-neutral-100 rounded"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-5">
              {analyticsData ? (
                <>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Views', value: analyticsData.summary.totalViews },
                      { label: 'Plays', value: analyticsData.summary.totalPlays },
                      { label: 'CTR', value: `${(analyticsData.summary.averageConversionRate * 100).toFixed(1)}%` },
                      { label: 'Orders', value: analyticsData.summary.totalOrdersGenerated },
                      { label: 'Clicks', value: analyticsData.summary.totalProductClicks },
                      { label: 'Wishlists', value: analyticsData.summary.totalWishlistClicks },
                      { label: 'Cart Adds', value: analyticsData.summary.totalCartClicks },
                      { label: 'Revenue', value: `$${analyticsData.summary.totalOrdersGenerated * 50}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-neutral-50 rounded-xl p-3 text-center border border-neutral-200">
                        <div className="text-lg font-bold text-neutral-900">{value.toLocaleString?.() ?? value}</div>
                        <div className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                  {analyticsData.daily && analyticsData.daily.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-3">Daily Views</h3>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analyticsData.daily.slice(-30)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v: string) => v.slice(5, 10)} />
                            <YAxis tick={{ fontSize: 9 }} />
                            <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                            <Bar dataKey="views" fill="#8B5A6B" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <SectionLoader message="Loading analytics..." />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmAction(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-neutral-900">{confirmAction.title}</h3>
            <p className="text-xs text-neutral-500 mt-2">{confirmAction.message}</p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-600">Cancel</button>
              <button onClick={async () => { await confirmAction.onConfirm(); setConfirmAction(null); refetch(); }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl text-xs">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useBanners, useCreateBanner, useUpdateBanner, useDeleteBanner, useCloneBanner } from '@/features/banners/banner.hooks';
import { BannerResponse } from '@/features/banners/banner.types';
import { SectionLoader, PageError, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { Search, Plus, Trash2, Edit3, X, Copy, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDate } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';
import { mediaService } from '@/features/catalog/media/media.service';

// Zod schemas
const bannerSchema = z.object({
  title: z.string().min(2, 'Title is too short').max(100),
  description: z.string().max(200).optional(),
  imageUrl: z.string().url('Must be valid image URL'),
  linkUrl: z.string().url('Must be valid destination URL').optional().or(z.literal('')),
  placement: z.string().min(2, 'Placement key is required'),
  displayOrder: z.number().int().min(0),
  isActive: z.boolean(),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof bannerSchema>;

export default function BannersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // URL States
  const pageParam = parseInt(searchParams.get('page') || '1');
  const placement = searchParams.get('placement') || '';

  // Queries
  const { data: listData, isLoading, isError, refetch } = useBanners({
    page: pageParam,
    limit: 10,
    placement: placement || undefined,
  });

  const [activeBanner, setActiveBanner] = useState<BannerResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const deleteMut = useDeleteBanner();
  const cloneMut = useCloneBanner();

  const handleClone = async (id: string, title: string) => {
    try {
      await cloneMut.mutateAsync(id);
      toast.success(`Cloned "${title}"`);
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message
        : getApiErrorMessage(err);
      toast.error(message || 'Failed to clone banner');
    }
  };

  const updateQuery = (key: string, value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value.toString());
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/admin/banners?${params.toString()}`);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete banner "${title}"?`)) return;
    try {
      await deleteMut.mutateAsync(id);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const isEditor = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));
  const isSuperAdmin = user?.roles?.includes('super_admin');

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Banner Advertisements</h1>
          <p className="text-xs text-neutral-400 mt-1">Configure layout banners, carousels, or flash sale promotions across the catalog.</p>
        </div>
        {isEditor && (
          <button
            onClick={() => {
              setActiveBanner(null);
              setIsDialogOpen(true);
            }}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Banner
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-neutral-500 font-sans">Filters:</span>
        </div>
        <div className="flex gap-3 w-full md:w-auto justify-end">
          <select
            value={placement}
            onChange={(e) => updateQuery('placement', e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none"
          >
            <option value="">All Placements</option>
            <option value="HOMEPAGE_HERO">HOMEPAGE HERO</option>
            <option value="PROMO_BANNER">PROMO BANNER</option>
            <option value="CATALOG_TOP">CATALOG TOP</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <SectionLoader message="Retrieving banners queue..." />
      ) : isError ? (
        <PageError title="Connection Failure" message="Could not fetch banners from server." retry={refetch} />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Media</th>
                  <th className="p-4">Title & Description</th>
                  <th className="p-4">Placement</th>
                  <th className="p-4 text-center">Display Order</th>
                  <th className="p-4">Schedule Range</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {listData?.data?.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4">
                      {b.imageUrl ? (
                        <img src={b.imageUrl} alt={b.title} className="w-16 h-10 object-cover rounded border border-neutral-200" />
                      ) : (
                        <div className="w-16 h-10 bg-neutral-100 flex items-center justify-center rounded border border-neutral-200">
                          <ImageIcon className="w-4 h-4 text-neutral-400" />
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-neutral-900">{b.title}</div>
                      <div className="text-[10px] text-neutral-400 max-w-[200px] truncate">{b.description || 'No description'}</div>
                      {b.linkUrl && <div className="text-[9px] text-neutral-500 font-mono underline break-all">{b.linkUrl}</div>}
                    </td>
                    <td className="p-4 uppercase tracking-wider text-2xs font-semibold text-neutral-600">{b.placement}</td>
                    <td className="p-4 text-center font-semibold">{b.displayOrder}</td>
                    <td className="p-4 text-neutral-500">
                      {b.startDate ? (
                        <div>
                          <div className="font-medium">Start: {formatDate(b.startDate)}</div>
                          {b.endDate && <div className="text-[10px] text-neutral-400">End: {formatDate(b.endDate)}</div>}
                        </div>
                      ) : (
                        <span className="text-neutral-350 italic">Always Active</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase
                        ${b.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-neutral-100 text-neutral-500'}
                      `}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {isEditor && (
                          <button
                            onClick={() => {
                              setActiveBanner(b);
                              setIsDialogOpen(true);
                            }}
                            className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600 hover:text-neutral-900"
                            title="Edit banner"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {isSuperAdmin && (
                          <>
                            <button
                              onClick={() => handleClone(b.id, b.title)}
                              className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600 hover:text-neutral-900"
                              title="Clone banner"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(b.id, b.title)}
                              className="p-1.5 hover:bg-red-50 rounded text-red-650 hover:text-red-800"
                              title="Delete banner"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!listData?.data || listData.data.length === 0) && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-neutral-400 font-medium">
                      No banner assets defined.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {listData?.meta && listData.meta.totalPages > 1 && (
            <div className="bg-neutral-50 p-4 border-t border-neutral-200 flex justify-between items-center">
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

      {/* Create / Edit Modal */}
      {isDialogOpen && (
        <BannerDialog
          banner={activeBanner}
          onClose={() => {
            setIsDialogOpen(false);
            setActiveBanner(null);
          }}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}

// Dialog
function BannerDialog({ banner, onClose, onSuccess }: { banner: BannerResponse | null; onClose: () => void; onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);
  
  // S3 upload progress states
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const createMut = useCreateBanner();
  const updateMut = useUpdateBanner();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: banner?.title || '',
      description: banner?.description || '',
      imageUrl: banner?.imageUrl || '',
      linkUrl: banner?.linkUrl || '',
      placement: banner?.placement || 'HOMEPAGE_HERO',
      displayOrder: banner?.displayOrder || 0,
      isActive: banner?.isActive ?? true,
      startDate: banner?.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : '',
      endDate: banner?.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : '',
    },
  });

  const watchedImageUrl = watch('imageUrl');

  const handleS3Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local validation
    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size cannot exceed 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      // Step 1: Request presigned S3 url under banners mock ID path
      const { uploadUrl, url } = await mediaService.getUploadUrl('banners', 'IMAGE', ext);
      
      // Step 2: Upload file binary directly to S3
      await mediaService.uploadToS3(uploadUrl, file, (pct) => {
        setUploadProgress(pct);
      });

      // Step 3: Populate Form values
      setValue('imageUrl', url, { shouldValidate: true });
    } catch (err: unknown) {
      console.error(err);
      setError('S3 Upload failed. Check storage settings.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const payload = {
        ...values,
        linkUrl: values.linkUrl || undefined,
        startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
        endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
      };

      if (banner) {
        await updateMut.mutateAsync({ id: banner.id, dto: payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message
        : getApiErrorMessage(err);
      setError(message || 'Failed to save banner');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 max-h-[90vh] overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900">{banner ? 'Edit Banner Advertisement' : 'Create Banner Advertisement'}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-2.5 text-2xs text-red-650 font-semibold">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 text-xs">
          {/* Banner Title */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Banner Title</label>
            <input
              type="text"
              {...register('title')}
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            />
            {errors.title && <p className="text-[9px] text-red-650 mt-1">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Description (Optional)</label>
            <input
              type="text"
              {...register('description')}
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            />
          </div>

          {/* S3 File Upload Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Banner Image Asset</label>
            
            {watchedImageUrl && (
              <div className="relative border border-neutral-200 rounded-xl overflow-hidden mb-2 bg-neutral-50 p-2 flex items-center gap-3">
                <img src={watchedImageUrl} alt="preview" className="w-16 h-10 object-cover rounded border border-neutral-200" />
                <div className="text-[10px] text-neutral-400 truncate max-w-[200px] font-mono">{watchedImageUrl}</div>
              </div>
            )}

            <div className="flex gap-2 items-center">
              <label className="bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 font-bold py-1.5 px-3 rounded-lg text-2xs flex items-center gap-1.5 cursor-pointer">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Image directly to S3</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleS3Upload}
                  className="hidden"
                />
              </label>
              {isUploading && uploadProgress !== null && (
                <span className="text-[10px] text-neutral-500 font-semibold">Uploading: {uploadProgress}%</span>
              )}
            </div>
            {/* hidden field to bind URL to form */}
            <input type="hidden" {...register('imageUrl')} />
            {errors.imageUrl && <p className="text-[9px] text-red-650 mt-1">{errors.imageUrl.message}</p>}
          </div>

          {/* Link URL */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Target Link URL (Optional)</label>
            <input
              type="text"
              {...register('linkUrl')}
              placeholder="e.g. https://store.com/collections/dresses"
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none font-mono"
            />
            {errors.linkUrl && <p className="text-[9px] text-red-650 mt-1">{errors.linkUrl.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Placement Key</label>
              <select
                {...register('placement')}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 focus:outline-none"
              >
                <option value="HOMEPAGE_HERO">HOMEPAGE HERO</option>
                <option value="PROMO_BANNER">PROMO BANNER</option>
                <option value="CATALOG_TOP">CATALOG TOP</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Display Order</label>
              <input
                type="number"
                {...register('displayOrder', { valueAsNumber: true })}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              />
            </div>
          </div>

          {/* Date ranges */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
            <div>
              <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Start Date (Optional)</label>
              <input
                type="date"
                {...register('startDate')}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider">End Date (Optional)</label>
              <input
                type="date"
                {...register('endDate')}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center pt-2 border-t border-neutral-100">
            <input
              type="checkbox"
              {...register('isActive')}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            />
            <label className="ml-2 block text-2xs font-bold text-neutral-500 uppercase tracking-wider">Active Visibility</label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm disabled:opacity-55 flex items-center"
            >
              {(isSubmitting || isUploading) && <ButtonLoader />} {banner ? 'Save Changes' : 'Create Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

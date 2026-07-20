'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCmsPages, useCreateCmsPage, useUpdateCmsPage, useCloneCmsPage } from '@/features/cms/cms.hooks';
import { CmsPageResponse } from '@/features/cms/cms.types';
import { SectionLoader, PageError, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { Search, Plus, Eye, Edit3, X, Copy } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDate } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

// Zod schemas
const pageSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(100).regex(/^[a-z0-9_-]+$/, 'Lowercase letters, numbers, dash/underscore only'),
  content: z.string().optional(),
  metaTitle: z.string().max(80).optional(),
  metaDescription: z.string().max(200).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']),
});

type FormValues = z.infer<typeof pageSchema>;

export default function CmsPagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // URL States
  const pageParam = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  const [localSearch, setLocalSearch] = useState(search);
  const [activePage, setActivePage] = useState<CmsPageResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Queries
  const { data: listData, isLoading, isError, refetch } = useCmsPages({
    page: pageParam,
    limit: 10,
    search: search || undefined,
    status: status || undefined,
  });

  const updateQuery = (key: string, value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value.toString());
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/admin/cms/pages?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery('search', localSearch);
  };

  const cloneMut = useCloneCmsPage();
  const handleClone = async (id: string, title: string) => {
    try {
      await cloneMut.mutateAsync(id);
      toast.success(`Cloned "${title}"`);
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message
        : getApiErrorMessage(err);
      toast.error(message || 'Failed to clone page');
    }
  };

  const isEditor = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">CMS Pages</h1>
          <p className="text-xs text-neutral-400 mt-1">Design, edit, and publish content articles, legal terms, or static site disclosures.</p>
        </div>
        {isEditor && (
          <button
            onClick={() => {
              setActivePage(null);
              setIsDialogOpen(true);
            }}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create CMS Page
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by title or slug..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex gap-3 w-full md:w-auto justify-end">
          <select
            value={status}
            onChange={(e) => updateQuery('status', e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <SectionLoader message="Retrieving CMS pages directory..." />
      ) : isError ? (
        <PageError title="Connection Failure" message="Could not fetch pages from database." retry={refetch} />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Title</th>
                  <th className="p-4">Slug Path</th>
                  <th className="p-4">Meta Title / SEO</th>
                  <th className="p-4">Last Updated</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {listData?.data?.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-bold text-neutral-900">{p.title}</td>
                    <td className="p-4 font-mono text-[10px] text-neutral-500">/pages/{p.slug}</td>
                    <td className="p-4">
                      <div className="font-semibold text-neutral-800 max-w-[200px] truncate">{p.metaTitle || 'No meta title'}</div>
                      <div className="text-[10px] text-neutral-400 max-w-[200px] truncate">{p.metaDescription || 'No description'}</div>
                    </td>
                    <td className="p-4 text-neutral-600">{formatDate(p.createdAt)}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase
                        ${p.status === 'PUBLISHED' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}
                      `}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {isEditor && (
                          <>
                            <button
                              onClick={() => {
                                setActivePage(p);
                                setIsDialogOpen(true);
                              }}
                              className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600 hover:text-neutral-900"
                              title="Edit page setting & metadata"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleClone(p.id, p.title)}
                              className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600 hover:text-neutral-900"
                              title="Clone page"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!listData?.data || listData.data.length === 0) && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-400 font-medium">
                      No CMS pages in directory.
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

      {/* Editor Modal */}
      {isDialogOpen && (
        <CmsPageDialog
          page={activePage}
          onClose={() => {
            setIsDialogOpen(false);
            setActivePage(null);
          }}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}

// Editor dialog
function CmsPageDialog({ page, onClose, onSuccess }: { page: CmsPageResponse | null; onClose: () => void; onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);
  
  const createMut = useCreateCmsPage();
  const updateMut = useUpdateCmsPage();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      title: page?.title || '',
      slug: page?.slug || '',
      content: page?.content || '',
      metaTitle: page?.metaTitle || '',
      metaDescription: page?.metaDescription || '',
      status: (page?.status || 'DRAFT') as 'DRAFT' | 'PUBLISHED',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      if (page) {
        await updateMut.mutateAsync({ id: page.id, dto: values });
      } else {
        await createMut.mutateAsync(values);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message
        : getApiErrorMessage(err);
      setError(message || 'Failed to save page');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 max-h-[90vh] overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900">{page ? 'Edit CMS Page' : 'Create CMS Page'}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-650 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Page Title</label>
              <input
                type="text"
                {...register('title')}
                onChange={(e) => {
                  register('title').onChange(e);
                  if (!page) {
                    setValue('slug', e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
                  }
                }}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              />
              {errors.title && <p className="text-[10px] text-red-600 mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Slug Path</label>
              <input
                type="text"
                {...register('slug')}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none font-mono"
              />
              {errors.slug && <p className="text-[10px] text-red-600 mt-1">{errors.slug.message}</p>}
            </div>
          </div>

          {/* Page content rich text area */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">HTML/Markdown Content</label>
            <textarea
              {...register('content')}
              rows={8}
              placeholder="Write raw content markup here..."
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 focus:outline-none font-mono"
            />
          </div>

          <div className="border-t border-neutral-100 pt-3 space-y-3">
            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">SEO Attributes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Meta Title</label>
                <input
                  type="text"
                  {...register('metaTitle')}
                  placeholder="e.g. Terms and Conditions | Vasanthi Designers"
                  className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Meta Description</label>
                <input
                  type="text"
                  {...register('metaDescription')}
                  placeholder="Brief description for search engines results..."
                  className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-100 pt-3 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Publish Status</label>
              <select
                {...register('status')}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="PUBLISHED">PUBLISHED</option>
              </select>
            </div>
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
              disabled={isSubmitting}
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm disabled:opacity-55 flex items-center"
            >
              {isSubmitting && <ButtonLoader />} {page ? 'Save Changes' : 'Create Page'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

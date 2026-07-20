'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFaqs, useCreateFaq, useUpdateFaq, useDeleteFaq } from '@/features/faqs/faq.hooks';
import { FaqResponse } from '@/features/faqs/faq.types';
import { SectionLoader, PageError, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { Search, Plus, Trash2, Edit3, X, HelpCircle, ThumbsUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDate } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';

// Zod schemas
const faqSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters').max(200),
  answer: z.string().min(5, 'Answer must be at least 5 characters'),
  category: z.string().min(2, 'Category name is required').max(50),
  displayOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof faqSchema>;

export default function FaqsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // URL States
  const pageParam = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  const [localSearch, setLocalSearch] = useState(search);
  const [activeFaq, setActiveFaq] = useState<FaqResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Queries
  const { data: listData, isLoading, isError, refetch } = useFaqs({
    page: pageParam,
    limit: 10,
    search: search || undefined,
    category: category || undefined,
  });

  const deleteMut = useDeleteFaq();

  const updateQuery = (key: string, value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value.toString());
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/admin/faqs?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery('search', localSearch);
  };

  const handleDelete = async (id: string, question: string) => {
    if (!window.confirm(`Are you sure you want to delete FAQ "${question}"?`)) return;
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
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Frequently Asked Questions</h1>
          <p className="text-xs text-neutral-400 mt-1">Manage public user FAQs, group categories, and track customer helpful counts.</p>
        </div>
        {isEditor && (
          <button
            onClick={() => {
              setActiveFaq(null);
              setIsDialogOpen(true);
            }}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create FAQ
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
            placeholder="Search by question or answer..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex gap-3 w-full md:w-auto justify-end">
          <select
            value={category}
            onChange={(e) => updateQuery('category', e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="General">General</option>
            <option value="Shipping">Shipping</option>
            <option value="Returns">Returns</option>
            <option value="Payment">Payment</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <SectionLoader message="Retrieving FAQs database..." />
      ) : isError ? (
        <PageError title="Connection Failure" message="Could not fetch FAQs from server." retry={refetch} />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">FAQ Question & Category</th>
                  <th className="p-4">FAQ Answer</th>
                  <th className="p-4 text-center">Display Order</th>
                  <th className="p-4 text-center">Helpful Clicks</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {listData?.data?.map((faq) => (
                  <tr key={faq.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-neutral-900">{faq.question}</div>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-150 text-neutral-600 text-[9px] font-bold uppercase tracking-wider">
                        {faq.category || 'General'}
                      </span>
                    </td>
                    <td className="p-4 text-neutral-600 max-w-[300px] truncate">{faq.answer}</td>
                    <td className="p-4 text-center font-semibold">{faq.displayOrder}</td>
                    <td className="p-4 text-center font-mono text-neutral-800">
                      <span className="inline-flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5 text-neutral-400" />
                        {faq.helpfulCount}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase
                        ${faq.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-neutral-100 text-neutral-500'}
                      `}>
                        {faq.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {isEditor && (
                          <button
                            onClick={() => {
                              setActiveFaq(faq);
                              setIsDialogOpen(true);
                            }}
                            className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600 hover:text-neutral-900"
                            title="Edit FAQ"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDelete(faq.id, faq.question)}
                            className="p-1.5 hover:bg-red-50 rounded text-red-650 hover:text-red-800"
                            title="Delete FAQ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!listData?.data || listData.data.length === 0) && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-400 font-medium">
                      No FAQs found.
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
        <FaqDialog
          faq={activeFaq}
          onClose={() => {
            setIsDialogOpen(false);
            setActiveFaq(null);
          }}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}

// Dialog helper
function FaqDialog({ faq, onClose, onSuccess }: { faq: FaqResponse | null; onClose: () => void; onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);

  const createMut = useCreateFaq();
  const updateMut = useUpdateFaq();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: faq?.question || '',
      answer: faq?.answer || '',
      category: faq?.category || 'General',
      displayOrder: faq?.displayOrder || 0,
      isActive: faq?.isActive ?? true,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      if (faq) {
        await updateMut.mutateAsync({ id: faq.id, dto: values });
      } else {
        await createMut.mutateAsync(values);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message
        : getApiErrorMessage(err);
      setError(message || 'Failed to save FAQ');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900">{faq ? 'Edit FAQ Article' : 'Create FAQ Article'}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-2.5 text-2xs text-red-650 font-semibold">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 text-xs">
          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Category</label>
            <select
              {...register('category')}
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="General">General</option>
              <option value="Shipping">Shipping</option>
              <option value="Returns">Returns</option>
              <option value="Payment">Payment</option>
            </select>
          </div>

          {/* Question */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Question</label>
            <input
              type="text"
              {...register('question')}
              placeholder="e.g. How long does standard delivery take?"
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            />
            {errors.question && <p className="text-[9px] text-red-655 mt-1">{errors.question.message}</p>}
          </div>

          {/* Answer */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Detailed Answer</label>
            <textarea
              {...register('answer')}
              rows={4}
              placeholder="Provide a clear, structured customer response..."
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 focus:outline-none resize-none"
            />
            {errors.answer && <p className="text-[9px] text-red-655 mt-1">{errors.answer.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Display Order</label>
              <input
                type="number"
                {...register('displayOrder', { valueAsNumber: true })}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              />
            </div>
            <div className="flex items-center pt-5 pl-2">
              <input
                type="checkbox"
                {...register('isActive')}
                className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
              />
              <label className="ml-2 block text-2xs font-bold text-neutral-500 uppercase tracking-wider">Active Visibility</label>
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
              {isSubmitting && <ButtonLoader />} {faq ? 'Save Changes' : 'Create FAQ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

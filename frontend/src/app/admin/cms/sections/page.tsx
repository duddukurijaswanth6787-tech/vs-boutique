'use client';

import React, { useState } from 'react';
import { useCmsSections, useCreateCmsSection } from '@/features/cms/cms.hooks';
import { SectionLoader, PageError, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { Plus, Sliders, Database, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDate } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';

// Zod schema
const sectionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(100).regex(/^[a-z0-9_-]+$/, 'Lowercase, numbers, dash/underscore only'),
  type: z.string().min(2, 'Type must be at least 2 characters'),
  contentJson: z.string().refine(val => {
    try {
      if (!val) return true;
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, 'Must be valid JSON string'),
  displayOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof sectionSchema>;

export default function CmsSectionsPage() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Queries
  const { data: sections, isLoading, isError, refetch } = useCmsSections();

  const isEditor = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">CMS Layout Sections</h1>
          <p className="text-xs text-neutral-400 mt-1">Manage modular sections on homepage feeds, header carousels, or customized shop displays.</p>
        </div>
        {isEditor && (
          <button
            onClick={() => setIsDialogOpen(true)}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create CMS Section
          </button>
        )}
      </div>

      {/* Table Content */}
      {isLoading ? (
        <SectionLoader message="Retrieving CMS sections database..." />
      ) : isError ? (
        <PageError title="Connection Failure" message="Could not fetch layout sections from backend." retry={refetch} />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Name</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-center">Display Order</th>
                  <th className="p-4">JSON Content Payload Preview</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {sections?.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-bold text-neutral-900">{s.name}</td>
                    <td className="p-4 font-mono text-[10px] text-neutral-500">{s.slug}</td>
                    <td className="p-4 uppercase tracking-wider text-2xs font-semibold text-neutral-600">{s.type}</td>
                    <td className="p-4 text-center font-semibold">{s.displayOrder}</td>
                    <td className="p-4 font-mono text-[10px] text-neutral-400 max-w-[250px] truncate">
                      {s.content ? JSON.stringify(s.content) : 'No payload'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase
                        ${s.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-neutral-100 text-neutral-500'}
                      `}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!sections || sections.length === 0) && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-400 font-medium">
                      No layout sections defined.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Section Dialog */}
      {isDialogOpen && (
        <CmsSectionDialog
          onClose={() => setIsDialogOpen(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}

// Inner helper component to add layout section
function CmsSectionDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const createMut = useCreateCmsSection();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      name: '',
      slug: '',
      type: '',
      contentJson: '{}',
      displayOrder: 0,
      isActive: true,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const payload = {
        name: values.name,
        slug: values.slug,
        type: values.type,
        content: values.contentJson ? JSON.parse(values.contentJson) : undefined,
        displayOrder: values.displayOrder,
        isActive: values.isActive,
      };
      await createMut.mutateAsync(payload);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message
        : getApiErrorMessage(err);
      setError(message || 'Failed to create section');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900">Add Layout Section</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-2.5 text-2xs text-red-650 font-semibold">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Section Name</label>
            <input
              type="text"
              {...register('name')}
              onChange={(e) => {
                register('name').onChange(e);
                setValue('slug', e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
              }}
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            />
            {errors.name && <p className="text-[9px] text-red-600 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Slug</label>
              <input
                type="text"
                {...register('slug')}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none font-mono"
              />
              {errors.slug && <p className="text-[9px] text-red-600 mt-1">{errors.slug.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Type</label>
              <input
                type="text"
                {...register('type')}
                placeholder="e.g. CAROUSEL, GRID"
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              />
              {errors.type && <p className="text-[9px] text-red-600 mt-1">{errors.type.message}</p>}
            </div>
          </div>

          {/* JSON Payload field */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">JSON Content Payload</label>
            <textarea
              {...register('contentJson')}
              rows={4}
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 focus:outline-none font-mono"
            />
            {errors.contentJson && <p className="text-[9px] text-red-600 mt-1">{errors.contentJson.message}</p>}
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
              <label className="ml-2 block text-2xs font-bold text-neutral-500 uppercase tracking-wider">Active Status</label>
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
              {isSubmitting && <ButtonLoader />} Add Section
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

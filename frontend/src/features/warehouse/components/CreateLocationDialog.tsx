'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';
import { useCreateWarehouseLocation } from '../warehouse.hooks';
import { ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const schema = z.object({
  zone: z.string().max(20).optional(),
  rack: z.string().max(20).optional(),
  shelf: z.string().max(20).optional(),
  bin: z.string().max(20).optional(),
  description: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreateLocationDialogProps {
  warehouseId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateLocationDialog({ warehouseId, onClose, onSuccess }: CreateLocationDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const createMut = useCreateWarehouseLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      zone: '',
      rack: '',
      shelf: '',
      bin: '',
      description: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await createMut.mutateAsync({ warehouseId, dto: values });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error
        ? getApiErrorMessage(err) || err.message
        : String(err);
      setError(msg || 'Failed to create location');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900">Add Warehouse Location</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Zone */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Zone</label>
              <input
                type="text"
                {...register('zone')}
                placeholder="e.g. Zone A"
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
              />
            </div>
            {/* Rack */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Rack</label>
              <input
                type="text"
                {...register('rack')}
                placeholder="e.g. Rack 04"
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
              />
            </div>
            {/* Shelf */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Shelf</label>
              <input
                type="text"
                {...register('shelf')}
                placeholder="e.g. Shelf 02"
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
              />
            </div>
            {/* Bin */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Bin</label>
              <input
                type="text"
                {...register('bin')}
                placeholder="e.g. Bin B3"
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Description</label>
            <input
              type="text"
              {...register('description')}
              placeholder="e.g. Bulky items storage, hanger section"
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
            />
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
              {isSubmitting && <ButtonLoader />} Add Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

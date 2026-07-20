'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';
import { useCreateWarehouse, useUpdateWarehouse } from '../warehouse.hooks';
import { WarehouseResponse } from '../warehouse.types';
import { ButtonLoader } from '@/components/feedback/FeedbackStates';

const schema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(20, 'Code cannot exceed 20 characters').regex(/^[A-Z0-9_-]+$/, 'Only capital letters, numbers, underscore, or dash allowed'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().max(200).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  contactPerson: z.string().max(100).optional(),
  phone: z.string().max(25).optional(),
  email: z.string().email('Invalid email format').or(z.literal('')).optional(),
  isDefault: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface WarehouseDialogProps {
  warehouse?: WarehouseResponse;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WarehouseDialog({ warehouse, onClose, onSuccess }: WarehouseDialogProps) {
  const [error, setError] = useState<string | null>(null);
  
  const createMut = useCreateWarehouse();
  const updateMut = useUpdateWarehouse();

  const isEdit = !!warehouse;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: warehouse?.code || '',
      name: warehouse?.name || '',
      description: warehouse?.description || '',
      address: warehouse?.address || '',
      city: warehouse?.city || '',
      state: warehouse?.state || '',
      country: warehouse?.country || '',
      postalCode: warehouse?.postalCode || '',
      contactPerson: warehouse?.contactPerson || '',
      phone: warehouse?.phone || '',
      email: warehouse?.email || '',
      isDefault: warehouse?.isDefault || false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      if (isEdit && warehouse) {
        // Exclude 'code' from update payload since it's immutable
        const { code, ...updateDto } = values;
        await updateMut.mutateAsync({ id: warehouse.id, dto: updateDto });
      } else {
        await createMut.mutateAsync(values);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : 'response' in (err as object) &&
              (err as { response?: { data?: { message?: string } } }).response?.data
                ?.message;
      setError(message || 'Failed to save warehouse');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 max-h-[90vh] overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900">
            {isEdit ? `Edit Warehouse: ${warehouse?.name}` : 'Create New Warehouse'}
          </h3>
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
          <div className="grid grid-cols-2 gap-4">
            {/* Code */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Warehouse Code</label>
              <input
                type="text"
                disabled={isEdit}
                {...register('code')}
                placeholder="e.g. WH-MUMBAI-01"
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900 disabled:opacity-50"
              />
              {errors.code && <p className="text-[10px] text-red-600 mt-1">{errors.code.message}</p>}
            </div>

            {/* Name */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Warehouse Name</label>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. Mumbai Main Hub"
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
              />
              {errors.name && <p className="text-[10px] text-red-600 mt-1">{errors.name.message}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Description</label>
            <input
              type="text"
              {...register('description')}
              placeholder="Brief details about stock type or region..."
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Contact Person */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Contact Person</label>
              <input
                type="text"
                {...register('contactPerson')}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
              />
            </div>
            {/* Phone */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Phone</label>
              <input
                type="text"
                {...register('phone')}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
              />
            </div>
            {/* Email */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Email</label>
              <input
                type="text"
                {...register('email')}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
              />
              {errors.email && <p className="text-[9px] text-red-600 mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div className="border-t border-neutral-100 pt-3">
            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Location & Address</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Street Address</label>
                <input
                  type="text"
                  {...register('address')}
                  className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">City</label>
                <input
                  type="text"
                  {...register('city')}
                  className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">State / Province</label>
                <input
                  type="text"
                  {...register('state')}
                  className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Country</label>
                <input
                  type="text"
                  {...register('country')}
                  className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Postal Code</label>
                <input
                  type="text"
                  {...register('postalCode')}
                  className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>
          </div>

          {/* Default */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('isDefault')}
                className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 focus:ring-offset-0"
              />
              <div>
                <span className="text-xs font-semibold text-neutral-700">Set as Default Warehouse</span>
                <p className="text-[10px] text-neutral-400">New products will have variant inventory allocated here by default</p>
              </div>
            </label>
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
              {isSubmitting && <ButtonLoader />} {isEdit ? 'Save Changes' : 'Create Warehouse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

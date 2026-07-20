'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUpdateInventory } from '../inventory.hooks';
import { InventoryResponse } from '../inventory.types';
import { ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import Dialog from '@/components/ui/Dialog';

const schema = z.object({
  minimumStock: z.number().int().min(0, 'Minimum stock must be at least 0'),
  maximumStock: z.number().int().min(0, 'Maximum stock must be at least 0'),
  reorderLevel: z.number().int().min(0, 'Reorder level must be at least 0'),
  allowBackorder: z.boolean(),
  trackInventory: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface UpdateInventoryDialogProps {
  inventory: InventoryResponse;
  onClose: () => void;
}

export default function UpdateInventoryDialog({ inventory, onClose }: UpdateInventoryDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const updateMut = useUpdateInventory();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      minimumStock: inventory.minimumStock || 0,
      maximumStock: inventory.maximumStock || 0,
      reorderLevel: inventory.reorderLevel || 0,
      allowBackorder: inventory.allowBackorder || false,
      trackInventory: inventory.trackInventory || false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await updateMut.mutateAsync({
        id: inventory.id,
        dto: values,
      });
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error
        ? getApiErrorMessage(err) || err.message
        : String(err);
      setError(msg || 'Failed to update settings');
    }
  };

  return (
    <Dialog open onClose={onClose} title="Inventory Settings" subtitle={`SKU: ${inventory.variant?.sku || inventory.variantId}`}>
      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-600 font-medium">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Minimum Stock */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Min Stock</label>
              <input
                type="number"
                {...register('minimumStock', { valueAsNumber: true })}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
              />
              {errors.minimumStock && <p className="text-[10px] text-red-600 mt-1">{errors.minimumStock.message}</p>}
            </div>

            {/* Maximum Stock */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Max Stock</label>
              <input
                type="number"
                {...register('maximumStock', { valueAsNumber: true })}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
              />
              {errors.maximumStock && <p className="text-[10px] text-red-600 mt-1">{errors.maximumStock.message}</p>}
            </div>
          </div>

          {/* Reorder Level */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Reorder Level</label>
            <input
              type="number"
              {...register('reorderLevel', { valueAsNumber: true })}
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
            />
            {errors.reorderLevel && <p className="text-[10px] text-red-600 mt-1">{errors.reorderLevel.message}</p>}
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('allowBackorder')}
                className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 focus:ring-offset-0"
              />
              <div>
                <span className="text-xs font-semibold text-neutral-700">Allow Backorders</span>
                <p className="text-[10px] text-neutral-400">Accept orders when stock is out of stock</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('trackInventory')}
                className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 focus:ring-offset-0"
              />
              <div>
                <span className="text-xs font-semibold text-neutral-700">Track Inventory</span>
                <p className="text-[10px] text-neutral-400">Enable automatic stock deductions on orders</p>
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
              {isSubmitting && <ButtonLoader />} Save Settings
            </button>
          </div>
        </form>
    </Dialog>
  );
}

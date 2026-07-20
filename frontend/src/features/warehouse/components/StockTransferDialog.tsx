'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, ArrowRight } from 'lucide-react';
import { useTransferWarehouseStock, useWarehouseList } from '../warehouse.hooks';
import { WarehouseInventoryResponse, WarehouseResponse } from '../warehouse.types';
import { ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const schema = z.object({
  fromWarehouseId: z.string().uuid('Source warehouse is invalid'),
  toWarehouseId: z.string().uuid('Please select a destination warehouse'),
  variantId: z.string().uuid('Please select a variant to transfer'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  reason: z.string().max(200).optional(),
}).refine(data => data.fromWarehouseId !== data.toWarehouseId, {
  message: 'Source and destination warehouses cannot be the same',
  path: ['toWarehouseId'],
});

type FormValues = z.infer<typeof schema>;

interface StockTransferDialogProps {
  sourceWarehouse: WarehouseResponse;
  sourceInventory: WarehouseInventoryResponse[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function StockTransferDialog({
  sourceWarehouse,
  sourceInventory,
  onClose,
  onSuccess,
}: StockTransferDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const transferMut = useTransferWarehouseStock();

  // Load destination warehouses
  const { data: warehousesData } = useWarehouseList({ limit: 100 });
  const destinations = warehousesData?.data?.filter(w => w.id !== sourceWarehouse.id && w.status === 'ACTIVE') || [];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fromWarehouseId: sourceWarehouse.id,
      toWarehouseId: '',
      variantId: '',
      quantity: 1,
      reason: '',
    },
  });

  const selectedVariantId = watch('variantId');
  const selectedInventory = sourceInventory.find(i => i.variantId === selectedVariantId);
  const maxAvailable = selectedInventory
    ? Math.max(0, selectedInventory.availableQuantity - selectedInventory.reservedQuantity)
    : 0;

  const onSubmit = async (values: FormValues) => {
    setError(null);
    if (values.quantity > maxAvailable) {
      setError(`Cannot transfer ${values.quantity} items. Only ${maxAvailable} available in source.`);
      return;
    }

    try {
      await transferMut.mutateAsync(values);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error
        ? getApiErrorMessage(err) || err.message
        : String(err);
      setError(msg || 'Failed to complete stock transfer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900">Inter-Warehouse Stock Transfer</h3>
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
          {/* Visual Route */}
          <div className="flex items-center justify-between bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-center">
            <div className="flex-1">
              <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Source</span>
              <span className="text-xs font-bold text-neutral-800">{sourceWarehouse.name}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-400 shrink-0 mx-2" />
            <div className="flex-1">
              <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Destination</span>
              <select
                {...register('toWarehouseId')}
                className="mt-1 bg-white border border-neutral-200 rounded-lg px-2 py-1 text-2xs text-neutral-800 font-bold focus:outline-none w-full"
              >
                <option value="">-- Choose --</option>
                {destinations.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {errors.toWarehouseId && <p className="text-[9px] text-red-600 mt-1">{errors.toWarehouseId.message}</p>}
            </div>
          </div>

          {/* Select Variant */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Select Variant to Transfer</label>
            <select
              {...register('variantId')}
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
            >
              <option value="">-- Select Variant --</option>
              {sourceInventory.map((item) => (
                <option key={item.id} value={item.variantId}>
                  {item.variant?.title || 'Unknown variant'} ({item.variant?.sku || item.variantId.substring(0, 8)})
                </option>
              ))}
            </select>
            {errors.variantId && <p className="text-[10px] text-red-600 mt-1">{errors.variantId.message}</p>}
          </div>

          {/* Available stock display */}
          {selectedVariantId && (
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Available Stock:</span>
                <span className="font-bold text-neutral-800">{selectedInventory?.availableQuantity}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-neutral-500">Reserved (Locked):</span>
                <span className="font-bold text-neutral-800">{selectedInventory?.reservedQuantity}</span>
              </div>
              <div className="flex justify-between mt-1 pt-1 border-t border-neutral-200 font-semibold">
                <span className="text-neutral-700">Effective Stock for Transfer:</span>
                <span className={`font-bold ${maxAvailable <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {maxAvailable}
                </span>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Transfer Quantity</label>
            <input
              type="number"
              disabled={maxAvailable <= 0}
              {...register('quantity', { valueAsNumber: true })}
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900 disabled:opacity-50"
            />
            {errors.quantity && <p className="text-[10px] text-red-600 mt-1">{errors.quantity.message}</p>}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Transfer Reason</label>
            <input
              type="text"
              {...register('reason')}
              placeholder="e.g. Stock balancing, regional purchase dispatch"
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
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
              disabled={isSubmitting || maxAvailable <= 0}
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm disabled:opacity-55 flex items-center"
            >
              {isSubmitting && <ButtonLoader />} Complete Stock Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

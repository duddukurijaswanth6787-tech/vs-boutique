'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';
import { useCreateReturn } from '../return.hooks';
import { OrderResponse } from '@/features/orders/order.types';
import { ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const schema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(200),
  items: z.array(
    z.object({
      selected: z.boolean(),
      orderItemId: z.string().uuid(),
      productName: z.string(),
      sku: z.string(),
      originalQuantity: z.number(),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
      reason: z.string().optional(),
    })
  ).refine(
    (items) => items.some((item) => item.selected),
    {
      message: 'Please select at least one item to return',
      path: [0], // associate with first item to display error
    }
  ),
});

type FormValues = z.infer<typeof schema>;

interface CreateReturnDialogProps {
  order: OrderResponse;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateReturnDialog({ order, onClose, onSuccess }: CreateReturnDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const createMut = useCreateReturn();

  const orderItems = order.items || [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      reason: '',
      items: orderItems.map((item) => ({
        selected: false,
        orderItemId: item.id,
        productName: item.productName,
        sku: item.sku,
        originalQuantity: item.quantity,
        quantity: 1,
        reason: '',
      })),
    },
  });

  const { fields } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items') || [];

  const onSubmit = async (values: FormValues) => {
    setError(null);
    const selectedItems = values.items.filter((item) => item.selected);
    
    // Cross-item quantity validation
    const invalidQtyItem = selectedItems.find(item => item.quantity > item.originalQuantity);
    if (invalidQtyItem) {
      setError(`Quantity for ${invalidQtyItem.productName} cannot exceed original ordered quantity (${invalidQtyItem.originalQuantity}).`);
      return;
    }

    try {
      const payload = {
        orderId: order.id,
        reason: values.reason,
        items: selectedItems.map((item) => ({
          orderItemId: item.orderItemId,
          quantity: item.quantity,
          reason: item.reason || undefined,
        })),
      };

      await createMut.mutateAsync(payload);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error
        ? getApiErrorMessage(err) || err.message
        : String(err);
      setError(msg || 'Failed to submit return request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 max-h-[90vh] overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Process Order Return</h3>
            <p className="text-[10px] text-neutral-400 mt-0.5">Order: {order.orderNumber}</p>
          </div>
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

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* General Return Reason */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Reason for Return</label>
            <input
              type="text"
              {...register('reason')}
              placeholder="e.g. Customer changed mind, sizing discrepancy, damaged on delivery"
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
            />
            {errors.reason && <p className="text-[10px] text-red-600 mt-1">{errors.reason.message}</p>}
          </div>

          {/* Items Selector */}
          <div className="space-y-3">
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Select Items to Return</label>
            {errors.items?.root && <p className="text-[10px] text-red-600 mb-2 font-semibold">{errors.items.root.message}</p>}
            
            <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100 overflow-hidden bg-neutral-50">
              {fields.map((field, index) => {
                const isSelected = watchedItems[index]?.selected;
                const maxQty = watchedItems[index]?.originalQuantity || 1;
                
                return (
                  <div key={field.id} className={`p-4 flex gap-3 items-start transition-colors ${isSelected ? 'bg-white' : ''}`}>
                    <input
                      type="checkbox"
                      {...register(`items.${index}.selected` as const)}
                      className="mt-1 h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 focus:ring-offset-0"
                    />
                    
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <span className="font-bold text-neutral-800 text-xs block truncate">{field.productName}</span>
                        <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">SKU: {field.sku}</span>
                        <span className="text-[10px] text-neutral-500 block">Ordered Quantity: {maxQty}</span>
                      </div>
                      
                      {isSelected && (
                        <div className="space-y-2">
                          <div className="flex gap-2 items-center">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase shrink-0">Qty:</label>
                            <input
                              type="number"
                              {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                              className="w-16 bg-neutral-50 border border-neutral-200 rounded px-2 py-1 text-xs focus:outline-none"
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="Item return notes (Optional)..."
                            {...register(`items.${index}.reason` as const)}
                            className="w-full bg-neutral-50 border border-neutral-200 rounded px-2 py-1 text-2xs focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
              {isSubmitting && <ButtonLoader />} Process Return Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

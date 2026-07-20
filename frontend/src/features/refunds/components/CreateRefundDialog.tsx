'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';
import { useCreateRefund } from '../refund.hooks';
import { ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const schema = z.object({
  amount: z.number().min(1, 'Refund amount must be at least ₹1'),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(200),
  method: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreateRefundDialogProps {
  paymentId: string;
  orderId: string;
  maxAmount: number;
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateRefundDialog({
  paymentId,
  orderId,
  maxAmount,
  currency,
  onClose,
  onSuccess,
}: CreateRefundDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const refundMut = useCreateRefund();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: maxAmount,
      reason: '',
      method: 'Razorpay',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    if (values.amount > maxAmount) {
      setError(`Refund amount cannot exceed captured payment amount: ${currency} ${maxAmount}`);
      return;
    }

    try {
      await refundMut.mutateAsync({
        paymentId,
        orderId,
        amount: values.amount,
        reason: values.reason,
        method: values.method || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error
        ? getApiErrorMessage(err) || err.message
        : String(err);
      setError(msg || 'Failed to request refund');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900">Issue Payment Refund</h3>
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
          <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-2xs text-amber-800 leading-normal">
            <span className="font-bold">Security Note:</span> Captured funds will be refunded using the payment provider gateway or recorded manually. Exceeding captured amount is restricted.
          </div>

          {/* Refund Amount */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Refund Amount</label>
            <input
              type="number"
              step="any"
              {...register('amount', { valueAsNumber: true })}
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
            />
            {errors.amount && <p className="text-[10px] text-red-600 mt-1">{errors.amount.message}</p>}
            <p className="text-[9px] text-neutral-400 mt-1">Maximum eligible refund: {currency} {maxAmount}</p>
          </div>

          {/* Refund Method */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Refund Method</label>
            <select
              {...register('method')}
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
            >
              <option value="Razorpay">Razorpay Gateway Refund</option>
              <option value="Manual Bank Transfer">Manual Bank Transfer</option>
              <option value="Store Credit">Store Credit / Wallet</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Refund Reason</label>
            <input
              type="text"
              {...register('reason')}
              placeholder="e.g. Defective item return, customer cancellation request"
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
            />
            {errors.reason && <p className="text-[10px] text-red-600 mt-1">{errors.reason.message}</p>}
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
              {isSubmitting && <ButtonLoader />} Confirm Refund
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

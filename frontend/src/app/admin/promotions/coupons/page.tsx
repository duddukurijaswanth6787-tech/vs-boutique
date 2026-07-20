'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCoupons, useCreateCoupon, useUpdateCoupon } from '@/features/coupons/coupon.hooks';
import { CouponResponse } from '@/features/coupons/coupon.types';
import { CouponType } from '@/features/coupons/coupon.types';
import { SectionLoader, PageError, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { Search, Plus, Edit3, X, Gift, Percent } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDate } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';

// Zod schema
const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(20).regex(/^[A-Z0-9_-]+$/, 'Uppercase alphanumeric characters only'),
  name: z.string().min(3, 'Name must be at least 3 characters').max(50),
  description: z.string().max(200).optional(),
  type: z.enum([CouponType.FLAT, CouponType.PERCENTAGE, CouponType.FREE_SHIPPING]),
  value: z.number().min(0, 'Value cannot be negative'),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(0).optional(),
  perCustomerLimit: z.number().int().min(1, 'Customer limit must be at least 1'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isActive: z.boolean(),
}).refine(data => {
  if (data.type === CouponType.PERCENTAGE && data.value > 100) return false;
  return true;
}, {
  message: 'Percentage value cannot exceed 100%',
  path: ['value'],
}).refine(data => {
  const start = new Date(data.startDate).getTime();
  const end = new Date(data.endDate).getTime();
  return end >= start;
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
});

type FormValues = z.infer<typeof couponSchema>;

export default function CouponsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // URL States
  const pageParam = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const typeFilter = searchParams.get('type') || '';

  const [localSearch, setLocalSearch] = useState(search);
  const [activeCoupon, setActiveCoupon] = useState<CouponResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Queries
  const { data: listData, isLoading, isError, refetch } = useCoupons({
    page: pageParam,
    limit: 10,
    search: search || undefined,
    type: (typeFilter as CouponType) || undefined,
  });

  const updateQuery = (key: string, value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value.toString());
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/admin/promotions/coupons?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery('search', localSearch);
  };

  const isEditor = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Coupons & Promo Codes</h1>
          <p className="text-xs text-neutral-400 mt-1">Configure checkout discount coupons, set usage thresholds, and inspect active usage metrics.</p>
        </div>
        {isEditor && (
          <button
            onClick={() => {
              setActiveCoupon(null);
              setIsDialogOpen(true);
            }}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Coupon
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
            placeholder="Search by code or coupon name..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex gap-3 w-full md:w-auto justify-end">
          <select
            value={typeFilter}
            onChange={(e) => updateQuery('type', e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="FLAT">FLAT</option>
            <option value="PERCENTAGE">PERCENTAGE</option>
            <option value="FREE_SHIPPING">FREE SHIPPING</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <SectionLoader message="Retrieving coupons queue..." />
      ) : isError ? (
        <PageError title="Connection Failure" message="Could not fetch coupons from server." retry={refetch} />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Coupon Code</th>
                  <th className="p-4">Discount details</th>
                  <th className="p-4 text-right">Min Order Amount</th>
                  <th className="p-4 text-center">Usage Count</th>
                  <th className="p-4">Validity Range</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {listData?.data?.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-neutral-900 text-[10px] flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-neutral-400" />
                      {c.code}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-neutral-800">{c.name}</div>
                      <div className="text-[10px] font-semibold text-neutral-600">
                        {c.type === 'PERCENTAGE' ? `${c.value}% Off` : c.type === 'FLAT' ? `₹${c.value} Off` : 'Free Shipping'}
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono text-neutral-600">
                      {c.minOrderAmount ? `₹${c.minOrderAmount}` : <span className="text-neutral-300">-</span>}
                    </td>
                    <td className="p-4 text-center text-neutral-700">
                      <span className="font-bold">{c.usedCount}</span>
                      {c.usageLimit && <span className="text-neutral-400 text-[10px]"> / {c.usageLimit}</span>}
                    </td>
                    <td className="p-4 text-neutral-500">
                      <div>Start: {formatDate(c.startDate)}</div>
                      <div className="text-[10px] text-neutral-400">End: {formatDate(c.endDate)}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase
                        ${c.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-neutral-100 text-neutral-500'}
                      `}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {isEditor && (
                          <button
                            onClick={() => {
                              setActiveCoupon(c);
                              setIsDialogOpen(true);
                            }}
                            className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600 hover:text-neutral-900"
                            title="Edit Coupon"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!listData?.data || listData.data.length === 0) && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-neutral-400 font-medium">
                      No discount coupons created yet.
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

      {/* Create / Edit Coupon Dialog */}
      {isDialogOpen && (
        <CouponDialog
          coupon={activeCoupon}
          onClose={() => {
            setIsDialogOpen(false);
            setActiveCoupon(null);
          }}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}

// Dialog helper
function CouponDialog({ coupon, onClose, onSuccess }: { coupon: CouponResponse | null; onClose: () => void; onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);

  const createMut = useCreateCoupon();
  const updateMut = useUpdateCoupon();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: coupon?.code || '',
      name: coupon?.name || '',
      description: coupon?.description || '',
      type: (coupon?.type || CouponType.PERCENTAGE) as CouponType,
      value: coupon?.value || 0,
      minOrderAmount: coupon?.minOrderAmount || 0,
      maxDiscountAmount: coupon?.maxDiscountAmount || 0,
      usageLimit: coupon?.usageLimit || 0,
      perCustomerLimit: coupon?.perCustomerLimit || 1,
      startDate: coupon?.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
      endDate: coupon?.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
      isActive: coupon?.isActive ?? true,
    },
  });

  const selectedType = watch('type');

  // Trigger default value mappings on type change
  React.useEffect(() => {
    if (selectedType === CouponType.FREE_SHIPPING) {
      setValue('value', 0);
    }
  }, [selectedType, setValue]);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const payload = {
        ...values,
        minOrderAmount: values.minOrderAmount || undefined,
        maxDiscountAmount: values.maxDiscountAmount || undefined,
        usageLimit: values.usageLimit || undefined,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
      };

      if (coupon) {
        await updateMut.mutateAsync({ id: coupon.id, dto: payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message
        : getApiErrorMessage(err);
      setError(message || 'Failed to save coupon');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 max-h-[95vh] overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900">{coupon ? 'Edit Coupon Code' : 'Create Coupon Code'}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-2.5 text-2xs text-red-655 font-semibold">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            {/* Code */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Promo Code</label>
              <input
                type="text"
                {...register('code')}
                placeholder="e.g. FASHION50"
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none font-mono"
              />
              {errors.code && <p className="text-[9px] text-red-650 mt-1">{errors.code.message}</p>}
            </div>
            {/* Name */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Offer Name</label>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. Festival Season sale"
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              />
              {errors.name && <p className="text-[9px] text-red-650 mt-1">{errors.name.message}</p>}
            </div>
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

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
            {/* Coupon Type */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Discount Type</label>
              <select
                {...register('type')}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 focus:outline-none"
              >
                <option value={CouponType.PERCENTAGE}>PERCENTAGE OFF</option>
                <option value={CouponType.FLAT}>FLAT DISCOUNT</option>
                <option value={CouponType.FREE_SHIPPING}>FREE SHIPPING</option>
              </select>
            </div>
            {/* Value */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                {selectedType === CouponType.PERCENTAGE ? 'Discount Rate (%)' : selectedType === CouponType.FLAT ? 'Flat Amount (₹)' : 'Value (N/A)'}
              </label>
              <input
                type="number"
                disabled={selectedType === CouponType.FREE_SHIPPING}
                {...register('value', { valueAsNumber: true })}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none disabled:opacity-50"
              />
              {errors.value && <p className="text-[9px] text-red-650 mt-1">{errors.value.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Min order */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Min Order (₹)</label>
              <input
                type="number"
                {...register('minOrderAmount', { valueAsNumber: true })}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              />
            </div>
            {/* Max discount */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Max discount cap (₹)</label>
              <input
                type="number"
                disabled={selectedType !== CouponType.PERCENTAGE}
                {...register('maxDiscountAmount', { valueAsNumber: true })}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
            {/* Usage limit */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Total Usage Limit</label>
              <input
                type="number"
                {...register('usageLimit', { valueAsNumber: true })}
                placeholder="e.g. 500 total redemptions"
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              />
            </div>
            {/* Customer limit */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Per Customer Limit</label>
              <input
                type="number"
                {...register('perCustomerLimit', { valueAsNumber: true })}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              />
              {errors.perCustomerLimit && <p className="text-[9px] text-red-650 mt-1">{errors.perCustomerLimit.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
            {/* Start Date */}
            <div>
              <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Start Date</label>
              <input
                type="date"
                {...register('startDate')}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 focus:outline-none"
              />
            </div>
            {/* End Date */}
            <div>
              <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider">End Date</label>
              <input
                type="date"
                {...register('endDate')}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 focus:outline-none"
              />
              {errors.endDate && <p className="text-[9px] text-red-650 mt-1">{errors.endDate.message}</p>}
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
              disabled={isSubmitting}
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm disabled:opacity-55 flex items-center"
            >
              {isSubmitting && <ButtonLoader />} {coupon ? 'Save Changes' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

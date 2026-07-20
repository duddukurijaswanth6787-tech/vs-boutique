'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCoupons, useCreateCoupon, useUpdateCoupon } from '@/features/coupons/coupon.hooks';
import { CouponType, CouponResponse } from '@/features/coupons/coupon.types';
import { SectionLoader, PageError, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { 
  Search, 
  Plus, 
  X, 
  Gift, 
  Percent, 
  Copy, 
  Edit2, 
  MoreVertical, 
  LayoutGrid, 
  List, 
  CheckCircle2,
  Clock,
  Wallet,
  Info,
  HelpCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDate } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';

// Zod validation schema
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
  const pathname = usePathname();
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.includes('super_admin');

  // Page States
  const [isCreating, setIsCreating] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponResponse | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Search & Filter parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [discountTypeFilter, setDiscountTypeFilter] = useState('All');
  const [couponTypeFilter, setCouponTypeFilter] = useState('All');

  // API queries/mutations
  const { data: listData, isLoading, isError, refetch } = useCoupons({
    page: parseInt(searchParams.get('page') || '1'),
    limit: 100
  });
  const createMut = useCreateCoupon();
  const updateMut = useUpdateCoupon();
  const couponList = listData?.data ?? [];

  React.useEffect(() => {
    const isCreatingParam = searchParams.get('create') === 'true';
    const editId = searchParams.get('edit');

    if (editId) {
      const liveCoupon = listData?.data?.find(c => c.id === editId);
      if (liveCoupon) {
        setEditingCoupon(liveCoupon);
      } else {
        router.push(pathname);
        return;
      }
      setIsCreating(true);
    } else if (isCreatingParam) {
      setIsCreating(true);
    } else {
      setIsCreating(false);
    }
  }, [searchParams, listData]);

  // Form setup using React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      type: CouponType.PERCENTAGE,
      value: 0,
      minOrderAmount: 0,
      maxDiscountAmount: 0,
      usageLimit: 1000,
      perCustomerLimit: 1,
      startDate: '',
      endDate: '',
      isActive: true,
    },
  });

  // Watch form values for dynamic Preview voucher
  const watchCode = watch('code') || '';
  const watchName = watch('name') || '';
  const watchDesc = watch('description') || '';
  const watchType = watch('type');
  const watchValue = watch('value') || 0;
  const watchMinOrder = watch('minOrderAmount') || 0;
  const watchMaxDiscount = watch('maxDiscountAmount') || 0;
  const watchUsageLimit = watch('usageLimit') || 0;
  const watchPerCustLimit = watch('perCustomerLimit') || 1;
  const watchStartDate = watch('startDate');
  const watchEndDate = watch('endDate');
  const watchActive = watch('isActive');

  // Trigger form pre-filling on edit mode
  React.useEffect(() => {
    if (editingCoupon) {
      reset({
        code: editingCoupon.code,
        name: editingCoupon.name,
        description: editingCoupon.description,
        type: editingCoupon.type as CouponType,
        value: editingCoupon.value || 0,
        minOrderAmount: editingCoupon.minOrderAmount || 0,
        maxDiscountAmount: editingCoupon.maxDiscountAmount || 0,
        usageLimit: editingCoupon.usageLimit || 0,
        perCustomerLimit: editingCoupon.perCustomerLimit || 1,
        startDate: editingCoupon.startDate ? new Date(editingCoupon.startDate).toISOString().split('T')[0] : '',
        endDate: editingCoupon.endDate ? new Date(editingCoupon.endDate).toISOString().split('T')[0] : '',
        isActive: editingCoupon.isActive,
      });
    } else {
      reset({
        code: '',
        name: '',
        description: '',
        type: CouponType.PERCENTAGE,
        value: 0,
        minOrderAmount: 0,
        maxDiscountAmount: 0,
        usageLimit: 1000,
        perCustomerLimit: 1,
        startDate: '',
        endDate: '',
        isActive: true,
      });
    }
  }, [editingCoupon, reset]);

  // Handle coupon saving
  const handleSaveCoupon = async (values: FormValues) => {
    try {
      const payload = {
        ...values,
        minOrderAmount: values.minOrderAmount || undefined,
        maxDiscountAmount: values.maxDiscountAmount || undefined,
        usageLimit: values.usageLimit || undefined,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
      };

      if (editingCoupon) {
        await updateMut.mutateAsync({ id: editingCoupon.id, dto: payload });
      } else {
        await createMut.mutateAsync(payload);
      }

      router.push(pathname);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
  };

  const updateQuery = (key: string, value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value.toString());
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/admin/coupons?${params.toString()}`);
  };

  // Filter dynamic coupons list
  const filteredCoupons = couponList.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'Active' && c.isActive && new Date(c.endDate) >= new Date()) ||
                          (statusFilter === 'Expired' && (!c.isActive || new Date(c.endDate) < new Date()));

    const matchesDiscount = discountTypeFilter === 'All' || 
      (discountTypeFilter === 'Percentage' && c.type === 'PERCENTAGE') ||
      (discountTypeFilter === 'Flat Amount' && c.type === 'FLAT') ||
      (discountTypeFilter === 'Free Shipping' && c.type === 'FREE_SHIPPING');

    return matchesSearch && matchesStatus && matchesDiscount;
  });

  // Calculate Stat Cards metrics
  const totalCount = couponList.length;
  const activeCount = couponList.filter(c => c.isActive && new Date(c.endDate) >= new Date()).length;
  const expiredCount = couponList.filter(c => !c.isActive || new Date(c.endDate) < new Date()).length;
  const usedCountTotal = couponList.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  if (isCreating) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb Header */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
            <span>Coupons</span>
            <span>/</span>
            <span className="text-[#8B5A6B]">{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 font-sans tracking-tight">{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h1>
          <p className="text-xs text-neutral-400 mt-0.5">{editingCoupon ? 'Modify existing coupon codes and validity parameters.' : 'Create a new discount coupon or promotion for your store.'}</p>
        </div>

        {/* Create/Edit coupon Split Grid */}
        <form onSubmit={handleSubmit(handleSaveCoupon)} className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Left Column (Main Form widgets, width 2/3) */}
          <div className="flex-1 w-full space-y-6 min-w-0">
            {/* Coupon Information */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3">Coupon Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Coupon Code *</label>
                  <input
                    type="text"
                    {...register('code')}
                    placeholder="e.g. VASANTHI20"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30] font-mono font-bold"
                  />
                  {errors.code && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.code.message}</p>}
                  <span className="text-[10px] text-neutral-400 mt-1 block font-medium">Unique code customers will use at checkout.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Coupon Name *</label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="e.g. Vasanthi 20% OFF"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30]"
                  />
                  {errors.name && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.name.message}</p>}
                  <span className="text-[10px] text-neutral-400 mt-1 block font-medium">For internal reference only.</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Description (Optional)</label>
                <textarea
                  {...register('description')}
                  placeholder="Get 20% off on all orders above ₹999."
                  rows={3}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30]"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block font-medium">This description will not be visible to customers.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Discount Type *</label>
                  <select
                    {...register('type')}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none"
                  >
                    <option value={CouponType.PERCENTAGE}>Percentage (%)</option>
                    <option value={CouponType.FLAT}>Flat Amount (₹)</option>
                    <option value={CouponType.FREE_SHIPPING}>Free Shipping</option>
                  </select>
                  <span className="text-[10px] text-neutral-400 mt-1 block font-medium">Choose the type of discount.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Discount Value *</label>
                  <div className="relative">
                    <input
                      type="number"
                      disabled={watchType === CouponType.FREE_SHIPPING}
                      {...register('value', { valueAsNumber: true })}
                      placeholder="20"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-4 pr-8 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30] disabled:opacity-50"
                    />
                    <span className="absolute right-4 top-3 text-xs font-bold text-neutral-400">
                      {watchType === CouponType.PERCENTAGE ? '%' : '₹'}
                    </span>
                  </div>
                  {errors.value && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.value.message}</p>}
                  <span className="text-[10px] text-neutral-400 mt-1 block font-medium">Enter discount percentage or value.</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Minimum Order Amount (Optional)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-xs font-bold text-neutral-400">₹</span>
                    <input
                      type="number"
                      {...register('minOrderAmount', { valueAsNumber: true })}
                      placeholder="999"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-8 pr-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30]"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-1 block font-medium">Minimum cart value to apply this coupon.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Maximum Discount Amount (Optional)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-xs font-bold text-neutral-400">₹</span>
                    <input
                      type="number"
                      disabled={watchType !== CouponType.PERCENTAGE}
                      {...register('maxDiscountAmount', { valueAsNumber: true })}
                      placeholder="500"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-8 pr-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30] disabled:opacity-50"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-1 block font-medium">Maximum discount limit per order.</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-neutral-100">
                <span className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">Applies To *</span>
                <div className="flex flex-wrap gap-4 items-center">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 cursor-pointer">
                    <input type="radio" name="applies_to" defaultChecked className="text-[#7A1C30] focus:ring-[#7A1C30] w-4 h-4" /> All Products
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 cursor-pointer">
                    <input type="radio" name="applies_to" className="text-[#7A1C30] focus:ring-[#7A1C30] w-4 h-4" /> Specific Products
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 cursor-pointer">
                    <input type="radio" name="applies_to" className="text-[#7A1C30] focus:ring-[#7A1C30] w-4 h-4" /> Specific Categories
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 cursor-pointer">
                    <input type="radio" name="applies_to" className="text-[#7A1C30] focus:ring-[#7A1C30] w-4 h-4" /> Specific Brands
                  </label>
                </div>
              </div>
            </div>

            {/* Usage Limits */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3">Usage Limits</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Usage Limit (Optional)</label>
                  <input
                    type="number"
                    {...register('usageLimit', { valueAsNumber: true })}
                    placeholder="1000"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block font-medium">Total number of times this coupon can be used.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Usage Limit Per Customer (Optional)</label>
                  <input
                    type="number"
                    {...register('perCustomerLimit', { valueAsNumber: true })}
                    placeholder="1"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none"
                  />
                  {errors.perCustomerLimit && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.perCustomerLimit.message}</p>}
                  <span className="text-[10px] text-neutral-400 mt-1 block font-medium">How many times a customer can use this coupon.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Used Count</label>
                  <input
                    type="number"
                    disabled
                    value={editingCoupon?.usedCount || 0}
                    className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-500 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block font-medium">Total times this coupon has been used.</span>
                </div>
              </div>
            </div>

            {/* Validity */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3">Validity</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Start Date *</label>
                  <input
                    type="date"
                    {...register('startDate')}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none"
                  />
                  {errors.startDate && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.startDate.message}</p>}
                  <span className="text-[10px] text-neutral-400 mt-1 block font-medium">When the coupon becomes active.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">End Date *</label>
                  <input
                    type="date"
                    {...register('endDate')}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none"
                  />
                  {errors.endDate && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.endDate.message}</p>}
                  <span className="text-[10px] text-neutral-400 mt-1 block font-medium">When the coupon expires.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Time Zone</label>
                  <select
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none"
                    defaultValue="Asia/Kolkata"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                  <span className="text-[10px] text-neutral-400 mt-1 block font-medium">Coupon validity time zone.</span>
                </div>
              </div>
            </div>

            {/* Status Switch */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Status</h2>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('isActive')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                  <span className="ml-2 text-xs font-bold text-neutral-800">Active</span>
                </label>
              </div>
              <span className="text-[10px] text-neutral-400 mt-1 block font-medium">Only active coupons will be available to customers.</span>
            </div>

            {/* Bottom Actions footer */}
            <div className="flex justify-between items-center mt-6 border-t border-neutral-100 pt-6">
              <button
                type="button"
                onClick={() => {
                  router.push(pathname);
                }}
                className="px-5 py-2.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#7A1C30] hover:bg-[#641424] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                {isSubmitting && <ButtonLoader />} Save & Create Coupon
              </button>
            </div>
          </div>

          {/* Right Column (Sidebar, width 1/3) */}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            
            {/* Dynamic Voucher Coupon Preview */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-2 uppercase tracking-wider">Coupon Preview</h3>
              
              {/* Styled pink coupon voucher ticket */}
              <div className="relative bg-red-50/75 border border-dashed border-red-200 rounded-2xl p-4 flex justify-between overflow-hidden shadow-sm">
                
                {/* Dotted border line inside */}
                <div className="absolute left-[70%] top-0 bottom-0 border-l border-dashed border-red-300 z-10" />

                {/* Left side details */}
                <div className="flex-1 pr-6 space-y-2">
                  <div className="inline-block bg-[#7A1C30]/10 text-[#7A1C30] px-2.5 py-0.5 rounded font-mono font-bold text-xs border border-[#7A1C30]/20 tracking-wider">
                    {watchCode}
                  </div>
                  <h4 className="text-[11px] font-bold text-neutral-850 block">{watchName}</h4>
                  <p className="text-[10px] text-neutral-500 font-medium leading-relaxed block">{watchDesc}</p>
                </div>

                {/* Right side Discount Rate */}
                <div className="w-20 shrink-0 flex flex-col justify-center items-center text-center pl-2">
                  <span className="text-base font-bold text-[#7A1C30] block">
                    {watchType === CouponType.PERCENTAGE ? `${watchValue}%` : watchType === CouponType.FLAT ? `₹${watchValue}` : 'FREE'}
                  </span>
                  <span className="text-[7px] font-bold text-neutral-400 block uppercase tracking-wider mt-0.5">
                    {watchType === CouponType.PERCENTAGE ? 'OFF' : watchType === CouponType.FLAT ? 'OFF' : 'SHIPPING'}
                  </span>
                  <span className="text-[8px] text-neutral-400 mt-1 block font-semibold">
                    {watchType === CouponType.PERCENTAGE ? `Max. ₹${watchMaxDiscount}` : `Min. ₹${watchMinOrder}`}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-neutral-400 font-medium block">This is how the coupon will appear to customers.</div>
            </div>

            {/* Coupon Summary Details */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-2 uppercase tracking-wider">Coupon Summary</h3>
              
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Discount Type</span>
                  <span className="text-neutral-800 font-bold">{watchType === CouponType.PERCENTAGE ? 'Percentage' : watchType === CouponType.FLAT ? 'Flat Amount' : 'Free Shipping'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Discount Value</span>
                  <span className="text-neutral-800 font-bold">{watchType === CouponType.FREE_SHIPPING ? 'N/A' : `${watchValue}${watchType === CouponType.PERCENTAGE ? '%' : ' ₹'}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Min. Order Amount</span>
                  <span className="text-neutral-800 font-bold">₹{watchMinOrder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Max. Discount</span>
                  <span className="text-neutral-800 font-bold">{watchType === CouponType.PERCENTAGE ? `₹${watchMaxDiscount}` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Applies To</span>
                  <span className="text-neutral-800 font-bold">All Products</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Usage Limit</span>
                  <span className="text-neutral-800 font-bold">{watchUsageLimit || '∞'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Per Customer Limit</span>
                  <span className="text-neutral-800 font-bold">{watchPerCustLimit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Validity</span>
                  <span className="text-neutral-800 font-bold truncate max-w-[140px]">
                    {watchStartDate ? `${formatDate(watchStartDate)} to ${formatDate(watchEndDate || watchStartDate)}` : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Status</span>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase
                    ${watchActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}
                  `}>
                    {watchActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold text-neutral-950 flex items-center gap-1">
                <HelpCircle className="w-4 h-4 text-blue-600" /> Tips
              </h3>
              
              <ul className="space-y-2 text-[10px] text-neutral-500 font-medium list-disc pl-4 leading-normal">
                <li>Use short and easy-to-remember coupon codes.</li>
                <li>Set a minimum order amount to increase order value.</li>
                <li>Usage limits help you control the coupon budget.</li>
                <li>You can edit or deactivate the coupon anytime.</li>
              </ul>
            </div>
          </div>

        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm">
        <div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
            <span>Marketing</span>
            <span>/</span>
            <span className="text-[#8B5A6B]">Coupons</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Coupons</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Create and manage discount coupons and promotions</p>
        </div>
        
        <button
          onClick={() => {
            router.push(`${pathname}?create=true`);
          }}
          className="bg-[#7A1C30] hover:bg-[#641424] text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {/* 5 Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Total Coupons */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Total Coupons</span>
            <span className="text-xl font-bold text-neutral-900">{totalCount}</span>
            <span className="text-[10px] text-neutral-400 font-bold block">No trend available</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#7A1C30] flex items-center justify-center shadow-sm">
            <Gift className="w-4 h-4" />
          </div>
        </div>

        {/* Active Coupons */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Active Coupons</span>
            <span className="text-xl font-bold text-neutral-900">{activeCount}</span>
            <span className="text-[10px] text-green-600 font-bold block">{((activeCount / totalCount) * 100).toFixed(1)}% of total</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Used Coupons */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Used Coupons</span>
            <span className="text-xl font-bold text-neutral-900">{usedCountTotal}</span>
            <span className="text-[10px] text-blue-600 font-bold block font-sans">Total times used</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
            <Percent className="w-4 h-4" />
          </div>
        </div>

        {/* Expired Coupons */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Expired Coupons</span>
            <span className="text-xl font-bold text-neutral-900">{expiredCount}</span>
            <span className="text-[10px] text-amber-600 font-bold block">{((expiredCount / totalCount) * 100).toFixed(1)}% of total</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Total Discount Given */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Total Discount Given</span>
            <span className="text-lg font-bold text-neutral-400">—</span>
            <span className="text-[10px] text-neutral-400 font-bold block">No trend available</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by coupon code or name..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-4 pr-10 py-2 text-xs text-neutral-900 focus:outline-none"
            />
            <span className="absolute right-3.5 top-2.5 text-[10px] text-neutral-400 font-bold">Ctrl + K</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="All">Status: All</option>
            <option value="Active">Status: Active</option>
            <option value="Expired">Status: Expired</option>
          </select>

          <select
            value={discountTypeFilter}
            onChange={(e) => setDiscountTypeFilter(e.target.value)}
            className="bg-white border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="All">Discount Type: All</option>
            <option value="Percentage">Percentage</option>
            <option value="Flat Amount">Flat Amount</option>
            <option value="Free Shipping">Free Shipping</option>
          </select>

          <select
            value={couponTypeFilter}
            onChange={(e) => setCouponTypeFilter(e.target.value)}
            className="bg-white border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="All">Coupon Type: All</option>
            <option value="Standard">Standard Coupon</option>
          </select>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2.5">
          <div className="flex border border-neutral-200 p-1 rounded-xl bg-white animate-fade-in">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#7A1C30]/10 text-[#7A1C30]' : 'text-neutral-400'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#7A1C30]/10 text-[#7A1C30]' : 'text-neutral-400'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <SectionLoader message="Retrieving coupons queue..." />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Coupon Code</th>
                    <th className="p-4">Coupon Name</th>
                    <th className="p-4">Discount</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Usage</th>
                    <th className="p-4">Validity Period</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {filteredCoupons.map((c) => {
                    const isExpired = !c.isActive || new Date(c.endDate) < new Date();
                    const displayType = c.type === 'PERCENTAGE' ? 'Percentage' : c.type === 'FLAT' ? 'Flat Amount' : 'Free Shipping';
                    const discountDisplay = c.type === 'PERCENTAGE' ? `${c.value}%${c.maxDiscountAmount ? ` Max. ₹${c.maxDiscountAmount}` : ''}` : c.type === 'FLAT' ? `₹${c.value}${c.minOrderAmount ? ` Min. Order ₹${c.minOrderAmount}` : ''}` : 'Free Shipping';
                    const usageVal = c.usageLimit ?? 0;
                    const percentUsed = usageVal > 0 ? (c.usedCount / usageVal) * 100 : 0;
                    return (
                      <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors">

                        {/* Code Badge */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-1 bg-blue-50 border border-blue-200/60 rounded-xl text-blue-700 font-mono font-bold text-[10px] tracking-wide">
                              {c.code}
                            </span>
                            <button
                              onClick={(e) => handleCopyCode(e, c.code)}
                              className="text-neutral-400 hover:text-neutral-600 p-1"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* Name & Desc */}
                        <td className="p-4">
                          <span className="font-bold text-neutral-900 block">{c.name}</span>
                          <span className="text-[10px] text-neutral-400 block mt-0.5">{c.description}</span>
                        </td>

                        {/* Discount */}
                        <td className="p-4 font-bold text-neutral-800">{discountDisplay}</td>

                        {/* Type Label */}
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase
                            ${displayType === 'Percentage' ? 'bg-purple-50 text-purple-700 border border-purple-100' : displayType === 'Flat Amount' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}
                          `}>
                            {displayType}
                          </span>
                        </td>

                        {/* Custom Usage Progress Bar */}
                        <td className="p-4 w-40">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-neutral-700">
                              <span>{c.usedCount} <span className="text-neutral-400 font-medium font-sans">/ {c.usageLimit ?? '∞'}</span></span>
                              <span>{!c.usageLimit ? '—' : `${percentUsed.toFixed(1)}%`}</span>
                            </div>
                            <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isExpired ? 'bg-red-500' : 'bg-green-600'}`}
                                style={{ width: `${!c.usageLimit ? 100 : percentUsed}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Validity Period */}
                        <td className="p-4 text-neutral-500 font-semibold">
                          <span className="block">{new Date(c.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span className="block text-[10px] text-neutral-400">to {new Date(c.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </td>

                        {/* Status badge */}
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase
                            ${isExpired ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}
                          `}>
                            {isExpired ? 'Expired' : 'Active'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => {
                                router.push(`${pathname}?edit=${c.id}`);
                              }}
                              className="p-1.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 text-neutral-500 shadow-sm"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (isSuperAdmin && window.confirm(`Delete coupon ${c.code}?`)) {
                                  refetch();
                                }
                              }}
                              className="p-1.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 text-neutral-500 shadow-sm"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-xs text-neutral-400 font-medium pt-2 border-t border-neutral-100">
            <span>Showing {filteredCoupons.length} of {totalCount} coupons</span>
          </div>
        </div>
      )}
    </div>
  );
}

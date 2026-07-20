'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOffers, useCreateOffer, useUpdateOffer } from '@/features/offers/offer.hooks';
import { OfferResponse } from '@/features/offers/offer.types';
import { OfferType } from '@/features/offers/offer.types';
import { useProducts } from '@/features/catalog/products/product.hooks';
import { useCategories } from '@/features/catalog/categories/category.hooks';
import { useBrands } from '@/features/catalog/brands/brand.hooks';
import { SectionLoader, PageError, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { Search, Plus, Edit3, X, Sparkles, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDate } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';

// Zod schema
const offerSchema = z.object({
  name: z.string().min(3, 'Name is too short').max(50),
  description: z.string().max(200).optional(),
  type: z.enum([OfferType.PRODUCT, OfferType.CATEGORY, OfferType.BRAND, OfferType.FESTIVAL, OfferType.FLASH_SALE]),
  value: z.number().min(0, 'Discount value cannot be negative'),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional(),
  applicableTo: z.string().optional(),
  applicableIds: z.array(z.string().uuid('Invalid entity identifier')).optional(),
  priority: z.number().int().min(0),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isActive: z.boolean(),
}).refine(data => {
  const start = new Date(data.startDate).getTime();
  const end = new Date(data.endDate).getTime();
  return end >= start;
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
});

type FormValues = z.infer<typeof offerSchema>;

export default function OffersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // URL States
  const pageParam = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const typeFilter = searchParams.get('type') || '';

  const [localSearch, setLocalSearch] = useState(search);
  const [activeOffer, setActiveOffer] = useState<OfferResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Queries
  const { data: listData, isLoading, isError, refetch } = useOffers({
    page: pageParam,
    limit: 10,
    search: search || undefined,
    type: (typeFilter as OfferType) || undefined,
  });

  const updateQuery = (key: string, value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value.toString());
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/admin/promotions/offers?${params.toString()}`);
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
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Campaign Offers</h1>
          <p className="text-xs text-neutral-400 mt-1">Configure auto-applied catalog discounts, set up product targets, and schedule flash sales.</p>
        </div>
        {isEditor && (
          <button
            onClick={() => {
              setActiveOffer(null);
              setIsDialogOpen(true);
            }}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Offer
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
            placeholder="Search by offer name..."
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
            <option value="PRODUCT">PRODUCT</option>
            <option value="CATEGORY">CATEGORY</option>
            <option value="BRAND">BRAND</option>
            <option value="FESTIVAL">FESTIVAL</option>
            <option value="FLASH_SALE">FLASH SALE</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <SectionLoader message="Retrieving catalog offers..." />
      ) : isError ? (
        <PageError title="Connection Failure" message="Could not fetch offers from database." retry={refetch} />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Offer Name</th>
                  <th className="p-4">Target Type</th>
                  <th className="p-4 text-right">Discount value</th>
                  <th className="p-4 text-center">Priority</th>
                  <th className="p-4">Scheduled Duration</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {listData?.data?.map((o) => (
                  <tr key={o.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        {o.name}
                      </div>
                      <div className="text-[10px] text-neutral-400 max-w-[200px] truncate">{o.description || 'No description'}</div>
                    </td>
                    <td className="p-4 uppercase tracking-wider text-2xs font-semibold text-neutral-600">{o.type}</td>
                    <td className="p-4 text-right font-mono font-bold text-neutral-900">₹{o.value}</td>
                    <td className="p-4 text-center font-semibold">{o.priority}</td>
                    <td className="p-4 text-neutral-500">
                      <div>Start: {formatDate(o.startDate)}</div>
                      <div className="text-[10px] text-neutral-400">End: {formatDate(o.endDate)}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase
                        ${o.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-neutral-100 text-neutral-500'}
                      `}>
                        {o.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {isEditor && (
                          <button
                            onClick={() => {
                              setActiveOffer(o);
                              setIsDialogOpen(true);
                            }}
                            className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600 hover:text-neutral-900"
                            title="Edit Offer"
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
                      No campaign offers created yet.
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

      {/* Create / Edit Dialog */}
      {isDialogOpen && (
        <OfferDialog
          offer={activeOffer}
          onClose={() => {
            setIsDialogOpen(false);
            setActiveOffer(null);
          }}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}

// Dialog
function OfferDialog({ offer, onClose, onSuccess }: { offer: OfferResponse | null; onClose: () => void; onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);

  const createMut = useCreateOffer();
  const updateMut = useUpdateOffer();

  const [selectedIds, setSelectedIds] = useState<string[]>(offer?.applicableIds || []);
  const [targetSearch, setTargetSearch] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      name: offer?.name || '',
      description: offer?.description || '',
      type: (offer?.type || OfferType.PRODUCT) as OfferType,
      value: offer?.value || 0,
      minOrderAmount: offer?.minOrderAmount || 0,
      maxDiscountAmount: offer?.maxDiscountAmount || 0,
      applicableTo: offer?.applicableTo || 'PRODUCTS',
      applicableIds: offer?.applicableIds || [],
      priority: offer?.priority || 0,
      startDate: offer?.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : '',
      endDate: offer?.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : '',
      isActive: offer?.isActive ?? true,
    },
  });

  const selectedType = watch('type');

  // Query catalog data for target selectors
  const { data: productsData } = useProducts({ search: targetSearch || undefined, limit: 10 });
  const { data: categoriesData } = useCategories();
  const { data: brandsData } = useBrands();

  // Sync applicableTo with offer type
  React.useEffect(() => {
    if (selectedType === OfferType.PRODUCT) {
      setValue('applicableTo', 'PRODUCTS');
    } else if (selectedType === OfferType.CATEGORY) {
      setValue('applicableTo', 'CATEGORIES');
    } else if (selectedType === OfferType.BRAND) {
      setValue('applicableTo', 'BRANDS');
    } else {
      setValue('applicableTo', 'GLOBAL');
    }
  }, [selectedType, setValue]);

  const toggleTargetId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const payload = {
        ...values,
        applicableIds: selectedIds.length > 0 ? selectedIds : undefined,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
      };

      if (offer) {
        await updateMut.mutateAsync({ id: offer.id, dto: payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message
        : getApiErrorMessage(err);
      setError(message || 'Failed to save offer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 max-h-[95vh] overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900">{offer ? 'Edit Campaign Offer' : 'Create Campaign Offer'}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-2.5 text-2xs text-red-655 font-semibold">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 text-xs">
          {/* Name */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Offer Name</label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g. 20% Autumn Discount"
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            />
            {errors.name && <p className="text-[9px] text-red-650 mt-1">{errors.name.message}</p>}
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
            {/* Offer Type */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Target Type</label>
              <select
                {...register('type')}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 focus:outline-none"
              >
                <option value={OfferType.PRODUCT}>PRODUCT TARGET</option>
                <option value={OfferType.CATEGORY}>CATEGORY TARGET</option>
                <option value={OfferType.BRAND}>BRAND TARGET</option>
                <option value={OfferType.FESTIVAL}>FESTIVAL FLAT</option>
                <option value={OfferType.FLASH_SALE}>FLASH SALE</option>
              </select>
            </div>
            {/* Value */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Discount Value (₹)</label>
              <input
                type="number"
                {...register('value', { valueAsNumber: true })}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              />
              {errors.value && <p className="text-[9px] text-red-650 mt-1">{errors.value.message}</p>}
            </div>
          </div>

          {/* Target Entities Selector */}
          {(selectedType === OfferType.PRODUCT || selectedType === OfferType.CATEGORY || selectedType === OfferType.BRAND) && (
            <div className="border border-neutral-200 rounded-xl bg-neutral-50 p-3 space-y-2">
              <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Select Targets ({selectedIds.length} chosen)</label>
              
              {selectedType === OfferType.PRODUCT && (
                <input
                  type="text"
                  placeholder="Filter catalog products..."
                  value={targetSearch}
                  onChange={(e) => setTargetSearch(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded px-2 py-1 text-2xs focus:outline-none"
                />
              )}

              <div className="max-h-28 overflow-y-auto scrollbar-thin divide-y divide-neutral-100 bg-white border border-neutral-200 rounded-lg">
                {selectedType === OfferType.PRODUCT && productsData?.data?.map((p) => {
                  const isSel = selectedIds.includes(p.id);
                  return (
                    <div key={p.id} onClick={() => toggleTargetId(p.id)} className="p-2 flex justify-between items-center cursor-pointer hover:bg-neutral-50 text-[10px]">
                      <span className="font-semibold text-neutral-800">{p.name}</span>
                      {isSel && <Check className="w-3.5 h-3.5 text-neutral-900" />}
                    </div>
                  );
                })}

                {selectedType === OfferType.CATEGORY && categoriesData?.data?.map((cat) => {
                  const isSel = selectedIds.includes(cat.id);
                  return (
                    <div key={cat.id} onClick={() => toggleTargetId(cat.id)} className="p-2 flex justify-between items-center cursor-pointer hover:bg-neutral-50 text-[10px]">
                      <span className="font-semibold text-neutral-800">{cat.name}</span>
                      {isSel && <Check className="w-3.5 h-3.5 text-neutral-900" />}
                    </div>
                  );
                })}

                {selectedType === OfferType.BRAND && brandsData?.data?.map((br) => {
                  const isSel = selectedIds.includes(br.id);
                  return (
                    <div key={br.id} onClick={() => toggleTargetId(br.id)} className="p-2 flex justify-between items-center cursor-pointer hover:bg-neutral-50 text-[10px]">
                      <span className="font-semibold text-neutral-800">{br.name}</span>
                      {isSel && <Check className="w-3.5 h-3.5 text-neutral-900" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
            {/* Priority */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Priority Weight</label>
              <input
                type="number"
                {...register('priority', { valueAsNumber: true })}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              />
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
              {isSubmitting && <ButtonLoader />} {offer ? 'Save Changes' : 'Create Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

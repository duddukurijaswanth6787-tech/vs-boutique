'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Search } from 'lucide-react';
import { useAssignWarehouseInventory } from '../warehouse.hooks';
import { useProducts } from '@/features/catalog/products/product.hooks';
import { useVariants } from '@/features/catalog/variants/variant.hooks';
import { ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const schema = z.object({
  productId: z.string().uuid('Please select a product'),
  variantId: z.string().uuid('Please select a variant'),
  availableQuantity: z.number().int().min(0, 'Quantity must be at least 0'),
  minimumStock: z.number().int().min(0, 'Minimum stock must be at least 0'),
  maximumStock: z.number().int().min(0, 'Maximum stock must be at least 0'),
  reorderLevel: z.number().int().min(0, 'Reorder level must be at least 0'),
});

type FormValues = z.infer<typeof schema>;

interface AssignInventoryDialogProps {
  warehouseId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignInventoryDialog({ warehouseId, onClose, onSuccess }: AssignInventoryDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  
  const assignMut = useAssignWarehouseInventory();

  // Load products to choose from
  const { data: productsData } = useProducts({
    search: productSearch || undefined,
    limit: 50,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      productId: '',
      variantId: '',
      availableQuantity: 0,
      minimumStock: 5,
      maximumStock: 100,
      reorderLevel: 10,
    },
  });

  const selectedProductId = watch('productId');

  // Load variants once product is selected
  const { data: variantsData, isLoading: isLoadingVariants } = useVariants({
    productId: selectedProductId || undefined,
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const { productId, ...dto } = values;
      await assignMut.mutateAsync({
        warehouseId,
        dto,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error
        ? getApiErrorMessage(err) || err.message
        : String(err);
      setError(msg || 'Failed to assign inventory');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900">Assign Product Variant Stock</h3>
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
          {/* Select Product */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Step 1: Choose Catalog Product</label>
            <div className="relative mt-1">
              <input
                type="text"
                placeholder="Type to filter products..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setValue('productId', '');
                  setValue('variantId', '');
                }}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900 mb-2"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
            </div>
            <select
              {...register('productId')}
              onChange={(e) => {
                setValue('productId', e.target.value);
                setValue('variantId', '');
              }}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
            >
              <option value="">-- Select Product --</option>
              {productsData?.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
            {errors.productId && <p className="text-[10px] text-red-600 mt-1">{errors.productId.message}</p>}
          </div>

          {/* Select Variant */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Step 2: Select Variant Size/Color</label>
            <select
              disabled={!selectedProductId || isLoadingVariants}
              {...register('variantId')}
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900 disabled:opacity-50"
            >
              <option value="">
                {isLoadingVariants ? 'Loading variants...' : selectedProductId ? '-- Select Variant --' : 'Select product first'}
              </option>
              {variantsData?.data?.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title} ({v.sku})
                </option>
              ))}
            </select>
            {errors.variantId && <p className="text-[10px] text-red-600 mt-1">{errors.variantId.message}</p>}
          </div>

          <div className="border-t border-neutral-100 pt-3 space-y-3">
            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Step 3: Initial Quantities & Thresholds</h4>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Initial Qty */}
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Available Qty</label>
                <input
                  type="number"
                  {...register('availableQuantity', { valueAsNumber: true })}
                  className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
                />
                {errors.availableQuantity && <p className="text-[9px] text-red-600 mt-1">{errors.availableQuantity.message}</p>}
              </div>
              {/* Reorder Level */}
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Reorder Level</label>
                <input
                  type="number"
                  {...register('reorderLevel', { valueAsNumber: true })}
                  className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
                />
                {errors.reorderLevel && <p className="text-[9px] text-red-600 mt-1">{errors.reorderLevel.message}</p>}
              </div>
              {/* Min Stock */}
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Min Stock</label>
                <input
                  type="number"
                  {...register('minimumStock', { valueAsNumber: true })}
                  className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
                />
                {errors.minimumStock && <p className="text-[9px] text-red-600 mt-1">{errors.minimumStock.message}</p>}
              </div>
              {/* Max Stock */}
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Max Stock</label>
                <input
                  type="number"
                  {...register('maximumStock', { valueAsNumber: true })}
                  className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
                />
                {errors.maximumStock && <p className="text-[9px] text-red-600 mt-1">{errors.maximumStock.message}</p>}
              </div>
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
              {isSubmitting && <ButtonLoader />} Assign Variant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

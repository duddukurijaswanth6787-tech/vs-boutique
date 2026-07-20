'use client';

import React, { useState, useCallback } from 'react';
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand, useRestoreBrand, useBulkBrands } from '@/features/catalog/brands/brand.hooks';
import { CreateBrandDto, BrandResponse, BrandQueryDto } from '@/features/catalog/brands/brand.types';
import { useAuth } from '@/hooks/useAuth';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Trash2, 
  RefreshCw, 
  Edit3, 
  CheckCircle,
  Sparkles,
  Download,
  LayoutGrid,
  List,
  Calendar,
  MoreVertical,
  Star,
  UploadCloud,
  HelpCircle,
  Tag,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Wallet,
  Info
} from 'lucide-react';
import { useBulkOperation } from '@/lib/bulk/useBulkOperation';
import BulkActionBar from '@/components/ui/BulkActionBar';
import { useExport } from '@/lib/bulk/useExport';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function BrandsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.includes('super_admin');

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const showDeleted = searchParams.get('deleted') === 'true';

  // Page Modes
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Search & Filter parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [featuredFilter, setFeaturedFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');

  // Form states - Create/Edit brand
  const [brandId, setBrandId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Queries
  const { data: brandsData, isLoading, isError, refetch } = useBrands({
    page: 1,
    limit: 100,
    search: searchQuery || undefined,
    ...(showDeleted ? { deleted: 'true' } : {}),
  } as BrandQueryDto & { deleted?: string });

  const createBrandMut = useCreateBrand();
  const updateBrandMut = useUpdateBrand();
  const deleteBrandMut = useDeleteBrand();
  const restoreBrandMut = useRestoreBrand();
  const bulkMut = useBulkBrands();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const allIds = brandsData?.data?.map(b => b.id) || [];
  const isAllSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) setSelectedIds(new Set(allIds));
    else setSelectedIds(new Set());
  }, [allIds]);

  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const { triggerExport, isExporting } = useExport();
  const handleExport = () => triggerExport({ entity: 'Brand', filters: { search: searchQuery } });

  const toggleDeleted = () => {
    if (showDeleted) {
      router.push(pathname);
    } else {
      router.push(`${pathname}?deleted=true`);
    }
  };

  const resetForm = () => {
    setBrandId(null);
    setName('');
    setSlug('');
    setDescription('');
    setMetaTitle('');
    setMetaDesc('');
    setMetaKeywords('');
    setCanonicalUrl('');
    setIsActive(true);
  };

  const populateFromBrand = (brand: BrandResponse) => {
    setBrandId(brand.id);
    setName(brand.name);
    setSlug(brand.slug || '');
    setDescription(brand.description || '');
    setIsActive(brand.status === 'ACTIVE');
    setMetaTitle(brand.name);
    setMetaDesc(`Buy latest products from ${brand.name} brand.`);
  };

  const handleEditClick = (brand: BrandResponse) => {
    populateFromBrand(brand);
    setIsCreating(true);
    router.push(`${pathname}?edit=${brand.id}`);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const payload: CreateBrandDto = {
        name,
        slug: slug || undefined,
        description: description || undefined,
        isFeatured: featuredFilter === 'Featured',
        isVisible: isActive
      };

      if (brandId) {
        await updateBrandMut.mutateAsync({ id: brandId, dto: payload });
      } else {
        await createBrandMut.mutateAsync(payload);
      }

      router.push(pathname);
      refetch();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save brand');
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (confirm('Are you sure you want to delete this brand?')) {
      try {
        await deleteBrandMut.mutateAsync(id);
        refetch();
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete brand');
      }
    }
  };

  const brandList = brandsData?.data ?? [];
  const filteredBrands = brandList.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.slug.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'Active' && b.status === 'ACTIVE') ||
                          (statusFilter === 'Inactive' && b.status === 'INACTIVE');

    const matchesFeatured = featuredFilter === 'All' || 
                            (featuredFilter === 'Featured' && b.isFeatured) ||
                            (featuredFilter === 'Not Featured' && !b.isFeatured);

    return matchesSearch && matchesStatus && matchesFeatured;
  });

  const totalCount = brandsData?.meta?.total ?? 0;
  const activeCount = brandList.filter(b => b.status === 'ACTIVE').length;
  const inactiveCount = totalCount - activeCount;
  const featuredCount = brandList.filter(b => b.isFeatured).length;

  if (isCreating) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb Header */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
              <span>Brands</span>
              <span>/</span>
              <span className="text-[#8B5A6B]">{brandId ? 'Edit Brand' : 'Add New Brand'}</span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900 font-sans tracking-tight">{brandId ? 'Edit Brand' : 'Add New Brand'}</h1>
            <p className="text-xs text-neutral-400 mt-0.5">{brandId ? 'Modify brand parameters and metadata.' : 'Create a new brand to organize your products.'}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                router.push(pathname);
              }}
              className="px-5 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveBrand}
              className="px-6 py-2 bg-[#7A1C30] hover:bg-[#641424] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              Save Brand
            </button>
          </div>
        </div>

        {/* Brand Editor Split Grid */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Column (Main Form widgets, width 2/3) */}
          <div className="flex-1 w-full space-y-6 min-w-0">
            {/* Brand Information */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" /> Brand Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Brand Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!brandId) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }}
                    placeholder="Enter brand name"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Brand Slug *</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="Enter brand slug"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30]"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block font-medium">This will be used in URLs. Example: biba, libas</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter brand description"
                  rows={3}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30]"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block font-medium">Briefly describe about this brand.</span>
              </div>

              {/* Brand Logo and guidelines */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-neutral-100">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase">Brand Logo *</label>
                  <div className="border-2 border-dashed border-neutral-200 rounded-2xl p-6 bg-neutral-50/50 hover:bg-neutral-50 transition-colors flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px]">
                    <UploadCloud className="w-8 h-8 text-neutral-400 mb-2" />
                    <span className="text-xs font-bold text-neutral-800">Click to upload or drag and drop</span>
                    <span className="text-[10px] text-neutral-400 mt-0.5">PNG, JPG or WEBP (Max. 2MB)</span>
                  </div>
                </div>

                {/* Logo Guidelines */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex flex-col justify-center space-y-2">
                  <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-blue-500" /> Logo Guidelines
                  </span>
                  <ul className="space-y-1.5 text-[10px] text-neutral-500 font-medium pl-4 list-disc leading-normal">
                    <li>Recommended size: 512 x 512px</li>
                    <li>Aspect ratio: 1:1 (Square)</li>
                    <li>File formats: PNG, JPG, WEBP</li>
                    <li>Max file size: 2MB</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* SEO Information */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7A1C30]" /> SEO Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Meta Title (Optional)</label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Enter meta title"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30]"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block font-medium">Recommended: 50-60 characters</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Meta Description (Optional)</label>
                  <textarea
                    value={metaDesc}
                    onChange={(e) => setMetaDesc(e.target.value)}
                    placeholder="Enter meta description"
                    rows={2}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30]"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block font-medium">Recommended: 120-160 characters</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Meta Keywords (Optional)</label>
                  <input
                    type="text"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    placeholder="Enter keywords separated by commas"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30]"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block font-medium">Example: fashion, clothing, brand</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Canonical URL (Optional)</label>
                  <input
                    type="text"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder="Enter canonical URL"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30]"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block font-medium">Example: https://yourstore.com/brand/nike</span>
                </div>
              </div>
            </div>

            {/* Status Radio options */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm space-y-4">
              <span className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Brand Status *</span>
              <div className="flex gap-6 items-center">
                <label className="flex items-start gap-2.5 text-xs font-bold text-neutral-800 cursor-pointer">
                  <input
                    type="radio"
                    checked={isActive}
                    onChange={() => setIsActive(true)}
                    className="text-[#7A1C30] focus:ring-[#7A1C30] w-4 h-4 mt-0.5"
                  />
                  <div>
                    <span>Active</span>
                    <span className="block text-[10px] text-neutral-400 font-medium mt-0.5">Brand will be visible to customers</span>
                  </div>
                </label>
                <label className="flex items-start gap-2.5 text-xs font-bold text-neutral-800 cursor-pointer">
                  <input
                    type="radio"
                    checked={!isActive}
                    onChange={() => setIsActive(false)}
                    className="text-[#7A1C30] focus:ring-[#7A1C30] w-4 h-4 mt-0.5"
                  />
                  <div>
                    <span>Inactive</span>
                    <span className="block text-[10px] text-neutral-400 font-medium mt-0.5">Brand will be hidden from customers</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex justify-between items-center mt-6 border-t border-neutral-100 pt-6">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  router.push(pathname);
                }}
                className="px-5 py-2.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer bg-white"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                onClick={handleSaveBrand}
                className="px-6 py-2.5 bg-[#7A1C30] hover:bg-[#641424] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Save Brand
              </button>
            </div>
          </div>

          {/* Right Column (Sidebar widget, width 1/3) */}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            
            {/* Brand Preview Card */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-2 uppercase tracking-wider">Brand Preview</h3>
              
              <div className="border border-neutral-200/60 rounded-xl p-5 bg-neutral-50/50 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-16 h-16 rounded-full border border-neutral-200 bg-neutral-100 flex items-center justify-center text-neutral-400 shadow-sm">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 justify-center">
                    <span className="text-sm font-bold text-neutral-900">{name || 'Brand Name'}</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase
                      ${isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}
                    `}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono mt-1 block">/{slug || 'brand-slug'}</span>
                </div>
                <p className="text-[10px] text-neutral-500 font-medium leading-relaxed max-w-[200px] truncate-3-lines">
                  {description || 'Brand description will appear here...'}
                </p>
                <div className="w-full border-t border-neutral-200 pt-3 text-[10px] text-neutral-400 font-medium mt-1">
                  This is how the brand will appear to customers.
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-600" /> Tips
              </h3>
              <ul className="space-y-2 text-[10px] text-neutral-500 font-medium list-disc pl-4 leading-normal">
                <li>Choose a memorable name that represents the brand well.</li>
                <li>Use a clear and high-quality logo.</li>
                <li>A good description helps customers trust your brand.</li>
                <li>SEO information helps improve search visibility.</li>
                <li>You can edit brand details anytime.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm">
        <div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
            <span>Catalog</span>
            <span>/</span>
            <span className="text-[#8B5A6B]">Brands</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Brands</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Manage all product brands in your store</p>
        </div>
        
        <button
          onClick={() => {
            resetForm();
            setIsCreating(true);
            router.push(`${pathname}?create=true`);
          }}
          className="bg-[#7A1C30] hover:bg-[#641424] text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Brand
        </button>
      </div>

      {/* 4 Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Brands */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Total Brands</span>
            <span className="text-2xl font-bold text-neutral-900">{totalCount}</span>
            <span className="text-[10px] text-neutral-400 font-bold block">No trend available</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#7A1C30] flex items-center justify-center shadow-sm">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        {/* Active Brands */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Active Brands</span>
            <span className="text-2xl font-bold text-neutral-900">{activeCount}</span>
            <span className="text-[10px] text-green-600 font-bold block">{((activeCount / totalCount) * 100).toFixed(1)}% of total</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Inactive Brands */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Inactive Brands</span>
            <span className="text-2xl font-bold text-neutral-900">{inactiveCount}</span>
            <span className="text-[10px] text-amber-600 font-bold block">{((inactiveCount / totalCount) * 100).toFixed(1)}% of total</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Brands with Products */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Brands with Products</span>
            <span className="text-2xl font-bold text-neutral-900">{featuredCount}</span>
            <span className="text-[10px] text-blue-600 font-bold block">{((featuredCount / totalCount) * 100).toFixed(1)}% of total</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Filter options row */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
        {/* Left Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brands..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-4 pr-10 py-2 text-xs text-neutral-900 focus:outline-none"
            />
            <span className="absolute right-3.5 top-2.5 text-[10px] text-neutral-400 font-bold">Ctrl + K</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none bg-white font-sans"
          >
            <option value="All">Status: All</option>
            <option value="Active">Status: Active</option>
            <option value="Inactive">Status: Inactive</option>
          </select>

          <select
            value={featuredFilter}
            onChange={(e) => setFeaturedFilter(e.target.value)}
            className="bg-white border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none bg-white font-sans"
          >
            <option value="All">Featured: All</option>
            <option value="Featured">Featured Only</option>
            <option value="Not Featured">Not Featured</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none bg-white font-sans"
          >
            <option value="Newest">Sort By: Newest</option>
            <option value="Oldest">Sort By: Oldest</option>
          </select>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleDeleted}
            className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold shadow-sm cursor-pointer ${
              showDeleted ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" /> {showDeleted ? 'Showing Deleted' : 'Show Deleted'}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 border border-neutral-200 hover:border-neutral-300 rounded-xl bg-white text-xs font-bold text-neutral-700 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> {isExporting ? 'Exporting...' : 'Export'}
          </button>
          
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

      {/* Main Brands queue table */}
      {isLoading ? (
        <SectionLoader message="Syncing brands registry..." />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4 w-10 text-center"><input type="checkbox" checked={isAllSelected} onChange={(e) => handleSelectAll(e.target.checked)} className="rounded border-neutral-300 text-[#7A1C30] focus:ring-[#7A1C30]" aria-label="Select all brands" /></th>
                    <th className="p-4">Brand</th>
                    <th className="p-4">Slug</th>
                    <th className="p-4 text-center">Products</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Featured</th>
                    <th className="p-4">Created On</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {filteredBrands.map((b) => (
                    <tr key={b.id} className="hover:bg-neutral-50/50 transition-colors">
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <input type="checkbox" checked={selectedIds.has(b.id)} onChange={(e) => handleSelectOne(b.id, e.target.checked)} className="rounded border-neutral-300 text-[#7A1C30] focus:ring-[#7A1C30]" aria-label={`Select ${b.name}`} />
                      </td>

                      {/* Brand Logo & Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {b.logo ? (
                            <img src={b.logo} alt={b.name} className="w-9 h-9 rounded-full object-cover shadow-sm" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 font-bold flex items-center justify-center shadow-sm shrink-0">
                              {b.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-bold text-neutral-900">{b.name}</span>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="p-4 font-mono font-bold text-blue-600">
                        {b.slug}
                      </td>

                      {/* Products Count */}
                      <td className="p-4 text-center font-bold text-neutral-800">
                        —
                      </td>

                      {/* Status Badges */}
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase
                          ${b.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}
                        `}>
                          {b.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Featured star icon toggle */}
                      <td className="p-4">
                        <button
                          onClick={async () => {
                            await updateBrandMut.mutateAsync({ id: b.id, dto: { isFeatured: !b.isFeatured } });
                            refetch();
                          }}
                          className="p-1 text-amber-500 hover:text-amber-600"
                        >
                          <Star className={`w-4 h-4 ${b.isFeatured ? 'fill-amber-400 text-amber-500' : 'text-neutral-300'}`} />
                        </button>
                      </td>

                      {/* Created On Date */}
                      <td className="p-4 text-neutral-400 font-semibold">{new Date(b.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>

                      {/* Action columns */}
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleEditClick(b)}
                            className="p-1.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 text-neutral-500 shadow-sm"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBrand(b.id)}
                            className="p-1.5 border border-[#FFEAEA] bg-white rounded-lg hover:bg-[#FFEAEA] text-red-500 shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-xs text-neutral-400 font-medium pt-2 border-t border-neutral-100">
            <span>Showing {filteredBrands.length} of {totalCount} brands</span>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        isRunning={bulkMut.isPending}
        result={bulkMut.data}
        actions={
          showDeleted
            ? [{ label: 'Restore', onClick: () => bulkMut.mutate({ ids: [...selectedIds], action: 'restore' }), variant: 'default' }]
            : [
                { label: 'Delete', onClick: () => bulkMut.mutate({ ids: [...selectedIds], action: 'delete' }), variant: 'danger' },
                { label: 'Restore', onClick: () => bulkMut.mutate({ ids: [...selectedIds], action: 'restore' }), variant: 'default' },
              ]
        }
      />
    </div>
  );
}

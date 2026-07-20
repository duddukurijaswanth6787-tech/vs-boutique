'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  useCreateCategory, 
  useCategoryTree, 
  useGetCategoryUploadUrl 
} from '@/features/catalog/categories/category.hooks';
import { CategoryResponse } from '@/features/catalog/categories/category.types';
import { mediaService } from '@/features/catalog/media/media.service';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  X, 
  Layers, 
  Info, 
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}


export default function NewCategoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentIdParam = searchParams.get('parentId') || '';

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isManualSlug, setIsManualSlug] = useState(false);
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState(parentIdParam);
  const [displayOrder, setDisplayOrder] = useState('0');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  // File Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Hooks
  const { data: categoryTree } = useCategoryTree();
  const createCategoryMut = useCreateCategory();
  const getUploadUrlMut = useGetCategoryUploadUrl();

  // Clean up Object URLs
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [imagePreview, bannerPreview]);

  // Flattened lists of parent categories to select from
  const getFlattenedOptions = (nodes?: CategoryResponse[], depth = 0): { id: string; name: string; level: number }[] => {
    if (!nodes) return [];
    let opts: { id: string; name: string; level: number }[] = [];
    for (const node of nodes) {
      opts.push({ id: node.id, name: `${'— '.repeat(depth)}${node.name}`, level: node.level });
      if (node.children) {
        opts = [...opts, ...getFlattenedOptions(node.children, depth + 1)];
      }
    }
    return opts;
  };
  const parentOptions = getFlattenedOptions(categoryTree);

  // Find selected parent details for level preview
  const selectedParentOpt = parentOptions.find(p => p.id === parentId);
  const derivedLevel = selectedParentOpt ? selectedParentOpt.level + 1 : 0;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image exceeds 5MB size limit.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Banner image exceeds 5MB size limit.');
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Category name is required.');
      return;
    }
    if (!slug.trim()) {
      setErrorMsg('Slug URL is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let imageUrl: string | undefined;
      let bannerImageUrl: string | undefined;

      // 1. Upload Category Image if selected
      if (imageFile) {
        const ext = imageFile.name.split('.').pop() || 'webp';
        const { uploadUrl, url } = await getUploadUrlMut.mutateAsync({ type: 'image', extension: ext });
        await mediaService.uploadToS3(uploadUrl, imageFile);
        imageUrl = url;
      }

      // 2. Upload Display Banner if selected
      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop() || 'webp';
        const { uploadUrl, url } = await getUploadUrlMut.mutateAsync({ type: 'banner', extension: ext });
        await mediaService.uploadToS3(uploadUrl, bannerFile);
        bannerImageUrl = url;
      }

      // 3. Save Category Node
      const res = await createCategoryMut.mutateAsync({
        name,
        slug,
        description: description || undefined,
        parentId: parentId || undefined,
        displayOrder: parseInt(displayOrder) || 0,
        isFeatured,
        isVisible,
        isMenuVisible,
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        status,
        image: imageUrl,
        bannerImage: bannerImageUrl,
      });

      // Invalidate queries will be run automatically by mutateAsync onSuccess
      router.push(`/admin/catalog/categories/${res.id}/created`);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message
        : getApiErrorMessage(err);
      setErrorMsg(message || 'Unique constraint failed or slug URL is already in use.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center gap-3">
        <Link 
          href="/admin/catalog/categories" 
          className="p-2 bg-white rounded-xl border border-[#F0EEEC] hover:bg-[#FCFBFA] transition-colors text-[#78716C] shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="text-xs text-[#78716C] mb-0.5 font-medium">Catalog / Categories / Add Category</div>
          <h1 className="text-xl font-extrabold text-[#1C1917] tracking-tight">Add New Category</h1>
          <p className="text-xs text-[#78716C]">Define descriptive details, hierarchy level, status toggles, and images.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Form */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Basic Information */}
          <div className="bg-white p-6 rounded-2xl border border-[#F0EEEC] shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#1C1917] border-b border-[#F0EEEC] pb-2">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[#78716C] uppercase tracking-wider mb-1.5">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setName(value);
                    if (!isManualSlug) setSlug(value.trim() ? slugify(value) : '');
                  }}
                  placeholder="Enter category name"
                  className="w-full bg-[#FCFBFA] border border-[#E7E5E4] rounded-xl px-3.5 py-2 text-xs text-[#1C1917] focus:outline-none focus:border-[#8B1538]"
                />
                <span className="text-[10px] text-[#A8A29E] mt-1 block">This name will be displayed to customers.</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#78716C] uppercase tracking-wider mb-1.5">Slug (URL) *</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setIsManualSlug(true);
                  }}
                  placeholder="category-url"
                  className="w-full bg-[#FCFBFA] border border-[#E7E5E4] rounded-xl px-3.5 py-2 text-xs text-[#1C1917] font-mono focus:outline-none focus:border-[#8B1538]"
                />
                <span className="text-[10px] text-[#A8A29E] mt-1 block">Unique URL-friendly name. Example: women-sarees</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#78716C] uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                placeholder="Enter category description"
                rows={4}
                className="w-full bg-[#FCFBFA] border border-[#E7E5E4] rounded-xl px-3.5 py-2 text-xs text-[#1C1917] focus:outline-none focus:border-[#8B1538]"
              />
              <div className="text-right text-[10px] text-[#A8A29E]">{description.length}/1000 characters</div>
            </div>

            {/* Upload zones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Category Thumbnail */}
              <div>
                <label className="block text-[10px] font-bold text-[#78716C] uppercase tracking-wider mb-1.5">Category Image</label>
                <div className="border-2 border-dashed border-[#E7E5E4] rounded-2xl p-4 text-center hover:bg-[#FCFBFA] transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1 text-[#78716C]">
                    <Upload className="w-5 h-5 mx-auto text-[#A8A29E]" />
                    <div className="text-xs font-semibold">Choose Image</div>
                    <div className="text-[10px] text-[#A8A29E]">JPG, PNG, WEBP (Recommended: 800x800px)</div>
                  </div>
                </div>
                {imageFile && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-[#FCFBFA] rounded-xl border border-[#E7E5E4] text-xs">
                    <span className="truncate flex-1 font-medium">{imageFile.name}</span>
                    <button 
                      type="button" 
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="text-rose-600 hover:text-rose-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Display Banner */}
              <div>
                <label className="block text-[10px] font-bold text-[#78716C] uppercase tracking-wider mb-1.5">Display Banner (Optional)</label>
                <div className="border-2 border-dashed border-[#E7E5E4] rounded-2xl p-4 text-center hover:bg-[#FCFBFA] transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1 text-[#78716C]">
                    <Upload className="w-5 h-5 mx-auto text-[#A8A29E]" />
                    <div className="text-xs font-semibold">Choose Image</div>
                    <div className="text-[10px] text-[#A8A29E]">JPG, PNG, WEBP (Recommended: 1920x400px)</div>
                  </div>
                </div>
                {bannerFile && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-[#FCFBFA] rounded-xl border border-[#E7E5E4] text-xs">
                    <span className="truncate flex-1 font-medium">{bannerFile.name}</span>
                    <button 
                      type="button" 
                      onClick={() => { setBannerFile(null); setBannerPreview(null); }}
                      className="text-rose-600 hover:text-rose-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Card 2: Hierarchy */}
          <div className="bg-white p-6 rounded-2xl border border-[#F0EEEC] shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#1C1917] border-b border-[#F0EEEC] pb-2">Category Hierarchy</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-[10px] font-bold text-[#78716C] uppercase tracking-wider mb-1.5">Parent Category</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full bg-[#FCFBFA] border border-[#E7E5E4] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#8B1538]"
                >
                  <option value="">None (Root Category)</option>
                  {parentOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-[#A8A29E] mt-1 block">Choose parent category. Leave empty for root category.</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#78716C] uppercase tracking-wider mb-2">Level Preview</label>
                <div className="flex items-center gap-1">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FFF1F4] text-[#8B1538] border border-[#F3CBD5]">
                    {selectedParentOpt ? selectedParentOpt.name.replace(/—\s*/g, '') : 'Root'}
                  </span>
                  <span className="text-[#A8A29E] text-xs">→</span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {name || 'This Category'} (Level {derivedLevel})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Display & Status */}
          <div className="bg-white p-6 rounded-2xl border border-[#F0EEEC] shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#1C1917] border-b border-[#F0EEEC] pb-2">Display & Status</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Status active/inactive toggle */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[#78716C] uppercase tracking-wider mb-1">Status</label>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setStatus(status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-bold text-[#1C1917]">
                    {status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-[10px] text-[#A8A29E] mt-1">Active categories are visible to customers.</p>
              </div>

              {/* Menu visibility toggle */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[#78716C] uppercase tracking-wider mb-1">Menu Visibility</label>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsMenuVisible(!isMenuVisible)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isMenuVisible ? 'bg-blue-600' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isMenuVisible ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-bold text-[#1C1917]">
                    {isMenuVisible ? 'Show in Menu' : 'Hidden from Menu'}
                  </span>
                </div>
                <p className="text-[10px] text-[#A8A29E] mt-1">Show this category in website menu.</p>
              </div>

              {/* Sort Order input */}
              <div>
                <label className="block text-[10px] font-bold text-[#78716C] uppercase tracking-wider mb-1">Sort Order</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="w-full bg-[#FCFBFA] border border-[#E7E5E4] rounded-xl px-3.5 py-1.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#8B1538]"
                />
                <p className="text-[10px] text-[#A8A29E] mt-1">Lower numbers appear first in listings.</p>
              </div>
            </div>
          </div>

          {/* Action buttons footer */}
          <div className="flex items-center gap-3 justify-end border-t border-[#F0EEEC] pt-4">
            <Link 
              href="/admin/catalog/categories"
              className="px-4 py-2 border border-[#E7E5E4] hover:bg-[#FCFBFA] rounded-xl text-xs font-bold text-[#57534E] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#8B1538] hover:bg-[#72102D] disabled:bg-[#8B1538]/50 disabled:cursor-not-allowed text-white text-xs font-bold py-2 px-5 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" /> {isSubmitting ? 'Saving Category...' : 'Save & Continue'}
            </button>
          </div>

        </form>

        {/* Right Side: Live preview / summary / tips */}
        <div className="space-y-6">
          
          {/* Live Preview Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#F0EEEC] shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-[#78716C] uppercase tracking-wider border-b border-[#F0EEEC] pb-1.5">Category Live Preview</h2>
            
            <div className="border border-[#E7E5E4] rounded-2xl overflow-hidden bg-[#FCFBFA]">
              {/* Image preview banner */}
              {bannerPreview ? (
                <div className="h-28 w-full relative">
                  <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-16 w-full bg-neutral-100 flex items-center justify-center text-[10px] text-[#A8A29E] border-b border-[#E7E5E4] font-medium uppercase tracking-wider">
                  No Banner Uploaded
                </div>
              )}
              
              <div className="p-4 space-y-3 relative">
                {/* Image preview thumb */}
                <div className="flex gap-3">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Thumbnail" className="w-12 h-12 rounded-xl object-cover border border-[#E7E5E4]" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#FFF1F4] text-[#8B1538] flex items-center justify-center border border-[#F3CBD5]">
                      <Layers className="w-5 h-5" />
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-[#1C1917] truncate max-w-[170px]">{name || 'Category Name'}</h3>
                    <p className="text-[10px] font-mono text-[#A8A29E] truncate max-w-[170px]">/{slug || 'category-url'}</p>
                  </div>
                </div>

                <p className="text-xs text-[#57534E] leading-relaxed line-clamp-3">
                  {description || 'Category description details will appear here...'}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[#F0EEEC] text-[10px]">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold border ${
                    status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                  <span className="font-bold text-[#78716C]">Order: {displayOrder}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Summary Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#F0EEEC] shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-[#78716C] uppercase tracking-wider border-b border-[#F0EEEC] pb-1.5">Category Summary</h2>
            
            <div className="space-y-2 text-xs text-[#57534E]">
              <div className="flex justify-between">
                <span className="text-[#78716C]">Parent Category:</span>
                <span className="font-semibold text-[#1C1917]">
                  {selectedParentOpt ? selectedParentOpt.name.replace(/—\s*/g, '') : 'None (Root Category)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Hierarchy Level:</span>
                <span className="font-bold text-[#1C1917]">Level {derivedLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Status:</span>
                <span className="font-semibold text-[#1C1917]">{status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Menu Visibility:</span>
                <span className="font-semibold text-[#1C1917]">{isMenuVisible ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Sort Order:</span>
                <span className="font-bold text-[#1C1917]">{displayOrder}</span>
              </div>
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 space-y-2.5">
            <h2 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-700" /> Tips
            </h2>
            <ul className="list-disc pl-4 text-[11px] text-blue-950 space-y-1.5 leading-relaxed font-medium">
              <li>Choose a clear and descriptive name for website menu layout.</li>
              <li>Add high-resolution square images (800x800px) to showcase your category cards.</li>
              <li>Organize categories into proper hierarchies to help customers browse faster.</li>
              <li>Use the sort order field to arrange items deterministically in the navigation tree.</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}

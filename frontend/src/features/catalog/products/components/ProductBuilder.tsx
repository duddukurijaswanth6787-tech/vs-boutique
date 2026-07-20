'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { 
  useCreateProduct, 
  useUpdateProduct, 
  useAssignCategories, 
  useAssignAttributes,
  usePublishProduct,
  useUnpublishProduct
} from '../product.hooks';
import { useCategoryTree } from '../../categories/category.hooks';
import { useBrands } from '../../brands/brand.hooks';
import { useAttributes } from '../../attributes/attribute.hooks';
import { useCreateVariant, useVariants, useDeleteVariant } from '../../variants/variant.hooks';
import { useMediaList, useCreateMedia, useDeleteMedia, useSetPrimaryMedia } from '../../media/media.hooks';
import { ProductThumbnail } from '@/components/ui/ProductThumbnail';
import { mediaService } from '../../media/media.service';
import { ProductResponse, ProductType, GenderType, AgeGroup, ProductStatus, ProductVisibility } from '../product.types';
import { AttributeType } from '../product.types';
import { generateVariantMatrix } from '../../variants/utils';
import { 
  ShoppingBag, 
  Plus, 
  Check,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Star,
  Trash2,
  Image as ImageIcon,
  Save,
  ChevronDown,
  X,
  MoreVertical,
  Upload,
  Sparkles,
  ExternalLink
} from 'lucide-react';

// ponytail: optional number fields use catch(undefined) — NaN fails z.number, catch substitutes undefined
const optNum = (n: z.ZodNumber) => n.optional().catch(undefined);

const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  brandId: z.string().uuid('Please select a valid brand'),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters'),
  shortDescription: z.string().max(300, 'Max 300 characters').optional(),
  description: z.string().max(5000, 'Max 5000 characters').optional(),
  type: z.nativeEnum(ProductType).optional(),
  basePrice: z.number().min(0, 'Price must be a non-negative number'),
  salePrice: optNum(z.number().min(0, 'Sale price must be non-negative')),
  costPrice: optNum(z.number().min(0, 'Cost price must be non-negative')),
  taxPercentage: optNum(z.number().min(0).max(100)),
  trackInventory: z.boolean().optional(),
  allowBackorder: z.boolean().optional(),
  weight: optNum(z.number().min(0)),
  length: optNum(z.number().min(0)),
  width: optNum(z.number().min(0)),
  height: optNum(z.number().min(0)),
  gender: z.nativeEnum(GenderType).optional(),
  ageGroup: z.nativeEnum(AgeGroup).optional(),
  occasion: z.string().optional(),
  season: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  canonicalUrl: z.string().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  visibility: z.nativeEnum(ProductVisibility).optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  focusKeyword: z.string().optional(),
  careInstructions: z.string().optional(),
  returnPolicy: z.string().optional(),
  warranty: z.string().optional(),
  hsnCode: z.string().optional(),
  countryOfOrigin: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductBuilderProps {
  productId?: string;
  initialData?: ProductResponse;
  onSaveSuccess?: (id: string) => void;
}

export default function ProductBuilder({ productId, initialData, onSaveSuccess }: ProductBuilderProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [savedId, setSavedId] = useState<string | undefined>(productId);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [publishMenuOpen, setPublishMenuOpen] = useState(false);

  // Queries
  const { data: categoryTree, isLoading: loadingCategories } = useCategoryTree();
  const { data: brandList } = useBrands({ limit: 100 });
  const { data: attributeList, isLoading: loadingAttributes } = useAttributes({ limit: 100 });
  const { data: existingMedia, refetch: refetchMedia } = useMediaList({ productId: savedId });
  const { data: existingVariants, refetch: refetchVariants } = useVariants({ productId: savedId });

  // Mutations
  const createProductMut = useCreateProduct();
  const updateProductMut = useUpdateProduct();
  const assignCategoriesMut = useAssignCategories();
  const assignAttributesMut = useAssignAttributes();
  const createVariantMut = useCreateVariant();
  const deleteVariantMut = useDeleteVariant();
  const createMediaMut = useCreateMedia();
  const deleteMediaMut = useDeleteMedia();
  const setPrimaryMediaMut = useSetPrimaryMedia();
  const publishProductMut = usePublishProduct();
  const unpublishProductMut = useUnpublishProduct();

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      brandId: initialData?.brandId || '',
      sku: initialData?.sku || '',
      slug: initialData?.slug || '',
      shortDescription: initialData?.shortDescription || '',
      description: initialData?.description || '',
      type: (initialData?.type as ProductType) || ProductType.READYMADE,
      basePrice: initialData?.basePrice || 0,
      salePrice: initialData?.salePrice ?? undefined,
      costPrice: initialData?.costPrice ?? undefined,
      taxPercentage: initialData?.taxPercentage ?? 12,
      trackInventory: initialData?.trackInventory ?? true,
      allowBackorder: initialData?.allowBackorder ?? false,
      weight: initialData?.weight ?? undefined,
      length: initialData?.length ?? undefined,
      width: initialData?.width ?? undefined,
      height: initialData?.height ?? undefined,
      gender: (initialData?.gender as GenderType) || GenderType.WOMEN,
      ageGroup: (initialData?.ageGroup as AgeGroup) || AgeGroup.AGE_18_22,
      occasion: initialData?.occasion || '',
      season: initialData?.season || '',
      seoTitle: initialData?.seoTitle || '',
      seoDescription: initialData?.seoDescription || '',
      seoKeywords: initialData?.seoKeywords || '',
      canonicalUrl: initialData?.canonicalUrl || '',
      status: (initialData?.status as ProductStatus) || ProductStatus.DRAFT,
      visibility: (initialData?.visibility as ProductVisibility) || ProductVisibility.VISIBLE,
      isFeatured: initialData?.isFeatured || false,
      isNewArrival: initialData?.isNewArrival || false,
      isBestSeller: initialData?.isBestSeller || false,
      focusKeyword: 'banarasi silk saree',
      careInstructions: 'Dry Clean Only',
      returnPolicy: '7 Days Easy Returns',
      warranty: 'No Warranty',
      hsnCode: '54075200',
      countryOfOrigin: 'India',
    },
  });

  const formValues = watch();

  useEffect(() => {
    setIsFormDirty(isDirty);
  }, [isDirty]);

  // Unsaved changes prompt
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirty && step < 6) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty, step]);

  // Category selection local state
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    initialData?.categories?.map((c) => c.categoryId) || []
  );

  // Dynamic attribute local state
  const [assignedAttributes, setAssignedAttributes] = useState<Record<string, string>>(
    initialData?.attributes?.reduce((acc, curr) => ({ ...acc, [curr.attributeId]: curr.value || '' }), {}) || {}
  );

  // S3 upload variables
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, number>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Variant generator state
  const [selectedVariantAttributes, setSelectedVariantAttributes] = useState<string[]>([]);
  const [variantOptionsMap, setVariantOptionsMap] = useState<Record<string, string[]>>({});
  
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [sizeOptions, setSizeOptions] = useState<string[]>([]);

  // Meta keywords & tags local arrays
  const [metaKeywords, setMetaKeywords] = useState<string[]>([]);
  const [productTags, setProductTags] = useState<string[]>([]);

  // Tag input text fields
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  // Media gallery URL input
  const [mediaUrlInput, setMediaUrlInput] = useState('');

  // Handle Save (Create or Update Product)
  const onProductSubmit = async (values: ProductFormValues) => {
    try {
      // Destructure and strip frontend-only SEO/Additional fields to avoid payload mismatch
      const { 
        focusKeyword, careInstructions, returnPolicy, warranty, hsnCode, countryOfOrigin, 
        ...apiValues 
      } = values;

      // Add keywords and tags arrays
      const payload = {
        ...apiValues,
        seoKeywords: metaKeywords.join(', '),
        tags: productTags,
      };

      let currentId = savedId;
      if (currentId) {
        // Update product
        await updateProductMut.mutateAsync({
          id: currentId,
          dto: payload,
        });
      } else {
        // Create product
        const created = await createProductMut.mutateAsync({
          ...payload,
          categoryIds: selectedCategoryIds,
        });
        currentId = created.id;
        setSavedId(created.id);
      }

      // Assign categories
      if (currentId && selectedCategoryIds.length > 0) {
        await assignCategoriesMut.mutateAsync({
          id: currentId,
          dto: { categoryIds: selectedCategoryIds },
        });
      }

      // Assign dynamic attributes
      if (currentId) {
        const attributePayload = Object.entries(assignedAttributes)
          .filter(([, value]) => value !== '')
          .map(([attributeId, value]) => ({ attributeId, value }));
        
        if (attributePayload.length > 0) {
          await assignAttributesMut.mutateAsync({
            id: currentId,
            dto: { attributes: attributePayload },
          });
        }
      }

      setIsFormDirty(false);
      if (currentId) {
        if (step < 5) {
          setStep(step + 1);
        } else {
          // Move to Step 6 Success screen
          setStep(6);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upload S3 Logic
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!savedId) {
      setUploadError('Please save the product basic information first.');
      return;
    }
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setUploadError(`Unsupported format: ${file.name}. Use JPEG, PNG, or WEBP.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`File too large: ${file.name}. Max 10MB.`);
        continue;
      }

      const fileKey = `${file.name}-${Date.now()}`;
      try {
        setUploadingFiles((prev) => ({ ...prev, [fileKey]: 0 }));
        const ext = file.name.split('.').pop() || 'jpg';
        const { uploadUrl, url } = await mediaService.getUploadUrl(savedId, 'IMAGE', ext);

        await mediaService.uploadToS3(uploadUrl, file, (pct) => {
          setUploadingFiles((prev) => ({ ...prev, [fileKey]: pct }));
        });

        await createMediaMut.mutateAsync({
          productId: savedId,
          mediaType: 'IMAGE',
          url,
          displayOrder: (existingMedia?.data?.length || 0) + i,
          isPrimary: (existingMedia?.data?.length || 0) === 0,
        });

        refetchMedia();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error
          ? getApiErrorMessage(err) || err.message
          : String(err);
        setUploadError(`Upload failed for ${file.name}: ${errorMsg}`);
      } finally {
        setUploadingFiles((prev) => {
          const next = { ...prev };
          delete next[fileKey];
          return next;
        });
      }
    }
  };

  // Add media URL manually
  const handleAddMediaUrl = async () => {
    if (!savedId) {
      setUploadError('Please save the basic information first.');
      return;
    }
    if (!mediaUrlInput || !mediaUrlInput.startsWith('http')) {
      setUploadError('Please enter a valid HTTP image URL.');
      return;
    }
    try {
      setUploadError(null);
      await createMediaMut.mutateAsync({
        productId: savedId,
        mediaType: 'IMAGE',
        url: mediaUrlInput,
        displayOrder: existingMedia?.data?.length || 0,
        isPrimary: (existingMedia?.data?.length || 0) === 0,
      });
      setMediaUrlInput('');
      refetchMedia();
    } catch (err: unknown) {
      setUploadError((err instanceof Error ? err.message : String(err)) || 'Failed to add image URL.');
    }
  };

  // Matrix Generator execution
  const triggerMatrixGeneration = async () => {
    if (!savedId) return;
    const basePrice = formValues.basePrice || 0;

    const selectors = selectedVariantAttributes.map((attrId) => {
      const attr = attributeList?.data?.find((a) => a.id === attrId);
      const selectedOpts = variantOptionsMap[attrId] || [];
      const opts = attr?.options?.filter((o) => selectedOpts.includes(o.id)).map((o) => ({
        id: o.id,
        label: o.label,
        value: o.value,
      })) || [];

      return {
        attributeId: attrId,
        name: attr?.name || '',
        options: opts,
      };
    });

    const matrix = generateVariantMatrix(selectors, basePrice);
    if (matrix.length > 50) {
      const confirmGen = window.confirm(`This will generate ${matrix.length} variants. Proceed?`);
      if (!confirmGen) return;
    }

    try {
      for (const item of matrix) {
        await createVariantMut.mutateAsync({
          productId: savedId,
          title: item.title,
          priceOverride: item.priceOverride,
          attributeValues: item.attributeValues,
        });
      }
      refetchVariants();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteMediaFile = async (id: string) => {
    if (!savedId) return;
    if (window.confirm('Delete this image?')) {
      await deleteMediaMut.mutateAsync({ id, productId: savedId });
      refetchMedia();
    }
  };

  const makePrimaryMedia = async (id: string) => {
    if (!savedId) return;
    await setPrimaryMediaMut.mutateAsync({ id, productId: savedId });
    refetchMedia();
  };

  const deleteProductVariant = async (id: string) => {
    if (window.confirm('Delete this product variant?')) {
      await deleteVariantMut.mutateAsync(id);
      refetchVariants();
    }
  };

  const handlePublish = async () => {
    if (!savedId) return;
    try {
      await publishProductMut.mutateAsync(savedId);
      setValue('status', ProductStatus.ACTIVE);
      setPublishMenuOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnpublish = async () => {
    if (!savedId) return;
    try {
      await unpublishProductMut.mutateAsync(savedId);
      setValue('status', ProductStatus.DRAFT);
      setPublishMenuOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Helper: Find selected brand name
  const selectedBrandName = brandList?.data?.find(b => b.id === formValues.brandId)?.name || 'Vasanthi';

  // Helper: Find primary image URL
  const primaryImageUrl = existingMedia?.data?.find(m => m.isPrimary)?.url || existingMedia?.data?.[0]?.url;

  // Helper: Calculate margin
  const sellingPrice = formValues.basePrice || 0;
  const costPrice = formValues.costPrice || 0;
  const marginPercentage = sellingPrice > 0 ? (((sellingPrice - costPrice) / sellingPrice) * 100) : 0;

  const steps = [
    { number: 1, label: 'Basic Information' },
    { number: 2, label: 'Pricing & Inventory' },
    { number: 3, label: 'Variants & Attributes' },
    { number: 4, label: 'Media' },
    { number: 5, label: 'SEO & Additional' }
  ];

  // Success view dashboard
  if (step === 6) {
    return (
      <div className="space-y-6">
        {/* Stepper with all 5 checked */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
            {steps.map((s, idx) => (
              <React.Fragment key={s.number}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-green-600 text-white">
                    ✓
                  </div>
                  <span className="text-xs font-bold text-neutral-400">{s.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="hidden md:block h-0.5 flex-1 bg-green-600" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content grid */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 w-full space-y-6">
            
            {/* Center card Success message */}
            <div className="bg-white p-8 rounded-2xl border border-neutral-200/60 shadow-sm text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-4 border border-green-100">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-neutral-900">Product Added Successfully!</h2>
              <p className="text-xs text-neutral-400 max-w-md mt-1.5">
                &ldquo;{formValues.name}&rdquo; has been added to your catalog.
              </p>

              {/* Strip summary info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-neutral-50 border border-neutral-200/50 p-4 rounded-xl w-full max-w-2xl mt-6 text-left">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Product ID</span>
                  <span className="text-xs font-bold text-green-700 font-mono">#PROD-{savedId?.substring(0, 8).toUpperCase() || '000125'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Status</span>
                  <span className="inline-block bg-green-50 border border-green-100 text-green-700 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase mt-0.5">Active</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Visibility</span>
                  <span className="text-xs font-bold text-neutral-800">Catalog & Search</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Created On</span>
                  <span className="text-xs font-bold text-neutral-800">
                    {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* What's Next list of actions */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-neutral-900">What&apos;s Next?</h3>
              <p className="text-xs text-neutral-400">Choose what you would like to do next.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 mt-4">
                {/* Add Another */}
                <div className="p-4 border border-neutral-100 rounded-2xl bg-neutral-50/50 hover:bg-neutral-50 transition-colors flex flex-col justify-between items-center text-center">
                  <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-3">
                    <Plus className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-neutral-900 mb-1">Add Another</h4>
                  <p className="text-[10px] text-neutral-400 leading-normal mb-4">Continue building your catalog by adding another product.</p>
                  <button
                    onClick={() => { setStep(1); setSavedId(undefined); router.push('/admin/catalog/products/new'); }}
                    className="w-full text-center py-1.5 border border-green-600 text-green-600 rounded-lg text-[10px] font-bold hover:bg-green-50 transition-colors cursor-pointer"
                  >
                    Add New Product
                  </button>
                </div>

                {/* Manage Products */}
                <div className="p-4 border border-neutral-100 rounded-2xl bg-neutral-50/50 hover:bg-neutral-50 transition-colors flex flex-col justify-between items-center text-center">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-neutral-900 mb-1">Manage Products</h4>
                  <p className="text-[10px] text-neutral-400 leading-normal mb-4">View, edit or manage all your products in the catalog.</p>
                  <button
                    onClick={() => router.push('/admin/catalog/products')}
                    className="w-full text-center py-1.5 border border-blue-600 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    View All Products
                  </button>
                </div>

                {/* Add to Collection */}
                <div className="p-4 border border-neutral-100 rounded-2xl bg-neutral-50/50 hover:bg-neutral-50 transition-colors flex flex-col justify-between items-center text-center">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                    <Plus className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-neutral-900 mb-1">Add to Collection</h4>
                  <p className="text-[10px] text-neutral-400 leading-normal mb-4">Organize this product into collections for better sales.</p>
                  <button
                    onClick={() => toast.info('Collections can be managed from the product edit page')}
                    className="w-full text-center py-1.5 border border-purple-600 text-purple-600 rounded-lg text-[10px] font-bold hover:bg-purple-50 transition-colors cursor-pointer"
                  >
                    Add to Collection
                  </button>
                </div>

                {/* Create Promotion */}
                <div className="p-4 border border-neutral-100 rounded-2xl bg-neutral-50/50 hover:bg-neutral-50 transition-colors flex flex-col justify-between items-center text-center">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-neutral-900 mb-1">Create Promotion</h4>
                  <p className="text-[10px] text-neutral-400 leading-normal mb-4">Create offers or discounts to boost product sales.</p>
                  <button
                    onClick={() => router.push('/admin/promotions/offers')}
                    className="w-full text-center py-1.5 border border-amber-600 text-amber-600 rounded-lg text-[10px] font-bold hover:bg-amber-50 transition-colors cursor-pointer"
                  >
                    Create Promotion
                  </button>
                </div>

                {/* Preview Product */}
                <div className="p-4 border border-neutral-100 rounded-2xl bg-neutral-50/50 hover:bg-neutral-50 transition-colors flex flex-col justify-between items-center text-center">
                  <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center mb-3">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-neutral-900 mb-1">Preview Product</h4>
                  <p className="text-[10px] text-neutral-400 leading-normal mb-4">See how your product looks on the storefront.</p>
                  <button
                    onClick={() => window.open(`/products/${formValues.slug}`, '_blank')}
                    className="w-full text-center py-1.5 border border-pink-600 text-pink-600 rounded-lg text-[10px] font-bold hover:bg-pink-50 transition-colors cursor-pointer"
                  >
                    Preview Product
                  </button>
                </div>
              </div>
            </div>

            {/* Sales tips banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4 items-start shadow-sm">
              <div className="p-2 rounded-xl bg-white text-blue-600 shadow-sm shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-1.5 text-blue-800">
                <span className="font-bold text-neutral-900 block text-sm">Tips to Increase Sales</span>
                <p className="text-neutral-500 font-medium">Add high quality images, fill complete product details, and manage inventory properly to promote your product to reach more customers.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mt-2 text-neutral-600 font-medium">
                  <div>✓ Add more product images</div>
                  <div>✓ Add product to collections</div>
                  <div>✓ Keep inventory updated</div>
                  <div>✓ Ensure SEO details are complete</div>
                  <div>✓ Create attractive offers</div>
                  <div>✓ Share on social media</div>
                </div>
              </div>
            </div>

            {/* Navigation buttons at bottom */}
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={() => router.push('/admin/catalog/products')}
                className="px-6 py-2.5 bg-[#7A1C30] hover:bg-[#641424] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                Go to Products <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* Right Summary Sidebar (Success screen version) */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden divide-y divide-neutral-100">
              <div className="p-4 bg-neutral-50 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Product Summary</span>
                <span className="px-2.5 py-0.5 bg-green-50 border border-green-100 text-green-700 rounded-full text-[9px] font-bold uppercase">Active</span>
              </div>
              
              <div className="p-4 flex gap-3 items-center">
                <ProductThumbnail src={primaryImageUrl} alt="preview" />
                <div>
                  <h4 className="font-bold text-xs text-neutral-900 truncate max-w-[170px]">{formValues.name || 'Untitled Product'}</h4>
                  <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">{formValues.sku || 'VD-SR-1001'}</span>
                </div>
              </div>

              <div className="p-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Category</span>
                  <span className="text-neutral-800 font-bold">
                    {categoryTree?.flatMap(root => [root, ...((root.children || []))]).find(c => c.id === selectedCategoryIds[0])?.name || 'Sarees'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Brand</span>
                  <span className="text-neutral-800 font-bold">{selectedBrandName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Product Type</span>
                  <span className="text-neutral-800 font-bold capitalize">{formValues.type === ProductType.READYMADE ? 'Simple Product' : formValues.type?.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Gender</span>
                  <span className="text-neutral-800 font-bold capitalize">{formValues.gender?.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Variants</span>
                  <span className="text-neutral-800 font-bold">{colorOptions.length * sizeOptions.length} Variants</span>
                </div>
              </div>

              <div className="p-4 space-y-2.5 text-xs">
                <h5 className="font-bold text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Pricing</h5>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Selling Price</span>
                  <span className="text-neutral-800 font-bold">₹{sellingPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Compare At Price</span>
                  <span className="text-neutral-800 font-bold">₹{(formValues.salePrice || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Cost Price</span>
                  <span className="text-neutral-800 font-bold">₹{costPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Tax Class</span>
                  <span className="text-neutral-800 font-bold">GST {formValues.taxPercentage || 12}%</span>
                </div>
              </div>

              <div className="p-4 space-y-2.5 text-xs">
                <h5 className="font-bold text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Inventory</h5>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Track Inventory</span>
                  <span className="text-neutral-800 font-bold">{formValues.trackInventory ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Initial Stock</span>
                  <span className="text-neutral-800 font-bold">120</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Low Stock Threshold</span>
                  <span className="text-neutral-800 font-bold">20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Stock Status</span>
                  <span className="text-green-600 font-bold">In Stock</span>
                </div>
              </div>

              {/* Media gallery sidebar strip */}
              {existingMedia?.data && existingMedia.data.length > 0 && (
                <div className="p-4 space-y-2 text-xs">
                  <h5 className="font-bold text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Media ({existingMedia.data.length})</h5>
                  <div className="grid grid-cols-5 gap-1.5 mt-1">
                    {existingMedia.data.slice(0, 4).map((m) => (
                      <div key={m.id} className="aspect-square rounded-lg border border-neutral-200 overflow-hidden bg-neutral-50">
                        <img src={m.url} alt="thumbnail" className="object-cover w-full h-full" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      </div>
                    ))}
                    {existingMedia.data.length > 4 && (
                      <div className="aspect-square rounded-lg border border-neutral-200 overflow-hidden bg-neutral-900/60 flex items-center justify-center text-white text-[10px] font-bold">
                        +{existingMedia.data.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar with controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm">
        <div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
            <span>Catalog</span>
            <span>/</span>
            <span>Products</span>
            <span>/</span>
            <span className="text-[#8B5A6B]">Add New Product</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 font-sans tracking-tight">Add New Product</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Create a new product and fill all the required information.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => {
              if (window.confirm('Discard draft and go back?')) {
                router.push('/admin/catalog/products');
              }
            }}
            className="px-4 py-2 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold rounded-xl border border-neutral-200 shadow-sm transition-colors cursor-pointer"
          >
            Save as Draft
          </button>
          
          <div className="relative">
            <button 
              type="button"
              onClick={() => setPublishMenuOpen(!publishMenuOpen)}
              className="bg-[#7A1C30] hover:bg-[#641424] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              Publish Product <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {publishMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setPublishMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-neutral-200 bg-white p-1 shadow-md z-20">
                  <button
                    type="button"
                    onClick={handlePublish}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 font-medium transition-colors"
                  >
                    Set Active (Publish)
                  </button>
                  <button
                    type="button"
                    onClick={handleUnpublish}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 font-medium transition-colors"
                  >
                    Set Draft (Unpublish)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stepper progress indicator */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
          {steps.map((s, idx) => {
            const isActive = step === s.number;
            const isCompleted = step > s.number;
            return (
              <React.Fragment key={s.number}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${isActive ? 'bg-[#7A1C30] text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-neutral-100 text-neutral-500'}
                  `}>
                    {isCompleted ? '✓' : s.number}
                  </div>
                  <span className={`text-xs font-bold ${isActive ? 'text-neutral-900 font-bold' : 'text-neutral-400 font-semibold'}`}>{s.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`hidden md:block h-0.5 flex-1 transition-all ${step > s.number ? 'bg-green-600' : 'bg-neutral-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form content and sidebar panels layout */}
      <form onSubmit={handleSubmit(onProductSubmit)} className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Left main form cards */}
        <div className="flex-1 w-full space-y-6 min-w-0">
          
          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-3">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Product Name *</label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="Enter product name"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30] transition-colors"
                  />
                  {errors.name && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.name.message}</p>}
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">SKU (Stock Keeping Unit) *</label>
                  <input
                    type="text"
                    {...register('sku')}
                    placeholder="Enter SKU"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30] transition-colors font-mono"
                  />
                  {errors.sku && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.sku.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Slug *</label>
                  <input
                    type="text"
                    {...register('slug')}
                    placeholder="product-url-slug"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30] transition-colors"
                  />
                  {errors.slug && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.slug.message}</p>}
                  <p className="text-[10px] text-neutral-400 mt-1 font-medium">URL friendly version of the name</p>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Short Description *</label>
                  <textarea
                    {...register('shortDescription')}
                    placeholder="Enter short description"
                    rows={2}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30] transition-colors"
                  />
                  {errors.shortDescription && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.shortDescription.message}</p>}
                  <p className="text-[10px] text-neutral-400 mt-1 font-medium">Brief summary about the product</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Description *</label>
                <div className="border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50">
                  <div className="flex items-center gap-2 border-b border-neutral-200 px-3 py-1.5 bg-white text-neutral-400">
                    <button type="button" className="p-1 hover:bg-neutral-50 rounded text-neutral-600 font-serif font-bold text-xs">Paragraph</button>
                    <div className="h-4 w-px bg-neutral-200" />
                    <button type="button" className="p-1 hover:bg-neutral-50 rounded text-neutral-600 font-bold text-xs">B</button>
                    <button type="button" className="p-1 hover:bg-neutral-50 rounded text-neutral-600 italic text-xs">I</button>
                    <button type="button" className="p-1 hover:bg-neutral-50 rounded text-neutral-600 underline text-xs">U</button>
                  </div>
                  <textarea
                    {...register('description')}
                    placeholder="Enter detailed description about the product..."
                    rows={6}
                    className="w-full bg-transparent px-4 py-3 text-xs text-neutral-900 focus:outline-none"
                  />
                </div>
                {errors.description && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Product Type *</label>
                  <select
                    {...register('type')}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30] transition-colors"
                  >
                    {Object.values(ProductType).map((t) => (
                      <option key={t} value={t}>{t === ProductType.READYMADE ? 'Simple Product' : t}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Gender *</label>
                  <select
                    {...register('gender')}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30] transition-colors"
                  >
                    {Object.values(GenderType).map((g) => (
                      <option key={g} value={g}>{g.charAt(0) + g.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Age Group</label>
                  <select
                    {...register('ageGroup')}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30] transition-colors"
                  >
                    {Object.values(AgeGroup).map((age) => (
                      <option key={age} value={age}>
                        {age === '35+' ? '35+' : `${age} Years`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Tags</label>
                <input
                  type="text"
                  placeholder="Enter tags and press enter..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30]"
                />
                <p className="text-[10px] text-neutral-400 mt-1 font-medium">Add relevant tags to this product</p>
              </div>
            </div>
          )}

          {/* STEP 2: Pricing & Inventory */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Pricing section */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm space-y-5">
                <h2 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-3">Pricing</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Selling Price (INR) *</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('basePrice', { valueAsNumber: true })}
                      placeholder="e.g. 3499"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30]"
                    />
                    {errors.basePrice && <p className="text-red-500 text-[10px] mt-1 font-semibold">{errors.basePrice.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Compare At Price (INR)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('salePrice', { valueAsNumber: true })}
                      placeholder="e.g. 5999"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Cost Price (INR)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('costPrice', { valueAsNumber: true })}
                      placeholder="e.g. 2100"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Tax Class</label>
                    <select
                      {...register('taxPercentage', { valueAsNumber: true })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30]"
                    >
                      <option value="12">GST 12%</option>
                      <option value="5">GST 5%</option>
                      <option value="18">GST 18%</option>
                      <option value="0">GST Exempt</option>
                    </select>
                  </div>
                </div>

                {/* MRP info banner */}
                {formValues.salePrice && formValues.basePrice && formValues.salePrice > formValues.basePrice && (
                  <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 font-medium">
                    ℹ️ MRP is higher than selling price. Discount: {(((formValues.salePrice - formValues.basePrice) / formValues.salePrice) * 100).toFixed(2)}%
                  </div>
                )}
              </div>

              {/* Inventory section */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <h2 className="text-base font-bold text-neutral-900">Inventory</h2>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('trackInventory')}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7A1C30]"></div>
                    <span className="ml-2 text-xs font-bold text-neutral-500 uppercase">Track Inventory</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Low Stock Threshold *</label>
                    <input
                      type="number"
                      placeholder="e.g. 20"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Initial Stock *</label>
                    <input
                      type="number"
                      placeholder="e.g. 120"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Allow Backorders</label>
                    <select
                      {...register('allowBackorder')}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none font-semibold"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Stock Status</label>
                    <select
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none"
                    >
                      <option value="in_stock">In Stock</option>
                      <option value="low_stock">Low Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Warehouse Inventory (Optional) */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm space-y-5">
                <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                  <h2 className="text-base font-bold text-neutral-900">Warehouse Inventory <span className="text-xs font-normal text-neutral-400 font-sans">(Optional)</span></h2>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xs text-[#7A1C30] hover:text-[#5e1322] font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Warehouse
                  </button>
                </div>

                <div className="overflow-hidden border border-neutral-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold">
                        <th className="p-3.5">Warehouse</th>
                        <th className="p-3.5">Available Stock</th>
                        <th className="p-3.5">Reserved Stock</th>
                        <th className="p-3.5">Initial Stock</th>
                        <th className="p-3.5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      <tr>
                        <td className="p-3.5 font-medium text-neutral-800">Main Warehouse - Hyderabad</td>
                        <td className="p-3.5"><input type="number" defaultValue={100} className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 text-center" /></td>
                        <td className="p-3.5"><input type="number" defaultValue={0} className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 text-center" /></td>
                        <td className="p-3.5"><input type="number" defaultValue={100} className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 text-center" /></td>
                        <td className="p-3.5 text-right"><button type="button" className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-medium text-neutral-800">Banjara Hills Store</td>
                        <td className="p-3.5"><input type="number" defaultValue={20} className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 text-center" /></td>
                        <td className="p-3.5"><input type="number" defaultValue={0} className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 text-center" /></td>
                        <td className="p-3.5"><input type="number" defaultValue={20} className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 text-center" /></td>
                        <td className="p-3.5 text-right"><button type="button" className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Variants & Attributes */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Attributes table mapping */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm space-y-5">
                <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                  <h2 className="text-base font-bold text-neutral-900">Variants & Attributes</h2>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xs text-[#7A1C30] hover:text-[#5e1322] font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Attribute
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400">Define attributes for this product and generate variants.</p>

                <div className="overflow-hidden border border-neutral-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold">
                        <th className="p-3.5">Attribute</th>
                        <th className="p-3.5">Input Type</th>
                        <th className="p-3.5 text-center">Is Required</th>
                        <th className="p-3.5 text-center">Show on Product</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-neutral-800">
                      <tr>
                        <td className="p-3.5 font-bold flex items-center gap-2">
                          <span className="w-4 h-4 bg-orange-100 text-orange-700 rounded flex items-center justify-center font-bold text-[9px]">C</span> Color
                        </td>
                        <td className="p-3.5"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600">Dropdown</span></td>
                        <td className="p-3.5 text-center"><span className="text-green-600 font-bold">●</span></td>
                        <td className="p-3.5 text-center"><span className="text-green-600 font-bold">●</span></td>
                        <td className="p-3.5 text-right"><button type="button" className="text-neutral-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-bold flex items-center gap-2">
                          <span className="w-4 h-4 bg-blue-100 text-blue-700 rounded flex items-center justify-center font-bold text-[9px]">S</span> Size
                        </td>
                        <td className="p-3.5"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600">Dropdown</span></td>
                        <td className="p-3.5 text-center"><span className="text-green-600 font-bold">●</span></td>
                        <td className="p-3.5 text-center"><span className="text-green-600 font-bold">●</span></td>
                        <td className="p-3.5 text-right"><button type="button" className="text-neutral-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Attribute Options tabs */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm space-y-5">
                <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3">2. Attribute Options</h3>
                
                <div className="flex border-b border-neutral-200 gap-4 mb-4">
                  <button type="button" className="border-b-2 border-[#7A1C30] text-[#7A1C30] font-bold pb-2 text-xs">Color Options ({colorOptions.length})</button>
                  <button type="button" className="text-neutral-400 font-bold pb-2 text-xs">Size Options ({sizeOptions.length})</button>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {colorOptions.map((opt, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700">
                      <span className={`w-3.5 h-3.5 rounded-full border border-neutral-300 block`} style={{ backgroundColor: opt.toLowerCase().replace(' ', '') }} />
                      {opt}
                      <button type="button" onClick={() => setColorOptions(colorOptions.filter(x => x !== opt))} className="text-neutral-400 hover:text-neutral-600 font-bold">×</button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newColor = window.prompt('Enter new color name:');
                      if (newColor) setColorOptions([...colorOptions, newColor]);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-neutral-50 border border-[#7A1C30] text-[#7A1C30] border-dashed rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    + Add Option
                  </button>
                </div>
              </div>

              {/* Generated variants preview */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm space-y-5">
                <div className="flex justify-between items-center border-b border-[#3E1624]/10 pb-3">
                  <h3 className="text-sm font-bold text-neutral-900">3. Generated Variants Preview</h3>
                  <span className="text-xs text-neutral-400 font-semibold">Total Variants that will be created: {colorOptions.length * sizeOptions.length} ({colorOptions.length} Colors x {sizeOptions.length} Sizes)</span>
                </div>
                
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => toast.info('Preview is available on the storefront')}
                    className="px-4 py-2 border border-neutral-200 hover:border-neutral-300 text-neutral-700 text-xs font-bold rounded-xl bg-white shadow-sm cursor-pointer"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={triggerMatrixGeneration}
                    className="px-4 py-2 bg-[#7A1C30] hover:bg-[#641424] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                  >
                    Generate Variants
                  </button>
                </div>

                <div className="overflow-hidden border border-neutral-200 rounded-xl mt-4">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold">
                        <th className="p-3 w-12">Preview</th>
                        <th className="p-3">Color</th>
                        <th className="p-3">Size</th>
                        <th className="p-3">SKU (Auto)</th>
                        <th className="p-3">Price (₹)</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3 w-10 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-neutral-800">
                      {colorOptions.slice(0, 4).flatMap((color) => 
                        sizeOptions.slice(0, 2).map((size, idx) => (
                          <tr key={`${color}-${size}`} className="hover:bg-neutral-50/50">
                            <td className="p-3">
                              <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center">
                                <ShoppingBag className="w-3.5 h-3.5 text-neutral-400" />
                              </div>
                            </td>
                            <td className="p-3 font-semibold">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full border border-neutral-200 block" style={{ backgroundColor: color.toLowerCase().replace(' ', '') }} />
                                {color}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-neutral-600">{size}</td>
                            <td className="p-3"><input type="text" defaultValue={`VD-LH-${color.substring(0,3).toUpperCase()}-${size}`} className="bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 text-[11px] text-neutral-900 font-mono" /></td>
                            <td className="p-3"><input type="number" defaultValue={sellingPrice || 3499} className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 text-[11px] text-neutral-900 text-center font-semibold" /></td>
                            <td className="p-3"><input type="number" defaultValue={100} className="w-16 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 text-[11px] text-neutral-900 text-center" /></td>
                            <td className="p-3 text-right"><button type="button" className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Media Gallery Redesigned Card Grid Layout */}
          {step === 4 && (
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Product Media</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Add product images and videos. First image will be used as the product thumbnail.</p>
              </div>
              
              <div className="flex border-b border-neutral-200 gap-4 mb-2">
                <button type="button" className="border-b-2 border-[#7A1C30] text-[#7A1C30] font-bold pb-2 text-xs">Image Gallery</button>
                <button type="button" className="text-neutral-400 font-bold pb-2 text-xs">Video (Optional)</button>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 font-medium">
                ℹ️ You can upload images directly from your device. Recommended size: 1200 x 1500px. Max 10MB per image.
              </div>

              {/* Add image URL input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-400 uppercase">Or Add Image via URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mediaUrlInput}
                    onChange={(e) => setMediaUrlInput(e.target.value)}
                    placeholder="Enter image URL (https://...)"
                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30]"
                  />
                  <button
                    type="button"
                    onClick={handleAddMediaUrl}
                    className="bg-[#7A1C30] hover:bg-[#641424] text-white font-bold px-4 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add URL
                  </button>
                </div>
              </div>

              {/* Upload Images Box */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-400 uppercase">Upload Images</label>
                <div className="border-2 border-dashed border-neutral-200 hover:border-[#7A1C30]/50 transition-colors rounded-2xl p-8 text-center bg-neutral-50/50 hover:bg-neutral-50 relative flex flex-col items-center justify-center">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/jpeg,image/png,image/webp"
                  />
                  <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                  <span className="text-xs font-bold text-neutral-800">Drag & drop images here</span>
                  <span className="text-[10px] text-neutral-400 my-1">or</span>
                  <button type="button" className="px-4 py-1.5 bg-[#7A1C30] text-white rounded-lg text-xs font-bold">Choose Images</button>
                  <span className="text-[9px] text-neutral-400 mt-2">JPG, PNG, WEBP files only • Max 10MB per image</span>
                </div>
                <div className="text-[9px] text-neutral-400 font-semibold uppercase mt-1">You can upload up to 10 images</div>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
                  {uploadError}
                </div>
              )}

              {/* Uploading progress bars */}
              {Object.keys(uploadingFiles).length > 0 && (
                <div className="space-y-2 p-4 border border-neutral-100 rounded-xl bg-neutral-50">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Uploading directly to S3...</span>
                  {Object.entries(uploadingFiles).map(([filename, pct]) => (
                    <div key={filename} className="text-xs">
                      <div className="flex justify-between font-semibold mb-1">
                        <span className="truncate max-w-[200px]">{filename}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#7A1C30] h-full transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Redesigned Uploaded Images Grid */}
              <div className="space-y-4 pt-4 border-t border-neutral-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Uploaded Images ({existingMedia?.data?.length || 0}/10)</h3>
                  <button type="button" className="flex items-center gap-1 text-[11px] text-[#7A1C30] hover:text-[#5e1322] font-bold border border-[#7A1C30]/20 rounded-lg px-2.5 py-1 bg-white cursor-pointer shadow-sm">
                    <RefreshCw className="w-3 h-3" /> Reorder Images
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {existingMedia?.data?.map((media, idx) => (
                    <div key={media.id} className="group relative border border-neutral-200 rounded-2xl overflow-hidden bg-neutral-50 shadow-sm flex flex-col justify-between">
                      <div className="aspect-square relative flex items-center justify-center bg-white border-b border-neutral-100 overflow-hidden">
                        {/* Index Indicator */}
                        <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-neutral-900 text-white font-bold text-[10px] flex items-center justify-center shadow-md">
                          {idx + 1}
                        </div>
                        {/* Primary Badge */}
                        {media.isPrimary && (
                          <div className="absolute top-2 right-2 bg-green-600 text-white rounded-md px-1.5 py-0.5 text-[8px] font-bold uppercase shadow-sm">
                            Primary
                          </div>
                        )}
                        <img src={media.url} alt="Uploaded Saree" className="object-cover w-full h-full" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      </div>

                      {/* Info footer with ellipsis */}
                      <div className="p-2 bg-white flex items-center justify-between gap-1.5">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-neutral-800 truncate block">{media.url.split('/').pop()?.substring(0, 15) || 'saree-detail.jpg'}</span>
                          <span className="text-[8px] text-neutral-400 block font-semibold mt-0.5">1.2 MB</span>
                        </div>
                        
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Make this primary or delete?')) {
                                if (!media.isPrimary) {
                                  makePrimaryMedia(media.id);
                                } else {
                                  deleteMediaFile(media.id);
                                }
                              }
                            }}
                            className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!existingMedia?.data || existingMedia.data.length === 0) && (
                    <div className="col-span-full py-8 text-center text-neutral-400 text-xs">No media uploaded yet. Use the drag & drop area to upload files.</div>
                  )}
                </div>

                {/* Image Guidelines Box */}
                <div className="bg-neutral-50 p-4 rounded-xl text-neutral-500 space-y-1.5 text-[11px] font-medium border border-neutral-200/50 mt-6">
                  <span className="font-bold text-neutral-800 uppercase block mb-1">Image Guidelines</span>
                  <div>• First image will be used as the product thumbnail.</div>
                  <div>• Use high quality images with white or light background.</div>
                  <div>• Show multiple angles, close-ups and fabric details.</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: SEO & Additional Information */}
          {step === 5 && (
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-neutral-900">SEO & Additional Information</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Optimize your product for search engines and provide additional details.</p>
              </div>

              <div className="space-y-5 border-t border-neutral-100 pt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="block text-xs font-bold text-neutral-400 uppercase">Meta Title *</label>
                      <span className="text-[10px] text-neutral-400 font-semibold">{formValues.seoTitle?.length || 0}/60 characters used</span>
                    </div>
                    <input
                      type="text"
                      {...register('seoTitle')}
                      placeholder="Enter meta title"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="block text-xs font-bold text-neutral-400 uppercase">Meta Description *</label>
                      <span className="text-[10px] text-neutral-400 font-semibold">{formValues.seoDescription?.length || 0}/160 characters used</span>
                    </div>
                    <textarea
                      {...register('seoDescription')}
                      rows={2}
                      placeholder="Enter meta description"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30]"
                    />
                  </div>
                </div>

                {/* Meta Keywords Tag Input */}
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Meta Keywords ({metaKeywords.length}/20 keywords)</label>
                  <div className="flex flex-wrap gap-2 border border-neutral-200 bg-neutral-50 rounded-xl p-3 items-center">
                    {metaKeywords.map((kw, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-600">
                        {kw}
                        <button type="button" onClick={() => setMetaKeywords(metaKeywords.filter(x => x !== kw))} className="text-neutral-400 hover:text-neutral-600">×</button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={newKeywordInput}
                      onChange={(e) => setNewKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newKeywordInput.trim()) {
                            setMetaKeywords([...metaKeywords, newKeywordInput.trim()]);
                            setNewKeywordInput('');
                          }
                        }
                      }}
                      placeholder="Add keyword and press enter..."
                      className="flex-1 bg-transparent border-none text-xs focus:outline-none p-1 min-w-[150px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">URL Slug *</label>
                    <input
                      type="text"
                      {...register('slug')}
                      placeholder="banarasi-silk-saree"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none"
                    />
                    <span className="text-[10px] text-neutral-400 block mt-1 font-semibold">https://vasanthidesigners.com/products/{formValues.slug}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Focus Keyword</label>
                    <input
                      type="text"
                      {...register('focusKeyword')}
                      placeholder="Enter focus keyword"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none"
                    />
                    <span className="text-[10px] text-neutral-400 block mt-1 font-semibold">This will help us analyze your SEO</span>
                  </div>
                </div>

                {/* Additional Information Section */}
                <div className="border-t border-neutral-100 pt-5 space-y-4">
                  <h3 className="text-sm font-bold text-neutral-900">Additional Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Care Instructions</label>
                      <select
                        {...register('careInstructions')}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none"
                      >
                        <option value="Dry Clean Only">Dry Clean Only</option>
                        <option value="Hand Wash Cold">Hand Wash Cold</option>
                        <option value="Machine Wash Warm">Machine Wash Warm</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Return Policy</label>
                      <select
                        {...register('returnPolicy')}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none"
                      >
                        <option value="7 Days Easy Returns">7 Days Easy Returns</option>
                        <option value="No Returns Applicable">No Returns Applicable</option>
                        <option value="30 Days Standard returns">30 Days Standard returns</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Warranty</label>
                      <select
                        {...register('warranty')}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none"
                      >
                        <option value="No Warranty">No Warranty</option>
                        <option value="6 Months Warranty">6 Months Warranty</option>
                        <option value="1 Year Brand Warranty">1 Year Brand Warranty</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">HSN Code</label>
                      <input
                        type="text"
                        {...register('hsnCode')}
                        placeholder="e.g. 54075200"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Country of Origin</label>
                      <select
                        {...register('countryOfOrigin')}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none"
                      >
                        <option value="India">India</option>
                        <option value="Bangladesh">Bangladesh</option>
                        <option value="China">China</option>
                      </select>
                    </div>
                  </div>

                  {/* Additional Product Tags Badges Input */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Tags</label>
                    <div className="flex flex-wrap gap-2 border border-neutral-200 bg-neutral-50 rounded-xl p-3 items-center">
                      {productTags.map((t, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-neutral-200 rounded-lg text-xs font-semibold text-[#7A1C30]">
                          {t}
                          <button type="button" onClick={() => setProductTags(productTags.filter(x => x !== t))} className="text-neutral-400 hover:text-neutral-600">×</button>
                        </span>
                      ))}
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newTagInput.trim()) {
                              setProductTags([...productTags, newTagInput.trim()]);
                              setNewTagInput('');
                            }
                          }
                        }}
                        placeholder="Add tag and press enter..."
                        className="flex-1 bg-transparent border-none text-xs focus:outline-none p-1 min-w-[150px]"
                      />
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* Stepper Wizard Footer Controls */}
          <div className="border-t border-neutral-100 pt-6 flex justify-between items-center bg-white mt-6">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 border border-neutral-200 hover:border-neutral-300 bg-white text-neutral-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              )}
            </div>

            <div className="flex gap-3">
              {step < 5 ? (
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#7A1C30] hover:bg-[#641424] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Save & Continue <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="text-right">
                  <button
                    type="submit"
                    disabled={createProductMut.isPending || updateProductMut.isPending}
                    className="px-6 py-2.5 bg-[#7A1C30] hover:bg-[#641424] disabled:bg-neutral-400 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {(createProductMut.isPending || updateProductMut.isPending) ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save & Confirm
                  </button>
                  <span className="block text-[9px] text-neutral-400 mt-1 font-semibold">You will be able to publish after confirmation.</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right floating cards column */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          {/* STEP 1: Right-hand sidebar widgets */}
          {step === 1 ? (
            <div className="space-y-6">
              {/* Product Status widget */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-2 uppercase tracking-wider">Product Status</h3>
                
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1 uppercase">Status *</label>
                  <select
                    {...register('status')}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none"
                  >
                    {Object.values(ProductStatus).map((s) => (
                      <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1 uppercase">Visibility</label>
                  <select
                    {...register('visibility')}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none"
                  >
                    {Object.values(ProductVisibility).map((v) => (
                      <option key={v} value={v}>{v === ProductVisibility.VISIBLE ? 'Catalog and Search' : v.toLowerCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Organization widget */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-2 uppercase tracking-wider">Organization</h3>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase">Category *</label>
                    <button type="button" className="text-[10px] text-[#7A1C30] font-bold">+ New Category</button>
                  </div>
                  {loadingCategories ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-neutral-400" />
                  ) : (
                    <select
                      value={selectedCategoryIds[0] || ''}
                      onChange={(e) => setSelectedCategoryIds([e.target.value])}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none"
                    >
                      <option value="">Select Category</option>
                      {categoryTree?.flatMap(root => [root, ...(root.children || [])]).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase">Brand *</label>
                    <button type="button" className="text-[10px] text-[#7A1C30] font-bold">+ New Brand</button>
                  </div>
                  <select
                    {...register('brandId')}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none"
                  >
                    <option value="">Select Brand</option>
                    {brandList?.data?.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Featured Options widget */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3.5">
                <h3 className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-2 uppercase tracking-wider">Featured Options</h3>
                
                <label className="flex items-center gap-2.5 text-xs text-neutral-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('isFeatured')}
                    className="rounded border-neutral-300 text-[#7A1C30] focus:ring-[#7A1C30] w-4 h-4"
                  />
                  Featured Product
                </label>

                <label className="flex items-center gap-2.5 text-xs text-neutral-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('isNewArrival')}
                    className="rounded border-neutral-300 text-[#7A1C30] focus:ring-[#7A1C30] w-4 h-4"
                  />
                  New Arrival
                </label>

                <label className="flex items-center gap-2.5 text-xs text-neutral-700 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('isBestSeller')}
                    className="rounded border-neutral-300 text-[#7A1C30] focus:ring-[#7A1C30] w-4 h-4"
                  />
                  Best Seller
                </label>
              </div>

              {/* Quick Media upload widget */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3.5">
                <h3 className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-2 uppercase tracking-wider">Quick Media (Images)</h3>
                
                <div className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center bg-neutral-50/50 hover:bg-neutral-50 transition-colors relative cursor-pointer flex flex-col items-center">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/jpeg,image/png,image/webp"
                  />
                  <ImageIcon className="w-6 h-6 text-neutral-400 mb-1.5" />
                  <span className="text-[10px] font-bold text-neutral-800">Drag & drop files or click</span>
                  <span className="text-[8px] text-neutral-400 mt-0.5">Will be uploaded to Media step</span>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2-5: Live Product Summary Panel */
            <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden divide-y divide-neutral-100">
                <div className="p-4 bg-neutral-50 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Product Summary</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase
                  ${formValues.status === ProductStatus.ACTIVE ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-neutral-100 text-neutral-500'}
                `}>
                  {formValues.status}
                </span>
              </div>
              
              <div className="p-4 flex gap-3 items-center">
                <ProductThumbnail src={primaryImageUrl} alt="preview" />
                <div>
                  <h4 className="font-bold text-xs text-neutral-900 truncate max-w-[170px]">{formValues.name || 'Untitled Product'}</h4>
                  <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">{formValues.sku || 'VD-SR-1001'}</span>
                </div>
              </div>

              <div className="p-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Category</span>
                  <span className="text-neutral-800 font-bold">
                    {categoryTree?.flatMap(root => [root, ...((root.children || []))]).find(c => c.id === selectedCategoryIds[0])?.name || 'Sarees'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Brand</span>
                  <span className="text-neutral-800 font-bold">{selectedBrandName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Product Type</span>
                  <span className="text-neutral-800 font-bold capitalize">{formValues.type === ProductType.READYMADE ? 'Simple Product' : formValues.type?.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Gender</span>
                  <span className="text-neutral-800 font-bold capitalize">{formValues.gender?.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Variants</span>
                  <span className="text-neutral-800 font-bold">{colorOptions.length * sizeOptions.length} Variants</span>
                </div>
              </div>

              <div className="p-4 space-y-2.5 text-xs">
                <h5 className="font-bold text-[10px] text-[#7A1C30] uppercase tracking-wider mb-1">Pricing</h5>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Selling Price</span>
                  <span className="text-neutral-800 font-bold">₹{sellingPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Compare At Price</span>
                  <span className="text-neutral-800 font-bold">₹{(formValues.salePrice || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Cost Price</span>
                  <span className="text-neutral-800 font-bold">₹{costPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Tax Class</span>
                  <span className="text-neutral-800 font-bold">GST {formValues.taxPercentage || 12}%</span>
                </div>
              </div>

              <div className="p-4 space-y-2.5 text-xs">
                <h5 className="font-bold text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Inventory</h5>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Track Inventory</span>
                  <span className="text-neutral-800 font-bold">{formValues.trackInventory ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Initial Stock</span>
                  <span className="text-neutral-800 font-bold">120</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Low Stock Threshold</span>
                  <span className="text-neutral-800 font-bold">20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Stock Status</span>
                  <span className="text-green-600 font-bold">In Stock</span>
                </div>
              </div>

              {/* Media gallery sidebar strip */}
              {existingMedia?.data && existingMedia.data.length > 0 && (
                <div className="p-4 space-y-2 text-xs">
                  <h5 className="font-bold text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Media ({existingMedia.data.length})</h5>
                  <div className="grid grid-cols-5 gap-1.5 mt-1">
                    {existingMedia.data.slice(0, 4).map((m) => (
                      <div key={m.id} className="aspect-square rounded-lg border border-neutral-200 overflow-hidden bg-neutral-50">
                        <img src={m.url} alt="thumbnail" className="object-cover w-full h-full" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      </div>
                    ))}
                    {existingMedia.data.length > 4 && (
                      <div className="aspect-square rounded-lg border border-neutral-200 overflow-hidden bg-neutral-900/60 flex items-center justify-center text-white text-[10px] font-bold">
                        +{existingMedia.data.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

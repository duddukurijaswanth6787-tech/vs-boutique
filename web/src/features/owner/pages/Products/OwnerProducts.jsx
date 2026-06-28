import React, { useState, useEffect, useContext } from 'react';
import OwnerLayout from '../../../../components/OwnerLayout';
import {
    getOwnerProducts, getOwnerProduct, createOwnerProduct, updateOwnerProduct, deleteOwnerProduct,
    getOwnerProductImages, addOwnerProductImage, deleteOwnerProductImage,
    getOwnerBrands, createOwnerBrand, updateOwnerBrand, deleteOwnerBrand,
    getOwnerTags, createOwnerTag, updateOwnerTag, deleteOwnerTag,
    getProductVariants, createProductVariant, updateProductVariant, deleteProductVariant,
    updateProductInventory, getActiveCategories, uploadImage
} from '@core/services';
import {
    Plus, Edit2, Trash2, Image as ImageIcon, Check, X, Loader2,
    Search, Package, Tags, Layers, Archive, Box, Eye, EyeOff,
    ChevronDown, ChevronUp, AlertCircle, ExternalLink
} from 'lucide-react';
import { AuthContext } from '@core/contexts';

const STATUS_OPTIONS = ['DRAFT', 'ACTIVE', 'INACTIVE', 'DISCONTINUED'];
const PRODUCT_TYPES = ['READY_MADE', 'PRE_ORDER', 'CUSTOM', 'DIGITAL'];
const DELIVERY_TYPES = ['STANDARD', 'EXPRESS', 'PICKUP', 'HOME_DELIVERY', 'SHIP'];

export default function OwnerProducts() {
    const { user } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [categories, setCategories] = useState([]);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '', description: '', shortDescription: '', sku: '', barcode: '',
        basePrice: '', compareAtPrice: '', costPrice: '',
        categoryId: '', subCategoryId: '', brandId: '',
        productType: 'READY_MADE', deliveryType: 'STANDARD',
        status: 'DRAFT', isFeatured: false, isMarketplaceVisible: true, isTaxable: true,
        tags: []
    });
    const [subCategories, setSubCategories] = useState([]);

    // Brands & Tags
    const [brands, setBrands] = useState([]);
    const [tags, setTags] = useState([]);
    const [showBrandManager, setShowBrandManager] = useState(false);
    const [showTagManager, setShowTagManager] = useState(false);
    const [brandForm, setBrandForm] = useState({ name: '', description: '', logo: '' });
    const [tagForm, setTagForm] = useState({ name: '' });
    const [editingBrandId, setEditingBrandId] = useState(null);
    const [editingTagId, setEditingTagId] = useState(null);

    // Variants
    const [variants, setVariants] = useState([]);
    const [showVariantForm, setShowVariantForm] = useState(false);
    const [editingVariantId, setEditingVariantId] = useState(null);
    const [variantForm, setVariantForm] = useState({
        name: '', sku: '', price: '', sortOrder: 0, attributes: '{}'
    });

    // Inventory
    const [inventoryForm, setInventoryForm] = useState({
        quantity: 0, lowStockThreshold: 5, trackInventory: true
    });
    const [showInventoryForm, setShowInventoryForm] = useState(false);
    const [inventoryVariantId, setInventoryVariantId] = useState(null);

    // Images
    const [images, setImages] = useState([]);
    const [showImageManager, setShowImageManager] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    const [expandedProduct, setExpandedProduct] = useState(null);

    const fetchProducts = async () => {
        try {
            const params = { page, limit: 20 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            const res = await getOwnerProducts(params);
            setProducts(res.data || []);
            setPagination(res.pagination);
        } catch (err) {
            console.error('Failed to load products:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await getActiveCategories();
            setCategories(res || []);
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    };

    const fetchBrandsTags = async () => {
        try {
            const [bRes, tRes] = await Promise.all([
                getOwnerBrands(), getOwnerTags()
            ]);
            setBrands(bRes.data || []);
            setTags(tRes.data || []);
        } catch (err) {
            console.error('Failed to load brands/tags:', err);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        fetchBrandsTags();
    }, [page, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== undefined) {
                setPage(1);
                fetchProducts();
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const handleCategoryChange = (catId) => {
        const cat = categories.find(c => c.id === catId);
        setSubCategories(cat?.subCategories || []);
        setForm(f => ({ ...f, categoryId: catId, subCategoryId: '' }));
    };

    const openCreateForm = () => {
        setEditingId(null);
        setForm({
            name: '', description: '', shortDescription: '', sku: '', barcode: '',
            basePrice: '', compareAtPrice: '', costPrice: '',
            categoryId: '', subCategoryId: '', brandId: '',
            productType: 'READY_MADE', deliveryType: 'STANDARD',
            status: 'DRAFT', isFeatured: false, isMarketplaceVisible: true, isTaxable: true,
            tags: []
        });
        setVariants([]);
        setSubCategories([]);
        setShowForm(true);
    };

    const openEditForm = async (id) => {
        try {
            const res = await getOwnerProduct(id);
            const p = res.data;
            setEditingId(id);
            setForm({
                name: p.name || '', description: p.description || '', shortDescription: p.shortDescription || '',
                sku: p.sku || '', barcode: p.barcode || '',
                basePrice: p.basePrice?.toString() || '', compareAtPrice: p.compareAtPrice?.toString() || '',
                costPrice: p.costPrice?.toString() || '',
                categoryId: p.categoryId || '', subCategoryId: p.subCategoryId || '', brandId: p.brandId || '',
                productType: p.productType || 'READY_MADE', deliveryType: p.deliveryType || 'STANDARD',
                status: p.status || 'DRAFT',
                isFeatured: p.isFeatured || false, isMarketplaceVisible: p.isMarketplaceVisible ?? true,
                isTaxable: p.isTaxable ?? true,
                tags: (p.tags || []).map(t => t.id)
            });
            if (p.categoryId) {
                handleCategoryChange(p.categoryId);
                setTimeout(() => setForm(f => ({ ...f, subCategoryId: p.subCategoryId || '' })), 50);
            }
            const vRes = await getProductVariants(id);
            setVariants(vRes.data || []);
            setShowForm(true);
        } catch (err) {
            console.error('Failed to load product:', err);
        }
    };

    const handleSave = async () => {
        if (!form.name || !form.basePrice || !form.categoryId || !form.subCategoryId) {
            alert('Product name, base price, category, and sub-category are required');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                basePrice: parseFloat(form.basePrice) || 0,
                compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : null,
                costPrice: form.costPrice ? parseFloat(form.costPrice) : null
            };
            if (editingId) {
                await updateOwnerProduct(editingId, payload);
            } else {
                await createOwnerProduct(payload);
            }
            setShowForm(false);
            fetchProducts();
        } catch (err) {
            alert(err.response?.data?.message || err.message || 'Failed to save product');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await deleteOwnerProduct(id);
            fetchProducts();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete product');
        }
    };

    const handleActivate = async (id, status) => {
        try {
            await updateOwnerProduct(id, { status });
            fetchProducts();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update product status');
        }
    };

    // Image management
    const openImageManager = async (productId) => {
        try {
            const res = await getOwnerProductImages(productId);
            setImages(res.data || []);
            setExpandedProduct(productId);
            setShowImageManager(true);
        } catch (err) {
            console.error('Failed to load images:', err);
        }
    };

    const handleAddImage = async () => {
        if (!imageUrl) return;
        setUploading(true);
        try {
            await addOwnerProductImage(expandedProduct, { url: imageUrl });
            setImageUrl('');
            const res = await getOwnerProductImages(expandedProduct);
            setImages(res.data || []);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add image');
        } finally {
            setUploading(false);
        }
    };

    const handleUploadImage = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const res = await uploadImage(file, 'product');
            await addOwnerProductImage(expandedProduct, { url: res.url });
            const imgRes = await getOwnerProductImages(expandedProduct);
            setImages(imgRes.data || []);
        } catch (err) {
            alert(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteImage = async (imageId) => {
        if (!window.confirm('Delete this image?')) return;
        try {
            await deleteOwnerProductImage(expandedProduct, imageId);
            setImages(images.filter(i => i.id !== imageId));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete image');
        }
    };

    // Brand management
    const handleSaveBrand = async () => {
        if (!brandForm.name) return;
        try {
            if (editingBrandId) {
                await updateOwnerBrand(editingBrandId, brandForm);
            } else {
                await createOwnerBrand(brandForm);
            }
            setBrandForm({ name: '', description: '', logo: '' });
            setEditingBrandId(null);
            const res = await getOwnerBrands();
            setBrands(res.data || []);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save brand');
        }
    };

    const handleDeleteBrand = async (id) => {
        if (!window.confirm('Delete this brand?')) return;
        try {
            await deleteOwnerBrand(id);
            setBrands(brands.filter(b => b.id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete brand');
        }
    };

    // Tag management
    const handleSaveTag = async () => {
        if (!tagForm.name) return;
        try {
            if (editingTagId) {
                await updateOwnerTag(editingTagId, tagForm);
            } else {
                await createOwnerTag(tagForm);
            }
            setTagForm({ name: '' });
            setEditingTagId(null);
            const res = await getOwnerTags();
            setTags(res.data || []);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save tag');
        }
    };

    const handleDeleteTag = async (id) => {
        if (!window.confirm('Delete this tag?')) return;
        try {
            await deleteOwnerTag(id);
            setTags(tags.filter(t => t.id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete tag');
        }
    };

    // Variant management
    const openVariantForm = (variant = null) => {
        if (variant) {
            setEditingVariantId(variant.id);
            setVariantForm({
                name: variant.name || '', sku: variant.sku || '',
                price: variant.price?.toString() || '', sortOrder: variant.sortOrder || 0,
                attributes: typeof variant.attributes === 'object' ? JSON.stringify(variant.attributes) : (variant.attributes || '{}')
            });
        } else {
            setEditingVariantId(null);
            setVariantForm({ name: '', sku: '', price: '', sortOrder: variants.length, attributes: '{}' });
        }
        setShowVariantForm(true);
    };

    const handleSaveVariant = async () => {
        if (!variantForm.name) return;
        setSaving(true);
        try {
            const payload = {
                ...variantForm,
                price: variantForm.price ? parseFloat(variantForm.price) : null,
                attributes: JSON.parse(variantForm.attributes || '{}')
            };
            if (editingVariantId) {
                await updateProductVariant(expandedProduct, editingVariantId, payload);
            } else {
                await createProductVariant(expandedProduct, payload);
            }
            setShowVariantForm(false);
            const res = await getProductVariants(expandedProduct);
            setVariants(res.data || []);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save variant');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteVariant = async (variantId) => {
        if (!window.confirm('Delete this variant?')) return;
        try {
            await deleteProductVariant(expandedProduct, variantId);
            setVariants(variants.filter(v => v.id !== variantId));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete variant');
        }
    };

    // Inventory management
    const openInventoryForm = (variant) => {
        setInventoryVariantId(variant.id);
        setInventoryForm({
            quantity: variant.inventory?.quantity || 0,
            lowStockThreshold: variant.inventory?.lowStockThreshold || 5,
            trackInventory: variant.inventory?.trackInventory ?? true
        });
        setShowInventoryForm(true);
    };

    const handleSaveInventory = async () => {
        try {
            await updateProductInventory(expandedProduct, inventoryVariantId, inventoryForm);
            setShowInventoryForm(false);
            const res = await getProductVariants(expandedProduct);
            setVariants(res.data || []);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update inventory');
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            DRAFT: 'bg-gray-100 text-gray-600',
            ACTIVE: 'bg-green-100 text-green-700',
            INACTIVE: 'bg-yellow-100 text-yellow-700',
            DISCONTINUED: 'bg-red-100 text-red-600'
        };
        return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${colors[status] || colors.DRAFT}`}>{status}</span>;
    };

    if (loading) {
        return (
            <OwnerLayout title="Products">
                <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
            </OwnerLayout>
        );
    }

    return (
        <OwnerLayout title="Product Management">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <Package size={28} className="text-primary" />
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">Products</h2>
                        <p className="text-sm text-gray-500">{pagination?.total || 0} total products</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowBrandManager(true)} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Tags size={16} /> Brands
                    </button>
                    <button onClick={() => setShowTagManager(true)} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Layers size={16} /> Tags
                    </button>
                    <button onClick={openCreateForm} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 flex items-center gap-2">
                        <Plus size={18} /> Add Product
                    </button>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text" placeholder="Search products by name or SKU..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                </div>
                <select
                    value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                    <option value="">All Status</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* Product List */}
            <div className="space-y-3">
                {products.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <Package size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 font-bold text-lg">No products found</p>
                        <p className="text-gray-400 text-sm mt-1">Create your first product to start selling</p>
                        <button onClick={openCreateForm} className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold inline-flex items-center gap-2">
                            <Plus size={16} /> Add Product
                        </button>
                    </div>
                ) : (
                    products.map(product => (
                        <div key={product.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="p-5 flex items-center gap-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden">
                                    {product.images?.[0]?.url ? (
                                        <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300"><Box size={24} /></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-black text-gray-900 truncate">{product.name}</h3>
                                        {getStatusBadge(product.status)}
                                    </div>
                                    <p className="text-sm text-gray-500 truncate">
                                        {product.sku && <span className="mr-3">SKU: {product.sku}</span>}
                                        ₹{Number(product.basePrice).toLocaleString()}
                                        {product.compareAtPrice && <span className="line-through text-gray-300 ml-2">₹{Number(product.compareAtPrice).toLocaleString()}</span>}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button onClick={() => openImageManager(product.id)} className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-primary transition-colors" title="Manage Images">
                                        <ImageIcon size={18} />
                                    </button>
                                    <button onClick={() => openEditForm(product.id)} className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-blue-600 transition-colors" title="Edit Product">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleActivate(product.id, product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')} className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-green-600 transition-colors" title={product.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                                        {product.status === 'ACTIVE' ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                    <button onClick={() => handleDelete(product.id)} className="p-2.5 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Delete Product">
                                        <Trash2 size={18} />
                                    </button>
                                    <button onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)} className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-400 transition-colors">
                                        {expandedProduct === product.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Expanded variant section */}
                            {expandedProduct === product.id && (
                                <div className="border-t border-gray-50 px-5 py-4 bg-gray-50/50">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-black text-gray-700 flex items-center gap-2"><Layers size={16} /> Variants</h4>
                                        <button onClick={() => { setExpandedProduct(product.id); openVariantForm(); }} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                            <Plus size={14} /> Add Variant
                                        </button>
                                    </div>
                                    {variants.length === 0 ? (
                                        <p className="text-sm text-gray-400 py-2">No variants yet. Add sizes, colors, or packages.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {variants.map(v => (
                                                <div key={v.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100">
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{v.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {v.sku && <>SKU: {v.sku} | </>}
                                                            Price: ₹{v.price ? Number(v.price).toLocaleString() : 'N/A'}
                                                            {v.inventory && <> | Stock: {v.inventory.quantity}</>}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => openInventoryForm(v)} className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                                                            Inventory
                                                        </button>
                                                        <button onClick={() => openVariantForm(v)} className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400">
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button onClick={() => handleDeleteVariant(v.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold disabled:opacity-30 hover:bg-gray-50">
                        Previous
                    </button>
                    <span className="text-sm text-gray-500 font-bold px-4">
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold disabled:opacity-30 hover:bg-gray-50">
                        Next
                    </button>
                </div>
            )}

            {/* ── CREATE/EDIT PRODUCT MODAL ── */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 bg-black/40 overflow-y-auto" onClick={() => setShowForm(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-black text-gray-900">{editingId ? 'Edit Product' : 'Create Product'}</h3>
                            <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-50"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Product Name *</label>
                                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Enter product name" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Description</label>
                                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Product description" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Short Description</label>
                                    <input value={form.shortDescription} onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Brief description for product cards" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">SKU</label>
                                    <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="e.g. BL-001" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Barcode</label>
                                    <input value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Barcode/UPC" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Base Price *</label>
                                    <input type="number" step="0.01" value={form.basePrice} onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Compare At Price</label>
                                    <input type="number" step="0.01" value={form.compareAtPrice} onChange={e => setForm(f => ({ ...f, compareAtPrice: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Cost Price</label>
                                    <input type="number" step="0.01" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Category *</label>
                                    <select value={form.categoryId} onChange={e => handleCategoryChange(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none">
                                        <option value="">Select category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Sub Category *</label>
                                    <select value={form.subCategoryId} onChange={e => setForm(f => ({ ...f, subCategoryId: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none">
                                        <option value="">Select sub-category</option>
                                        {subCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Brand</label>
                                    <select value={form.brandId} onChange={e => setForm(f => ({ ...f, brandId: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none">
                                        <option value="">No brand</option>
                                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Product Type</label>
                                    <select value={form.productType} onChange={e => setForm(f => ({ ...f, productType: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none">
                                        {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Delivery Type</label>
                                    <select value={form.deliveryType} onChange={e => setForm(f => ({ ...f, deliveryType: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none">
                                        {DELIVERY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Status</label>
                                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none">
                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Tags</label>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <button key={tag.id} onClick={() => setForm(f => ({ ...f, tags: f.tags.includes(tag.id) ? f.tags.filter(t => t !== tag.id) : [...f.tags, tag.id] }))}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${form.tags.includes(tag.id) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'}`}>
                                            {tag.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="grid grid-cols-3 gap-4">
                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                                    <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                    <span className="text-sm font-bold text-gray-700">Featured</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                                    <input type="checkbox" checked={form.isMarketplaceVisible} onChange={e => setForm(f => ({ ...f, isMarketplaceVisible: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                    <span className="text-sm font-bold text-gray-700">Marketplace Visible</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                                    <input type="checkbox" checked={form.isTaxable} onChange={e => setForm(f => ({ ...f, isTaxable: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                    <span className="text-sm font-bold text-gray-700">Taxable</span>
                                </label>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 flex items-center gap-2">
                                {saving && <Loader2 size={16} className="animate-spin" />}
                                {editingId ? 'Update Product' : 'Create Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── IMAGE MANAGER MODAL ── */}
            {showImageManager && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pb-10 bg-black/40 overflow-y-auto" onClick={() => setShowImageManager(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-black text-gray-900">Manage Images</h3>
                            <button onClick={() => { setShowImageManager(false); setImages([]); }} className="p-2 rounded-xl hover:bg-gray-50"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex gap-2">
                                <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Paste image URL..." className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                                <button onClick={handleAddImage} disabled={uploading || !imageUrl} className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50">
                                    {uploading ? <Loader2 size={16} className="animate-spin" /> : 'Add'}
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400">Or upload:</span>
                                <label className="px-4 py-2 bg-gray-50 rounded-xl text-sm font-bold text-gray-600 cursor-pointer hover:bg-gray-100">
                                    Choose File
                                    <input type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
                                </label>
                                {uploading && <Loader2 size={16} className="animate-spin text-primary" />}
                            </div>
                            <div className="grid grid-cols-3 gap-3 mt-4">
                                {images.map(img => (
                                    <div key={img.id} className="relative group aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                                        <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button onClick={() => handleDeleteImage(img.id)} className="p-2 bg-red-500 text-white rounded-full"><Trash2 size={14} /></button>
                                        </div>
                                        {img.isPrimary && <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded">PRIMARY</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── VARIANT FORM MODAL ── */}
            {showVariantForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowVariantForm(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-black text-gray-900">{editingVariantId ? 'Edit Variant' : 'Add Variant'}</h3>
                            <button onClick={() => setShowVariantForm(false)} className="p-2 rounded-xl hover:bg-gray-50"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Variant Name *</label>
                                <input value={variantForm.name} onChange={e => setVariantForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="e.g. Small, Red, 500ml" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">SKU</label>
                                    <input value={variantForm.sku} onChange={e => setVariantForm(f => ({ ...f, sku: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Variant SKU" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Price</label>
                                    <input type="number" step="0.01" value={variantForm.price} onChange={e => setVariantForm(f => ({ ...f, price: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0.00" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Attributes (JSON)</label>
                                <textarea value={variantForm.attributes} onChange={e => setVariantForm(f => ({ ...f, attributes: e.target.value }))} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none" placeholder='{"color": "Red", "size": "M"}' />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Sort Order</label>
                                <input type="number" value={variantForm.sortOrder} onChange={e => setVariantForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setShowVariantForm(false)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600">Cancel</button>
                            <button onClick={handleSaveVariant} disabled={saving} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2">
                                {saving && <Loader2 size={16} className="animate-spin" />}
                                {editingVariantId ? 'Update' : 'Add Variant'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── INVENTORY FORM MODAL ── */}
            {showInventoryForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowInventoryForm(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-black text-gray-900">Inventory</h3>
                            <button onClick={() => setShowInventoryForm(false)} className="p-2 rounded-xl hover:bg-gray-50"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Quantity</label>
                                <input type="number" value={inventoryForm.quantity} onChange={e => setInventoryForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Low Stock Threshold</label>
                                <input type="number" value={inventoryForm.lowStockThreshold} onChange={e => setInventoryForm(f => ({ ...f, lowStockThreshold: parseInt(e.target.value) || 0 }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                            </div>
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                                <input type="checkbox" checked={inventoryForm.trackInventory} onChange={e => setInventoryForm(f => ({ ...f, trackInventory: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                <span className="text-sm font-bold text-gray-700">Track Inventory</span>
                            </label>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setShowInventoryForm(false)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600">Cancel</button>
                            <button onClick={handleSaveInventory} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── BRAND MANAGER MODAL ── */}
            {showBrandManager && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pb-10 bg-black/40 overflow-y-auto" onClick={() => setShowBrandManager(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-black text-gray-900">Brand Management</h3>
                            <button onClick={() => setShowBrandManager(false)} className="p-2 rounded-xl hover:bg-gray-50"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex gap-2">
                                <input value={brandForm.name} onChange={e => setBrandForm(f => ({ ...f, name: e.target.value }))} placeholder="Brand name" className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                                <button onClick={handleSaveBrand} disabled={!brandForm.name} className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50">
                                    {editingBrandId ? 'Update' : 'Add'}
                                </button>
                                {editingBrandId && <button onClick={() => { setBrandForm({ name: '', description: '', logo: '' }); setEditingBrandId(null); }} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-500">Cancel</button>}
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {brands.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">No brands created yet</p> : null}
                                {brands.map(b => (
                                    <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{b.name}</p>
                                            {b.description && <p className="text-xs text-gray-500">{b.description}</p>}
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => { setBrandForm({ name: b.name, description: b.description || '', logo: b.logo || '' }); setEditingBrandId(b.id); }} className="p-1.5 rounded-lg hover:bg-white text-gray-400"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDeleteBrand(b.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAG MANAGER MODAL ── */}
            {showTagManager && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pb-10 bg-black/40 overflow-y-auto" onClick={() => setShowTagManager(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-black text-gray-900">Tag Management</h3>
                            <button onClick={() => setShowTagManager(false)} className="p-2 rounded-xl hover:bg-gray-50"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex gap-2">
                                <input value={tagForm.name} onChange={e => setTagForm(f => ({ ...f, name: e.target.value }))} placeholder="Tag name" className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                                <button onClick={handleSaveTag} disabled={!tagForm.name} className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50">
                                    {editingTagId ? 'Update' : 'Add'}
                                </button>
                                {editingTagId && <button onClick={() => { setTagForm({ name: '' }); setEditingTagId(null); }} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-500">Cancel</button>}
                            </div>
                            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                                {tags.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">No tags created yet</p> : null}
                                {tags.map(t => (
                                    <div key={t.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                                        <span className="text-sm font-bold text-gray-700">{t.name}</span>
                                        <button onClick={() => { setTagForm({ name: t.name }); setEditingTagId(t.id); }} className="p-0.5 text-gray-300 hover:text-blue-500"><Edit2 size={12} /></button>
                                        <button onClick={() => handleDeleteTag(t.id)} className="p-0.5 text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </OwnerLayout>
    );
}

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getBoutiques, 
  getPublicProducts, 
  createOwnerProduct, 
  deleteOwnerProduct,
  updateOwnerServices,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  toggleSubCategory,
  addOwnerProductImage
} from '@core/services';
import api from '../../../../services/api.ts';
import { 
  Globe, 
  Layout, 
  ShoppingBag, 
  Scissors, 
  BarChart3, 
  Plus, 
  Trash2, 
  Save, 
  Check, 
  AlertCircle, 
  Loader2, 
  Smartphone, 
  CheckCircle2, 
  Percent, 
  Users,
  Search,
  ClipboardList,
  FolderOpen,
  Edit2,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveWebsiteControl() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('layout'); // 'layout' | 'products' | 'services' | 'reports'

  // ── CATEGORIES & SUBCATEGORIES STATES ─────────────────────
  const { data: adminCategories = [], refetch: refetchCategories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: getAdminCategories
  });

  const defaultCategoryForm = { name: '', description: '', image: '', sortOrder: 0, isActive: true };
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState(defaultCategoryForm);
  const [editingCat, setEditingCat] = useState(null);

  const defaultSubCategoryForm = { name: '', description: '', image: '', sortOrder: 0, isActive: true };
  const [subFormCategoryId, setSubFormCategoryId] = useState(null);
  const [subForm, setSubForm] = useState(defaultSubCategoryForm);
  const [editingSub, setEditingSub] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState(null); // 'category' | 'subcategory'
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const catMutation = useMutation({
    mutationFn: async ({ type, ...vars }) => {
      if (type === 'create') return createCategory(vars.data);
      if (type === 'update') return updateCategory(vars.id, vars.data);
      if (type === 'toggle') return toggleCategory(vars.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories']);
      refetchCategories();
    },
  });

  const subMutation = useMutation({
    mutationFn: async ({ type, ...vars }) => {
      if (type === 'create') return createSubCategory(vars.categoryId, vars.data);
      if (type === 'update') return updateSubCategory(vars.id, vars.data);
      if (type === 'toggle') return toggleSubCategory(vars.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories']);
      refetchCategories();
    },
  });

  const deleteCatMutation = useMutation({
    mutationFn: ({ id, adminPassword }) => deleteCategory(id, adminPassword),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories']);
      refetchCategories();
    },
  });

  const deleteSubMutation = useMutation({
    mutationFn: ({ id, adminPassword }) => deleteSubCategory(id, adminPassword),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories']);
      refetchCategories();
    },
  });

  const resetCatForm = () => {
    setCatForm(defaultCategoryForm);
    setEditingCat(null);
    setShowCatForm(false);
  };

  const handleEditCat = (cat) => {
    setCatForm({ name: cat.name, description: cat.description || '', image: cat.image || '', sortOrder: cat.sortOrder, isActive: cat.isActive });
    setEditingCat(cat);
    setShowCatForm(true);
  };

  const handleSaveCat = async () => {
    if (!catForm.name.trim()) return;
    try {
      if (editingCat) {
        await catMutation.mutateAsync({ type: 'update', id: editingCat.id, data: catForm });
      } else {
        await catMutation.mutateAsync({ type: 'create', data: catForm });
      }
      resetCatForm();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleToggleCat = (id) => {
    catMutation.mutate({ type: 'toggle', id });
  };

  const handleEditSub = (sub) => {
    setSubForm({ name: sub.name, description: sub.description || '', image: sub.image || '', sortOrder: sub.sortOrder, isActive: sub.isActive });
    setEditingSub(sub);
    setSubFormCategoryId(sub.categoryId);
  };

  const handleSaveSub = async () => {
    if (!subForm.name.trim()) return;
    try {
      if (editingSub) {
        await subMutation.mutateAsync({ type: 'update', id: editingSub.id, data: subForm });
      } else {
        await subMutation.mutateAsync({ type: 'create', categoryId: subFormCategoryId, data: subForm });
      }
      setSubForm(defaultSubCategoryForm);
      setEditingSub(null);
      setSubFormCategoryId(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save subcategory');
    }
  };

  const handleToggleSub = (id) => {
    subMutation.mutate({ type: 'toggle', id });
  };

  const handleConfirmDelete = async () => {
    if (!adminPassword) { setDeleteError('Please enter admin password.'); return; }
    setDeleteError('');
    try {
      if (deleteType === 'category') {
        await deleteCatMutation.mutateAsync({ id: deleteTarget.id, adminPassword });
      } else {
        await deleteSubMutation.mutateAsync({ id: deleteTarget.id, adminPassword });
      }
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      setDeleteType(null);
      setAdminPassword('');
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Delete failed');
    }
  };



  const getCategoryName = (cat) => {
    if (!cat) return '';
    return typeof cat === 'object' ? (cat.name || '') : cat;
  };

  // ── TAB 1: LAYOUT STATES ─────────────────────────────────
  const [layoutSettings, setLayoutSettings] = useState({
    announcement_bar: { enabled: true, text1: '', text2: '', text3: '' },
    hero_banner: { title: '', subtitle: '', ctaText: '', banners: [], autoplayInterval: 5 },
    general_settings: { codEnabled: true, returnsEnabled: true, supportPhone: '' }
  });

  const [showBannerForm, setShowBannerForm] = useState(false);
  const defaultBannerForm = { tag: '', title: '', subtitle: '', ctaText: '', imageUrl: '', mobileImageUrl: '' };
  const [bannerForm, setBannerForm] = useState(defaultBannerForm);
  const [editingBannerIndex, setEditingBannerIndex] = useState(null);

  const handleAddOrUpdateBanner = () => {
    if (!bannerForm.title.trim()) {
      alert('Please fill out the slide title.');
      return;
    }
    const currentBanners = [...(layoutSettings.hero_banner.banners || [])];
    if (editingBannerIndex !== null) {
      currentBanners[editingBannerIndex] = bannerForm;
    } else {
      currentBanners.push(bannerForm);
    }
    setLayoutSettings({
      ...layoutSettings,
      hero_banner: {
        ...layoutSettings.hero_banner,
        banners: currentBanners
      }
    });
    setBannerForm(defaultBannerForm);
    setEditingBannerIndex(null);
    setShowBannerForm(false);
  };

  const handleRemoveBanner = (index) => {
    const currentBanners = (layoutSettings.hero_banner.banners || []).filter((_, idx) => idx !== index);
    setLayoutSettings({
      ...layoutSettings,
      hero_banner: {
        ...layoutSettings.hero_banner,
        banners: currentBanners
      }
    });
  };

  const handleMoveBanner = (index, direction) => {
    const currentBanners = [...(layoutSettings.hero_banner.banners || [])];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= currentBanners.length) return;
    const temp = currentBanners[index];
    currentBanners[index] = currentBanners[targetIdx];
    currentBanners[targetIdx] = temp;
    setLayoutSettings({
      ...layoutSettings,
      hero_banner: {
        ...layoutSettings.hero_banner,
        banners: currentBanners
      }
    });
  };

  // Fetch settings
  const { data: settingsRes, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['liveSiteSettings'],
    queryFn: async () => {
      const res = await api.getSiteSettings();
      if (res) {
        setLayoutSettings({
          announcement_bar: res.announcement_bar || { enabled: true, text1: '', text2: '', text3: '' },
          hero_banner: {
            title: res.hero_banner?.title || '',
            subtitle: res.hero_banner?.subtitle || '',
            ctaText: res.hero_banner?.ctaText || '',
            banners: res.hero_banner?.banners || [],
            autoplayInterval: res.hero_banner?.autoplayInterval || 5
          },
          general_settings: res.general_settings || { codEnabled: true, returnsEnabled: true, supportPhone: '' }
        });
      }
      return res;
    }
  });

  // Save Settings Mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async ({ key, value }) => {
      return await api.updateSiteSettings(key, value);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['liveSiteSettings']);
      alert('Storefront layout updated successfully!');
    },
    onError: (err) => {
      alert('Failed to save layout settings: ' + err.message);
    }
  });

  const handleSaveLayout = (e) => {
    e.preventDefault();
    saveSettingsMutation.mutate({ key: 'announcement_bar', value: layoutSettings.announcement_bar });
    saveSettingsMutation.mutate({ key: 'hero_banner', value: layoutSettings.hero_banner });
    saveSettingsMutation.mutate({ key: 'general_settings', value: layoutSettings.general_settings });
  };

  // ── TAB 2: PRODUCTS STATES ───────────────────────────────
  const [productSearch, setProductSearch] = useState('');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    categoryId: '',
    subCategoryId: '',
    boutiqueId: '',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=60'
  });
  const [productFormSubcategories, setProductFormSubcategories] = useState([]);

  const handleProductCategoryChange = (catId) => {
    const cat = adminCategories.find(c => c.id === catId);
    setProductFormSubcategories(cat?.subCategories || []);
    setNewProduct(prev => ({ ...prev, categoryId: catId, subCategoryId: '' }));
  };

  // Fetch boutiques for dropdown options
  const { data: boutiquesRes } = useQuery({
    queryKey: ['adminBoutiquesList'],
    queryFn: getBoutiques
  });
  const boutiques = boutiquesRes?.success ? boutiquesRes.data : [];

  // Fetch all products
  const { data: productsRes, isLoading: isProductsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['adminAllProducts'],
    queryFn: async () => getPublicProducts({ limit: 100 })
  });
  const products = productsRes?.data || [];

  // Add Product Mutation
  const addProductMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await createOwnerProduct({
        name: payload.name,
        basePrice: payload.basePrice,
        price: payload.price,
        description: payload.description,
        categoryId: payload.categoryId,
        subCategoryId: payload.subCategoryId,
        boutiqueId: payload.boutiqueId
      });
      const product = res?.data;
      if (payload.imageUrl && product && product.id) {
        try {
          await addOwnerProductImage(product.id, { url: payload.imageUrl, isPrimary: true });
        } catch (imgErr) {
          console.warn('Failed to upload product image:', imgErr);
        }
      }
      return res;
    },
    onSuccess: async (createdData) => {
      refetchProducts();
      setIsAddProductOpen(false);
      
      // Update super admin product names list in settings registry
      try {
        const currentNames = settingsRes?.super_admin_product_names || [];
        if (!currentNames.includes(newProduct.name)) {
          const updatedNames = [...currentNames, newProduct.name];
          await api.updateSiteSettings('super_admin_product_names', updatedNames);
          queryClient.invalidateQueries(['liveSiteSettings']);
        }
      } catch (err) {
        console.warn('Failed to register product name to super admin list:', err);
      }
 
      setNewProduct({
        name: '',
        price: '',
        description: '',
        categoryId: '',
        subCategoryId: '',
        boutiqueId: '',
        imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=60'
      });
      setProductFormSubcategories([]);
      alert('Product created successfully!');
    },
    onError: (err) => {
      alert('Failed to add product: ' + (err.response?.data?.message || err.message));
    }
  });

  // Delete Product Mutation
  const deleteProductMutation = useMutation({
    mutationFn: deleteOwnerProduct,
    onSuccess: () => {
      refetchProducts();
      alert('Product deleted successfully');
    },
    onError: (err) => {
      alert('Failed to delete product: ' + (err.response?.data?.message || err.message));
    }
  });
 
  const handleAddProductSubmit = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.boutiqueId || !newProduct.categoryId || !newProduct.subCategoryId) {
      alert('Please fill out all required fields (Product name, price, boutique, category, and subcategory).');
      return;
    }
    addProductMutation.mutate({
      name: newProduct.name,
      basePrice: Number(newProduct.price),
      price: Number(newProduct.price),
      description: newProduct.description,
      categoryId: newProduct.categoryId,
      subCategoryId: newProduct.subCategoryId,
      boutiqueId: newProduct.boutiqueId,
      imageUrl: newProduct.imageUrl
    });
  };

  // Filtered products list
  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    getCategoryName(p.category).toLowerCase().includes(productSearch.toLowerCase())
  );

  // ── TAB 3: SERVICES STATES ───────────────────────────────
  const [selectedBoutiqueId, setSelectedBoutiqueId] = useState('');
  const [serviceInput, setServiceInput] = useState('');
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [boutiqueServices, setBoutiqueServices] = useState([]);
  const [boutiqueSpecialties, setBoutiqueSpecialties] = useState([]);
  const [savingServices, setSavingServices] = useState(false);

  // Select first boutique when loaded
  useEffect(() => {
    if (boutiques.length > 0 && !selectedBoutiqueId) {
      setSelectedBoutiqueId(boutiques[0].id);
    }
  }, [boutiques, selectedBoutiqueId]);

  // Load selected boutique services
  const selectedBoutique = boutiques.find(b => b.id === selectedBoutiqueId);
  useEffect(() => {
    if (selectedBoutique) {
      setBoutiqueServices(selectedBoutique.servicesOffered || []);
      setBoutiqueSpecialties(selectedBoutique.workTypeSpecialty || []);
    }
  }, [selectedBoutiqueId, selectedBoutique]);

  const handleAddService = () => {
    const val = serviceInput.trim();
    if (val && !boutiqueServices.includes(val)) {
      setBoutiqueServices([...boutiqueServices, val]);
      setServiceInput('');
    }
  };

  const handleAddSpecialty = () => {
    const val = specialtyInput.trim();
    if (val && !boutiqueSpecialties.includes(val)) {
      setBoutiqueSpecialties([...boutiqueSpecialties, val]);
      setSpecialtyInput('');
    }
  };

  const handleRemoveService = (service) => {
    setBoutiqueServices(boutiqueServices.filter(s => s !== service));
  };

  const handleRemoveSpecialty = (specialty) => {
    setBoutiqueSpecialties(boutiqueSpecialties.filter(s => s !== specialty));
  };

  const handleSaveServices = async () => {
    if (!selectedBoutiqueId) return;
    setSavingServices(true);
    try {
      // Direct call to boutique update endpoints (which super admin can access)
      await updateOwnerServices({
        servicesOffered: boutiqueServices,
        workTypeSpecialty: boutiqueSpecialties
      });
      // Invalidate queries to refresh boutiques list cache
      queryClient.invalidateQueries(['adminBoutiquesList']);
      alert('Boutique tailoring services updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update boutique services');
    } finally {
      setSavingServices(false);
    }
  };

  // ── TAB 4: REPORTS STATES ────────────────────────────────
  const { data: reports, isLoading: isReportsLoading } = useQuery({
    queryKey: ['storefrontReports'],
    queryFn: () => api.getStorefrontReports()
  });

  // ── STOREFRONT ORDERS STATES ─────────────────────────────
  const { data: ordersRes, isLoading: isOrdersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['liveUserOrders'],
    queryFn: () => api.getOrders()
  });
  const orders = ordersRes || [];

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      return await api.updateOrderStatus(orderId, status);
    },
    onSuccess: () => {
      refetchOrders();
      queryClient.invalidateQueries(['storefrontReports']);
      alert('Order status updated successfully');
    },
    onError: (err) => {
      alert('Failed to update status: ' + err.message);
    }
  });

  return (
    <div className="space-y-6 md:space-y-10">
      {/* Title Header */}
      <div>
        <h2 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight uppercase">Live Website Control</h2>
        <p className="text-gray-500 mt-1 font-medium text-sm md:text-base">
          Manage storefront customizations, e-commerce products, customized tailoring services, and view performance reports.
        </p>
      </div>

      {/* Tabs Row */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
        {[
          { id: 'layout', label: 'Layout & Promos', icon: Layout },
          { id: 'products', label: 'Products Catalog', icon: ShoppingBag },
          { id: 'categories', label: 'Catalog Categories', icon: FolderOpen },
          { id: 'services', label: 'Tailoring Services', icon: Scissors },
          { id: 'reports', label: 'Performance & Reports', icon: BarChart3 },
          { id: 'orders', label: 'Storefront Orders', icon: ClipboardList }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                isActive 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Settings Form & Live Preview Side-by-Side (where applicable) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Settings & Tables */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* TAB 1: LAYOUT & PROMOS */}
          {activeTab === 'layout' && (
            <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm p-6 md:p-8 space-y-8">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-wider flex items-center">
                <Layout className="mr-3 text-primary" size={20} /> Configure Customer Storefront
              </h3>

              {isSettingsLoading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : (
                <form onSubmit={handleSaveLayout} className="space-y-6">
                  {/* Announcement Bar Settings */}
                  <div className="bg-gray-50/50 p-6 rounded-3xl space-y-4 border border-gray-50">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Header Announcement Bar</h4>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={layoutSettings.announcement_bar.enabled}
                          onChange={(e) => setLayoutSettings({
                            ...layoutSettings,
                            announcement_bar: { ...layoutSettings.announcement_bar, enabled: e.target.checked }
                          })}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Promo Text 1</label>
                        <input 
                          type="text"
                          value={layoutSettings.announcement_bar.text1}
                          onChange={(e) => setLayoutSettings({
                            ...layoutSettings,
                            announcement_bar: { ...layoutSettings.announcement_bar, text1: e.target.value }
                          })}
                          disabled={!layoutSettings.announcement_bar.enabled}
                          className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Promo Text 2</label>
                        <input 
                          type="text"
                          value={layoutSettings.announcement_bar.text2}
                          onChange={(e) => setLayoutSettings({
                            ...layoutSettings,
                            announcement_bar: { ...layoutSettings.announcement_bar, text2: e.target.value }
                          })}
                          disabled={!layoutSettings.announcement_bar.enabled}
                          className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Promo Text 3</label>
                        <input 
                          type="text"
                          value={layoutSettings.announcement_bar.text3}
                          onChange={(e) => setLayoutSettings({
                            ...layoutSettings,
                            announcement_bar: { ...layoutSettings.announcement_bar, text3: e.target.value }
                          })}
                          disabled={!layoutSettings.announcement_bar.enabled}
                          className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hero Banner Section Settings */}
                  <div className="bg-gray-50/50 p-6 rounded-3xl space-y-5 border border-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                      <div>
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Hero Landing Banners</h4>
                        <p className="text-[10px] text-gray-400 font-medium">Add and customize dynamic landing page carousel slides.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setBannerForm(defaultBannerForm); setEditingBannerIndex(null); setShowBannerForm(!showBannerForm); }}
                        className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
                      >
                        {showBannerForm ? 'Close Slide Form' : 'Add New Slide'}
                      </button>
                    </div>

                    {/* Auto-play Timer configuration */}
                    <div className="space-y-1 max-w-[200px]">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Auto-Shift Delay (seconds)</label>
                      <input 
                        type="number"
                        min={2}
                        max={30}
                        value={layoutSettings.hero_banner.autoplayInterval || 5}
                        onChange={(e) => setLayoutSettings({
                          ...layoutSettings,
                          hero_banner: { ...layoutSettings.hero_banner, autoplayInterval: Number(e.target.value) }
                        })}
                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    {/* Add / Edit Slide form inline */}
                    <AnimatePresence>
                      {showBannerForm && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white p-5 rounded-2xl border border-gray-100 space-y-4">
                          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{editingBannerIndex !== null ? 'Edit Banner Slide' : 'Add New Banner Slide'}</h5>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Slide Title *</label>
                              <input 
                                type="text"
                                value={bannerForm.title}
                                onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Slide Badge/Tag</label>
                              <input 
                                type="text"
                                value={bannerForm.tag}
                                onChange={e => setBannerForm({ ...bannerForm, tag: e.target.value })}
                                placeholder="e.g. NEW SEASON"
                                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Subheading / Description</label>
                              <textarea 
                                rows={2}
                                value={bannerForm.subtitle}
                                onChange={e => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">CTA Button Label</label>
                              <input 
                                type="text"
                                value={bannerForm.ctaText}
                                onChange={e => setBannerForm({ ...bannerForm, ctaText: e.target.value })}
                                placeholder="e.g. Shop Collection"
                                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Desktop Banner Image URL</label>
                              <input 
                                type="text"
                                value={bannerForm.imageUrl}
                                onChange={e => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                                placeholder="https://images.unsplash.com/..."
                                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider text-primary font-bold">Mobile Banner Image URL (Optional - overrides on mobile viewports)</label>
                              <input 
                                type="text"
                                value={bannerForm.mobileImageUrl}
                                onChange={e => setBannerForm({ ...bannerForm, mobileImageUrl: e.target.value })}
                                placeholder="https://images.unsplash.com/..."
                                className="w-full px-4 py-2.5 bg-gray-50 border border-primary/20 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex space-x-3 pt-2">
                            <button type="button" onClick={() => { setShowBannerForm(false); setEditingBannerIndex(null); }} className="px-5 py-2 bg-gray-100 rounded-lg text-xs font-black uppercase tracking-wider text-gray-500 hover:bg-gray-200">Cancel</button>
                            <button type="button" onClick={handleAddOrUpdateBanner} className="px-6 py-2 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-wider">
                              {editingBannerIndex !== null ? 'Save Changes' : 'Add Slide'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Slides List Table */}
                    <div className="space-y-2">
                      <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">Active Carousel Slides ({layoutSettings.hero_banner.banners?.length || 0})</p>
                      
                      {(!layoutSettings.hero_banner.banners || layoutSettings.hero_banner.banners.length === 0) ? (
                        <div className="text-center py-6 bg-white rounded-2xl border border-dashed border-gray-200 text-xs text-gray-400 italic">
                          No custom slides defined. Using static storefront slides.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {layoutSettings.hero_banner.banners.map((slide, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                              <div className="flex items-center space-x-3">
                                <img src={slide.imageUrl || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100'} alt={slide.title} className="w-12 h-10 object-cover rounded-lg border border-gray-100" />
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <p className="text-xs font-bold text-gray-900">{slide.title}</p>
                                    {slide.tag && <span className="px-1.5 py-0.5 bg-accent/10 text-accent text-[8px] font-extrabold uppercase rounded">{slide.tag}</span>}
                                  </div>
                                  <p className="text-[10px] text-gray-400 mt-0.5 max-w-[250px] truncate">{slide.subtitle || 'No description'}</p>
                                  {slide.mobileImageUrl && <p className="text-[8px] text-primary font-bold mt-0.5">✓ Has custom mobile image</p>}
                                </div>
                              </div>

                              <div className="flex items-center space-x-1.5">
                                <button type="button" disabled={idx === 0} onClick={() => handleMoveBanner(idx, -1)} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 disabled:opacity-30">▲</button>
                                <button type="button" disabled={idx === layoutSettings.hero_banner.banners.length - 1} onClick={() => handleMoveBanner(idx, 1)} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 disabled:opacity-30">▼</button>
                                <button
                                  type="button"
                                  onClick={() => { setBannerForm(slide); setEditingBannerIndex(idx); setShowBannerForm(true); }}
                                  className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-blue-600"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBanner(idx)}
                                  className="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* General settings & badges */}
                  <div className="bg-gray-50/50 p-6 rounded-3xl space-y-4 border border-gray-50">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">General E-Commerce Flags</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100/50">
                        <div>
                          <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Cash On Delivery (COD)</p>
                          <p className="text-[10px] text-gray-400 font-medium">Toggle availability of COD at checkout</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={layoutSettings.general_settings.codEnabled}
                            onChange={(e) => setLayoutSettings({
                              ...layoutSettings,
                              general_settings: { ...layoutSettings.general_settings, codEnabled: e.target.checked }
                            })}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100/50">
                        <div>
                          <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Easy Returns & Exchanges</p>
                          <p className="text-[10px] text-gray-400 font-medium">Show Return Policy badges on products</p>
                        </div>
                        <label className="relative inline-flex inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={layoutSettings.general_settings.returnsEnabled}
                            onChange={(e) => setLayoutSettings({
                              ...layoutSettings,
                              general_settings: { ...layoutSettings.general_settings, returnsEnabled: e.target.checked }
                            })}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Support WhatsApp Contact Number</label>
                      <input 
                        type="text"
                        value={layoutSettings.general_settings.supportPhone}
                        onChange={(e) => setLayoutSettings({
                          ...layoutSettings,
                          general_settings: { ...layoutSettings.general_settings, supportPhone: e.target.value }
                        })}
                        placeholder="+91 XXXXXXXXXX"
                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    type="submit"
                    disabled={saveSettingsMutation.isPending}
                    className="w-full bg-gray-900 text-white rounded-2xl py-4 font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {saveSettingsMutation.isPending ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <Save size={18} />
                        <span>Publish Storefront Changes</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: PRODUCTS CATALOG */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm p-6 md:p-8 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-wider flex items-center">
                  <ShoppingBag className="mr-3 text-primary" size={20} /> Storefront Product Catalog
                </h3>
                
                <button
                  onClick={() => setIsAddProductOpen(!isAddProductOpen)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md"
                >
                  <Plus size={16} />
                  <span>{isAddProductOpen ? 'View Catalog List' : 'Add New Product'}</span>
                </button>
              </div>

              {isAddProductOpen ? (
                // Add Product Form
                <form onSubmit={handleAddProductSubmit} className="space-y-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-50/50">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Create Storefront Product</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Product Name *</label>
                      <input 
                        type="text"
                        required
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Price (INR) *</label>
                      <input 
                        type="number"
                        required
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Category *</label>
                      <select
                        required
                        value={newProduct.categoryId}
                        onChange={(e) => handleProductCategoryChange(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:outline-none"
                      >
                        <option value="">Select Category...</option>
                        {adminCategories.filter(c => c.isActive).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Subcategory *</label>
                      <select
                        required
                        value={newProduct.subCategoryId}
                        onChange={(e) => setNewProduct({ ...newProduct, subCategoryId: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:outline-none"
                      >
                        <option value="">Select Subcategory...</option>
                        {productFormSubcategories.filter(s => s.isActive).map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Assign to Boutique *</label>
                      <select
                        required
                        value={newProduct.boutiqueId}
                        onChange={(e) => setNewProduct({ ...newProduct, boutiqueId: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:outline-none"
                      >
                        <option value="">Select Partner Boutique...</option>
                        {boutiques.map(b => (
                          <option key={b.id} value={b.id}>{b.boutiqueName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Description</label>
                      <textarea
                        rows={2}
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Image Source URL</label>
                      <input 
                        type="text"
                        value={newProduct.imageUrl}
                        onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={addProductMutation.isPending}
                    className="w-full bg-primary hover:bg-primary-dark text-white rounded-2xl py-4 font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {addProductMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <><Plus size={18} /> <span>Create Product</span></>}
                  </button>
                </form>
              ) : (
                // Products list Table
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Search catalog products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  </div>

                  {isProductsLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-gray-100">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Details</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Boutique</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredProducts.map(product => {
                            const btq = boutiques.find(b => b.id === product.boutiqueId);
                            return (
                              <tr key={product.id} className="hover:bg-gray-50/50 transition-all">
                                <td className="px-6 py-4 flex items-center space-x-3">
                                  <img 
                                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100'} 
                                    alt={product.name}
                                    className="w-10 h-10 object-cover rounded-xl border border-gray-100"
                                  />
                                  <div>
                                    <p className="text-sm font-bold text-gray-900">{product.name}</p>
                                    <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{product.description || 'No description'}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-black uppercase tracking-wider">{getCategoryName(product.category)}</span>
                                </td>
                                <td className="px-6 py-4 text-xs font-semibold text-gray-600">{btq ? btq.boutiqueName : 'Independent'}</td>
                                <td className="px-6 py-4 text-sm font-black text-gray-900">₹{product.price}</td>
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete this product?')) {
                                        deleteProductMutation.mutate(product.id);
                                      }
                                    }}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {filteredProducts.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-gray-400 font-bold italic text-sm">No products found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: CATALOG CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-wider flex items-center">
                  <FolderOpen className="mr-3 text-primary" size={20} /> Centralized Catalog Categories
                </h3>
                <button
                  onClick={() => { if (!showCatForm) resetCatForm(); setShowCatForm(!showCatForm); }}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md"
                >
                  {showCatForm ? <><X size={16} /> <span>Close Form</span></> : <><Plus size={16} /> <span>Add Category</span></>}
                </button>
              </div>

              {/* Add / Edit Category Form */}
              <AnimatePresence>
                {showCatForm && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-50 space-y-5">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">{editingCat ? 'Edit Category' : 'Create Category'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Category Name *</label>
                        <input 
                          type="text"
                          value={catForm.name} 
                          onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Category Image URL *</label>
                        <input 
                          type="text"
                          value={catForm.image} 
                          onChange={e => setCatForm({ ...catForm, image: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Display Order</label>
                        <input 
                          type="number"
                          value={catForm.sortOrder} 
                          onChange={e => setCatForm({ ...catForm, sortOrder: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Description</label>
                        <input 
                          type="text"
                          value={catForm.description} 
                          onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-3 pt-2">
                      <button type="button" onClick={resetCatForm} className="px-6 py-2.5 bg-white border border-gray-150 rounded-xl text-xs font-black uppercase tracking-wider text-gray-500 hover:bg-gray-100">Cancel</button>
                      <button type="button" onClick={handleSaveCat} disabled={!catForm.name.trim() || catMutation.isPending} className="px-8 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50">
                        {editingCat ? 'Update Category' : 'Create Category'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Subcategory Creation Form Modal / Overlay */}
              <AnimatePresence>
                {subFormCategoryId && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-6 md:p-8 space-y-6" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                        <h3 className="text-base font-black text-gray-900 uppercase tracking-wider">
                          {editingSub ? 'Edit Subcategory' : 'Add Subcategory'}
                        </h3>
                        <button onClick={() => { setSubFormCategoryId(null); setEditingSub(null); }} className="p-2 hover:bg-gray-50 rounded-xl"><X size={18} /></button>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Subcategory Name *</label>
                          <input 
                            type="text"
                            value={subForm.name} 
                            onChange={e => setSubForm({ ...subForm, name: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Subcategory Image URL</label>
                          <input 
                            type="text"
                            value={subForm.image} 
                            onChange={e => setSubForm({ ...subForm, image: e.target.value })}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Display Order</label>
                          <input 
                            type="number"
                            value={subForm.sortOrder} 
                            onChange={e => setSubForm({ ...subForm, sortOrder: Number(e.target.value) })}
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Description</label>
                          <input 
                            type="text"
                            value={subForm.description} 
                            onChange={e => setSubForm({ ...subForm, description: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex space-x-3 pt-2">
                        <button type="button" onClick={() => { setSubFormCategoryId(null); setEditingSub(null); }} className="flex-1 py-3 bg-gray-100 rounded-xl text-xs font-black uppercase tracking-wider text-gray-500 hover:bg-gray-200">Cancel</button>
                        <button type="button" onClick={handleSaveSub} disabled={!subForm.name.trim() || subMutation.isPending} className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50">
                          Save Subcategory
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Categories list display */}
              {isCategoriesLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
              ) : (
                <div className="space-y-4">
                  {adminCategories.map(cat => (
                    <div key={cat.id} className="bg-gray-50/30 rounded-[2rem] border border-gray-50 p-5 md:p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={cat.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100'} 
                            alt={cat.name} 
                            className="w-12 h-12 object-cover rounded-2xl border border-gray-100 shadow-sm"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-base font-black text-gray-900">{cat.name}</h4>
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${cat.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                {cat.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{cat.description || 'No description provided.'} (Display Order: {cat.sortOrder})</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => { setSubFormCategoryId(cat.id); setEditingSub(null); setSubForm(defaultSubCategoryForm); }}
                            className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-100 text-gray-700 text-[10px] font-black uppercase tracking-wider rounded-xl shadow-sm transition-all"
                          >
                            Add Subcategory
                          </button>
                          <button onClick={() => handleEditCat(cat)} className="p-2.5 bg-white border border-gray-100 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-blue-600 transition-all">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleToggleCat(cat.id)} className="p-2.5 bg-white border border-gray-100 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-green-600 transition-all">
                            {cat.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button 
                            onClick={() => {
                              setDeleteTarget(cat);
                              setDeleteType('category');
                              setAdminPassword('');
                              setDeleteError('');
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-2.5 bg-white border border-gray-100 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-600 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Nested subcategories */}
                      <div className="pl-6 border-l-2 border-gray-100 space-y-2">
                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Subcategories</h5>
                        {(!cat.subCategories || cat.subCategories.length === 0) ? (
                          <p className="text-xs text-gray-400 italic">No subcategories defined yet.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {cat.subCategories.map(sub => (
                              <div key={sub.id} className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-gray-50">
                                <div className="flex items-center space-x-3">
                                  {sub.image && (
                                    <img src={sub.image} alt={sub.name} className="w-8 h-8 object-cover rounded-xl border border-gray-100" />
                                  )}
                                  <div>
                                    <p className="text-xs font-bold text-gray-900">{sub.name}</p>
                                    <p className="text-[9px] text-gray-400">{sub.description || 'No description'} (Sort: {sub.sortOrder})</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1.5">
                                  <button onClick={() => handleEditSub(sub)} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-blue-600 transition-all">
                                    <Edit2 size={12} />
                                  </button>
                                  <button onClick={() => handleToggleSub(sub.id)} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-green-600 transition-all">
                                    {sub.isActive ? <EyeOff size={12} /> : <Eye size={12} />}
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setDeleteTarget(sub);
                                      setDeleteType('subcategory');
                                      setAdminPassword('');
                                      setDeleteError('');
                                      setIsDeleteModalOpen(true);
                                    }}
                                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {adminCategories.length === 0 && (
                    <div className="text-center py-12 text-gray-400 italic">No categories found. Click Add Category to get started.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SERVICES */}
          {activeTab === 'services' && (
            <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-wider flex items-center">
                  <Scissors className="mr-3 text-primary" size={20} /> Tailoring Services Configurations
                </h3>
                
                <button
                  onClick={handleSaveServices}
                  disabled={savingServices || !selectedBoutiqueId}
                  className="flex items-center space-x-2 px-8 py-3 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  {savingServices ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> <span>Save Boutique Services</span></>}
                </button>
              </div>

              {/* Boutique Selection Dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Select Partner Boutique</label>
                <select
                  value={selectedBoutiqueId}
                  onChange={(e) => setSelectedBoutiqueId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:outline-none"
                >
                  {boutiques.map(b => (
                    <option key={b.id} value={b.id}>{b.boutiqueName}</option>
                  ))}
                </select>
              </div>

              {selectedBoutiqueId ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                  {/* Services offered */}
                  <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100/50 space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Services Offered List</h4>
                    
                    <div className="flex space-x-2">
                      <input 
                        type="text"
                        placeholder="Add service (e.g. Blouse stitching)"
                        value={serviceInput}
                        onChange={(e) => setServiceInput(e.target.value)}
                        className="flex-1 px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-semibold focus:outline-none"
                      />
                      <button 
                        onClick={handleAddService}
                        className="px-4 bg-gray-900 text-white rounded-xl text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {boutiqueServices.map(service => (
                        <span key={service} className="flex items-center bg-white border border-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700">
                          {service}
                          <button onClick={() => handleRemoveService(service)} className="ml-2 text-gray-400 hover:text-red-500 font-bold">×</button>
                        </span>
                      ))}
                      {boutiqueServices.length === 0 && (
                        <p className="text-xs text-gray-400 italic">No services listed yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100/50 space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Work Specialties</h4>
                    
                    <div className="flex space-x-2">
                      <input 
                        type="text"
                        placeholder="Add specialty (e.g. Maggam Work)"
                        value={specialtyInput}
                        onChange={(e) => setSpecialtyInput(e.target.value)}
                        className="flex-1 px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-semibold focus:outline-none"
                      />
                      <button 
                        onClick={handleAddSpecialty}
                        className="px-4 bg-gray-900 text-white rounded-xl text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {boutiqueSpecialties.map(specialty => (
                        <span key={specialty} className="flex items-center bg-white border border-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700">
                          {specialty}
                          <button onClick={() => handleRemoveSpecialty(specialty)} className="ml-2 text-gray-400 hover:text-red-500 font-bold">×</button>
                        </span>
                      ))}
                      {boutiqueSpecialties.length === 0 && (
                        <p className="text-xs text-gray-400 italic">No specialties listed yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 font-semibold italic text-sm">Please register a partner boutique first.</div>
              )}
            </div>
          )}

          {/* TAB 4: REPORTS & ANALYTICS */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              
              {isReportsLoading ? (
                <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm p-12 flex justify-center">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : (
                <>
                  {/* KPI Cards Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bespoke Orders Value</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">₹{reports?.totalSales || 0}</p>
                      </div>
                      <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center">
                        <CheckCircle2 size={24} />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bespoke Sizing Orders</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{reports?.ordersCount || 0}</p>
                      </div>
                      <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center">
                        <ShoppingBag size={24} />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Registered Sizing Users</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{reports?.customersCount || 0}</p>
                      </div>
                      <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center">
                        <Users size={24} />
                      </div>
                    </div>
                  </div>

                  {/* Sizing Distribution & Recent feed */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category Sizing Breakdown */}
                    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-6">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Bespoke Sizing Category Demand</h4>
                      
                      <div className="space-y-4">
                        {['Blouse', 'Lehenga', 'Saree', 'Anarkali'].map(cat => {
                          const count = reports?.categoryBreakdown?.[cat] || 0;
                          const total = Object.values(reports?.categoryBreakdown || {}).reduce((a, b) => Number(a) + Number(b), 0) || 1;
                          const pct = Math.round((count / total) * 100);
                          return (
                            <div key={cat} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                                <span>{cat} Sizing</span>
                                <span>{count} ({pct}%)</span>
                              </div>
                              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Storefront Activity Feed */}
                    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-6">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Live Storefront Activity</h4>
                      
                      <div className="flow-root">
                        <ul className="-mb-8">
                          {reports?.recentActivity?.map((act, index) => (
                            <li key={act.id}>
                              <div className="relative pb-8">
                                {index !== reports?.recentActivity.length - 1 && (
                                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-100" aria-hidden="true"></span>
                                )}
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${act.type === 'order' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                      {act.type === 'order' ? <Check size={14} /> : <Scissors size={14} />}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                      <p className="text-xs font-bold text-gray-800">{act.label}</p>
                                    </div>
                                    <div className="text-right text-[10px] whitespace-nowrap text-gray-400 font-semibold uppercase">{act.time}</div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                          {(!reports?.recentActivity || reports?.recentActivity.length === 0) && (
                            <p className="text-xs text-gray-400 italic text-center py-4">No recent e-commerce actions.</p>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 5: SUPER ADMIN ORDERS */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm p-6 md:p-8 space-y-6">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-wider flex items-center">
                <ClipboardList className="mr-3 text-primary" size={20} /> Storefront Orders (Super Admin Products Only)
              </h3>

              {isOrdersLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Details</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Locked Measurements</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(() => {
                        const superAdminProductNames = settingsRes?.super_admin_product_names || [];
                        const filtered = orders.filter(o => 
                          superAdminProductNames.length === 0 ? true : superAdminProductNames.includes(o.productName)
                        );
                        
                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-gray-400 font-bold italic text-sm">
                                No orders matching Super Admin created products.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map(order => (
                          <tr key={order.id} className="hover:bg-gray-50/50 transition-all">
                            <td className="px-6 py-4">
                              <p className="text-xs font-mono font-black text-primary">#ORD{order.id}</p>
                              <p className="text-sm font-bold text-gray-900">{order.productName}</p>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-600 font-medium">
                              {order.lockedMeasurements ? (
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
                                  {Object.entries(order.lockedMeasurements).map(([k, v]) => (
                                    <div key={k} className="flex justify-between space-x-2">
                                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{k}:</span>
                                      <span className="font-bold text-gray-800">{String(v)}"</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="italic text-gray-400">No measurements</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm font-black text-gray-900">₹{order.price}</td>
                            <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                                order.status?.toLowerCase() === 'delivered' 
                                  ? 'bg-green-50 text-green-600 border-green-100' 
                                  : order.status?.toLowerCase() === 'processing' 
                                  ? 'bg-blue-50 text-blue-600 border-blue-100'
                                  : 'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>
                                {order.status || 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <select
                                value={order.status || 'Pending'}
                                onChange={(e) => updateStatusMutation.mutate({ orderId: order.id, status: e.target.value })}
                                className="px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black uppercase tracking-wider text-gray-700 focus:outline-none cursor-pointer"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live Storefront Layout Preview (sticky) */}
        <div className="xl:col-span-4 lg:sticky xl:top-10 space-y-6">
          <h3 className="text-xs font-black text-gray-900 flex items-center uppercase tracking-widest">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
            Real-Time Storefront Frame
          </h3>

          <div className="bg-white rounded-[2.5rem] border border-gray-150 shadow-2xl overflow-hidden max-w-sm mx-auto border-gray-300">
            {/* Device mock header */}
            <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 flex items-center justify-between text-[10px] text-gray-500 font-bold">
              <div className="flex items-center space-x-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Frame</span>
              </div>
              <span className="px-2 py-0.5 bg-gray-200 rounded-md text-[8px] uppercase">Preview Mode</span>
            </div>

            {/* MOCK STOREFRONT CONTENT CONTAINER */}
            <div className="bg-white min-h-[500px] flex flex-col font-sans text-xs">
              
              {/* Dynamic Announcement Bar Preview */}
              {layoutSettings.announcement_bar.enabled && (
                <div className="bg-luxury-black text-white text-[8px] py-1.5 px-3 flex items-center justify-center font-bold uppercase tracking-widest text-center truncate bg-gray-900">
                  {layoutSettings.announcement_bar.text1 || 'Free Shipping Promos'}
                </div>
              )}

              {/* Storefront Mini Header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white/95">
                <span className="font-serif font-black tracking-wider text-sm">VS <span className="text-[#c89b3c]">Boutique</span></span>
                <div className="flex items-center space-x-2 text-gray-400">
                  <span className="w-3 h-3 bg-gray-100 rounded-full"></span>
                  <span className="w-3 h-3 bg-gray-100 rounded-full"></span>
                </div>
              </div>

              {/* Dynamic Hero Section Preview */}
              {(() => {
                const hasBanners = layoutSettings.hero_banner.banners && layoutSettings.hero_banner.banners.length > 0;
                const activeSlide = hasBanners ? layoutSettings.hero_banner.banners[0] : null;
                const tag = activeSlide ? activeSlide.tag : 'VS Luxury Store';
                const title = activeSlide ? activeSlide.title : (layoutSettings.hero_banner.title || 'Collection Title');
                const subtitle = activeSlide ? activeSlide.subtitle : (layoutSettings.hero_banner.subtitle || 'Promo details and descriptions.');
                const ctaText = activeSlide ? activeSlide.ctaText : (layoutSettings.hero_banner.ctaText || 'CTA Label');
                const imageUrl = activeSlide ? (activeSlide.imageUrl || activeSlide.mobileImageUrl) : '';

                return (
                  <div className="relative border-b border-gray-100 overflow-hidden flex flex-col items-center text-center p-6 space-y-3 bg-[#FAF8F5] min-h-[140px] justify-center">
                    {imageUrl && (
                      <div className="absolute inset-0 z-0 opacity-15">
                        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="relative z-10 space-y-1.5 flex flex-col items-center">
                      <span className="text-[8px] font-black text-[#c89b3c] uppercase tracking-widest">
                        {tag || 'VS Luxury Store'}
                      </span>
                      <h4 className="text-xs font-black text-gray-900 uppercase max-w-[200px] leading-tight">
                        {title}
                      </h4>
                      <p className="text-[8.5px] text-gray-400 font-medium max-w-[220px] leading-relaxed">
                        {subtitle}
                      </p>
                      <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-md">
                        {ctaText}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Mock Sizing Badges Previews */}
              <div className="p-4 space-y-3 flex-1 bg-white">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Guarantees</p>
                
                <div className="grid grid-cols-2 gap-2 text-[8px] font-bold text-gray-600">
                  <div className="p-2 border border-gray-100 rounded-xl flex items-center space-x-1">
                    <span className="text-green-500">✓</span>
                    <span>100% Fit Guarantee</span>
                  </div>
                  <div className="p-2 border border-gray-100 rounded-xl flex items-center space-x-1">
                    <span className="text-green-500">✓</span>
                    <span>Boutique Quality</span>
                  </div>
                  {layoutSettings.general_settings.codEnabled && (
                    <div className="p-2 border border-green-100 bg-green-50/20 rounded-xl flex items-center space-x-1 text-green-700">
                      <span>✓</span>
                      <span>COD Allowed</span>
                    </div>
                  )}
                  {layoutSettings.general_settings.returnsEnabled && (
                    <div className="p-2 border border-blue-100 bg-blue-50/20 rounded-xl flex items-center space-x-1 text-blue-700">
                      <span>✓</span>
                      <span>Easy Returns</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PASSWORD DELETE CONFIRMATION MODAL ── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-6 md:p-8 space-y-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-black text-gray-900 uppercase tracking-wider text-red-600">
              Confirm Delete ({deleteType})
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Are you sure you want to delete the {deleteType} <strong>"{deleteTarget?.name}"</strong>? This action is irreversible.
            </p>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Admin Security Password *</label>
              <input 
                type="password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                placeholder="Enter password to confirm"
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 focus:outline-none"
              />
              {deleteError && (
                <p className="text-xs text-red-500 font-bold mt-1 flex items-center">
                  <AlertCircle size={12} className="mr-1" /> {deleteError}
                </p>
              )}
            </div>
            <div className="flex space-x-3 pt-2">
              <button 
                type="button" 
                onClick={() => { setIsDeleteModalOpen(false); setDeleteTarget(null); setDeleteType(null); setAdminPassword(''); }} 
                className="flex-1 py-3 bg-gray-150 rounded-xl text-xs font-black uppercase tracking-wider text-gray-500 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleConfirmDelete}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

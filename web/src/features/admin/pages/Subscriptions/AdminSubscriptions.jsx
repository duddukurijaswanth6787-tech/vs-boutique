import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Search, Download, ChevronLeft, ChevronRight, Loader2, 
  Settings, ShieldAlert, Calendar, RefreshCw, X, ShieldCheck, Check, Ban, Plus, Edit, Trash2, CheckCircle2, XCircle, Copy
} from 'lucide-react';
import { 
  getAdminSubscriptions, 
  updateAdminSubscription,
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  cloneSubscriptionPlan,
  deleteSubscriptionPlan,
  getCustomPlanRequests,
  updateCustomPlanRequest
} from '@core/services';

const AdminSubscriptions = () => {
  const [activeTab, setActiveTab] = useState('boutiques'); // 'boutiques', 'plans', 'requests'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Boutiques Tab states
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedBoutique, setSelectedBoutique] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Boutique edit form states
  const [planName, setPlanName] = useState('');
  const [status, setStatus] = useState('');
  const [extendTrialDays, setExtendTrialDays] = useState('');
  const [giveFreeAccessMonths, setGiveFreeAccessMonths] = useState('');
  const [subscriptionEnforcement, setSubscriptionEnforcement] = useState(true);
  const [featurePermissions, setFeaturePermissions] = useState({
    canManageOrders: true,
    canManageBookings: true,
    canManageReviews: true,
    canManagePayments: true,
    canManagePayouts: true,
    canManageGallery: true,
    canManageDesigns: true,
    canManageAnalytics: true,
    canManageNotifications: true,
    canManageStaff: true
  });
  const [loginEnabled, setLoginEnabled] = useState(true);
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

  // Global Plans Tab states
  const [plans, setPlans] = useState([]);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [editorTab, setEditorTab] = useState('general');
  const [planForm, setPlanForm] = useState({
    name: 'STARTER',
    displayName: '',
    planCode: '',
    description: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    trialPeriodDays: 14,
    gracePeriodDays: 3,
    sortOrder: 0,
    isActive: true,
    isFeatured: false,
    recommendedPlan: false,
    
    allowDirectSelling: true,
    allowCustomTailoring: false,
    
    maxReadyMadeProducts: -1,
    maxCustomDesigns: 50,
    maxOrdersPerMonth: 100,
    maxBookingsPerMonth: 50,
    maxCustomers: -1,
    maxMeasurements: -1,
    maxGalleryImages: 20,
    maxStaffAccounts: 5,
    maxBranches: 1,

    // Direct Selling
    canManageProducts: false,
    canManageStock: false,
    canManageShipping: false,
    canManageReturns: false,
    canManageCoupons: false,
    canManageOffers: false,
    canManageProductVariants: false,
    canManageReviews: true,

    // Custom Tailoring
    canUseCustomMeasurements: true,
    canUseMeasurementHistory: false,
    canCreateCustomOrders: true,
    canManageTailoringOrders: true,
    canManageProductionWorkflow: false,
    canManageTailorAssignments: false,

    // Customers
    canManageCustomers: true,
    canManageCustomerNotes: true,
    canManageRewards: false,
    canManageReferrals: false,
    canManageWallet: false,

    // Staff
    canManageStaff: true,
    canManageAttendance: false,
    canManageTasks: false,
    canManagePayroll: false,

    // Marketing
    canUseWhatsAppMarketing: false,
    canUseSmsMarketing: false,
    canUseEmailMarketing: false,
    canCreateCampaigns: false,

    // Analytics
    canViewAnalytics: false,
    canViewAdvancedAnalytics: false,
    canViewFinancialReports: false,

    // Marketplace
    canListInMarketplace: true,
    canFeatureProducts: false,
    canFeatureBoutique: false,
    canSellPremiumDesigns: false,

    // AI
    canUseAiAssistant: false,
    canUseAiRecommendations: false,
    canUseAiDesignSuggestions: false,

    // Enterprise
    canUseApiAccess: false,
    canUseCustomBranding: false,
    canUseWhiteLabel: false,
    canUseMultiBranch: false,

    propagationStrategy: 'IMMEDIATE'
  });

  // Custom Requests Tab states
  const [requests, setRequests] = useState([]);

  // Saving status
  const [saving, setSaving] = useState(false);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSubscriptionsData(),
        fetchPlansData(),
        fetchRequestsData()
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionsData = async () => {
    const res = await getAdminSubscriptions();
    if (res.success) setSubscriptions(res.data);
  };

  const fetchPlansData = async () => {
    const res = await getSubscriptionPlans(true); // includeInactive = true
    if (res.success) setPlans(res.data);
  };

  const fetchRequestsData = async () => {
    const res = await getCustomPlanRequests();
    if (res.success) setRequests(res.data);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchSubscriptionsData(),
      fetchPlansData(),
      fetchRequestsData()
    ]);
    setRefreshing(false);
  };

  // Boutique Overrides Form handling
  const openEditDrawer = (item) => {
    setSelectedBoutique(item);
    setPlanName(item.plan);
    setStatus(item.status);
    setExtendTrialDays('');
    setGiveFreeAccessMonths('');
    setSubscriptionEnforcement(item.subscriptionEnforcement);
    setFeaturePermissions({ ...item.featurePermissions });
    setLoginEnabled(item.loginEnabled);
    setReadOnlyMode(item.readOnlyMode);
    setIsFrozen(item.isFrozen);
    setIsSuspended(item.isSuspended);
    setDrawerOpen(true);
  };

  const closeEditDrawer = () => {
    setDrawerOpen(false);
    setSelectedBoutique(null);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!selectedBoutique) return;

    setSaving(true);
    try {
      const payload = {
        ownerId: selectedBoutique.ownerId,
        boutiqueId: selectedBoutique.boutiqueId,
        planName,
        status,
        extendTrialDays: extendTrialDays ? parseInt(extendTrialDays) : undefined,
        giveFreeAccessMonths: giveFreeAccessMonths ? parseInt(giveFreeAccessMonths) : undefined,
        subscriptionEnforcement,
        loginEnabled,
        readOnlyMode,
        isFrozen,
        isSuspended,
        featurePermissions
      };

      const res = await updateAdminSubscription(payload);
      if (res.success) {
        await fetchSubscriptionsData();
        closeEditDrawer();
      } else {
        alert('Failed to update subscription parameters: ' + res.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Global Plans CRUD Handlers
  const handleOpenPlanModal = (plan = null) => {
    setEditorTab('general');
    if (plan) {
      setSelectedPlan(plan);
      setPlanForm({
        name: plan.name,
        displayName: plan.displayName || '',
        planCode: plan.planCode || '',
        description: plan.description || '',
        monthlyPrice: Number(plan.monthlyPrice ?? plan.price ?? 0),
        yearlyPrice: Number(plan.yearlyPrice ?? 0),
        trialPeriodDays: plan.trialPeriodDays ?? 14,
        gracePeriodDays: plan.gracePeriodDays ?? 3,
        sortOrder: plan.sortOrder ?? 0,
        isActive: plan.isActive ?? true,
        isFeatured: plan.isFeatured ?? false,
        recommendedPlan: plan.recommendedPlan ?? plan.recommended ?? false,
        
        allowDirectSelling: plan.allowDirectSelling ?? true,
        allowCustomTailoring: plan.allowCustomTailoring ?? false,
        
        maxReadyMadeProducts: plan.maxReadyMadeProducts ?? -1,
        maxCustomDesigns: plan.maxCustomDesigns ?? plan.maxDesigns ?? 50,
        maxOrdersPerMonth: plan.maxOrdersPerMonth ?? 100,
        maxBookingsPerMonth: plan.maxBookingsPerMonth ?? 50,
        maxCustomers: plan.maxCustomers ?? -1,
        maxMeasurements: plan.maxMeasurements ?? -1,
        maxGalleryImages: plan.maxGalleryImages ?? 20,
        maxStaffAccounts: plan.maxStaffAccounts ?? 5,
        maxBranches: plan.maxBranches ?? 1,

        // Direct Selling
        canManageProducts: plan.canManageProducts ?? false,
        canManageStock: plan.canManageStock ?? false,
        canManageShipping: plan.canManageShipping ?? false,
        canManageReturns: plan.canManageReturns ?? false,
        canManageCoupons: plan.canManageCoupons ?? false,
        canManageOffers: plan.canManageOffers ?? false,
        canManageProductVariants: plan.canManageProductVariants ?? false,
        canManageReviews: plan.canManageReviews ?? true,

        // Custom Tailoring
        canUseCustomMeasurements: plan.canUseCustomMeasurements ?? true,
        canUseMeasurementHistory: plan.canUseMeasurementHistory ?? false,
        canCreateCustomOrders: plan.canCreateCustomOrders ?? true,
        canManageTailoringOrders: plan.canManageTailoringOrders ?? true,
        canManageProductionWorkflow: plan.canManageProductionWorkflow ?? false,
        canManageTailorAssignments: plan.canManageTailorAssignments ?? false,

        // Customers
        canManageCustomers: plan.canManageCustomers ?? true,
        canManageCustomerNotes: plan.canManageCustomerNotes ?? true,
        canManageRewards: plan.canManageRewards ?? false,
        canManageReferrals: plan.canManageReferrals ?? false,
        canManageWallet: plan.canManageWallet ?? false,

        // Staff
        canManageStaff: plan.canManageStaff ?? true,
        canManageAttendance: plan.canManageAttendance ?? false,
        canManageTasks: plan.canManageTasks ?? false,
        canManagePayroll: plan.canManagePayroll ?? false,

        // Marketing
        canUseWhatsAppMarketing: plan.canUseWhatsAppMarketing ?? false,
        canUseSmsMarketing: plan.canUseSmsMarketing ?? false,
        canUseEmailMarketing: plan.canUseEmailMarketing ?? false,
        canCreateCampaigns: plan.canCreateCampaigns ?? false,

        // Analytics
        canViewAnalytics: plan.canViewAnalytics ?? plan.analyticsAccess ?? false,
        canViewAdvancedAnalytics: plan.canViewAdvancedAnalytics ?? false,
        canViewFinancialReports: plan.canViewFinancialReports ?? false,

        // Marketplace
        canListInMarketplace: plan.canListInMarketplace ?? true,
        canFeatureProducts: plan.canFeatureProducts ?? false,
        canFeatureBoutique: plan.canFeatureBoutique ?? plan.featuredListingAccess ?? false,
        canSellPremiumDesigns: plan.canSellPremiumDesigns ?? false,

        // AI
        canUseAiAssistant: plan.canUseAiAssistant ?? plan.aiAssistantAccess ?? false,
        canUseAiRecommendations: plan.canUseAiRecommendations ?? false,
        canUseAiDesignSuggestions: plan.canUseAiDesignSuggestions ?? false,

        // Enterprise
        canUseApiAccess: plan.canUseApiAccess ?? false,
        canUseCustomBranding: plan.canUseCustomBranding ?? false,
        canUseWhiteLabel: plan.canUseWhiteLabel ?? false,
        canUseMultiBranch: plan.canUseMultiBranch ?? false,

        propagationStrategy: 'IMMEDIATE'
      });
    } else {
      setSelectedPlan(null);
      setPlanForm({
        name: 'STARTER',
        displayName: '',
        planCode: '',
        description: '',
        monthlyPrice: 999,
        yearlyPrice: 9999,
        trialPeriodDays: 14,
        gracePeriodDays: 3,
        sortOrder: 0,
        isActive: true,
        isFeatured: false,
        recommendedPlan: false,
        
        allowDirectSelling: true,
        allowCustomTailoring: false,
        
        maxReadyMadeProducts: -1,
        maxCustomDesigns: 50,
        maxOrdersPerMonth: 100,
        maxBookingsPerMonth: 50,
        maxCustomers: -1,
        maxMeasurements: -1,
        maxGalleryImages: 20,
        maxStaffAccounts: 5,
        maxBranches: 1,

        // Direct Selling
        canManageProducts: false,
        canManageStock: false,
        canManageShipping: false,
        canManageReturns: false,
        canManageCoupons: false,
        canManageOffers: false,
        canManageProductVariants: false,
        canManageReviews: true,

        // Custom Tailoring
        canUseCustomMeasurements: true,
        canUseMeasurementHistory: false,
        canCreateCustomOrders: true,
        canManageTailoringOrders: true,
        canManageProductionWorkflow: false,
        canManageTailorAssignments: false,

        // Customers
        canManageCustomers: true,
        canManageCustomerNotes: true,
        canManageRewards: false,
        canManageReferrals: false,
        canManageWallet: false,

        // Staff
        canManageStaff: true,
        canManageAttendance: false,
        canManageTasks: false,
        canManagePayroll: false,

        // Marketing
        canUseWhatsAppMarketing: false,
        canUseSmsMarketing: false,
        canUseEmailMarketing: false,
        canCreateCampaigns: false,

        // Analytics
        canViewAnalytics: false,
        canViewAdvancedAnalytics: false,
        canViewFinancialReports: false,

        // Marketplace
        canListInMarketplace: true,
        canFeatureProducts: false,
        canFeatureBoutique: false,
        canSellPremiumDesigns: false,

        // AI
        canUseAiAssistant: false,
        canUseAiRecommendations: false,
        canUseAiDesignSuggestions: false,

        // Enterprise
        canUseApiAccess: false,
        canUseCustomBranding: false,
        canUseWhiteLabel: false,
        canUseMultiBranch: false,

        propagationStrategy: 'IMMEDIATE'
      });
    }
    setPlanModalOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (selectedPlan) {
        // Update plan template
        const res = await updateSubscriptionPlan(selectedPlan.id, planForm);
        if (res.success) {
          alert('Plan template updated successfully.');
          await fetchPlansData();
          await fetchSubscriptionsData();
          setPlanModalOpen(false);
        } else {
          alert('Failed to update plan: ' + res.message);
        }
      } else {
        // Create plan template
        const res = await createSubscriptionPlan(planForm);
        if (res.success) {
          alert('New plan template created.');
          await fetchPlansData();
          setPlanModalOpen(false);
        } else {
          alert('Failed to create plan: ' + res.message);
        }
      }
    } catch (err) {
      alert('Error saving plan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this plan? Existing subscribers will remain on this plan version, but it will be hidden from new selections.')) return;
    try {
      const res = await deleteSubscriptionPlan(id);
      if (res.success) {
        alert('Plan deactivated.');
        await fetchPlansData();
      }
    } catch (err) {
      alert('Deactivation failed.');
    }
  };

  const handleClonePlan = async (plan) => {
    const name = window.prompt(`Clone Plan: Enter Plan Tier (e.g. FREE, STARTER, PRO, ENTERPRISE, CUSTOM)`, plan.name);
    if (!name) return;
    const planCode = window.prompt(`Clone Plan: Enter new unique Plan Code (e.g. ${plan.planCode || plan.name.toLowerCase()}_copy)`, `${plan.planCode || plan.name.toLowerCase()}_copy`);
    if (!planCode) return;

    setSaving(true);
    try {
      const res = await cloneSubscriptionPlan(plan.id, { name: name.toUpperCase(), planCode });
      if (res.success) {
        alert('Plan template cloned successfully.');
        await fetchPlansData();
      } else {
        alert('Failed to clone plan: ' + res.message);
      }
    } catch (err) {
      alert('Error cloning plan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Custom Requests Handlers
  const handleRequestAction = async (id, status) => {
    if (!window.confirm(`Are you sure you want to set status of this request to ${status}?`)) return;
    try {
      const res = await updateCustomPlanRequest(id, status);
      if (res.success) {
        alert(`Request ${status.toLowerCase()} successfully.`);
        await fetchRequestsData();
        await fetchSubscriptionsData();
      }
    } catch (err) {
      alert('Failed to process request: ' + err.message);
    }
  };

  // Export to CSV
  const handleCSVExport = () => {
    if (subscriptions.length === 0) return alert('No subscription data to export');
    const headers = [
      'Boutique Name', 'Owner Name', 'Owner Username', 'Owner Email', 
      'Plan', 'Status', 'Enforcement', 'Trial End', 
      'Monthly Revenue', 'Total Orders', 'Total Customers', 'Total Reviews', 
      'Rating', 'Wallet Balance', 'Payout Pending'
    ];
    const rows = subscriptions.map(item => [
      item.boutiqueName,
      item.ownerName,
      item.ownerUsername,
      item.ownerEmail,
      item.plan,
      item.status,
      item.subscriptionEnforcement ? 'ON' : 'OFF',
      item.trialEndsAt ? new Date(item.trialEndsAt).toLocaleDateString() : 'N/A',
      item.monthlyRevenue,
      item.totalOrders,
      item.totalCustomers,
      item.totalReviews,
      item.rating,
      item.walletBalance,
      item.payoutPending
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `platform_subscriptions_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filters
  const filteredItems = subscriptions.filter(item => {
    const matchesSearch = 
      item.boutiqueName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlan = planFilter ? item.plan === planFilter : true;
    const matchesStatus = statusFilter ? item.status === statusFilter : true;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Loading Subscription Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Platform Subscription Management</h2>
          <p className="text-gray-500 mt-1 font-medium">Configure global subscription plan limits, manage custom requests, and adjust boutique overrides.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-3.5 bg-white border border-gray-100 rounded-2xl text-xs font-black text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>REFRESH</span>
          </button>
          {activeTab === 'boutiques' && (
            <button 
              onClick={handleCSVExport}
              className="flex items-center gap-2 px-5 py-3.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              <Download size={14} />
              <span>EXPORT CSV</span>
            </button>
          )}
          {activeTab === 'plans' && (
            <button 
              onClick={() => handleOpenPlanModal()}
              className="flex items-center gap-2 px-5 py-3.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={14} />
              <span>CREATE NEW PLAN</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex space-x-2 border-b border-gray-100 pb-px">
        {[
          { id: 'boutiques', label: 'Boutique Overrides' },
          { id: 'plans', label: 'Global Plan templates' },
          { id: 'requests', label: `Custom Requests (${requests.filter(r => r.status === 'PENDING').length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-6 text-xs font-black uppercase tracking-widest transition-all border-b-2 -mb-px ${
              activeTab === tab.id 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Workspace Wrapper */}
      <div className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm min-h-[400px]">

        {/* ================= TAB 1: BOUTIQUES OVERRIDES ================= */}
        {activeTab === 'boutiques' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  placeholder="Search boutique name, email, owner..." 
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
                />
              </div>
              <div>
                <select
                  value={planFilter}
                  onChange={e => { setPlanFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 focus:outline-none"
                >
                  <option value="">All Tiers</option>
                  <option value="FREE">FREE</option>
                  <option value="STARTER">STARTER</option>
                  <option value="PRO">PRO</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                  <option value="CUSTOM">CUSTOM</option>
                </select>
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="TRIAL">TRIAL</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    <th className="pb-3 pr-2">Boutique & Owner</th>
                    <th className="pb-3 px-2">Active Plan</th>
                    <th className="pb-3 px-2">Sub Status</th>
                    <th className="pb-3 px-2 text-right">Revenue (MTD)</th>
                    <th className="pb-3 px-2 text-center">Designs</th>
                    <th className="pb-3 px-2 text-center">Orders</th>
                    <th className="pb-3 px-2 text-right">Wallet Bal.</th>
                    <th className="pb-3 pl-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                  {paginatedItems.length > 0 ? (
                    paginatedItems.map((item) => (
                      <tr key={item.boutiqueId} className={`hover:bg-gray-50/50 transition-colors ${item.isSuspended ? 'bg-red-50/10' : ''}`}>
                        <td className="py-4 pr-2">
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-extrabold flex items-center gap-1.5">
                              {item.boutiqueName}
                              {item.isFrozen && <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded font-black">FROZEN</span>}
                              {item.isSuspended && <span className="bg-red-100 text-red-700 text-[9px] px-1.5 py-0.5 rounded font-black">SUSPENDED</span>}
                              {!item.subscriptionEnforcement && <span className="bg-gray-100 text-gray-600 text-[9px] px-1.5 py-0.5 rounded font-black">UNENFORCED</span>}
                            </span>
                            <span className="text-[10px] text-gray-400 mt-0.5">Owner: {item.ownerName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${
                            item.plan === 'ENTERPRISE' ? 'bg-purple-100 text-purple-800' :
                            item.plan === 'PRO' ? 'bg-blue-100 text-blue-800' :
                            item.plan === 'STARTER' ? 'bg-pink-100 text-pink-800' : 
                            item.plan === 'CUSTOM' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {item.plan}
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${
                            item.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                            item.status === 'TRIAL' ? 'bg-blue-100 text-blue-800' :
                            item.status === 'PAST_DUE' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                            item.status === 'EXPIRED' ? 'bg-red-100 text-red-800' : 'bg-red-200 text-red-950'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-right text-gray-900">₹{item.monthlyRevenue.toLocaleString()}</td>
                        <td className="py-4 px-2 text-center">{item.totalDesigns}</td>
                        <td className="py-4 px-2 text-center">{item.totalOrders}</td>
                        <td className="py-4 px-2 text-right text-gray-900">₹{item.walletBalance.toLocaleString()}</td>
                        <td className="py-4 pl-2 text-center">
                          <button 
                            onClick={() => openEditDrawer(item)}
                            className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Settings size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-gray-400 font-bold uppercase tracking-wider">
                        No matching boutique override records
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-50 pt-6">
                <span className="text-xs font-semibold text-gray-400">
                  Page {currentPage} of {totalPages} ({filteredItems.length} boutiques)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: GLOBAL PLANS TEMPLATES ================= */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((p) => (
                <div 
                  key={p.id}
                  className={`p-6 rounded-[2rem] border relative flex flex-col justify-between ${
                    p.isActive 
                      ? 'border-gray-200 bg-white hover:shadow-md' 
                      : 'border-dashed border-gray-200 bg-gray-50/50 opacity-70'
                  } transition-all`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2.5 py-1 rounded-lg">
                          {p.name}
                        </span>
                        <h4 className="text-lg font-black text-gray-900 mt-2">
                          {p.displayName || p.name}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{p.planCode}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col">
                      <div className="flex items-baseline">
                        <span className="text-2xl font-black text-gray-900">₹{Number(p.monthlyPrice || p.price || 0).toLocaleString()}</span>
                        <span className="text-xs text-gray-400 font-bold ml-1">/ month</span>
                      </div>
                      {Number(p.yearlyPrice) > 0 && (
                        <span className="text-[10px] text-gray-500 font-bold">
                          ₹{Number(p.yearlyPrice).toLocaleString()} / year
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {p.allowDirectSelling && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] px-2 py-0.5 rounded-lg font-black uppercase">
                          Direct Selling
                        </span>
                      )}
                      {p.allowCustomTailoring && (
                        <span className="bg-purple-50 text-purple-700 border border-purple-100 text-[9px] px-2 py-0.5 rounded-lg font-black uppercase">
                          Tailoring
                        </span>
                      )}
                      {p.isFeatured && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[9px] px-2 py-0.5 rounded-lg font-black uppercase">
                          Featured
                        </span>
                      )}
                      {p.recommendedPlan && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] px-2 py-0.5 rounded-lg font-black uppercase">
                          Recommended
                        </span>
                      )}
                    </div>

                    <div className="mt-4 space-y-2 text-xs font-bold text-gray-600 border-t border-gray-50 pt-4">
                      <div className="flex justify-between">
                        <span>Trial / Grace:</span>
                        <span className="text-gray-900">{p.trialPeriodDays}d / {p.gracePeriodDays}d</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ready-Made Products:</span>
                        <span className="text-gray-900 font-extrabold">{p.maxReadyMadeProducts === -1 || p.maxReadyMadeProducts >= 999999 ? 'Unlimited' : p.maxReadyMadeProducts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Custom Designs:</span>
                        <span className="text-gray-900 font-extrabold">{p.maxCustomDesigns === -1 || p.maxCustomDesigns >= 999999 ? 'Unlimited' : p.maxCustomDesigns}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Orders / Bookings:</span>
                        <span className="text-gray-900 font-extrabold">
                          {p.maxOrdersPerMonth === -1 || p.maxOrdersPerMonth >= 999999 ? '∞' : p.maxOrdersPerMonth} / {p.maxBookingsPerMonth === -1 || p.maxBookingsPerMonth >= 999999 ? '∞' : p.maxBookingsPerMonth}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customers / Staff:</span>
                        <span className="text-gray-900 font-extrabold">
                          {p.maxCustomers === -1 || p.maxCustomers >= 999999 ? '∞' : p.maxCustomers} / {p.maxStaffAccounts === -1 || p.maxStaffAccounts >= 999999 ? '∞' : p.maxStaffAccounts}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-2 pt-2 border-t border-gray-50">
                    <button 
                      onClick={() => handleOpenPlanModal(p)}
                      className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-[10px] font-black text-gray-600 flex items-center justify-center gap-1 transition-colors border border-gray-100"
                    >
                      <Edit size={11} />
                      <span>EDIT</span>
                    </button>
                    <button 
                      onClick={() => handleClonePlan(p)}
                      className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 rounded-xl text-[10px] font-black text-blue-600 flex items-center justify-center gap-1 transition-colors border border-blue-100"
                    >
                      <Copy size={11} />
                      <span>CLONE</span>
                    </button>
                    {p.isActive && (
                      <button 
                        onClick={() => handleDeletePlan(p.id)}
                        className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[10px] transition-colors border border-red-100"
                        title="Deactivate Plan"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: CUSTOM PLAN REQUESTS ================= */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    <th className="pb-3 pr-2">Boutique & Owner</th>
                    <th className="pb-3 px-2">Requested Limits</th>
                    <th className="pb-3 px-2">Reason / Justification</th>
                    <th className="pb-3 px-2">Date Submitted</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 pl-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                  {requests.length > 0 ? (
                    requests.map((reqItem) => (
                      <tr key={reqItem.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 pr-2">
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-extrabold">{reqItem.boutique?.name}</span>
                            <span className="text-[10px] text-gray-400 mt-0.5">Owner: {reqItem.owner?.ownerName} ({reqItem.owner?.email})</span>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                            <div>Designs: <span className="font-extrabold text-gray-900">{reqItem.requestedDesigns}</span></div>
                            <div>Orders: <span className="font-extrabold text-gray-900">{reqItem.requestedOrders}</span></div>
                            <div>Gallery: <span className="font-extrabold text-gray-900">{reqItem.requestedGallery}</span></div>
                            <div>Staff: <span className="font-extrabold text-gray-900">{reqItem.requestedStaff}</span></div>
                          </div>
                        </td>
                        <td className="py-4 px-2 max-w-xs truncate text-[11px] text-gray-500 font-medium italic">
                          "{reqItem.reason}"
                        </td>
                        <td className="py-4 px-2 text-gray-500">
                          {new Date(reqItem.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            reqItem.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                            reqItem.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700 animate-pulse'
                          }`}>
                            {reqItem.status}
                          </span>
                        </td>
                        <td className="py-4 pl-2 text-right">
                          {reqItem.status === 'PENDING' ? (
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => handleRequestAction(reqItem.id, 'APPROVED')}
                                className="p-2 hover:bg-green-50 text-green-600 rounded-xl border border-green-100 hover:text-green-700 transition-colors inline-flex items-center gap-1 text-[10px] font-black uppercase"
                              >
                                <CheckCircle2 size={14} />
                                <span>APPROVE</span>
                              </button>
                              <button 
                                onClick={() => handleRequestAction(reqItem.id, 'REJECTED')}
                                className="p-2 hover:bg-red-50 text-red-600 rounded-xl border border-red-100 hover:text-red-700 transition-colors inline-flex items-center gap-1 text-[10px] font-black uppercase"
                              >
                                <XCircle size={14} />
                                <span>REJECT</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-gray-400 font-bold uppercase tracking-wider">
                        No custom plan requests submitted
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: CREATE OR EDIT PLAN ================= */}
      {planModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-gray-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase">
                  {selectedPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Configure limits, prices, and feature flags for this plan template.</p>
              </div>
              <button 
                onClick={() => setPlanModalOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs Scrollable List */}
            <div className="flex border-b border-gray-100 overflow-x-auto px-6 py-2 bg-gray-50 scrollbar-thin">
              <div className="flex space-x-2 min-w-max">
                {[
                  { id: 'general', label: 'General Info' },
                  { id: 'limits', label: 'Limits' },
                  { id: 'direct_selling', label: 'Direct Selling' },
                  { id: 'tailoring', label: 'Custom Tailoring' },
                  { id: 'crm', label: 'Customer CRM' },
                  { id: 'staff', label: 'Staff' },
                  { id: 'marketing', label: 'Marketing' },
                  { id: 'analytics', label: 'Analytics' },
                  { id: 'marketplace', label: 'Marketplace' },
                  { id: 'ai', label: 'AI Features' },
                  { id: 'enterprise', label: 'Enterprise' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setEditorTab(tab.id)}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                      editorTab === tab.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSavePlan} className="p-8 space-y-6 overflow-y-auto flex-1">
              
              {/* 1. GENERAL INFO TAB */}
              {editorTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase">Base Plan Tier (Enum)</label>
                      <select
                        value={planForm.name}
                        onChange={e => setPlanForm({...planForm, name: e.target.value})}
                        disabled={!!selectedPlan}
                        className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <option value="FREE">FREE</option>
                        <option value="STARTER">STARTER</option>
                        <option value="PRO">PRO</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                        <option value="CUSTOM">CUSTOM</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase">Unique Plan Code</label>
                      <input 
                        type="text" 
                        value={planForm.planCode}
                        onChange={e => setPlanForm({...planForm, planCode: e.target.value})}
                        placeholder="e.g. starter_monthly"
                        className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase">Display Name</label>
                      <input 
                        type="text" 
                        value={planForm.displayName}
                        onChange={e => setPlanForm({...planForm, displayName: e.target.value})}
                        placeholder="e.g. Starter Pack, Growth Tier"
                        className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase">Sort Order</label>
                      <input 
                        type="number" 
                        value={planForm.sortOrder}
                        onChange={e => setPlanForm({...planForm, sortOrder: parseInt(e.target.value) || 0})}
                        className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase">Description</label>
                    <textarea 
                      value={planForm.description}
                      onChange={e => setPlanForm({...planForm, description: e.target.value})}
                      placeholder="Brief details about the plan..."
                      rows={2}
                      className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase">Monthly Price (₹)</label>
                      <input 
                        type="number" 
                        value={planForm.monthlyPrice}
                        onChange={e => setPlanForm({...planForm, monthlyPrice: parseFloat(e.target.value) || 0})}
                        className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase">Yearly Price (₹)</label>
                      <input 
                        type="number" 
                        value={planForm.yearlyPrice}
                        onChange={e => setPlanForm({...planForm, yearlyPrice: parseFloat(e.target.value) || 0})}
                        className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase">Trial Period (Days)</label>
                      <input 
                        type="number" 
                        value={planForm.trialPeriodDays}
                        onChange={e => setPlanForm({...planForm, trialPeriodDays: parseInt(e.target.value) || 0})}
                        className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase">Grace Period (Days)</label>
                      <input 
                        type="number" 
                        value={planForm.gracePeriodDays}
                        onChange={e => setPlanForm({...planForm, gracePeriodDays: parseInt(e.target.value) || 0})}
                        className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex space-x-6 bg-gray-50 p-4 rounded-2xl">
                    <label className="flex items-center space-x-2 text-xs font-bold text-gray-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={planForm.isActive}
                        onChange={e => setPlanForm({...planForm, isActive: e.target.checked})}
                        className="rounded text-primary focus:ring-primary w-4 h-4 border-gray-300"
                      />
                      <span>Is Active</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs font-bold text-gray-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={planForm.isFeatured}
                        onChange={e => setPlanForm({...planForm, isFeatured: e.target.checked})}
                        className="rounded text-primary focus:ring-primary w-4 h-4 border-gray-300"
                      />
                      <span>Is Featured</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs font-bold text-gray-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={planForm.recommendedPlan}
                        onChange={e => setPlanForm({...planForm, recommendedPlan: e.target.checked})}
                        className="rounded text-primary focus:ring-primary w-4 h-4 border-gray-300"
                      />
                      <span>Recommended Plan</span>
                    </label>
                  </div>

                  {/* PROPAGATION STRATEGY RADIO BUTTONS (Only visible when editing an existing plan) */}
                  {selectedPlan && (
                    <div className="space-y-3 border-t border-gray-100 pt-4">
                      <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest flex items-center gap-1">
                        <ShieldAlert size={14} /> Propagation Strategy (When does this apply?)
                      </h4>
                      <div className="space-y-3 bg-amber-50/30 border border-amber-100/50 p-5 rounded-[2rem]">
                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input 
                            type="radio" 
                            name="propagationStrategy" 
                            value="IMMEDIATE" 
                            checked={planForm.propagationStrategy === 'IMMEDIATE'}
                            onChange={e => setPlanForm({...planForm, propagationStrategy: e.target.value})}
                            className="mt-1 w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                          />
                          <div>
                            <span className="text-xs font-extrabold text-gray-900 block">Apply Immediately (Live update)</span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">Directly updates the active plan. All active boutique subscribers will instantly experience the new limits.</span>
                          </div>
                        </label>

                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input 
                            type="radio" 
                            name="propagationStrategy" 
                            value="NEW_ONLY" 
                            checked={planForm.propagationStrategy === 'NEW_ONLY'}
                            onChange={e => setPlanForm({...planForm, propagationStrategy: e.target.value})}
                            className="mt-1 w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                          />
                          <div>
                            <span className="text-xs font-extrabold text-gray-900 block">New Signups Only (Grandfather existing)</span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">Clones the plan to a new active record. Existing owners keep their old limits forever on the old version.</span>
                          </div>
                        </label>

                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input 
                            type="radio" 
                            name="propagationStrategy" 
                            value="DEFERRED" 
                            checked={planForm.propagationStrategy === 'DEFERRED'}
                            onChange={e => setPlanForm({...planForm, propagationStrategy: e.target.value})}
                            className="mt-1 w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                          />
                          <div>
                            <span className="text-xs font-extrabold text-gray-900 block">On Next Billing Cycle / Renewal (After a month ends)</span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">Clones the plan and schedules a transition. Existing owners retain their current limits until their current billing period ends.</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. LIMITS TAB */}
              {editorTab === 'limits' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl text-[11px] font-bold">
                    💡 Use -1 to represent Unlimited capacity.
                  </div>
                  <div className="grid grid-cols-3 gap-4 bg-gray-50 p-6 rounded-[2rem]">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase">Ready-Made Products</label>
                      <input 
                        type="number" 
                        value={planForm.maxReadyMadeProducts}
                        onChange={e => setPlanForm({...planForm, maxReadyMadeProducts: parseInt(e.target.value)})}
                        className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase">Custom Designs</label>
                      <input 
                        type="number" 
                        value={planForm.maxCustomDesigns}
                        onChange={e => setPlanForm({...planForm, maxCustomDesigns: parseInt(e.target.value)})}
                        className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase">Orders / Month</label>
                      <input 
                        type="number" 
                        value={planForm.maxOrdersPerMonth}
                        onChange={e => setPlanForm({...planForm, maxOrdersPerMonth: parseInt(e.target.value)})}
                        className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase">Bookings / Month</label>
                      <input 
                        type="number" 
                        value={planForm.maxBookingsPerMonth}
                        onChange={e => setPlanForm({...planForm, maxBookingsPerMonth: parseInt(e.target.value)})}
                        className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase">CRM Customers</label>
                      <input 
                        type="number" 
                        value={planForm.maxCustomers}
                        onChange={e => setPlanForm({...planForm, maxCustomers: parseInt(e.target.value)})}
                        className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase">Saved Measurements</label>
                      <input 
                        type="number" 
                        value={planForm.maxMeasurements}
                        onChange={e => setPlanForm({...planForm, maxMeasurements: parseInt(e.target.value)})}
                        className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase">Gallery Images</label>
                      <input 
                        type="number" 
                        value={planForm.maxGalleryImages}
                        onChange={e => setPlanForm({...planForm, maxGalleryImages: parseInt(e.target.value)})}
                        className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase">Staff Accounts</label>
                      <input 
                        type="number" 
                        value={planForm.maxStaffAccounts}
                        onChange={e => setPlanForm({...planForm, maxStaffAccounts: parseInt(e.target.value)})}
                        className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase">Boutique Branches</label>
                      <input 
                        type="number" 
                        value={planForm.maxBranches}
                        onChange={e => setPlanForm({...planForm, maxBranches: parseInt(e.target.value)})}
                        className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. DIRECT SELLING TAB */}
              {editorTab === 'direct_selling' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <div>
                      <span className="text-xs font-extrabold text-primary block">Allow Direct Selling (E-commerce)</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">Enables boutique owners to list ready-made products and sell directly online.</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={planForm.allowDirectSelling}
                      onChange={e => setPlanForm({...planForm, allowDirectSelling: e.target.checked})}
                      className="rounded text-primary focus:ring-primary w-5 h-5 border-gray-300"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-[2rem]">
                    {[
                      { label: 'Can Manage Catalog Products', key: 'canManageProducts' },
                      { label: 'Can Manage Inventory & Stock', key: 'canManageStock' },
                      { label: 'Can Manage Order Shipping', key: 'canManageShipping' },
                      { label: 'Can Manage Customer Returns', key: 'canManageReturns' },
                      { label: 'Can Manage Promo Coupons', key: 'canManageCoupons' },
                      { label: 'Can Manage Promotional Offers', key: 'canManageOffers' },
                      { label: 'Can Manage Product Variants', key: 'canManageProductVariants' },
                      { label: 'Can Manage Customer Reviews', key: 'canManageReviews' }
                    ].map(f => (
                      <label key={f.key} className="flex items-center space-x-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={planForm[f.key]}
                          onChange={e => setPlanForm({...planForm, [f.key]: e.target.checked})}
                          disabled={!planForm.allowDirectSelling}
                          className="rounded text-primary focus:ring-primary w-4 h-4 border-gray-300 disabled:opacity-50"
                        />
                        <span className={!planForm.allowDirectSelling ? 'text-gray-400' : ''}>{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. CUSTOM TAILORING TAB */}
              {editorTab === 'tailoring' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <div>
                      <span className="text-xs font-extrabold text-primary block">Allow Custom Tailoring</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">Enables custom orders, measurement tracking, and custom tailoring workflows.</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={planForm.allowCustomTailoring}
                      onChange={e => setPlanForm({...planForm, allowCustomTailoring: e.target.checked})}
                      className="rounded text-primary focus:ring-primary w-5 h-5 border-gray-300"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-[2rem]">
                    {[
                      { label: 'Can Use Custom Measurements', key: 'canUseCustomMeasurements' },
                      { label: 'Can Track Measurement History', key: 'canUseMeasurementHistory' },
                      { label: 'Can Create Custom Orders', key: 'canCreateCustomOrders' },
                      { label: 'Can Manage Tailoring Orders', key: 'canManageTailoringOrders' },
                      { label: 'Can Manage Production Workflow', key: 'canManageProductionWorkflow' },
                      { label: 'Can Assign Orders to Tailors', key: 'canManageTailorAssignments' }
                    ].map(f => (
                      <label key={f.key} className="flex items-center space-x-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={planForm[f.key]}
                          onChange={e => setPlanForm({...planForm, [f.key]: e.target.checked})}
                          disabled={!planForm.allowCustomTailoring}
                          className="rounded text-primary focus:ring-primary w-4 h-4 border-gray-300 disabled:opacity-50"
                        />
                        <span className={!planForm.allowCustomTailoring ? 'text-gray-400' : ''}>{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. CUSTOMER CRM TAB */}
              {editorTab === 'crm' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-[2rem]">
                    {[
                      { label: 'Can Manage Customers', key: 'canManageCustomers' },
                      { label: 'Can Add Customer Notes', key: 'canManageCustomerNotes' },
                      { label: 'Can Manage Rewards Program', key: 'canManageRewards' },
                      { label: 'Can Manage Referral Program', key: 'canManageReferrals' },
                      { label: 'Can Use Boutique Customer Wallet', key: 'canManageWallet' }
                    ].map(f => (
                      <label key={f.key} className="flex items-center space-x-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={planForm[f.key]}
                          onChange={e => setPlanForm({...planForm, [f.key]: e.target.checked})}
                          className="rounded text-primary focus:ring-primary w-4 h-4 border-gray-300"
                        />
                        <span>{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. STAFF TAB */}
              {editorTab === 'staff' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-[2rem]">
                    {[
                      { label: 'Can Manage Staff & Roles', key: 'canManageStaff' },
                      { label: 'Can Track Attendance', key: 'canManageAttendance' },
                      { label: 'Can Assign Staff Tasks', key: 'canManageTasks' },
                      { label: 'Can Manage Staff Payroll', key: 'canManagePayroll' }
                    ].map(f => (
                      <label key={f.key} className="flex items-center space-x-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={planForm[f.key]}
                          onChange={e => setPlanForm({...planForm, [f.key]: e.target.checked})}
                          className="rounded text-primary focus:ring-primary w-4 h-4 border-gray-300"
                        />
                        <span>{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. MARKETING TAB */}
              {editorTab === 'marketing' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-[2rem]">
                    {[
                      { label: 'WhatsApp Broadcasts & Notifications', key: 'canUseWhatsAppMarketing' },
                      { label: 'SMS Blast Campaigns', key: 'canUseSmsMarketing' },
                      { label: 'Email Newsletter Tools', key: 'canUseEmailMarketing' },
                      { label: 'Create Marketing Campaigns', key: 'canCreateCampaigns' }
                    ].map(f => (
                      <label key={f.key} className="flex items-center space-x-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={planForm[f.key]}
                          onChange={e => setPlanForm({...planForm, [f.key]: e.target.checked})}
                          className="rounded text-primary focus:ring-primary w-4 h-4 border-gray-300"
                        />
                        <span>{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 8. ANALYTICS TAB */}
              {editorTab === 'analytics' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-[2rem]">
                    {[
                      { label: 'Access Basic Store Analytics', key: 'canViewAnalytics' },
                      { label: 'Access Advanced Insights & Trends', key: 'canViewAdvancedAnalytics' },
                      { label: 'Generate Financial Reports', key: 'canViewFinancialReports' }
                    ].map(f => (
                      <label key={f.key} className="flex items-center space-x-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={planForm[f.key]}
                          onChange={e => setPlanForm({...planForm, [f.key]: e.target.checked})}
                          className="rounded text-primary focus:ring-primary w-4 h-4 border-gray-300"
                        />
                        <span>{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 9. MARKETPLACE TAB */}
              {editorTab === 'marketplace' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-[2rem]">
                    {[
                      { label: 'List Store in Antair Marketplace', key: 'canListInMarketplace' },
                      { label: 'Feature Products in Marketplace Search', key: 'canFeatureProducts' },
                      { label: 'Feature Boutique on Marketplace Homepage', key: 'canFeatureBoutique' },
                      { label: 'Sell Premium Tailoring Designs', key: 'canSellPremiumDesigns' }
                    ].map(f => (
                      <label key={f.key} className="flex items-center space-x-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={planForm[f.key]}
                          onChange={e => setPlanForm({...planForm, [f.key]: e.target.checked})}
                          className="rounded text-primary focus:ring-primary w-4 h-4 border-gray-300"
                        />
                        <span>{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 10. AI FEATURES TAB */}
              {editorTab === 'ai' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-[2rem]">
                    {[
                      { label: 'Use AI Measurement Assistant', key: 'canUseAiAssistant' },
                      { label: 'Use Smart Product Recommendations', key: 'canUseAiRecommendations' },
                      { label: 'Use AI Design & Styling Suggestions', key: 'canUseAiDesignSuggestions' }
                    ].map(f => (
                      <label key={f.key} className="flex items-center space-x-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={planForm[f.key]}
                          onChange={e => setPlanForm({...planForm, [f.key]: e.target.checked})}
                          className="rounded text-primary focus:ring-primary w-4 h-4 border-gray-300"
                        />
                        <span>{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 11. ENTERPRISE TAB */}
              {editorTab === 'enterprise' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-[2rem]">
                    {[
                      { label: 'Access Developer APIs & Webhooks', key: 'canUseApiAccess' },
                      { label: 'Use Custom Domain & Store Branding', key: 'canUseCustomBranding' },
                      { label: 'Use Full White-Labeling (No Antair Branding)', key: 'canUseWhiteLabel' },
                      { label: 'Use Multi-Branch Operations & Syncing', key: 'canUseMultiBranch' }
                    ].map(f => (
                      <label key={f.key} className="flex items-center space-x-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={planForm[f.key]}
                          onChange={e => setPlanForm({...planForm, [f.key]: e.target.checked})}
                          className="rounded text-primary focus:ring-primary w-4 h-4 border-gray-300"
                        />
                        <span>{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Footer Actions */}
              <div className="flex items-center space-x-3 pt-6 border-t border-gray-100 mt-auto">
                <button 
                  type="button" 
                  onClick={() => setPlanModalOpen(false)}
                  className="flex-1 py-3.5 border border-gray-200 text-gray-500 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-gray-50 transition-colors"
                >
                  CANCEL
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 py-3.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:opacity-95 transition-opacity disabled:opacity-40"
                >
                  {saving ? 'SAVING CONFIG...' : 'SAVE PLAN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DRAWER: MANAGE BOUTIQUE OVERRIDES (TAB 1) ================= */}
      {drawerOpen && selectedBoutique && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-gray-950/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase">Manage Boutique Override Control</h3>
                <p className="text-xs text-gray-500 mt-0.5">Boutique: {selectedBoutique.boutiqueName} | Owner: {selectedBoutique.ownerName}</p>
              </div>
              <button 
                onClick={closeEditDrawer}
                className="p-2 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body Form */}
            <form onSubmit={handleSaveSettings} className="flex-1 p-8 space-y-8">
              
              {/* Plan & Subscription Management */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CreditCard size={14} /> Plan & Subscription Management
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase">Change Plan</label>
                    <select
                      value={planName}
                      onChange={e => setPlanName(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                    >
                      <option value="FREE">FREE</option>
                      <option value="STARTER">STARTER</option>
                      <option value="PRO">PRO</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                      <option value="CUSTOM">CUSTOM</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase">Change Status</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="TRIAL">TRIAL</option>
                      <option value="PAST_DUE">PAST_DUE</option>
                      <option value="EXPIRED">EXPIRED</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase">Extend Trial</label>
                    <select
                      value={extendTrialDays}
                      onChange={e => setExtendTrialDays(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 focus:outline-none"
                    >
                      <option value="">No extension</option>
                      <option value="7">+7 Days</option>
                      <option value="15">+15 Days</option>
                      <option value="30">+30 Days</option>
                      <option value="90">+90 Days</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase">Give Free Access</label>
                    <select
                      value={giveFreeAccessMonths}
                      onChange={e => setGiveFreeAccessMonths(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 focus:outline-none"
                    >
                      <option value="">No free months</option>
                      <option value="1">1 Month</option>
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">12 Months (1 Year)</option>
                    </select>
                  </div>
                </div>

                {/* Subscription Enforcement Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 mt-2">
                  <div>
                    <span className="text-xs font-extrabold text-gray-800 block">Subscription Enforcement</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">Toggle ON to apply subscription limitations and block expired boutiques.</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSubscriptionEnforcement(!subscriptionEnforcement)}
                    className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${subscriptionEnforcement ? 'bg-primary' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${subscriptionEnforcement ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Module Feature Access Control */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Settings size={14} /> Module Feature Access Control
                </h4>
                
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-[2rem] border border-gray-100/50">
                  {[
                    { label: 'Orders Module', key: 'canManageOrders' },
                    { label: 'Bookings Module', key: 'canManageBookings' },
                    { label: 'Reviews Module', key: 'canManageReviews' },
                    { label: 'Payments Module', key: 'canManagePayments' },
                    { label: 'Payouts Module', key: 'canManagePayouts' },
                    { label: 'Analytics Module', key: 'canManageAnalytics' },
                    { label: 'Gallery Upload', key: 'canManageGallery' },
                    { label: 'Designs Catalog', key: 'canManageDesigns' },
                    { label: 'Staff Accounts', key: 'canManageStaff' },
                    { label: 'Notifications Module', key: 'canManageNotifications' }
                  ].map((perm) => (
                    <div key={perm.key} className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700">{perm.label}</span>
                      <button 
                        type="button"
                        onClick={() => setFeaturePermissions(prev => ({ ...prev, [perm.key]: !prev[perm.key] }))}
                        className={`w-9 h-5 rounded-full relative transition-colors focus:outline-none ${featurePermissions[perm.key] ? 'bg-primary' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${featurePermissions[perm.key] ? 'translate-x-4' : ''}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency Controls */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldAlert size={14} /> Super Admin Emergency Controls
                </h4>
                
                <div className="space-y-3">
                  {/* Lock Login */}
                  <div className="flex items-center justify-between p-4 bg-red-50/10 border border-red-100/30 hover:border-red-100 rounded-2xl transition-all">
                    <div>
                      <span className="text-xs font-extrabold text-red-900 block">Owner Login Access</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">Toggle OFF to lock out the owner credentials immediately.</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setLoginEnabled(!loginEnabled)}
                      className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none ${loginEnabled ? 'bg-emerald-600' : 'bg-red-600'}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${loginEnabled ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  {/* Read Only Mode */}
                  <div className="flex items-center justify-between p-4 bg-amber-50/10 border border-amber-100/30 hover:border-amber-100 rounded-2xl transition-all">
                    <div>
                      <span className="text-xs font-extrabold text-amber-900 block">Read-Only Mode</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">Allow data viewing but block all backend write updates.</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setReadOnlyMode(!readOnlyMode)}
                      className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none ${readOnlyMode ? 'bg-amber-600' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${readOnlyMode ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  {/* Freeze Boutique */}
                  <div className="flex items-center justify-between p-4 bg-amber-50/10 border border-amber-100/30 hover:border-amber-100 rounded-2xl transition-all">
                    <div>
                      <span className="text-xs font-extrabold text-amber-900 block">Freeze Boutique Operations</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">Blocks creating new orders, booking scheduler actions, and customer reviews.</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setIsFrozen(!isFrozen)}
                      className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none ${isFrozen ? 'bg-amber-600' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isFrozen ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  {/* Suspend Boutique */}
                  <div className="flex items-center justify-between p-4 bg-red-50/10 border border-red-100/30 hover:border-red-100 rounded-2xl transition-all">
                    <div>
                      <span className="text-xs font-extrabold text-red-900 block">Full Boutique Suspension</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">Completely suspend the boutique store and reject all requests.</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setIsSuspended(!isSuspended)}
                      className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none ${isSuspended ? 'bg-red-600' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isSuspended ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Subscription audit trail history */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar size={14} /> Subscription Override Audit Logs
                </h4>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {selectedBoutique.auditLogs && selectedBoutique.auditLogs.length > 0 ? (
                    selectedBoutique.auditLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-primary uppercase">{log.actionType}</span>
                          <span className="text-[9px] font-semibold text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-700">
                          Admin: {log.owner?.ownerName || 'Superadmin'}
                        </p>
                        {log.changesBefore && log.changesAfter && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-gray-400 bg-gray-100 px-1 py-0.5 rounded max-w-[120px] truncate">
                              Prev: {JSON.stringify(log.changesBefore.value)}
                            </span>
                            <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded max-w-[120px] truncate">
                              New: {JSON.stringify(log.changesAfter.value)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center py-6">No historical overrides found</p>
                  )}
                </div>
              </div>

              {/* Form Actions footer */}
              <div className="flex items-center space-x-3 pt-6 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={closeEditDrawer}
                  className="flex-1 py-3.5 border border-gray-200 text-gray-500 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-gray-50 transition-colors"
                >
                  CANCEL
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 py-3.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:opacity-95 transition-opacity disabled:opacity-40"
                >
                  {saving ? 'SAVING OVERRIDES...' : 'SAVE CONFIGURATION'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSubscriptions;

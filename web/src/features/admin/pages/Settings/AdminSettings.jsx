import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getPlatformCommissionSettings, 
  updatePlatformCommissionSettings, 
  getBoutiques, 
  setBoutiqueCommissionOverride,
  getAdminSubscriptionAnalytics
} from '@core/services';
import { 
  Percent, 
  Sliders, 
  Store, 
  Loader2, 
  Save, 
  RefreshCw,
  Edit2,
  CreditCard,
  TrendingUp,
  Users,
  AlertTriangle,
  Layers,
  Sparkles,
  PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('commission'); // 'commission' | 'subscriptions'
  
  // Commission States
  const [globalRate, setGlobalRate] = useState('');
  const [categoryOverrides, setCategoryOverrides] = useState({
    Blouse: '',
    Lehenga: '',
    Saree: '',
    Other: ''
  });

  // Modal State for boutique override
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [selectedBoutique, setSelectedBoutique] = useState(null);
  const [customBoutiqueRate, setCustomBoutiqueRate] = useState('');

  // Fetch platform settings
  const { data: settingsRes, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['platformCommissionSettings'],
    queryFn: async () => {
      const res = await getPlatformCommissionSettings();
      if (res?.success && res.data) {
        setGlobalRate(Number(res.data.globalCommissionRate).toString());
        const cats = res.data.categoryCommissions || {};
        setCategoryOverrides({
          Blouse: cats.Blouse !== undefined ? cats.Blouse.toString() : '',
          Lehenga: cats.Lehenga !== undefined ? cats.Lehenga.toString() : '',
          Saree: cats.Saree !== undefined ? cats.Saree.toString() : '',
          Other: cats.Other !== undefined ? cats.Other.toString() : ''
        });
      }
      return res;
    }
  });

  // Fetch Boutiques to customize overrides
  const { data: boutiquesRes, isLoading: isBoutiquesLoading } = useQuery({
    queryKey: ['adminBoutiquesListSettings'],
    queryFn: getBoutiques,
  });

  const boutiques = boutiquesRes?.success ? boutiquesRes.data : [];

  // Fetch Subscription Analytics
  const { data: subscriptionAnalyticsRes, isLoading: isAnalyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['adminSubscriptionAnalytics'],
    queryFn: getAdminSubscriptionAnalytics,
    enabled: activeTab === 'subscriptions'
  });

  const analytics = subscriptionAnalyticsRes?.success ? subscriptionAnalyticsRes.data : null;

  // Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: updatePlatformCommissionSettings,
    onSuccess: () => {
      queryClient.invalidateQueries(['platformCommissionSettings']);
      alert('Platform commission settings updated successfully');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to update commission settings');
    }
  });

  const updateBoutiqueOverrideMutation = useMutation({
    mutationFn: ({ id, rate }) => setBoutiqueCommissionOverride(id, rate),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminBoutiquesListSettings']);
      setIsOverrideOpen(false);
      setSelectedBoutique(null);
      setCustomBoutiqueRate('');
      alert('Boutique commission override updated successfully');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to update boutique override');
    }
  });

  const handleSavePlatformSettings = (e) => {
    e.preventDefault();
    const categoryCommissions = {};
    Object.keys(categoryOverrides).forEach(key => {
      if (categoryOverrides[key] !== '') {
        categoryCommissions[key] = Number(categoryOverrides[key]);
      }
    });

    updateSettingsMutation.mutate({
      globalCommissionRate: Number(globalRate),
      categoryCommissions
    });
  };

  const handleSaveBoutiqueOverride = (e) => {
    e.preventDefault();
    if (!selectedBoutique) return;
    updateBoutiqueOverrideMutation.mutate({
      id: selectedBoutique.id,
      rate: Number(customBoutiqueRate)
    });
  };

  return (
    <div className="space-y-6 md:space-y-10">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-xl md:text-3xl font-black text-gray-900">Platform Settings</h2>
          <p className="text-gray-500 mt-1 font-medium text-sm md:text-base">
            Manage platform commissions and track tailors' subscription metrics.
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('commission')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'commission'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Commissions settings
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'subscriptions'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Subscriptions & MRR
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* TAB 1: COMMISSION MATRIX */}
        {activeTab === 'commission' && (
          <motion.div
            key="commission-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-10"
          >
            {/* Platform commission rules */}
            <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-premium h-fit">
              <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center space-x-2">
                <Sliders className="text-primary" />
                <span>Commission Matrix</span>
              </h3>

              {isSettingsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : (
                <form onSubmit={handleSavePlatformSettings} className="space-y-6">
                  {/* Global default rate */}
                  <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10">
                    <label className="block text-xs font-black text-primary uppercase tracking-wider mb-2">Global Default Rate (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={globalRate}
                        onChange={(e) => setGlobalRate(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none text-sm font-bold text-gray-900 font-mono"
                      />
                      <span className="absolute right-4 top-3.5 text-gray-400 font-bold text-sm">%</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 font-medium">
                      Applied to all boutiques unless overridden by a category-specific rate or custom boutique override.
                    </p>
                  </div>

                  {/* Category-based overrides */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">
                      Category Specific Overrides
                    </h4>
                    {['Blouse', 'Lehenga', 'Saree', 'Other'].map((cat) => (
                      <div key={cat} className="flex items-center justify-between gap-4">
                        <span className="text-sm font-semibold text-gray-600 w-24">{cat}</span>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Default"
                            value={categoryOverrides[cat]}
                            onChange={(e) => setCategoryOverrides({...categoryOverrides, [cat]: e.target.value})}
                            className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none text-sm font-semibold text-gray-700 font-mono"
                          />
                          <span className="absolute right-4 top-2 text-gray-400 font-bold text-xs">%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={updateSettingsMutation.isPending}
                    className="w-full mt-4 py-4 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary-dark transition-all flex items-center justify-center space-x-2 shadow-lg shadow-primary/20"
                  >
                    {updateSettingsMutation.isPending ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <Save size={18} />
                        <span>Save Platform Settings</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Boutique Specific overrides */}
            <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-premium">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900 flex items-center space-x-2">
                  <Store className="text-primary" />
                  <span>Boutique-Specific Overrides</span>
                </h3>
                <span className="text-xs font-bold text-gray-400">
                  Total {boutiques.length} boutiques
                </span>
              </div>

              <div className="overflow-y-auto max-h-[500px] border border-gray-50 rounded-2xl">
                {isBoutiquesLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-primary" size={32} />
                  </div>
                ) : boutiques.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Boutique</th>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Override Commission</th>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {boutiques.map((b) => (
                        <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="p-4">
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{b.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{b.ownerName}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono border ${
                              Number(b.commissionRate) !== 10.00 
                                ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                : 'bg-gray-50 text-gray-500 border-gray-100'
                            }`}>
                              {Number(b.commissionRate).toFixed(2)}%
                            </span>
                            {Number(b.commissionRate) === 10.00 && (
                              <span className="text-[10px] font-semibold text-gray-400 ml-2">(using defaults)</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedBoutique(b);
                                setCustomBoutiqueRate(Number(b.commissionRate).toString());
                                setIsOverrideOpen(true);
                              }}
                              className="p-2 text-primary hover:bg-primary/5 rounded-xl transition-all inline-flex items-center justify-center"
                            >
                              <Edit2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center text-gray-400 font-bold py-10">No boutiques found</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: SUBSCRIPTION ANALYTICS */}
        {activeTab === 'subscriptions' && (
          <motion.div
            key="subscriptions-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {isAnalyticsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-primary" size={48} />
              </div>
            ) : analytics ? (
              <>
                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* MRR Card */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <TrendingUp size={24} />
                      </div>
                      <span className="text-green-600 font-bold text-xs flex items-center bg-green-50 px-2.5 py-1 rounded-xl">
                        +18.2% MoM
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Recurring Revenue (MRR)</p>
                      <h3 className="text-3xl font-black text-gray-900 mt-2 font-mono">₹{analytics.monthlyRecurringRevenue?.toLocaleString()}</h3>
                    </div>
                  </div>

                  {/* Active Subscriptions Card */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CreditCard size={24} />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Subscriptions</p>
                      <h3 className="text-3xl font-black text-gray-900 mt-2">{analytics.activeSubscriptions} Boutiques</h3>
                    </div>
                  </div>

                  {/* Trial Users Card */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users size={24} />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trial Accounts</p>
                      <h3 className="text-3xl font-black text-gray-900 mt-2">{analytics.trialUsers} Boutiques</h3>
                    </div>
                  </div>

                  {/* Expired Churn Card */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <AlertTriangle size={24} />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expired / Churned</p>
                      <h3 className="text-3xl font-black text-gray-900 mt-2">{analytics.expiredUsers} Boutiques</h3>
                    </div>
                  </div>

                </div>

                {/* Plan Distribution and Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  
                  {/* Plan distribution card */}
                  <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                    <div className="flex items-center space-x-2 border-b border-gray-50 pb-4">
                      <Layers className="text-primary animate-pulse" size={20} />
                      <h4 className="text-base font-black text-gray-900">Plan distribution</h4>
                    </div>

                    <div className="space-y-4">
                      {Object.keys(analytics.planDistribution || {}).map(planName => {
                        const count = analytics.planDistribution[planName];
                        const total = (analytics.activeSubscriptions + analytics.trialUsers + analytics.expiredUsers) || 1;
                        const pct = Math.round((count / total) * 100);
                        
                        return (
                          <div key={planName} className="space-y-1">
                            <div className="flex justify-between items-center text-xs font-bold text-gray-600">
                              <span className="uppercase tracking-wider">{planName}</span>
                              <span>{count} boutiques ({pct}%)</span>
                            </div>
                            <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  planName === 'FREE' ? 'bg-gray-300' :
                                  planName === 'STARTER' ? 'bg-blue-400' :
                                  planName === 'PRO' ? 'bg-primary' :
                                  'bg-purple-600'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary analytics highlights */}
                  <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-6">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="text-primary" size={20} />
                          <h4 className="text-base font-black text-gray-900">Subscription Insights</h4>
                        </div>
                        <button 
                          onClick={() => refetchAnalytics()}
                          className="p-2 hover:bg-gray-50 text-gray-400 hover:text-primary rounded-xl transition-all flex items-center justify-center"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>

                      <p className="text-sm font-semibold text-gray-600 leading-relaxed">
                        Currently, <span className="font-extrabold text-gray-900">{analytics.activeSubscriptions} boutiques</span> are contributing to a monthly recurring revenue of <span className="font-extrabold text-gray-900">₹{analytics.monthlyRecurringRevenue?.toLocaleString()}</span>. There are <span className="font-extrabold text-gray-900">{analytics.trialUsers} boutiques</span> currently evaluating the platform with active trial periods. Keep an eye on the <span className="font-extrabold text-gray-900">{analytics.expiredUsers} expired tailors</span> to target them with retention incentives.
                      </p>
                    </div>

                    <div className="mt-8 p-6 bg-primary/5 border border-primary/10 rounded-2xl flex items-center space-x-4">
                      <PieChart size={32} className="text-primary flex-shrink-0" />
                      <div>
                        <h5 className="font-black text-xs uppercase tracking-wider text-primary">Marketing campaigns</h5>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                          Tailors on the FREE tier can be upgraded to STARTER by offering customized stitching and order limit trials.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </>
            ) : (
              <p className="text-center font-bold text-gray-400 py-10">No subscription analytics data found.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Boutique override edit modal */}
      <AnimatePresence>
        {isOverrideOpen && selectedBoutique && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-md w-full border border-gray-100 shadow-premium"
            >
              <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center space-x-2">
                <Store className="text-primary" />
                <span>Boutique Override</span>
              </h3>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-6">
                {selectedBoutique.name}
              </p>
              <form onSubmit={handleSaveBoutiqueOverride} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Custom Commission Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="10.00"
                      value={customBoutiqueRate}
                      onChange={(e) => setCustomBoutiqueRate(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none text-sm font-bold text-gray-900 font-mono"
                    />
                    <span className="absolute right-4 top-3.5 text-gray-400 font-bold text-sm">%</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">
                    Setting this to exactly <span className="font-bold">10.00</span> will fall back to platform settings default rates.
                  </p>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOverrideOpen(false);
                      setSelectedBoutique(null);
                    }}
                    className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateBoutiqueOverrideMutation.isPending}
                    className="flex-1 px-4 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all flex items-center justify-center space-x-1"
                  >
                    {updateBoutiqueOverrideMutation.isPending ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Save Override</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSettings;

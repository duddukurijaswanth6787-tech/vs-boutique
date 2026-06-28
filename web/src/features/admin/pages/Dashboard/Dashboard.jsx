import React from 'react';
import { ShoppingBag, Users, Store, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@core/services';

const StatCard = ({ label, value, icon: Icon, trend, isPositive, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-5 md:p-7 rounded-2xl md:rounded-[2rem] shadow-card border border-gray-50 relative overflow-hidden group hover:shadow-premium transition-all duration-500"
  >
    <div className="flex items-center justify-between relative z-10">
      <div className="p-3 md:p-4 bg-primary/5 rounded-xl md:rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
        <Icon size={22} className="md:hidden" />
        <Icon size={28} className="hidden md:block" />
      </div>
      <div className={`flex items-center space-x-1 px-2 md:px-3 py-1 md:py-1.5 rounded-xl text-xs font-bold ${
        isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
      }`}>
        {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        <span>{trend}%</span>
      </div>
    </div>
    <div className="mt-4 md:mt-6 relative z-10">
      <h4 className="text-gray-400 text-xs md:text-sm font-semibold uppercase tracking-wider">{label}</h4>
      <p className="text-2xl md:text-3xl font-black text-gray-900 mt-1 md:mt-2">{value}</p>
    </div>
    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
  </motion.div>
);

const Dashboard = () => {
  // Fetch real aggregated data from MongoDB
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
  });

  const defaultStats = {
    totalBoutiques: 0,
    totalOrders: 0,
    totalUsers: 0,
    grossRevenue: '₹0',
    activities: [],
    topBoutiques: [],
    trends: { boutiques: 0, orders: 0, users: 0, revenue: 0 },
    customerSegmentation: { NEW: 0, ACTIVE: 0, VIP: 0, INACTIVE: 0, BLOCKED: 0 }
  };

  const currentStats = stats || defaultStats;

  return (
    <div className="space-y-6 md:space-y-10">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-xl md:text-3xl font-black text-gray-900">Welcome back 👋</h2>
          <p className="text-gray-500 mt-1 md:mt-2 font-medium text-sm md:text-base">Here's what's happening with VS Boutique today.</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm min-h-[48px]">
            Export Report
          </button>
          <button className="flex-1 md:flex-none px-4 md:px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 min-h-[48px]">
            View Analytics
          </button>
        </div>
      </motion.div>

      {/* Stats Grid — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        <StatCard 
          label="Total Boutiques" 
          value={isLoading ? '...' : currentStats.totalBoutiques} 
          icon={Store} 
          trend={isLoading ? '0' : Math.abs(currentStats.trends.boutiques)} 
          isPositive={currentStats.trends.boutiques >= 0} 
          delay={0.1} 
        />
        <StatCard 
          label="Live Orders" 
          value={isLoading ? '...' : currentStats.totalOrders} 
          icon={ShoppingBag} 
          trend={isLoading ? '0' : Math.abs(currentStats.trends.orders)} 
          isPositive={currentStats.trends.orders >= 0} 
          delay={0.2} 
        />
        <StatCard 
          label="Client Base" 
          value={isLoading ? '...' : currentStats.totalUsers} 
          icon={Users} 
          trend={isLoading ? '0' : Math.abs(currentStats.trends.users)} 
          isPositive={currentStats.trends.users >= 0} 
          delay={0.3} 
        />
        <StatCard 
          label="Gross Revenue" 
          value={isLoading ? '...' : currentStats.grossRevenue} 
          icon={TrendingUp} 
          trend={isLoading ? '0' : Math.abs(currentStats.trends.revenue)} 
          isPositive={currentStats.trends.revenue >= 0} 
          delay={0.4} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-card border border-gray-50"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-900">Live Activity Feed</h3>
            <button className="text-primary font-bold text-sm hover:underline">View All</button>
          </div>
          <div className="space-y-6">
            {isLoading ? (
              <p className="text-center text-gray-400 font-bold py-4">Loading activities...</p>
            ) : currentStats.activities.length > 0 ? (
              currentStats.activities.map((activity, i) => (
                <div key={i} className="flex items-center justify-between p-5 hover:bg-gray-50 rounded-[1.5rem] transition-all group">
                  <div className="flex items-center space-x-5">
                    <div className={`w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <ShoppingBag size={24} className={activity.type === 'order' ? "text-blue-500" : activity.type === 'success' ? "text-green-500" : "text-purple-500"} />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-gray-900">{activity.title}</p>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-gray-900">{activity.price}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 font-bold py-4">No recent activity</p>
            )}
          </div>
        </motion.div>

        {/* Top Boutiques */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-card border border-gray-50"
        >
          <h3 className="text-xl font-black text-gray-900 mb-8">Top Boutiques</h3>
          <div className="space-y-8">
            {isLoading ? (
              <p className="text-center text-gray-400 font-bold">Loading...</p>
            ) : currentStats.topBoutiques.length > 0 ? (
              currentStats.topBoutiques.map((b, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                    <img src={b.image && b.image.startsWith('http') ? b.image : `https://ui-avatars.com/api/?name=${encodeURIComponent(b.name || 'B')}&background=f3f4f6&color=6b7280&size=150&bold=true`} className="w-12 h-12 rounded-xl object-cover shadow-md group-hover:rotate-3 transition-transform" />
                    <div>
                      <p className="text-sm font-bold text-gray-900 truncate w-32">{b.name}</p>
                      <div className="flex items-center space-x-1 text-amber-500 mt-1">
                        <TrendingUp size={12} />
                        <span className="text-[10px] font-black">{b.years || 'New'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-amber-50 px-3 py-1.5 rounded-xl">
                    <span className="text-amber-600 font-black text-xs">⭐ {b.rating || 'N/A'}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 font-bold">No boutiques in database</p>
            )}
          </div>
          <button className="w-full mt-10 py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 font-bold text-sm hover:border-primary hover:text-primary transition-all">
            See Performance Rankings
          </button>
        </motion.div>
      </div>

      {/* Customer Segmentation Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[2.5rem] shadow-card border border-gray-50 mt-10"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-gray-900">Customer Cohort Segmentation</h3>
            <p className="text-gray-500 text-sm font-medium mt-1">Real-time classification based on registration recency, transaction frequency, and behavior indicators.</p>
          </div>
          <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10">
            Cohort Metrics
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { id: 'NEW', label: 'New Cohort', desc: 'Registered within last 7 days with zero orders', color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50/50', border: 'border-blue-100' },
            { id: 'ACTIVE', label: 'Active Buyers', desc: 'At least 1 custom order placed', color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50/50', border: 'border-green-100' },
            { id: 'VIP', label: 'VIP Clients', desc: 'Spent >= ₹10,000 or placed >= 5 orders', color: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50/50', border: 'border-purple-100 ring-2 ring-primary/20' },
            { id: 'INACTIVE', label: 'Inactive Cohort', desc: 'Registered > 7 days ago with zero orders', color: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
            { id: 'BLOCKED', label: 'Blocked Accounts', desc: 'Suspended profiles due to system override', color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50/50', border: 'border-red-100' }
          ].map((seg) => {
            const count = currentStats.customerSegmentation?.[seg.id] || 0;
            const total = Object.values(currentStats.customerSegmentation || {}).reduce((s, v) => s + v, 0) || currentStats.totalUsers || 1;
            const percentage = ((count / total) * 100).toFixed(1);
            return (
              <div key={seg.id} className={`p-5 rounded-2xl border ${seg.bg} ${seg.border} flex flex-col justify-between h-44 group hover:shadow-md transition-all duration-300`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black uppercase tracking-wider ${seg.text}`}>{seg.label}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${seg.color}`} />
                  </div>
                  <p className="text-[10px] font-medium text-gray-400 mt-2 leading-relaxed">{seg.desc}</p>
                </div>
                <div className="flex items-baseline justify-between mt-4 border-t border-gray-100/50 pt-3">
                  <span className="text-2xl font-black text-gray-900">{count}</span>
                  <span className="text-xs font-bold text-gray-400">{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;

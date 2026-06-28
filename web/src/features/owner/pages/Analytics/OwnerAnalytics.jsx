import React, { useState, useEffect } from 'react';
import OwnerLayout from '../../../../components/OwnerLayout';
import { getOwnerDashboard } from '@core/services';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const OwnerAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const dashboardData = await getOwnerDashboard();
        setData(dashboardData);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return (
    <OwnerLayout title="Analytics">
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    </OwnerLayout>
  );

  const detailedStats = [
    { 
      name: 'Sales Revenue', 
      value: `₹${(data?.stats.totalOrders || 0) * 1200}`, // Mock revenue logic
      change: '+15.4%', 
      trend: 'up',
      icon: TrendingUp,
      color: 'blue'
    },
    { 
      name: 'Active Orders', 
      value: data?.stats.totalOrders || 0, 
      change: '+4.3%', 
      trend: 'up',
      icon: ShoppingBag,
      color: 'amber'
    },
    { 
      name: 'Client Growth', 
      value: data?.stats.totalCustomers || 0, 
      change: '+12.1%', 
      trend: 'up',
      icon: Users,
      color: 'green'
    },
    { 
      name: 'Appointments', 
      value: data?.stats.totalBookings || 0, 
      change: '-2.4%', 
      trend: 'down',
      icon: Calendar,
      color: 'purple'
    },
  ];

  return (
    <OwnerLayout title="Analytics">
      <div className="space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Business Analytics</h2>
            <p className="text-gray-500 font-medium mt-1">Deep dive into your boutique's performance metrics.</p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-600 shadow-sm hover:bg-gray-50 transition-all">
              Last 30 Days
            </button>
            <button className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-gray-200 hover:bg-black transition-all">
              Export PDF
            </button>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {detailedStats.map((stat, idx) => (
            <motion.div 
              key={stat.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm relative overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-[0.03] group-hover:scale-110 transition-transform ${
                stat.color === 'blue' ? 'bg-blue-500' :
                stat.color === 'amber' ? 'bg-amber-500' :
                stat.color === 'green' ? 'bg-green-500' :
                'bg-purple-500'
              }`} />
              
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                stat.color === 'blue' ? 'bg-blue-50 text-blue-500' :
                stat.color === 'amber' ? 'bg-amber-50 text-amber-500' :
                stat.color === 'green' ? 'bg-green-50 text-green-500' :
                'bg-purple-50 text-purple-500'
              }`}>
                <stat.icon size={24} />
              </div>

              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.name}</p>
              <h3 className="text-2xl font-black text-gray-900 mb-4">{stat.value}</h3>

              <div className="flex items-center space-x-2">
                <div className={`flex items-center px-2 py-1 rounded-lg text-[10px] font-black ${
                  stat.trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {stat.trend === 'up' ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
                  {stat.change}
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">vs last month</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm h-80 flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                 <BarChart3 size={32} />
              </div>
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Monthly Growth Chart</p>
              <p className="text-xs text-gray-300 font-bold">Visualization coming in next update</p>
           </div>
           <div className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm h-80 flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                 <TrendingUp size={32} />
              </div>
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Service Distribution</p>
              <p className="text-xs text-gray-300 font-bold">Visualization coming in next update</p>
           </div>
        </div>
      </div>
    </OwnerLayout>
  );
};

export default OwnerAnalytics;

import React, { useState, useEffect } from 'react';
import OwnerLayout from '../../../../components/OwnerLayout';
import { getOwnerDashboard } from '@core/services';
import { 
  ShoppingBag, 
  Calendar, 
  Users, 
  Image as ImageIcon, 
  ArrowUpRight, 
  Clock, 
  CheckCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

import { AuthContext } from '@core/contexts';
import { useContext } from 'react';

const OwnerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const dashboardData = await getOwnerDashboard();
        setData(dashboardData);
      } catch (err) {
        console.error('Failed to fetch owner dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return (
    <OwnerLayout title="Dashboard">
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    </OwnerLayout>
  );

  const stats = [
    { name: 'Total Orders', value: data?.stats.totalOrders, icon: ShoppingBag, color: 'blue' },
    { name: 'Total Bookings', value: data?.stats.totalBookings, icon: Calendar, color: 'purple' },
    { name: 'Total Designs', value: data?.stats.totalDesigns, icon: ImageIcon, color: 'amber' },
    { name: 'Customers', value: data?.stats.totalCustomers, icon: Users, color: 'green' },
  ];

  return (
    <OwnerLayout title="Overview">
      <div className="space-y-10">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Welcome back, {data?.boutique.name}!</h2>
            <p className="text-gray-500 font-medium mt-1">Here's what's happening with your boutique today.</p>
          </div>
          <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
             <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${data?.boutique.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {data?.boutique.status}
             </div>
             {data?.boutique.verified && (
                <div className="flex items-center space-x-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest">
                   <CheckCircle size={14} /> <span>Verified</span>
                </div>
             )}
          </div>
        </div>

        {/* Stats Grid */}
        {user?.permissions?.canViewAnalytics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <motion.div 
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all group"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${
                  stat.color === 'blue' ? 'bg-blue-50 text-blue-500' :
                  stat.color === 'purple' ? 'bg-purple-50 text-purple-500' :
                  stat.color === 'amber' ? 'bg-amber-50 text-amber-500' :
                  'bg-green-50 text-green-500'
                }`}>
                  <stat.icon size={28} />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.name}</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-3xl font-black text-gray-900">{stat.value}</h3>
                  <span className="flex items-center text-green-500 text-xs font-bold">
                    <ArrowUpRight size={14} className="mr-1" /> +12%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8 flex items-center space-x-4 text-amber-700">
             <AlertCircle size={24} />
             <p className="font-bold uppercase tracking-widest text-xs">Analytics access is restricted. Contact admin to enable dashboard stats.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Recent Orders Table */}
          <div className="lg:col-span-2 bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">Recent Orders</h3>
              <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline flex items-center">
                View All <ChevronRight size={14} className="ml-1" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.recentOrders.length > 0 ? data.recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5 text-sm font-black text-gray-900">#{order.orderId}</td>
                      <td className="px-8 py-5 text-sm font-bold text-gray-600">{order.customerName}</td>
                      <td className="px-8 py-5">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                          order.orderStatus === 'Delivered' ? 'bg-green-50 text-green-600' :
                          order.orderStatus === 'Stitching' ? 'bg-blue-50 text-blue-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm font-black text-gray-900">₹{order.price}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="px-8 py-20 text-center text-gray-400 font-medium italic">No recent orders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions / Activity */}
          <div className="space-y-6">
             <div className="bg-gray-900 rounded-[3rem] p-8 text-white shadow-xl shadow-gray-200">
                <h3 className="text-xl font-black mb-6">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                   <button className="bg-white/10 hover:bg-white/20 p-6 rounded-2xl flex flex-col items-center justify-center space-y-2 transition-all">
                      <ShoppingBag size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">New Order</span>
                   </button>
                   <button className="bg-white/10 hover:bg-white/20 p-6 rounded-2xl flex flex-col items-center justify-center space-y-2 transition-all">
                      <Calendar size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">New Booking</span>
                   </button>
                </div>
             </div>

             <div className="bg-white rounded-[3rem] p-8 border border-gray-50 shadow-sm">
                <h3 className="text-xl font-black text-gray-900 mb-6">Activity Feed</h3>
                <div className="space-y-6">
                   {[1, 2, 3].map(i => (
                      <div key={i} className="flex space-x-4">
                         <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                            <Clock size={18} />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-gray-900">New design uploaded</p>
                            <p className="text-xs text-gray-400">2 hours ago</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
};

export default OwnerDashboard;

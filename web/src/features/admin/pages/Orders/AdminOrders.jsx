import React, { useState, useEffect } from 'react';
import { getOrders, getBoutiques } from '@core/services';
import { ShoppingBag, Search, Filter, ChevronRight, Store, Loader2, IndianRupee, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

const AdminOrders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [boutiques, setBoutiques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [boutiqueFilter, setBoutiqueFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ordersData, boutiquesData] = await Promise.all([
                    getOrders(),
                    getBoutiques()
                ]);
                setOrders(ordersData);
                setBoutiques(boutiquesData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-amber-50 text-amber-600 border-amber-100',
            accepted: 'bg-blue-50 text-blue-600 border-blue-100',
            in_progress: 'bg-indigo-50 text-indigo-600 border-indigo-100',
            ready: 'bg-purple-50 text-purple-600 border-purple-100',
            delivered: 'bg-green-50 text-green-600 border-green-100',
            cancelled: 'bg-red-50 text-red-600 border-red-100'
        };
        return colors[status] || 'bg-gray-50 text-gray-600 border-gray-100';
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             order.orderId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBoutique = boutiqueFilter === 'All' || order.boutiqueId === boutiqueFilter;
        const matchesStatus = statusFilter === 'All' || order.orderStatus === statusFilter;
        return matchesSearch && matchesBoutique && matchesStatus;
    });

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={40} /></div>;

    return (
        <div className="space-y-10">
            <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Platform Orders</h2>
                <p className="text-gray-500 font-medium mt-1">Global monitoring of all custom stitching transactions across the system.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Platform Orders', value: orders.length, icon: ShoppingBag, color: 'text-gray-900', bg: 'bg-gray-50' },
                    { label: 'Global Revenue', value: `₹${orders.reduce((sum, o) => sum + (o.pricing.price || 0), 0)}`, icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Active Shops', value: new Set(orders.map(o => o.boutiqueId)).size, icon: Store, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Growth', value: '+12%', icon: Tag, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm flex items-center space-x-5">
                        <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="relative flex-1 max-w-xl">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        placeholder="Search by Order ID, Customer, or Phone..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-3xl text-sm font-bold shadow-sm focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <select 
                        value={boutiqueFilter}
                        onChange={(e) => setBoutiqueFilter(e.target.value)}
                        className="px-6 py-5 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 shadow-sm focus:ring-2 focus:ring-primary/10 outline-none"
                    >
                        <option value="All">All Boutiques</option>
                        {boutiques.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-6 py-5 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 shadow-sm focus:ring-2 focus:ring-primary/10 outline-none"
                    >
                        <option value="All">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="in_progress">In Progress</option>
                        <option value="ready">Ready</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <button className="p-5 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            {/* Mobile: card layout */}
            <div className="md:hidden space-y-3">
                {filteredOrders.map((order) => (
                    <div
                        key={order._id}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3 active:scale-[0.98] transition-transform"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0">
                                    {order.category?.charAt(0) || 'O'}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-primary font-mono">{order.orderId}</p>
                                    <p className="text-sm font-black text-gray-900">{order.boutiqueId?.name || '—'}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.orderStatus)}`}>
                                {order.orderStatus.replace('_', ' ')}
                            </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                            <div>
                                <p className="text-sm font-bold text-gray-900">{order.customerName}</p>
                                <p className="text-xs text-gray-400">{order.customerPhone}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-base font-black text-gray-900">₹{order.pricing?.price}</p>
                                <p className={`text-[10px] font-black uppercase ${order.paymentStatus === 'paid' ? 'text-green-500' : 'text-amber-500'}`}>
                                    {order.paymentStatus}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredOrders.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <ShoppingBag size={48} className="mx-auto text-gray-100 mb-4" />
                        <p className="font-bold text-gray-400">No orders found</p>
                    </div>
                )}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block bg-white rounded-[4rem] border border-gray-50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order & Shop</th>
                                <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredOrders.map((order) => (
                                <tr 
                                    key={order._id} 
                                    className="hover:bg-gray-50/30 transition-colors group cursor-pointer"
                                    onClick={() => navigate(`/orders/${order._id}`)}
                                >
                                     <td className="px-10 py-7">
                                         <div className="flex items-center space-x-5">
                                             <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center font-black text-sm">
                                                 {order.category?.charAt(0) || 'O'}
                                             </div>
                                             <div className="flex flex-col">
                                                 <span className="text-xs font-black text-primary font-mono">{order.orderId}</span>
                                                 <span className="text-sm font-black text-gray-900 mt-1">{order.boutiqueId?.name || 'Loading...'}</span>
                                             </div>
                                         </div>
                                     </td>
                                     <td className="px-10 py-7">
                                         <div className="flex flex-col">
                                             <span className="text-sm font-black text-gray-900">{order.customerName}</span>
                                             <span className="text-xs font-bold text-gray-400">{order.customerPhone}</span>
                                         </div>
                                     </td>
                                     <td className="px-10 py-7">
                                         <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.orderStatus)}`}>
                                             {order.orderStatus.replace('_', ' ')}
                                         </span>
                                     </td>
                                     <td className="px-10 py-7 text-right">
                                         <div className="flex flex-col items-end">
                                             <span className="text-base font-black text-gray-900">₹{order.pricing.price}</span>
                                             <span className={`text-[9px] font-black uppercase tracking-widest ${order.paymentStatus === 'paid' ? 'text-green-500' : 'text-amber-500'}`}>
                                                 {order.paymentStatus}
                                             </span>
                                         </div>
                                     </td>
                                 </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredOrders.length === 0 && (
                    <div className="text-center py-32 bg-gray-50/30">
                        <ShoppingBag size={80} className="mx-auto text-gray-100 mb-6" />
                        <h3 className="text-2xl font-black text-gray-900 mb-2">No Platform Activity</h3>
                        <p className="text-gray-400 font-medium italic">All orders placed across boutiques will appear here for global monitoring.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminOrders;

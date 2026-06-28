import React, { useState, useEffect, useContext } from 'react';
import OwnerLayout from '../../../../components/OwnerLayout';
import { getOrders, updateOrderStatus } from '@core/services';
import { ShoppingBag, Search, Filter, ChevronRight, Clock, CheckCircle2, Truck, XCircle, MoreVertical, Loader2, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '@core/contexts';
import { Link } from 'react-router-dom';

const OwnerOrders = () => {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await getOrders();
                setOrders(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
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

    const getPaymentColor = (status) => {
        if (status === 'paid') return 'text-green-600';
        if (status === 'partial') return 'text-amber-600';
        return 'text-red-600';
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             order.orderId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || order.orderStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <OwnerLayout title="Orders"><div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={40} /></div></OwnerLayout>;

    return (
        <OwnerLayout title="Orders Management">
            <div className="space-y-8">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Active Orders', value: orders.filter(o => !['delivered', 'cancelled'].includes(o.orderStatus)).length, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Pending Action', value: orders.filter(o => o.orderStatus === 'pending').length, icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Ready for Pickup', value: orders.filter(o => o.orderStatus === 'ready').length, icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Total Revenue', value: `₹${orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.pricing.price, 0)}`, icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-50' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-sm flex items-center space-x-4">
                            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-xl font-black text-gray-900">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            placeholder="Search by ID or Customer..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                    </div>
                    <div className="flex items-center space-x-3">
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-6 py-4 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 shadow-sm focus:ring-2 focus:ring-primary/10"
                        >
                            <option>All</option>
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="in_progress">In Progress</option>
                            <option value="ready">Ready</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <button className="p-4 bg-white border border-gray-100 text-gray-400 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Info</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Delivery</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredOrders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-primary font-mono">{order.orderId}</span>
                                                <span className="text-sm font-black text-gray-900 mt-1">{order.category}</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{order.designName || 'Custom Work'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900">{order.customerName}</span>
                                                <span className="text-xs font-bold text-gray-400">{order.customerPhone}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.orderStatus)}`}>
                                                {order.orderStatus.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900">₹{order.pricing.price}</span>
                                                <span className={`text-[9px] font-black uppercase tracking-tighter ${getPaymentColor(order.paymentStatus)}`}>
                                                    {order.paymentStatus}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-gray-900">
                                                    {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : 'TBD'}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Expected</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Link 
                                                to={`/owner/orders/${order._id}`}
                                                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md"
                                            >
                                                <span>Manage</span>
                                                <ChevronRight size={14} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredOrders.length === 0 && (
                        <div className="text-center py-24">
                            <ShoppingBag size={64} className="mx-auto text-gray-100 mb-4" />
                            <h3 className="text-xl font-black text-gray-900 mb-1">No Orders Found</h3>
                            <p className="text-sm font-medium text-gray-400 italic">When customers place orders, they will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </OwnerLayout>
    );
};

export default OwnerOrders;

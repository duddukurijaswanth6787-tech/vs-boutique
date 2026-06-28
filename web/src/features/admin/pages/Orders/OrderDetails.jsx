import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import OwnerLayout from '../../../../components/OwnerLayout';
import { getOrderById, updateOrderStatus, updateOrderPayment, updateOrderMeasurements, getOrderTracking } from '@core/services';
import { 
    ChevronLeft, Clock, CheckCircle2, Truck, Loader2, 
    User, Phone, MapPin, Scissors, IndianRupee, Save, Calendar, ArrowRight,
    AlertCircle, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '@core/contexts';
import Sidebar from '@core/components/navigation/Sidebar';
import Navbar from '@core/components/navigation/Navbar';

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [measurements, setMeasurements] = useState({});
    const [isEditingPricing, setIsEditingPricing] = useState(false);
    const [pricingForm, setPricingForm] = useState({ price: 0, advancePaid: 0, paymentStatus: 'pending' });
    
    // Delivery tracking state (for commerce orders with this ID)
    const { data: trackingData } = useQuery({
        queryKey: ['order-tracking', id],
        queryFn: () => getOrderTracking(id),
        enabled: !!id,
        retry: false,
    });

    // Admin Layout state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const data = await getOrderById(id);
                setOrder(data);
                setMeasurements(data.measurements || {});
                setPricingForm({
                    price: data.pricing?.price || 0,
                    advancePaid: data.pricing?.advancePaid || 0,
                    paymentStatus: data.paymentStatus || 'pending'
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    const handleStatusUpdate = async (newStatus) => {
        setUpdating(true);
        try {
            const updated = await updateOrderStatus(id, { status: newStatus });
            setOrder(updated);
        } catch (err) {
            alert('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleMeasurementsSave = async () => {
        setUpdating(true);
        try {
            const updated = await updateOrderMeasurements(id, measurements);
            setOrder(updated);
            alert('Measurements saved successfully');
        } catch (err) {
            alert('Failed to save measurements');
        } finally {
            setUpdating(false);
        }
    };

    const handlePricingSave = async () => {
        setUpdating(true);
        try {
            const updated = await updateOrderPayment(id, pricingForm);
            setOrder(updated);
            setIsEditingPricing(false);
            alert('Pricing updated successfully');
        } catch (err) {
            alert('Failed to update pricing');
        } finally {
            setUpdating(false);
        }
    };

    const statusSteps = [
        { key: 'pending', label: 'Pending', icon: Clock },
        { key: 'accepted', label: 'Accepted', icon: CheckCircle2 },
        { key: 'in_progress', label: 'In Progress', icon: Scissors },
        { key: 'ready', label: 'Ready', icon: CheckCircle2 },
        { key: 'delivered', label: 'Delivered', icon: Truck }
    ];

    const currentStepIndex = statusSteps.findIndex(s => s.key === order.orderStatus);

    const Layout = ({ children, title }) => {
        if (user?.role === 'super-admin') {
            return (
                <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
                    {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
                    <Sidebar activePage="orders" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                        <Navbar title={title} onMenuClick={() => setIsSidebarOpen(true)} />
                        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 custom-scrollbar">
                            <div className="max-w-7xl mx-auto">{children}</div>
                        </main>
                    </div>
                </div>
            );
        }
        return <OwnerLayout title={title}>{children}</OwnerLayout>;
    };

    if (loading) return <Layout title="Order Details"><div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={40} /></div></Layout>;
    if (!order) return <Layout title="Order Not Found"><div>Order not found</div></Layout>;

    return (
        <Layout title={`Order #${order.orderId}`}>
            <div className="space-y-10">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <button 
                        onClick={() => navigate(user?.role === 'super-admin' ? '/orders' : '/owner/orders')}
                        className="flex items-center space-x-2 text-gray-400 font-black uppercase tracking-widest hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeft size={18} /> <span>Back to Orders</span>
                    </button>
                    
                    <div className="flex items-center space-x-3">
                        {order.orderStatus === 'pending' && (
                            <button 
                                onClick={() => handleStatusUpdate('accepted')}
                                disabled={updating}
                                className="px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                            >
                                Accept Order
                            </button>
                        )}
                        {order.orderStatus === 'accepted' && (
                            <button 
                                onClick={() => handleStatusUpdate('in_progress')}
                                disabled={updating}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                            >
                                Start Stitching
                            </button>
                        )}
                        {order.orderStatus === 'in_progress' && (
                            <button 
                                onClick={() => handleStatusUpdate('ready')}
                                disabled={updating}
                                className="px-8 py-3 bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
                            >
                                Mark as Ready
                            </button>
                        )}
                        {order.orderStatus === 'ready' && (
                            <button 
                                onClick={() => handleStatusUpdate('delivered')}
                                disabled={updating}
                                className="px-8 py-3 bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-200"
                            >
                                Mark Delivered
                            </button>
                        )}
                        {['pending', 'accepted'].includes(order.orderStatus) && (
                            <button 
                                onClick={() => handleStatusUpdate('cancelled')}
                                disabled={updating}
                                className="px-8 py-3 bg-white border-2 border-red-100 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                            >
                                Cancel Order
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Timeline */}
                <div className="bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative">
                        <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-100 hidden md:block -z-0" />
                        {statusSteps.map((step, i) => {
                            const isPast = i <= currentStepIndex;
                            const isCurrent = i === currentStepIndex;
                            const Icon = step.icon;
                            return (
                                <div key={step.key} className="flex flex-col items-center relative z-10">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${
                                        isPast ? 'bg-primary text-white scale-110 shadow-primary/20' : 'bg-gray-50 text-gray-300'
                                    }`}>
                                        <Icon size={20} />
                                    </div>
                                    <span className={`mt-4 text-[10px] font-black uppercase tracking-widest ${isPast ? 'text-gray-900' : 'text-gray-300'}`}>
                                        {step.label}
                                    </span>
                                    {isCurrent && (
                                        <motion.div 
                                            layoutId="indicator" 
                                            className="w-1.5 h-1.5 bg-primary rounded-full mt-2"
                                            animate={{ scale: [1, 1.5, 1] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Customer & Design Info */}
                    <div className="lg:col-span-2 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Customer Card */}
                            <div className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm space-y-6">
                                <h3 className="text-lg font-black text-gray-900 flex items-center uppercase tracking-tight">
                                    <User className="mr-3 text-primary" size={20} /> Customer Details
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><Phone size={18} /></div>
                                        <div>
                                            <p className="text-xs font-black text-gray-400 uppercase">Phone Number</p>
                                            <p className="text-sm font-bold text-gray-900">{order.customerPhone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4">
                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 mt-1"><MapPin size={18} /></div>
                                        <div>
                                            <p className="text-xs font-black text-gray-400 uppercase">Delivery Address</p>
                                            <p className="text-sm font-bold text-gray-900 leading-relaxed">{order.customerAddress || 'No address provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Design Card */}
                            <div className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm space-y-6">
                                <h3 className="text-lg font-black text-gray-900 flex items-center uppercase tracking-tight">
                                    <Scissors className="mr-3 text-primary" size={20} /> Design Selection
                                </h3>
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                                        {/* Placeholder for design image */}
                                        <Scissors size={32} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-400 uppercase">{order.category}</p>
                                        <p className="text-lg font-black text-gray-900">{order.designName || 'Custom Request'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Measurements Section */}
                        <div className="bg-white p-10 rounded-[3.5rem] border border-gray-50 shadow-sm space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center">
                                    <Scissors className="mr-3 text-primary" size={24} /> Body Measurements (Inches)
                                </h3>
                                <button 
                                    onClick={handleMeasurementsSave}
                                    disabled={updating}
                                    className="flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200"
                                >
                                    <Save size={16} /> <span>Save measurements</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                                {['bust', 'waist', 'hip', 'shoulder', 'sleeveLength', 'blouseLength'].map(field => (
                                    <div key={field} className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">{field.replace(/([A-Z])/g, ' $1')}</label>
                                        <input 
                                            type="number"
                                            value={measurements[field] || ''}
                                            onChange={(e) => setMeasurements({...measurements, [field]: e.target.value})}
                                            className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl text-sm font-black text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                            placeholder="0.0"
                                        />
                                    </div>
                                ))}
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Special Instructions / Notes</label>
                                <textarea 
                                    value={measurements.notes || ''}
                                    onChange={(e) => setMeasurements({...measurements, notes: e.target.value})}
                                    rows="4"
                                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-3xl text-sm font-bold text-gray-900 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                    placeholder="Add any specific stitching requests or details here..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Pricing & History */}
                    <div className="space-y-10">
                        {/* Pricing Card */}
                        <div className="bg-gray-900 p-8 rounded-[3rem] text-white shadow-2xl shadow-gray-200">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-black flex items-center uppercase tracking-tight">
                                    <IndianRupee className="mr-3 text-primary" size={20} /> Payment Summary
                                </h3>
                                {!isEditingPricing ? (
                                    <button 
                                        onClick={() => setIsEditingPricing(true)}
                                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                    >
                                        Edit
                                    </button>
                                ) : (
                                    <div className="flex items-center space-x-3">
                                        <button 
                                            onClick={handlePricingSave}
                                            disabled={updating}
                                            className="text-[10px] font-black uppercase tracking-widest text-green-400 hover:underline"
                                        >
                                            Save
                                        </button>
                                        <button 
                                            onClick={() => setIsEditingPricing(false)}
                                            className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:underline"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            {!isEditingPricing ? (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-400 uppercase">Total Price</span>
                                        <span className="text-xl font-black">₹{order.pricing.price}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-400 uppercase">Advance Paid</span>
                                        <span className="text-sm font-bold text-green-400">₹{order.pricing.advancePaid}</span>
                                    </div>
                                    <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                                        <span className="text-xs font-black text-white uppercase tracking-widest">Balance Due</span>
                                        <span className="text-2xl font-black text-primary">₹{order.pricing.remainingAmount}</span>
                                    </div>
                                    
                                    <div className={`px-4 py-3 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest border border-white/10 mt-4 ${
                                        order.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                                    }`}>
                                        Payment Status: {order.paymentStatus}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Price</label>
                                        <input 
                                            type="number"
                                            value={pricingForm.price}
                                            onChange={(e) => setPricingForm({...pricingForm, price: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Advance Paid</label>
                                        <input 
                                            type="number"
                                            value={pricingForm.advancePaid}
                                            onChange={(e) => setPricingForm({...pricingForm, advancePaid: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Status</label>
                                        <select 
                                            value={pricingForm.paymentStatus}
                                            onChange={(e) => setPricingForm({...pricingForm, paymentStatus: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary"
                                        >
                                            <option value="pending" className="bg-gray-900">Pending</option>
                                            <option value="partial" className="bg-gray-900">Partial</option>
                                            <option value="paid" className="bg-gray-900">Paid</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Order History */}
                        <div className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm space-y-6">
                            <h3 className="text-lg font-black text-gray-900 flex items-center uppercase tracking-tight">
                                <Activity className="mr-3 text-primary" size={20} /> Order History
                            </h3>
                            <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2">
                                {order.orderHistory.slice().reverse().map((event, i) => (
                                    <div key={i} className="flex items-start space-x-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">{event.status.replace('_', ' ')}</p>
                                            <p className="text-[10px] font-bold text-gray-400 mt-0.5">{event.note}</p>
                                            <p className="text-[9px] font-black text-gray-300 mt-1 uppercase tracking-widest">{new Date(event.timestamp).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Delivery Tracking Timeline (for commerce orders) */}
                        {trackingData && (
                            <div className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm space-y-6">
                                <h3 className="text-lg font-black text-gray-900 flex items-center uppercase tracking-tight">
                                    <MapPin className="mr-3 text-primary" size={20} /> Delivery Tracking
                                </h3>
                                <div className="bg-gray-50 rounded-2xl p-5 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Courier</p>
                                        <p className="font-bold text-gray-900 mt-1">{trackingData.courierName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Tracking #</p>
                                        <p className="font-bold text-gray-900 mt-1">{trackingData.trackingNumber}</p>
                                    </div>
                                </div>
                                {trackingData.histories?.length > 0 && (
                                    <div className="space-y-0 mt-4">
                                        {trackingData.histories.map((h, i) => (
                                            <div key={h.id} className="flex items-start space-x-3">
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                    {i < trackingData.histories.length - 1 && <div className="w-0.5 h-8 bg-gray-200" />}
                                                </div>
                                                <div className="pb-4">
                                                    <p className="text-sm font-semibold text-gray-900">{h.toStatus?.replace(/_/g, ' ') || h.status?.replace(/_/g, ' ')}</p>
                                                    <p className="text-xs text-gray-400">{h.note || ''} · {new Date(h.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default OrderDetails;

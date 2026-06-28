import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  Search, 
  Filter, 
  Download,
  IndianRupee,
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  User,
  Store,
  X
} from 'lucide-react';
import { getAllPayments, getPaymentReports, refundPayment, processPayout } from '@core/services';
import { motion, AnimatePresence } from 'framer-motion';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  const fetchData = async () => {
    try {
      const [paymentsData, reportsData] = await Promise.all([
        getAllPayments(filters),
        getPaymentReports()
      ]);
      setPayments(paymentsData);
      setReports(reportsData);
    } catch (error) {
      console.error('Failed to fetch payments data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Payment ID', 'Order ID', 'Customer', 'Boutique', 'Amount', 'Status'];
    const rows = payments.map(p => [
      new Date(p.createdAt).toLocaleDateString(),
      p.razorpay_payment_id || 'N/A',
      p.orderId?.orderId || 'N/A',
      p.orderId?.customerName || 'N/A',
      p.boutiqueId?.name || 'N/A',
      p.amount,
      p.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VS_Payments_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openDetails = (payment) => {
    setSelectedPayment(payment);
    setIsDrawerOpen(true);
  };

  const handleRefund = async () => {
    if (!window.confirm(`Are you sure you want to refund ₹${selectedPayment.amount}?`)) return;
    try {
      await refundPayment({
        paymentId: selectedPayment._id,
        amount: selectedPayment.amount,
        reason: 'Customer requested refund'
      });
      alert('Refund processed successfully');
      setIsDrawerOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to process refund');
    }
  };

  const handlePayout = async () => {
    try {
      await processPayout([selectedPayment._id]);
      alert('Payout marked as completed');
      setIsDrawerOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to process payout');
    }
  };

  const stats = [
    { label: 'Total Revenue', value: `₹${reports?.totalRevenue || 0}`, icon: IndianRupee, color: 'blue' },
    { label: "Today's Revenue", value: `₹${reports?.todayRevenue || 0}`, icon: TrendingUp, color: 'green' },
    { label: 'Pending Payments', value: reports?.pendingPayments || 0, icon: Clock, color: 'amber' },
    { label: 'Failed Payments', value: reports?.failedPayments || 0, icon: AlertCircle, color: 'red' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'captured': return 'bg-green-50 text-green-600';
      case 'pending': return 'bg-amber-50 text-amber-600';
      case 'failed': return 'bg-red-50 text-red-600';
      case 'refunded': return 'bg-purple-50 text-purple-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div className="relative space-y-10 pb-20">
      {/* Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Transaction Details Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedPayment && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-10">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-gray-900">Transaction Details</h3>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount Paid</span>
                    <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStatusColor(selectedPayment.status)}`}>
                      {selectedPayment.status}
                    </div>
                  </div>
                  <h4 className="text-4xl font-black text-gray-900">₹{selectedPayment.amount}</h4>
                  <p className="text-xs text-gray-400 mt-2">Paid on {new Date(selectedPayment.createdAt).toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment ID</p>
                    <p className="text-sm font-bold text-gray-900">{selectedPayment.razorpay_payment_id || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</p>
                    <p className="text-sm font-bold text-gray-900">#{selectedPayment.orderId?.orderId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</p>
                    <p className="text-sm font-bold text-gray-900 capitalize">{selectedPayment.method || 'Online'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Receipt</p>
                    <p className="text-sm font-bold text-gray-900">{selectedPayment.receipt}</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-100 space-y-6">
                   <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <Store size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Boutique</p>
                        <p className="text-base font-black text-gray-900">{selectedPayment.boutiqueId?.name}</p>
                      </div>
                   </div>
                   <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                        <User size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</p>
                        <p className="text-base font-black text-gray-900">{selectedPayment.orderId?.customerName}</p>
                      </div>
                   </div>
                </div>

                <div className="pt-10 flex flex-col space-y-4">
                   <div className="flex space-x-4">
                      <button className="flex-1 bg-gray-900 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-gray-200">
                          View Order
                      </button>
                      <button className="flex-1 bg-white border border-gray-100 text-gray-900 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-50 transition-all">
                          Print Receipt
                      </button>
                   </div>
                   
                   {selectedPayment.status === 'captured' && (
                     <div className="flex space-x-4">
                        {selectedPayment.payoutStatus === 'pending' && (
                          <button 
                            onClick={handlePayout}
                            className="flex-1 bg-green-500 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-100"
                          >
                             Mark Payout
                          </button>
                        )}
                        <button 
                          onClick={handleRefund}
                          className="flex-1 bg-red-50 text-red-500 border border-red-100 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                        >
                           Refund
                        </button>
                     </div>
                   )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Payments Overview</h2>
          <p className="text-gray-500 font-medium mt-1">Monitor all boutique transactions and revenue.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center space-x-2 bg-gray-900 text-white px-6 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200"
        >
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all group"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${
              stat.color === 'blue' ? 'bg-blue-50 text-blue-500' :
              stat.color === 'green' ? 'bg-green-50 text-green-500' :
              stat.color === 'amber' ? 'bg-amber-50 text-amber-500' :
              'bg-red-50 text-red-500'
            }`}>
              <stat.icon size={28} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
              <span className="flex items-center text-green-500 text-xs font-bold">
                <ArrowUpRight size={14} className="mr-1" /> +12%
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
        {/* Filter Bar */}
        <div className="p-8 border-b border-gray-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1 flex items-center bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100 max-w-xl group focus-within:bg-white focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/10 transition-all">
            <Search size={20} className="text-gray-400 mr-4 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search Transaction ID, Order ID or Receipt..."
              className="bg-transparent border-none outline-none text-sm font-bold w-full text-gray-900 placeholder:text-gray-400"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <select 
              className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-xs font-black uppercase tracking-widest outline-none focus:border-primary transition-all cursor-pointer"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="">All Statuses</option>
              <option value="captured">Captured</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <button className="flex items-center space-x-2 bg-gray-50 text-gray-900 px-5 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest border border-gray-100 hover:bg-gray-100 transition-all">
              <Filter size={16} />
              <span>More Filters</span>
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction / Date</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Boutique</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.length > 0 ? payments.map((payment) => (
                <tr 
                  key={payment._id} 
                  onClick={() => openDetails(payment)}
                  className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                >
                  <td className="px-8 py-6">
                    <div>
                      <p className="text-sm font-black text-gray-900">#{payment.razorpay_payment_id || 'PENDING'}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        {new Date(payment.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="text-sm font-bold text-gray-900">Order #{payment.orderId?.orderId}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{payment.orderId?.customerName}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                       <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-[10px]">
                          {payment.boutiqueId?.name?.charAt(0)}
                       </div>
                       <span className="text-sm font-bold text-gray-700">{payment.boutiqueId?.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-gray-900">₹{payment.amount}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">UPI / NetBanking</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStatusColor(payment.status)}`}>
                       {payment.status === 'captured' ? <CheckCircle2 size={12} /> : 
                        payment.status === 'failed' ? <XCircle size={12} /> : <Clock size={12} />}
                       <span>{payment.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-900">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30">
                       <DollarSign size={48} className="text-gray-300 mb-4" />
                       <p className="text-lg font-black text-gray-900">No transactions found</p>
                       <p className="text-sm font-medium mt-1">Try adjusting your filters or search terms.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        <div className="p-8 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between">
           <p className="text-xs font-bold text-gray-500">Showing {payments.length} of {reports?.totalTransactions || 0} transactions</p>
           <div className="flex items-center space-x-2">
              <button className="px-4 py-2 bg-white border border-gray-100 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest disabled:opacity-50">Prev</button>
              <button className="px-4 py-2 bg-white border border-gray-100 rounded-lg text-[10px] font-black text-gray-900 uppercase tracking-widest">Next</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;

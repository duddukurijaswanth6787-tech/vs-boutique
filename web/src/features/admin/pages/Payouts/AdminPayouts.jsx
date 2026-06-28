import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAdminPayouts, 
  getBoutiques, 
  generatePayout, 
  updatePayoutStatus 
} from '@core/services';
import { 
  Wallet, 
  ArrowUpRight, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Filter, 
  Coins,
  Send,
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminPayouts = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBoutiqueFilter, setSelectedBoutiqueFilter] = useState('');
  
  // Modals state
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedBoutiqueId, setSelectedBoutiqueId] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');

  const [isReleaseOpen, setIsReleaseOpen] = useState(false);
  const [isFailOpen, setIsFailOpen] = useState(false);
  const [targetPayoutId, setTargetPayoutId] = useState(null);
  const [referenceCode, setReferenceCode] = useState('');
  const [failNote, setFailNote] = useState('');

  // Fetch Payouts
  const { data: payoutsRes, isLoading: isPayoutsLoading } = useQuery({
    queryKey: ['adminPayouts', statusFilter, selectedBoutiqueFilter],
    queryFn: () => getAdminPayouts({ status: statusFilter, boutiqueId: selectedBoutiqueFilter }),
  });

  // Fetch Boutiques (for generate form and filter)
  const { data: boutiquesRes, isLoading: isBoutiquesLoading } = useQuery({
    queryKey: ['adminBoutiquesList'],
    queryFn: getBoutiques,
  });

  const payouts = payoutsRes?.success ? payoutsRes.data : [];
  const boutiques = boutiquesRes?.success ? boutiquesRes.data : [];

  // Mutations
  const generateMutation = useMutation({
    mutationFn: generatePayout,
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPayouts']);
      queryClient.invalidateQueries(['adminBoutiquesList']);
      setIsGenerateOpen(false);
      setSelectedBoutiqueId('');
      setPayoutAmount('');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to generate payout');
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, data }) => updatePayoutStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPayouts']);
      queryClient.invalidateQueries(['adminBoutiquesList']);
      setIsReleaseOpen(false);
      setIsFailOpen(false);
      setReferenceCode('');
      setFailNote('');
      setTargetPayoutId(null);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to update payout status');
    }
  });

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!selectedBoutiqueId || !payoutAmount || Number(payoutAmount) <= 0) {
      alert('Please specify a valid boutique and positive amount');
      return;
    }
    generateMutation.mutate({
      boutiqueId: selectedBoutiqueId,
      amount: Number(payoutAmount)
    });
  };

  const handleRelease = (e) => {
    e.preventDefault();
    if (!referenceCode.trim()) {
      alert('Reference code is required to release payout');
      return;
    }
    statusMutation.mutate({
      id: targetPayoutId,
      data: { status: 'RELEASED', referenceCode }
    });
  };

  const handleFail = (e) => {
    e.preventDefault();
    statusMutation.mutate({
      id: targetPayoutId,
      data: { status: 'FAILED', note: failNote }
    });
  };

  const approvePayout = (id) => {
    if (window.confirm('Are you sure you want to approve this payout?')) {
      statusMutation.mutate({
        id,
        data: { status: 'APPROVED' }
      });
    }
  };

  // Helper to color codes
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'APPROVED': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'RELEASED': return 'bg-green-50 text-green-700 border-green-100';
      case 'FAILED': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  return (
    <div className="space-y-6 md:space-y-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-3xl font-black text-gray-900">Payout Settlements</h2>
          <p className="text-gray-500 mt-1 font-medium text-sm md:text-base">
            Track boutique wallet balances, generate payout transfers, and release tailors' earnings.
          </p>
        </div>
        <button
          onClick={() => setIsGenerateOpen(true)}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 min-h-[48px]"
        >
          <Coins size={18} />
          <span>Generate Payout Ticket</span>
        </button>
      </div>

      {/* Wallet Overviews */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-premium flex items-center justify-between group">
          <div>
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Boutique Wallets</span>
            <p className="text-2xl font-black text-gray-900 mt-1">
              ₹{boutiques.reduce((sum, b) => sum + Number(b.walletBalance || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 bg-primary/5 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
            <Wallet size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-premium flex items-center justify-between group">
          <div>
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Pending Payouts Total</span>
            <p className="text-2xl font-black text-amber-600 mt-1">
              ₹{boutiques.reduce((sum, b) => sum + Number(b.pendingPayout || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
            <ArrowUpRight size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-premium flex items-center justify-between group">
          <div>
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Settled Payouts Total</span>
            <p className="text-2xl font-black text-green-600 mt-1">
              ₹{boutiques.reduce((sum, b) => sum + Number(b.totalPaidOut || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-2xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-premium">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-gray-500 flex items-center space-x-1">
              <Filter size={16} />
              <span>Filters:</span>
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-600 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="RELEASED">Released</option>
              <option value="FAILED">Failed</option>
            </select>
            <select
              value={selectedBoutiqueFilter}
              onChange={(e) => setSelectedBoutiqueFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-600 focus:outline-none max-w-xs"
            >
              <option value="">All Boutiques</option>
              {boutiques.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="text-xs font-bold text-gray-400">
            Showing {payouts.length} payout tickets
          </div>
        </div>
      </div>

      {/* Payouts list */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-premium overflow-hidden">
        {isPayoutsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : payouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Boutique</th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Reference Code</th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Date Created</th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-5">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{p.boutique?.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{p.boutique?.ownerName}</p>
                      </div>
                    </td>
                    <td className="p-5 text-sm font-black text-gray-900">
                      ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${getStatusBadgeClass(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-5 text-xs font-mono text-gray-500">
                      {p.referenceCode || p.errorMsg || '—'}
                    </td>
                    <td className="p-5 text-xs text-gray-400 font-semibold">
                      <span className="flex items-center space-x-1">
                        <Calendar size={12} />
                        <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {p.status === 'PENDING' && (
                          <button
                            onClick={() => approvePayout(p.id)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all"
                          >
                            Approve
                          </button>
                        )}
                        {p.status === 'APPROVED' && (
                          <>
                            <button
                              onClick={() => {
                                setTargetPayoutId(p.id);
                                setIsReleaseOpen(true);
                              }}
                              className="px-3 py-1.5 bg-green-50 text-green-600 border border-green-100 rounded-xl text-xs font-bold hover:bg-green-600 hover:text-white transition-all"
                            >
                              Release
                            </button>
                            <button
                              onClick={() => {
                                setTargetPayoutId(p.id);
                                setIsFailOpen(true);
                              }}
                              className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all"
                            >
                              Fail
                            </button>
                          </>
                        )}
                        {p.status === 'RELEASED' && (
                          <span className="text-xs text-gray-400 font-bold flex items-center space-x-1">
                            <CheckCircle size={14} className="text-green-500" />
                            <span>Settled</span>
                          </span>
                        )}
                        {p.status === 'FAILED' && (
                          <span className="text-xs text-gray-400 font-bold flex items-center space-x-1">
                            <XCircle size={14} className="text-red-500" />
                            <span>Failed</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Layers size={48} className="stroke-[1.5]" />
            <p className="font-bold mt-4">No payout settlements found</p>
            <p className="text-xs mt-1">Try adjusting your filters or generate a new payout.</p>
          </div>
        )}
      </div>

      {/* Generate Payout Modal */}
      <AnimatePresence>
        {isGenerateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-md w-full border border-gray-100 shadow-premium"
            >
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center space-x-2">
                <Coins className="text-primary" />
                <span>Generate Payout</span>
              </h3>
              <form onSubmit={handleGenerate} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Boutique</label>
                  <select
                    value={selectedBoutiqueId}
                    onChange={(e) => setSelectedBoutiqueId(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none text-sm font-semibold text-gray-700"
                  >
                    <option value="">Select Boutique</option>
                    {boutiques.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} (Wallet: ₹{Number(b.walletBalance).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter amount to payout"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none text-sm font-semibold text-gray-700 font-mono"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsGenerateOpen(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generateMutation.isPending}
                    className="flex-1 px-4 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all flex items-center justify-center space-x-1"
                  >
                    {generateMutation.isPending ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Release Payout Modal */}
      <AnimatePresence>
        {isReleaseOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-md w-full border border-gray-100 shadow-premium"
            >
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center space-x-2">
                <CheckCircle className="text-green-500" />
                <span>Confirm Release</span>
              </h3>
              <form onSubmit={handleRelease} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Transaction Reference Code</label>
                  <input
                    type="text"
                    placeholder="Enter IMPS/NEFT reference number"
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none text-sm font-semibold text-gray-700 font-mono"
                  />
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">
                    This registers the transfer as fully completed in the boutique's wallet and order ledger.
                  </p>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsReleaseOpen(false);
                      setReferenceCode('');
                    }}
                    className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={statusMutation.isPending}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all flex items-center justify-center"
                  >
                    {statusMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : 'Complete Release'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fail Payout Modal */}
      <AnimatePresence>
        {isFailOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-md w-full border border-gray-100 shadow-premium"
            >
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center space-x-2">
                <XCircle className="text-red-500" />
                <span>Mark Payout as Failed</span>
              </h3>
              <form onSubmit={handleFail} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Failure Reason Note</label>
                  <textarea
                    placeholder="Enter reason (e.g. Invalid bank details)"
                    value={failNote}
                    onChange={(e) => setFailNote(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none text-sm font-semibold text-gray-700 h-28 resize-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">
                    This rolls back the pending payout amount back to the boutique's wallet balance.
                  </p>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFailOpen(false);
                      setFailNote('');
                    }}
                    className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={statusMutation.isPending}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all flex items-center justify-center"
                  >
                    {statusMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : 'Confirm Failure'}
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

export default AdminPayouts;

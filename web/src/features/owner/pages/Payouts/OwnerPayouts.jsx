import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOwnerPayouts } from '@core/services';
import { 
  Wallet, 
  ArrowUpRight, 
  CheckCircle, 
  Loader2, 
  Calendar,
  Layers,
  ArrowDownLeft,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';

const OwnerPayouts = () => {
  // Fetch owner payouts and wallet balances
  const { data: payoutsRes, isLoading } = useQuery({
    queryKey: ['ownerPayouts'],
    queryFn: getOwnerPayouts,
  });

  const wallet = payoutsRes?.wallet || { walletBalance: 0, pendingPayout: 0, totalPaidOut: 0 };
  const payouts = payoutsRes?.success ? payoutsRes.data : [];

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
    <div className="space-y-6 md:space-y-10 p-4 md:p-8 lg:p-10">
      <div>
        <h2 className="text-xl md:text-3xl font-black text-gray-900 font-sans">Payouts & Wallet</h2>
        <p className="text-gray-500 mt-1 font-medium text-sm md:text-base">
          Monitor your boutique wallet balances, track pending transfers, and view settled payouts.
        </p>
      </div>

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-premium flex items-center justify-between group"
        >
          <div>
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Available Balance</span>
            <p className="text-2xl font-black text-gray-900 mt-1">
              ₹{Number(wallet.walletBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-gray-400 font-semibold mt-1 block">Ready for transfer settlement</span>
          </div>
          <div className="p-4 bg-primary/5 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
            <Wallet size={24} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-premium flex items-center justify-between group"
        >
          <div>
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Pending Settlement</span>
            <p className="text-2xl font-black text-amber-600 mt-1">
              ₹{Number(wallet.pendingPayout).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-gray-400 font-semibold mt-1 block">Transfers in process</span>
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
            <ArrowUpRight size={24} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-premium flex items-center justify-between group"
        >
          <div>
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Earnings Settled</span>
            <p className="text-2xl font-black text-green-600 mt-1">
              ₹{Number(wallet.totalPaidOut).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-gray-400 font-semibold mt-1 block">Paid out successfully</span>
          </div>
          <div className="p-4 bg-green-50 rounded-2xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
            <CheckCircle size={24} />
          </div>
        </motion.div>
      </div>

      {/* Payout History Section */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-premium overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900">Payout Settlements History</h3>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Transaction Records</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : payouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Payout ID</th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Reference / Bank Note</th>
                  <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Payout Date</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-5 text-sm font-bold text-gray-600 font-mono">
                      #{p.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="p-5 text-sm font-black text-gray-900">
                      ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${getStatusBadgeClass(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-5 text-xs text-gray-500 font-medium">
                      {p.referenceCode ? (
                        <span className="flex items-center space-x-1 font-mono text-green-600">
                          <CheckCircle size={12} />
                          <span>Ref: {p.referenceCode}</span>
                        </span>
                      ) : p.errorMsg ? (
                        <span className="flex items-center space-x-1 text-red-500">
                          <XCircle size={12} />
                          <span>Err: {p.errorMsg}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">Processing by admin...</span>
                      )}
                    </td>
                    <td className="p-5 text-xs text-gray-400 font-semibold">
                      <span className="flex items-center space-x-1">
                        <Calendar size={12} />
                        <span>{p.payoutDate ? new Date(p.payoutDate).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Layers size={48} className="stroke-[1.5]" />
            <p className="font-bold mt-4">No payout settlements recorded yet</p>
            <p className="text-xs mt-1">Earnings will accumulate in your Available Balance upon order fulfillment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerPayouts;

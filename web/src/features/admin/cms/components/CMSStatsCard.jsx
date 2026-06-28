import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function CMSStatsCard({ label, value, icon: Icon, trend, isPositive, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft relative overflow-hidden group hover:shadow-premium transition-all duration-300 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between relative z-10">
        <div className="p-3 bg-primary/5 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
          {Icon && <Icon size={20} />}
        </div>
        
        {trend !== undefined && (
          <div className={`flex items-center space-x-0.5 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
            isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            <span>{trend}%</span>
          </div>
        )}
      </div>
      
      <div className="mt-4 relative z-10">
        <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</h4>
        <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
      </div>
      
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-300" />
    </motion.div>
  );
}

import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function CMSToolbar({ searchPlaceholder = 'Search...', searchValue, onSearchChange, children }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-soft mb-6">
      <div className="relative flex-1 max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900"
          placeholder={searchPlaceholder}
          value={searchValue || ''}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
        />
      </div>
      
      {children && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider space-x-1.5 px-2">
            <SlidersHorizontal size={14} />
            <span>Filters</span>
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

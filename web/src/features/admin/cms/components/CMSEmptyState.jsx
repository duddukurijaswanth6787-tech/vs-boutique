import React from 'react';
import { Sparkles, FolderOpen, ArrowRight } from 'lucide-react';

export default function CMSEmptyState({ 
  title = 'No records found', 
  description = 'Get started by creating a new entry.', 
  actionText, 
  onAction,
  icon: Icon = FolderOpen
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-16 bg-white rounded-3xl border border-gray-100 shadow-soft text-center group transition-all duration-300 hover:border-primary/20">
      <div className="p-5 bg-primary/5 rounded-2xl text-primary mb-5 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
        <Icon size={32} />
      </div>
      
      <h3 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
      <p className="text-gray-500 text-sm mt-2 max-w-sm font-medium leading-relaxed mb-6">
        {description}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center space-x-2 px-5 py-3 bg-primary text-white rounded-xl text-xs md:text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 duration-150 cursor-pointer min-h-[44px]"
        >
          <Sparkles size={16} />
          <span>{actionText}</span>
          <ArrowRight size={14} className="ml-1 opacity-70" />
        </button>
      )}
    </div>
  );
}

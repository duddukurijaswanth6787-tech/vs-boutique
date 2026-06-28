import React from 'react';

export default function ConfigurationSection({ title, description, children, badge }) {
  return (
    <div className="space-y-4 p-6 bg-white border border-gray-100/80 rounded-3xl shadow-sm hover:shadow-soft transition-all duration-300">
      <div className="flex items-start justify-between border-b border-gray-50 pb-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-gray-800">{title}</h3>
          {description && (
            <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
          )}
        </div>
        {badge && (
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-gray-50 text-gray-500 rounded-full border border-gray-100">
            {badge}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

import React from 'react';

export default function CMSCard({ title, subtitle, actions, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden ${className}`}>
      {(title || subtitle || actions) && (
        <div className="px-6 py-4.5 border-b border-gray-50 flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="font-bold text-gray-900 text-base">{title}</h3>}
            {subtitle && <p className="text-gray-400 text-xs mt-0.5 font-medium">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

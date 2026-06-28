import React from 'react';

export default function CMSSection({ title, subtitle, children, className = '' }) {
  return (
    <div className={`mt-8 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">{title}</h2>}
          {subtitle && <p className="text-gray-400 text-xs mt-0.5 font-medium">{subtitle}</p>}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

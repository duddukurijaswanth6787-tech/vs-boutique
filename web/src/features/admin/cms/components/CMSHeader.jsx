import React from 'react';
import CMSBreadcrumb from './CMSBreadcrumb';

export default function CMSHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-5 mb-6 gap-4">
      <div>
        <CMSBreadcrumb />
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">{title}</h1>
        {description && (
          <p className="text-gray-500 text-sm md:text-base mt-1.5 font-medium leading-relaxed max-w-3xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center space-x-3 self-end md:self-center">
          {actions}
        </div>
      )}
    </div>
  );
}

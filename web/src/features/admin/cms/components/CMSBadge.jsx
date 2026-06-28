import React from 'react';

export default function CMSBadge({ children, variant = 'primary', className = '' }) {
  const styles = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    accent: 'bg-accent/10 text-accent border-accent/20',
    success: 'bg-green-50 text-green-600 border-green-200',
    danger: 'bg-red-50 text-red-600 border-red-200',
    warning: 'bg-amber-50 text-amber-600 border-amber-200',
    info: 'bg-blue-50 text-blue-600 border-blue-200',
    secondary: 'bg-gray-100 text-gray-500 border-gray-200'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] md:text-xs font-bold border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}

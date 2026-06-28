import React from 'react';

export default function ProgressCard({ label, value }) {
  const getBarColor = (val) => {
    if (val === 100) return 'bg-emerald-500';
    if (val >= 70) return 'bg-primary';
    if (val >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTextColor = (val) => {
    if (val === 100) return 'text-emerald-600';
    if (val >= 70) return 'text-primary';
    if (val >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-1.5 p-3.5 bg-gray-50/30 border border-gray-100/70 rounded-2xl">
      <div className="flex justify-between items-center text-xs font-bold text-gray-700">
        <span>{label}</span>
        <span className={getTextColor(value)}>{value}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ease-out ${getBarColor(value)}`} 
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

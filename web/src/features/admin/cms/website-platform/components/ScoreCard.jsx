import React from 'react';

export default function ScoreCard({ value, label = "Overall Score" }) {
  const getColorClasses = (val) => {
    if (val >= 90) return {
      text: 'text-emerald-500',
      bg: 'bg-emerald-50/50 border-emerald-100/50',
      track: 'stroke-emerald-500'
    };
    if (val >= 70) return {
      text: 'text-primary',
      bg: 'bg-primary/5 border-primary/10',
      track: 'stroke-primary'
    };
    if (val >= 40) return {
      text: 'text-amber-500',
      bg: 'bg-amber-50/50 border-amber-100/50',
      track: 'stroke-amber-500'
    };
    return {
      text: 'text-red-500',
      bg: 'bg-red-50/50 border-red-100/50',
      track: 'stroke-red-500'
    };
  };

  const colors = getColorClasses(value);
  // Calculate circumference: 2 * pi * r = 2 * 3.14 * 28 = 175.8
  const strokeDashoffset = 176 - (176 * value) / 100;

  return (
    <div className={`p-6 border rounded-3xl flex flex-col items-center justify-center space-y-3 transition-all duration-300 ${colors.bg}`}>
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle 
            cx="48" 
            cy="48" 
            r="28" 
            className="stroke-gray-100 fill-transparent" 
            strokeWidth="6"
          />
          <circle 
            cx="48" 
            cy="48" 
            r="28" 
            className={`fill-transparent transition-all duration-1000 ease-out ${colors.track}`} 
            strokeWidth="6"
            strokeDasharray="176"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xl font-bold tracking-tight ${colors.text}`}>{value}%</span>
        </div>
      </div>
      <div className="text-center">
        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</h4>
      </div>
    </div>
  );
}

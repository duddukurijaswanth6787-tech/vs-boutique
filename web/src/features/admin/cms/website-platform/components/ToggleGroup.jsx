import React from 'react';

export default function ToggleGroup({ value, onChange, options = ['required', 'optional', 'disabled'] }) {
  const getColors = (opt, active) => {
    if (!active) return 'bg-gray-50/50 text-gray-500 hover:bg-gray-100 hover:text-gray-900';
    switch (opt) {
      case 'required':
        return 'bg-primary text-white shadow-sm shadow-primary/20';
      case 'optional':
        return 'bg-amber-500 text-white shadow-sm shadow-amber-200';
      case 'disabled':
      case 'hidden':
        return 'bg-red-500 text-white shadow-sm shadow-red-200';
      default:
        return 'bg-gray-800 text-white';
    }
  };

  return (
    <div className="inline-flex p-1 bg-gray-100/80 rounded-xl border border-gray-200/50">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${getColors(
            opt,
            value === opt
          )}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

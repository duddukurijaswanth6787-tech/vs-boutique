import React from 'react';
import ToggleGroup from './ToggleGroup';

export default function RequirementCard({ 
  label, 
  description, 
  value, 
  onChange, 
  type = 'toggle', 
  options = ['required', 'optional', 'disabled'],
  min,
  max,
  placeholder
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/30 hover:bg-gray-50 border border-gray-100/70 rounded-2xl transition-all duration-200 gap-4">
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-gray-800">{label}</h4>
        {description && (
          <p className="text-xs text-gray-400 max-w-xl leading-relaxed">{description}</p>
        )}
      </div>

      <div className="flex items-center justify-end sm:self-center">
        {type === 'toggle' && (
          <ToggleGroup value={value} onChange={onChange} options={options} />
        )}

        {type === 'checkbox' && (
          <label className="relative flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={!!value} 
              onChange={(e) => onChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        )}

        {type === 'number' && (
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            min={min}
            max={max}
            placeholder={placeholder}
            className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/10 transition-all font-bold text-sm outline-none text-right"
          />
        )}

        {type === 'text' && (
          <input
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-40 px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/10 transition-all font-bold text-sm outline-none"
          />
        )}
      </div>
    </div>
  );
}

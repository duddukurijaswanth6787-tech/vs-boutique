import { ChevronDown } from 'lucide-react';

export default function Select({
  label,
  error,
  options = [],
  className = '',
  id,
  placeholder,
  ...props
}) {
  return (
    <div className="w-full relative">
      {label && (
        <label htmlFor={id} className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className={`w-full px-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl text-sm font-medium focus:outline-none focus:bg-white focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all appearance-none cursor-pointer placeholder:text-gray-400 ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>
      )}
    </div>
  );
}

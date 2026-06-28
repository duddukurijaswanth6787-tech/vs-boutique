import { useId } from 'react';
import { motion } from 'framer-motion';

export default function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  error = false,
  id,
  className = '',
  ...props
}) {
  const defaultId = useId();
  const checkboxId = id || defaultId;

  return (
    <div className={`flex items-start space-x-3 select-none ${className}`}>
      <div className="relative flex items-center h-5">
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <motion.div
          onClick={() => {
            if (disabled) return;
            if (onChange) onChange({ target: { checked: !checked } });
          }}
          whileTap={disabled ? {} : { scale: 0.9 }}
          className={`w-5 h-5 rounded-lg border flex items-center justify-center cursor-pointer transition-all focus-within:ring-2 focus-within:ring-accent/15 ${
            checked
              ? 'bg-accent border-accent text-white'
              : error
              ? 'border-red-500 bg-red-50/50'
              : 'border-[#d2c5b1]/40 bg-gray-50 hover:bg-gray-100/50'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          {checked && (
            <motion.svg
              className="w-3.5 h-3.5 stroke-current"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.2 }}
            >
              <polyline points="20 6 9 17 4 12" />
            </motion.svg>
          )}
        </motion.div>
      </div>
      {label && (
        <label
          htmlFor={checkboxId}
          className={`text-sm font-medium leading-none cursor-pointer ${
            disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
          }`}
        >
          {label}
        </label>
      )}
    </div>
  );
}

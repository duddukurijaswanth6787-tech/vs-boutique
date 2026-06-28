import { useId } from 'react';
import { motion } from 'framer-motion';

export default function Switch({
  checked,
  onChange,
  disabled = false,
  label,
  id,
  className = '',
  ...props
}) {
  const defaultId = useId();
  const switchId = id || defaultId;

  const toggle = () => {
    if (disabled) return;
    if (onChange) onChange(!checked);
  };

  return (
    <div className={`flex items-center space-x-3 select-none ${className}`} {...props}>
      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={toggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent/20 ${
          checked ? 'bg-accent' : 'bg-gray-200'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0`}
          style={{ x: checked ? 20 : 0 }}
        />
      </button>
      {label && (
        <label
          htmlFor={switchId}
          className={`text-sm font-medium cursor-pointer ${
            disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
          }`}
        >
          {label}
        </label>
      )}
    </div>
  );
}

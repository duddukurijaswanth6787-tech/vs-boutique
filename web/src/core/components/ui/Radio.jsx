import { motion } from 'framer-motion';

export default function Radio({
  name,
  options = [],
  value,
  onChange,
  disabled = false,
  error = false,
  className = '',
  ...props
}) {
  return (
    <div className={`space-y-2 ${className}`} {...props}>
      {options.map((opt) => {
        const isChecked = value === opt.value;
        const optId = `radio-${name}-${opt.value}`;
        
        return (
          <div key={opt.value} className="flex items-center space-x-3 select-none">
            <div className="relative flex items-center h-5">
              <input
                type="radio"
                id={optId}
                name={name}
                value={opt.value}
                checked={isChecked}
                onChange={() => !disabled && onChange(opt.value)}
                disabled={disabled}
                className="peer sr-only"
              />
              <motion.div
                onClick={() => !disabled && onChange(opt.value)}
                whileTap={disabled ? {} : { scale: 0.9 }}
                className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                  isChecked
                    ? 'border-accent'
                    : error
                    ? 'border-red-500 bg-red-50/50'
                    : 'border-[#d2c5b1]/40 bg-gray-50 hover:bg-gray-100/50'
                } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {isChecked && (
                  <motion.div
                    className="w-2.5 h-2.5 bg-accent rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                  />
                )}
              </motion.div>
            </div>
            <label
              htmlFor={optId}
              className={`text-sm font-medium leading-none cursor-pointer ${
                disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
              }`}
            >
              {opt.label}
            </label>
          </div>
        );
      })}
    </div>
  );
}

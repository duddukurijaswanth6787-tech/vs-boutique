import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Chip({
  label,
  active = false,
  onClick,
  onDismiss,
  disabled = false,
  className = '',
  ...props
}) {
  const isClickable = !!onClick && !disabled;
  
  return (
    <motion.div
      whileHover={isClickable ? { y: -1 } : {}}
      whileTap={isClickable ? { scale: 0.97 } : {}}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider select-none transition-all ${
        active
          ? 'bg-accent border-accent text-white'
          : 'bg-gray-50 border-[#d2c5b1]/20 text-gray-600 hover:bg-gray-100/50'
      } ${isClickable ? 'cursor-pointer' : ''} ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      } ${className}`}
      onClick={isClickable ? onClick : undefined}
      {...props}
    >
      <span>{label}</span>
      {onDismiss && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className={`p-0.5 rounded-full hover:bg-black/10 transition-colors ${
            active ? 'text-white' : 'text-gray-400 hover:text-gray-600'
          }`}
          aria-label="Remove item"
        >
          <X size={10} strokeWidth={3} />
        </button>
      )}
    </motion.div>
  );
}

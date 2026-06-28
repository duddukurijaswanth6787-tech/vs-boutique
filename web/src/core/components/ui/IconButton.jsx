import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function IconButton({
  icon: Icon,
  onClick,
  disabled = false,
  isLoading = false,
  variant = 'ghost', // 'primary' | 'secondary' | 'luxury' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  ariaLabel,
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/20 select-none';

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-light active:bg-primary-dark shadow-md disabled:bg-gray-100 disabled:text-gray-400',
    secondary: 'bg-transparent text-primary border border-primary/20 hover:bg-primary/5 active:bg-primary/10 disabled:border-gray-200 disabled:text-gray-400',
    luxury: 'bg-transparent text-accent border border-accent/20 hover:bg-accent hover:text-white hover:border-accent disabled:border-gray-200 disabled:text-gray-400',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100/80 active:bg-gray-200/80 disabled:text-gray-300',
    danger: 'bg-transparent text-danger border border-danger/10 hover:bg-danger hover:text-white hover:border-danger disabled:border-gray-200 disabled:text-gray-400',
  };

  const sizes = {
    sm: 'p-1.5 w-8 h-8 rounded-lg',
    md: 'p-2.5 w-10 h-10 rounded-xl',
    lg: 'p-3 w-12 h-12 rounded-2xl',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      whileHover={disabled || isLoading ? {} : { scale: 1.05, y: -1 }}
      whileTap={disabled || isLoading ? {} : { scale: 0.95 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin text-current" size={iconSizes[size]} />
      ) : (
        <Icon size={iconSizes[size]} className="shrink-0" />
      )}
    </motion.button>
  );
}

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'luxury' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-sans font-semibold rounded-2xl transition-all select-none cursor-pointer focus:outline-none';
  
  const variants = {
    primary: 'bg-primary text-white hover:opacity-90 active:scale-98 shadow-md shadow-primary/10 disabled:opacity-40 disabled:pointer-events-none',
    secondary: 'bg-transparent text-primary border-2 border-primary hover:bg-primary/5 active:scale-98 disabled:opacity-40 disabled:pointer-events-none',
    luxury: 'bg-transparent text-accent border border-accent/30 hover:bg-accent hover:text-white hover:border-accent active:scale-98 disabled:opacity-40 disabled:pointer-events-none',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-50 active:scale-98 disabled:opacity-40 disabled:pointer-events-none',
    black: 'bg-primary-dark text-white hover:bg-primary active:scale-98 shadow-md shadow-primary-dark/10 disabled:opacity-40 disabled:pointer-events-none',
    gold: 'bg-accent text-white hover:bg-accent-light active:scale-98 shadow-md shadow-accent/10 disabled:opacity-40 disabled:pointer-events-none'
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3.5 text-xs tracking-wider uppercase',
    lg: 'px-8 py-4 text-sm tracking-wider uppercase'
  };

  return (
    <motion.button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      whileHover={{ y: disabled || isLoading ? 0 : -1 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin mr-2 shrink-0" size={size === 'sm' ? 14 : 16} />
          <span>Please wait...</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}

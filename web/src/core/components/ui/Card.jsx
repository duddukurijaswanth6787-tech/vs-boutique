import { motion } from 'framer-motion';

export default function Card({
  children,
  className = '',
  onClick,
  isHoverable = false,
  ...props
}) {
  const baseStyles = 'bg-white rounded-3xl overflow-hidden border border-[#d2c5b1]/10 shadow-card';
  
  if (onClick || isHoverable) {
    return (
      <motion.div
        onClick={onClick}
        whileHover={{ y: -4, boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08)' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`${baseStyles} cursor-pointer select-none ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseStyles} ${className}`} {...props}>
      {children}
    </div>
  );
}

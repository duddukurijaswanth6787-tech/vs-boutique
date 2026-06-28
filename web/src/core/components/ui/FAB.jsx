import { motion } from 'framer-motion';

export default function FAB({
  icon: Icon,
  onClick,
  className = '',
  ...props
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary text-white shadow-xl flex items-center justify-center cursor-pointer hover:bg-primary/95 focus:outline-none ${className}`}
      {...props}
    >
      <Icon size={22} />
    </motion.button>
  );
}

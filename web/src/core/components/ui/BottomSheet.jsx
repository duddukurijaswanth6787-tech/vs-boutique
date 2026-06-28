import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  ...props
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[4px]"
          />

          {/* Bottom Sheet Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className={`relative bg-white rounded-t-[2rem] p-6 w-full max-w-lg shadow-2xl border-t border-[#d2c5b1]/15 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] flex flex-col max-h-[85vh] ${className}`}
            {...props}
          >
            {/* Grab handle indicator */}
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4 shrink-0" />

            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X size={16} className="text-gray-400" />
            </button>

            {title && (
              <div className="mb-4 pr-8 shrink-0">
                <h3 className="text-lg font-serif font-black text-gray-900">{title}</h3>
              </div>
            )}

            <div className="flex-1 overflow-y-auto no-scrollbar">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

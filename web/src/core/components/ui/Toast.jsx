import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      remove(id);
    }, duration);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ show, remove }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[120] flex flex-col space-y-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => remove(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export default function Toast({ message, type = 'info', onClose }) {
  const icons = {
    success: <CheckCircle className="text-emerald-500 shrink-0" size={18} />,
    error: <AlertCircle className="text-rose-500 shrink-0" size={18} />,
    warning: <AlertTriangle className="text-amber-500 shrink-0" size={18} />,
    info: <Info className="text-sky-500 shrink-0" size={18} />,
  };

  const bgStyles = {
    success: 'border-emerald-500/10 bg-white/95 dark:bg-gray-900/95 shadow-lg',
    error: 'border-rose-500/10 bg-white/95 dark:bg-gray-900/95 shadow-lg',
    warning: 'border-amber-500/10 bg-white/95 dark:bg-gray-900/95 shadow-lg',
    info: 'border-sky-500/10 bg-white/95 dark:bg-gray-900/95 shadow-lg',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`pointer-events-auto flex items-center justify-between p-4 border rounded-2xl shadow-xl backdrop-blur-md ${bgStyles[type]}`}
    >
      <div className="flex items-center space-x-3">
        {icons[type]}
        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{message}</span>
      </div>
      <button
        onClick={onClose}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors ml-4"
        aria-label="Dismiss message"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

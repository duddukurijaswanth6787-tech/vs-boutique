import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function Accordion({
  items = [],
  className = '',
  ...props
}) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className={`space-y-2.5 ${className}`} {...props}>
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={idx} className="border border-[#d2c5b1]/10 bg-white rounded-2xl overflow-hidden shadow-card">
            <button
              onClick={() => toggle(idx)}
              className="w-full flex items-center justify-between p-4 font-sans font-bold text-xs uppercase tracking-wider text-gray-900 focus:outline-none cursor-pointer"
            >
              <span>{item.title}</span>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <div className="p-4 pt-0 text-xs font-medium text-gray-500 leading-relaxed border-t border-gray-50">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

import { motion } from 'framer-motion';

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
  ...props
}) {
  return (
    <div className={`flex border-b border-[#d2c5b1]/15 overflow-x-auto no-scrollbar ${className}`} {...props}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider relative shrink-0 transition-colors cursor-pointer ${
              isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                transition={{ type: 'spring', damping: 20, stiffness: 250 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

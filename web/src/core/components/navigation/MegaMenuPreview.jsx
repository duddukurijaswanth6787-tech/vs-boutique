import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Scissors, Sparkles, Tag, ChevronDown } from 'lucide-react';
import { CategoryList } from '../shared/CategoryList';

export const MegaMenuPreview = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        className="flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider bg-[#1F2937] text-white hover:bg-accent hover:text-white rounded-xl transition-all focus:outline-none cursor-pointer shadow-sm"
      >
        <span>Shop By Category</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-0 top-full mt-2 w-[720px] bg-white dark:bg-gray-900 rounded-3xl shadow-premium border border-[#d2c5b1]/15 p-6 z-50"
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Categories Column */}
              <div className="md:col-span-3">
                <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <Store size={15} className="text-accent" />
                  Categories
                </h4>
                <div className="max-h-96 overflow-y-auto no-scrollbar">
                  <CategoryList />
                </div>
              </div>

              {/* Services & More */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2 uppercase tracking-widest">
                    <Scissors size={15} className="text-accent" />
                    Services
                  </h4>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleNavigate('/customer/tailoring')}
                      className="w-full text-left p-3.5 bg-surface dark:bg-gray-800/40 rounded-2xl hover:bg-accent/5 transition-all focus:outline-none cursor-pointer"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                        Custom Tailoring
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        Personalized measurements & stitching
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavigate('/customer/measurements')}
                      className="w-full text-left p-3.5 bg-surface dark:bg-gray-800/40 rounded-2xl hover:bg-accent/5 transition-all focus:outline-none cursor-pointer"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                        Measurements
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        Save body parameters for tailoring
                      </p>
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2 uppercase tracking-widest">
                    <Sparkles size={15} className="text-accent" />
                    Collections
                  </h4>
                  <div className="space-y-2">
                    <Link
                      to="/customer/shop?category=festive"
                      className="block p-3.5 bg-surface dark:bg-gray-800/40 rounded-2xl hover:bg-accent/5 transition-all"
                      onClick={() => setIsOpen(false)}
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                        Festive Collection
                      </p>
                    </Link>
                    <Link
                      to="/customer/shop?category=lounge"
                      className="block p-3.5 bg-surface dark:bg-gray-800/40 rounded-2xl hover:bg-accent/5 transition-all"
                      onClick={() => setIsOpen(false)}
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                        Lounge Wear
                      </p>
                    </Link>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2 uppercase tracking-widest">
                    <Tag size={15} className="text-accent" />
                    Offers
                  </h4>
                  <Link
                    to="/customer/shop?sort=discount"
                    className="block p-3.5 bg-accent/5 rounded-2xl hover:bg-accent/15 transition-all"
                    onClick={() => setIsOpen(false)}
                  >
                    <p className="text-xs font-bold uppercase tracking-widest text-accent text-center">
                      View All Offers
                    </p>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MegaMenuPreview;

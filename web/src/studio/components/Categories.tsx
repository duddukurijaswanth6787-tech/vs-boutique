/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { categories } from '../data';

interface CategoriesProps {
  onCategoryClick: (id: string) => void;
}

export default function Categories({ onCategoryClick }: CategoriesProps) {
  return (
    <section className="w-full py-12 px-4 md:px-8 bg-[#FDFBF7]" id="categories-grid">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-accent/10 pb-2">
          <h2 className="text-sm md:text-base font-extrabold uppercase tracking-wider text-luxury-black font-sans">
            Shop By Category
          </h2>
          <button
            onClick={() => {}}
            className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-accent hover:text-accent-dark transition-all duration-300 cursor-pointer flex items-center gap-1"
          >
            View All <span className="font-serif text-xs font-semibold">&gt;</span>
          </button>
        </div>

        {/* 10 Circular Categories Grid (Scrollable on mobile, beautiful grids on desktop) */}
        <div className="flex items-start gap-4 sm:gap-6 md:gap-8 overflow-x-auto pb-2 pt-1 scrollbar-none scroll-smooth">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onCategoryClick(cat.id)}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
            >
              {/* Circular border frame */}
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border border-accent/20 p-1 group-hover:border-accent transition-all duration-300">
                <div className="h-full w-full rounded-full overflow-hidden relative">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover group-hover:scale-115 transition-transform duration-500"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all" />
                </div>
              </div>
              
              {/* Category label listed underneath circle */}
              <span className="text-[11px] font-bold text-luxury-black mt-3 group-hover:text-accent transition-colors font-sans uppercase tracking-wider text-center">
                {cat.name}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collections } from '../data';

interface CollectionsProps {
  onCollectionClick: (id: string) => void;
}

export default function Collections({ onCollectionClick }: CollectionsProps) {
  return (
    <section className="w-full py-12 px-4 md:px-8 bg-white" id="featured-collections">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-accent/10 pb-2">
          <h2 className="text-sm md:text-base font-extrabold uppercase tracking-wider text-luxury-black font-sans">
            Featured Collections
          </h2>
          <button
            onClick={() => {}}
            className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-accent hover:text-accent-dark transition-all duration-300 cursor-pointer flex items-center gap-1"
          >
            View All <span className="font-serif text-xs font-semibold">&gt;</span>
          </button>
        </div>

        {/* 4 Rectangular Cards Grid - horizontally scrollable on mobile */}
        <div className="flex overflow-x-auto gap-4 pb-4 md:grid md:grid-cols-4 md:gap-6 md:pb-0 scrollbar-none">
          {collections.map((item) => (
            <div
              key={item.id}
              onClick={() => onCollectionClick(item.id)}
              className="group relative h-64 w-60 sm:w-72 md:w-full shrink-0 rounded-2xl overflow-hidden shadow-card border border-accent/10 cursor-pointer"
            >
              {/* Background image zoom on hover */}
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              
              {/* Dark subtle overlay for premium contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 transition-all group-hover:from-black/90 group-hover:via-black/40" />

              {/* Text contents at the bottom left */}
              <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col justify-end space-y-2">
                <div>
                  <h3 className="text-base font-bold text-white font-serif leading-none">{item.title}</h3>
                  <p className="text-[10px] text-gray-300 mt-1">{item.subtitle}</p>
                </div>
                
                {/* Outlined elegant CTA button */}
                <div className="pt-2">
                  <span className="inline-block border border-accent/60 text-accent font-semibold text-[10px] uppercase tracking-wider px-4 py-1.5 rounded-lg group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-all duration-300 leading-none">
                    Shop Now
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

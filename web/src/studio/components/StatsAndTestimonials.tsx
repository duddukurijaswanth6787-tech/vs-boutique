/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShieldCheck, ChevronLeft, ChevronRight, Users, Store, Heart, Percent, Truck, RefreshCw } from 'lucide-react';
import { testimonials } from '../data';

export default function StatsAndTestimonials() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [direction, setDirection] = useState(0); // -1 = left, 1 = right

  const stats = [
    { value: '50k+', label: 'Happy Customers', icon: Users },
    { value: '1000+', label: 'Partner Boutiques', icon: Store },
    { value: '10K+', label: 'Custom Designs', icon: Heart },
    { value: '4.8/5', label: 'Average Rating', icon: Star },
    { value: '99%', label: 'On-time Delivery', icon: Truck },
    { value: '7 Days', label: 'Easy Returns', icon: RefreshCw }
  ];

  const handleNext = () => {
    setDirection(1);
    setActiveIdx((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setActiveIdx((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const activeReview = testimonials[activeIdx];

  return (
    <section className="w-full bg-[#FAF8F5]">
      
      {/* Obsidian Black Statistics Grid */}
      <div className="w-full bg-luxury-black text-white py-12 px-4 md:px-8 border-y border-accent/25 shadow-luxury" id="stats-strip">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 text-center">
          {stats.map((stat, idx) => {
            const IconComponent = stat.icon;
            return (
              <div key={idx} className="space-y-2 group transition-all duration-300">
                <div className="mx-auto h-7 w-7 text-accent opacity-80 group-hover:opacity-100 transition-opacity">
                  <IconComponent className="h-full w-full stroke-[1.25]" />
                </div>
                <div className="text-3xl font-serif font-bold text-white leading-none tracking-tight">{stat.value}</div>
                <div className="text-[9px] text-gray-400 font-extrabold uppercase tracking-[0.2em]">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* "What Our Customers Say" Testimonials Panel */}
      <div className="w-full py-16 px-4 md:px-8 max-w-[1400px] mx-auto space-y-10" id="testimonials">
        
        {/* Section Header */}
        <div className="flex items-end justify-between border-b border-accent/10 pb-3">
          <div>
            <span className="text-[9px] tracking-widest text-accent font-extrabold uppercase font-sans block mb-1">Reviews</span>
            <h2 className="text-2xl font-serif italic font-semibold text-luxury-black">What Our Customers Say</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="h-8 w-8 border border-accent/25 hover:bg-white text-luxury-black hover:text-accent rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              className="h-8 w-8 border border-accent/25 hover:bg-white text-luxury-black hover:text-accent rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Testimonial slider animation */}
        <div className="relative overflow-hidden min-h-[220px] bg-white rounded-[12px] border border-accent/10 p-6 md:p-8 shadow-card max-w-2xl mx-auto flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              {/* Stars rating & verified checkmark */}
              <div className="flex items-center justify-between">
                <div className="flex text-amber-400 gap-0.5">
                  {[...Array(activeReview.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>

                {activeReview.verified && (
                  <span className="text-[9px] font-bold text-accent border border-accent/20 bg-luxury-ivory px-2.5 py-1 rounded-[4px] flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-accent stroke-[2]" />
                    Verified Client
                  </span>
                )}
              </div>

              {/* Review Text blockquote */}
              <blockquote className="text-sm md:text-base text-gray-700 italic font-sans leading-relaxed">
                "{activeReview.quote}"
              </blockquote>

              {/* User credentials */}
              <div className="flex items-center gap-3 pt-3">
                <img
                  src={activeReview.avatar}
                  alt={activeReview.name}
                  className="h-9 w-9 object-cover rounded-full border border-accent/20 shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <strong className="text-[10px] font-bold uppercase tracking-wider text-luxury-black font-sans block">{activeReview.name}</strong>
                  <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                    <ShieldCheck className="h-3 w-3 text-accent" />
                    Verified client • {activeReview.location}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bullet Indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-6 border-t border-gray-50 pt-4">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > activeIdx ? 1 : -1);
                  setActiveIdx(idx);
                }}
                className={`h-1 rounded-full transition-all duration-300 ${idx === activeIdx ? 'w-5 bg-accent' : 'w-1 bg-accent/20'}`}
                aria-label={`Testimonial slide ${idx + 1}`}
              />
            ))}
          </div>

        </div>

      </div>

    </section>
  );
}

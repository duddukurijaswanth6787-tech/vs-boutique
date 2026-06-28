/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface Slide {
  id: number;
  tag: string;
  title: string;
  description: string;
  image: string;
  badgeText: string;
  accentColor: string;
}

const slides: Slide[] = [
  {
    id: 1,
    tag: 'New Collection 2024',
    title: 'Elegance Redefined',
    description: 'Discover timeless designs crafted to celebrate every you.',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
    badgeText: 'UP TO 40% OFF',
    accentColor: '#C5A059'
  },
  {
    id: 2,
    tag: 'Bespoke Perfection',
    title: 'Stitched For Royalty',
    description: 'Bespoke tailoring that matches your unique posture, style, and spirit.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop',
    badgeText: 'BESPOKE TAILOR',
    accentColor: '#1F2937'
  },
  {
    id: 3,
    tag: 'Heritage Masterpieces',
    title: 'Handcrafted Sarees',
    description: 'Experience pure art silk Banaras and Kanchipuram sarees with luxury drapes.',
    image: 'https://images.unsplash.com/photo-1583391265517-35bbadd01209?q=80&w=800&auto=format&fit=crop',
    badgeText: '100% ART SILK',
    accentColor: '#A37F3F'
  }
];

interface HeroProps {
  onExploreClick: () => void;
  onVideoClick: () => void;
}

export default function Hero({ onExploreClick, onVideoClick }: HeroProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [direction, setDirection] = useState(0); // -1 = left, 1 = right

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [currentIdx]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIdx((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIdx((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const activeSlide = slides[currentIdx];

  return (
    <div className="relative bg-[#FAF8F5] overflow-hidden" id="hero-banner-container">
      {/* Full-bleed container */}
      <div className="max-w-[1400px] mx-auto min-h-[480px] sm:min-h-[520px] md:min-h-[580px] flex items-center relative overflow-hidden rounded-none md:rounded-2xl md:my-4 border-b md:border border-accent/15">
        
        {/* Slide Image Background */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentIdx}
              src={activeSlide.image}
              alt={activeSlide.title}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full h-full object-cover"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
          {/* Subtle light elegant gradient to ensure high readability of dark texts on the left */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Navigation Arrows on edges */}
        <button
          onClick={handlePrev}
          className="absolute left-3 md:left-4 z-20 h-8 w-8 md:h-10 md:w-10 bg-white/80 hover:bg-white text-luxury-black hover:text-accent rounded-full flex items-center justify-center shadow-md border border-accent/10 active:scale-95 transition-all cursor-pointer"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-3 md:right-4 z-20 h-8 w-8 md:h-10 md:w-10 bg-white/80 hover:bg-white text-luxury-black hover:text-accent rounded-full flex items-center justify-center shadow-md border border-accent/10 active:scale-95 transition-all cursor-pointer"
          aria-label="Next slide"
        >
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
        </button>

        {/* Floating Dotted circular Gold Discount Badge on far right */}
        <div className="absolute right-4 top-16 md:right-12 md:top-12 z-20">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 bg-accent text-white rounded-full flex flex-col items-center justify-center shadow-xl border-2 border-white/20 p-2 text-center"
          >
            {/* Concentric inner ring */}
            <div className="absolute inset-1 border border-dashed border-white/40 rounded-full pointer-events-none" />
            
            <span className="text-[7.5px] md:text-[9px] font-bold uppercase tracking-[0.15em] text-white/95">UP TO</span>
            <span className="text-lg md:text-2xl font-extrabold font-serif leading-none my-0.5">40%</span>
            <span className="text-[8.5px] md:text-[10px] font-bold uppercase tracking-widest text-white/95 leading-none">OFF</span>
          </motion.div>
        </div>

        {/* Overlaid text description pane (left-aligned) */}
        <div className="relative z-10 pl-10 pr-6 sm:pl-16 md:pl-20 py-12 max-w-[85%] sm:max-w-[70%] md:max-w-[55%] flex flex-col justify-center h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="space-y-4 md:space-y-5"
            >
              <span className="text-[8.5px] md:text-[10px] uppercase tracking-[0.25em] text-accent font-extrabold font-sans block">
                {activeSlide.tag}
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-extrabold tracking-tight leading-[1.0] text-luxury-black">
                {activeSlide.title}
              </h2>
              <p className="text-[11px] sm:text-xs md:text-sm text-luxury-charcoal max-w-xs md:max-w-md leading-relaxed font-sans font-medium">
                {activeSlide.description}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-2 md:pt-4">
                <button
                  onClick={onExploreClick}
                  className="bg-luxury-black hover:bg-accent text-white px-6 py-3 sm:px-8 sm:py-3.5 rounded-[12px] text-[10px] md:text-xs font-bold tracking-widest uppercase transition-all shadow-md hover:shadow-lg active:scale-95 duration-300 cursor-pointer flex items-center justify-center gap-2"
                >
                  Explore Collection
                  <ChevronRight className="h-3 w-3" />
                </button>
                <button
                  onClick={onVideoClick}
                  className="flex items-center gap-3 text-[10px] md:text-xs uppercase tracking-widest font-bold font-sans text-luxury-black hover:text-accent transition-colors group cursor-pointer self-start sm:self-auto"
                >
                  <div className="h-7 w-7 md:h-8 md:w-8 rounded-full border border-gray-300 flex items-center justify-center bg-white group-hover:border-accent group-hover:text-accent transition-all shrink-0">
                    <Play className="h-2.5 w-2.5 fill-current stroke-current ml-0.5" />
                  </div>
                  Watch Film
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Indicators Dots centered below on mobile, or left-aligned with text */}
          <div className="flex items-center gap-2 mt-10 md:mt-12">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentIdx ? 1 : -1);
                  setCurrentIdx(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIdx ? 'w-5 bg-luxury-black' : 'w-1.5 bg-luxury-black/30'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

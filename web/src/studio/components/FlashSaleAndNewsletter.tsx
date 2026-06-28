/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Clock, Check, Sparkles, AlertCircle } from 'lucide-react';

export default function FlashSaleAndNewsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Countdown timer calculations
  const [hours, setHours] = useState(2);
  const [minutes, setMinutes] = useState(15);
  const [seconds, setSeconds] = useState(48);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prevSec) => {
        if (prevSec > 0) return prevSec - 1;
        setMinutes((prevMin) => {
          if (prevMin > 0) {
            setSeconds(59);
            return prevMin - 1;
          }
          setHours((prevHr) => {
            if (prevHr > 0) {
              setMinutes(59);
              setSeconds(59);
              return prevHr - 1;
            }
            // Loop timer as fallback so it always has values ticking!
            setMinutes(15);
            setSeconds(48);
            return 2;
          });
          return 0;
        });
        return 59;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    setErrorMsg('');
    setSubscribed(true);
    setEmail('');
    setTimeout(() => {
      setSubscribed(false);
    }, 2500);
  };

  return (
    <section className="w-full py-12 px-4 md:px-8 bg-white" id="flash-sale">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* FLASH SALE COUNTDOWN BANNER (Col-span 7) */}
        <div className="lg:col-span-7 bg-luxury-black text-white rounded-[12px] overflow-hidden relative border border-accent/20 min-h-[260px] flex flex-col justify-between p-6 sm:p-8 shadow-luxury group">
          {/* Cover background fashion model */}
          <img
            src="https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?q=80&w=600&auto=format&fit=crop"
            alt="Flash Sale Banner Model"
            className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-[1.02] transition-transform duration-700 pointer-events-none"
            loading="lazy"
            referrerPolicy="no-referrer"
          />

          {/* Deep dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <span className="text-accent text-[10px] font-extrabold tracking-[0.25em] uppercase font-sans flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 animate-pulse" />
              Limited Time Flash Offer
            </span>
            <h3 className="text-2xl font-serif italic font-semibold tracking-tight leading-none text-white">
              Bridal & Ethnic Extravaganza
            </h3>
            <p className="text-xs text-gray-300 max-w-sm font-sans leading-relaxed">
              Tailoring custom stitching, accessories, and premium lehengas discounted automatically.
            </p>
          </div>

          {/* Countdown Clock boxes */}
          <div className="relative z-10 flex items-center gap-3 pt-6 flex-wrap">
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 bg-white/10 border border-white/20 backdrop-blur-xs rounded-[8px] flex items-center justify-center text-sm font-bold text-accent font-mono shadow-md">
                {hours < 10 ? `0${hours}` : hours}
              </div>
              <span className="text-[9px] uppercase font-bold text-gray-300 mt-1">HRS</span>
            </div>

            <div className="text-accent font-bold text-lg font-mono mb-4">:</div>

            <div className="flex flex-col items-center">
              <div className="h-12 w-12 bg-white/10 border border-white/20 backdrop-blur-xs rounded-[8px] flex items-center justify-center text-sm font-bold text-accent font-mono shadow-md">
                {minutes < 10 ? `0${minutes}` : minutes}
              </div>
              <span className="text-[9px] uppercase font-bold text-gray-300 mt-1">MINS</span>
            </div>

            <div className="text-accent font-bold text-lg font-mono mb-4">:</div>

            <div className="flex flex-col items-center">
              <div className="h-12 w-12 bg-white/10 border border-white/20 backdrop-blur-xs rounded-[8px] flex items-center justify-center text-sm font-bold text-accent font-mono shadow-md">
                {seconds < 10 ? `0${seconds}` : seconds}
              </div>
              <span className="text-[9px] uppercase font-bold text-gray-300 mt-1">SECS</span>
            </div>

            <div className="sm:ml-8 mt-2 sm:mt-0">
              <button
                onClick={() => {
                  const el = document.getElementById('new-arrivals');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-accent hover:bg-accent-dark text-white px-6 py-2.5 rounded-[8px] text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 shadow-lg cursor-pointer"
              >
                Shop Sale Now
              </button>
            </div>
          </div>
        </div>

        {/* STAY IN STYLE NEWSLETTER SUBSCRIPTION (Col-span 5) */}
        <div className="lg:col-span-5 bg-luxury-ivory border border-accent/20 rounded-[12px] p-6 sm:p-8 shadow-card flex flex-col justify-between text-center relative overflow-hidden">
          {/* Subtle concentric rings background */}
          <div className="absolute -right-16 -top-16 h-36 w-36 border border-accent/10 rounded-full pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 h-36 w-36 border border-accent/10 rounded-full pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <span className="text-accent text-[9px] font-extrabold tracking-widest uppercase font-sans">
              Stay in Style
            </span>
            <h3 className="text-xl font-serif italic font-semibold text-luxury-black">
              Newsletter Subscription
            </h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
              Subscribe to unlock custom collections alerts, secret VIP coupon codes, and designer styling advice.
            </p>
          </div>

          <div className="pt-6 relative z-10 max-w-sm mx-auto w-full">
            <form onSubmit={handleSubscribe} className="flex border border-accent/30 rounded-[12px] overflow-hidden bg-white shadow-sm focus-within:border-accent">
              <div className="flex items-center pl-3">
                <Mail className="h-4 w-4 text-accent" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3 py-2 text-xs focus:outline-none text-luxury-black placeholder-gray-400 bg-white"
              />
              <button
                type="submit"
                className="bg-luxury-black hover:bg-accent text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
              >
                Subscribe
              </button>
            </form>

            <AnimatePresence>
              {subscribed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 justify-center text-green-600 text-[11px] font-semibold mt-3"
                >
                  <Check className="h-4 w-4 stroke-[2]" /> Welcome to the VS Family! Coupon code sent.
                </motion.div>
              )}
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 justify-center text-red-500 text-[11px] font-semibold mt-3"
                >
                  <AlertCircle className="h-4 w-4" /> {errorMsg}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-[9px] text-gray-400 mt-6 relative z-10">
            🔒 We value your privacy. Unsubscribe at any time instantly.
          </p>
        </div>

      </div>
    </section>
  );
}

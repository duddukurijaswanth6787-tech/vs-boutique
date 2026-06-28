/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShieldCheck, MapPin, Phone, X, Check, Calendar, Sparkles } from 'lucide-react';
import { Boutique } from '../types';
import { boutiques } from '../data';

interface BoutiquesProps {
  onBoutiqueSelect: (b: Boutique) => void;
  activeBoutique: Boutique | null;
  setActiveBoutique: (b: Boutique | null) => void;
}

export default function Boutiques({ onBoutiqueSelect, activeBoutique, setActiveBoutique }: BoutiquesProps) {
  const [selectedDate, setSelectedDate] = useState('2026-06-29');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('11:00 AM');
  const [isBooked, setIsBooked] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');

  const handleOpenBoutiqueDetails = (b: Boutique) => {
    setActiveBoutique(b);
    setIsBooked(false);
    setCustName('');
    setCustPhone('');
  };

  const handleBookBoutique = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooked(true);
  };

  return (
    <section className="w-full py-12 px-4 md:px-8 bg-luxury-ivory/20" id="partner-boutiques">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Section Header */}
        <div className="flex items-end justify-between border-b border-accent/10 pb-3">
          <div>
            <span className="text-[9px] tracking-widest text-accent font-extrabold uppercase font-sans block mb-1">Partners</span>
            <h2 className="text-2xl font-serif italic font-semibold text-luxury-black">Our Verified Boutiques</h2>
          </div>
          <button
            onClick={() => {}}
            className="text-[10px] uppercase tracking-widest font-bold border-b border-luxury-black pb-0.5 text-luxury-black hover:text-accent hover:border-accent transition-all duration-300 cursor-pointer"
          >
            View All Partners
          </button>
        </div>

        {/* 6 Columns of Boutique Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boutiques.map((b) => (
            <div
              key={b.id}
              onClick={() => handleOpenBoutiqueDetails(b)}
              className="bg-white rounded-[12px] overflow-hidden border border-accent/15 shadow-card hover:border-accent/35 hover:shadow-hover transition-all duration-300 flex flex-col justify-between cursor-pointer group h-full"
            >
              <div>
                {/* Banner Image aspect-[16/10] */}
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={b.image}
                    alt={b.name}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                  {/* Floating Logo Initial */}
                  <div className="absolute bottom-3 left-3 h-10 w-10 bg-white text-accent font-serif font-black rounded-[8px] flex items-center justify-center border border-accent/20 shadow-md">
                    {b.logo}
                  </div>

                  {/* Verified badge checkmark */}
                  {b.verified && (
                    <div className="absolute top-3 right-3 bg-accent text-white text-[9px] font-bold tracking-[0.1em] uppercase py-1 px-2.5 rounded-[4px] flex items-center gap-1 shadow-md">
                      <ShieldCheck className="h-3.5 w-3.5 text-white" />
                      Verified
                    </div>
                  )}
                </div>

                {/* Body details */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-luxury-black font-sans group-hover:text-accent transition-colors leading-none flex items-center gap-1">
                        {b.name}
                        {b.verified && <ShieldCheck className="h-4.5 w-4.5 text-accent inline-block stroke-[2]" />}
                      </h3>
                      <p className="text-[9px] uppercase tracking-widest text-gray-400 mt-1.5 flex items-center gap-1 font-semibold">
                        <MapPin className="h-3 w-3 text-accent" />
                        {b.city} Studio
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-[10px]">
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-luxury-black">{b.rating}</span>
                      <span className="text-gray-400">({b.reviewCount})</span>
                    </div>
                  </div>

                  {/* Specialties tag items */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {b.specialties.map((spec, sIdx) => (
                      <span
                        key={sIdx}
                        className="bg-luxury-ivory text-gray-500 border border-accent/10 text-[9px] px-2 py-0.5 rounded-[4px] font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Book now CTA */}
              <div className="px-5 pb-5 pt-2 border-t border-accent/5 flex items-center justify-between text-xs mt-auto">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Guaranteed Fitting</span>
                <span className="text-accent font-bold group-hover:underline flex items-center gap-0.5 text-[10px] uppercase tracking-wider">
                  Book Studio Slots
                </span>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* Boutique Details & Appointment Scheduler Modal */}
      <AnimatePresence>
        {activeBoutique && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" id="boutique-details-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-luxury-ivory rounded-2xl max-w-2xl w-full overflow-hidden shadow-luxury border border-accent/20 grid grid-cols-1 md:grid-cols-12 max-h-[90vh] overflow-y-auto"
            >
              {/* Left Column: Image banner & info (Col-span 5) */}
              <div className="md:col-span-5 relative bg-white flex flex-col justify-between border-r border-accent/15 p-6">
                <div className="space-y-4">
                  <img
                    src={activeBoutique.image}
                    alt={activeBoutique.name}
                    className="w-full aspect-[16/10] object-cover rounded-xl shadow-card"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="text-base font-bold text-luxury-black flex items-center gap-1 font-serif">
                      {activeBoutique.name}
                      {activeBoutique.verified && <ShieldCheck className="h-5 w-5 text-accent fill-accent text-white" />}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-accent" />
                      {activeBoutique.city} Studio Partner
                    </p>
                  </div>
                  
                  {/* Rating parameters */}
                  <div className="flex items-center gap-1.5 text-xs py-2 border-y border-accent/10">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    <span className="font-bold text-luxury-black">{activeBoutique.rating}</span>
                    <span className="text-gray-400">({activeBoutique.reviewCount} customer reviews)</span>
                  </div>

                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                      <span>{activeBoutique.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-accent flex-shrink-0" />
                      <span>{activeBoutique.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-accent/10 text-[10px] text-gray-400 text-center uppercase tracking-wider flex items-center justify-center gap-1 font-bold">
                  <Sparkles className="h-3.5 w-3.5 text-accent" /> Premium Designer Studio
                </div>
              </div>

              {/* Right Column: Scheduler Booking Form (Col-span 7) */}
              <div className="md:col-span-7 p-6 flex flex-col justify-between">
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] tracking-widest text-accent font-extrabold uppercase font-sans">
                      Book Slot Consultation
                    </span>
                    <h4 className="text-sm font-bold text-luxury-black mt-1 font-sans">
                      Schedule Studio Consultation
                    </h4>
                  </div>
                  <button
                    onClick={() => setActiveBoutique(null)}
                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {!isBooked ? (
                  <form onSubmit={handleBookBoutique} className="space-y-4 mt-6">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ananya Rao"
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        className="w-full bg-white border border-accent/25 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">Your Phone Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 9444012345"
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        className="w-full bg-white border border-accent/25 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent"
                      />
                    </div>

                    {/* Date picker */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">Appointment Date *</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-accent" />
                          <input
                            type="date"
                            required
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full bg-white border border-accent/25 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">Appointment Time *</label>
                        <select
                          value={selectedTimeSlot}
                          onChange={(e) => setSelectedTimeSlot(e.target.value)}
                          className="w-full bg-white border border-accent/25 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                        >
                          <option value="10:00 AM">10:00 AM - 11:30 AM</option>
                          <option value="11:30 AM">11:30 AM - 01:00 PM</option>
                          <option value="02:00 PM">02:00 PM - 03:30 PM</option>
                          <option value="03:30 PM">03:30 PM - 05:00 PM</option>
                          <option value="05:00 PM">05:00 PM - 06:30 PM</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-4 bg-white/40 border border-accent/15 rounded-xl text-[10.5px] text-gray-500 leading-relaxed">
                      💡 <strong>Studio Slot Notes:</strong> Studio consultation includes sizing measurements, fabric sample reviews, and design layout planning. Fitting consultations are entirely <strong>Free of Cost</strong>.
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-luxury-black hover:bg-accent text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors mt-2"
                    >
                      Book Free Studio Consultation
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-8 space-y-4 mt-6">
                    <div className="mx-auto h-12 w-12 bg-green-50 rounded-full flex items-center justify-center border border-green-200">
                      <Check className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-luxury-black font-serif">Studio Consultation Secured!</h4>
                      <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                        Hi <strong>{custName}</strong>, your free measurement consultation has been scheduled at <strong>{activeBoutique.name}</strong>, {activeBoutique.city}.
                      </p>
                    </div>

                    <div className="p-3.5 bg-white border border-accent/10 rounded-xl text-left text-xs space-y-1.5 max-w-xs mx-auto">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Date:</span>
                        <strong className="text-gray-700">{selectedDate}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Time:</span>
                        <strong className="text-gray-700">{selectedTimeSlot}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Boutique Phone:</span>
                        <span className="text-gray-600">{activeBoutique.phone}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveBoutique(null)}
                      className="px-6 py-2 bg-luxury-black text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-accent transition-colors"
                    >
                      Done
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}

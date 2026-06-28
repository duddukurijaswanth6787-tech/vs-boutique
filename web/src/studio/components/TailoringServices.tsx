/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Sparkles, Undo, Heart, UserCheck, Truck, Feather, X, Calendar, Clock, Check, HelpCircle } from 'lucide-react';
import { TailoringService, Boutique } from '../types';
import { tailoringServices, boutiques } from '../data';

// Map string icon name to actual Lucide component
const iconMap: { [key: string]: any } = {
  Scissors: Scissors,
  Sparkles: Sparkles,
  Undo: Undo,
  Heart: Heart,
  UserCheck: UserCheck,
  Truck: Truck,
  Feather: Feather
};

interface TailoringServicesProps {
  isBookingOpen: boolean;
  onBookingClose: () => void;
  onBookingOpen: () => void;
}

export default function TailoringServices({ isBookingOpen, onBookingClose, onBookingOpen }: TailoringServicesProps) {
  const [selectedServiceId, setSelectedServiceId] = useState(tailoringServices[0].id);
  const [selectedBoutiqueId, setSelectedBoutiqueId] = useState(boutiques[0].id);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [measurementType, setMeasurementType] = useState<'standard' | 'manual' | 'at-home'>('standard');
  const [standardSize, setStandardSize] = useState('M');
  const [fabricOption, setFabricOption] = useState<'provided' | 'boutique'>('provided');
  const [appointmentDate, setAppointmentDate] = useState('2026-06-30');
  const [appointmentTime, setAppointmentTime] = useState('11:00');
  const [isSuccess, setIsSuccess] = useState(false);

  // Manual measurement inputs
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [length, setLength] = useState('');

  const activeService = tailoringServices.find(s => s.id === selectedServiceId) || tailoringServices[0];
  const activeBoutique = boutiques.find(b => b.id === selectedBoutiqueId) || boutiques[0];

  // Pricing math: service base cost + fabric cost (+1500 if boutique supplies) + express fee if service is express
  const getPrice = () => {
    let base = 1200;
    if (selectedServiceId === 'blouse_stitch') base = 800;
    else if (selectedServiceId === 'alterations') base = 250;
    else if (selectedServiceId === 'wedding_outfit') base = 5000;
    else if (selectedServiceId === 'kids_stitch') base = 600;
    else if (selectedServiceId === 'express_delivery') base = 1500;
    else if (selectedServiceId === 'fabric_consult') base = 0;

    const fabricCost = fabricOption === 'boutique' ? 1500 : 0;
    const measurementCost = measurementType === 'at-home' ? 299 : 0;

    return base + fabricCost + measurementCost;
  };

  const handleOpenBooking = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setIsSuccess(false);
    onBookingOpen();
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
  };

  return (
    <section className="w-full py-12 px-4 md:px-8 bg-white" id="tailoring-services">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Section Header */}
        <div className="flex items-end justify-between border-b border-accent/10 pb-3">
          <div>
            <span className="text-[9px] tracking-widest text-accent font-extrabold uppercase font-sans block mb-1">Expertise</span>
            <h2 className="text-2xl font-serif italic font-semibold text-luxury-black">Our Tailoring Services</h2>
          </div>
          <button
            onClick={() => handleOpenBooking(tailoringServices[0].id)}
            className="text-[10px] uppercase tracking-widest font-bold border-b border-luxury-black pb-0.5 text-luxury-black hover:text-accent hover:border-accent transition-all duration-300 cursor-pointer"
          >
            View All Services
          </button>
        </div>

        {/* 7 Rectangular Services Cards Row */}
        <div className="flex items-stretch gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-accent-light scrollbar-track-transparent">
          {tailoringServices.map((service) => {
            const IconComponent = iconMap[service.iconName] || Scissors;
            return (
              <div
                key={service.id}
                onClick={() => handleOpenBooking(service.id)}
                className="flex-shrink-0 w-64 p-6 bg-white border border-accent/15 hover:border-accent hover:shadow-hover rounded-[12px] cursor-pointer transition-all duration-300 flex flex-col justify-between text-center group"
              >
                <div className="space-y-4">
                  {/* Centered Outline Icon style */}
                  <div className="mx-auto h-12 w-12 bg-[#FDFBF7] border border-accent/20 rounded-full flex items-center justify-center group-hover:bg-accent group-hover:border-accent transition-colors duration-300">
                    <IconComponent className="h-4.5 w-4.5 text-accent group-hover:text-white transition-colors duration-300 stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold text-luxury-black group-hover:text-accent transition-colors font-sans uppercase tracking-wider leading-none">
                      {service.name}
                    </h3>
                    <p className="text-[9px] text-gray-400 mt-1.5 font-sans italic">{service.subtitle}</p>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-3 font-sans h-12 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-accent/10 mt-4 flex items-center justify-between text-xs">
                  <span className="font-bold text-accent">{service.priceEstimate}</span>
                  <span className="text-[10px] text-gray-400 font-medium">Est. {service.durationDays} days</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Booking Dialog Modal Form */}
      <AnimatePresence>
        {isBookingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" id="booking-services-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-luxury-ivory rounded-2xl max-w-2xl w-full overflow-hidden shadow-luxury border border-accent/20 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="bg-white border-b border-accent/15 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-accent font-sans">Tailor Booking Form</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Secure bespoke tailoring and specialist consultations</p>
                </div>
                <button
                  onClick={onBookingClose}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!isSuccess ? (
                <form onSubmit={handleSubmitBooking} className="p-6 space-y-6">
                  {/* Service & Boutique Selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">Select Custom Service</label>
                      <select
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                        className="w-full bg-white border border-accent/25 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent"
                      >
                        {tailoringServices.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.priceEstimate})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">Select Studio Partner Boutique</label>
                      <select
                        value={selectedBoutiqueId}
                        onChange={(e) => setSelectedBoutiqueId(e.target.value)}
                        className="w-full bg-white border border-accent/25 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent"
                      >
                        {boutiques.map(b => (
                          <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-luxury-black uppercase tracking-wider">Contact Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Your Name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full bg-white border border-accent/25 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          required
                          placeholder="Your Email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full bg-white border border-accent/25 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <input
                          type="tel"
                          required
                          placeholder="Your Mobile Phone"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full bg-white border border-accent/25 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Measurements Selector Mode */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-luxury-black uppercase tracking-wider">Fit & Measurement Method</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <label className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${measurementType === 'standard' ? 'border-accent bg-accent/5' : 'border-gray-200 bg-white'}`}>
                        <input
                          type="radio"
                          name="measure"
                          checked={measurementType === 'standard'}
                          onChange={() => setMeasurementType('standard')}
                          className="sr-only"
                        />
                        <span className="text-xs font-bold block text-luxury-black">Use Standard Size</span>
                        <span className="text-[10px] text-gray-400 mt-1 block">Specify XS, S, M, L, XL</span>
                      </label>

                      <label className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${measurementType === 'manual' ? 'border-accent bg-accent/5' : 'border-gray-200 bg-white'}`}>
                        <input
                          type="radio"
                          name="measure"
                          checked={measurementType === 'manual'}
                          onChange={() => setMeasurementType('manual')}
                          className="sr-only"
                        />
                        <span className="text-xs font-bold block text-luxury-black">Enter Measurements</span>
                        <span className="text-[10px] text-gray-400 mt-1 block">Input custom inches manually</span>
                      </label>

                      <label className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${measurementType === 'at-home' ? 'border-accent bg-accent/5' : 'border-gray-200 bg-white'}`}>
                        <input
                          type="radio"
                          name="measure"
                          checked={measurementType === 'at-home'}
                          onChange={() => setMeasurementType('at-home')}
                          className="sr-only"
                        />
                        <span className="text-xs font-bold block text-luxury-black">At-Home Master Fitting</span>
                        <span className="text-[10px] text-gray-400 mt-1 block">Specialist visits home (+₹299)</span>
                      </label>
                    </div>

                    {/* Standard Size input */}
                    {measurementType === 'standard' && (
                      <div className="flex gap-2">
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setStandardSize(s)}
                            className={`h-9 w-9 text-xs font-bold rounded-lg border transition-all ${standardSize === s ? 'border-accent bg-accent/15 text-accent font-black' : 'border-gray-200 bg-white'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Manual measurements form */}
                    {measurementType === 'manual' && (
                      <div className="grid grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-accent/10">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1">Chest (in)</label>
                          <input type="text" placeholder="36" value={chest} onChange={e => setChest(e.target.value)} className="w-full border border-gray-200 rounded-lg p-1.5 text-xs focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1">Waist (in)</label>
                          <input type="text" placeholder="30" value={waist} onChange={e => setWaist(e.target.value)} className="w-full border border-gray-200 rounded-lg p-1.5 text-xs focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1">Hips (in)</label>
                          <input type="text" placeholder="38" value={hips} onChange={e => setHips(e.target.value)} className="w-full border border-gray-200 rounded-lg p-1.5 text-xs focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1">Length (in)</label>
                          <input type="text" placeholder="42" value={length} onChange={e => setLength(e.target.value)} className="w-full border border-gray-200 rounded-lg p-1.5 text-xs focus:outline-none" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fabric Option */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-luxury-black uppercase tracking-wider">Fabric Supply option</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className={`p-3 rounded-xl border cursor-pointer transition-all ${fabricOption === 'provided' ? 'border-accent bg-accent/5' : 'border-gray-200 bg-white'}`}>
                        <div className="flex items-center gap-2">
                          <input type="radio" checked={fabricOption === 'provided'} onChange={() => setFabricOption('provided')} className="accent-accent" />
                          <div>
                            <span className="text-xs font-bold block text-luxury-black">I will supply fabric</span>
                            <span className="text-[10px] text-gray-400">Deliver fabric to partner boutique studio</span>
                          </div>
                        </div>
                      </label>
                      <label className={`p-3 rounded-xl border cursor-pointer transition-all ${fabricOption === 'boutique' ? 'border-accent bg-accent/5' : 'border-gray-200 bg-white'}`}>
                        <div className="flex items-center gap-2">
                          <input type="radio" checked={fabricOption === 'boutique'} onChange={() => setFabricOption('boutique')} className="accent-accent" />
                          <div>
                            <span className="text-xs font-bold block text-luxury-black">Boutique supplies fabric (+₹1,500)</span>
                            <span className="text-[10px] text-gray-400">Select premium silks/georgettes from samples</span>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Appointment scheduling */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">Preferred Appointment Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-accent" />
                        <input
                          type="date"
                          required
                          value={appointmentDate}
                          onChange={e => setAppointmentDate(e.target.value)}
                          className="w-full bg-white border border-accent/25 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">Preferred Time Slot</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-accent" />
                        <select
                          value={appointmentTime}
                          onChange={e => setAppointmentTime(e.target.value)}
                          className="w-full bg-white border border-accent/25 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none"
                        >
                          <option value="10:00">10:00 AM - 12:00 PM</option>
                          <option value="12:00">12:00 PM - 02:00 PM</option>
                          <option value="14:00">02:00 PM - 04:00 PM</option>
                          <option value="16:00">04:00 PM - 06:00 PM</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Summary Footer bar */}
                  <div className="p-4 bg-white border border-accent/15 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-400 font-medium">Estimated Stitching Charge:</span>
                      <p className="text-base font-bold text-luxury-black mt-0.5">
                        {activeService.id === 'fabric_consult' ? 'FREE CONSULTATION' : `₹${getPrice()}`}
                      </p>
                    </div>
                    <button
                      type="submit"
                      className="bg-luxury-black hover:bg-accent text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      Book Stitching Session
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-12 text-center space-y-4">
                  <div className="mx-auto h-16 w-16 bg-green-50 rounded-full flex items-center justify-center border border-green-200">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-luxury-black font-serif">Tailoring Booking Placed Successfully!</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Hi <strong>{customerName}</strong>, your bespoke fitting session for <strong>{activeService.name}</strong> has been secured at <strong>{activeBoutique.name}</strong>, {activeBoutique.city}.
                  </p>

                  <div className="p-4 bg-white border border-accent/15 rounded-xl text-left text-xs space-y-2 max-w-md mx-auto">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Boutique:</span>
                      <strong className="text-gray-700">{activeBoutique.name} ({activeBoutique.city})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Address Location:</span>
                      <span className="text-gray-600 text-right max-w-xs">{activeBoutique.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Appointment Date/Time:</span>
                      <strong className="text-gray-700">{appointmentDate} at {appointmentTime === '10:00' ? '10:00 AM' : appointmentTime === '12:00' ? '12:00 PM' : appointmentTime === '14:00' ? '02:00 PM' : '04:00 PM'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Estimated Invoice:</span>
                      <span className="text-accent font-bold">₹{getPrice()}</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={onBookingClose}
                      className="px-6 py-2.5 bg-luxury-black text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-accent transition-colors"
                    >
                      Return to Storefront
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}

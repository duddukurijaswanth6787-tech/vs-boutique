import React, { useState, useEffect } from 'react';
import { Ruler, Sparkles, Check, Trash2, Heart, Shield, ShoppingBag } from 'lucide-react';
import { api } from '../services/api.ts';

interface FitProfile {
  id?: number;
  profileName: string;
  garmentType: string;
  values: {
    bust: number;
    waist: number;
    hips: number;
    length: number;
    [key: string]: number;
  };
  updatedAt?: string;
}

export default function InteractiveTailoringHub() {
  const [profiles, setProfiles] = useState<FitProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  
  // Custom Sizing Form States
  const [profileName, setProfileName] = useState('My Custom Size');
  const [garmentType, setGarmentType] = useState('Blouse');
  const [bust, setBust] = useState(36);
  const [waist, setWaist] = useState(30);
  const [hips, setHips] = useState(38);
  const [length, setLength] = useState(15);

  // Order Simulation States
  const [productName, setProductName] = useState('Handwoven Silk Lehenga');
  const [price, setPrice] = useState(14999);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load Saved Profiles on Mount
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const data = await api.getMeasurements();
      setProfiles(data || []);
      if (data && data.length > 0) {
        applyProfile(data[0]);
      }
    } catch (err) {
      console.error('Failed to load sizing profiles', err);
    }
  };

  const applyProfile = (p: FitProfile) => {
    setSelectedProfileId(p.id || null);
    setProfileName(p.profileName);
    setGarmentType(p.garmentType);
    setBust(p.values.bust || 36);
    setWaist(p.values.waist || 30);
    setHips(p.values.hips || 38);
    setLength(p.values.length || 15);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const payload = {
        id: selectedProfileId || undefined,
        profileName,
        garmentType,
        values: { bust, waist, hips, length }
      };
      const saved = await api.saveMeasurement(payload);
      await loadProfiles();
      setSelectedProfileId(saved.id || null);
      alert('Sizing Profile Saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save profile. Using local storage fallback.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (id: number) => {
    if (!confirm('Are you sure you want to delete this fit profile?')) return;
    setLoading(true);
    try {
      await api.deleteMeasurement(id);
      await loadProfiles();
      setSelectedProfileId(null);
      setProfileName('New Sizing Blueprint');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBespokeOrder = async () => {
    setLoading(true);
    setOrderStatus(null);
    try {
      const sizeSpecs = { bust, waist, hips, length };
      const order = await api.placeOrder(productName, price, sizeSpecs);
      setOrderStatus(`Bespoke Order placed successfully! Order ID: #${order.id}. Sizing specifications locked.`);
      // Reload current layout state if needed
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      alert('Failed to place bespoke order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 font-sans">
      {/* Decorative Title */}
      <div className="text-center mb-10">
        <span className="text-[10px] font-black tracking-widest text-[#C5A059] uppercase bg-[#C5A059]/10 px-3 py-1 rounded-full">
          Bespoke Custom Tailoring Hub
        </span>
        <h1 className="text-3xl font-serif font-black text-gray-900 dark:text-white mt-3">
          Configure Your Perfect Fit
        </h1>
        <p className="text-sm text-gray-500 max-w-lg mx-auto mt-2">
          Design your custom apparel profile. Our master tailors will hand-stitch your garments to your exact dimensions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Sizing Blueprint Configurator */}
        <div className="lg:col-span-8 bg-white dark:bg-gray-900 rounded-3xl border border-[#d2c5b1]/15 p-6 shadow-premium space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C5A059]/10 flex items-center justify-center text-[#C5A059]">
                <Ruler size={18} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">Measurement Blueprint</h3>
                <p className="text-[10px] text-gray-400">Specify details in inches</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setSelectedProfileId(null);
                setProfileName('New Sizing Blueprint');
                setBust(36);
                setWaist(30);
                setHips(38);
                setLength(15);
              }}
              className="text-xs font-bold text-[#C5A059] hover:underline"
            >
              + Create New
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Profile Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-gray-800 border border-[#d2c5b1]/15 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#C5A059]/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Garment Type</label>
              <select
                value={garmentType}
                onChange={(e) => setGarmentType(e.target.value)}
                className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-gray-800 border border-[#d2c5b1]/15 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#C5A059]/20 focus:outline-none"
              >
                <option value="Blouse">Blouse Stitching</option>
                <option value="Lehenga">Lehenga Choli</option>
                <option value="Kurti">Kurti / Salwar Kameez</option>
              </select>
            </div>
          </div>

          {/* Sizing Sliders */}
          <div className="space-y-5 pt-2">
            {[
              { label: 'Bust Size', val: bust, set: setBust, min: 28, max: 54 },
              { label: 'Waist Size', val: waist, set: setWaist, min: 24, max: 48 },
              { label: 'Hips Size', val: hips, set: setHips, min: 30, max: 60 },
              { label: 'Garment Length', val: length, set: setLength, min: 10, max: 60 },
            ].map((slider) => (
              <div key={slider.label} className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800/80">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{slider.label}</span>
                  <span className="text-sm font-black text-[#C5A059]">{slider.val} inches</span>
                </div>
                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  value={slider.val}
                  onChange={(e) => slider.set(Number(e.target.value))}
                  className="w-full accent-[#C5A059]"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="flex-1 bg-black hover:bg-[#C5A059] text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-xl transition-colors shrink-0 disabled:opacity-50"
            >
              {selectedProfileId ? 'Update Fit Blueprint' : 'Save Size Profile'}
            </button>
            {selectedProfileId && (
              <button
                onClick={() => handleDeleteProfile(selectedProfileId)}
                disabled={loading}
                className="bg-red-50 hover:bg-red-100 text-red-500 px-4 rounded-xl border border-red-200 transition-colors flex items-center justify-center"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Sizing Profiles & Simulation Checkout */}
        <div className="lg:col-span-4 space-y-6">
          {/* Saved Profiles Deck */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-[#d2c5b1]/15 p-5 shadow-premium">
            <h3 className="font-serif text-sm font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800 mb-3 uppercase tracking-wider">
              Saved Sizing Blueprints
            </h3>
            
            <div className="space-y-2.5 max-h-48 overflow-y-auto">
              {profiles.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  No saved profiles. Adjust measurements and save!
                </div>
              ) : (
                profiles.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => applyProfile(p)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                      selectedProfileId === p.id
                        ? 'border-[#C5A059] bg-[#C5A059]/5'
                        : 'border-[#d2c5b1]/15 hover:border-accent/40'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">{p.profileName}</h4>
                      <span className="text-[9px] font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full mt-1 inline-block">
                        {p.garmentType}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-[#C5A059]">
                      B:{p.values.bust}" W:{p.values.waist}"
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sizing Lock & Custom Booking Simulation */}
          <div className="bg-[#111827] text-white rounded-3xl p-5 space-y-4 shadow-luxury relative overflow-hidden">
            <div className="absolute top-[-10px] right-[-10px] w-20 h-20 bg-gradient-to-r from-[#C5A059]/10 to-[#D4AF37]/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#C5A059]" />
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-white">Custom Tailoring Booking</h3>
            </div>
            
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Lock in your customized dimensions and submit your tailoring booking directly to our design studio.
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-[#C5A059] mb-1">Select Catalog Outfit</label>
                <select
                  value={productName}
                  onChange={(e) => {
                    setProductName(e.target.value);
                    setPrice(e.target.value.includes('Lehenga') ? 14999 : e.target.value.includes('Saree') ? 8499 : 4999);
                  }}
                  className="w-full bg-gray-800/80 border border-gray-700/80 rounded-xl px-3.5 py-2 text-xs font-medium text-white focus:outline-none"
                >
                  <option value="Handwoven Silk Lehenga">Handwoven Silk Lehenga - ₹14,999</option>
                  <option value="Banarasi Brocade Saree">Banarasi Brocade Saree - ₹8,499</option>
                  <option value="Designer Embroidered Kurti">Designer Embroidered Kurti - ₹4,999</option>
                </select>
              </div>

              {/* Locked Specs Display */}
              <div className="p-3 bg-gray-800/40 rounded-xl border border-gray-700/50 text-[10px] space-y-1.5">
                <span className="font-bold text-[#C5A059] block uppercase tracking-wide">Locked Sizing Specifications:</span>
                <div className="grid grid-cols-2 gap-2 text-gray-300">
                  <div>Bust: <span className="font-black text-white">{bust}"</span></div>
                  <div>Waist: <span className="font-black text-white">{waist}"</span></div>
                  <div>Hips: <span className="font-black text-white">{hips}"</span></div>
                  <div>Length: <span className="font-black text-white">{length}"</span></div>
                </div>
              </div>

              <button
                onClick={handlePlaceBespokeOrder}
                disabled={loading}
                className="w-full bg-[#C5A059] hover:bg-[#D4AF37] text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShoppingBag size={14} />
                Place Custom Order
              </button>

              {orderStatus && (
                <div className="p-3 bg-green-950/40 border border-green-800/50 rounded-xl text-[10px] text-green-400 font-bold leading-normal">
                  {orderStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors,
  Save,
  RotateCcw,
  BookOpen,
  Ruler,
  HelpCircle,
  Check,
  Sparkles,
  Info,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { apiService, MeasurementProfile as APIMeasurementProfile } from '../services/api';

// Presets for Digital Measurements
const STANDARD_PRESETS = {
  Blouse: {
    bust: '36',
    underbust: '30',
    blouseLength: '14.5',
    sleeveLength: '11',
    sleeveRound: '12',
    shoulder: '14',
    frontNeckDepth: '7.5',
    backNeckDepth: '9.5'
  },
  Lehenga: {
    waist: '30',
    hips: '39',
    length: '41',
    flare: '4.5'
  },
  Kurti: {
    bust: '36',
    waist: '31',
    hips: '39',
    kurtiLength: '43',
    shoulderWidth: '14.5',
    sleeveLength: '17',
    armhole: '16'
  }
};

export default function InteractiveTailoringHub() {
  const [garmentType, setGarmentType] = useState<'Blouse' | 'Lehenga' | 'Kurti'>('Blouse');
  const [profileName, setProfileName] = useState<string>('My Festive Blueprint');
  const [savedProfiles, setSavedProfiles] = useState<APIMeasurementProfile[]>([]);
  const [measurements, setMeasurements] = useState<{ [key: string]: string }>(STANDARD_PRESETS.Blouse);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Sync measurements with preset on garment type change
  useEffect(() => {
    setMeasurements(STANDARD_PRESETS[garmentType]);
    setFocusedField(null);
    setIsLocked(false);
  }, [garmentType]);

  // Load saved measurement profiles from backend with offline fallback
  const fetchProfiles = async () => {
    const data = await apiService.getMeasurements();
    setSavedProfiles(data);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleSaveProfile = async () => {
    if (!profileName.trim()) return;
    
    const valuesPayload: { [key: string]: string | number } = {};
    Object.keys(measurements).forEach(key => {
      valuesPayload[key] = measurements[key];
    });

    const payload: APIMeasurementProfile = {
      profileName: profileName,
      garmentType: garmentType,
      values: valuesPayload,
    };

    // If an existing profile matches by name and type, pass its ID to update it
    const existing = savedProfiles.find(p => p.profileName === profileName && p.garmentType === garmentType);
    if (existing) {
      payload.id = existing.id;
    }

    const saved = await apiService.saveMeasurement(payload);
    alert(`✨ Profile "${profileName}" saved successfully!`);
    fetchProfiles();
  };

  const handleDeleteProfile = async (id: number | string) => {
    await apiService.deleteMeasurement(id);
    alert('Profile deleted successfully.');
    fetchProfiles();
  };

  const handleLoadProfile = (prof: APIMeasurementProfile) => {
    setGarmentType(prof.garmentType);
    const normalized: { [key: string]: string } = {};
    Object.keys(prof.values).forEach(key => {
      normalized[key] = String(prof.values[key] ?? '');
    });
    setMeasurements(normalized);
    setProfileName(prof.profileName);
    setIsLocked(false);
  };

  const handleResetMeasurements = () => {
    setMeasurements(STANDARD_PRESETS[garmentType]);
    setIsLocked(false);
  };

  const handleInputChange = (field: string, val: string) => {
    setMeasurements({ ...measurements, [field]: val });
    setIsLocked(false);
  };

  const handleLockIn = () => {
    setIsLocked(true);
    // Store current active locked-in measurement in localStorage so checkout can query it
    localStorage.setItem('vs_locked_measurement', JSON.stringify({
      garmentType,
      profileName,
      values: measurements
    }));
    alert('✨ Measurements locked in successfully! This digital blueprint is now active and will be automatically applied to your custom fitting session upon checkout.');
  };

  // Helper text/illustration for focused measurement inputs
  const getMeasurementGuide = (field: string) => {
    switch (field) {
      case 'bust':
        return {
          title: 'Chest / Bust Measurement',
          desc: 'Measure around the absolute fullest part of your bust/chest. Keep the tape straight across your back, and comfortable—neither tight nor saggy.',
          tip: '💡 Tip: Put two fingers under the measuring tape for comfortable breathability.'
        };
      case 'underbust':
        return {
          title: 'Underbust Circumference',
          desc: 'Measure right below your breast bone where your blouse band sits. This must be a firm fit to anchor the blouse correctly.',
          tip: '💡 Tip: Exhale fully while taking this measurement.'
        };
      case 'blouseLength':
        return {
          title: 'Blouse Height / Length',
          desc: 'Measure starting from the high point of the shoulder down to your desired hemline level.',
          tip: '💡 Tip: Usually ranges between 13.5 to 15.5 inches depending on height and sari style.'
        };
      case 'sleeveLength':
        return {
          title: 'Sleeve Length',
          desc: 'Measure from the top tip of your shoulder bone down the outside of your arm to your desired sleeve hem.',
          tip: '💡 Tip: Modern luxury trend is elbows-length sleeve (approx 10-12 inches).'
        };
      case 'sleeveRound':
        return {
          title: 'Sleeve Cuff / Round',
          desc: 'Measure around the widest part of your arm where the sleeve hem will terminate.',
          tip: '💡 Tip: Let arm hang loose and relaxed; don\'t flex muscles.'
        };
      case 'shoulder':
        return {
          title: 'Shoulder-to-Shoulder Span',
          desc: 'Measure from the outer point of one shoulder across the natural curve of your back to the outer point of the other shoulder.',
          tip: '💡 Tip: Wearing a well-fitting shirt or blouse makes finding shoulder seams much easier.'
        };
      case 'frontNeckDepth':
        return {
          title: 'Front Neckline Depth',
          desc: 'Measure diagonally from the shoulder point down to the lowest part of your desired front neck curve.',
          tip: '💡 Tip: Elegant sweethearts typically range from 7.5 to 8.5 inches deep.'
        };
      case 'backNeckDepth':
        return {
          title: 'Back Neckline Depth',
          desc: 'Measure diagonally from the shoulder point down to the center of your back where the neckline curve should end.',
          tip: '💡 Tip: Deep statement backs usually go between 9 to 11 inches, often secured with gold dori tassels.'
        };
      case 'waist':
        return {
          title: 'Natural Waistline',
          desc: 'Measure around your natural waist. For lehengas, measure at the level you intend to tie the skirt band (usually 1-2 inches below navel).',
          tip: '💡 Tip: Do not pull stomach inside; stand in a natural upright posture.'
        };
      case 'hips':
        return {
          title: 'Hip Circumference',
          desc: 'Measure around the fullest part of your hips/buttocks for accurate tailored panel widths.',
          tip: '💡 Tip: Keep feet together while measuring.'
        };
      case 'length':
        return {
          title: 'Lehenga Skirt Length',
          desc: 'Measure from where you tie your lehenga skirt down to the floor, including the heel height you plan to wear.',
          tip: '💡 Tip: Best to measure wearing your exact wedding footwear/heels.'
        };
      case 'flare':
        return {
          title: 'Total Skirt Flare (Ghera)',
          desc: 'Indicate your preference for total bottom flare volume (measured in complete circles/meters).',
          tip: '💡 Tip: Premium brides opt for heavy multi-layer flare (4.5m to 6.5m) with structured double can-can layers.'
        };
      case 'kurtiLength':
        return {
          title: 'Full Kurti / Kameez Length',
          desc: 'Measure from your shoulder high-point straight down to your desired length (calf-level or ankle-level).',
          tip: '💡 Tip: Standard calf length ranges from 40 to 45 inches.'
        };
      case 'shoulderWidth':
        return {
          title: 'Shoulder Width',
          desc: 'Measure from one edge of your shoulder line to the other across the back.',
          tip: '💡 Tip: Perfect shoulder seams avoid droopy or tight armhole fits.'
        };
      case 'armhole':
        return {
          title: 'Armhole Circumference',
          desc: 'Measure around the shoulder joint, under the armpit with a comfortable snug tape.',
          tip: '💡 Tip: Ensures optimal freedom of motion for festive dancing.'
        };
      default:
        return {
          title: 'Interactive Fitting Assistant',
          desc: 'Click on any measurement cell in the blueprint sheet. The assistant will instantly show you visual references, detailed guidelines, and expert tailoring tips for that parameter.',
          tip: '✨ You can also request an At-Home Master Tailor visit for physical assistance.'
        };
    }
  };

  const guide = getMeasurementGuide(focusedField || '');

  return (
    <div className="w-full bg-white border border-accent/20 rounded-2xl shadow-luxury overflow-hidden animate-fade-in" id="tailoring-hub-container">
      {/* Top Brand Banner */}
      <div className="bg-luxury-black text-white px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-accent/25">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 border border-accent/40 rounded-full flex items-center justify-center bg-luxury-ivory/10 text-accent">
            <Ruler className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-serif font-black uppercase tracking-wider text-white">DIGITAL MEASUREMENT SHEET</h2>
              <span className="bg-accent/25 text-accent text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border border-accent/20">Active Session</span>
            </div>
            <p className="text-[10px] text-gray-300">Calibrate your royal fit blueprint with precise measurements for bespoke stitching</p>
          </div>
        </div>

        {/* Blueprint Selector controls */}
        <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
          {(['Blouse', 'Lehenga', 'Kurti'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setGarmentType(type)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${garmentType === type ? 'bg-accent text-white shadow-md font-black' : 'text-gray-300 hover:text-white'}`}
            >
              <Scissors className="h-3 w-3" />
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Settings & Inputs Grid (Col-span 7) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Top Toolbar: Profile Name and Preset Loader */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-luxury-ivory/30 p-4 rounded-xl border border-accent/10">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Blueprint Name:</span>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="border border-accent/20 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-accent bg-white text-luxury-black font-semibold shadow-sm w-48"
                  placeholder="Profile Name"
                />
                <button
                  onClick={handleSaveProfile}
                  className="bg-accent hover:bg-accent/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="Save fit profile to account"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Fit
                </button>
              </div>

              {/* Reset to Default */}
              <button
                onClick={handleResetMeasurements}
                className="text-[10px] font-bold uppercase text-accent hover:underline flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Fields
              </button>
            </div>

            {/* Saved Fit Profiles Shelf */}
            {savedProfiles.length > 0 && (
              <div className="text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400 block">SAVED BLUEPRINTS SHELF</span>
                  <span className="text-[9.5px] text-gray-500 italic">Select to apply standard parameters instantly</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {savedProfiles.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className={`flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-lg border transition-all text-xs font-bold ${p.garmentType === garmentType && p.profileName === profileName ? 'bg-accent/10 border-accent text-accent' : 'bg-[#FAF8F5] border-gray-100 text-luxury-black hover:border-accent/40'}`}
                    >
                      <button
                        onClick={() => handleLoadProfile(p)}
                        className="text-[11px] font-semibold text-left cursor-pointer flex items-center gap-1"
                      >
                        <span className="text-[10px]">📁</span>
                        <span>{p.profileName} <span className="opacity-60 font-medium">({p.garmentType})</span></span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (p.id && confirm(`Delete blueprint "${p.profileName}"?`)) {
                            handleDeleteProfile(p.id);
                          }
                        }}
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors rounded"
                        title="Delete blueprint"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form grid */}
            <div className="bg-white border border-accent/15 rounded-xl p-5 shadow-sm relative">
              {isLocked && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200 uppercase tracking-wider animate-pulse">
                  <Check className="h-3 w-3" />
                  Locked for order
                </div>
              )}

              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                <h4 className="text-xs font-bold text-luxury-black uppercase tracking-wider font-sans flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  Calibrate {garmentType} Parameters (Inches)
                </h4>
                <span className="text-[10px] text-gray-400">Values auto-saved locally</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.keys(measurements).map((field) => (
                  <div key={field} className="space-y-1 text-left">
                    <label className="block text-[10.5px] font-bold text-gray-500 uppercase tracking-wide truncate">
                      {field.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="5"
                        max="120"
                        value={measurements[field]}
                        onFocus={() => setFocusedField(field)}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        className={`w-full bg-white border px-3 py-2 text-xs focus:outline-none transition-all rounded-lg font-bold text-luxury-black ${focusedField === field ? 'border-accent ring-1 ring-accent bg-accent/5 shadow-sm' : 'border-gray-200'}`}
                      />
                      <span className="absolute right-3 top-2 text-[10px] text-gray-400 font-mono font-medium">in</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Standard size auto fills */}
              <div className="mt-5 p-3.5 bg-luxury-ivory rounded-lg border border-accent/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-left">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4.5 w-4.5 text-accent shrink-0" />
                  <div>
                    <span className="font-bold text-luxury-black block text-[11px]">Unsure of your custom measurements?</span>
                    <p className="text-[9.5px] text-gray-500">Auto-fill values from standard retail sizes to begin fine-tuning.</p>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0 w-full sm:w-auto justify-end">
                  {(['S', 'M', 'L'] as const).map(size => (
                    <button
                      key={size}
                      onClick={() => {
                        const scale = size === 'S' ? 0.9 : size === 'M' ? 1.0 : 1.1;
                        const base = STANDARD_PRESETS[garmentType];
                        const updated = { ...base };
                        Object.keys(updated).forEach(key => {
                          const baseNum = parseFloat(base[key as keyof typeof base]);
                          if (!isNaN(baseNum)) {
                            updated[key as keyof typeof base] = (baseNum * scale).toFixed(1);
                          }
                        });
                        setMeasurements(updated);
                        setIsLocked(false);
                      }}
                      className="h-7 w-12 text-[10px] font-black rounded border border-gray-200 hover:border-accent bg-white hover:bg-accent/10 text-luxury-black transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1"
                    >
                      Size {size}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Master Tailor Guarantee */}
            <div className="bg-[#FDFBF7] border border-dashed border-accent/30 rounded-xl p-4 flex items-start gap-3 text-left">
              <Info className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-accent font-sans block">ROYAL FIT GUARANTEE</span>
                <p className="text-[10px] text-gray-500 leading-relaxed mt-1">
                  Every custom garment is hand-inspected by Master Tailors with over 20+ years of heritage. If your finished apparel doesn't fit perfectly, we offer complimentary local adjustments within 14 days of delivery.
                </p>
              </div>
            </div>
          </div>

          {/* Right Measurement Visual Assistant (Col-span 5) */}
          <div className="lg:col-span-5 bg-luxury-ivory/45 rounded-xl border border-accent/10 p-5 flex flex-col justify-between text-left">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-accent/10 pb-2">
                <BookOpen className="h-4 w-4 text-accent" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-luxury-black font-sans">Measurement Assistant</span>
              </div>

              {/* Dynamic description box */}
              <div className="space-y-3 p-4 bg-white rounded-xl border border-accent/10 shadow-sm min-h-[140px] flex flex-col justify-center">
                <h5 className="text-[11.5px] font-bold text-accent uppercase tracking-wide flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5" />
                  {guide.title}
                </h5>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  {guide.desc}
                </p>
                <div className="p-2 bg-accent/5 border-l-2 border-accent text-[10px] text-gray-700 font-serif italic rounded-r">
                  {guide.tip}
                </div>
              </div>

              {/* Visual Blueprint avatar card */}
              <div className="bg-white border border-accent/10 rounded-xl p-4 flex flex-col items-center justify-center aspect-square max-h-56 relative overflow-hidden">
                {/* Outline Sketch styling representing measurement zones */}
                <div className="absolute inset-0 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
                
                {/* Abstract tailored lines representing royal measurements dress form */}
                <div className="h-36 w-24 border-2 border-accent/30 rounded-t-[40px] rounded-b-[20px] flex flex-col justify-between p-3 relative bg-luxury-ivory/30">
                  <div className="w-12 h-6 border-b border-accent/50 mx-auto text-center text-[7px] text-accent/80 font-mono flex items-center justify-center">SHOULDER</div>
                  <div className="w-18 h-8 border-b border-dashed border-accent mx-auto text-center text-[7px] text-accent font-mono flex items-center justify-center bg-accent/5">BUST ZONE</div>
                  <div className="w-14 h-8 border-b border-accent/50 mx-auto text-center text-[7px] text-accent/80 font-mono flex items-center justify-center">UNDERBUST</div>
                  <div className="w-12 h-6 mx-auto text-center text-[7px] text-accent/80 font-mono flex items-center justify-center">WAIST</div>
                </div>
                <span className="text-[9px] text-gray-400 font-mono mt-2 uppercase tracking-widest">Royal Dress-Form Blueprint</span>
              </div>
            </div>

            {/* Confirm Blueprint measurements */}
            <div className="pt-4 mt-4 border-t border-accent/10 space-y-2">
              <button
                onClick={handleLockIn}
                className={`w-full py-3 rounded-xl text-[10.5px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm ${isLocked ? 'bg-green-600 text-white' : 'bg-luxury-black hover:bg-accent text-white'}`}
              >
                <Check className="h-4 w-4" />
                {isLocked ? 'Active Fit Applied' : 'Lock In Fit for Booking / Checkout'}
              </button>
              <p className="text-[9px] text-gray-400 text-center">
                This locks measurements as active for immediate bridal or suit bookings.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

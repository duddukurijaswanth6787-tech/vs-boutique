import React from 'react';
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Star,
  Users,
  Shirt,
  ShieldCheck,
  ChevronRight,
  Phone,
  Calendar,
  Home,
  ShoppingBag,
  User,
  Plus
} from 'lucide-react';

const ICON_MAP = {
  'Bridal Wear': '👑',
  'Custom Blouse': '👚',
  'Lehengas': '✨',
  'Sarees': '🥻',
  'Gowns': '👗',
  'Kids Wear': '👶',
  'Anarkalis': '🌸',
  'Suits': '👔',
  'Pattu Langa Stitching': '🪡',
  'Birthday Frocks': '🎂',
  'New Born Sets': '🍼',
  "Boy's Dhoti Sets": '👦',
  'Salwar Kameez': '👗'
};

const httpsImage = (...candidates) =>
  candidates.find((u) => typeof u === 'string' && /^https?:\/\//i.test(u)) || null;

const AppPreviewMockup = ({ boutique, specialties = [], designs = [] }) => {
  const primary = '#8b0000';
  const bg = '#f7f4f1';
  const tags = specialties.length > 0 ? specialties : (boutique?.workTypeSpecialty || []);

  const location = [boutique?.area, boutique?.city, boutique?.state].filter(Boolean).join(', ') || 'Somajiguda, Hyderabad, Telangana';
  const fullAddress = boutique?.fullAddress || 'Somajiguda Main Road.';
  const logoSource = httpsImage(
    boutique?.media?.logo,
    boutique?.logo,
    boutique?.logoUrl,
    boutique?.media?.coverImage,
    boutique?.coverImage,
    boutique?.coverImageUrl
  );

  const designThumb = (d) => httpsImage(d?.images?.[0], d?.image, d?.imageUrl);

  return (
    <div className="relative mx-auto border-gray-800 bg-gray-800 border-[7px] rounded-[2.5rem] h-[640px] w-[320px] shadow-2xl overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-gray-800 rounded-b-3xl z-50" />

      <div className="h-full overflow-y-auto scrollbar-hide relative" style={{ backgroundColor: bg, paddingBottom: 120 }}>
        <div className="absolute top-11 left-4 right-4 z-40 flex items-center justify-between">
          <div className="w-8 h-8 rounded-full bg-white/95 shadow-sm flex items-center justify-center">
            <ArrowLeft size={15} className="text-gray-900" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/95 shadow-sm flex items-center justify-center">
              <Heart size={15} className="text-gray-900" />
            </div>
            <div className="w-8 h-8 rounded-full bg-white/95 shadow-sm flex items-center justify-center">
              <Share2 size={15} className="text-gray-900" />
            </div>
          </div>
        </div>

        <div className="h-[82px] w-full bg-[#f2efeb] border-b border-[#e8e3dc]">
        </div>

        <div className="px-4 pt-2 relative z-20">
          <div className="bg-[#f7f4f1] px-0 pt-0">
            <div className="flex gap-3 items-start">
              {logoSource ? (
                <img 
                  src={logoSource} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/108x108/8B0000/FFFFFF?text=Logo';
                  }}
                  alt="logo" 
                  className="w-[108px] h-[108px] rounded-2xl object-cover shrink-0" 
                />
              ) : (
                <div className="w-[108px] h-[108px] rounded-2xl shrink-0 bg-[#ebe6df] border border-[#e0dbd4] flex items-center justify-center text-[10px] font-black text-gray-400 text-center px-2 uppercase tracking-widest">
                  No image
                </div>
              )}
              <div className="min-w-0 pt-1 pr-1">
                <h1 className="text-[15px] leading-[1.05] font-black tracking-tight text-[#8b0000]">
                  {boutique?.name || 'Tiny Tucks'}
                </h1>

                <div className="mt-1 flex items-center text-[11px] font-bold text-gray-600">
                  <Star size={11} fill="#f59e0b" className="text-[#f59e0b] mr-1" />
                  <span className="text-gray-900">0</span>
                  <span className="text-gray-500 ml-1">(126 Reviews)</span>
                  <span className="mx-1.5 text-gray-300">|</span>
                  <span className="text-[#8b0000]">{boutique?.experienceYears || '4+ Years'}</span>
                </div>

                <div className="mt-1.5 flex items-start text-[11px] text-gray-700">
                  <MapPin size={11} className="text-[#8b0000] mr-1 mt-[1px] shrink-0" />
                  <span className="truncate">{location}</span>
                </div>

                <p className="text-[11px] text-gray-600 mt-0.5 leading-snug line-clamp-2">{fullAddress}</p>
              </div>
            </div>

            <div className="mt-2.5 pb-2 flex gap-2 border-b border-[#e8e3dc]">
              {[
                { icon: <Users size={12} className="text-[#8b0000]" />, value: boutique?.happyClients || '0', label: 'Happy Clients' },
                { icon: <Shirt size={12} className="text-[#8b0000]" />, value: boutique?.totalDesigns || '0', label: 'Designs' },
                { icon: <Star size={12} fill="#f59e0b" className="text-[#f59e0b]" />, value: '4.8', label: 'Rating' }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex-1 rounded-xl border border-[#e7e2db] bg-[#fbfbfb] py-2 px-1 text-center shadow-sm"
                >
                  <div className="flex justify-center">{item.icon}</div>
                  <div className="text-[12px] leading-none mt-1 font-black text-gray-900">{item.value}</div>
                  <div className="text-[9px] leading-none mt-1 font-semibold text-gray-400">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-0 px-5 bg-[#f1efec] border-b border-[#e6e2dc] flex gap-6 overflow-x-hidden">
          {['About', 'Designs', 'Tailors', 'Reviews', 'Photos'].map((tab, idx) => (
            <div
              key={tab}
              className={`py-2 text-[13px] font-bold whitespace-nowrap ${
                idx === 0 ? 'text-[#8b0000] border-b-2 border-[#8b0000]' : 'text-gray-400'
              }`}
            >
              {tab}
            </div>
          ))}
        </div>

        <div className="px-5 pt-5">
          <h2 className="text-[13px] leading-none font-black text-gray-900">Our Specialties</h2>
          <div className="mt-3 flex gap-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {(tags.length > 0 ? tags : ['Custom Blouse', 'Soft Cotton Lining']).slice(0, 4).map((tag, idx) => (
              <div key={idx} className="w-[72px] shrink-0 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#fff1f3] border border-[#f2d8df] flex items-center justify-center text-2xl">
                  {ICON_MAP[tag] || '🏷️'}
                </div>
                <div className="mt-2 text-[10px] font-bold text-gray-600 leading-tight line-clamp-2">{tag}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 pt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] leading-none font-black text-gray-900">Popular Designs</h2>
            <div className="text-[11px] font-black uppercase tracking-wide text-[#8b0000] flex items-center">
              View All <ChevronRight size={12} />
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {designs && designs.length > 0 ? (
              designs.map((d, idx) => {
                const thumb = designThumb(d);
                return (
                  <div key={idx} className="w-[124px] h-[145px] rounded-2xl overflow-hidden bg-white border border-[#ebe6df] shrink-0">
                    {thumb ? (
                      <img 
                        src={thumb} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/200x250/8B0000/FFFFFF?text=' + encodeURIComponent(d.name || 'Design');
                        }}
                        alt={d.name || d.title || 'Design'} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-[#f2efeb] flex items-center justify-center text-[9px] font-black text-gray-400 uppercase tracking-widest text-center px-1">
                        Design
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="w-[124px] h-[145px] rounded-2xl border border-[#ebe6df] bg-[#f2efeb] shrink-0 flex items-center justify-center text-[9px] font-black text-gray-400 uppercase tracking-widest">
                No designs
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute left-0 right-0 bottom-[62px] bg-white border-t border-gray-200 px-3 py-3 z-50 flex gap-3">
        <button type="button" className="flex-1 h-11 rounded-2xl border-2 border-[#8b0000] text-[#8b0000] font-black text-[10px] leading-none tracking-wide flex items-center justify-center gap-2">
          <Phone size={14} /> Call Now
        </button>
        <button type="button" className="flex-[1.45] h-11 rounded-2xl bg-[#8b0000] text-white font-black text-[10px] leading-none tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-[#8b0000]/25">
          <Calendar size={14} /> Book Appointment
        </button>
      </div>

      <div className="absolute left-0 right-0 bottom-0 h-[62px] rounded-b-[2rem] bg-[#f9f9f9] border-t border-gray-200 z-50 flex items-start justify-around pt-2">
        <div className="flex flex-col items-center text-[#8b0000]">
          <Home size={16} />
          <span className="text-[10px] mt-1 font-bold">Home</span>
        </div>
        <div className="flex flex-col items-center text-gray-400">
          <Calendar size={16} />
          <span className="text-[10px] mt-1">Bookings</span>
        </div>
        <div className="w-14" />
        <div className="flex flex-col items-center text-gray-400">
          <ShoppingBag size={16} />
          <span className="text-[10px] mt-1">Orders</span>
        </div>
        <div className="flex flex-col items-center text-gray-400">
          <User size={16} />
          <span className="text-[10px] mt-1">Profile</span>
        </div>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 bottom-[35px] z-[60] w-14 h-14 rounded-full bg-[#8b0000] text-white shadow-xl flex items-center justify-center">
        <Plus size={24} />
      </div>
    </div>
  );
};

export default AppPreviewMockup;

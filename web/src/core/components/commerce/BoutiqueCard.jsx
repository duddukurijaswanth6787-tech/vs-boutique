import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Award, Scissors } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import PremiumImage from '../ui/PremiumImage';
import { IMAGES } from '../../services';

export default function BoutiqueCard({ boutique }) {
  const navigate = useNavigate();
  
  const coverImage = boutique.coverImageUrl || IMAGES.boutiques.interior;
  const logoImage = boutique.logoUrl || IMAGES.placeholder;
  const rating = Number(boutique.rating || 0).toFixed(1);
  const startPrice = Number(boutique.startingPrice || 0);

  return (
    <Card
      onClick={() => navigate(`/boutique/${boutique.id}`)}
      className="flex flex-col relative h-full select-none cursor-pointer rounded-[20px] border border-gray-100 dark:border-gray-800 hover:border-[#C5A059]/40 hover:shadow-hover transition-all duration-300 bg-white dark:bg-gray-900 overflow-hidden"
    >
      {/* Cover Banner */}
      <div className="relative w-full overflow-hidden bg-gray-50">
        <PremiumImage
          src={coverImage}
          alt={boutique.name}
          productName="boutique interior showroom"
          aspectRatio="aspect-[16/10]"
          className="group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Profile & Info Section */}
      <div className="p-5 pt-0 flex-1 flex flex-col relative">
        {/* Floating Logo */}
        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 border border-[#d2c5b1]/15 p-1 absolute -top-7 left-5 shadow-md overflow-hidden shrink-0 flex items-center justify-center z-20">
          <PremiumImage
            src={logoImage}
            alt=""
            productName="boutique logo brand"
            aspectRatio="aspect-square"
            className="rounded-xl w-full h-full object-cover"
          />
        </div>

        <div className="mt-9 space-y-3 flex-1 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-1.5">
              <h4 className="text-sm font-serif font-black text-[#1F2937] dark:text-white group-hover:text-accent transition-colors line-clamp-1 flex-1 flex items-center gap-1">
                <span>{boutique.name}</span>
                {boutique.verified && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#C5A059] text-white text-[8px] font-bold shadow-sm shrink-0" title="Verified Studio">✓</span>
                )}
              </h4>
              {boutique.rating > 0 && (
                <div className="flex items-center space-x-0.5 text-accent font-black text-[10px] bg-accent/10 px-1.5 py-0.5 rounded-md shrink-0">
                  <Star size={8} className="fill-current text-[#C5A059]" />
                  <span>{rating}</span>
                </div>
              )}
            </div>

            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider flex items-center">
              <MapPin size={9} className="text-accent mr-1 shrink-0" />
              <span className="truncate">{boutique.area ? `${boutique.area}, ` : ''}{boutique.city || 'Hyderabad'}</span>
            </p>
          </div>

          {/* Specialties / Offered Services */}
          {boutique.servicesOffered?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {boutique.servicesOffered.slice(0, 3).map((srv, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[9px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1"
                >
                  <Scissors size={8} />
                  {srv}
                </span>
              ))}
            </div>
          )}

          {/* Pricing & Footer details */}
          <div className="border-t border-gray-50 pt-3 mt-4 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Starting from</span>
              <span className="text-sm font-black text-gray-900">₹{startPrice}</span>
            </div>
            {boutique.experienceYears > 0 && (
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider bg-accent/5 px-2.5 py-1 rounded-xl">
                {boutique.experienceYears} Years Exp
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

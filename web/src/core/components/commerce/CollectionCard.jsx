import { ArrowRight } from 'lucide-react';
import Card from '../ui/Card';
import PremiumImage from '../ui/PremiumImage';

export default function CollectionCard({
  name,
  itemsCount,
  image,
  onClick,
  className = '',
  ...props
}) {
  return (
    <Card
      onClick={onClick}
      className={`group relative h-64 overflow-hidden select-none cursor-pointer flex flex-col justify-end p-6 ${className}`}
      {...props}
    >
      <PremiumImage
        src={image}
        alt={name}
        productName={name}
        category={name}
        aspectRatio="absolute inset-0"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />

      <div className="relative z-20 space-y-1.5 text-white">
        {itemsCount && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-accent-light block">
            {itemsCount}
          </span>
        )}
        <h4 className="text-lg font-serif font-black tracking-wide leading-tight">
          {name}
        </h4>
        <div className="flex items-center gap-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-white/80 group-hover:text-white transition-colors">
          <span>Explore Lookbook</span>
          <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Card>
  );
}

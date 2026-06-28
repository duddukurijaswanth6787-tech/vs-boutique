import { ArrowRight } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PremiumImage from '../ui/PremiumImage';
import { resolveServiceImage } from '../../services';

export default function ServiceCard({
  title,
  description,
  price,
  duration,
  onBook,
  image,
  className = '',
  ...props
}) {
  const serviceImg = image || resolveServiceImage(title);

  return (
    <Card className={`flex flex-col h-full overflow-hidden p-0 bg-white ${className}`} {...props}>
      <div className="relative w-full overflow-hidden bg-gray-50">
        <PremiumImage
          src={serviceImg}
          alt={title}
          aspectRatio="aspect-[16/10]"
          className="hover:scale-105 transition-transform duration-500"
        />
        {duration && (
          <span className="absolute top-3.5 right-3.5 text-[9px] font-bold text-gray-800 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl shadow-sm uppercase tracking-wider">
            {duration}
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h4 className="text-base font-serif font-black text-gray-900 leading-tight">
            {title}
          </h4>
          <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1.5 line-clamp-2">
            {description}
          </p>
        </div>

        <div className="pt-3 border-t border-gray-50 flex items-center justify-between gap-4">
          <div>
            {price && (
              <>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Service fee</span>
                <span className="text-sm font-black text-gray-900">{price}</span>
              </>
            )}
          </div>
          {onBook && (
            <Button variant="luxury" size="sm" onClick={onBook} className="flex items-center gap-1.5">
              <span>Book</span>
              <ArrowRight size={12} />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

import { Star } from 'lucide-react';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import PremiumImage from '../ui/PremiumImage';
import { IMAGES } from '../../services';

export default function ReviewCard({
  review,
  className = '',
  ...props
}) {
  const rating = Number(review?.rating || 5);
  const customerName = review?.customerName || review?.user?.name || 'Customer';
  const comment = review?.comment || '';
  const dateStr = review?.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : '';

  const getReviewImages = (name) => {
    let hash = 0;
    if (name) {
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    const idx = Math.abs(hash);
    const profile = IMAGES.reviews.profiles[idx % IMAGES.reviews.profiles.length];
    const outfit = IMAGES.reviews.outfits[idx % IMAGES.reviews.outfits.length];
    return { profile, outfit };
  };

  const { profile: avatarSrc, outfit: outfitSrc } = getReviewImages(customerName);

  return (
    <Card className={`p-6 flex flex-col space-y-4 ${className}`} {...props}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar name={customerName} src={avatarSrc} size="md" />
          <div>
            <h5 className="text-sm font-semibold text-gray-900">{customerName}</h5>
            {dateStr && <p className="text-[10px] text-gray-400 font-medium">{dateStr}</p>}
          </div>
        </div>
        
        <div className="flex items-center space-x-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={12}
              className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {review?.productName && (
          <span className="text-[9px] font-bold uppercase tracking-wider bg-accent/5 text-accent px-2 py-0.5 rounded">
            Product: {review.productName}
          </span>
        )}
        <p className="text-sm text-gray-600 leading-relaxed font-medium">
          {comment}
        </p>

        {/* Real outfit photography */}
        {outfitSrc && (
          <div className="w-40 rounded-2xl overflow-hidden border border-gray-100 shadow-sm mt-2">
            <PremiumImage
              src={outfitSrc}
              alt={`${customerName}'s outfit`}
              productName="reviewed outfit"
              aspectRatio="aspect-square"
              className="hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
      </div>
    </Card>
  );
}

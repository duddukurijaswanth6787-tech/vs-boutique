import { Star } from 'lucide-react';

export default function RatingComponent({
  rating = 0,
  reviewsCount,
  showLabel = true,
  size = 'md', // 'sm' | 'md'
  className = '',
  ...props
}) {
  const roundedRating = Number(rating || 0).toFixed(1);
  const iconSize = size === 'sm' ? 10 : 12;
  const padding = size === 'sm' ? 'px-1.5 py-0.5 rounded-md' : 'px-2 py-1 rounded-lg';

  if (rating <= 0) {
    return (
      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
        No reviews
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center space-x-1 font-bold text-xs ${className}`}
      {...props}
    >
      <div className={`flex items-center space-x-0.5 text-accent bg-accent/5 ${padding}`}>
        <Star size={iconSize} className="fill-current" />
        <span>{roundedRating}</span>
      </div>
      {showLabel && reviewsCount !== undefined && (
        <span className="text-gray-400 font-medium text-[11px]">({reviewsCount})</span>
      )}
    </div>
  );
}

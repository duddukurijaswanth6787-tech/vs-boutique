import Badge from '../ui/Badge';

export default function DiscountBadge({
  price,
  originalPrice,
  discountPercentage,
  className = '',
  ...props
}) {
  let percent = 0;

  if (discountPercentage) {
    percent = Math.round(discountPercentage);
  } else if (price && originalPrice) {
    const p = Number(price);
    const op = Number(originalPrice);
    if (op > p) {
      percent = Math.round(((op - p) / op) * 100);
    }
  }

  if (percent <= 0) return null;

  return (
    <Badge
      variant="accent"
      size="sm"
      className={`font-black tracking-wider uppercase bg-accent text-white border-none ${className}`}
      {...props}
    >
      {percent}% OFF
    </Badge>
  );
}

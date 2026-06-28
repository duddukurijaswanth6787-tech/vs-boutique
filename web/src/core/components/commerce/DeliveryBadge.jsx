import { Truck } from 'lucide-react';
import Badge from '../ui/Badge';

export default function DeliveryBadge({
  freeDelivery = false,
  estimatedDays,
  className = '',
  ...props
}) {
  return (
    <Badge
      variant="ghost"
      size="sm"
      className={`font-semibold uppercase tracking-wider flex items-center gap-1 bg-gray-50 border border-gray-100 ${className}`}
      {...props}
    >
      <Truck size={10} className="text-accent shrink-0" />
      <span>
        {freeDelivery ? 'Free Delivery' : estimatedDays ? `Delivery in ${estimatedDays} Days` : 'Standard Delivery'}
      </span>
    </Badge>
  );
}

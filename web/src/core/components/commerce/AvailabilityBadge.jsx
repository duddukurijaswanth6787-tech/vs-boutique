import Badge from '../ui/Badge';

export default function AvailabilityBadge({
  status = 'in_stock', // 'in_stock' | 'out_of_stock' | 'low_stock'
  className = '',
  ...props
}) {
  const configs = {
    in_stock: { label: 'In Stock', variant: 'success' },
    out_of_stock: { label: 'Out of Stock', variant: 'danger' },
    low_stock: { label: 'Only Few Left', variant: 'accent' },
  };

  const current = configs[status] || configs.in_stock;

  return (
    <Badge
      variant={current.variant}
      size="sm"
      className={`font-semibold uppercase tracking-wider ${className}`}
      {...props}
    >
      {current.label}
    </Badge>
  );
}

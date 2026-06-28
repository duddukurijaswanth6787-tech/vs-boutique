import Badge from '../ui/Badge';

export default function StatusBadge({
  status = '',
  className = '',
  ...props
}) {
  const normStatus = status.toLowerCase().replace(/_/g, ' ');

  const getVariant = () => {
    switch (normStatus) {
      case 'completed':
      case 'active':
      case 'delivered':
      case 'accepted':
      case 'verified':
      case 'captured':
      case 'in stock':
        return 'success';
      case 'pending':
      case 'in progress':
      case 'rescheduled':
      case 'low stock':
      case 'scheduled':
        return 'accent';
      case 'cancelled':
      case 'rejected':
      case 'failed':
      case 'out of stock':
      case 'blocked':
      case 'expired':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <Badge
      variant={getVariant()}
      size="sm"
      className={className}
      {...props}
    >
      {normStatus}
    </Badge>
  );
}

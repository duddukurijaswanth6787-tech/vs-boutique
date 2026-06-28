import Card from '../ui/Card';
import StatusBadge from './StatusBadge';
import Timeline from '../ui/Timeline';

export default function TimelineCard({
  orderId,
  boutiqueName,
  status,
  expectedDelivery,
  timelineSteps = [],
  activeStep = 0,
  className = '',
  ...props
}) {
  return (
    <Card className={`p-5 space-y-4 ${className}`} {...props}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Order ID</span>
          <span className="text-sm font-black text-gray-900">{orderId}</span>
          {boutiqueName && (
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider block mt-0.5">{boutiqueName}</span>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="border-t border-gray-50 pt-4">
        <Timeline steps={timelineSteps} activeStep={activeStep} />
      </div>

      {expectedDelivery && (
        <div className="border-t border-gray-50 pt-3 flex items-center justify-between text-xs font-semibold text-gray-500">
          <span>Expected Delivery</span>
          <span className="text-gray-900 font-bold uppercase tracking-wider">{expectedDelivery}</span>
        </div>
      )}
    </Card>
  );
}

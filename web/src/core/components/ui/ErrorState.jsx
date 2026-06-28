import { AlertCircle } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while loading this section. Please try again.',
  actionLabel = 'Try Again',
  onAction,
  className = '',
  ...props
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto my-8 border border-red-100 bg-red-50/20 rounded-3xl ${className}`}
      {...props}
    >
      <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-3 text-red-500">
        <AlertCircle size={22} />
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-400 font-medium leading-relaxed mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

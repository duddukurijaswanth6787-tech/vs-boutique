import Button from './Button';

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto my-12 ${className}`}
      {...props}
    >
      {Icon && (
        <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4 text-gray-400">
          <Icon size={28} />
        </div>
      )}
      <h3 className="text-base font-serif font-black text-gray-900 mb-1.5">{title}</h3>
      <p className="text-xs text-gray-400 font-medium leading-relaxed mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

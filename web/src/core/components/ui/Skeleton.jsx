
export default function Skeleton({
  variant = 'text',
  width = '100%',
  height,
  className = '',
  ...props
}) {
  const getStyles = () => {
    const styles = { width };
    if (height) styles.height = height;
    return styles;
  };

  const baseStyles = 'bg-gray-100 animate-pulse';
  
  const variants = {
    text: 'h-4 rounded-md',
    rect: 'rounded-2xl',
    circle: 'rounded-full aspect-square'
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={getStyles()}
      {...props}
    />
  );
}

export function TableSkeleton({ rows = 5, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-4 w-1/4 rounded bg-gray-100 animate-pulse" />
          <div className="h-4 w-1/3 rounded bg-gray-100 animate-pulse" />
          <div className="h-4 w-1/5 rounded bg-gray-100 animate-pulse" />
          <div className="h-4 w-1/6 rounded bg-gray-100 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

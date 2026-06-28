
export default function Badge({
  children,
  variant = 'neutral', // 'neutral' | 'primary' | 'accent' | 'success' | 'danger'
  size = 'md', // 'sm' | 'md'
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-sans font-bold uppercase tracking-wider rounded-full select-none';
  
  const variants = {
    neutral: 'bg-gray-100 text-gray-600',
    primary: 'bg-primary/5 text-primary border border-primary/10',
    accent: 'bg-accent/10 text-accent border border-accent/20',
    success: 'bg-green-500/10 text-green-700 border border-green-500/10',
    danger: 'bg-red-500/10 text-red-700 border border-red-500/10'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[9px]',
    md: 'px-3 py-1.5 text-[10px]'
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </span>
  );
}

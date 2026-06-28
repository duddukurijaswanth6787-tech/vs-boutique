
export default function Avatar({
  src,
  name,
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  ...props
}) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg'
  };

  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div
      className={`rounded-full shrink-0 flex items-center justify-center overflow-hidden bg-[#faf9f5] border border-[#d2c5b1]/15 text-primary font-bold ${sizes[size]} ${className}`}
      {...props}
    >
      {src ? (
        <img src={src} alt={name || 'User Avatar'} className="w-full h-full object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}

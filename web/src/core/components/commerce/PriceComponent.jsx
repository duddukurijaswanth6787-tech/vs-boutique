
export default function PriceComponent({
  price,
  originalPrice,
  currency = '₹',
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  ...props
}) {
  const numericPrice = Number(price || 0);
  const numericOriginalPrice = Number(originalPrice || 0);
  const hasDiscount = numericOriginalPrice > numericPrice;

  const sizeClasses = {
    sm: {
      price: 'text-xs font-black text-gray-900',
      original: 'text-[10px] text-gray-400 line-through font-medium'
    },
    md: {
      price: 'text-sm md:text-base font-black text-gray-900',
      original: 'text-xs text-gray-400 line-through font-medium'
    },
    lg: {
      price: 'text-lg md:text-xl font-black text-gray-900',
      original: 'text-sm text-gray-400 line-through font-medium'
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`} {...props}>
      <span className={sizeClasses[size].price}>
        {currency}
        {numericPrice.toLocaleString('en-IN')}
      </span>
      {hasDiscount && (
        <span className={sizeClasses[size].original}>
          {currency}
          {numericOriginalPrice.toLocaleString('en-IN')}
        </span>
      )}
    </div>
  );
}

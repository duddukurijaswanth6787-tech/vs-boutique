
export default function Stack({
  children,
  className = '',
  direction = 'col', // 'row' | 'col'
  spacing = 'md', // 'xs' | 'sm' | 'md' | 'lg'
  align = 'stretch', // 'start' | 'center' | 'end' | 'stretch'
  justify = 'start', // 'start' | 'center' | 'end' | 'between'
  ...props
}) {
  const directions = {
    row: 'flex-row',
    col: 'flex-col'
  };

    // Overrides for pure horizontal or pure vertical
  const computedSpacing = direction === 'col' 
    ? {
        xs: 'space-y-1.5',
        sm: 'space-y-3',
        md: 'space-y-4',
        lg: 'space-y-6'
      }[spacing]
    : {
        xs: 'space-x-1.5',
        sm: 'space-x-3',
        md: 'space-x-4',
        lg: 'space-x-6'
      }[spacing];

  const alignments = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const justifications = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between'
  };

  return (
    <div
      className={`flex ${directions[direction]} ${computedSpacing} ${alignments[align]} ${justifications[justify]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

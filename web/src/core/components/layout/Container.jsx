
export default function Container({
  children,
  className = '',
  clean = false,
  ...props
}) {
  return (
    <div
      className={`${clean ? '' : 'max-w-[1400px] mx-auto px-4 md:px-6'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}


export default function Section({
  children,
  className = '',
  size = 'md', // 'sm' | 'md' | 'lg'
  ...props
}) {
  const paddings = {
    sm: 'py-6 md:py-8',
    md: 'py-10 md:py-16',
    lg: 'py-16 md:py-24'
  };

  return (
    <section className={`${paddings[size]} ${className}`} {...props}>
      {children}
    </section>
  );
}

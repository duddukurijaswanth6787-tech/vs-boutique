
export default function Input({
  label,
  error,
  type = 'text',
  className = '',
  id,
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
          {label}
        </label>
      )}
      <input
        type={type}
        id={id}
        className={`w-full px-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl text-sm font-medium focus:outline-none focus:bg-white focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-gray-400 ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>
      )}
    </div>
  );
}

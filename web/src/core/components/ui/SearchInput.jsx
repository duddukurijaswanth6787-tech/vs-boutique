import { Search, X, Loader2 } from 'lucide-react';

export default function SearchInput({
  value = '',
  onChange,
  placeholder = 'Search...',
  isLoading = false,
  disabled = false,
  className = '',
  id = 'search-input',
  ...props
}) {
  const handleClear = () => {
    if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : (
          <Search className="h-4 w-4 text-gray-400 group-focus-within:text-accent transition-colors" />
        )}
      </span>
      <input
        type="text"
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="block w-full pl-11 pr-10 py-3 bg-gray-50 dark:bg-gray-800/50 border border-transparent rounded-2xl text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all disabled:opacity-50"
        {...props}
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

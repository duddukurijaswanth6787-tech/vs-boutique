import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PageHeader({
  title,
  description,
  onBack,
  backTo,
  action,
  className = '',
  ...props
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4 ${className}`} {...props}>
      <div className="flex items-center space-x-3">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-gray-600"
          aria-label="Go back"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-serif font-black text-gray-900 leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-gray-400 font-medium mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

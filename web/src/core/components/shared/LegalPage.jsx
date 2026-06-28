import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import CustomerLayout from '../../../components/CustomerLayout';

const LegalPage = ({ title, lastUpdated, children }) => {
  const navigate = useNavigate();

  return (
    <CustomerLayout>
      <div className="max-w-[800px] mx-auto px-4 md:px-6 py-8 md:py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
        >
          <ChevronLeft size={18} /> Back
        </button>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-serif mb-2">{title}</h1>
        {lastUpdated && (
          <p className="text-sm text-gray-400 mb-8">Last updated: {lastUpdated}</p>
        )}
        <div className="prose prose-gray max-w-none">
          {children}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default LegalPage;

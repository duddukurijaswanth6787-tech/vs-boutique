import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ChevronRight, Clock, MapPin } from 'lucide-react';
import CustomerLayout from '../../../../components/CustomerLayout';
import { getMyBookings } from '@core/services';
import PremiumImage from '@core/components/ui/PremiumImage';
import { IMAGES } from '@core/services';
import { useCustomerAuth } from '@core/contexts';
import OtpModal from '@core/components/shared/OtpModal';
import EmptyState from '@core/components/ui/EmptyState';

const STATUS_STYLE = {
  Pending: 'bg-yellow-50 text-yellow-600',
  Accepted: 'bg-green-50 text-green-600',
  Rejected: 'bg-red-50 text-red-500',
  Rescheduled: 'bg-orange-50 text-orange-600',
  Completed: 'bg-blue-50 text-blue-600',
};

const BOOKING_TYPE_LABELS = {
  HOME_MEASUREMENT: 'Home Measurement',
  STORE_VISIT: 'Store Visit',
  VIDEO_CONSULTATION: 'Video Consultation',
  DESIGN_DISCUSSION: 'Design Discussion',
  TRIAL_FITTING: 'Trial Fitting',
  FINAL_DELIVERY: 'Final Delivery',
};

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const CustomerBookings = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useCustomerAuth();
  const [showOtp, setShowOtp] = useState(false);

  const { data: bookings = [], isLoading, error } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: getMyBookings,
    retry: false,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return (
    <CustomerLayout>
      <EmptyState
        title="Tailoring Bookings"
        description="Sign in to view your tailoring appointment history"
        actionLabel="Sign In"
        onAction={() => setShowOtp(true)}
        icon={Calendar}
      />
      {showOtp && <OtpModal onClose={() => setShowOtp(false)} />}
    </CustomerLayout>
  );

  return (
    <CustomerLayout>
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate('/customer/profile')} className="p-2 -ml-2"><ChevronRight size={20} className="text-gray-600 rotate-180" /></button>
            <h1 className="text-xl font-bold text-gray-900">My Bookings</h1>
          </div>
          <button onClick={() => navigate('/customer/tailoring')} className="px-4 py-2 bg-primary/5 text-primary rounded-xl text-xs font-semibold">
            + New Booking
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <Clock size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">Unable to load bookings</h3>
            <p className="text-sm text-gray-400 mb-6">Please try again later</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 max-w-md mx-auto flex flex-col items-center space-y-5 my-8 animate-fade-in">
            <div className="w-40 h-40 rounded-2xl overflow-hidden shadow-sm border border-gray-50 relative bg-gray-50">
              <PremiumImage
                src={IMAGES.emptyStates.generic}
                alt="No Bookings"
                aspectRatio="aspect-square"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Bookings Yet</h3>
              <p className="text-sm text-gray-400">Book a tailoring consultation or boutique visit</p>
            </div>
            <button onClick={() => navigate('/customer/tailoring')} className="px-8 py-3.5 bg-primary text-white rounded-2xl text-sm font-semibold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all">
              Book a Service
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map(b => (
              <div key={b.id} className="bg-white rounded-2xl p-4 border border-gray-50 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-primary/5 rounded-2xl flex items-center justify-center">
                      <MapPin size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{b.customerName}</p>
                      <p className="text-[10px] text-gray-400">{BOOKING_TYPE_LABELS[b.bookingType] || b.bookingType}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${STATUS_STYLE[b.status] || 'bg-gray-50 text-gray-500'}`}>
                    {b.status}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar size={12} />
                    <span>{formatDate(b.bookingDate)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock size={12} />
                    <span>{b.bookingTime}</span>
                  </div>
                </div>
                {b.notes && (
                  <p className="text-xs text-gray-400 mt-2 italic line-clamp-2">"{b.notes}"</p>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <span className="text-[10px] text-gray-400">Booked {formatDate(b.createdAt)}</span>
                  <span className="text-[11px] text-primary font-semibold">
                    {b.status === 'Pending' ? 'Awaiting Confirmation' : b.status === 'Completed' ? 'Completed' : 'View Details'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
};

export default CustomerBookings;

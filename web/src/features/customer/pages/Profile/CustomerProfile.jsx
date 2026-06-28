import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { User, MapPin, Package, Heart, Scissors, LogOut, ChevronRight, HelpCircle, Settings, Star, RotateCcw, Edit3, Bell } from 'lucide-react';
import CustomerLayout from '../../../../components/CustomerLayout';
import { useCustomerAuth } from '@core/contexts';
import { getMyCommerceOrders } from '@core/services';
import OtpModal from '@core/components/shared/OtpModal';
import PremiumImage from '@core/components/ui/PremiumImage';
import { IMAGES } from '@core/services';
import Avatar from '@core/components/ui/Avatar';
import Button from '@core/components/ui/Button';
import Card from '@core/components/ui/Card';

const CustomerProfile = () => {
  const navigate = useNavigate();
  const { customer, isAuthenticated, logout } = useCustomerAuth();
  const [showOtp, setShowOtp] = useState(false);

  const { data: orders = [] } = useQuery({
    queryKey: ['my-orders'],
    queryFn: getMyCommerceOrders,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return (
    <CustomerLayout>
      <Card className="p-12 text-center max-w-md mx-auto flex flex-col items-center space-y-5 my-12 animate-fade-in">
        <div className="w-40 h-40 rounded-2xl overflow-hidden shadow-sm border border-gray-50 relative bg-gray-50">
          <PremiumImage
            src={IMAGES.emptyStates.generic}
            alt="Welcome"
            aspectRatio="aspect-square"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Welcome to VS Boutique</h3>
          <p className="text-sm text-gray-400">Sign in to manage your bookings, orders, and customized tailoring.</p>
        </div>
        <Button
          onClick={() => setShowOtp(true)}
          className="px-8"
        >
          Sign In / Register
        </Button>
      </Card>
      {showOtp && <OtpModal onClose={() => setShowOtp(false)} />}
    </CustomerLayout>
  );

  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;

  const menuSections = [
    {
      title: 'Shopping',
      items: [
        { icon: Package, label: 'My Orders', desc: `${orders.length} orders`, path: '/customer/orders' },
        { icon: Heart, label: 'Wishlist', path: '/customer/wishlist' },
        { icon: RotateCcw, label: 'Returns & Exchanges', path: '/customer/returns' },
      ],
    },
    {
      title: 'Services',
      items: [
        { icon: Scissors, label: 'My Measurements', path: '/customer/measurements' },
        { icon: Star, label: 'Tailoring Bookings', path: '/customer/bookings' },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: MapPin, label: 'Saved Addresses', path: '/customer/addresses' },
        { icon: Bell, label: 'Notifications', path: '/customer/notifications' },
        { icon: HelpCircle, label: 'Help & Support', path: '/customer/support' },
        { icon: Settings, label: 'Settings', path: '/customer/settings' },
      ],
    },
  ];

  return (
    <CustomerLayout>
      <div className="px-4 pt-4 pb-4">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-primary via-primary-dark to-accent/90 rounded-3xl p-6 mb-6 text-white shadow-xl shadow-primary/10">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar
                name={customer?.name || 'Customer'}
                src={customer?.avatarUrl || IMAGES.reviews.profiles[0]}
                size="lg"
                className="ring-2 ring-white/30 border-none w-16 h-16 text-lg"
              />
              <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md z-20">
                <Edit3 size={12} className="text-primary" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{customer?.name || 'Customer'}</h2>
              <p className="text-sm text-white/70">{customer?.phone || ''}</p>
            </div>
            <button className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
              <Settings size={18} className="text-white" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
              <p className="text-lg font-bold">{orders.length}</p>
              <p className="text-[10px] text-white/70 font-medium">Orders</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
              <p className="text-lg font-bold">{deliveredCount}</p>
              <p className="text-[10px] text-white/70 font-medium">Delivered</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
              <p className="text-lg font-bold">0</p>
              <p className="text-[10px] text-white/70 font-medium">Tailoring</p>
            </div>
          </div>
        </div>

        {/* Menu Sections */}
        <div className="space-y-4">
          {menuSections.map(section => (
            <div key={section.title}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">{section.title}</p>
              <Card className="overflow-hidden">
                {section.items.map((item, i) => (
                  <button key={item.label} onClick={() => navigate(item.path)}
                    className={`w-full flex items-center space-x-3 px-5 py-4 transition-all hover:bg-gray-50 ${
                      i < section.items.length - 1 ? 'border-b border-gray-50' : ''
                    }`}>
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                      <item.icon size={18} className="text-gray-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                      {item.desc && <p className="text-[10px] text-gray-400">{item.desc}</p>}
                    </div>
                    <ChevronRight size={16} className="text-gray-300" />
                  </button>
                ))}
              </Card>
            </div>
          ))}
        </div>

        {/* Logout */}
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full mt-6 bg-red-50 text-red-500 hover:bg-red-100"
        >
          <LogOut size={16} className="mr-2 shrink-0" /> Sign Out
        </Button>
      </div>
    </CustomerLayout>
  );
};

export default CustomerProfile;

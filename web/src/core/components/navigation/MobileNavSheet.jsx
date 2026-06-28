import { Home, Store, Scissors, Sparkles, Tag, Package, Heart, ShoppingBag } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCustomerAuth, useCart } from '../../contexts';
import { CategoryList } from '../shared/CategoryList';
import BottomSheet from '../ui/BottomSheet';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

export const MobileNavSheet = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { customer, isAuthenticated } = useCustomerAuth();
  const { cartCount } = useCart();

  const handleNav = (path) => {
    onClose();
    navigate(path);
  };

  const navItems = [
    { path: '/customer/home', label: 'Home', icon: Home },
    { path: '/customer/shop', label: 'Shop', icon: Store },
    { path: '/customer/tailoring', label: 'Tailoring', icon: Scissors },
    { path: '/customer/shop?sort=newest', label: 'New', icon: Sparkles },
    { path: '/customer/shop?sort=discount', label: 'Offers', icon: Tag },
    { path: '/customer/orders', label: 'Orders', icon: Package },
    { path: '/customer/wishlist', label: 'Wishlist', icon: Heart },
    { path: '/customer/cart', label: 'Cart', icon: ShoppingBag, badge: cartCount },
  ];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Menu">
      <div className="space-y-6 pt-2">
        {/* Profile Section */}
        <div
          onClick={() => handleNav('/customer/profile')}
          className="flex items-center gap-3.5 p-4 bg-surface dark:bg-gray-800/40 rounded-2xl cursor-pointer hover:bg-accent/5 transition-all"
        >
          <Avatar name={customer?.name || 'Guest'} size="md" />
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {isAuthenticated ? customer?.name : 'Guest'}
            </p>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
              {isAuthenticated ? 'View Profile' : 'Sign In'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl transition-colors cursor-pointer focus:outline-none ${
                  active
                    ? 'bg-accent/10 text-accent font-bold'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/30 text-gray-700 dark:text-gray-300 font-semibold'
                }`}
              >
                <item.icon size={20} className={active ? 'text-accent' : 'text-gray-400'} />
                <span className="text-sm flex-1 text-left">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Categories */}
        <div className="border-t border-[#d2c5b1]/10 pt-5">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
            Categories
          </h4>
          <div className="max-h-64 overflow-y-auto no-scrollbar">
            <CategoryList />
          </div>
        </div>

        {/* Legal Links */}
        <div className="border-t border-[#d2c5b1]/10 pt-5">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Legal
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Privacy Policy', path: '/customer/privacy' },
              { label: 'Terms & Conditions', path: '/customer/terms' },
              { label: 'Refund Policy', path: '/customer/refund' },
              { label: 'About Us', path: '/customer/about' },
            ].map((link) => (
              <button
                key={link.path}
                type="button"
                onClick={() => handleNav(link.path)}
                className="text-left py-2 px-3 text-xs font-semibold text-gray-500 hover:text-accent rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/35 transition-all focus:outline-none"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tailoring CTA */}
        <Button
          variant="luxury"
          onClick={() => handleNav('/customer/tailoring')}
          className="w-full flex items-center justify-center gap-2 py-4"
        >
          <Scissors size={16} />
          <span>Book Tailoring Appointment</span>
        </Button>
      </div>
    </BottomSheet>
  );
};

export default MobileNavSheet;
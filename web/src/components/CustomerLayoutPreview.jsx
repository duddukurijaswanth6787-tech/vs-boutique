import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Menu, X, ShoppingBag, Home, Search, Package, User, Heart, Bell, Scissors } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useWishlist } from '../context/WishlistContext';
import { MegaMenuPreview } from '../core/components/navigation/MegaMenuPreview';
import { MobileNavSheet } from '../core/components/navigation/MobileNavSheet';
import Button from '../core/components/ui/Button';
import IconButton from '../core/components/ui/IconButton';
import SearchInput from '../core/components/ui/SearchInput';
import PageFooter from '../core/components/layout/PageFooterPreview';
import { api } from '../services/api.ts';

const mobileTabs = [
  { path: '/customer/home', label: 'Home', icon: Home },
  { path: '/customer/shop', label: 'Shop', icon: Search },
  { path: '/customer/cart', label: 'Cart', icon: ShoppingBag },
  { path: '/customer/orders', label: 'Orders', icon: Package },
  { path: '/customer/profile', label: 'Profile', icon: User },
];

export default function CustomerLayoutPreview({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { isAuthenticated } = useCustomerAuth();
  const { unreadCount } = useNotifications();
  const { items: wishlistItems } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bespokeOrders, setBespokeOrders] = useState([]);
  const [showBespokeDropdown, setShowBespokeDropdown] = useState(false);
  const headerRef = useRef(null);

  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setMobileMenuOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      api.getOrders()
        .then(data => {
          setBespokeOrders(data || []);
        })
        .catch(err => {
          console.warn('[CustomerLayout] Failed to load bespoke orders', err);
        });
    }
  }, [isAuthenticated, location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/customer/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Announcement Bar */}
      <div className="hidden lg:block bg-[#111827] text-white py-2 text-xs font-sans tracking-wide">
        <div className="max-w-[1400px] mx-auto px-6 flex justify-between items-center h-10">
          <div className="flex items-center gap-2">
            <span className="text-[#C5A059] font-bold">🚚</span>
            <span className="font-semibold">FREE SHIPPING on orders above ₹999</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#C5A059] font-bold">💵</span>
            <span className="font-semibold">COD Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#C5A059] font-bold">🔄</span>
            <span className="font-semibold">Easy Returns & Exchanges</span>
          </div>
        </div>
      </div>

      {/* Desktop Sticky Header */}
      <header
        ref={headerRef}
        className={`hidden lg:block sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-premium border-b border-[#d2c5b1]/10'
            : 'bg-white dark:bg-gray-900 border-b border-[#d2c5b1]/5'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6">
          {/* Main row: Logo + Search + Actions (Height 80px = h-20) */}
          <div className="flex items-center justify-between h-20 gap-6">
            {/* Logo */}
            <Link to="/customer/home" className="flex items-center gap-3.5 flex-shrink-0 group">
              <div className="w-11 h-11 rounded-full bg-gradient-to-r from-[#C5A059] to-[#D4AF37] flex items-center justify-center transition-transform group-hover:scale-105 shadow-md">
                <span className="text-white font-serif font-bold text-base">VS</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="font-serif text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                  VS BOUTIQUE
                </span>
                <span className="text-[9px] font-bold tracking-widest text-[#C5A059] uppercase mt-0.5">
                  STITCHED TO PERFECTION
                </span>
              </div>
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-[500px] mx-auto flex items-center bg-[#F8FAFC] dark:bg-gray-800 rounded-[14px] border border-[#d2c5b1]/15 overflow-hidden focus-within:ring-2 focus-within:ring-accent/10 focus-within:border-accent/40 transition-all">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, categories, services..."
                className="w-full px-5 py-3 bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-[#C5A059] text-white px-5 py-3.5 hover:bg-[#D4AF37] transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                aria-label="Search"
              >
                <Search size={16} />
              </button>
            </form>

            {/* Action Buttons with labels underneath */}
            <div className="flex items-center gap-6">
              <Link to="/customer/wishlist" className="flex flex-col items-center group text-gray-600 dark:text-gray-300 hover:text-[#C5A059] transition-colors">
                <div className="relative">
                  <Heart size={20} className="transition-transform group-hover:scale-105" />
                  {wishlistItems && wishlistItems.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#C5A059] text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-md">
                      {wishlistItems.length}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold tracking-wide mt-1.5 uppercase">Wishlist</span>
              </Link>

              <Link to="/customer/notifications" className="flex flex-col items-center group text-gray-600 dark:text-gray-300 hover:text-[#C5A059] transition-colors">
                <div className="relative">
                  <Bell size={20} className="transition-transform group-hover:scale-105" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#C5A059] text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-md">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold tracking-wide mt-1.5 uppercase">Notifications</span>
              </Link>

              <Link to="/customer/orders" className="flex flex-col items-center group text-gray-600 dark:text-gray-300 hover:text-[#C5A059] transition-colors">
                <Package size={20} className="transition-transform group-hover:scale-105" />
                <span className="text-[10px] font-bold tracking-wide mt-1.5 uppercase">Orders</span>
              </Link>

              {/* Bespoke Orders Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowBespokeDropdown(!showBespokeDropdown)}
                  className="flex flex-col items-center group text-gray-600 dark:text-gray-300 hover:text-[#C5A059] transition-colors focus:outline-none cursor-pointer"
                  aria-label="Bespoke Orders"
                >
                  <div className="relative">
                    <Scissors size={20} className="transition-transform group-hover:scale-105" />
                    {bespokeOrders.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#C5A059] text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
                        {bespokeOrders.length}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold tracking-wide mt-1.5 uppercase">Bespoke</span>
                </button>
                
                {showBespokeDropdown && (
                  <div className="absolute right-[-40px] mt-3.5 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-[#d2c5b1]/20 p-4 z-50 animate-fade-in">
                    <div className="flex justify-between items-center pb-2 border-b border-[#d2c5b1]/10 mb-3">
                      <h3 className="text-xs font-bold tracking-wider uppercase text-gray-900 dark:text-white">Bespoke Orders</h3>
                      <span className="text-[10px] font-bold text-[#C5A059] px-2 py-0.5 bg-[#C5A059]/10 rounded-full">{bespokeOrders.length} Active</span>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                      {bespokeOrders.length === 0 ? (
                        <div className="text-center py-6 text-gray-400 text-xs">
                          No bespoke orders placed yet. Customize a size to begin!
                        </div>
                      ) : (
                        bespokeOrders.map((order) => (
                          <div key={order.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-[#d2c5b1]/5 hover:border-[#C5A059]/25 transition-colors">
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{order.productName}</h4>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                order.status === 'Processing' ? 'bg-[#C5A059]/15 text-[#C5A059]' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800/80 text-[10px] text-gray-500">
                              <span className="font-semibold text-gray-700 dark:text-gray-300">₹{order.price}</span>
                              <span className="font-medium text-[#C5A059]">
                                {order.lockedMeasurements && Object.keys(order.lockedMeasurements).length > 0 ? (
                                  Object.entries(order.lockedMeasurements).slice(0, 3).map(([k, v]) => `${k}:${v}`).join(' ')
                                ) : 'Custom Fit'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="mt-3.5 pt-3 border-t border-[#d2c5b1]/10">
                      <Link
                        to="/customer/tailoring"
                        onClick={() => setShowBespokeDropdown(false)}
                        className="block text-center text-xs font-black text-white bg-black hover:bg-[#C5A059] transition-colors py-2 rounded-lg"
                      >
                        Book Tailoring Service
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link to="/customer/cart" className="flex flex-col items-center group text-gray-600 dark:text-gray-300 hover:text-[#C5A059] transition-colors">
                <div className="relative">
                  <ShoppingBag size={20} className="transition-transform group-hover:scale-105" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#C5A059] text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-md">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold tracking-wide mt-1.5 uppercase">Cart</span>
              </Link>

              <div className="h-8 w-[1px] bg-[#d2c5b1]/15 mx-1" />

              {isAuthenticated ? (
                <Link to="/customer/profile" className="flex flex-col items-center group text-gray-600 dark:text-gray-300 hover:text-[#C5A059] transition-colors">
                  <User size={20} className="transition-transform group-hover:scale-105" />
                  <span className="text-[10px] font-bold tracking-wide mt-1.5 uppercase">Profile</span>
                </Link>
              ) : (
                <Link to="/customer/profile" className="flex flex-col items-center group text-gray-600 dark:text-gray-300 hover:text-[#C5A059] transition-colors">
                  <User size={20} className="transition-transform group-hover:scale-105" />
                  <span className="text-[10px] font-bold tracking-wide mt-1.5 uppercase text-accent font-black">Sign In</span>
                </Link>
              )}
            </div>
          </div>

          {/* Navigation row: Shop category dropdown + centered links (Height 60px = h-15) */}
          <nav className="flex items-center h-15 border-t border-[#d2c5b1]/10">
            <div className="flex items-center gap-8 w-full">
              {/* Category Dropdown */}
              <MegaMenuPreview />

              {/* Centered navigation links */}
              <div className="flex items-center gap-6">
                {[
                  { label: 'TAILORING', path: '/customer/tailoring' },
                  { label: 'NEW ARRIVALS', path: '/customer/shop?sort=newest' },
                  { label: 'COLLECTIONS', path: '/customer/shop' },
                  { label: 'OFFERS', path: '/customer/shop?sort=discount' },
                  { label: 'CUSTOM DESIGN', path: '/customer/tailoring' },
                  { label: 'BLOG', path: '/customer/about' },
                  { label: 'ABOUT US', path: '/customer/about' },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.path}
                    className="text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-accent transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Header — visible below lg */}
      <header className="lg:hidden sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-[#d2c5b1]/10">
        <div className="flex items-center justify-between px-4 h-14">
          <IconButton
            icon={mobileMenuOpen ? X : Menu}
            variant="ghost"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            ariaLabel={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          />
          <Link to="/customer/home" className="font-serif text-lg font-black text-gray-900 dark:text-white tracking-tight">
            VS Boutique
          </Link>
          <div className="relative">
            <IconButton
              icon={ShoppingBag}
              variant="ghost"
              onClick={() => navigate('/customer/cart')}
              ariaLabel="Shopping cart"
            />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-gray-900">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Sheet */}
      <MobileNavSheet isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-4 py-6 lg:px-6 lg:py-8 flex-1 w-full">
        {children}
      </main>

      {/* Footer */}
      <PageFooter className="mt-auto shrink-0" />

      {/* Mobile Bottom Navigation — visible below lg */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-[#d2c5b1]/10 z-50 shadow-premium pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-center justify-around px-2 py-1">
          {mobileTabs.map(({ path, label, icon: Icon }) => {
            const active = location.pathname.startsWith(path);
            const showBadge = path === '/customer/cart' && cartCount > 0;
            
            return (
              <Link
                key={path}
                to={path}
                className="flex flex-col items-center py-2 px-3 min-w-[64px] relative"
              >
                <div className={`p-1.5 rounded-xl transition-all duration-200 relative ${
                  active ? 'text-accent' : 'text-gray-400'
                }`}>
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-md">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold tracking-wide mt-0.5 transition-colors duration-200 ${
                  active ? 'text-accent' : 'text-gray-400'
                }`}>
                  {label}
                </span>
                {active && (
                  <div className="absolute -top-0.5 w-6 h-0.5 bg-accent rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
      {/* Bottom spacer for mobile nav */}
      <div className="lg:hidden h-[72px]" />
    </div>
  );
}

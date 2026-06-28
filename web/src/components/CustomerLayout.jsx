import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Menu, X, ShoppingBag, Home, Search, Package, User, Heart, Bell, Scissors } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useNotifications } from '../context/NotificationContext';
import { MegaMenu } from '../core/components/navigation/MegaMenu';
import { MobileNavSheet } from '../core/components/navigation/MobileNavSheet';
import Button from '../core/components/ui/Button';
import IconButton from '../core/components/ui/IconButton';
import SearchInput from '../core/components/ui/SearchInput';
import PageFooter from '../core/components/layout/PageFooter';

const mobileTabs = [
  { path: '/customer/home', label: 'Home', icon: Home },
  { path: '/customer/shop', label: 'Shop', icon: Search },
  { path: '/customer/cart', label: 'Cart', icon: ShoppingBag },
  { path: '/customer/orders', label: 'Orders', icon: Package },
  { path: '/customer/profile', label: 'Profile', icon: User },
];

export default function CustomerLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { isAuthenticated } = useCustomerAuth();
  const { unreadCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/customer/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Desktop Top Navigation — hidden below lg */}
      <header
        ref={headerRef}
        className={`hidden lg:block sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-premium border-b border-[#d2c5b1]/10'
            : 'bg-white dark:bg-gray-900 border-b border-[#d2c5b1]/5'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6">
          {/* Top bar: Logo + Search + Actions */}
          <div className="flex items-center justify-between h-16 gap-6">
            {/* Logo */}
            <Link to="/customer/home" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center transition-transform group-hover:scale-105">
                <span className="text-white font-serif font-bold text-sm">VS</span>
              </div>
              <span className="font-serif text-xl font-black text-gray-900 dark:text-white tracking-tight">
                VS Boutique
              </span>
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-[480px] mx-auto">
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sarees, blouses, lehengas..."
                id="header-search"
              />
            </form>

            {/* Action Icons */}
            <div className="flex items-center gap-1.5">
              <IconButton
                icon={Heart}
                variant="ghost"
                onClick={() => navigate('/customer/wishlist')}
                ariaLabel="Wishlist"
              />
              
              <div className="relative">
                <IconButton
                  icon={Bell}
                  variant="ghost"
                  onClick={() => navigate('/customer/notifications')}
                  ariaLabel="Notifications"
                />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-gray-900 pointer-events-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>

              <div className="relative">
                <IconButton
                  icon={ShoppingBag}
                  variant="ghost"
                  onClick={() => navigate('/customer/cart')}
                  ariaLabel="Shopping cart"
                />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-gray-900 pointer-events-none">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </div>

              <IconButton
                icon={Package}
                variant="ghost"
                onClick={() => navigate('/customer/orders')}
                ariaLabel="Orders"
              />

              <div className="h-6 w-[1px] bg-[#d2c5b1]/15 mx-1" />

              {isAuthenticated ? (
                <IconButton
                  icon={User}
                  variant="ghost"
                  onClick={() => navigate('/customer/profile')}
                  ariaLabel="Profile"
                />
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/customer/profile')}
                  className="ml-2 font-semibold"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>

          {/* Category nav bar with MegaMenu */}
          <nav className="flex items-center justify-between py-2 border-t border-[#d2c5b1]/10">
            <div className="flex items-center gap-1.5">
              <MegaMenu />
              <Link
                to="/customer/tailoring"
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-accent rounded-xl hover:bg-accent/5 transition-all flex items-center gap-1.5"
              >
                <Scissors size={14} />
                Tailoring
              </Link>
            </div>
            <Link
              to="/customer/shop"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-accent rounded-xl hover:bg-accent/5 transition-all"
            >
              View All
            </Link>
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

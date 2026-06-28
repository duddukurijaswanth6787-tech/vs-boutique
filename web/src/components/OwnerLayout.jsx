import React, { useState, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  Scissors, 
  ShoppingBag, 
  Calendar, 
  Star, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  User,
  Image as ImageIcon,
  Coins,
  CreditCard,
  LifeBuoy,
  Package,
  Tags,
  BarChart3,
  Truck,
  MessageCircle
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const OwnerLayout = ({ children, title }) => {
  const { user, logout } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const navItems = [
    { name: 'Dashboard', path: '/owner/dashboard', icon: LayoutDashboard, permission: null },
    { name: 'Analytics', path: '/owner/analytics', icon: LayoutDashboard, permission: 'canViewAnalytics' },
    { name: 'Boutique Profile', path: '/owner/profile', icon: Store, permission: 'canEditProfile' },
    { name: 'Services', path: '/owner/services', icon: Scissors, permission: 'canEditServices' },
    { name: 'Media Gallery', path: '/owner/gallery', icon: ImageIcon, permission: 'canEditGallery' },
    { name: 'Products', path: '/owner/products', icon: Package, permission: null },
    { name: 'Coupons', path: '/owner/coupons', icon: Tags, permission: null },
    { name: 'Product Reviews', path: '/owner/product-reviews', icon: MessageCircle, permission: null },
    { name: 'Delivery Tracking', path: '/owner/tracking', icon: Truck, permission: null },
    { name: 'My Designs', path: '/owner/designs', icon: ShoppingBag, permission: 'canManageDesigns' },
    { name: 'Bookings', path: '/owner/bookings', icon: Calendar, permission: 'canManageBookings' },
    { name: 'Orders', path: '/owner/orders', icon: ShoppingBag, permission: 'canManageOrders' },
    { name: 'Reviews', path: '/owner/reviews', icon: Star, permission: 'canManageReviews' },
    { name: 'Support Tickets', path: '/owner/tickets', icon: LifeBuoy, permission: null },
    { name: 'Payouts', path: '/owner/payouts', icon: Coins, permission: null },
    { name: 'Subscription Plan', path: '/owner/subscription', icon: CreditCard, permission: null },
    { name: 'Settings', path: '/owner/settings', icon: Settings, permission: null },
  ].filter(item => !item.permission || user?.permissions?.[item.permission]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white border-r border-gray-100 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-8 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Store className="text-white" size={20} />
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tight">VS Portal</span>
            </div>
            <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200
                  ${isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-6 mt-auto border-t border-gray-50">
            <div className="flex items-center space-x-3 mb-6 p-2">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black">
                {user?.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-gray-900 truncate">{user?.name}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Owner Portal</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-sm font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="h-14 md:h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-10 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button
              className="lg:hidden p-2 bg-gray-50 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} className="text-gray-600" />
            </button>
            <h1 className="text-base md:text-xl font-black text-gray-900 tracking-tight uppercase truncate">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:text-primary transition-colors relative min-h-[40px] min-w-[40px] flex items-center justify-center">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="hidden md:flex items-center space-x-3 pl-4 border-l border-gray-100">
               <div className="text-right">
                  <p className="text-xs font-black text-gray-900">{user?.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Managing Boutique</p>
               </div>
               <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <User size={20} className="text-gray-400" />
               </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;

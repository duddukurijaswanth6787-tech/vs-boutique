import React, { useContext, useState, useEffect } from 'react';
import { LayoutDashboard, Store, ClipboardList, Settings, LogOut, ChevronRight, ChevronDown, ChevronUp, Clock, X, IndianRupee, Users, Calendar, Star, TrendingUp, Coins, LifeBuoy, Megaphone, ShieldAlert, Heart, CreditCard, FolderOpen, Percent, MessageSquare, ShoppingBag, Truck, Globe, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts';

const Sidebar = ({ activePage, setActivePage, isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const isCmsRouteActive = location.pathname.startsWith('/admin/cms');
  const [isCmsExpanded, setIsCmsExpanded] = useState(() => {
    if (isCmsRouteActive) return true;
    return localStorage.getItem('cms_sidebar_expanded') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('cms_sidebar_expanded', isCmsExpanded);
  }, [isCmsExpanded]);

  useEffect(() => {
    if (isCmsRouteActive) {
      setIsCmsExpanded(true);
    }
  }, [location.pathname, isCmsRouteActive]);

  const menuItems = [
    { id: 'admin/command-center', label: 'Command Center',       icon: LayoutDashboard, path: '/admin/command-center' },
    { id: 'admin/revenue',        label: 'Revenue Analytics',    icon: IndianRupee, path: '/admin/revenue' },
    { id: 'admin/fraud',          label: 'Spam & Fraud Control', icon: ShieldAlert, path: '/admin/fraud' },
    { id: 'admin/wishlists',      label: 'Wishlists & Demand',   icon: Heart, path: '/admin/wishlists' },
    { id: 'admin/subscriptions',  label: 'Subscriptions Control', icon: CreditCard, path: '/admin/subscriptions' },
    { id: 'boutiques',            label: 'Boutiques',            icon: Store },
    { id: 'orders',               label: 'Orders',               icon: ClipboardList },
    { id: 'admin/commerce-orders',label: 'Commerce Orders',     icon: ShoppingBag, path: '/admin/commerce-orders' },
    { id: 'admin/delivery-tracking',label: 'Delivery Tracking', icon: Truck, path: '/admin/delivery-tracking' },
    { id: 'payments',             label: 'Payments',             icon: IndianRupee },
    { id: 'payouts',              label: 'Payouts',              icon: Coins, path: '/admin/payouts' },
    { id: 'customers',            label: 'Customers',            icon: Users },
    { id: 'bookings',             label: 'Bookings',             icon: Calendar },
    { id: 'reviews',              label: 'Reviews',              icon: Star },
    { id: 'admin/product-reviews',label: 'Product Reviews',      icon: MessageSquare, path: '/admin/product-reviews' },
    { id: 'admin/tickets',        label: 'Support Tickets',      icon: LifeBuoy, path: '/admin/tickets' },
    { id: 'admin/categories',    label: 'Categories',           icon: FolderOpen, path: '/admin/categories' },
    { id: 'admin/coupons',       label: 'Coupons',              icon: Percent, path: '/admin/coupons' },
    { id: 'admin/notifications',  label: 'Announcements',        icon: Megaphone, path: '/admin/notifications' },
    { id: 'marketplace-insights', label: 'Marketplace Insights', icon: TrendingUp },
    { id: 'activity-logs',        label: 'Activity Logs',        icon: Clock },
    { id: 'admin/live-website',   label: 'Live Website',         icon: Globe, path: '/admin/live-website' },
    { id: 'admin/cms',            label: 'CMS',                  icon: FolderOpen, path: '/admin/cms/dashboard', isCollapsible: true },
    { id: 'settings',             label: 'Platform Settings',     icon: Settings, path: '/admin/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const handleNavClick = () => {
    // Close drawer on mobile when navigating
    if (onClose) onClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo + Close button */}
      <div className="p-6 md:p-8 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-xl">VS</span>
          </div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light">
            Admin Panel
          </h2>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isCMSParent = item.id === 'admin/cms';
          const isActive = isCMSParent 
            ? location.pathname.startsWith('/admin/cms')
            : location.pathname.includes(item.id);

          if (isCMSParent) {
            return (
              <div key={item.id} className="flex flex-col w-full">
                <div
                  className={`w-full group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-primary'
                  }`}
                >
                  <Link
                    to={item.path}
                    onClick={handleNavClick}
                    className="flex items-center space-x-3 flex-grow py-0.5"
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    <span className={`font-semibold ${isActive ? 'text-white' : 'text-gray-600'}`}>
                      {item.label}
                    </span>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsCmsExpanded(!isCmsExpanded);
                    }}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-primary-light/20 ${
                      isActive ? 'text-white/80 hover:text-white' : 'text-gray-400 hover:text-primary'
                    }`}
                  >
                    {isCmsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {isCmsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pl-7 pr-1 mt-1 border-l border-gray-100 ml-6 flex flex-col space-y-3.5 py-2.5"
                    >
                      {/* Submenu Overview */}
                      <div className="flex flex-col space-y-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2.5 mb-0.5">Overview</span>
                        <Link
                          to="/admin/cms/dashboard"
                          onClick={handleNavClick}
                          className={`text-xs font-semibold py-1.5 px-2.5 rounded-lg transition-colors ${
                            location.pathname === '/admin/cms/dashboard'
                              ? 'text-primary bg-primary/5 font-bold'
                              : 'text-gray-500 hover:text-primary hover:bg-gray-50'
                          }`}
                        >
                          Dashboard
                        </Link>
                      </div>

                      {/* Submenu Website Platform */}
                      <div className="flex flex-col space-y-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2.5 mb-0.5">Website Platform</span>
                        {[
                          { path: '/admin/cms/blueprint', label: 'Website Blueprint' },
                          { path: '/admin/cms/standards', label: 'Website Standards' },
                          { path: '/admin/cms/requirements', label: 'Website Requirements' },
                          { path: '/admin/cms/sdk', label: 'Website Dev Kit (WDK)' },
                          { path: '/admin/cms/prompt-library', label: 'Prompt Library' },
                          { path: '/admin/cms/requirement-generator', label: 'AI Requirement Generator' },
                          { path: '/admin/cms/website-generator', label: 'AI Website Generator' },
                          { path: '/admin/cms/upload', label: 'Upload Website' },
                          { path: '/admin/cms/templates', label: 'Template Library' },
                        ].map((sub) => (
                          <Link
                            key={sub.path}
                            to={sub.path}
                            onClick={handleNavClick}
                            className={`text-xs font-semibold py-1.5 px-2.5 rounded-lg transition-colors ${
                              location.pathname === sub.path
                                ? 'text-primary bg-primary/5 font-bold'
                                : 'text-gray-500 hover:text-primary hover:bg-gray-50'
                            }`}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>

                      {/* Submenu AI Certification */}
                      <div className="flex flex-col space-y-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2.5 mb-0.5">AI Certification</span>
                        {[
                          { path: '/admin/cms/certification', label: 'AI Certification' },
                          { path: '/admin/cms/reports', label: 'Validation Reports' },
                          { path: '/admin/cms/prompt-generator', label: 'Prompt Generator' },
                          { path: '/admin/cms/agents', label: 'AI Agents' },
                          { path: '/admin/cms/rules', label: 'Certification Rules' },
                        ].map((sub) => (
                          <Link
                            key={sub.path}
                            to={sub.path}
                            onClick={handleNavClick}
                            className={`text-xs font-semibold py-1.5 px-2.5 rounded-lg transition-colors ${
                              location.pathname === sub.path
                                ? 'text-primary bg-primary/5 font-bold'
                                : 'text-gray-500 hover:text-primary hover:bg-gray-50'
                            }`}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>

                      {/* Submenu AI Agent Center */}
                      <div className="flex flex-col space-y-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2.5 mb-0.5">AI Agent Center</span>
                        {[
                          { path: '/admin/cms/ai-center', label: 'Dashboard' },
                          { path: '/admin/cms/ai-center/providers', label: 'Providers' },
                          { path: '/admin/cms/ai-center/agents', label: 'Agents' },
                          { path: '/admin/cms/ai-center/workflows', label: 'Workflows' },
                          { path: '/admin/cms/ai-center/executions', label: 'Executions' },
                          { path: '/admin/cms/ai-center/usage', label: 'Usage & Cost' },
                          { path: '/admin/cms/ai-center/health', label: 'Health' },
                          { path: '/admin/cms/ai-center/queue', label: 'Queue' },
                          { path: '/admin/cms/ai-center/settings', label: 'Settings' },
                        ].map((sub) => (
                          <Link
                            key={sub.path}
                            to={sub.path}
                            onClick={handleNavClick}
                            className={`text-xs font-semibold py-1.5 px-2.5 rounded-lg transition-colors ${
                              location.pathname === sub.path
                                ? 'text-primary bg-primary/5 font-bold'
                                : 'text-gray-500 hover:text-primary hover:bg-gray-50'
                            }`}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>

                      {/* Submenu App Marketplace */}
                      <div className="flex flex-col space-y-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2.5 mb-0.5">App Marketplace</span>
                        {[
                          { path: '/admin/cms/marketplace', label: 'Browse Marketplace' }
                        ].map((sub) => (
                          <Link
                            key={sub.path}
                            to={sub.path}
                            onClick={handleNavClick}
                            className={`text-xs font-semibold py-1.5 px-2.5 rounded-lg transition-colors ${
                              location.pathname === sub.path
                                ? 'text-primary bg-primary/5 font-bold'
                                : 'text-gray-500 hover:text-primary hover:bg-gray-50'
                            }`}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>

                      {/* Submenu Platform */}
                      <div className="flex flex-col space-y-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2.5 mb-0.5">Platform</span>
                        {[
                          { path: '/admin/cms/subscriptions', label: 'Subscription Plans' },
                          { path: '/admin/cms/feature-flags', label: 'Feature Flags' },
                          { path: '/admin/cms/business-assignment', label: 'Business Assignments' },
                          { path: '/admin/cms/domains', label: 'Domains' },
                          { path: '/admin/cms/deployment', label: 'Deployment' },
                          { path: '/admin/cms/health', label: 'Website Health' },
                          { path: '/admin/cms/monitoring', label: 'Monitoring Center' },
                          { path: '/admin/cms/ai-center/workflows', label: 'Workflow Center' },
                          { path: '/admin/cms/customer-success', label: 'Customer Success' },
                          { path: '/admin/cms/developer', label: 'Developer Platform' },
                          { path: '/admin/cms/compliance', label: 'Compliance Center' },
                        { path: '/admin/cms/disaster-recovery', label: 'Disaster Recovery' },
                        { path: '/admin/cms/infrastructure', label: 'Infrastructure' },
                        { path: '/admin/cms/analytics', label: 'Analytics' },
                        { path: '/admin/cms/partners', label: 'White-Label' },
                        { path: '/admin/cms/notifications', label: 'Notifications' },
                        { path: '/admin/cms/devops', label: 'DevOps Center' },
                        ].map((sub) => (
                          <Link
                            key={sub.path}
                            to={sub.path}
                            onClick={handleNavClick}
                            className={`text-xs font-semibold py-1.5 px-2.5 rounded-lg transition-colors ${
                              location.pathname === sub.path
                                ? 'text-primary bg-primary/5 font-bold'
                                : 'text-gray-500 hover:text-primary hover:bg-gray-50'
                            }`}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>

                      {/* Submenu Configuration */}
                      <div className="flex flex-col space-y-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2.5 mb-0.5">Configuration</span>
                        <Link
                          to="/admin/cms/settings"
                          onClick={handleNavClick}
                          className={`text-xs font-semibold py-1.5 px-2.5 rounded-lg transition-colors ${
                            location.pathname === '/admin/cms/settings'
                              ? 'text-primary bg-primary/5 font-bold'
                              : 'text-gray-500 hover:text-primary hover:bg-gray-50'
                          }`}
                        >
                          Settings
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <Link
              key={item.id}
              to={item.path || `/${item.id}`}
              onClick={handleNavClick}
              className={`w-full group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-primary'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`font-semibold ${isActive ? 'text-white' : 'text-gray-600'}`}>
                  {item.label}
                </span>
              </div>
              {isActive && (
                <ChevronRight size={16} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 md:p-6 border-t border-gray-50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300 min-h-[48px]"
        >
          <LogOut size={20} />
          <span className="font-semibold">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: static sidebar */}
      <div className="hidden lg:flex w-72 bg-white border-r border-gray-100 h-screen flex-col z-20 flex-shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile: slide-in drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed inset-y-0 left-0 w-72 bg-white border-r border-gray-100 z-50 flex flex-col lg:hidden shadow-2xl"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;

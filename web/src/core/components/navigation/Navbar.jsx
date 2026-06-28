import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Search, Globe, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthContext, useAdminNotifications } from '../../contexts';

const Navbar = ({ title, onMenuClick }) => {
  const { user } = useContext(AuthContext);
  const { unreadCount } = useAdminNotifications();
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 flex-shrink-0"
    >
      <div className="flex items-center justify-between h-14 md:h-20 px-4 md:px-10">

        {/* Left: Hamburger (mobile) + Title */}
        <div className="flex items-center space-x-3 md:space-x-6 min-w-0">
          {/* Hamburger — mobile only */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors flex-shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <h1 className="text-base md:text-2xl font-bold text-gray-900 tracking-tight truncate">
            {title}
          </h1>

          {/* Search bar — desktop only */}
          <div className="relative group hidden lg:block w-72">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            </span>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 transition-all placeholder-gray-400 text-sm outline-none"
              placeholder="Search boutiques..."
            />
          </div>
        </div>

        {/* Right: Actions + Profile */}
        <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
          {/* Globe — hidden on smallest mobile */}
          <button className="hidden sm:flex p-2.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all min-h-[40px] min-w-[40px] items-center justify-center">
            <Globe size={20} />
          </button>

          {/* Bell */}
          <button onClick={() => navigate('/admin/notifications')} className="relative p-2.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all min-h-[40px] min-w-[40px] flex items-center justify-center">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-md ring-2 ring-white px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="h-8 w-[1px] bg-gray-100 mx-1 hidden sm:block" />

          {/* Profile */}
          <div className="flex items-center space-x-3 group cursor-pointer p-1 rounded-2xl hover:bg-gray-50 transition-all">
            {/* Name + role — desktop only */}
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-gray-900">{user?.name || 'Admin'}</p>
              <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Super Admin</p>
            </div>
            <div className="relative flex-shrink-0">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=8B0000&color=fff`}
                className="w-9 h-9 md:w-10 md:h-10 rounded-xl shadow-md group-hover:scale-105 transition-transform"
                alt="Profile"
              />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;

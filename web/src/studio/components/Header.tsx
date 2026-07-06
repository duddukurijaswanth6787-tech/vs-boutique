/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Heart, Bell, ClipboardList, ShoppingCart, User, Menu, ChevronDown, Sparkles, Truck, RefreshCw, X, ShieldCheck, Scissors, MapPin, ChevronRight, Percent, Ruler } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, Category } from '../types';
import { categories, products } from '../data';
import api from '../../services/api.ts';

interface HeaderProps {
  onWishlistOpen: () => void;
  onCartOpen: () => void;
  wishlistCount: number;
  cartCount: number;
  notificationCount: number;
  onProductClick: (p: Product) => void;
  onCustomTailorOpen: () => void;
  onDesignSystemOpen: () => void;
  activeView?: 'home' | 'measurement';
  onViewChange?: (view: 'home' | 'measurement') => void;
}

export default function Header({
  onWishlistOpen,
  onCartOpen,
  wishlistCount,
  cartCount,
  notificationCount,
  onProductClick,
  onCustomTailorOpen,
  onDesignSystemOpen,
  activeView = 'home',
  onViewChange
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [announcement, setAnnouncement] = useState({
    enabled: true,
    text1: 'FREE SHIPPING on orders above ₹999',
    text2: 'COD Available',
    text3: 'Easy Returns & Exchanges'
  });

  useEffect(() => {
    let active = true;
    const fetchSettings = async () => {
      try {
        const settings = await api.getSiteSettings();
        if (settings && settings.announcement_bar && active) {
          setAnnouncement(settings.announcement_bar);
        }
      } catch (err) {
        console.warn('Failed to fetch site settings in Header:', err);
      }
    };
    fetchSettings();
    return () => { active = false; };
  }, []);

  const [dbCategories, setDbCategories] = useState<any[]>([]);
  useEffect(() => {
    let active = true;
    const loadCategories = async () => {
      try {
        const backendUrl = (window as any).VITE_API_URL || (import.meta as any).env?.VITE_API_URL || '';
        const res = await fetch(`${backendUrl}/categories`);
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data) && active) {
          setDbCategories(json.data);
        }
      } catch (err) {
        console.warn('Failed to load dynamic categories in Header:', err);
      }
    };
    loadCategories();
    return () => { active = false; };
  }, []);

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const [isMobileOrdersOpen, setIsMobileOrdersOpen] = useState(false);
  const [isMobileNotifsOpen, setIsMobileNotifsOpen] = useState(false);

  // Simple sticky effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update suggestions as query changes
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchSuggestions([]);
      return;
    }
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchSuggestions(filtered);
  }, [searchQuery]);

  const handleSuggestionClick = (p: Product) => {
    setSearchQuery('');
    setSearchSuggestions([]);
    onProductClick(p);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchSuggestions.length > 0) {
      onProductClick(searchSuggestions[0]);
      setSearchQuery('');
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="w-full z-40 relative">
      {/* Announcement Bar */}
      {announcement.enabled && (
        <div className="bg-luxury-black text-white border-b border-accent/20 py-2.5 px-4">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between md:justify-around gap-4 overflow-x-auto whitespace-nowrap scrollbar-none text-[8.5px] md:text-[10px] font-bold uppercase tracking-wider md:tracking-[0.18em] text-gray-200">
            <div className="flex items-center gap-1.5 shrink-0">
              <Truck className="h-3 w-3 text-accent stroke-[1.5]" />
              <span>{announcement.text1}</span>
            </div>
            <div className="h-3 w-px bg-white/20 shrink-0 hidden md:block" />
            <div className="flex items-center gap-1.5 shrink-0">
              <Sparkles className="h-3 w-3 text-accent stroke-[1.5]" />
              <span>{announcement.text2}</span>
            </div>
            <div className="h-3 w-px bg-white/20 shrink-0 hidden md:block" />
            <div className="flex items-center gap-1.5 shrink-0">
              <RefreshCw className="h-3 w-3 text-accent stroke-[1.5]" />
              <span>{announcement.text3}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Brand & Search & Utilities Row */}
      <div className={`w-full bg-white border-b border-accent/15 px-4 md:px-8 py-3.5 md:py-4 transition-all duration-300 ${scrolled ? 'fixed top-0 left-0 shadow-md backdrop-blur-md bg-white/95' : 'relative'}`}>
        <div className="max-w-[1400px] mx-auto">
          {/* Main row */}
          <div className="flex md:flex-row items-center justify-between gap-4">
            
            {/* MOBILE ONLY: 3-column split for pixel-perfect layout matching mockup */}
            <div className="grid grid-cols-12 items-center w-full md:hidden">
              
              {/* Col-span 2: Hamburger menu on far-left */}
              <div className="col-span-2 flex items-center justify-start">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-1 -ml-1 text-luxury-black hover:text-accent cursor-pointer transition-colors"
                  aria-label="Open Mobile Menu"
                >
                  <Menu className="h-6 w-6 stroke-[1.5]" />
                </button>
              </div>

              {/* Col-span 6: Brand Crest/Logo Centered */}
              <div className="col-span-6 flex flex-col items-center justify-center cursor-pointer text-center" onClick={() => { if (onViewChange) onViewChange('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                <div className="flex items-center gap-1.5 justify-center">
                  {/* Crest Icon Logo */}
                  <div className="h-7 w-7 border border-accent/40 rounded-full flex items-center justify-center bg-luxury-ivory p-0.5 shrink-0">
                    <span className="text-accent font-serif text-xs font-bold tracking-tight">VS</span>
                  </div>
                  <div className="text-left">
                    <h1 className="text-xs font-serif font-extrabold tracking-tight text-luxury-black leading-none flex flex-col">
                      VS BOUTIQUE
                      <span className="text-[5.5px] font-sans font-bold tracking-[0.22em] text-accent mt-0.5 uppercase">Stitched To Perfection</span>
                    </h1>
                  </div>
                </div>
              </div>

              {/* Col-span 4: Utilities right-aligned (Wishlist, Cart, Account) */}
              <div className="col-span-4 flex items-center justify-end gap-2.5 sm:gap-3.5">
                {/* Wishlist Mobile */}
                <button
                  onClick={onWishlistOpen}
                  className="flex flex-col items-center group relative cursor-pointer"
                  aria-label="View Wishlist Mobile"
                >
                  <div className="relative">
                    <Heart className="h-[18px] w-[18px] text-luxury-black group-hover:text-accent transition-all stroke-[1.5]" />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[7.5px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[7.5px] font-bold tracking-wider text-gray-500 mt-0.5 uppercase">Wishlist</span>
                </button>

                {/* Cart Mobile */}
                <button
                  onClick={onCartOpen}
                  className="flex flex-col items-center group relative cursor-pointer"
                  aria-label="View Cart Mobile"
                >
                  <div className="relative">
                    <ShoppingCart className="h-[18px] w-[18px] text-luxury-black group-hover:text-accent transition-all stroke-[1.5]" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[7.5px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[7.5px] font-bold tracking-wider text-gray-500 mt-0.5 uppercase">Cart</span>
                </button>

                {/* Account Mobile */}
                <button
                  onClick={onDesignSystemOpen}
                  className="flex flex-col items-center group cursor-pointer"
                  aria-label="Account Mobile"
                >
                  <User className="h-[18px] w-[18px] text-luxury-black group-hover:text-accent transition-all stroke-[1.5]" />
                  <span className="text-[7.5px] font-bold tracking-wider text-gray-500 mt-0.5 uppercase">Account</span>
                </button>
              </div>

            </div>

            {/* DESKTOP ONLY: Standard Row Layout (Hidden on Mobile) */}
            <div className="hidden md:flex items-center justify-between w-full gap-4">
              {/* Logo / Brand Name */}
              <div className="flex-shrink-0 cursor-pointer animate-fade-in" onClick={() => { if (onViewChange) onViewChange('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                <div className="flex items-center gap-3">
                  {/* Crest Icon Logo */}
                  <div className="h-11 w-11 border border-accent/40 rounded-full flex items-center justify-center bg-luxury-ivory p-0.5">
                    <span className="text-accent font-serif text-xl font-bold tracking-tight">VS</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-serif font-extrabold tracking-tight text-luxury-black leading-none flex flex-col">
                      VS BOUTIQUE
                      <span className="text-[7.5px] font-sans font-bold tracking-[0.35em] text-accent mt-1 uppercase">Stitched To Perfection</span>
                    </h1>
                  </div>
                </div>
              </div>

              {/* Centered Search Bar */}
              <div className="flex-1 max-w-md relative">
                <form onSubmit={handleSearchSubmit} className="flex items-center bg-[#FDFBF7] border border-accent/30 rounded-[16px] overflow-hidden focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all">
                  <input
                    type="text"
                    placeholder="Search custom designs, bridal wear..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 text-xs focus:outline-none placeholder-gray-400 bg-transparent text-luxury-black"
                  />
                  <button
                    type="submit"
                    className="bg-accent hover:bg-accent-dark text-white px-4 py-2 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Search"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </form>

                {/* Suggestions Dropdown */}
                {searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-accent/20 rounded-b-xl shadow-luxury z-50 max-h-60 overflow-y-auto mt-0.5">
                    {searchSuggestions.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSuggestionClick(p)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-luxury-ivory cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                      >
                        <img src={p.image} alt={p.name} className="h-10 w-8 object-cover rounded-md" referrerPolicy="no-referrer" />
                        <div>
                          <span className="text-xs font-semibold text-luxury-black block">{p.name}</span>
                          <span className="text-[10px] text-gray-500">{p.category} • ₹{p.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Utilities (Wishlist, Notifications, Orders, Cart, Sign In) */}
              <div className="flex items-center gap-6">
                {/* Wishlist Utility */}
                <button
                  onClick={onWishlistOpen}
                  className="flex flex-col items-center group relative cursor-pointer"
                  aria-label="View Wishlist"
                >
                  <div className="relative">
                    <Heart className="h-5 w-5 text-luxury-black group-hover:text-accent group-hover:scale-110 transition-all" />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-accent text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-medium tracking-wider text-gray-500 mt-1 uppercase group-hover:text-accent transition-colors">Wishlist</span>
                </button>

                {/* Notifications Utility */}
                <div className="relative">
                  <button
                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                    className="flex flex-col items-center group cursor-pointer"
                    aria-label="View Notifications"
                  >
                    <div className="relative">
                      <Bell className="h-5 w-5 text-luxury-black group-hover:text-accent group-hover:scale-110 transition-all" />
                      {notificationCount > 0 && (
                        <span className="absolute -top-1.5 -right-2 bg-accent text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                          {notificationCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-medium tracking-wider text-gray-500 mt-1 uppercase group-hover:text-accent transition-colors">Notifications</span>
                  </button>

                  {/* Simple Notifications Dropdown */}
                  {notifDropdownOpen && (
                    <div className="absolute right-0 top-full mt-3 w-72 bg-white border border-accent/20 rounded-xl shadow-luxury z-50 p-3">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                        <span className="text-xs font-bold text-luxury-black">Recent Notifications</span>
                        <button onClick={() => setNotifDropdownOpen(false)} className="text-[10px] text-accent hover:underline">Dismiss All</button>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        <div className="p-2 hover:bg-luxury-ivory rounded-lg text-left cursor-pointer border-l-2 border-accent">
                          <p className="text-[11px] font-semibold text-luxury-black">✨ Tailoring Session Confirmed</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Elegance House scheduled your virtual fit review at 4:30 PM today.</p>
                        </div>
                        <div className="p-2 hover:bg-luxury-ivory rounded-lg text-left cursor-pointer border-l-2 border-accent">
                          <p className="text-[11px] font-semibold text-luxury-black">🔥 Flash Sale Live</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Get up to 40% off on custom stitched Bridal Lehengas!</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Orders Utility */}
                <div className="relative">
                  <button
                    onClick={() => setOrdersOpen(!ordersOpen)}
                    className="flex flex-col items-center group cursor-pointer"
                    aria-label="View Orders"
                  >
                    <ClipboardList className="h-5 w-5 text-luxury-black group-hover:text-accent group-hover:scale-110 transition-all" />
                    <span className="text-[9px] font-medium tracking-wider text-gray-500 mt-1 uppercase group-hover:text-accent transition-colors">Orders</span>
                  </button>

                  {/* Simple Orders popup */}
                  {ordersOpen && (
                    <div className="absolute right-0 top-full mt-3 w-64 bg-white border border-accent/20 rounded-xl shadow-luxury z-50 p-4">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                        <h3 className="text-xs font-bold text-luxury-black">Bespoke Orders</h3>
                        <button
                          onClick={() => {
                            setOrdersOpen(false);
                            if (onViewChange) onViewChange('measurement');
                          }}
                          className="text-[9px] text-accent font-bold uppercase hover:underline"
                        >
                          Fit Sheet
                        </button>
                      </div>
                      <div className="space-y-3 text-left">
                        <div
                          onClick={() => {
                            setOrdersOpen(false);
                            if (onViewChange) onViewChange('measurement');
                          }}
                          className="text-[11px] text-gray-500 hover:bg-luxury-ivory p-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <div className="flex justify-between font-bold text-gray-700">
                            <span>Order #VSB-8392</span>
                            <span className="text-orange-600">Pending Fit</span>
                          </div>
                          <p className="mt-0.5 text-[10px]">Bespoke Bridal Lehenga</p>
                          <span className="text-[9px] text-accent hover:underline block mt-1">Configure fitting measurements</span>
                        </div>
                        <div
                          onClick={() => {
                            setOrdersOpen(false);
                            if (onViewChange) onViewChange('measurement');
                          }}
                          className="text-[11px] text-gray-500 border-t border-gray-50 pt-2 hover:bg-luxury-ivory p-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <div className="flex justify-between font-bold text-gray-700">
                            <span>Order #VSB-3810</span>
                            <span className="text-orange-600">Stitching</span>
                          </div>
                          <p className="mt-0.5 text-[10px]">Silk Saree Custom Blouse</p>
                          <span className="text-[9px] text-gray-400 block mt-1">Measurements locked in</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cart Utility */}
                <button
                  onClick={onCartOpen}
                  className="flex flex-col items-center group relative cursor-pointer"
                  aria-label="View Cart"
                >
                  <div className="relative p-1 md:p-0">
                    <ShoppingCart className="h-5 w-5 text-luxury-black group-hover:text-accent group-hover:scale-110 transition-all" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-accent text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-medium tracking-wider text-gray-500 mt-1 uppercase group-hover:text-accent transition-colors">Cart</span>
                </button>

                {/* Signature User Profile / Sign In */}
                <button
                  onClick={onDesignSystemOpen}
                  className="flex flex-col items-center group cursor-pointer"
                  aria-label="Signature User Profile"
                >
                  <User className="h-5 w-5 text-luxury-black group-hover:text-accent group-hover:scale-110 transition-all" />
                  <span className="text-[9px] font-medium tracking-wider text-gray-500 mt-1 uppercase group-hover:text-accent transition-colors">Profile</span>
                </button>
              </div>
            </div>

          </div>

          {/* Full-width Search Bar for Mobile (Below the main logo row) */}
          <div className="block md:hidden mt-3 relative">
            <form onSubmit={handleSearchSubmit} className="flex items-center bg-[#FDFBF7] border border-accent/30 rounded-[8px] overflow-hidden focus-within:border-accent transition-all">
              <input
                id="mobile-header-search-input"
                type="text"
                placeholder="Search for products, categories, services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-[11px] focus:outline-none placeholder-gray-400 bg-transparent text-luxury-black"
              />
              <button
                type="submit"
                className="bg-accent text-white px-4 py-2 flex items-center justify-center transition-colors hover:bg-accent-dark shrink-0 cursor-pointer"
                aria-label="Search mobile"
              >
                <Search className="h-4 w-4 text-white" />
              </button>
            </form>

            {/* Suggestions Dropdown on Mobile */}
            {searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-accent/20 rounded-b-lg shadow-luxury z-50 max-h-52 overflow-y-auto mt-0.5">
                {searchSuggestions.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSuggestionClick(p)}
                    className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-luxury-ivory cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                  >
                    <img src={p.image} alt={p.name} className="h-8 w-6 object-cover rounded-md" referrerPolicy="no-referrer" />
                    <div>
                      <span className="text-[10px] font-bold text-luxury-black block truncate">{p.name}</span>
                      <span className="text-[8.5px] text-gray-500">{p.category} • ₹{p.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Navigation & Categories Row - hidden on mobile, visible on desktop */}
      <div className="hidden md:block w-full bg-white border-b border-accent/15 py-3 px-4 md:px-8 relative">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Shop By Category Trigger with Dropdown menu */}
          <div className="relative w-full md:w-auto">
            <button
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-luxury-black text-white px-5 py-2 rounded-lg text-xs font-bold tracking-wider uppercase hover:bg-accent transition-all cursor-pointer"
            >
              <Menu className="h-4 w-4" />
              Shop by Category
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Categories Mega Dropdown */}
            {isCategoryOpen && (
              <div className="absolute top-full left-0 right-0 md:right-auto md:w-64 bg-white border border-accent/25 rounded-b-xl shadow-luxury z-50 p-2 mt-1">
                {(dbCategories && dbCategories.length > 0 ? dbCategories : categories).map((cat) => (
                  <div
                    key={cat.id || cat.name}
                    onClick={() => {
                      setIsCategoryOpen(false);
                      scrollToSection('categories-grid');
                    }}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-luxury-ivory rounded-lg cursor-pointer transition-colors"
                  >
                    <img src={cat.image} alt={cat.name} className="h-8 w-8 object-cover rounded-full border border-accent/20" referrerPolicy="no-referrer" />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-luxury-black">{cat.name}</span>
                      <span className="text-[9px] text-gray-400 block">{cat.count !== undefined ? `${cat.count} Designs available` : 'Browse designs'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold tracking-wider text-luxury-black">
            <button
              onClick={() => { if (onViewChange) onViewChange('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`hover:text-accent transition-colors uppercase py-1 px-2.5 rounded ${activeView === 'home' ? 'text-accent font-black border-b border-accent' : ''}`}
            >
              Home
            </button>
            <button
              onClick={() => { if (onViewChange) onViewChange('measurement'); }}
              className={`hover:text-accent transition-colors uppercase py-1 px-2.5 rounded ${activeView === 'measurement' ? 'text-accent font-black border-b border-accent' : ''}`}
            >
              Measurement
            </button>
            <button onClick={() => { if (onViewChange) onViewChange('home'); onCustomTailorOpen(); }} className="hover:text-accent transition-colors uppercase">Tailoring</button>
            <button onClick={() => { if (onViewChange) onViewChange('home'); setTimeout(() => scrollToSection('new-arrivals'), 100); }} className="hover:text-accent transition-colors uppercase">New Arrivals</button>
            <button onClick={() => { if (onViewChange) onViewChange('home'); setTimeout(() => scrollToSection('featured-collections'), 100); }} className="hover:text-accent transition-colors uppercase">Collections</button>
            <button onClick={() => { if (onViewChange) onViewChange('home'); setTimeout(() => scrollToSection('partner-boutiques'), 100); }} className="hover:text-accent transition-colors uppercase">About Us</button>
          </nav>

          {/* Quick contact trigger on the right */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-accent font-bold">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span>100% Fit Guarantee Stitched</span>
          </div>

        </div>
      </div>

      {/* Mobile Sidebar Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden"
            />

            {/* Sidebar Slide-out */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] sm:w-[320px] bg-white z-50 md:hidden flex flex-col shadow-2xl border-r border-[#C5A059]/20"
            >
              {/* Header inside sidebar */}
              <div className="p-4 border-b border-[#C5A059]/10 bg-[#FAF8F5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 border border-accent/40 rounded-full flex items-center justify-center bg-white p-0.5">
                    <span className="text-accent font-serif text-sm font-bold italic">VS</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-serif font-extrabold italic tracking-tight text-luxury-black">VS Boutique</h3>
                    <p className="text-[7px] font-sans font-bold tracking-widest text-accent uppercase">Stitched To Perfection</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-accent bg-white cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Sidebar Content (Scrollable) */}
              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
                
                {/* Custom Search in sidebar for mobile! */}
                <div className="px-1">
                  <form onSubmit={(e) => {
                    handleSearchSubmit(e);
                    setIsMobileMenuOpen(false);
                  }} className="flex items-center bg-[#FDFBF7] border border-accent/30 rounded-xl overflow-hidden focus-within:border-accent transition-all">
                    <input
                      type="text"
                      placeholder="Search designs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs focus:outline-none placeholder-gray-400 bg-transparent text-luxury-black"
                    />
                    <button
                      type="submit"
                      className="bg-transparent hover:text-accent text-luxury-black px-3 py-1.5 flex items-center justify-center transition-colors"
                      aria-label="Search mobile"
                    >
                      <Search className="h-3.5 w-3.5" />
                    </button>
                  </form>
                  
                  {/* Suggestions in Sidebar */}
                  {searchQuery.trim().length >= 2 && searchSuggestions.length > 0 && (
                    <div className="mt-1 bg-white border border-accent/10 rounded-lg max-h-32 overflow-y-auto shadow-md">
                      {searchSuggestions.slice(0, 4).map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            handleSuggestionClick(p);
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 hover:bg-luxury-ivory cursor-pointer border-b border-gray-50 last:border-0"
                        >
                          <img src={p.image} alt={p.name} className="h-8 w-6 object-cover rounded-md" referrerPolicy="no-referrer" />
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-luxury-black block truncate">{p.name}</span>
                            <span className="text-[8px] text-gray-500">₹{p.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Primary Navigation list */}
                <div className="space-y-1">
                  <span className="px-2 text-[9px] font-extrabold uppercase tracking-widest text-[#C5A059] block mb-2">Navigation</span>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (onViewChange) onViewChange('home');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 hover:bg-luxury-ivory rounded-lg text-left text-xs font-bold text-luxury-black group transition-colors ${activeView === 'home' ? 'bg-accent/15 text-accent' : ''}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ChevronRight className="h-4 w-4 text-accent" />
                      <span>Home</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (onViewChange) onViewChange('measurement');
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 hover:bg-luxury-ivory rounded-lg text-left text-xs font-bold text-luxury-black group transition-colors ${activeView === 'measurement' ? 'bg-accent/15 text-accent' : ''}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Ruler className="h-4 w-4 text-accent" />
                      <span>Digital Measurement Sheet</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onCustomTailorOpen();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-luxury-ivory rounded-lg text-left text-xs font-bold text-luxury-black group transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Scissors className="h-4 w-4 text-accent" />
                      <span>Custom Tailoring Studio</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-accent transition-colors" />
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      scrollToSection('new-arrivals');
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-luxury-ivory rounded-lg text-left text-xs font-bold text-luxury-black group transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="h-4 w-4 text-accent" />
                      <span>New Arrivals</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-accent transition-colors" />
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      scrollToSection('featured-collections');
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-luxury-ivory rounded-lg text-left text-xs font-bold text-luxury-black group transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Heart className="h-4 w-4 text-accent" />
                      <span>Featured Collections</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-accent transition-colors" />
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      scrollToSection('flash-sale');
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-luxury-ivory rounded-lg text-left text-xs font-bold text-luxury-black group transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Percent className="h-4 w-4 text-accent" />
                      <span>Special Offers & Deals</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-accent transition-colors" />
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      scrollToSection('partner-boutiques');
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-luxury-ivory rounded-lg text-left text-xs font-bold text-luxury-black group transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className="h-4 w-4 text-accent" />
                      <span>Verified Boutiques</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-accent transition-colors" />
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onDesignSystemOpen();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-luxury-ivory rounded-lg text-left text-xs font-bold text-luxury-black group transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="h-4 w-4 text-accent" />
                      <span>Design Playground</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-accent transition-colors" />
                  </button>
                </div>

                {/* Categories Accordion inside sidebar */}
                <div className="border-t border-gray-100 pt-3">
                  <button
                    onClick={() => setIsMobileCategoriesOpen(!isMobileCategoriesOpen)}
                    className="w-full flex items-center justify-between px-2 py-1 text-left"
                  >
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#C5A059]">Shop by Category</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-[#C5A059] transition-transform duration-300 ${isMobileCategoriesOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isMobileCategoriesOpen && (
                    <div className="mt-2 pl-2 space-y-1.5 animate-fade-in">
                      {(dbCategories && dbCategories.length > 0 ? dbCategories : categories).map((cat) => (
                        <div
                          key={cat.id || cat.name}
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            scrollToSection('categories-grid');
                          }}
                          className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-luxury-ivory rounded-lg cursor-pointer transition-colors"
                        >
                          <img src={cat.image} alt={cat.name} className="h-6 w-6 object-cover rounded-full border border-accent/20" referrerPolicy="no-referrer" />
                          <span className="text-[11px] font-bold text-luxury-black">{cat.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Orders inside sidebar */}
                <div className="border-t border-gray-100 pt-3">
                  <button
                    onClick={() => setIsMobileOrdersOpen(!isMobileOrdersOpen)}
                    className="w-full flex items-center justify-between px-2 py-1 text-left"
                  >
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#C5A059]">Track Orders</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-[#C5A059] transition-transform duration-300 ${isMobileOrdersOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isMobileOrdersOpen && (
                    <div className="mt-2 px-2 space-y-2 text-[10px] text-gray-500 bg-[#FAF8F5] p-2 rounded-lg border border-[#C5A059]/10">
                      <div className="border-b border-gray-100 pb-1.5">
                        <div className="flex justify-between font-bold text-gray-700">
                          <span>Order #VSB-8392</span>
                          <span className="text-orange-600 font-extrabold">In Tailoring</span>
                        </div>
                        <p className="text-[9px] mt-0.5">Custom Anarkali Suit • Elegance House</p>
                      </div>
                      <div>
                        <div className="flex justify-between font-bold text-gray-700">
                          <span>Order #VSB-7491</span>
                          <span className="text-green-600 font-extrabold">Delivered</span>
                        </div>
                        <p className="text-[9px] mt-0.5">Art Silk Saree • Royal Blue</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Client Notifications inside sidebar */}
                <div className="border-t border-gray-100 pt-3">
                  <button
                    onClick={() => setIsMobileNotifsOpen(!isMobileNotifsOpen)}
                    className="w-full flex items-center justify-between px-2 py-1 text-left"
                  >
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#C5A059]">Client Messages</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-[#C5A059] transition-transform duration-300 ${isMobileNotifsOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isMobileNotifsOpen && (
                    <div className="mt-2 space-y-1.5">
                      <div className="p-2 bg-[#FDFBF7] rounded-lg border-l-2 border-accent text-left">
                        <p className="text-[10px] font-bold text-luxury-black">✨ Fitting Confirmed</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">Your virtual custom measurement review is live today at 4:30 PM.</p>
                      </div>
                      <div className="p-2 bg-[#FDFBF7] rounded-lg border-l-2 border-accent text-left">
                        <p className="text-[10px] font-bold text-luxury-black">🔥 Lehenga Discount</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">Special 40% discount on custom-tailored lehengas applies at check-out!</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Sidebar Footer */}
              <div className="p-4 bg-[#FAF8F5] border-t border-accent/15 space-y-2">
                <div className="flex items-center gap-2 text-[10px] text-accent font-bold">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
                  <span>100% Guaranteed Fitting</span>
                </div>
                <p className="text-[8.5px] text-gray-400 leading-relaxed">
                  Every custom stitched gown, sherwani, and saree is backed by our signature boutique fit promise.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

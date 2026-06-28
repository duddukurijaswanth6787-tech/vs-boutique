/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, ShoppingBag, MapPin, Ruler, Calendar, Star, RefreshCw, 
  Bell, Gift, CreditCard, Shirt, Settings, HelpCircle, FileText, 
  LogOut, ChevronRight, Plus, Check, Info, ShieldCheck, Heart, ShoppingCart
} from 'lucide-react';
import { apiService, CustomOrder } from '../services/api';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  onCartOpen: () => void;
  onWishlistOpen: () => void;
  onMeasurementOpen: () => void;
  onBookingOpen: () => void;
}

// Initial Preset Data
const INITIAL_ADDRESSES = [
  { id: 'addr_1', type: 'Home', name: 'Jaswanth Duddukuri', phone: '+91 9876543210', line: 'Flat 402, Elite Meadows, Jubilee Hills', city: 'Hyderabad', pin: '500033', isDefault: true },
  { id: 'addr_2', type: 'Office', name: 'Jaswanth Duddukuri', phone: '+91 9876543210', line: 'Building 12, Mindspace IT Park, Madhapur', city: 'Hyderabad', pin: '500081', isDefault: false }
];

const INITIAL_BOOKINGS = [
  { id: 'bk_1', service: 'Virtual Master Tailor Consultation', date: '2026-06-29', time: '04:30 PM', mode: 'Video Call', status: 'Confirmed' },
  { id: 'bk_2', service: 'Physical Bridal Fitting Appointment', date: '2026-07-05', time: '11:00 AM', mode: 'In-Store (VS Boutique Hills)', status: 'Pending Approval' }
];

const INITIAL_REVIEWS = [
  { id: 'rv_1', product: 'Bespoke Silk Saree Custom Blouse', rating: 5, comment: 'Perfect sleeve length and exquisite zari work!', date: '2026-06-20' },
  { id: 'rv_2', product: 'Traditional Bridal Lehenga Choli', rating: 5, comment: 'Simply stunning fitting, feels absolute royalty.', date: '2026-05-15' }
];

const INITIAL_CARDS = [
  { id: 'cc_1', type: 'Visa', last4: '4839', holder: 'JASWANTH DUDDUKURI', expiry: '12/29' },
  { id: 'cc_2', type: 'Mastercard', last4: '9201', holder: 'JASWANTH DUDDUKURI', expiry: '08/30' }
];

export default function UserProfile({
  isOpen,
  onClose,
  onCartOpen,
  onWishlistOpen,
  onMeasurementOpen,
  onBookingOpen
}: UserProfileProps) {
  // Current active sub-view within the Profile drawer (null means main profile list)
  const [activeSubView, setActiveSubView] = useState<string | null>(null);

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(apiService.isAuthenticated());
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string | null>(null);

  // Bespoke Orders State
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);

  // Local State managers
  const [addresses, setAddresses] = useState(INITIAL_ADDRESSES);
  const [newAddressForm, setNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ type: 'Home', line: '', city: '', pin: '' });

  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewProduct, setNewReviewProduct] = useState('Classic Banarasi Kurti');
  const [newReviewRating, setNewReviewRating] = useState(5);

  const [cards, setCards] = useState(INITIAL_CARDS);
  const [newCard, setNewCard] = useState({ number: '', expiry: '', holder: 'JASWANTH DUDDUKURI' });
  const [showAddCard, setShowAddCard] = useState(false);

  const [stylePrefs, setStylePrefs] = useState({
    fabrics: ['Pure Silk', 'Velvet'],
    fits: ['Standard Fit'],
    garments: ['Bridal Lehengas', 'Designer Sarees']
  });

  const [settings, setSettings] = useState({
    emailNotif: true,
    whatsappUpdates: true,
    promoOffers: false
  });

  const [userName, setUserName] = useState('Jaswanth Duddukuri');
  const [userPhone, setUserPhone] = useState('+91 9876543210');
  const [userProfilePic, setUserProfilePic] = useState('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Fetch bespoke orders from backend API
  const fetchOrders = async () => {
    const data = await apiService.getOrders();
    setCustomOrders(data);
  };

  useEffect(() => {
    setIsAuthenticated(apiService.isAuthenticated());
    if (apiService.isAuthenticated()) {
      fetchOrders();
      const user = apiService.getCurrentUser();
      if (user) {
        setUserName(user.email.split('@')[0].toUpperCase());
      }
    }
  }, [isOpen]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      let res;
      if (authTab === 'login') {
        res = await apiService.login(authEmail, authPassword);
      } else {
        res = await apiService.register(authEmail, authPassword);
      }
      setIsAuthenticated(true);
      setUserName(res.user.email.split('@')[0].toUpperCase());
      alert(`✨ Member session authorized! Welcome back.`);
      fetchOrders();
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleLogout = () => {
    apiService.logout();
    setIsAuthenticated(false);
    setActiveSubView(null);
    setAuthEmail('');
    setAuthPassword('');
    alert('Logged out from royal atelier session.');
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.line || !newAddress.city || !newAddress.pin) return;
    const item = {
      id: `addr_${Date.now()}`,
      type: newAddress.type,
      name: userName,
      phone: userPhone,
      line: newAddress.line,
      city: newAddress.city,
      pin: newAddress.pin,
      isDefault: false
    };
    setAddresses([...addresses, item]);
    setNewAddress({ type: 'Home', line: '', city: '', pin: '' });
    setNewAddressForm(false);
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses(addresses.filter(a => a.id !== id));
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;
    const item = {
      id: `rv_${Date.now()}`,
      product: newReviewProduct,
      rating: newReviewRating,
      comment: newReviewText,
      date: new Date().toISOString().split('T')[0]
    };
    setReviews([item, ...reviews]);
    setNewReviewText('');
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCard.number.length < 4 || !newCard.expiry) return;
    const item = {
      id: `cc_${Date.now()}`,
      type: 'Visa',
      last4: newCard.number.slice(-4) || '9999',
      holder: newCard.holder.toUpperCase(),
      expiry: newCard.expiry
    };
    setCards([...cards, item]);
    setNewCard({ number: '', expiry: '', holder: userName });
    setShowAddCard(false);
  };

  const toggleStylePref = (category: 'fabrics' | 'fits' | 'garments', item: string) => {
    const list = stylePrefs[category];
    const newList = list.includes(item) ? list.filter(i => i !== item) : [...list, item];
    setStylePrefs({ ...stylePrefs, [category]: newList });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" id="user-profile-modal">
          <div className="absolute inset-0 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/60 transition-opacity backdrop-blur-xs"
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                className="pointer-events-auto w-screen max-w-md"
              >
                <div className="flex h-full flex-col bg-luxury-ivory shadow-2xl border-l border-accent/20 overflow-hidden">
                  
                  {/* Fixed Drawer Header */}
                  <div className="flex items-center justify-between border-b border-accent/20 px-6 py-5 bg-white shrink-0">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-accent" />
                      <h2 className="text-sm font-bold tracking-widest text-luxury-black font-sans uppercase">
                        {activeSubView ? activeSubView.replace('_', ' ') : 'Signature Profile'}
                      </h2>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {activeSubView && (
                        <button
                          onClick={() => setActiveSubView(null)}
                          className="text-xs font-semibold text-accent hover:underline uppercase tracking-wider px-2 py-1 bg-luxury-ivory rounded-lg transition-colors mr-2"
                        >
                          ← Back
                        </button>
                      )}
                      <button
                        onClick={onClose}
                        className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                        aria-label="Close profile drawer"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Panel Body */}
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                    
                    {/* SUB-VIEW TRANSITIONS */}
                    <AnimatePresence mode="wait">
                      {activeSubView === null ? (
                        !isAuthenticated ? (
                          <motion.div
                            key="auth_screen"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                          >
                            <div className="text-center pb-4 border-b border-accent/10">
                              <span className="text-[10px] tracking-widest text-accent font-extrabold uppercase font-sans block mb-1">Welcome to VS Boutique</span>
                              <h3 className="text-xl font-serif font-semibold text-luxury-black">Authorized Member Access</h3>
                              <p className="text-xs text-gray-500 mt-1">Unlock seamless digital measurement synchronization and bespoke order tracking by logging into your account.</p>
                            </div>

                            {/* Dual Tabs */}
                            <div className="flex border border-accent/15 rounded-lg overflow-hidden p-1 bg-luxury-ivory">
                              <button
                                type="button"
                                onClick={() => { setAuthTab('login'); setAuthError(null); }}
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${authTab === 'login' ? 'bg-accent text-white shadow-sm font-black' : 'text-gray-500 hover:text-luxury-black'}`}
                              >
                                Sign In
                              </button>
                              <button
                                type="button"
                                onClick={() => { setAuthTab('register'); setAuthError(null); }}
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${authTab === 'register' ? 'bg-accent text-white shadow-sm font-black' : 'text-gray-500 hover:text-luxury-black'}`}
                              >
                                Create Account
                              </button>
                            </div>

                            {authError && (
                              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium leading-relaxed">
                                ⚠️ {authError}
                              </div>
                            )}

                            <form onSubmit={handleAuthSubmit} className="space-y-4">
                              <div className="space-y-1.5 text-left">
                                <label className="block text-[10.5px] font-bold text-gray-400 uppercase tracking-widest">
                                  Email Address
                                </label>
                                <input
                                  type="email"
                                  required
                                  value={authEmail}
                                  onChange={(e) => setAuthEmail(e.target.value)}
                                  placeholder="e.g. customer@example.com"
                                  className="w-full bg-white border border-accent/25 rounded-xl px-3.5 py-3 text-xs focus:outline-none focus:border-accent font-medium text-luxury-black shadow-sm"
                                />
                              </div>

                              <div className="space-y-1.5 text-left">
                                <label className="block text-[10.5px] font-bold text-gray-400 uppercase tracking-widest">
                                  Password
                                </label>
                                <input
                                  type="password"
                                  required
                                  value={authPassword}
                                  onChange={(e) => setAuthPassword(e.target.value)}
                                  placeholder="Enter your secure password"
                                  className="w-full bg-white border border-accent/25 rounded-xl px-3.5 py-3 text-xs focus:outline-none focus:border-accent font-medium text-luxury-black shadow-sm"
                                />
                              </div>

                              <button
                                type="submit"
                                className="w-full py-3.5 bg-luxury-black hover:bg-accent text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer mt-2"
                              >
                                {authTab === 'login' ? 'Access Atelier Session' : 'Register Signature Profile'}
                              </button>
                            </form>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="main_menu"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                          >
                            {/* Profile Header Area */}
                            <div className="flex flex-col items-center text-center p-6 bg-white border border-accent/15 rounded-2xl shadow-luxury space-y-4 relative overflow-hidden">
                              <div className="absolute top-0 inset-x-0 h-1.5 bg-accent" />
                              
                              {/* Profile Photo */}
                              <div className="relative group">
                                <img
                                  src={userProfilePic}
                                  alt="User Profile Photo"
                                  className="h-20 w-20 rounded-full border-2 border-accent object-cover shadow-md group-hover:opacity-90 transition-opacity"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/45 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span>
                                </div>
                              </div>

                              {/* Info */}
                              <div>
                                <h3 className="text-lg font-serif font-semibold text-luxury-black">{userName}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">{apiService.getCurrentUser()?.email || userPhone}</p>
                              </div>

                              {/* Gold Member Crest */}
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/10 border border-accent/30 rounded-full text-accent font-sans text-[10px] font-extrabold uppercase tracking-widest animate-pulse">
                                <span>⭐ Gold Member</span>
                              </div>
                            </div>

                          <div className="border-t border-accent/10 my-2" />

                          {/* SECTION: 🛍 Shopping */}
                          <div className="space-y-2.5">
                            <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-1">
                              <span className="text-sm">🛍</span> Shopping
                            </h4>
                            <div className="bg-white rounded-xl border border-accent/15 divide-y divide-gray-100 overflow-hidden shadow-sm">
                              <button 
                                onClick={() => setActiveSubView('My Orders')}
                                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-luxury-ivory transition-colors group"
                              >
                                <span className="text-xs font-semibold text-luxury-black group-hover:text-accent transition-colors">• My Orders</span>
                                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                              </button>
                              <button 
                                onClick={() => { onClose(); onWishlistOpen(); }}
                                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-luxury-ivory transition-colors group"
                              >
                                <span className="text-xs font-semibold text-luxury-black group-hover:text-accent transition-colors">• Wishlist</span>
                                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                              </button>
                              <button 
                                onClick={() => { onClose(); onCartOpen(); }}
                                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-luxury-ivory transition-colors group"
                              >
                                <span className="text-xs font-semibold text-luxury-black group-hover:text-accent transition-colors">• Cart</span>
                                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                              </button>
                            </div>
                          </div>

                          <div className="border-t border-accent/10 my-2" />

                          {/* SECTION: Core Utilities */}
                          <div className="grid grid-cols-1 gap-2.5">
                            <button
                              onClick={() => setActiveSubView('My Addresses')}
                              className="flex items-center justify-between p-3.5 bg-white border border-accent/15 hover:border-accent rounded-xl text-left transition-colors group shadow-xs"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                                  <MapPin className="h-4 w-4" />
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-luxury-black block">My Addresses</span>
                                  <span className="text-[10px] text-gray-400">Manage digital home and office deliveries</span>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                            </button>

                            <button
                              onClick={() => { onClose(); onMeasurementOpen(); }}
                              className="flex items-center justify-between p-3.5 bg-white border border-accent/15 hover:border-accent rounded-xl text-left transition-colors group shadow-xs"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                                  <Ruler className="h-4 w-4" />
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-luxury-black block">My Measurements</span>
                                  <span className="text-[10px] text-gray-400">Configure your digital size profile</span>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                            </button>

                            <button
                              onClick={() => setActiveSubView('My Bookings')}
                              className="flex items-center justify-between p-3.5 bg-white border border-accent/15 hover:border-accent rounded-xl text-left transition-colors group shadow-xs"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                                  <Calendar className="h-4 w-4" />
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-luxury-black block">My Bookings</span>
                                  <span className="text-[10px] text-gray-400">Virtual fitting consultations & store visits</span>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                            </button>
                          </div>

                          <div className="border-t border-accent/10 my-2" />

                          {/* SECTION: Actions & Alerts */}
                          <div className="grid grid-cols-1 gap-2.5">
                            <button
                              onClick={() => setActiveSubView('Reviews')}
                              className="flex items-center justify-between p-3 bg-white border border-accent/10 hover:border-accent rounded-lg text-left transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <Star className="h-4 w-4 text-accent" />
                                <span className="text-xs font-bold text-luxury-black">Reviews</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                            </button>

                            <button
                              onClick={() => setActiveSubView('Returns & Exchanges')}
                              className="flex items-center justify-between p-3 bg-white border border-accent/10 hover:border-accent rounded-lg text-left transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <RefreshCw className="h-4 w-4 text-accent animate-spin-slow" />
                                <span className="text-xs font-bold text-luxury-black">Returns & Exchanges</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                            </button>

                            <button
                              onClick={() => setActiveSubView('Notifications')}
                              className="flex items-center justify-between p-3 bg-white border border-accent/10 hover:border-accent rounded-lg text-left transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <Bell className="h-4 w-4 text-accent" />
                                <span className="text-xs font-bold text-luxury-black">Notifications</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                            </button>
                          </div>

                          <div className="border-t border-accent/10 my-2" />

                          {/* SECTION: Preferences & Rewards */}
                          <div className="grid grid-cols-1 gap-2.5">
                            <button
                              onClick={() => setActiveSubView('Offers & Rewards')}
                              className="flex items-center justify-between p-3 bg-white border border-accent/10 hover:border-accent rounded-lg text-left transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <Gift className="h-4 w-4 text-accent" />
                                <span className="text-xs font-bold text-luxury-black">Offers & Rewards</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                            </button>

                            <button
                              onClick={() => setActiveSubView('Payment Methods')}
                              className="flex items-center justify-between p-3 bg-white border border-accent/10 hover:border-accent rounded-lg text-left transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <CreditCard className="h-4 w-4 text-accent" />
                                <span className="text-xs font-bold text-luxury-black">Payment Methods</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                            </button>

                            <button
                              onClick={() => setActiveSubView('Style Preferences')}
                              className="flex items-center justify-between p-3 bg-white border border-accent/10 hover:border-accent rounded-lg text-left transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <Shirt className="h-4 w-4 text-accent" />
                                <span className="text-xs font-bold text-luxury-black">Style Preferences</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                            </button>
                          </div>

                          <div className="border-t border-accent/10 my-2" />

                          {/* SECTION: Configurations & Support */}
                          <div className="grid grid-cols-1 gap-2.5">
                            <button
                              onClick={() => setActiveSubView('Settings')}
                              className="flex items-center justify-between p-3 bg-white border border-accent/10 hover:border-accent rounded-lg text-left transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <Settings className="h-4 w-4 text-accent" />
                                <span className="text-xs font-bold text-luxury-black">Settings</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                            </button>

                            <button
                              onClick={() => setActiveSubView('Help & Support')}
                              className="flex items-center justify-between p-3 bg-white border border-accent/10 hover:border-accent rounded-lg text-left transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <HelpCircle className="h-4 w-4 text-accent" />
                                <span className="text-xs font-bold text-luxury-black">Help & Support</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                            </button>

                            <button
                              onClick={() => setActiveSubView('Legal')}
                              className="flex items-center justify-between p-3 bg-white border border-accent/10 hover:border-accent rounded-lg text-left transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 text-accent" />
                                <span className="text-xs font-bold text-luxury-black">Legal</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                            </button>
                          </div>

                          <div className="border-t border-accent/10 my-2" />

                          {/* SECTION: Logout */}
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-red-50 hover:bg-red-100/70 border border-red-200 hover:border-red-300 rounded-xl text-red-600 text-xs font-bold uppercase tracking-wider transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                          </button>
                        </motion.div>
                      )
                    ) : (
                      <motion.div
                          key="sub_view"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-4"
                        >
                          {/* DYNAMIC RENDERING OF SELECTED SUB-VIEW */}
                          {activeSubView === 'My Orders' && (
                            <div className="space-y-3">
                              <p className="text-xs text-gray-500">Track and view detailed histories of your custom fits and bespoke checkout orders.</p>
                              
                              {customOrders.length === 0 ? (
                                <div className="p-8 text-center bg-white border border-accent/10 rounded-xl">
                                  <ShoppingBag className="h-10 w-10 text-accent/30 mx-auto stroke-1 mb-2" />
                                  <p className="text-xs text-gray-500 font-semibold">No custom orders found</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">Customize your design in the studio to submit a master-tailored fit order!</p>
                                </div>
                              ) : (
                                customOrders.map((order, idx) => (
                                  <div key={order.id || idx} className="p-4 bg-white border border-accent/15 rounded-xl space-y-3 shadow-xs text-left">
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                      <span className="text-xs font-bold text-luxury-black">Order #VSB-{order.id || (8300 + idx)}</span>
                                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full">
                                        {order.status || 'Stitching In Progress'}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-gray-600 space-y-1">
                                      <p><strong className="text-luxury-black">Product:</strong> {order.productName}</p>
                                      <p><strong className="text-luxury-black">Price:</strong> ₹{order.price}</p>
                                      <p><strong className="text-luxury-black">Submitted:</strong> {order.createdAt || 'Today'}</p>
                                      {order.lockedMeasurements && Object.keys(order.lockedMeasurements).length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                          <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">Locked Measurements:</p>
                                          <div className="grid grid-cols-2 gap-x-2 gap-y-1 bg-luxury-ivory/50 p-2 rounded-lg font-mono text-[9.5px]">
                                            {Object.entries(order.lockedMeasurements).map(([k, v]) => (
                                              <div key={k} className="flex justify-between">
                                                <span className="text-gray-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                                                <strong className="text-luxury-black">{v} in</strong>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                          {activeSubView === 'My Addresses' && (
                            <div className="space-y-4">
                              <p className="text-xs text-gray-500">Add, edit or set default shipping/billing addresses for luxury home delivery.</p>
                              
                              <div className="space-y-3">
                                {addresses.map((a) => (
                                  <div key={a.id} className="p-4 bg-white border border-accent/15 rounded-xl relative shadow-xs">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-bold text-luxury-black flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                                        {a.type} Delivery Address
                                      </span>
                                      {a.isDefault && (
                                        <span className="text-[8px] uppercase tracking-wider bg-accent text-white px-1.5 py-0.5 rounded-md font-bold">Default</span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-gray-600 font-semibold">{a.name}</p>
                                    <p className="text-[11px] text-gray-500 mt-0.5">{a.line}, {a.city} - {a.pin}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Phone: {a.phone}</p>
                                    
                                    <button
                                      onClick={() => handleDeleteAddress(a.id)}
                                      className="absolute right-3 bottom-3 text-[10px] text-red-500 hover:underline font-bold"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {!newAddressForm ? (
                                <button 
                                  onClick={() => setNewAddressForm(true)}
                                  className="w-full py-3 border border-dashed border-accent hover:border-accent-dark text-accent rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer bg-white"
                                >
                                  <Plus className="h-4 w-4" />
                                  <span>Add New Delivery Address</span>
                                </button>
                              ) : (
                                <form onSubmit={handleAddAddress} className="bg-white p-4 border border-accent/20 rounded-xl space-y-3 shadow-md">
                                  <h4 className="text-xs font-bold text-luxury-black border-b border-gray-100 pb-1.5">New Address Form</h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => setNewAddress({...newAddress, type: 'Home'})} className={`py-1.5 text-xs font-bold rounded-lg border ${newAddress.type === 'Home' ? 'bg-accent/10 border-accent text-accent' : 'border-gray-200'}`}>Home</button>
                                    <button type="button" onClick={() => setNewAddress({...newAddress, type: 'Office'})} className={`py-1.5 text-xs font-bold rounded-lg border ${newAddress.type === 'Office' ? 'bg-accent/10 border-accent text-accent' : 'border-gray-200'}`}>Office</button>
                                  </div>
                                  <input 
                                    type="text" 
                                    placeholder="Address Line (Flat, Street)" 
                                    value={newAddress.line} 
                                    onChange={e => setNewAddress({...newAddress, line: e.target.value})} 
                                    className="w-full p-2 border border-gray-200 text-xs rounded-lg"
                                    required
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <input 
                                      type="text" 
                                      placeholder="City" 
                                      value={newAddress.city} 
                                      onChange={e => setNewAddress({...newAddress, city: e.target.value})} 
                                      className="p-2 border border-gray-200 text-xs rounded-lg"
                                      required
                                    />
                                    <input 
                                      type="text" 
                                      placeholder="PIN Code" 
                                      value={newAddress.pin} 
                                      onChange={e => setNewAddress({...newAddress, pin: e.target.value})} 
                                      className="p-2 border border-gray-200 text-xs rounded-lg"
                                      required
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button type="button" onClick={() => setNewAddressForm(false)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-[10px] uppercase rounded-lg">Cancel</button>
                                    <button type="submit" className="flex-1 py-2 bg-accent hover:bg-accent-dark text-white font-bold text-[10px] uppercase rounded-lg">Save</button>
                                  </div>
                                </form>
                              )}
                            </div>
                          )}

                          {activeSubView === 'My Bookings' && (
                            <div className="space-y-4">
                              <p className="text-xs text-gray-500">Track bespoke digital appointments, video reviews, and premium boutique fit inspections.</p>
                              
                              <div className="space-y-3">
                                {bookings.map((b) => (
                                  <div key={b.id} className="p-4 bg-white border border-accent/15 rounded-xl space-y-2 shadow-xs">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-bold text-luxury-black">{b.service}</span>
                                      <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full ${b.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' : 'bg-orange-50 text-orange-700 border border-orange-150'}`}>
                                        {b.status}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-gray-500 pt-1.5 border-t border-gray-50">
                                      <p>📅 <strong className="text-gray-700">{b.date}</strong></p>
                                      <p>🕒 <strong className="text-gray-700">{b.time}</strong></p>
                                      <p className="col-span-2">💻 Mode: <strong className="text-gray-700">{b.mode}</strong></p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <button 
                                onClick={onBookingOpen}
                                className="w-full py-3.5 bg-accent hover:bg-accent-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
                              >
                                <span>Schedule New Virtual Fitting</span>
                              </button>
                            </div>
                          )}

                          {activeSubView === 'Reviews' && (
                            <div className="space-y-4">
                              <p className="text-xs text-gray-500">Share your thoughts on design aesthetics, fabric density, and tailoring precision.</p>
                              
                              <form onSubmit={handleAddReview} className="bg-white p-4 border border-accent/15 rounded-xl space-y-3 shadow-sm">
                                <h4 className="text-xs font-bold text-luxury-black">Add a review</h4>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Select Custom Fit Product</label>
                                  <select 
                                    value={newReviewProduct} 
                                    onChange={e => setNewReviewProduct(e.target.value)}
                                    className="w-full p-2 border border-gray-100 text-xs rounded-lg focus:outline-none focus:border-accent bg-luxury-ivory"
                                  >
                                    <option>Classic Banarasi Kurti</option>
                                    <option>Bespoke Bridal Saree Choli</option>
                                    <option>Traditional Wedding Lehenga</option>
                                  </select>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rating:</span>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button 
                                        type="button" 
                                        key={star} 
                                        onClick={() => setNewReviewRating(star)}
                                        className="text-amber-400 focus:outline-none text-xs"
                                      >
                                        ★
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <textarea 
                                  placeholder="How was the fitting accuracy? Comment on quality..." 
                                  value={newReviewText} 
                                  onChange={e => setNewReviewText(e.target.value)} 
                                  className="w-full p-2.5 border border-gray-150 text-xs rounded-lg min-h-16"
                                  required
                                />
                                <button type="submit" className="w-full py-2 bg-accent hover:bg-accent-dark text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors">
                                  Submit Review
                                </button>
                              </form>

                              <div className="space-y-3">
                                <h4 className="text-[11px] font-bold text-luxury-black border-b border-gray-100 pb-1">Past fitting reviews ({reviews.length})</h4>
                                {reviews.map((r) => (
                                  <div key={r.id} className="p-3 bg-white border border-gray-100 rounded-xl space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                      <strong className="text-luxury-black font-semibold">{r.product}</strong>
                                      <span className="text-gray-400">{r.date}</span>
                                    </div>
                                    <div className="flex text-amber-400 text-[10px]">
                                      {'★'.repeat(r.rating)}
                                    </div>
                                    <p className="text-[11px] text-gray-500 italic mt-1 font-sans">"{r.comment}"</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {activeSubView === 'Returns & Exchanges' && (
                            <div className="space-y-4">
                              <p className="text-xs text-gray-500">Every luxury stitch comes with our <strong>100% Fit Guarantee</strong>. If your tailored outfit requires adjustments, we offer complimentary pick-and-adjust.</p>
                              
                              <div className="p-4 bg-white border border-accent/15 rounded-xl space-y-3 shadow-xs">
                                <h4 className="text-xs font-bold text-luxury-black flex items-center gap-1.5">
                                  <ShieldCheck className="h-4 w-4 text-accent" />
                                  Stitch Correction Policy
                                </h4>
                                <ul className="text-[10.5px] text-gray-500 space-y-1.5 list-disc pl-4">
                                  <li>Complimentary master adjustment within 15 days of dispatch.</li>
                                  <li>Boutique door pick-up available across major metros.</li>
                                  <li>Adjustments overseen directly by senior designers.</li>
                                </ul>
                              </div>

                              <button 
                                onClick={() => alert('Our premium adjustment wizard is initializing. A representative will contact you at ' + userPhone)}
                                className="w-full py-3 bg-accent hover:bg-accent-dark text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-md"
                              >
                                Book Adjustment Collection
                              </button>
                            </div>
                          )}

                          {activeSubView === 'Notifications' && (
                            <div className="space-y-3">
                              <p className="text-xs text-gray-500">Stay up to date with custom fittings, order states, and exclusive designer arrivals.</p>
                              <div className="divide-y divide-gray-100 bg-white border border-accent/10 rounded-xl overflow-hidden shadow-sm">
                                <div className="p-3.5 text-left border-l-2 border-accent">
                                  <div className="flex justify-between items-center mb-0.5">
                                    <span className="text-xs font-bold text-luxury-black">✨ Tailoring Session Confirmed</span>
                                    <span className="text-[9px] text-gray-400">4:30 PM Today</span>
                                  </div>
                                  <p className="text-[10px] text-gray-400">Elegance House scheduled your virtual fit review at 4:30 PM today.</p>
                                </div>
                                <div className="p-3.5 text-left border-l-2 border-accent">
                                  <div className="flex justify-between items-center mb-0.5">
                                    <span className="text-xs font-bold text-luxury-black">🔥 Flash Sale Live</span>
                                    <span className="text-[9px] text-gray-400">June 27</span>
                                  </div>
                                  <p className="text-[10px] text-gray-400">Get up to 40% off on custom stitched Bridal Lehengas!</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeSubView === 'Offers & Rewards' && (
                            <div className="space-y-3">
                              <p className="text-xs text-gray-500">As a certified <strong>Gold Level Member</strong>, you unlock exclusive VIP perks and discount tokens.</p>
                              
                              <div className="p-4 bg-accent/10 border border-accent/30 rounded-xl space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-accent">GOLDEXCLUSIVE1000</span>
                                  <span className="px-2 py-0.5 bg-accent text-white text-[9px] font-black rounded-lg">Active</span>
                                </div>
                                <p className="text-[11px] text-luxury-black font-semibold">Flat ₹1,000 Off on Bespoke Stitching orders</p>
                                <p className="text-[9px] text-gray-400">Valid on bookings over ₹5,000. Expires Dec 2026.</p>
                              </div>

                              <div className="p-4 bg-white border border-gray-150 rounded-xl space-y-1.5">
                                <p className="text-xs font-bold text-luxury-black">🌟 Membership Benefits Status</p>
                                <div className="text-[10.5px] text-gray-500 space-y-1">
                                  <p>• Complimentary fitting alterations (Unlimited)</p>
                                  <p>• Free express doorstep boutique shipping</p>
                                  <p>• Pre-launch access to seasonal festive catalog</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeSubView === 'Payment Methods' && (
                            <div className="space-y-4">
                              <p className="text-xs text-gray-500">Manage your saved credit cards, luxury debit parameters, and verified UPI profiles.</p>
                              
                              <div className="space-y-2.5">
                                {cards.map(c => (
                                  <div key={c.id} className="p-4 bg-zinc-900 border border-zinc-700 rounded-xl text-white space-y-4 relative shadow-md overflow-hidden">
                                    <div className="absolute top-0 right-0 h-16 w-16 bg-white/5 rounded-full blur-xl" />
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <span className="text-[10px] uppercase font-bold tracking-widest text-accent">{c.type} Tokenized</span>
                                        <h4 className="text-xs font-mono font-bold mt-1">•••• •••• •••• {c.last4}</h4>
                                      </div>
                                      <span className="text-[9px] font-semibold text-zinc-400">Exp: {c.expiry}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[9.5px] font-bold font-sans tracking-wide">{c.holder}</span>
                                      <div className="h-4 w-6 bg-white/10 rounded-sm" />
                                    </div>
                                    <button 
                                      onClick={() => setCards(cards.filter(card => card.id !== c.id))}
                                      className="absolute right-3 top-3 text-[10px] text-red-400 hover:underline font-bold"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {!showAddCard ? (
                                <button 
                                  onClick={() => setShowAddCard(true)}
                                  className="w-full py-3 border border-dashed border-accent hover:border-accent-dark text-accent rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-white"
                                >
                                  <Plus className="h-4 w-4" />
                                  <span>Add Card</span>
                                </button>
                              ) : (
                                <form onSubmit={handleAddCard} className="bg-white p-4 border border-accent/20 rounded-xl space-y-3 shadow-md">
                                  <h4 className="text-xs font-bold text-luxury-black">Add New Card Info</h4>
                                  <input 
                                    type="text" 
                                    maxLength={16} 
                                    placeholder="16-Digit Card Number" 
                                    value={newCard.number} 
                                    onChange={e => setNewCard({...newCard, number: e.target.value})} 
                                    className="w-full p-2 border border-gray-200 text-xs rounded-lg"
                                    required
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <input 
                                      type="text" 
                                      placeholder="MM/YY" 
                                      value={newCard.expiry} 
                                      onChange={e => setNewCard({...newCard, expiry: e.target.value})} 
                                      className="p-2 border border-gray-200 text-xs rounded-lg"
                                      required
                                    />
                                    <input 
                                      type="text" 
                                      placeholder="Card Holder" 
                                      value={newCard.holder} 
                                      onChange={e => setNewCard({...newCard, holder: e.target.value})} 
                                      className="p-2 border border-gray-200 text-xs rounded-lg"
                                      required
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button type="button" onClick={() => setShowAddCard(false)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-[10px] uppercase rounded-lg">Cancel</button>
                                    <button type="submit" className="flex-1 py-2 bg-accent hover:bg-accent-dark text-white font-bold text-[10px] uppercase rounded-lg">Save</button>
                                  </div>
                                </form>
                              )}
                            </div>
                          )}

                          {activeSubView === 'Style Preferences' && (
                            <div className="space-y-4">
                              <p className="text-xs text-gray-500">Configure fabric filters, favorite garment silhouettes, and tailored fits to speed up design customization.</p>
                              
                              <div className="space-y-3 bg-white p-4 border border-accent/10 rounded-xl shadow-xs">
                                <div className="space-y-1.5">
                                  <h4 className="text-[10px] font-extrabold text-accent uppercase tracking-widest">Fabric Choice</h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {['Pure Silk', 'Velvet', 'Zari Banarasi', 'Georgette', 'Linen Cotton'].map(f => (
                                      <button 
                                        type="button" 
                                        key={f} 
                                        onClick={() => toggleStylePref('fabrics', f)}
                                        className={`px-2.5 py-1 text-[10.5px] rounded-full border transition-all ${stylePrefs.fabrics.includes(f) ? 'bg-accent/15 border-accent text-accent font-bold' : 'border-gray-200 text-gray-500'}`}
                                      >
                                        {f}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-1.5 border-t border-gray-50 pt-3">
                                  <h4 className="text-[10px] font-extrabold text-accent uppercase tracking-widest">Preferred Fit</h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {['Snug / Sculpted', 'Standard Fit', 'Relaxed / Flowing'].map(f => (
                                      <button 
                                        type="button" 
                                        key={f} 
                                        onClick={() => toggleStylePref('fits', f)}
                                        className={`px-2.5 py-1 text-[10.5px] rounded-full border transition-all ${stylePrefs.fits.includes(f) ? 'bg-accent/15 border-accent text-accent font-bold' : 'border-gray-200 text-gray-500'}`}
                                      >
                                        {f}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-1.5 border-t border-gray-50 pt-3">
                                  <h4 className="text-[10px] font-extrabold text-accent uppercase tracking-widest">Garment Preference</h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {['Bridal Lehengas', 'Designer Sarees', 'Classic Anarkalis', 'Kurtis Cholis', 'Modern Indo-Western'].map(g => (
                                      <button 
                                        type="button" 
                                        key={g} 
                                        onClick={() => toggleStylePref('garments', g)}
                                        className={`px-2.5 py-1 text-[10.5px] rounded-full border transition-all ${stylePrefs.garments.includes(g) ? 'bg-accent/15 border-accent text-accent font-bold' : 'border-gray-200 text-gray-500'}`}
                                      >
                                        {g}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeSubView === 'Settings' && (
                            <div className="space-y-4">
                              <p className="text-xs text-gray-500">Manage signature account profile specifications and alert/updates preferences.</p>
                              
                              <div className="bg-white p-4 border border-accent/15 rounded-xl space-y-4 shadow-xs">
                                <h4 className="text-xs font-bold text-luxury-black border-b border-gray-100 pb-1">Personal Details</h4>
                                <div className="space-y-2.5">
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Signature Name</label>
                                    {isEditingProfile ? (
                                      <input 
                                        type="text" 
                                        value={userName} 
                                        onChange={e => setUserName(e.target.value)} 
                                        className="w-full p-2 border border-accent text-xs rounded-lg bg-transparent"
                                      />
                                    ) : (
                                      <p className="text-xs font-bold text-luxury-black">{userName}</p>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Phone Number</label>
                                    {isEditingProfile ? (
                                      <input 
                                        type="text" 
                                        value={userPhone} 
                                        onChange={e => setUserPhone(e.target.value)} 
                                        className="w-full p-2 border border-accent text-xs rounded-lg bg-transparent"
                                      />
                                    ) : (
                                      <p className="text-xs text-gray-600">{userPhone}</p>
                                    )}
                                  </div>
                                </div>

                                <button 
                                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                                  className="w-full py-2 bg-luxury-ivory hover:bg-accent/10 border border-accent/25 hover:border-accent text-accent font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors"
                                >
                                  {isEditingProfile ? 'Save Signature Details' : 'Edit Personal Info'}
                                </button>
                              </div>

                              <div className="bg-white p-4 border border-accent/10 rounded-xl space-y-3 shadow-xs">
                                <h4 className="text-xs font-bold text-luxury-black border-b border-gray-100 pb-1">Alert Preferences</h4>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11.5px] text-gray-600">Email Notifications</span>
                                    <input 
                                      type="checkbox" 
                                      checked={settings.emailNotif} 
                                      onChange={() => setSettings({...settings, emailNotif: !settings.emailNotif})}
                                      className="accent-accent"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11.5px] text-gray-600">WhatsApp Fit Reminders</span>
                                    <input 
                                      type="checkbox" 
                                      checked={settings.whatsappUpdates} 
                                      onChange={() => setSettings({...settings, whatsappUpdates: !settings.whatsappUpdates})}
                                      className="accent-accent"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11.5px] text-gray-600">Promo & Festive Offer Updates</span>
                                    <input 
                                      type="checkbox" 
                                      checked={settings.promoOffers} 
                                      onChange={() => setSettings({...settings, promoOffers: !settings.promoOffers})}
                                      className="accent-accent"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeSubView === 'Help & Support' && (
                            <div className="space-y-4">
                              <p className="text-xs text-gray-500">Need design consulting or sizing support? Speak directly to our master team.</p>
                              
                              <div className="p-4 bg-white border border-accent/15 rounded-xl space-y-3.5 shadow-xs">
                                <h4 className="text-xs font-bold text-luxury-black border-b border-gray-100 pb-1">Instant Support Hotlines</h4>
                                <div className="text-[11px] text-gray-600 space-y-2">
                                  <p>📞 <strong>Phone:</strong> +91 1800 234 5678 (Toll Free)</p>
                                  <p>✉️ <strong>Email:</strong> designer@vsboutique.com</p>
                                  <p>🕒 <strong>Hours:</strong> 10:00 AM to 8:00 PM IST</p>
                                </div>
                              </div>

                              <button 
                                onClick={() => alert('Launching design chat support...')}
                                className="w-full py-3 bg-accent hover:bg-accent-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider text-center transition-colors shadow-md"
                              >
                                Live Chat with Designer
                              </button>
                            </div>
                          )}

                          {activeSubView === 'Legal' && (
                            <div className="space-y-3">
                              <p className="text-xs text-gray-500">Read our premium services agreement, terms, and data safety guarantee.</p>
                              <div className="p-3.5 bg-white border border-gray-150 rounded-xl max-h-80 overflow-y-auto text-[10px] text-gray-400 space-y-2 font-sans">
                                <h4 className="font-bold text-gray-700">1. Sizing Privacy Gaurantee</h4>
                                <p>Your digital fitting measurement data (Bust, Waist, Hips, Sleeve, Choli details) are strictly stored and used solely for custom tailoring checkout and fit accuracy. We never sell or share biometric information with third parties.</p>
                                <h4 className="font-bold text-gray-700 mt-2">2. Custom Order Commitment</h4>
                                <p>Every order containing customized master tailoring cannot be canceled or refunded once stitching begins. We stand behind our work with our 100% Fit Alteration commitment to tweak garments until you are satisfied.</p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>

                  {/* Fixed Drawer Footer */}
                  <div className="border-t border-accent/15 px-6 py-4 bg-white text-center text-[10px] font-sans font-bold tracking-widest text-[#C5A059] shrink-0">
                    VS BOUTIQUE • CROWN MEMBER ATELIER
                  </div>

                </div>
              </motion.div>
            </div>

          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

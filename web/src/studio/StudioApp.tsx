/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ShoppingBag, Heart, Scissors, Home, Sparkles, X, ChevronRight, Check, LayoutGrid, Search, User } from 'lucide-react';
import { Product, CartItem, WishlistItem, Boutique } from './types';

// Import Modular Components
import Header from './components/Header';
import Hero from './components/Hero';
import TrustBadges from './components/TrustBadges';
import Categories from './components/Categories';
import Collections from './components/Collections';
import ProductSection from './components/ProductSection';
import TailoringServices from './components/TailoringServices';
import Boutiques from './components/Boutiques';
import StatsAndTestimonials from './components/StatsAndTestimonials';
import FlashSaleAndNewsletter from './components/FlashSaleAndNewsletter';
import Footer from './components/Footer';
import CartWishlistDrawers from './components/CartWishlistDrawers';
import UserProfile from './components/UserProfile';
import InteractiveTailoringHub from './components/InteractiveTailoringHub';

import api from '../services/api';

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [notificationCount, setNotificationCount] = useState(2);

  // Modal / Slide-over Drawers States initialized dynamically from the URL path for deep linking
  const path = window.location.pathname;
  const [activeView, setActiveView] = useState<'home' | 'measurement'>(
    path.includes('tailoring') || path.includes('measurements') ? 'measurement' : 'home'
  );
  const [isCartOpen, setIsCartOpen] = useState(path.includes('cart'));
  const [isWishlistOpen, setIsWishlistOpen] = useState(path.includes('wishlist'));
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(path.includes('profile') || path.includes('orders'));
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeBoutique, setActiveBoutique] = useState<Boutique | null>(null);
  const [storefrontData, setStorefrontData] = useState<any>(null);

  // Simple Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Fetch dynamic compiled layout from database
  useEffect(() => {
    async function loadDynamicStorefront() {
      const boutiqueIdMatch = window.location.pathname.match(/\/boutique\/([^\/]+)/);
      const bId = boutiqueIdMatch ? boutiqueIdMatch[1] : null;
      if (!bId) return;

      try {
        const res = await api.get(`/api/v1/cms/generator/preview/${bId}`);
        if (res.data && res.data.success && res.data.theme) {
          setStorefrontData(res.data);
          
          // Inject custom design tokens as CSS variables
          const colors = res.data.theme.colorsLight;
          if (colors) {
            if (colors.primary) document.documentElement.style.setProperty('--color-primary', colors.primary);
            if (colors.secondary) document.documentElement.style.setProperty('--color-secondary', colors.secondary);
            if (colors.background) document.documentElement.style.setProperty('--color-bg', colors.background);
          }
        }
      } catch (err) {
        console.warn('Storefront compile data not found, falling back to static default.', err);
      }
    }
    loadDynamicStorefront();
  }, []);

  // Synchronize cart with localStorage for durability
  useEffect(() => {
    const savedCart = localStorage.getItem('vs_cart');
    const savedWish = localStorage.getItem('vs_wish');
    if (savedCart) setCartItems(JSON.parse(savedCart));
    if (savedWish) setWishlistItems(JSON.parse(savedWish));
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCartItems(newCart);
    localStorage.setItem('vs_cart', JSON.stringify(newCart));
  };

  const saveWishlist = (newWish: WishlistItem[]) => {
    setWishlistItems(newWish);
    localStorage.setItem('vs_wish', JSON.stringify(newWish));
  };

  // Add item to cart
  const handleAddToCart = (
    product: Product,
    size: string,
    color: string,
    isCustomStitched: boolean,
    stitchingNotes: string
  ) => {
    const stitchingPrice = isCustomStitched ? 999 : 0;
    // Generate unique composite key
    const uniqueId = `${product.id}_${size}_${color}_${isCustomStitched ? 'stitched' : 'plain'}`;

    const existingIndex = cartItems.findIndex((item) => item.id === uniqueId);
    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      saveCart(updated);
    } else {
      const newItem: CartItem = {
        id: uniqueId,
        product,
        quantity: 1,
        selectedSize: size || 'M',
        selectedColor: color || 'Default',
        isCustomStitched,
        stitchingNotes: stitchingNotes || undefined,
        stitchingPrice
      };
      saveCart([...cartItems, newItem]);
    }
    showToast(`🛒 ${product.name} added to your Fitting Cart!`);
  };

  // Update item quantity
  const handleUpdateQuantity = (id: string, qty: number) => {
    const updated = cartItems.map((item) => {
      if (item.id === id) {
        return { ...item, quantity: qty };
      }
      return item;
    });
    saveCart(updated);
  };

  // Remove item from cart
  const handleRemoveFromCart = (id: string) => {
    const updated = cartItems.filter((item) => item.id !== id);
    saveCart(updated);
    showToast('🗑️ Item removed from fitting cart.');
  };

  // Toggle items in wishlist
  const handleToggleWishlist = (product: Product) => {
    const index = wishlistItems.findIndex((item) => item.product.id === product.id);
    if (index > -1) {
      const updated = wishlistItems.filter((item) => item.product.id !== product.id);
      saveWishlist(updated);
      showToast('💔 Removed from Wishlist.');
    } else {
      const newItem: WishlistItem = {
        id: `wish_${product.id}`,
        product
      };
      saveWishlist([...wishlistItems, newItem]);
      showToast('💖 Saved to Wishlist!');
    }
  };

  // Transfer item from wishlist directly into cart
  const handleAddToCartFromWishlist = (product: Product) => {
    handleAddToCart(product, 'M', 'Default', false, '');
    // Optionally remove from wishlist
    const updatedWishlist = wishlistItems.filter((item) => item.product.id !== product.id);
    saveWishlist(updatedWishlist);
    setIsWishlistOpen(false);
    setIsCartOpen(true);
  };

  const handleCheckoutSuccess = () => {
    saveCart([]); // Clear cart
    setIsCartOpen(false);
    showToast('🎉 Order confirmed! Master tailoring expert notified.');
  };

  const wishlistIds = new Set<string>(wishlistItems.map((item) => item.product.id));

  return (
    <div className="min-h-screen flex flex-col justify-between bg-luxury-ivory text-luxury-charcoal font-sans select-none relative overflow-x-hidden pb-14 md:pb-0">
      
      {/* Dynamic Global Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-50 bg-luxury-black text-white px-5 py-3 rounded-xl border border-accent/30 shadow-luxury flex items-center gap-2.5 animate-bounce text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="h-4.5 w-4.5 text-accent animate-pulse" />
          {toastMessage}
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:text-accent font-black">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 1. Header Layout */}
      <Header
        onWishlistOpen={() => setIsWishlistOpen(true)}
        onCartOpen={() => setIsCartOpen(true)}
        wishlistCount={wishlistItems.length}
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        notificationCount={notificationCount}
        onProductClick={setActiveProduct}
        onCustomTailorOpen={() => setIsBookingOpen(true)}
        onDesignSystemOpen={() => setIsProfileOpen(!isProfileOpen)}
        activeView={activeView}
        onViewChange={(view) => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* 2. Premium User Profile Drawer */}
      <UserProfile
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onCartOpen={() => setIsCartOpen(true)}
        onWishlistOpen={() => setIsWishlistOpen(true)}
        onMeasurementOpen={() => {
          setActiveView('measurement');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onBookingOpen={() => setIsBookingOpen(true)}
      />

      {/* 3. Main Content Blocks */}
      <main className="flex-1">
        {activeView === 'home' ? (
          <>
            {storefrontData ? (
              <div className="space-y-12 pb-16">
                {storefrontData.pages
                  ?.find((p: any) => p.slug === 'home')
                  ?.components?.sort((a: any, b: any) => a.order - b.order)
                  ?.map((comp: any, idx: number) => {
                    if (comp.type === 'Hero') {
                      return (
                        <div key={idx} className="relative bg-luxury-cream text-center py-24 px-6 rounded-2xl border border-accent/15 max-w-[1400px] mx-auto mt-6 shadow-sm overflow-hidden">
                          <div className="absolute inset-0 opacity-10 bg-radial-gradient from-accent to-transparent pointer-events-none" />
                          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                            <span className="text-xs uppercase tracking-widest text-accent font-extrabold" style={{ color: 'var(--color-primary)' }}>AI Generated Custom Couture</span>
                            <h1 className="text-4xl sm:text-5xl font-serif italic font-semibold text-luxury-black leading-tight">
                              {comp.contentPayload?.['home-hero-headline'] || 'Elegance Redefined'}
                            </h1>
                            <p className="text-sm text-gray-500 max-w-xl mx-auto">
                              Handcrafted premium apparel tailored dynamically matching your unique blueprint measurements.
                            </p>
                            <div className="flex gap-4 justify-center">
                              <button 
                                onClick={() => showToast('🛒 Initiating customized dress fitting session...')}
                                className="px-6 py-2.5 bg-luxury-black text-white hover:bg-accent text-xs font-semibold uppercase tracking-wider rounded-xl transition-all"
                                style={{ backgroundColor: 'var(--color-primary)' }}
                              >
                                Customize Design
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    if (comp.type === 'ProductGrid') {
                      return (
                        <div key={idx} className="max-w-[1400px] mx-auto px-4 md:px-8 space-y-6 mt-12" id="new-arrivals">
                          <div className="text-center md:text-left border-b border-accent/15 pb-4 flex justify-between items-end">
                            <div>
                              <span className="text-[10px] tracking-widest text-accent font-extrabold uppercase font-sans block mb-1">Discover</span>
                              <h2 className="text-3.5xl font-serif italic font-semibold text-luxury-black" style={{ color: 'var(--color-primary)' }}>
                                {comp.contentPayload?.['home-featured-title'] || 'Boutique Catalog'}
                              </h2>
                            </div>
                          </div>
                          <ProductSection
                            onAddToCart={handleAddToCart}
                            onToggleWishlist={handleToggleWishlist}
                            wishlistIds={wishlistIds}
                            activeProduct={activeProduct}
                            setActiveProduct={setActiveProduct}
                          />
                        </div>
                      );
                    }
                    return null;
                  })
                }
              </div>
            ) : (
              <>
                {/* Split Hero */}
                <Hero
                  onExploreClick={() => {
                    const el = document.getElementById('new-arrivals');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  onVideoClick={() => {
                    showToast('🎥 Loading VS Boutique exclusive digital ramp show video...');
                  }}
                />

                {/* Trust Badges Bar */}
                <TrustBadges />

                {/* Circular Categories */}
                <Categories
                  onCategoryClick={(id) => {
                    const el = document.getElementById('new-arrivals');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    showToast(`Browsing custom designs in ${id}...`);
                  }}
                />

                {/* Collections */}
                <Collections
                  onCollectionClick={(id) => {
                    const el = document.getElementById('new-arrivals');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    showToast(`Loading collection ${id}...`);
                  }}
                />

                {/* Side-by-Side Product grids (New Arrivals + Trending Now) */}
                <ProductSection
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                  wishlistIds={wishlistIds}
                  activeProduct={activeProduct}
                  setActiveProduct={setActiveProduct}
                />

                {/* Our Tailoring Services */}
                <TailoringServices
                  isBookingOpen={isBookingOpen}
                  onBookingClose={() => setIsBookingOpen(false)}
                  onBookingOpen={() => setIsBookingOpen(true)}
                />

                {/* Partner Boutiques */}
                <Boutiques
                  onBoutiqueSelect={setActiveBoutique}
                  activeBoutique={activeBoutique}
                  setActiveBoutique={setActiveBoutique}
                />

                {/* Stats Strip & Testimonials slider */}
                <StatsAndTestimonials />

                {/* Flash Sale countdown sale banner & Newsletter stay in style */}
                <FlashSaleAndNewsletter />
              </>
            )}
          </>
        ) : (
          <div className="py-12 px-4 md:px-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in">
            <div className="text-center md:text-left border-b border-accent/15 pb-4">
              <span className="text-[10px] tracking-widest text-accent font-extrabold uppercase font-sans block mb-1">Your Virtual Studio</span>
              <h2 className="text-3xl font-serif italic font-semibold text-luxury-black">Digital Measurement Profile</h2>
              <p className="text-sm text-gray-500 mt-1">Configure your personalized measurement parameters below or select standard presets to achieve a flawless, master-tailored fit.</p>
            </div>
            
            <InteractiveTailoringHub />
          </div>
        )}
      </main>

      {/* 4. Footer */}
      <Footer />

      {/* 5. Drawers (Cart and Wishlist slide outs) & checkout wizard modals */}
      <CartWishlistDrawers
        isCartOpen={isCartOpen}
        onCartClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        isWishlistOpen={isWishlistOpen}
        onWishlistClose={() => setIsWishlistOpen(false)}
        wishlistItems={wishlistItems}
        onRemoveFromWishlist={(id) => {
          const item = wishlistItems.find(w => w.id === id);
          if (item) handleToggleWishlist(item.product);
        }}
        onAddToCartFromWishlist={handleAddToCartFromWishlist}
        onCheckoutSuccess={handleCheckoutSuccess}
      />

      {/* 6. RESPONSIVE THUMBS APP-LIKE BOTTOM BAR (Tablet/Mobile Only for easy reach!) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[56px] bg-white border-t border-accent/15 flex items-center justify-around px-2 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {/* Tab 1: Home */}
        <button
          onClick={() => {
            setActiveView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center justify-center flex-1 h-full text-luxury-black hover:text-accent transition-colors group"
          aria-label="Home"
        >
          <Home className="h-[18px] w-[18px] text-luxury-black group-hover:text-accent transition-transform group-active:scale-95" />
          <span className="text-[8.5px] font-bold mt-1 text-gray-500 group-hover:text-accent uppercase tracking-wider font-sans">Home</span>
        </button>

        {/* Tab 2: Category */}
        <button
          onClick={() => {
            const el = document.getElementById('categories-grid');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex flex-col items-center justify-center flex-1 h-full text-luxury-black hover:text-accent transition-colors group"
          aria-label="Category"
        >
          <LayoutGrid className="h-[18px] w-[18px] text-luxury-black group-hover:text-accent transition-transform group-active:scale-95" />
          <span className="text-[8.5px] font-bold mt-1 text-gray-500 group-hover:text-accent uppercase tracking-wider font-sans">Category</span>
        </button>

        {/* Tab 3: Search */}
        <button
          onClick={() => {
            const input = document.getElementById('mobile-header-search-input');
            if (input) {
              input.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => {
                input.focus();
              }, 400);
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex flex-col items-center justify-center flex-1 h-full text-luxury-black hover:text-accent transition-colors group"
          aria-label="Search mobile navigation"
        >
          <Search className="h-[18px] w-[18px] text-luxury-black group-hover:text-accent transition-transform group-active:scale-95" />
          <span className="text-[8.5px] font-bold mt-1 text-gray-500 group-hover:text-accent uppercase tracking-wider font-sans">Search</span>
        </button>

        {/* Tab 4: Wishlist */}
        <button
          onClick={() => setIsWishlistOpen(true)}
          className="flex flex-col items-center justify-center flex-1 h-full text-luxury-black hover:text-accent transition-colors relative group"
          aria-label="Wishlist"
        >
          <div className="relative">
            <Heart className="h-[18px] w-[18px] text-luxury-black group-hover:text-accent transition-transform group-active:scale-95" />
            {wishlistItems.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[8px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center">
                {wishlistItems.length}
              </span>
            )}
          </div>
          <span className="text-[8.5px] font-bold mt-1 text-gray-500 group-hover:text-accent uppercase tracking-wider font-sans">Wishlist</span>
        </button>

        {/* Tab 5: Account (Profile) */}
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex flex-col items-center justify-center flex-1 h-full text-luxury-black hover:text-accent transition-colors group"
          aria-label="Account"
        >
          <User className="h-[18px] w-[18px] text-luxury-black group-hover:text-accent transition-transform group-active:scale-95" />
          <span className="text-[8.5px] font-bold mt-1 text-gray-500 group-hover:text-accent uppercase tracking-wider font-sans">Account</span>
        </button>
      </div>

    </div>
  );
}

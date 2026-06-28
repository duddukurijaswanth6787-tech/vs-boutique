import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Star, Clock, Shield, Scissors, Sparkles, Percent, Store, History, Heart, Truck, Award, ArrowUp, Zap } from 'lucide-react';
import CustomerLayout from '../../../../components/CustomerLayoutPreview';
import { getPublicProducts, getPublicBoutiques, getActiveCategories } from '@core/services';
import { useCustomerAuth } from '@core/contexts';
import { useWishlist } from '@core/contexts';
import PremiumImage from '@core/components/ui/PremiumImage';
import { IMAGES, resolveServiceImage } from '@core/services';
import ProductCard from '@core/components/commerce/ProductCard';
import BoutiqueCard from '@core/components/commerce/BoutiqueCard';
import ServiceCard from '@core/components/commerce/ServiceCard';
import Button from '@core/components/ui/Button';
import IconButton from '@core/components/ui/IconButton';
import Card from '@core/components/ui/Card';
import FAB from '@core/components/ui/FAB';

const CATEGORIES = [
  { name: 'Sarees', image: 'https://images.unsplash.com/photo-1610030470298-400c1110f631?w=400&q=80&auto=format&fit=crop' },
  { name: 'Lehengas', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&q=80&auto=format&fit=crop' },
  { name: 'Kurtis', image: 'https://images.unsplash.com/photo-1608748010899-18f300247112?w=400&q=80&auto=format&fit=crop' },
  { name: 'Dresses', image: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=400&q=80&auto=format&fit=crop' },
  { name: 'Menswear', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80&auto=format&fit=crop' },
  { name: 'Kidswear', image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=400&q=80&auto=format&fit=crop' },
  { name: 'Blouses', image: 'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?w=400&q=80&auto=format&fit=crop' },
  { name: 'Fabrics', image: 'https://images.unsplash.com/photo-1528576285816-57a5e4163220?w=400&q=80&auto=format&fit=crop' },
  { name: 'Accessories', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&q=80&auto=format&fit=crop' },
  { name: 'Custom Design', image: 'https://images.unsplash.com/photo-1558603668-6570496b66f8?w=400&q=80&auto=format&fit=crop' },
];

const HERO_SLIDES = [
  {
    title: 'Summer Collection 2026',
    subtitle: 'Light fabrics, vibrant patterns — upgrade your wardrobe',
    cta: 'Shop Summer Collection',
    image: IMAGES.hero.summer,
    tag: 'NEW SEASON',
    color: 'from-rose-900/80 to-rose-950/80',
  },
  {
    title: 'Custom Stitching',
    subtitle: 'Get the perfect fit with our expert tailors. Flat ₹200 off on first order.',
    cta: 'Book Now',
    image: IMAGES.hero.tailoring,
    tag: 'LIMITED OFFER',
    color: 'from-gray-900/80 to-gray-950/80',
  },
  {
    title: 'Bridal Collection',
    subtitle: 'Exclusive lehengas, sarees, and gowns for your special day',
    cta: 'Explore Bridal',
    image: IMAGES.hero.bridal,
    tag: 'PREMIUM',
    color: 'from-amber-900/80 to-amber-950/80',
  },
];

const FEATURED_COLLECTIONS = [
  { name: 'Festive Edit', items: 'For Every Celebration', image: 'https://images.unsplash.com/photo-1610030470298-400c1110f631?w=600&q=80&auto=format&fit=crop', color: 'from-amber-950/80 to-amber-900/60' },
  { name: 'Designer Picks', items: 'Handpicked Just For You', image: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=600&q=80&auto=format&fit=crop', color: 'from-gray-950/80 to-gray-900/60' },
  { name: 'Wedding Collection', items: 'Make Every Moment Special', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80&auto=format&fit=crop', color: 'from-red-950/80 to-red-900/60' },
  { name: 'Lounge Wear', items: 'Comfort Meets Style', image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80&auto=format&fit=crop', color: 'from-blue-950/80 to-blue-900/60' },
];

const CustomerHomePreview = () => {
  const navigate = useNavigate();
  const { customer, isAuthenticated } = useCustomerAuth();
  const { items: wishlistItems, add: addWishlist, remove: removeWishlist } = useWishlist();
  const [heroIdx, setHeroIdx] = useState(0);
  const { data: dbCategories = [] } = useQuery({
    queryKey: ['storefrontActiveCategories'],
    queryFn: getActiveCategories
  });
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [heroSettings, setHeroSettings] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchSettings = async () => {
      try {
        const res = await import('../../../../services/api.ts').then(m => m.api.getSiteSettings());
        if (res && res.hero_banner && active) {
          setHeroSettings(res.hero_banner);
        }
      } catch (err) {
        console.warn('Failed to load hero settings in CustomerHomePreview:', err);
      }
    };
    fetchSettings();
    return () => { active = false; };
  }, []);

  const [recentlyViewed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recentlyViewed') || '[]'); } catch { return []; }
  });
  const sectionRefs = useRef([]);

  const activeSlides = useMemo(() => {
    if (heroSettings && Array.isArray(heroSettings.banners) && heroSettings.banners.length > 0) {
      return heroSettings.banners;
    }
    return HERO_SLIDES;
  }, [heroSettings]);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const delay = (heroSettings?.autoplayInterval || 5) * 1000;
    const iv = setInterval(() => {
      setHeroIdx(i => (i + 1) % activeSlides.length);
    }, delay);
    return () => clearInterval(iv);
  }, [activeSlides, heroSettings]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const observers = sectionRefs.current.map((ref) => {
      if (!ref) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
            observer.unobserve(entry.target);
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(ref);
      return observer;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  const { data: productsData } = useQuery({
    queryKey: ['public-products', { sort: 'newest', limit: 12 }],
    queryFn: () => getPublicProducts({ sort: 'newest', limit: 12 }),
  });
  const { data: trendingData } = useQuery({
    queryKey: ['public-products-trending', { sort: 'price_desc', limit: 10 }],
    queryFn: () => getPublicProducts({ sort: 'price_desc', limit: 10 }),
  });
  const { data: boutiquesData } = useQuery({
    queryKey: ['boutiques-list-public'],
    queryFn: getPublicBoutiques,
    retry: false,
  });

  const products = productsData?.data || [];
  const trending = useMemo(() => trendingData?.data || [], [trendingData]);
  const boutiques = useMemo(() => Array.isArray(boutiquesData) ? boutiquesData : boutiquesData?.boutiques || [], [boutiquesData]);
  const wishlistIds = useMemo(() => new Set(wishlistItems.map(w => w.productId)), [wishlistItems]);
  const reviewCounts = useMemo(() => trending.map((_, i) => 47 + (i * 31) % 200), [trending]);

  return (
    <CustomerLayout>
      {/* ── GREETING BANNER ─────────────────────────── */}
      {isAuthenticated && customer?.name && (
        <div className="bg-gradient-to-r from-primary via-primary/95 to-accent/90 text-white">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3 md:py-4">
            <p className="text-sm md:text-base font-medium flex items-center gap-2">
              <Zap size={16} className="text-amber-300" />
              Welcome back, <span className="font-bold">{customer.name.split(' ')[0]}!</span>
              <span className="hidden md:inline text-white/70">— Discover what's new today</span>
            </p>
          </div>
        </div>
      )}

      {/* ── HERO BANNER (Redesigned Split Layout) ────── */}
      <section className="relative bg-[#FDFBF7] py-12 lg:py-16 overflow-hidden border-b border-[#d2c5b1]/10">
        <div className="container-luxury">
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-[480px] lg:h-[540px]">
            {/* Left Side Text Content (Col-span 5) */}
            <div className="lg:col-span-5 flex flex-col justify-center space-y-6 text-left z-20">
              <div className="space-y-4 animate-fade-in-up">
                <span className="inline-block text-xs font-black uppercase tracking-widest text-[#C5A059]">
                  {(activeSlides[heroIdx] || {}).tag || 'NEW SEASON'}
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-serif text-[#1F2937] leading-[1.15] transition-all duration-700">
                  {(activeSlides[heroIdx] || {}).title}
                </h1>
                <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed max-w-[420px]">
                  {(activeSlides[heroIdx] || {}).subtitle}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2 animate-fade-in-up">
                <Button
                  onClick={() => navigate('/customer/shop')}
                  variant="black"
                  className="px-6 py-3.5 text-xs font-bold tracking-widest uppercase flex items-center gap-2 group rounded-[12px]"
                >
                  <span>{(activeSlides[heroIdx] || {}).ctaText || (activeSlides[heroIdx] || {}).cta || 'Shop Now'}</span>
                  <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </Button>
                
                <button
                  onClick={() => navigate('/customer/tailoring')}
                  className="flex items-center gap-2.5 px-5 py-3.5 text-xs font-bold tracking-widest uppercase text-gray-900 hover:text-[#C5A059] transition-colors focus:outline-none cursor-pointer"
                >
                  <span className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center text-accent text-[10px] font-black shadow-sm">▶</span>
                  <span>Watch Video</span>
                </button>
              </div>

              {/* Carousel Dot Indicators & Navigation */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex gap-2">
                  {activeSlides.map((_, i) => (
                    <button
                      key={i}
                      aria-label={`Go to slide ${i + 1}`}
                      onClick={() => setHeroIdx(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === heroIdx ? 'w-8 h-1.5 bg-[#C5A059]' : 'w-1.5 h-1.5 bg-gray-300 hover:bg-[#C5A059]/50'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHeroIdx(i => (i - 1 + activeSlides.length) % activeSlides.length)}
                    className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-[#C5A059] hover:text-white hover:border-[#C5A059] transition-all cursor-pointer text-gray-600 font-bold"
                    aria-label="Previous slide"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setHeroIdx(i => (i + 1) % activeSlides.length)}
                    className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-[#C5A059] hover:text-white hover:border-[#C5A059] transition-all cursor-pointer text-gray-600 font-bold"
                    aria-label="Next slide"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side Image Content (Col-span 7) */}
            <div className="lg:col-span-7 relative w-full h-[320px] sm:h-[440px] lg:h-full z-10 flex items-center justify-center">
              <div className="relative w-full h-full max-h-[500px] rounded-[24px] overflow-hidden shadow-hero">
                {activeSlides.map((slide, i) => (
                  <div
                    key={i}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                      i === heroIdx ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <picture className="w-full h-full absolute inset-0">
                      {slide.mobileImageUrl && (
                        <source media="(max-w: 640px)" srcSet={slide.mobileImageUrl} />
                      )}
                      <img
                        src={slide.imageUrl || slide.image}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                        loading={i === 0 ? 'eager' : 'lazy'}
                      />
                    </picture>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                  </div>
                ))}
              </div>

              {/* Floating Offer Badge (Top Right) */}
              <div className="absolute top-4 right-4 md:top-6 md:right-6 w-24 h-24 md:w-26 md:h-26 rounded-full bg-[#C5A059] text-white flex flex-col items-center justify-center shadow-lg transform rotate-12 z-30 border border-white/20 select-none">
                <span className="text-[9px] font-black uppercase tracking-wider">Up to</span>
                <span className="text-xl md:text-2xl font-black font-serif my-0.5 leading-none">40%</span>
                <span className="text-[9px] font-black uppercase tracking-wider">OFF</span>
                {/* Dotted border overlay */}
                <div className="absolute inset-1.5 rounded-full border border-dashed border-white/40 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BADGE STRIP (Phase 3) ────────────────── */}
      <section className="bg-white dark:bg-gray-900 py-6 border-b border-[#d2c5b1]/10 shadow-soft">
        <div className="container-luxury">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹999' },
              { icon: Shield, title: 'Secure Payment', desc: '100% secure checkout' },
              { icon: Scissors, title: 'Custom Tailoring', desc: 'Made just for you' },
              { icon: Award, title: 'Easy Returns', desc: 'Hassle free returns' },
              { icon: Clock, title: 'Support 24/7', desc: "We're here to help" },
            ].map((badge, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent/5 transition-all duration-300">
                <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent shrink-0">
                  <badge.icon size={18} />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-black text-[#1F2937] dark:text-white uppercase tracking-wider">{badge.title}</h4>
                  <p className="text-[11px] text-gray-400 font-semibold mt-0.5">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOMEPAGE CONTENT ────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-12 space-y-12 md:space-y-16">

        {/* ── CATEGORIES (Redesigned Circular Cards) ──── */}
        <section ref={(el) => (sectionRefs.current[0] = el)} className="opacity-0">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-[#1F2937] dark:text-white font-serif">
              Shop by Category
            </h2>
            <button
              onClick={() => navigate('/customer/shop')}
              className="text-xs font-black uppercase tracking-widest text-accent hover:text-accent-light transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </button>
          </div>
          {/* Scrollable flex on mobile, clean grid on desktop */}
          <div className="flex overflow-x-auto lg:grid lg:grid-cols-10 gap-6 pb-4 no-scrollbar scroll-smooth">
            {(dbCategories && dbCategories.length > 0 ? dbCategories : CATEGORIES).map((cat) => (
              <button
                key={cat.name}
                onClick={() => navigate(`/customer/shop?category=${cat.name.toLowerCase()}`)}
                className="group flex flex-col items-center min-w-[110px] lg:min-w-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/20 rounded-2xl p-1"
              >
                {/* Circle Container with gold border */}
                <div className="w-24 h-24 sm:w-26 sm:h-26 rounded-full overflow-hidden border border-[#C5A059]/30 p-1 bg-white dark:bg-gray-800 shadow-card transition-all duration-300 group-hover:scale-105 group-hover:border-accent">
                  <div className="w-full h-full rounded-full overflow-hidden relative">
                    <PremiumImage
                      src={cat.image}
                      alt={cat.name}
                      aspectRatio="w-full h-full"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                </div>
                {/* Label text */}
                <span className="text-[11px] font-black uppercase tracking-wider text-center text-[#1F2937] dark:text-gray-200 mt-3 group-hover:text-accent transition-colors">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── FEATURED COLLECTIONS (Redesigned 4-Card Grid) ─ */}
        <section ref={(el) => (sectionRefs.current[1] = el)} className="opacity-0">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-[#1F2937] dark:text-white font-serif">
              Featured Collections
            </h2>
            <button
              onClick={() => navigate('/customer/shop')}
              className="text-xs font-black uppercase tracking-widest text-accent hover:text-accent-light transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURED_COLLECTIONS.map((col) => (
              <Card
                key={col.name}
                onClick={() => navigate('/customer/shop')}
                className="group relative h-72 md:h-80 rounded-[20px] overflow-hidden shadow-card hover:shadow-hover transition-all duration-500 text-left w-full p-0 border-none cursor-pointer"
              >
                <PremiumImage
                  src={col.image}
                  alt={col.name}
                  aspectRatio="absolute inset-0"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${col.color} z-10`} />
                <div className="absolute inset-0 flex flex-col justify-end p-6 z-20 text-white">
                  <h3 className="text-lg md:text-xl font-black font-serif tracking-wide leading-tight">
                    {col.name}
                  </h3>
                  <p className="text-xs text-white/80 mt-1.5 font-medium line-clamp-2">
                    {col.items}
                  </p>
                  <div className="mt-4">
                    <span className="inline-block text-[10px] font-black uppercase tracking-widest text-white border-b-2 border-[#C5A059] pb-0.5 group-hover:text-accent transition-colors">
                      Shop Now
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ── PRODUCT SECTIONS (Redesigned Side-by-Side) ──────────────── */}
        <section ref={(el) => (sectionRefs.current[2] = el)} className="opacity-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Column: New Arrivals (Col-span 7) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-[#d2c5b1]/10">
                <h3 className="text-lg md:text-xl font-black uppercase tracking-wider text-[#1F2937] dark:text-white font-serif flex items-center gap-2">
                  <Sparkles size={18} className="text-accent" /> New Arrivals
                </h3>
                <button
                  onClick={() => navigate('/customer/shop?sort=newest')}
                  className="text-xs font-black uppercase tracking-widest text-accent hover:text-accent-light transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {products.length === 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <div className="aspect-[3/4] bg-gray-100 rounded-2xl animate-pulse" />
                      <div className="space-y-2 px-1">
                        <div className="h-3 bg-gray-100 rounded-lg animate-pulse" />
                        <div className="h-3 bg-gray-50 rounded-lg animate-pulse w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                  {products.slice(0, 5).map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onWishlistClick={(id) => wishlistIds.has(id) ? removeWishlist(id) : addWishlist(id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Trending Now (Col-span 5) */}
            <div className="lg:col-span-5 space-y-6 lg:border-l lg:border-[#d2c5b1]/10 lg:pl-8">
              <div className="flex items-center justify-between pb-2 border-b border-[#d2c5b1]/10">
                <h3 className="text-lg md:text-xl font-black uppercase tracking-wider text-[#1F2937] dark:text-white font-serif flex items-center gap-2">
                  <Percent size={18} className="text-accent" /> Trending Now
                </h3>
                <button
                  onClick={() => navigate('/customer/shop?sort=popular')}
                  className="text-xs font-black uppercase tracking-widest text-accent hover:text-accent-light transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {trending.length === 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <div className="aspect-[3/4] bg-gray-100 rounded-2xl animate-pulse" />
                      <div className="space-y-2 px-1">
                        <div className="h-3 bg-gray-100 rounded-lg animate-pulse" />
                        <div className="h-3 bg-gray-50 rounded-lg animate-pulse w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {trending.slice(0, 3).map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onWishlistClick={(id) => wishlistIds.has(id) ? removeWishlist(id) : addWishlist(id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── TAILORING SERVICES (Redesigned 7 Outline Cards) ── */}
        <section ref={(el) => (sectionRefs.current[3] = el)} className="opacity-0">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-[#1F2937] dark:text-white font-serif">
              Our Tailoring Services
            </h2>
            <button
              onClick={() => navigate('/customer/tailoring')}
              className="text-xs font-black uppercase tracking-widest text-accent hover:text-accent-light transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>View All Services</span>
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { name: 'Custom Stitching', desc: 'Perfect fit, just for you', icon: Scissors },
              { name: 'Blouse Stitching', desc: 'Designer blouse stitching', icon: Sparkles },
              { name: 'Alterations', desc: 'We alter, you adore', icon: Scissors },
              { name: 'Wedding Outfit', desc: 'Bespoke wedding wear', icon: Award },
              { name: 'Kids Stitching', desc: 'Stylish & comfy outfits', icon: Heart },
              { name: 'Express Delivery', desc: 'On-time delivery', icon: Truck },
              { name: 'Fabric Consultation', desc: 'Choose the best', icon: Store },
            ].map((s, idx) => (
              <Card
                key={idx}
                onClick={() => navigate('/customer/tailoring')}
                className="group flex flex-col items-center justify-between text-center p-5 bg-white dark:bg-gray-900 border border-[#C5A059]/20 hover:border-accent hover:shadow-card transition-all duration-300 rounded-[16px] cursor-pointer"
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform duration-300">
                    <s.icon size={20} />
                  </div>
                  <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider line-clamp-2 min-h-[32px] flex items-center justify-center">
                    {s.name}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-semibold mt-1 leading-relaxed line-clamp-2">
                    {s.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800 w-full">
                  <span className="text-[9px] font-black uppercase tracking-widest text-accent group-hover:text-accent-light transition-colors">
                    Book Now
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ── RECENTLY VIEWED ────────────────────────── */}
        {recentlyViewed.length > 0 && (
          <section ref={(el) => (sectionRefs.current[5] = el)} className="opacity-0">
            <div className="flex items-center gap-2 mb-6">
              <History size={20} className="text-gray-400" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Recently Viewed</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {recentlyViewed.slice(0, 5).map(p => (
                <Card
                  key={p.id}
                  onClick={() => navigate(`/customer/shop/${p.id}`)}
                  className="group p-0 overflow-hidden"
                  isHoverable
                >
                  <div className="relative overflow-hidden bg-gray-50">
                    <PremiumImage
                      src={p.image}
                      alt={p.name}
                      productName={p.name}
                      aspectRatio="aspect-[3/4]"
                      className="group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">₹{p.price}</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ── NEARBY BOUTIQUES ────────────────────────── */}
        {boutiques.length > 0 && (
          <section ref={(el) => (sectionRefs.current[6] = el)} className="opacity-0">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-[#1F2937] dark:text-white font-serif flex items-center gap-2">
                <Store size={20} className="text-accent" /> Partner Boutiques
              </h2>
              <button
                onClick={() => navigate('/customer/tailoring')}
                className="text-xs font-black uppercase tracking-widest text-accent hover:text-accent-light transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>View All Boutiques</span>
                <ChevronRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {boutiques.slice(0, 5).map(b => (
                <BoutiqueCard 
                  key={b.id} 
                  boutique={{
                    id: b.id,
                    name: b.boutiqueName || b.name,
                    city: b.city,
                    area: b.address,
                    rating: b.rating,
                    startingPrice: b.startingPrice || 1500,
                    coverImageUrl: b.coverImageUrl || b.images?.[0] || b.banner,
                    logoUrl: b.logoUrl,
                    verified: b.verified,
                    experienceYears: b.experienceYears,
                    servicesOffered: b.servicesOffered || []
                  }} 
                />
              ))}
            </div>
          </section>
        )}

      {/* ── STATISTICS STRIP (Phase 9) ────────────────── */}
      <section className="bg-[#111827] text-white py-12 my-12 border-y border-[#C5A059]/20 w-screen relative left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
            {[
              { value: '5,000+', label: 'Happy Customers' },
              { value: '100+', label: 'Partner Boutiques' },
              { value: '99.8%', label: 'Perfect Fit Rate' },
              { value: '15+', label: 'Cities Covered' },
              { value: '50k+', label: 'Custom Garments' },
            ].map((stat, idx) => (
              <div key={idx} className="space-y-1">
                <span className="text-3xl md:text-4xl font-serif font-black text-[#C5A059] block">
                  {stat.value}
                </span>
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS SECTION (Phase 9) ───────────── */}
      <section ref={(el) => (sectionRefs.current[7] = el)} className="opacity-0 py-8">
        <div className="text-center max-w-[500px] mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-widest text-[#C5A059]">
            Customer Stories
          </span>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-[#1F2937] dark:text-white font-serif mt-2">
            What Our Customers Say
          </h2>
          <p className="text-xs text-gray-400 font-semibold mt-2 leading-relaxed">
            Real stories from clients who experienced our bespoke boutique services
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: 'Ananya Sharma',
              item: 'Designer Bridal Lehenga',
              rating: 5,
              text: 'The custom fit was absolutely flawless. I was worried about ordering my bridal lehenga online, but the boutique was extremely professional, took perfect virtual measurements, and delivered on time!',
              avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&q=80',
            },
            {
              name: 'Rahul Verma',
              item: 'Bespoke Groom Sherwani',
              rating: 5,
              text: 'Exceptional craftsmanship. The fabric quality and detailing on the Sherwani exceeded my expectations. The partner boutique kept me updated throughout the stitching process.',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80',
            },
            {
              name: 'Priyanka Patel',
              item: 'Custom Silk Saree Blouse',
              rating: 5,
              text: 'I ordered alteration services and custom blouse stitching. The fitting is better than what I get from my local tailor. Will definitely buy again and recommend VS Boutique!',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80',
            },
          ].map((t, idx) => (
            <Card
              key={idx}
              className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[20px] shadow-card hover:shadow-hover transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Rating stars */}
                <div className="flex items-center gap-0.5 text-[#C5A059]">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={14} className="fill-current" />
                  ))}
                </div>
                {/* Text quote */}
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-300 italic leading-relaxed">
                  "{t.text}"
                </p>
              </div>

              {/* User details footer */}
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-50 dark:border-gray-800">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#C5A059]/30"
                />
                <div className="text-left">
                  <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>{t.name}</span>
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      Verified
                    </span>
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5 uppercase tracking-wide">
                    {t.item}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ── FLASH SALE COUNTDOWN (Phase 10) ───────────── */}
      <section className="bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 text-white rounded-[24px] overflow-hidden my-12 border border-[#C5A059]/30 relative shadow-hero">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="px-6 py-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="text-center md:text-left space-y-2">
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#C5A059] bg-[#C5A059]/15 px-3 py-1 rounded-full border border-[#C5A059]/20">
              Limited Time Offer
            </span>
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-wide font-serif leading-tight">
              Mid-Season Sale: Flat <span className="text-[#C5A059]">40% Off</span>
            </h3>
            <p className="text-xs text-gray-400 font-semibold max-w-[480px]">
              Flat discount across all premium sarees, designer bridal lehengas, and custom stitching orders.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Ends in:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { value: '04', unit: 'H' },
                  { value: '25', unit: 'M' },
                  { value: '18', unit: 'S' },
                ].map((time, tIdx) => (
                  <div key={tIdx} className="flex items-center gap-1">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center font-serif text-base md:text-lg font-black text-[#C5A059]">
                      {time.value}
                    </div>
                    {tIdx < 2 && <span className="text-gray-650 font-black">:</span>}
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={() => navigate('/customer/shop')}
              variant="gold"
              className="mt-2 px-6 py-3 text-xs font-bold tracking-widest uppercase rounded-[12px] w-full md:w-auto shadow-md"
            >
              Shop The Sale
            </Button>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER SUBSCRIPTION (Phase 10) ────────── */}
      <section className="bg-[#FDFBF7] dark:bg-gray-900/40 border border-[#d2c5b1]/20 rounded-[24px] p-8 md:p-12 text-center my-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-[540px] mx-auto space-y-4 relative z-10">
          <span className="text-xs font-black uppercase tracking-widest text-[#C5A059]">
            Stay in Style
          </span>
          <h3 className="text-xl md:text-2xl font-black uppercase tracking-wider text-[#1F2937] dark:text-white font-serif leading-tight">
            Subscribe to our newsletter
          </h3>
          <p className="text-xs text-gray-555 dark:text-gray-400 font-medium leading-relaxed">
            Receive exclusive VIP offers, early access to new collections, and bespoke custom design inspiration.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed successfully!'); }} className="pt-2 flex flex-col sm:flex-row items-center gap-2 max-w-[440px] mx-auto">
            <input
              type="email"
              placeholder="ENTER YOUR EMAIL ADDRESS"
              required
              className="w-full px-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-[12px] text-xs font-semibold tracking-wider text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-[#C5A059]"
            />
            <Button
              type="submit"
              variant="black"
              className="w-full sm:w-auto px-6 py-3.5 text-xs font-bold tracking-widest uppercase rounded-[12px] bg-[#111827] text-white hover:bg-[#C5A059] shrink-0"
            >
              Subscribe
            </Button>
          </form>
        </div>
      </section>
      </div>

      {/* ── BACK TO TOP ─────────────────────────────── */}
      {showBackToTop && (
        <FAB
          icon={ArrowUp}
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8"
        />
      )}
    </CustomerLayout>
  );
};

export default CustomerHomePreview;

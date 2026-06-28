import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Star, Clock, Shield, Scissors, Sparkles, Percent, Store, History, Heart, Truck, Award, ArrowUp, Zap } from 'lucide-react';
import CustomerLayout from '../../../../components/CustomerLayout';
import { getPublicProducts, getPublicBoutiques } from '@core/services';
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
  { name: 'Sarees', image: IMAGES.categories.sarees, count: '240+ Designs', color: 'from-rose-100 to-rose-50' },
  { name: 'Blouses', image: IMAGES.categories.blouses, count: '180+ Designs', color: 'from-blue-100 to-blue-50' },
  { name: 'Lehengas', image: IMAGES.categories.lehengas, count: '120+ Designs', color: 'from-amber-100 to-amber-50' },
  { name: 'Gowns', image: IMAGES.categories.gowns, count: '90+ Designs', color: 'from-purple-100 to-purple-50' },
  { name: 'Custom Stitching', image: IMAGES.categories.customStitching, count: 'Bespoke Fit', color: 'from-emerald-100 to-emerald-50' },
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
  { name: 'Office Wear', items: '32 Items', image: IMAGES.collections.office, color: 'from-blue-600 to-blue-800' },
  { name: 'Festival Special', items: '28 Items', image: IMAGES.collections.festive, color: 'from-amber-600 to-amber-800' },
  { name: 'Party Collection', items: '45 Items', image: IMAGES.collections.designer, color: 'from-rose-600 to-rose-800' },
];

const CustomerHome = () => {
  const navigate = useNavigate();
  const { customer, isAuthenticated } = useCustomerAuth();
  const { items: wishlistItems, add: addWishlist, remove: removeWishlist } = useWishlist();
  const [heroIdx, setHeroIdx] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [recentlyViewed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recentlyViewed') || '[]'); } catch { return []; }
  });
  const sectionRefs = useRef([]);

  useEffect(() => {
    const iv = setInterval(() => setHeroIdx(i => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(iv);
  }, []);

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

      {/* ── HERO BANNER ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-gray-900">
        <div className="relative h-[70vh] min-h-[400px] max-h-[600px]">
          {HERO_SLIDES.map((slide, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                i === heroIdx ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
              }`}
            >
              <PremiumImage
                src={slide.image}
                alt={slide.title}
                aspectRatio="absolute inset-0"
                loading={i === 0 ? 'eager' : 'lazy'}
                className="w-full h-full object-cover"
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${slide.color} z-10`} />
            </div>
          ))}
          <div className="absolute inset-0 flex items-center z-20">
            <div className="max-w-[1400px] mx-auto px-6 w-full">
              <div className="max-w-[560px] animate-fade-in-up">
                <span className="inline-block px-3 py-1 text-xs font-bold text-white bg-white/20 rounded-full backdrop-blur-sm mb-4 tracking-wider">
                  {HERO_SLIDES[heroIdx].tag}
                </span>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight font-serif">
                  {HERO_SLIDES[heroIdx].title}
                </h1>
                <p className="mt-3 md:mt-4 text-base md:text-lg text-white/80 max-w-[420px] leading-relaxed">
                  {HERO_SLIDES[heroIdx].subtitle}
                </p>
                <Button
                  onClick={() => navigate('/customer/shop')}
                  variant="luxury"
                  className="mt-6 md:mt-8 bg-white text-gray-900 border-none hover:bg-gray-100 shadow-xl flex items-center gap-2 group"
                >
                  <span>{HERO_SLIDES[heroIdx].cta}</span>
                  <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                </Button>
              </div>
            </div>
          </div>
          {/* Slide indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setHeroIdx(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === heroIdx ? 'w-8 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOMEPAGE CONTENT ────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-12 space-y-12 md:space-y-16">

        {/* ── CATEGORIES ──────────────────────────────── */}
        <section ref={(el) => (sectionRefs.current[0] = el)} className="opacity-0">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">Shop by Category</h2>
              <p className="text-sm text-gray-500 mt-1">Find your perfect style</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/customer/shop')}
              className="hidden md:flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors p-1"
            >
              View All <ChevronRight size={16} />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {CATEGORIES.map((cat) => (
              <Card
                key={cat.name}
                onClick={() => navigate(`/customer/shop?category=${cat.name.toLowerCase()}`)}
                className="group relative overflow-hidden rounded-2xl h-44 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 text-left w-full p-0 border-none cursor-pointer"
              >
                <PremiumImage
                  src={cat.image}
                  alt={cat.name}
                  aspectRatio="absolute inset-0"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10 z-10" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-20">
                  <h3 className="text-base md:text-lg font-black font-serif tracking-wide">{cat.name}</h3>
                  <p className="text-xs text-white/80 mt-0.5 font-medium">{cat.count}</p>
                </div>
              </Card>
            ))}
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/customer/shop')}
            className="md:hidden flex items-center justify-center gap-1 text-sm font-semibold text-primary mt-4 w-full py-2.5 bg-primary/5 rounded-xl border border-primary/10"
          >
            View All Categories <ChevronRight size={16} />
          </Button>
        </section>

        {/* ── FEATURED COLLECTIONS ──────────────────── */}
        <section ref={(el) => (sectionRefs.current[1] = el)} className="opacity-0">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">Featured Collections</h2>
              <p className="text-sm text-gray-500 mt-1">Curated just for you</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {FEATURED_COLLECTIONS.map((col) => (
              <Card
                key={col.name}
                onClick={() => navigate('/customer/shop')}
                className="group relative h-48 md:h-64 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500 text-left w-full p-0 border-none cursor-pointer"
              >
                <PremiumImage
                  src={col.image}
                  alt={col.name}
                  aspectRatio="absolute inset-0"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${col.color} opacity-60 group-hover:opacity-75 transition-opacity duration-500 z-10`} />
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 text-white z-20">
                  <h3 className="text-lg md:text-xl font-black font-serif tracking-wide">{col.name}</h3>
                  <p className="text-sm text-white/80 mt-1 font-medium">{col.items}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ── NEW ARRIVALS ──────────────────────────── */}
        <section ref={(el) => (sectionRefs.current[2] = el)} className="opacity-0">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif flex items-center gap-2">
                <Sparkles size={24} className="text-accent" /> New Arrivals
              </h2>
              <p className="text-sm text-gray-500 mt-1">The latest designs added this week</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/customer/shop?sort=newest')}
              className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 p-1"
            >
              View All <ChevronRight size={16} />
            </Button>
          </div>
          {products.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {products.slice(0, 5).map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onWishlistClick={(id) => wishlistIds.has(id) ? removeWishlist(id) : addWishlist(id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── TAILORING SERVICES ────────────────────── */}
        <section ref={(el) => (sectionRefs.current[3] = el)} className="bg-gradient-to-br from-primary/5 via-primary/[0.02] to-accent/5 rounded-3xl p-6 md:p-10 opacity-0">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif flex items-center gap-2">
                <Scissors size={24} className="text-accent" /> Tailoring Services
              </h2>
              <p className="text-sm text-gray-500 mt-1">Expert craftsmanship for the perfect fit</p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/customer/tailoring')}
              className="px-6 py-3"
            >
              Book a Consultation
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Custom Blouse Stitching', desc: 'Bespoke blouses tailored to your measurements', price: '₹299' },
              { name: 'Alterations & Stitching', desc: 'Resizing, hemming, and adjustments', price: '₹149' },
              { name: 'Designer Wear Stitching', desc: 'Custom lehengas, gowns, and sarees', price: '₹999' },
              { name: 'Bridal Collection Stitching', desc: 'Complete bridal trousseau stitching', price: 'Custom' },
            ].map((s) => (
              <ServiceCard
                key={s.name}
                title={s.name}
                description={s.desc}
                price={s.price}
                onBook={() => navigate('/customer/tailoring')}
              />
            ))}
          </div>
        </section>

        {/* ── TRENDING PRODUCTS ─────────────────────── */}
        <section ref={(el) => (sectionRefs.current[4] = el)} className="opacity-0">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif flex items-center gap-2">
                <Percent size={24} className="text-accent" /> Trending Now
              </h2>
              <p className="text-sm text-gray-500 mt-1">Most popular designs this month</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/customer/shop?sort=popular')}
              className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 p-1"
            >
              View All <ChevronRight size={16} />
            </Button>
          </div>
          {trending.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[3/4] bg-gray-100 rounded-2xl animate-pulse" />
                  <div className="space-y-2 px-1">
                    <div className="h-3 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-3 bg-gray-50 rounded-lg animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {trending.slice(0, 8).map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onWishlistClick={(id) => wishlistIds.has(id) ? removeWishlist(id) : addWishlist(id)}
                />
              ))}
            </div>
          )}
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif flex items-center gap-2">
                  <Store size={24} className="text-accent" /> Partner Boutiques
                </h2>
                <p className="text-sm text-gray-500 mt-1">Trusted artisans near you</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

        {/* ── WHY CHOOSE US ──────────────────────────── */}
        <section ref={(el) => (sectionRefs.current[7] = el)} className="bg-white rounded-3xl border border-gray-50 shadow-sm p-6 md:p-10 opacity-0">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">Why Choose VS Boutique</h2>
            <p className="text-sm text-gray-500 mt-2">We make custom fashion simple, secure, and delightful</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
            {[
              { icon: Shield, label: 'Trusted Boutiques', sub: 'All partners are verified and rated' },
              { icon: Truck, label: 'Free Shipping', sub: 'On orders above ₹999' },
              { icon: Scissors, label: 'Perfect Fit', sub: 'Custom measurements guaranteed' },
              { icon: Clock, label: 'Fast Turnaround', sub: 'Delivery in 7-14 days' },
              { icon: Award, label: 'Quality Promise', sub: '100% satisfaction or refund' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="text-center group">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                  <Icon size={26} className="text-primary" />
                </div>
                <p className="text-sm font-bold text-gray-900">{label}</p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
            ))}
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

export default CustomerHome;

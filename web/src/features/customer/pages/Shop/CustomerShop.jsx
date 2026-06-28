import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, ArrowUpDown, Heart, Star, X, Loader2, Grid3X3, Check } from 'lucide-react';
import CustomerLayout from '../../../../components/CustomerLayout';
import { getPublicProducts, getActiveCategories } from '@core/services';
import { useWishlist } from '@core/contexts';
import PremiumImage from '@core/components/ui/PremiumImage';
import { IMAGES } from '@core/services';
import ProductCard from '@core/components/commerce/ProductCard';
import SearchInput from '@core/components/ui/SearchInput';
import Chip from '@core/components/ui/Chip';
import Input from '@core/components/ui/Input';
import Button from '@core/components/ui/Button';
import BottomSheet from '@core/components/ui/BottomSheet';
import EmptyState from '@core/components/ui/EmptyState';
import useDebounce from '@core/hooks/useDebounce';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A-Z' },
];

const CATEGORY_ICONS = {
  'sarees': '👗',
  'blouses': '👚',
  'lehengas': '👘',
  'gowns': '👗',
  'custom-blouse': '✂️',
};

const ProductCardSkeleton = () => (
  <div className="space-y-3">
    <div className="aspect-[3/4] bg-gray-100 rounded-2xl animate-pulse" />
    <div className="space-y-2 px-1">
      <div className="h-3 bg-gray-100 rounded-lg animate-pulse w-3/4" />
      <div className="h-3 bg-gray-50 rounded-lg animate-pulse w-1/2" />
    </div>
  </div>
);

const CustomerShop = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { items: wishlistItems, add: addWishlist, remove: removeWishlist } = useWishlist();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(search, 300);
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [allProducts, setAllProducts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [priceMin, setPriceMin] = useState(searchParams.get('minPrice') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('maxPrice') || '');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const pageRef = useRef(1);
  const loaderRef = useRef(null);

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getActiveCategories });

  const wishlistIds = useMemo(() => new Set(wishlistItems.map(w => w.productId)), [wishlistItems]);

  const fetchProducts = useCallback(async (pageNum, append = false) => {
    try {
      if (append) setLoadingMore(true);
      const params = { sort, page: pageNum, limit: 12 };
      if (category) params.categoryId = category;
      if (priceMin) params.minPrice = priceMin;
      if (priceMax) params.maxPrice = priceMax;
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await getPublicProducts(params);
      const newProducts = res?.data || [];
      if (append) {
        setAllProducts(prev => [...prev, ...newProducts]);
      } else {
        setAllProducts(newProducts);
      }
      const totalPages = res?.pagination?.pages || 1;
      setHasMore(pageNum < totalPages);
      setIsInitialLoad(false);
    } finally {
      setLoadingMore(false);
    }
  }, [sort, category, priceMin, priceMax, debouncedSearch]);

  useEffect(() => {
    pageRef.current = 1;
    fetchProducts(1, false);
  }, [fetchProducts]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        const nextPage = pageRef.current + 1;
        pageRef.current = nextPage;
        fetchProducts(nextPage, true);
      }
    }, { threshold: 0.1 });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, fetchProducts]);

  const toggleWishlist = (e, productId) => {
    e.stopPropagation();
    if (wishlistIds.has(productId)) removeWishlist(productId);
    else addWishlist(productId);
  };

  const activeFilters = useMemo(() => {
    const filters = [];
    if (category) filters.push({ key: 'category', label: categories.find(c => c.id === category)?.name || 'Category' });
    if (priceMin || priceMax) filters.push({ key: 'price', label: `₹${priceMin || '0'} - ₹${priceMax || '∞'}` });
    if (sort !== 'newest') filters.push({ key: 'sort', label: SORT_OPTIONS.find(s => s.value === sort)?.label });
    return filters;
  }, [category, priceMin, priceMax, sort, categories]);

  const clearFilter = (key) => {
    if (key === 'category') setCategory('');
    if (key === 'price') { setPriceMin(''); setPriceMax(''); }
    if (key === 'sort') setSort('newest');
  };

  const isLoading = isInitialLoad && allProducts.length === 0;

  return (
    <CustomerLayout>
      <div className="px-4 pt-4 pb-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-serif">Shop</h1>
          <span className="text-sm text-gray-400 font-medium">{isLoading ? 'Loading...' : `${allProducts.length} products`}</span>
        </div>

        {/* Search Bar */}
        <SearchInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
        />

        {/* Category Pills */}
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
          <Chip
            label="All"
            active={!category}
            onClick={() => setCategory('')}
          />
          {categories.map(c => (
            <Chip
              key={c.id}
              label={c.name}
              active={category === c.id}
              onClick={() => setCategory(c.id)}
            />
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-1.5 px-4"
            >
              <SlidersHorizontal size={14} /> <span>Filters</span>
              {activeFilters.length > 0 && (
                <span className="w-4 h-4 bg-primary text-white rounded-full text-[9px] font-bold flex items-center justify-center ml-1">{activeFilters.length}</span>
              )}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSort(true)}
              className="flex items-center gap-1.5 px-4"
            >
              <ArrowUpDown size={14} /> <span>Sort</span>
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(f => (
              <Chip
                key={f.key}
                label={f.label}
                active={true}
                onDismiss={() => clearFilter(f.key)}
              />
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setCategory(''); setPriceMin(''); setPriceMax(''); setSort('newest'); }}
              className="text-gray-400 hover:text-gray-600 lowercase"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : allProducts.length === 0 ? (
          <EmptyState
            title="No Products Found"
            description="Try adjusting your search query, selecting different filters, or clearing categories."
            actionLabel="Clear All Filters"
            onAction={() => { setSearch(''); setCategory(''); setPriceMin(''); setPriceMax(''); }}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {allProducts.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onWishlistClick={(id) => wishlistIds.has(id) ? removeWishlist(id) : addWishlist(id)}
                />
              ))}
            </div>

            {/* Load More Trigger */}
            <div ref={loaderRef} className="flex justify-center py-6">
              {loadingMore && (
                <div className="flex items-center space-x-2 text-primary">
                  <Loader2 className="animate-spin" size={20} />
                  <span className="text-sm font-medium">Loading more...</span>
                </div>
              )}
              {!hasMore && allProducts.length > 0 && (
                <p className="text-xs text-gray-400 font-medium">You've reached the end</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Filters Bottom Sheet */}
      <BottomSheet isOpen={showFilters} onClose={() => setShowFilters(false)} title="Filters">
        <div className="space-y-6">
          {/* Categories */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Category</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <Chip
                  key={c.id}
                  label={c.name}
                  active={category === c.id}
                  onClick={() => setCategory(c.id === category ? '' : c.id)}
                />
              ))}
            </div>
          </div>
          {/* Price Range */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Price Range</p>
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <Input
                  label="Min"
                  type="number"
                  placeholder="₹0"
                  value={priceMin}
                  onChange={e => setPriceMin(e.target.value)}
                />
              </div>
              <span className="text-gray-300 dark:text-gray-600 mt-6">—</span>
              <div className="flex-1">
                <Input
                  label="Max"
                  type="number"
                  placeholder="₹10,000"
                  value={priceMax}
                  onChange={e => setPriceMax(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowFilters(false)}
          className="w-full mt-6 py-3.5"
        >
          Apply Filters {activeFilters.filter(f => f.key !== 'sort').length > 0 && `(${activeFilters.filter(f => f.key !== 'sort').length})`}
        </Button>
      </BottomSheet>

      {/* Sort Bottom Sheet */}
      <BottomSheet isOpen={showSort} onClose={() => setShowSort(false)} title="Sort By">
        <div className="space-y-1">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setSort(opt.value); setShowSort(false); }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-medium transition-all ${
                sort === opt.value ? 'bg-primary/5 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{opt.label}</span>
              {sort === opt.value && <Check size={16} className="text-primary" />}
            </button>
          ))}
        </div>
      </BottomSheet>
    </CustomerLayout>
  );
};

export default CustomerShop;

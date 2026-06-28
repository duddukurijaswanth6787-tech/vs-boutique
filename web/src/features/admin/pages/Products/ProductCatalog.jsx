import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ArrowLeft, Store, Package, Heart } from 'lucide-react';
import { api, getPublicProducts, getActiveCategories } from '@core/services';
import ProductCard from '@core/components/commerce/ProductCard';
import { useWishlist } from '@core/contexts';
import { useCustomerAuth } from '@core/contexts';

export default function ProductCatalog() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { add, remove, isWishlisted } = useWishlist();
  const { isAuthenticated } = useCustomerAuth();
  const [wishlistLoadingId, setWishlistLoadingId] = useState(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || '');
  const [selectedSubCategory, setSelectedSubCategory] = useState(searchParams.get('subCategoryId') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || '');
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await getActiveCategories();
      setCategories(res.data?.filter(c => c.isActive !== false) || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: searchParams.get('page') || 1, limit: 20 };
      const search = searchParams.get('search');
      const categoryId = searchParams.get('categoryId');
      const subCategoryId = searchParams.get('subCategoryId');
      const minP = searchParams.get('minPrice');
      const maxP = searchParams.get('maxPrice');
      const sort = searchParams.get('sort');
      if (search) params.search = search;
      if (categoryId) params.categoryId = categoryId;
      if (subCategoryId) params.subCategoryId = subCategoryId;
      if (minP) params.minPrice = minP;
      if (maxP) params.maxPrice = maxP;
      if (sort) params.sort = sort;
      const res = await getPublicProducts(params);
      setProducts(res.data || []);
      setPagination(res.pagination);
      setPage(parseInt(searchParams.get('page') || '1'));
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchParams]);

  const updateSearchParams = (updates) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    if (updates.page === undefined || updates.page === 1) {
      if (!Object.prototype.hasOwnProperty.call(updates, 'page')) params.set('page', '1');
    }
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateSearchParams({ search: searchQuery, page: '1' });
  };

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setSelectedSubCategory('');
    updateSearchParams({ categoryId: catId, subCategoryId: '', page: '1' });
  };

  const handleSubCategoryChange = (subCatId) => {
    setSelectedSubCategory(subCatId);
    updateSearchParams({ subCategoryId: subCatId, page: '1' });
  };

  const handlePriceFilter = () => {
    updateSearchParams({ minPrice, maxPrice, page: '1' });
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    updateSearchParams({ sort, page: '1' });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedSubCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('');
    setSearchParams({});
  };

  const hasActiveFilters = searchParams.get('search') || searchParams.get('categoryId') || searchParams.get('subCategoryId') || searchParams.get('minPrice') || searchParams.get('maxPrice') || searchParams.get('sort');

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);
  const subCategories = selectedCategoryData?.subCategories || [];

  return (
    <div className="min-h-screen bg-[#fff8f2] font-sans text-[#1f1b14] flex flex-col antialiased">
      <header className="fixed top-0 left-0 w-full z-50 bg-[#fff8f2]/90 backdrop-blur-xl border-b border-[#d2c5b1]/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-[#1f1b14] hover:text-[#c89b3c] transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-bold">Home</span>
            </button>
            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 bg-[#c89b3c] rounded-xl flex items-center justify-center shadow-lg shadow-[#c89b3c]/20">
                <Store className="text-white" size={16} />
              </div>
              <span className="text-lg font-serif font-black tracking-wider text-[#1f1b14]">
                VS <span className="text-[#c89b3c]">Boutique</span>
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isAuthenticated && (
              <button
                onClick={() => navigate('/wishlist')}
                className="flex items-center space-x-2 border-[1.5px] border-[#d2c5b1]/30 hover:border-[#c89b3c] text-[#1f1b14] font-bold px-4 py-2.5 rounded-xl transition-all duration-300 text-sm cursor-pointer"
              >
                <Heart size={16} />
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 border-[1.5px] font-bold px-5 py-2.5 rounded-xl transition-all duration-300 text-sm cursor-pointer ${
                showFilters || hasActiveFilters
                  ? 'bg-[#c89b3c] border-[#c89b3c] text-white'
                  : 'border-[#1f1b14] hover:bg-[#1f1b14] hover:text-white'
              }`}
            >
              <SlidersHorizontal size={16} />
              <span>Filters</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 w-full pt-28 pb-20">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex items-center bg-white rounded-2xl shadow-premium p-2 border border-gray-100 max-w-2xl">
            <Search className="text-[#c89b3c] w-5 h-5 ml-4 shrink-0" />
            <input
              type="text"
              placeholder="Search products by name or description..."
              className="w-full px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); updateSearchParams({ search: '', page: '1' }); }}
                className="p-2 hover:bg-gray-100 rounded-lg mr-1"
              >
                <X size={16} className="text-gray-400" />
              </button>
            )}
            <button
              type="submit"
              className="bg-[#c89b3c] hover:bg-[#b8892e] text-white font-bold px-6 py-2.5 rounded-xl transition-all text-sm cursor-pointer"
            >
              Search
            </button>
          </div>
        </form>

        {/* Active Filters Tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-semibold text-gray-500">Active Filters:</span>
            {searchParams.get('search') && (
              <span className="bg-[#c89b3c]/10 text-[#c89b3c] text-[10px] font-bold px-3 py-1.5 rounded-full border border-[#c89b3c]/20 flex items-center space-x-1">
                <span>Search: "{searchParams.get('search')}"</span>
                <button onClick={() => { setSearchQuery(''); updateSearchParams({ search: '', page: '1' }); }} className="ml-1">
                  <X size={12} />
                </button>
              </span>
            )}
            {searchParams.get('categoryId') && (
              <span className="bg-[#c89b3c]/10 text-[#c89b3c] text-[10px] font-bold px-3 py-1.5 rounded-full border border-[#c89b3c]/20 flex items-center space-x-1">
                <span>{categories.find(c => c.id === searchParams.get('categoryId'))?.name || 'Category'}</span>
                <button onClick={() => handleCategoryChange('')} className="ml-1"><X size={12} /></button>
              </span>
            )}
            {searchParams.get('subCategoryId') && (
              <span className="bg-[#c89b3c]/10 text-[#c89b3c] text-[10px] font-bold px-3 py-1.5 rounded-full border border-[#c89b3c]/20 flex items-center space-x-1">
                <span>{subCategories.find(s => s.id === searchParams.get('subCategoryId'))?.name || 'SubCategory'}</span>
                <button onClick={() => handleSubCategoryChange('')} className="ml-1"><X size={12} /></button>
              </span>
            )}
            {(searchParams.get('minPrice') || searchParams.get('maxPrice')) && (
              <span className="bg-[#c89b3c]/10 text-[#c89b3c] text-[10px] font-bold px-3 py-1.5 rounded-full border border-[#c89b3c]/20 flex items-center space-x-1">
                <span>Price: ₹{searchParams.get('minPrice') || '0'} - ₹{searchParams.get('maxPrice') || 'Any'}</span>
                <button onClick={() => { setMinPrice(''); setMaxPrice(''); updateSearchParams({ minPrice: '', maxPrice: '', page: '1' }); }} className="ml-1"><X size={12} /></button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-[10px] font-bold text-red-500 hover:text-red-700 underline ml-2 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Category Pills */}
        <div className="mb-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center space-x-3 pb-2">
            <button
              onClick={() => handleCategoryChange('')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold border transition-all duration-300 whitespace-nowrap cursor-pointer shadow-sm ${
                !selectedCategory
                  ? 'bg-[#c89b3c] border-[#c89b3c] text-white shadow-[#c89b3c]/20'
                  : 'bg-white border-[#d2c5b1]/30 text-[#1f1b14] hover:border-[#c89b3c] hover:text-[#c89b3c]'
              }`}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold border transition-all duration-300 whitespace-nowrap cursor-pointer shadow-sm ${
                  selectedCategory === cat.id
                    ? 'bg-[#c89b3c] border-[#c89b3c] text-white shadow-[#c89b3c]/20'
                    : 'bg-white border-[#d2c5b1]/30 text-[#1f1b14] hover:border-[#c89b3c] hover:text-[#c89b3c]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-[2rem] p-6 mb-8 shadow-card border border-[#d2c5b1]/20 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-serif font-black text-[#1f1b14]">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* SubCategory Dropdown */}
              {selectedCategory && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Sub Category</label>
                  <select
                    value={selectedSubCategory}
                    onChange={(e) => handleSubCategoryChange(e.target.value)}
                    className="w-full bg-[#fff8f2] border border-[#d2c5b1]/30 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#c89b3c] transition-colors"
                  >
                    <option value="">All Sub Categories</option>
                    {subCategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Min Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-[#fff8f2] border border-[#d2c5b1]/30 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#c89b3c] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Max Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-[#fff8f2] border border-[#d2c5b1]/30 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#c89b3c] transition-colors"
                />
              </div>

              {/* Sort */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full bg-[#fff8f2] border border-[#d2c5b1]/30 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#c89b3c] transition-colors"
                >
                  <option value="">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name">Name: A-Z</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={clearFilters}
                className="px-6 py-2.5 border border-[#d2c5b1]/30 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => { handlePriceFilter(); setShowFilters(false); }}
                className="px-6 py-2.5 bg-[#c89b3c] text-white rounded-xl text-xs font-bold hover:bg-[#b8892e] transition-all cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-serif font-black text-[#1f1b14]">
            {pagination ? `${pagination.total} Product${pagination.total !== 1 ? 's' : ''} Found` : 'Products'}
          </h2>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-5 rounded-2xl text-center font-bold mb-8">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-[2rem] p-4 shadow-card space-y-4 animate-pulse border border-gray-100">
                <div className="w-full h-52 bg-gray-200 rounded-2xl"></div>
                <div className="h-5 bg-gray-200 rounded-lg w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded-lg w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded-lg w-1/3"></div>
                <div className="h-10 bg-gray-200 rounded-xl w-full"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-16 text-center shadow-card border border-[#d2c5b1]/20 max-w-xl mx-auto space-y-4">
            <Package className="w-16 h-16 text-gray-300 mx-auto" />
            <h4 className="text-xl font-serif font-bold text-gray-800">No Products Found</h4>
            <p className="text-gray-500 font-medium text-sm">
              We couldn't find any products matching your criteria. Try adjusting your filters or search terms.
            </p>
            <button
              onClick={clearFilters}
              className="bg-[#c89b3c] text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#b8892e] transition-all cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onWishlistClick={async (id) => {
                    if (!isAuthenticated) return;
                    setWishlistLoadingId(id);
                    if (isWishlisted(id)) { await remove(id); }
                    else { await add(id); }
                    setWishlistLoadingId(null);
                  }}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center space-x-3 mt-12">
                <button
                  onClick={() => updateSearchParams({ page: String(page - 1) })}
                  disabled={page <= 1}
                  className="px-5 py-2.5 border border-[#d2c5b1]/30 rounded-xl text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-all cursor-pointer"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => updateSearchParams({ page: String(pageNum) })}
                      className={`w-10 h-10 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        page === pageNum
                          ? 'bg-[#c89b3c] text-white shadow-[#c89b3c]/20'
                          : 'border border-[#d2c5b1]/30 hover:bg-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => updateSearchParams({ page: String(page + 1) })}
                  disabled={page >= pagination.pages}
                  className="px-5 py-2.5 border border-[#d2c5b1]/30 rounded-xl text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-all cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-[#d2c5b1]/20 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <span className="text-sm font-serif font-black tracking-wider text-[#1f1b14]">
              VS <span className="text-[#c89b3c]">Boutique</span>
            </span>
          </div>
          <div className="text-center md:text-right text-[10px] text-gray-400 font-medium">
            <p>© {new Date().getFullYear()} VS Boutique. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

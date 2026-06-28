import React, { useState, useEffect } from 'react';
import { 
  Heart, Search, Download, ChevronLeft, ChevronRight, Loader2, 
  Sparkles, Store, RefreshCw, Layers
} from 'lucide-react';
import { getAdminWishlists } from '@core/services';

const AdminWishlists = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchWishlists = async () => {
    try {
      const res = await getAdminWishlists();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Error fetching wishlists analytics:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchWishlists().finally(() => setLoading(false));
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchWishlists();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Aggregating Demand Metrics...</p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || { totalWishlists: 0, uniqueWishlistedItems: 0 };
  const topDesigns = data?.topDesigns || [];
  const categoriesBreakdown = data?.categoriesBreakdown || [];

  // Filter trending designs
  const filteredDesigns = topDesigns.filter(d => {
    const matchesSearch = 
      (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.boutiqueName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || d.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredDesigns.length / itemsPerPage) || 1;
  const paginatedDesigns = filteredDesigns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // CSV Exporter for Wishlists
  const exportWishlistsCSV = () => {
    if (filteredDesigns.length === 0) return alert('No data to export');
    const headers = ['Rank', 'Design Name', 'Boutique Name', 'Category', 'Price (INR)', 'Wishlist Count'];
    const rows = filteredDesigns.map((d, index) => [
      index + 1,
      d.name,
      d.boutiqueName,
      d.category,
      d.price,
      d.count
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `popular_wishlists_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Find percentage for categories breakdown
  const totalWishlistsRecorded = categoriesBreakdown.reduce((sum, c) => sum + c.count, 0) || kpis.totalWishlists || 1;

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Saree': return 'bg-pink-500';
      case 'Lehenga': return 'bg-purple-500';
      case 'Blouse': return 'bg-blue-500';
      default: return 'bg-amber-500';
    }
  };

  return (
    <div className="space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Client Wishlist Analytics</h2>
          <p className="text-gray-500 mt-1 font-medium">Outfit demand forecasting, category distributions, and merchant trends.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-3.5 bg-white border border-gray-100 rounded-2xl text-xs font-black text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>REFRESH</span>
          </button>
          <button 
            onClick={exportWishlistsCSV}
            className="flex items-center gap-2 px-5 py-3.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <Download size={14} />
            <span>EXPORT DEMAND CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[
          { label: 'Total Wishlist Records', value: kpis.totalWishlists, icon: Heart, color: 'text-rose-600 bg-rose-50 border-rose-100', desc: "Consolidated user favorites in shopping bag" },
          { label: 'Unique Wishlisted Designs', value: kpis.uniqueWishlistedItems, icon: Sparkles, color: 'text-amber-500 bg-amber-50 border-amber-100', desc: "Distinct merchant catalogue designs chosen" }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm flex items-start gap-5">
              <div className={`p-4 rounded-2xl border ${card.color} shrink-0`}>
                <Icon size={24} />
              </div>
              <div className="space-y-1.5 min-w-0">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{card.label}</span>
                <span className="text-2xl font-black text-gray-900 block truncate">{card.value}</span>
                <span className="text-xs font-medium text-gray-400 block leading-tight">{card.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category distribution breakdown progress */}
      <div className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm space-y-6">
        <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
          <Layers size={18} className="text-primary" /> Category Demand Distribution
        </h3>
        
        <div className="space-y-4">
          {categoriesBreakdown.length > 0 ? (
            categoriesBreakdown.map((c) => {
              const percentage = ((c.count / totalWishlistsRecorded) * 100).toFixed(1);
              return (
                <div key={c.category} className="space-y-2">
                  <div className="flex justify-between text-xs font-black text-gray-600 uppercase">
                    <span>{c.category}</span>
                    <span className="text-gray-900">{c.count} Saves ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${getCategoryColor(c.category)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center py-6">No categorised wishlist metrics found</p>
          )}
        </div>
      </div>

      {/* Renders wishlisted items list */}
      <div className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-50 pb-6">
          <div>
            <h3 className="text-xl font-black text-gray-900">Catalogue Popularity Rankings</h3>
            <p className="text-xs text-gray-400 mt-1">Outfits ranked by number of users who have saved them.</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              placeholder="Search design by name or boutique..." 
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
            />
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Blouse">Blouse</option>
              <option value="Lehenga">Lehenga</option>
              <option value="Saree">Saree</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Designs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedDesigns.length > 0 ? (
            paginatedDesigns.map((d, index) => (
              <div key={d.id} className="p-4 border border-gray-100 rounded-3xl hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
                <div>
                  <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
                    <img 
                      src={d.images && d.images[0] ? d.images[0] : `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=f3f4f6&color=db2777&size=150`}
                      alt={d.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-xl text-[9px] font-black text-white uppercase tracking-wider">
                      RANK #{index + 1 + (currentPage - 1) * itemsPerPage}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-black text-gray-900 line-clamp-1">{d.name}</h4>
                      <span className="text-[10px] font-black uppercase text-primary bg-primary/5 px-2 py-0.5 rounded-md shrink-0">
                        {d.category}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
                      <Store size={13} className="text-gray-400" />
                      <span className="truncate">{d.boutiqueName}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-50 pt-4 mt-2 flex items-center justify-between text-xs font-black">
                  <span className="text-gray-900">₹{Number(d.price).toLocaleString()}</span>
                  <span className="flex items-center gap-1 text-rose-500 bg-rose-50 px-2.5 py-1 rounded-xl">
                    <Heart size={12} fill="currentColor" />
                    <span>{d.count} Saves</span>
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
              No wishlisted items found
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-50 pt-6">
            <span className="text-xs font-semibold text-gray-400">
              Page {currentPage} of {totalPages} ({filteredDesigns.length} items)
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminWishlists;

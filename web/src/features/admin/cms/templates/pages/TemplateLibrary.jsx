import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Clock, TrendingUp, Filter, Plus, ChevronLeft, ChevronRight, Award, Code, Heart, Layout } from 'lucide-react';
import { templatesApi } from '../services/templates.api';

const TIERS = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
const BUILDERS = [
  { key: 'claude', label: 'Claude Code', color: 'bg-purple-100 text-purple-700' },
  { key: 'opencode', label: 'OpenCode', color: 'bg-blue-100 text-blue-700' },
  { key: 'cursor', label: 'Cursor', color: 'bg-cyan-100 text-cyan-700' },
  { key: 'gemini', label: 'Gemini CLI', color: 'bg-orange-100 text-orange-700' },
  { key: 'chatgpt', label: 'ChatGPT', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'bolt', label: 'Bolt', color: 'bg-yellow-100 text-yellow-700' },
  { key: 'lovable', label: 'Lovable', color: 'bg-pink-100 text-pink-700' },
  { key: 'v0', label: 'v0', color: 'bg-indigo-100 text-indigo-700' },
  { key: 'firebase', label: 'Firebase Studio', color: 'bg-amber-100 text-amber-700' },
  { key: 'openrouter', label: 'OpenRouter', color: 'bg-red-100 text-red-700' }
];

export default function TemplateLibrary() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [carouselIndex, setCarouselIndex] = useState(0);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      const params = { page, limit: 20, q: search || undefined, category: selectedCategory || undefined, tier: selectedTier || undefined };

      if (activeTab === 'featured') {
        res = await templatesApi.getFeatured();
        setTemplates(res.templates || []);
      } else if (activeTab === 'latest') {
        res = await templatesApi.getLatest();
        setTemplates(res.templates || []);
      } else if (activeTab === 'popular') {
        res = await templatesApi.getPopular();
        setTemplates(res.templates || []);
      } else {
        res = await templatesApi.list(params);
        setTemplates(res.templates || []);
      }
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, activeTab, selectedCategory, selectedTier]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  useEffect(() => {
    templatesApi.getCategories().then(r => setCategories(r.categories || [])).catch(() => {});
    templatesApi.getFeatured().then(r => setFeatured(r.templates || [])).catch(() => {});
  }, []);

  const handleFavorite = async (id) => {
    try {
      const res = await templatesApi.toggleFavorite(id);
      setFavorites(prev => {
        const next = new Set(prev);
        if (res.favorited) next.add(id);
        else next.delete(id);
        return next;
      });
    } catch {}
  };

  const TierBadge = ({ tier }) => {
    const colors = {
      FREE: 'bg-gray-100 text-gray-600',
      STARTER: 'bg-blue-50 text-blue-600',
      PROFESSIONAL: 'bg-purple-50 text-purple-600',
      ENTERPRISE: 'bg-amber-50 text-amber-600'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${colors[tier] || colors.FREE}`}>
        {tier}
      </span>
    );
  };

  const StarRating = ({ rating = 0, count = 0 }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={12} className={i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
      ))}
      <span className="text-[10px] text-gray-400 ml-1">({count})</span>
    </div>
  );

  const BuilderIcons = ({ builders = [] }) => (
    <div className="flex items-center gap-1">
      {builders.slice(0, 4).map(b => {
        const builder = BUILDERS.find(bx => bx.key === (typeof b === 'string' ? b : b.key || b.name));
        if (!builder) return null;
        return (
          <span key={builder.key} title={builder.label} className={`w-5 h-5 rounded text-[8px] font-bold flex items-center justify-center ${builder.color}`}>
            {builder.label.charAt(0)}
          </span>
        );
      })}
      {builders.length > 4 && <span className="text-[9px] text-gray-400 ml-1">+{builders.length - 4}</span>}
    </div>
  );

  const TabButton = ({ tab, label, icon: Icon }) => (
    <button onClick={() => { setActiveTab(tab); setPage(1); }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
      {Icon && <Icon size={14} />} {label}
    </button>
  );

  const TemplateCard = ({ template }) => (
    <div onClick={() => navigate(`/admin/cms/templates/${template.id}`)}
      className="border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group">
      <div className="relative h-36 bg-gray-50 overflow-hidden">
        {template.previewImage ? (
          <img src={template.previewImage} alt={template.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Layout size={36} className="text-gray-200" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <TierBadge tier={template.tier} />
          {template.featured && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-600">Featured</span>}
        </div>
        <button onClick={(e) => { e.stopPropagation(); handleFavorite(template.id); }}
          className={`absolute top-2 left-2 p-1.5 rounded-lg transition-colors bg-white/80 backdrop-blur-sm ${favorites.has(template.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
          <Heart size={14} fill={favorites.has(template.id) ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-gray-800 truncate">{template.name}</h3>
        </div>
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{template.description || 'No description'}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            {template.category && <span className="px-2 py-0.5 bg-primary/5 text-primary rounded font-bold">{template.category.name || template.category}</span>}
          </div>
          <StarRating rating={template.rating} count={template._count?.ratings || 0} />
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
          <BuilderIcons builders={template.builderCompatibility || []} />
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span className="flex items-center gap-1"><Heart size={11} /> {template._count?.favorites || 0}</span>
            {template._count?.deployments !== undefined && (
              <span className="flex items-center gap-1"><Award size={11} /> {template._count.deployments}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const SkeletonCard = () => (
    <div className="border border-gray-100 rounded-2xl bg-white overflow-hidden animate-pulse">
      <div className="h-36 bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="flex justify-between">
          <div className="h-3 bg-gray-100 rounded w-16" />
          <div className="h-3 bg-gray-100 rounded w-12" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Template Library</h1>
          <p className="text-sm text-gray-400 mt-1">Browse certified templates for the CMS platform</p>
        </div>
        <button onClick={() => navigate('/admin/cms/templates/new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm">
          <Plus size={16} /> New Template
        </button>
      </div>

      {featured.length > 0 && (
        <div className="relative bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-5 overflow-hidden">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Award size={14} /> Featured Templates
          </h3>
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1" style={{ scrollbarWidth: 'none' }}>
            {featured.map(t => (
              <div key={t.id} onClick={() => navigate(`/admin/cms/templates/${t.id}`)}
                className="flex-shrink-0 w-56 border border-primary/20 rounded-xl p-3 bg-white/90 backdrop-blur-sm hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {t.name?.charAt(0) || 'T'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{t.name}</p>
                    <TierBadge tier={t.tier} />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 line-clamp-2">{t.description || ''}</p>
              </div>
            ))}
          </div>
          {featured.length > 3 && (
            <>
              <button onClick={() => setCarouselIndex(i => Math.max(0, i - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white rounded-full shadow-md text-gray-400 hover:text-gray-600">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setCarouselIndex(i => Math.min(featured.length - 3, i + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white rounded-full shadow-md text-gray-400 hover:text-gray-600">
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-gray-100 pb-3 overflow-x-auto">
        <TabButton tab="all" label="All" />
        <TabButton tab="featured" label="Featured" icon={Star} />
        <TabButton tab="latest" label="Latest" icon={Clock} />
        <TabButton tab="popular" label="Popular" icon={TrendingUp} />
        <div className="flex-1" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input type="text" placeholder="Search templates by name or description..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>

        <select value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-0.5">
          {TIERS.map(tier => (
            <button key={tier} onClick={() => setSelectedTier(prev => prev === tier ? '' : tier)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${selectedTier === tier ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
              {tier}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20">
          <Layout size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-lg font-bold text-gray-400 mb-1">No templates found</h3>
          <p className="text-sm text-gray-300">Check back later for new certified templates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => <TemplateCard key={t.id} template={t} />)}
        </div>
      )}

      {total > 20 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
          <span className="text-xs text-gray-400">Page {page} of {Math.ceil(total / 20)}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
        </div>
      )}
    </div>
  );
}

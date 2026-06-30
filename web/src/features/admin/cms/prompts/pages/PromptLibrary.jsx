import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Star, Clock, TrendingUp, Filter, Grid3X3, List, Copy, Check, MessageSquare, MoreVertical, Trash2, Edit3, Bookmark, Code, Download, Eye, Play } from 'lucide-react';
import { promptsApi } from '../services/prompts.api';

export default function PromptLibrary() {
  const [prompts, setPrompts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [categories, setCategories] = useState([]);
  const [builders, setBuilders] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [activeTab, setActiveTab] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, q: search || undefined, category: selectedCategory || undefined, type: selectedType || undefined };
      const res = await promptsApi.list(params);
      setPrompts(res.prompts || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load prompts:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory, selectedType]);

  useEffect(() => { fetchPrompts(); }, [fetchPrompts]);

  useEffect(() => {
    promptsApi.getCategories().then(r => setCategories(r.categories || [])).catch(() => {});
    promptsApi.getBuilders().then(r => setBuilders(r.builders || [])).catch(() => {});
  }, []);

  const handleCopy = async (prompt) => {
    const text = prompt.templateContent || prompt.instructions || prompt.title;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(prompt.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const handleFavorite = async (id) => {
    try {
      const res = await promptsApi.favorite(id);
      setFavorites(prev => {
        const next = new Set(prev);
        if (res.favorited) next.add(id);
        else next.delete(id);
        return next;
      });
    } catch {}
  };

  const promptTypes = [
    'website-generation', 'website-upgrade', 'website-fix',
    'performance-fix', 'seo-fix', 'accessibility-fix', 'security-fix',
    'deployment-fix', 'database-fix', 'api-fix', 'component-fix',
    'tailwind-fix', 'react-fix', 'nextjs-fix', 'express-fix',
    'prisma-fix', 'typescript-fix',
    'commerce', 'inventory', 'boutique', 'salon', 'restaurant',
    'hotel', 'pharmacy', 'education', 'real-estate'
  ];

  const TabButton = ({ tab, label, icon: Icon }) => (
    <button onClick={() => { setActiveTab(tab); setPage(1); }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
      {Icon && <Icon size={14} />} {label}
    </button>
  );

  const PromptCard = ({ prompt }) => (
    <div className="border border-gray-100 rounded-2xl p-5 bg-white space-y-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-gray-800 truncate">{prompt.title}</h3>
            <span className="px-2 py-0.5 text-[9px] font-bold bg-gray-50 text-gray-400 rounded uppercase border border-gray-100 shrink-0">{prompt.promptType?.replace(/-/g, ' ')}</span>
          </div>
          <p className="text-xs text-gray-400 line-clamp-2">{prompt.description || 'No description'}</p>
        </div>
        <button onClick={() => handleFavorite(prompt.id)}
          className={`p-1.5 rounded-lg transition-colors ${favorites.has(prompt.id) ? 'text-yellow-500 bg-yellow-50' : 'text-gray-300 hover:text-yellow-500 hover:bg-yellow-50'}`}>
          <Star size={16} fill={favorites.has(prompt.id) ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-gray-400">
        {prompt.builder && <span className="px-2 py-0.5 bg-primary/5 text-primary rounded font-bold">{prompt.builder.name}</span>}
        {prompt.category && <span className="text-gray-300">{prompt.category.name}</span>}
        {prompt.framework && <span className="text-gray-300">{prompt.framework}</span>}
      </div>

      {prompt.templateContent && (
        <div className="p-3 bg-gray-50/50 rounded-xl font-mono text-[10px] text-gray-500 border border-gray-100 leading-relaxed line-clamp-3 whitespace-pre-wrap">
          {prompt.templateContent.substring(0, 200)}...
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><Star size={12} /> {prompt._count?.favorites || 0}</span>
          <span className="flex items-center gap-1"><Play size={12} /> {prompt._count?.executions || 0}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => handleCopy(prompt)} title="Copy Prompt"
            className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-primary transition-colors">
            {copiedId === prompt.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
          <button title="Preview" className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-primary transition-colors">
            <Eye size={14} />
          </button>
          <button title="Execute" className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-primary transition-colors">
            <Play size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Prompt Library</h1>
          <p className="text-sm text-gray-400 mt-1">Manage AI generation prompts for the CMS platform</p>
        </div>
        <button onClick={() => window.location.hash = '#/admin/cms/prompts/new'}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm">
          <Plus size={16} /> New Prompt
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <TabButton tab="all" label="All Prompts" />
        <TabButton tab="favorites" label="Favorites" icon={Star} />
        <TabButton tab="recent" label="Recent" icon={Clock} />
        <TabButton tab="popular" label="Popular" icon={TrendingUp} />
        <div className="flex-1" />
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-0.5">
          <button onClick={() => setView('grid')}
            className={`p-1.5 rounded ${view === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}>
            <Grid3X3 size={16} />
          </button>
          <button onClick={() => setView('list')}
            className={`p-1.5 rounded ${view === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}>
            <List size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input type="text" placeholder="Search prompts by title, description, or framework..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>

        <select value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={selectedType} onChange={e => { setSelectedType(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">All Types</option>
          {promptTypes.map(t => <option key={t} value={t}>{t.replace(/-/g, ' ')}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-lg font-bold text-gray-400 mb-1">No Prompts Found</h3>
          <p className="text-sm text-gray-300">Create your first prompt to get started</p>
        </div>
      ) : (
        <div className={view === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-3'
        }>
          {prompts.map(p => <PromptCard key={p.id} prompt={p} />)}
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

import React, { useState, useMemo, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { 
  Search, 
  Copy, 
  Check, 
  Download, 
  BookOpen, 
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Clock,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  History,
  FileText,
  HelpCircle,
  Eye
} from 'lucide-react';

import { CMSPage, CMSBadge, CMSCard } from '../../components';
import { DocumentationRenderer } from '../components';
import { WDK_CHAPTERS } from '../utils/mockWdkDocs';
import { developerService } from '../utils/developerServices';

// Lucide Icon resolver helper
const renderChapterIcon = (iconName, size = 15) => {
  const IconComponent = LucideIcons[iconName] || BookOpen;
  return <IconComponent size={size} />;
};

export default function WebsiteDevelopmentKit() {
  const [chapters] = useState(WDK_CHAPTERS);
  const [activeChapterId, setActiveChapterId] = useState(WDK_CHAPTERS[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedFull, setCopiedFull] = useState(false);
  const [activeTab, setActiveTab] = useState('content'); // 'content' | 'history'

  // Local state for interactive features (Recent & Favorites)
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('wdk_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Sync favorites to localStorage
  useEffect(() => {
    localStorage.setItem('wdk_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Track recently viewed chapters
  useEffect(() => {
    if (!activeChapterId) return;
    setRecentlyViewed(prev => {
      const filtered = prev.filter(id => id !== activeChapterId);
      return [activeChapterId, ...filtered].slice(0, 3); // Max 3 items
    });
  }, [activeChapterId]);

  // Active chapter lookup
  const activeChapter = useMemo(() => {
    return chapters.find(c => c.id === activeChapterId) || null;
  }, [chapters, activeChapterId]);

  // Next / Previous chapter handlers
  const activeIndex = useMemo(() => {
    return chapters.findIndex(c => c.id === activeChapterId);
  }, [chapters, activeChapterId]);

  const prevChapter = activeIndex > 0 ? chapters[activeIndex - 1] : null;
  const nextChapter = activeIndex < chapters.length - 1 ? chapters[activeIndex + 1] : null;

  // Toggle favorite state
  const toggleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };

  // Full-text search engine index query
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chapters;
    const query = searchQuery.toLowerCase();

    return chapters.filter(ch => {
      // Indexing metadata
      if (ch.title.toLowerCase().includes(query)) return true;
      if (ch.description.toLowerCase().includes(query)) return true;
      if (ch.searchKeywords.some(kw => kw.toLowerCase().includes(query))) return true;
      if (ch.category.toLowerCase().includes(query)) return true;

      // Indexing nested sections properties
      return ch.sections.some(sec => {
        if (sec.heading && sec.heading.toLowerCase().includes(query)) return true;
        if (sec.body && sec.body.toLowerCase().includes(query)) return true;
        if (sec.command && sec.command.toLowerCase().includes(query)) return true;
        if (sec.codeBlocks && sec.codeBlocks.some(cb => cb.code.toLowerCase().includes(query) || cb.label.toLowerCase().includes(query))) return true;
        if (sec.promptData && (
          sec.promptData.prompt.toLowerCase().includes(query) || 
          sec.promptData.title.toLowerCase().includes(query) ||
          sec.promptData.description.toLowerCase().includes(query)
        )) return true;
        if (sec.apiData && (
          sec.apiData.endpoint.toLowerCase().includes(query) || 
          sec.apiData.validation.toLowerCase().includes(query)
        )) return true;
        if (sec.treeData && sec.treeData.some(node => node.name.toLowerCase().includes(query))) return true;
        return false;
      });
    });
  }, [chapters, searchQuery]);

  // Launch service action handlers
  const handleCopyFullConfig = async () => {
    const rawConfig = JSON.stringify(chapters, null, 2);
    const success = await developerService.copyToClipboard(rawConfig);
    if (success) {
      setCopiedFull(true);
      setTimeout(() => setCopiedFull(false), 2000);
    }
  };

  const handleDownloadStarter = (starterName) => {
    developerService.downloadStarterZip(starterName);
  };

  const handleRunAudit = () => {
    const report = developerService.runSchemaAudit();
    alert(`SDK Schema Audit Result: ${report.status}\nChecked ${report.checksPassed} rules cleanly.`);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalPrompts = WDK_CHAPTERS.reduce((acc, ch) => {
      return acc + ch.sections.filter(s => s.type === 'prompt').length;
    }, 0);
    const totalApis = WDK_CHAPTERS.reduce((acc, ch) => {
      return acc + ch.sections.filter(s => s.type === 'api').length;
    }, 0);
    return {
      chaptersCount: WDK_CHAPTERS.length,
      promptsCount: totalPrompts,
      apisCount: totalApis
    };
  }, []);

  return (
    <CMSPage 
      title="Website Development Kit (WDK)"
      description="The master engineering knowledge base and Developer Operating System for AI boutique templating."
      comingSoon={false}
    >
      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* ========================================================
            LEFT PANEL: TOC Index, Favorites & Recents
            ======================================================== */}
        <div className="w-full lg:w-1/4 bg-white border border-gray-150 rounded-3xl p-5 space-y-4 shrink-0 shadow-sm text-left">
          
          {/* Search Bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search developer docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10 transition-all placeholder-gray-400"
            />
          </div>

          {/* Chapters Table of Contents */}
          <div className="flex flex-col space-y-1">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1">Chapters Index</label>
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 pt-1">
              {filteredChapters.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400 font-bold">No matches found.</div>
              ) : (
                filteredChapters.map(ch => {
                  const isActive = ch.id === activeChapterId;
                  const isFav = favorites.includes(ch.id);

                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setActiveChapterId(ch.id);
                        setActiveTab('content');
                      }}
                      className={`w-full text-left px-3.5 py-3 rounded-2xl transition-all duration-200 text-xs font-bold flex items-center justify-between group ${
                        isActive 
                          ? 'bg-primary text-white shadow-md shadow-primary/10' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}>
                          {renderChapterIcon(ch.icon)}
                        </span>
                        <span>{ch.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isFav && <BookmarkCheck size={12} className={isActive ? 'text-white/80' : 'text-primary'} />}
                        <ChevronRight size={12} className={isActive ? 'text-white/80' : 'text-gray-300 group-hover:text-gray-500'} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Recently Viewed Panel */}
          {recentlyViewed.length > 0 && (
            <div className="border-t border-gray-50 pt-3 space-y-2">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center gap-1">
                <History size={11} /> Recently Viewed
              </label>
              <div className="space-y-1 px-1">
                {recentlyViewed.map(id => {
                  const ch = chapters.find(c => c.id === id);
                  if (!ch) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        setActiveChapterId(id);
                        setActiveTab('content');
                      }}
                      className="w-full text-left py-1 text-[10px] font-bold text-gray-500 hover:text-primary transition-all flex items-center gap-1.5"
                    >
                      <FileText size={10} className="text-gray-400" />
                      <span className="truncate">{ch.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            CENTER PANEL: Documentation Engine & View Area
            ======================================================== */}
        <div className="flex-1 w-full bg-white border border-gray-150 rounded-3xl p-6 lg:p-8 shadow-sm text-left">
          
          {activeChapter ? (
            <div className="space-y-8 animate-fade-in">
              
              {/* Breadcrumb Map Navigation */}
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                <span>CMS Workspace</span>
                <ChevronRight size={10} />
                <span>WDK Developer Portal</span>
                <ChevronRight size={10} />
                <span className="text-primary">{activeChapter.category}</span>
              </div>

              {/* Title Header with Favorite Bookmark action */}
              <div className="border-b border-gray-100 pb-5 flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <CMSBadge variant="default">{activeChapter.difficulty}</CMSBadge>
                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                      <Clock size={12} /> {activeChapter.estimatedReadingTime} read
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">| Version {activeChapter.version}</span>
                  </div>
                  <h1 className="text-xl font-bold text-gray-800">{activeChapter.title}</h1>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{activeChapter.description}</p>
                </div>

                <button
                  onClick={() => toggleFavorite(activeChapter.id)}
                  className={`p-2 border rounded-xl transition-all duration-200 ${
                    favorites.includes(activeChapter.id)
                      ? 'bg-primary/5 border-primary text-primary'
                      : 'border-gray-250/20 text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Bookmark Chapter"
                >
                  <Bookmark size={15} className={favorites.includes(activeChapter.id) ? 'fill-primary' : ''} />
                </button>
              </div>

              {/* Tab Selector: Content vs. Version History */}
              <div className="flex border-b border-gray-100 pb-2">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`pb-2 px-4 text-xs font-bold border-b-2 -mb-[10px] transition-all flex items-center gap-1.5 ${
                    activeTab === 'content' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <BookOpen size={14} /> Documentation
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`pb-2 px-4 text-xs font-bold border-b-2 -mb-[10px] transition-all ml-3 flex items-center gap-1.5 ${
                    activeTab === 'history' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <History size={14} /> Version History
                </button>
              </div>

              {/* TAB 1: Main Content Section Renderer */}
              {activeTab === 'content' && (
                <div className="space-y-6">
                  {activeChapter.sections.map((section, sIdx) => (
                    <DocumentationRenderer 
                      key={sIdx} 
                      section={section} 
                      onDownloadStarter={handleDownloadStarter}
                    />
                  ))}
                </div>
              )}

              {/* TAB 2: Version History Logs */}
              {activeTab === 'history' && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-xs font-bold text-gray-800">Chapter Changelog</h3>
                  <div className="border border-gray-150 rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-150 font-bold text-gray-400 uppercase tracking-wider text-[9px]">
                        <tr>
                          <th className="p-3.5 pl-5">Version</th>
                          <th className="p-3.5">Release Date</th>
                          <th className="p-3.5">Author</th>
                          <th className="p-3.5 pr-5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-bold text-gray-600">
                        {activeChapter.versionHistory?.map((log, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="p-3.5 pl-5 font-mono text-[10px] text-gray-800">{log.version}</td>
                            <td className="p-3.5 text-gray-500 font-medium">{new Date(log.created).toLocaleDateString()}</td>
                            <td className="p-3.5 text-gray-500">{log.author}</td>
                            <td className="p-3.5 pr-5">
                              <span className={`px-2 py-0.5 text-[8px] font-black rounded-md ${
                                log.status === 'Published' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bottom Page Navigation Controls */}
              <div className="flex items-center justify-between gap-4 pt-8 border-t border-gray-100 mt-10">
                {prevChapter ? (
                  <button
                    onClick={() => {
                      setActiveChapterId(prevChapter.id);
                      setActiveTab('content');
                    }}
                    className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-2xl transition-all border border-gray-100 font-bold text-xs text-gray-600 text-left w-1/2 max-w-xs"
                  >
                    <ChevronLeft size={16} className="text-gray-400" />
                    <div>
                      <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Previous Chapter</div>
                      <div className="truncate text-gray-700 mt-0.5">{prevChapter.title}</div>
                    </div>
                  </button>
                ) : <div className="w-1/2"></div>}

                {nextChapter ? (
                  <button
                    onClick={() => {
                      setActiveChapterId(nextChapter.id);
                      setActiveTab('content');
                    }}
                    className="flex items-center justify-between gap-2 p-3 hover:bg-gray-50 rounded-2xl transition-all border border-gray-100 font-bold text-xs text-gray-600 text-right w-1/2 max-w-xs ml-auto"
                  >
                    <div className="min-w-0">
                      <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Next Chapter</div>
                      <div className="truncate text-gray-700 mt-0.5">{nextChapter.title}</div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 shrink-0" />
                  </button>
                ) : <div className="w-1/2"></div>}
              </div>

            </div>
          ) : (
            <div className="py-12">
              <p className="text-xs text-gray-400 font-bold text-center">No documentation chapter found matching results.</p>
            </div>
          )}

        </div>

        {/* ========================================================
            RIGHT PANEL: Developer Utilities Toolbar
            ======================================================== */}
        <div className="w-full lg:w-1/4 space-y-5 shrink-0 lg:sticky lg:top-4 text-left">
          
          {/* Quick Actions Panel */}
          <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-xs text-gray-800 border-b border-gray-50 pb-2">Developer Utilities</h3>
            
            <button
              onClick={handleCopyFullConfig}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-2xl text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
            >
              {copiedFull ? (
                <>
                  <Check size={14} className="text-white" /> Config Copied
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy Full WDK Config
                </>
              )}
            </button>

            <button
              onClick={handleRunAudit}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 rounded-2xl text-xs font-bold border border-gray-250/20 transition-all"
            >
              <Sparkles size={14} className="text-primary" /> Run SDK Schema Audit
            </button>
          </div>

          {/* Quick Docs Metrics summary */}
          <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-3.5 shadow-sm text-xs font-bold text-gray-600">
            <h3 className="font-bold text-xs text-gray-800 border-b border-gray-50 pb-2">Kit Metrics</h3>
            <div className="flex justify-between items-center">
              <span>Total Chapters</span>
              <span className="text-gray-800">{stats.chaptersCount}</span>
            </div>
            <div className="flex justify-between items-center pt-0.5">
              <span>Prompts Indexed</span>
              <span className="text-gray-800">{stats.promptsCount}</span>
            </div>
            <div className="flex justify-between items-center pt-0.5">
              <span>SDK REST Endpoints</span>
              <span className="text-gray-800">{stats.apisCount}</span>
            </div>
          </div>

          {/* Bookmark list summary */}
          {favorites.length > 0 && (
            <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-3 shadow-sm text-xs font-bold text-gray-600">
              <h3 className="font-bold text-xs text-gray-800 border-b border-gray-50 pb-2">Bookmarked Chapters</h3>
              <div className="space-y-1.5">
                {favorites.map(id => {
                  const ch = chapters.find(c => c.id === id);
                  if (!ch) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        setActiveChapterId(id);
                        setActiveTab('content');
                      }}
                      className="w-full text-left py-0.5 text-gray-500 hover:text-primary transition-all flex items-center gap-1.5"
                    >
                      <Bookmark size={12} className="text-primary fill-primary shrink-0" />
                      <span className="truncate">{ch.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* External Links */}
          <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-3 shadow-sm text-[10px] text-gray-500 font-bold">
            <h3 className="font-bold text-xs text-gray-800 border-b border-gray-50 pb-2">Developer Resources</h3>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center justify-between text-gray-500 hover:text-primary pt-1">
              <span>WDK GitHub Repository</span>
              <ExternalLink size={12} />
            </a>
            <a href="https://npm.js" target="_blank" rel="noreferrer" className="flex items-center justify-between text-gray-500 hover:text-primary pt-0.5">
              <span>NPM Package Registry</span>
              <ExternalLink size={12} />
            </a>
          </div>

        </div>

      </div>
    </CMSPage>
  );
}

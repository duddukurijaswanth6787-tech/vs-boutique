import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Star, Download, Check, Share2, Clock, User, Tag, Code, Award, AlertTriangle, Archive, Trash2, Send, Image, ChevronRight, ChevronLeft, History, Layers } from 'lucide-react';
import { templatesApi } from '../services/templates.api';

const PIPELINE_STEPS = ['DRAFT', 'VERIFYING', 'CERTIFYING', 'FIXING', 'CERTIFIED', 'PUBLISHED', 'ARCHIVED'];

const TIER_STYLES = {
  FREE: { bg: 'bg-gray-100 text-gray-600', label: 'Free' },
  STARTER: { bg: 'bg-blue-50 text-blue-600', label: 'Starter' },
  PROFESSIONAL: { bg: 'bg-purple-50 text-purple-600', label: 'Professional' },
  ENTERPRISE: { bg: 'bg-amber-50 text-amber-600', label: 'Enterprise' }
};

const STATUS_STYLES = {
  DRAFT: 'bg-gray-100 text-gray-600',
  VERIFYING: 'bg-blue-50 text-blue-600',
  CERTIFYING: 'bg-purple-50 text-purple-600',
  FIXING: 'bg-orange-50 text-orange-600',
  CERTIFIED: 'bg-emerald-50 text-emerald-600',
  PUBLISHED: 'bg-green-50 text-green-600',
  ARCHIVED: 'bg-red-50 text-red-600',
  DEPRECATED: 'bg-amber-50 text-amber-600'
};

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

export default function TemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [assignBusinessId, setAssignBusinessId] = useState('');
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSuperAdmin, setIsSuperAdmin] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      templatesApi.get(id).catch(() => ({ template: null })),
      templatesApi.getVersions(id).catch(() => ({ versions: [] })),
      templatesApi.getPipelineStatus(id).catch(() => ({ pipeline: null }))
    ]).then(([t, v, p]) => {
      setTemplate(t.template || null);
      setVersions(v.versions || []);
      setPipelineStatus(p.pipeline || null);
      if (t.template) {
        setFavorited(t.template.isFavorited || false);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handleFavorite = async () => {
    try {
      const res = await templatesApi.toggleFavorite(id);
      setFavorited(res.favorited);
    } catch {}
  };

  const handleRate = async () => {
    if (!rating) return;
    try {
      await templatesApi.rateTemplate(id, rating, ratingComment);
      setShowRate(false);
      setRating(0);
      setRatingComment('');
    } catch (err) { alert('Rating failed: ' + err.message); }
  };

  const handleExport = async (format) => {
    try {
      const blob = await templatesApi.exportTemplate(id, format);
      const url = window.URL.createObjectURL(new Blob([JSON.stringify(blob, null, 2)]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template?.name || 'template'}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      setShowExport(false);
    } catch (err) { alert('Export failed: ' + err.message); }
  };

  const handlePublish = async () => {
    if (!confirm('Publish this template?')) return;
    try { await templatesApi.publishTemplate(id); window.location.reload(); }
    catch (err) { alert('Publish failed: ' + err.message); }
  };

  const handleArchive = async () => {
    if (!confirm('Archive this template?')) return;
    try { await templatesApi.archiveTemplate(id); window.location.reload(); }
    catch (err) { alert('Archive failed: ' + err.message); }
  };

  const handleDeprecate = async () => {
    if (!confirm('Deprecate this template?')) return;
    try { await templatesApi.deprecateTemplate(id); window.location.reload(); }
    catch (err) { alert('Deprecate failed: ' + err.message); }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this template?')) return;
    try { await templatesApi.delete(id); navigate('/admin/cms/templates'); }
    catch (err) { alert('Delete failed: ' + err.message); }
  };

  const handleAssign = async () => {
    if (!assignBusinessId.trim()) return;
    try {
      await templatesApi.assignToBusiness(id, { businessId: assignBusinessId });
      setShowAssign(false);
      setAssignBusinessId('');
      alert('Template assigned successfully');
    } catch (err) { alert('Assign failed: ' + err.message); }
  };

  const images = template?.previewImage ? [template.previewImage, ...(template.galleryImages || [])].filter(Boolean) : [];

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  if (!template) return (
    <div className="text-center py-20">
      <AlertTriangle size={48} className="mx-auto text-gray-200 mb-4" />
      <h3 className="text-lg font-bold text-gray-400 mb-1">Template Not Found</h3>
      <p className="text-sm text-gray-300">The template you are looking for does not exist.</p>
      <button onClick={() => navigate('/admin/cms/templates')} className="mt-4 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50">Back to Library</button>
    </div>
  );

  const currentStepIndex = PIPELINE_STEPS.indexOf(template.status || 'DRAFT');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/cms/templates')} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{template.name}</h1>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${TIER_STYLES[template.tier]?.bg || TIER_STYLES.FREE.bg}`}>{template.tier}</span>
            {template.category && (
              <span className="px-2 py-0.5 bg-primary/5 text-primary rounded text-[10px] font-bold">{template.category.name || template.category}</span>
            )}
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_STYLES[template.status] || STATUS_STYLES.DRAFT}`}>{template.status}</span>
            {template.featured && <Star size={16} className="text-amber-400 fill-amber-400" />}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleFavorite}
            className={`p-2 rounded-lg transition-colors ${favorited ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}>
            <Heart size={18} fill={favorited ? 'currentColor' : 'none'} />
          </button>
          <div className="relative">
            <button onClick={() => setShowExport(!showExport)}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50">
              <Download size={14} /> Export
            </button>
            {showExport && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-10 min-w-[140px]">
                <button onClick={() => handleExport('json')} className="w-full text-left px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-t-xl">Export as JSON</button>
                <button onClick={() => handleExport('md')} className="w-full text-left px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-b-xl">Export as Markdown</button>
              </div>
            )}
          </div>
          <button onClick={() => setShowRate(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50">
            <Star size={14} /> Rate
          </button>
          <button onClick={() => navigate(`/admin/cms/templates/${id}/versions`)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50">
            <History size={14} /> Versions
          </button>
          <button onClick={() => navigate(`/admin/cms/templates/${id}/deployments`)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50">
            <Layers size={14} /> Deployments
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {images.length > 0 && (
            <div className="relative bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
              <div className="aspect-video relative">
                <img src={images[currentImageIndex]} alt={`${template.name} preview`} className="w-full h-full object-cover" />
              </div>
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  {images.map((_, idx) => (
                    <button key={idx} onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'}`} />
                  ))}
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={() => setCurrentImageIndex(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 rounded-full shadow-sm text-gray-500 hover:text-gray-700">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setCurrentImageIndex(i => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 rounded-full shadow-sm text-gray-500 hover:text-gray-700">
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
          )}

          <div className="border border-gray-100 rounded-2xl p-5 bg-white">
            <h3 className="text-sm font-bold text-gray-800 mb-3">Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{template.description || 'No description provided.'}</p>
          </div>

          {template.manifest && (
            <div className="border border-gray-100 rounded-2xl p-5 bg-white">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Manifest</h3>
              <pre className="p-4 bg-gray-50 rounded-xl font-mono text-[10px] text-gray-600 border border-gray-100 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(template.manifest, null, 2)}</pre>
            </div>
          )}

          <div className="border border-gray-100 rounded-2xl p-5 bg-white">
            <h3 className="text-sm font-bold text-gray-800 mb-3">Pipeline Status</h3>
            <div className="flex items-center justify-between">
              {PIPELINE_STEPS.map((step, idx) => {
                const isCompleted = currentStepIndex > idx;
                const isCurrent = currentStepIndex === idx;
                const isPending = currentStepIndex < idx;
                return (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-primary text-white ring-2 ring-primary/30' : 'bg-gray-100 text-gray-400'}`}>
                        {isCompleted ? <Check size={14} /> : idx + 1}
                      </div>
                      <span className={`text-[9px] font-bold text-center ${isCurrent ? 'text-primary' : isCompleted ? 'text-emerald-600' : 'text-gray-400'}`}>{step}</span>
                    </div>
                    {idx < PIPELINE_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 ${isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-primary/50' : 'bg-gray-100'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {template.tags && template.tags.length > 0 && (
            <div className="border border-gray-100 rounded-2xl p-5 bg-white">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5"><Tag size={14} /> Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {template.tags.map((t, idx) => {
                  const tagKey = typeof t === 'string' ? t : t.tag?.key || t.key || t.name;
                  return <span key={idx} className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-bold border border-gray-100">{tagKey}</span>;
                })}
              </div>
            </div>
          )}

          {template.builderCompatibility && template.builderCompatibility.length > 0 && (
            <div className="border border-gray-100 rounded-2xl p-5 bg-white">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5"><Code size={14} /> Builder Compatibility</h3>
              <div className="flex flex-wrap gap-2">
                {template.builderCompatibility.map((b, idx) => {
                  const builderKey = typeof b === 'string' ? b : b.key || b.name;
                  const builder = BUILDERS.find(bx => bx.key === builderKey);
                  return (
                    <span key={idx} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${builder?.color || 'bg-gray-100 text-gray-600'} border border-transparent`}>
                      {builder?.label || builderKey}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="border border-gray-100 rounded-2xl p-5 bg-white">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Details</h3>
            <div className="space-y-3">
              {template.industry && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Industry</span>
                  <span className="text-xs font-bold text-gray-600">{template.industry}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Created</span>
                <span className="text-xs font-bold text-gray-600">{new Date(template.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Updated</span>
                <span className="text-xs font-bold text-gray-600">{new Date(template.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Rating</span>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-bold text-gray-600">{template.rating || '0'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Favorites</span>
                <span className="text-xs font-bold text-gray-600">{template._count?.favorites || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Deployments</span>
                <span className="text-xs font-bold text-gray-600">{template._count?.deployments || 0}</span>
              </div>
              {template.author && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Author</span>
                  <span className="text-xs font-bold text-gray-600">{template.author.name || template.author}</span>
                </div>
              )}
            </div>
          </div>

          {versions.length > 0 && (
            <div className="border border-gray-100 rounded-2xl p-5 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Version History</h3>
                <button onClick={() => navigate(`/admin/cms/templates/${id}/versions`)} className="text-[10px] text-primary font-bold hover:underline">View All</button>
              </div>
              <div className="space-y-2">
                {versions.slice(0, 5).map(v => (
                  <div key={v.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-primary/5 text-primary px-1.5 py-0.5 rounded">v{v.version}</span>
                      <span className="text-xs text-gray-500">{v.changeNotes?.substring(0, 30) || 'No notes'}</span>
                    </div>
                    <span className="text-[9px] text-gray-300">{new Date(v.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSuperAdmin && (
            <div className="border border-gray-100 rounded-2xl p-5 bg-white space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Admin Actions</h3>
              {template.status !== 'PUBLISHED' && (
                <button onClick={handlePublish}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors">
                  <Send size={14} /> Publish
                </button>
              )}
              {template.status !== 'ARCHIVED' && (
                <button onClick={handleArchive}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-orange-200 text-orange-600 rounded-xl text-xs font-bold hover:bg-orange-50 transition-colors">
                  <Archive size={14} /> Archive
                </button>
              )}
              {template.status !== 'DEPRECATED' && (
                <button onClick={handleDeprecate}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-amber-200 text-amber-600 rounded-xl text-xs font-bold hover:bg-amber-50 transition-colors">
                  <AlertTriangle size={14} /> Deprecate
                </button>
              )}
              <button onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}

          {isSuperAdmin && (
            <div className="border border-gray-100 rounded-2xl p-5 bg-white">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Assign to Business</h3>
              {!showAssign ? (
                <button onClick={() => setShowAssign(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50">
                  <Share2 size={14} /> Assign Template
                </button>
              ) : (
                <div className="space-y-2">
                  <input value={assignBusinessId} onChange={e => setAssignBusinessId(e.target.value)}
                    placeholder="Business ID" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <div className="flex items-center gap-2">
                    <button onClick={handleAssign} className="flex-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold">Assign</button>
                    <button onClick={() => setShowAssign(false)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-500">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {template.industry && (
            <button onClick={() => navigate(`/admin/cms/templates/${id}/analytics`)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50">
              <Award size={14} /> View Analytics
            </button>
          )}
        </div>
      </div>

      {showRate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowRate(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-gray-800 mb-4">Rate this Template</h3>
            <div className="flex items-center gap-1 mb-4 justify-center">
              {[1, 2, 3, 4, 5].map(i => (
                <button key={i} onClick={() => setRating(i)}
                  className={`p-1 transition-colors ${i <= rating ? 'text-yellow-400' : 'text-gray-200'}`}>
                  <Star size={28} fill={i <= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
            <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)}
              placeholder="Add a comment (optional)" rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 mb-4" />
            <div className="flex items-center gap-2">
              <button onClick={handleRate} disabled={!rating}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 disabled:bg-gray-300">Submit Rating</button>
              <button onClick={() => setShowRate(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

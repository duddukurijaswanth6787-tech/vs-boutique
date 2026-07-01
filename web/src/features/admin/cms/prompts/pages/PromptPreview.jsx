import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Play, Code, MessageSquare, ExternalLink } from 'lucide-react';
import { promptsApi } from '../services/prompts.api';

export default function PromptPreview() {
  const { id } = useParams();
  const [prompt, setPrompt] = useState(null);
  const [variables, setVariables] = useState({});
  const [rendered, setRendered] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('preview');

  useEffect(() => {
    if (id) {
      promptsApi.get(id).then(r => {
        setPrompt(r.prompt);
        setVariables(r.prompt.variables || {});
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id]);

  const handleRender = async () => {
    try {
      const res = await promptsApi.render(id, variables);
      setRendered(res.content);
      setActiveTab('rendered');
    } catch (err) { alert('Render failed: ' + err.message); }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rendered || prompt?.templateContent || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!prompt) return <div className="text-center py-20 text-gray-400">Prompt not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{prompt.title}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{prompt.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50">
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
          </button>
          <button onClick={handleRender} className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90">
            <Play size={14} /> Render
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            {['template', 'rendered', 'preview'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                {tab === 'template' ? 'Original Template' : tab === 'rendered' ? 'Rendered Output' : 'Formatted Preview'}
              </button>
            ))}
          </div>

          <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl font-mono text-xs text-gray-700 whitespace-pre-wrap min-h-[300px] leading-relaxed">
            {activeTab === 'template' && (prompt.templateContent || 'No template content')}
            {activeTab === 'rendered' && (rendered || 'Click "Render" to see the output')}
            {activeTab === 'preview' && (
              <div className="prose prose-xs max-w-none">
                {rendered ? rendered.split('\n').map((line, i) => (
                  <p key={i} className="text-xs text-gray-700">{line}</p>
                )) : 'Click "Render" then switch to preview'}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Prompt Info</h3>
            <div className="space-y-2 text-xs">
              <div><span className="text-gray-400">Type:</span> <span className="font-bold text-gray-700">{prompt.promptType?.replace(/-/g, ' ')}</span></div>
              <div><span className="text-gray-400">Version:</span> <span className="font-bold text-gray-700">v{prompt.version}</span></div>
              {prompt.framework && <div><span className="text-gray-400">Framework:</span> <span className="font-bold text-gray-700">{prompt.framework}</span></div>}
              {prompt.category && <div><span className="text-gray-400">Category:</span> <span className="font-bold text-gray-700">{prompt.category.name}</span></div>}
              {prompt.builder && <div><span className="text-gray-400">Builder:</span> <span className="font-bold text-gray-700">{prompt.builder.name}</span></div>}
            </div>
          </div>

          <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Variables</h3>
            <div className="space-y-2">
              {Object.keys(variables).length === 0 ? (
                <p className="text-xs text-gray-400">No variables defined</p>
              ) : Object.entries(variables).map(([key, val]) => (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">{key}</label>
                  <input value={variables[key]} onChange={e => setVariables(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              ))}
            </div>
          </div>

          {prompt.tags?.length > 0 && (
            <div className="border border-gray-100 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {prompt.tags.map(t => (
                  <span key={t.tag?.id || t.id} className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-[10px] font-bold border border-gray-100">
                    {t.tag?.name || t.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

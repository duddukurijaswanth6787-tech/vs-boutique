import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Eye, Play, Copy, Check, Code } from 'lucide-react';
import { promptsApi } from '../services/prompts.api';

export default function PromptEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [categories, setCategories] = useState([]);
  const [builders, setBuilders] = useState([]);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', promptType: 'website-generation', categoryId: '',
    builderId: '', framework: '', instructions: '', rules: '', outputFormat: '',
    codingStandards: '', templateContent: '', variables: '{}', tags: ''
  });

  useEffect(() => {
    promptsApi.getCategories().then(r => setCategories(r.categories || [])).catch(() => {});
    promptsApi.getBuilders().then(r => setBuilders(r.builders || [])).catch(() => {});
    if (!isNew) {
      promptsApi.get(id).then(r => {
        const p = r.prompt;
        setForm({
          title: p.title || '', description: p.description || '', promptType: p.promptType || 'website-generation',
          categoryId: p.categoryId || '', builderId: p.builderId || '', framework: p.framework || '',
          instructions: p.instructions || '', rules: p.rules || '', outputFormat: p.outputFormat || '',
          codingStandards: p.codingStandards || '', templateContent: p.templateContent || '',
          variables: JSON.stringify(p.variables || {}, null, 2), tags: (p.tags || []).map(t => t.tag?.key || t.key).join(', ')
        });
        setLoading(false);
      }).catch(() => { setLoading(false); });
    }
  }, [id]);

  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        ...form,
        variables: (() => { try { return JSON.parse(form.variables); } catch { return {}; } })(),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
      };
      const res = isNew ? await promptsApi.create(data) : await promptsApi.update(id, data);
      if (isNew) navigate(`/admin/cms/prompts/${res.prompt.id}/edit`, { replace: true });
    } catch (err) { alert('Save failed: ' + err.message); }
    finally { setSaving(false); }
  };

  const handlePreview = async () => {
    try {
      const res = await promptsApi.render(id || 'preview', (() => { try { return JSON.parse(form.variables); } catch { return {}; } })());
      setPreview(res.content);
    } catch (err) { alert('Preview failed: ' + err.message); }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(form.templateContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const promptTypes = [
    'website-generation', 'website-upgrade', 'website-fix', 'performance-fix', 'seo-fix',
    'accessibility-fix', 'security-fix', 'deployment-fix', 'database-fix', 'api-fix',
    'component-fix', 'tailwind-fix', 'react-fix', 'nextjs-fix', 'express-fix',
    'prisma-fix', 'typescript-fix', 'commerce', 'inventory', 'boutique',
    'salon', 'restaurant', 'hotel', 'pharmacy', 'education', 'real-estate'
  ];

  const Field = ({ label, children, fullWidth }) => (
    <div className={fullWidth ? 'col-span-full' : ''}>
      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/cms/prompt-library')} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{isNew ? 'New Prompt' : 'Edit Prompt'}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{isNew ? 'Create a new prompt template' : `Editing: ${form.title}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && <button onClick={handlePreview} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50"><Eye size={14} /> Preview</button>}
          <button onClick={handleSave} disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors shadow-sm ${saving ? 'bg-gray-400' : 'bg-primary hover:bg-primary/90'}`}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Prompt'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Title">
              <input value={form.title} onChange={handleChange('title')} placeholder="Prompt title" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </Field>
            <Field label="Framework">
              <input value={form.framework} onChange={handleChange('framework')} placeholder="e.g. React, Next.js" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </Field>
          </div>

          <Field label="Description" fullWidth>
            <textarea value={form.description} onChange={handleChange('description')} rows={2} placeholder="Brief description" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </Field>

          <Field label="Template Content" fullWidth>
            <textarea value={form.templateContent} onChange={handleChange('templateContent')} rows={12}
              placeholder="Enter prompt template with {{variable}} placeholders..." className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </Field>

          <Field label="Instructions" fullWidth>
            <textarea value={form.instructions} onChange={handleChange('instructions')} rows={4} placeholder="Instructions for the AI builder" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </Field>

          <Field label="Rules" fullWidth>
            <textarea value={form.rules} onChange={handleChange('rules')} rows={4} placeholder="Coding rules and constraints" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </Field>

          <Field label="Output Format" fullWidth>
            <textarea value={form.outputFormat} onChange={handleChange('outputFormat')} rows={3} placeholder="Expected output format" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </Field>

          <Field label="Coding Standards" fullWidth>
            <textarea value={form.codingStandards} onChange={handleChange('codingStandards')} rows={3} placeholder="Coding standards to follow" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </Field>
        </div>

        <div className="space-y-4">
          <Field label="Prompt Type">
            <select value={form.promptType} onChange={handleChange('promptType')} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              {promptTypes.map(t => <option key={t} value={t}>{t.replace(/-/g, ' ')}</option>)}
            </select>
          </Field>

          <Field label="Category">
            <select value={form.categoryId} onChange={handleChange('categoryId')} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          <Field label="AI Builder">
            <select value={form.builderId} onChange={handleChange('builderId')} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Any builder</option>
              {builders.map(b => <option key={b.id} value={b.id}>{b.name} ({b.provider})</option>)}
            </select>
          </Field>

          <Field label="Tags (comma separated)">
            <input value={form.tags} onChange={handleChange('tags')} placeholder="react, typescript, tailwind" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </Field>

          <Field label="Variables (JSON)">
            <textarea value={form.variables} onChange={handleChange('variables')} rows={6} placeholder='{"framework":"React","businessName":"My Shop"}' className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </Field>

          {preview && (
            <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
              <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Rendered Preview</h3>
              <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">{preview}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

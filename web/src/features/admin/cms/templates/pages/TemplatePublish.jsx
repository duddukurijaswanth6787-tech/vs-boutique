import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Upload, X } from 'lucide-react';
import { templatesApi } from '../services/templates.api';

const TIERS = [
  { value: 'FREE', label: 'Free' },
  { value: 'STARTER', label: 'Starter' },
  { value: 'PROFESSIONAL', label: 'Professional' },
  { value: 'ENTERPRISE', label: 'Enterprise' }
];

const BUILDER_OPTIONS = [
  { key: 'claude', label: 'Claude Code' },
  { key: 'opencode', label: 'OpenCode' },
  { key: 'cursor', label: 'Cursor' },
  { key: 'gemini', label: 'Gemini CLI' },
  { key: 'chatgpt', label: 'ChatGPT' },
  { key: 'bolt', label: 'Bolt' },
  { key: 'lovable', label: 'Lovable' },
  { key: 'v0', label: 'v0' },
  { key: 'firebase', label: 'Firebase Studio' },
  { key: 'openrouter', label: 'OpenRouter' }
];

export default function TemplatePublish() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '',
    description: '',
    industry: '',
    tier: 'FREE',
    categoryId: '',
    thumbnail: '',
    previewImage: '',
    manifest: '{}',
    tags: [],
    builderCompatibility: []
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    templatesApi.getCategories().then(r => setCategories(r.categories || [])).catch(() => {});
    templatesApi.getTags().then(r => setTags(r.tags || [])).catch(() => {});
    if (!isNew) {
      templatesApi.get(id).then(r => {
        const t = r.template;
        setForm({
          name: t.name || '',
          description: t.description || '',
          industry: t.industry || '',
          tier: t.tier || 'FREE',
          categoryId: t.categoryId || '',
          thumbnail: t.thumbnail || '',
          previewImage: t.previewImage || '',
          manifest: JSON.stringify(t.manifest || {}, null, 2),
          tags: (t.tags || []).map(tg => typeof tg === 'string' ? tg : tg.tag?.key || tg.key || tg.name).filter(Boolean),
          builderCompatibility: (t.builderCompatibility || []).map(b => typeof b === 'string' ? b : b.key || b.name).filter(Boolean)
        });
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id]);

  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleCheckbox = (field, value) => (e) => {
    setForm(prev => ({
      ...prev,
      [field]: e.target.checked
        ? [...prev[field], value]
        : prev[field].filter(v => v !== value)
    }));
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !form.tags.includes(trimmed)) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.categoryId) errs.categoryId = 'Category is required';
    let manifestObj;
    try {
      manifestObj = JSON.parse(form.manifest);
      if (typeof manifestObj !== 'object' || manifestObj === null) throw new Error();
    } catch {
      errs.manifest = 'Invalid JSON';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        description: form.description.trim(),
        industry: form.industry.trim() || undefined,
        tier: form.tier,
        categoryId: form.categoryId,
        thumbnail: form.thumbnail.trim() || undefined,
        previewImage: form.previewImage.trim() || undefined,
        manifest: JSON.parse(form.manifest),
        tags: form.tags,
        builderCompatibility: form.builderCompatibility
      };
      const res = isNew ? await templatesApi.create(data) : await templatesApi.update(id, data);
      if (isNew) navigate(`/admin/cms/templates/${res.template.id}`, { replace: true });
      else navigate(`/admin/cms/templates/${id}`);
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const Field = ({ label, children, fullWidth, error }) => (
    <div className={fullWidth ? 'col-span-full' : ''}>
      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{label}</label>
      {children}
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/cms/templates')} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{isNew ? 'New Template' : 'Edit Template'}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{isNew ? 'Create a new certified template' : `Editing: ${form.name}`}</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors shadow-sm ${saving ? 'bg-gray-400' : 'bg-primary hover:bg-primary/90'}`}>
          <Save size={16} /> {saving ? 'Saving...' : isNew ? 'Create Template' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Template Name" error={errors.name}>
              <input value={form.name} onChange={handleChange('name')} placeholder="e.g. Modern E-Commerce Store"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </Field>
            <Field label="Industry">
              <input value={form.industry} onChange={handleChange('industry')} placeholder="e.g. Retail, Healthcare"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </Field>
          </div>

          <Field label="Description" fullWidth error={errors.description}>
            <textarea value={form.description} onChange={handleChange('description')} rows={3} placeholder="Describe what this template offers..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </Field>

          <Field label="Thumbnail URL" fullWidth>
            <input value={form.thumbnail} onChange={handleChange('thumbnail')} placeholder="https://example.com/thumbnail.jpg"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </Field>

          <Field label="Preview Image URL" fullWidth>
            <input value={form.previewImage} onChange={handleChange('previewImage')} placeholder="https://example.com/preview.jpg"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </Field>

          <Field label="Manifest JSON" fullWidth error={errors.manifest}>
            <textarea value={form.manifest} onChange={handleChange('manifest')} rows={10}
              placeholder='{"version": "1.0.0", "dependencies": {...}}'
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </Field>
        </div>

        <div className="space-y-4">
          <Field label="Tier">
            <select value={form.tier} onChange={handleChange('tier')}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>

          <Field label="Category" error={errors.categoryId}>
            <select value={form.categoryId} onChange={handleChange('categoryId')}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          <Field label="Tags">
            <div className="flex items-center gap-1.5 mb-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                placeholder="Add tag..." className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <button onClick={handleAddTag} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90">Add</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map((tag, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-bold border border-gray-100">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500"><X size={10} /></button>
                </span>
              ))}
            </div>
          </Field>

          <Field label="Builder Compatibility">
            <div className="space-y-2 border border-gray-100 rounded-xl p-3">
              {BUILDER_OPTIONS.map(b => (
                <label key={b.key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.builderCompatibility.includes(b.key)}
                    onChange={handleCheckbox('builderCompatibility', b.key)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary/30" />
                  <span className="text-xs font-medium text-gray-600">{b.label}</span>
                </label>
              ))}
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
}

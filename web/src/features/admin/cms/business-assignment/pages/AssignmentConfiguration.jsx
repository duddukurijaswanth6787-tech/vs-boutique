import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { assignmentApi } from '../services/assignment.api';

export default function AssignmentConfiguration() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    theme: 'default', primaryColor: '#3B82F6', secondaryColor: '#10B981',
    language: 'en', currency: 'INR', timezone: 'Asia/Kolkata',
    contactEmail: '', contactPhone: '',
    metaTitle: '', metaDescription: '',
    googleAnalyticsId: '', facebookPixelId: '',
    logoUrl: '', faviconUrl: '', storageProvider: 'auto'
  });

  useEffect(() => {
    assignmentApi.getConfig(id).then(res => {
      const c = res.data || {};
      setForm({
        theme: c.theme || 'default', primaryColor: c.primaryColor || '#3B82F6',
        secondaryColor: c.secondaryColor || '#10B981',
        language: c.language || 'en', currency: c.currency || 'INR', timezone: c.timezone || 'Asia/Kolkata',
        contactEmail: c.contactEmail || '', contactPhone: c.contactPhone || '',
        metaTitle: c.metaTitle || '', metaDescription: c.metaDescription || '',
        googleAnalyticsId: c.googleAnalyticsId || '', facebookPixelId: c.facebookPixelId || '',
        logoUrl: c.logoUrl || '', faviconUrl: c.faviconUrl || '', storageProvider: c.storageProvider || 'auto'
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try { await assignmentApi.updateConfig(id, form); alert('Configuration saved'); } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading configuration...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/admin/cms/business-assignment/${id}`)} className="p-1.5 hover:bg-gray-100 rounded"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-gray-900">Assignment Configuration</h1>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Theme & Branding</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="default">Default</option>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
              <input type="color" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))} className="w-full h-10 border rounded-lg cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
              <input type="color" value={form.secondaryColor} onChange={e => setForm(f => ({ ...f, secondaryColor: e.target.value }))} className="w-full h-10 border rounded-lg cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input type="text" value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Favicon URL</label>
              <input type="text" value={form.faviconUrl} onChange={e => setForm(f => ({ ...f, faviconUrl: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://..." />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Localization</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="gu">Gujarati</option>
                <option value="mr">Marathi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Contact</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">SEO & Analytics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
              <input type="text" value={form.metaTitle} onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
              <input type="text" value={form.metaDescription} onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label>
              <input type="text" value={form.googleAnalyticsId} onChange={e => setForm(f => ({ ...f, googleAnalyticsId: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Pixel ID</label>
              <input type="text" value={form.facebookPixelId} onChange={e => setForm(f => ({ ...f, facebookPixelId: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Storage</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Storage Provider</label>
            <select value={form.storageProvider} onChange={e => setForm(f => ({ ...f, storageProvider: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="auto">Auto (default)</option>
              <option value="s3">AWS S3</option>
              <option value="r2">Cloudflare R2</option>
              <option value="minio">MinIO</option>
              <option value="local">Local</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t flex gap-3">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Configuration'}
          </button>
          <button onClick={() => navigate(`/admin/cms/business-assignment/${id}`)} className="px-4 py-2.5 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
        </div>
      </div>
    </div>
  );
}

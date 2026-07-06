import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Layout, CreditCard, Palette, CheckSquare, Globe, Terminal, CheckCircle, Loader2 } from 'lucide-react';
import { assignmentApi } from '../services/assignment.api';

const STEPS = [
  { id: 1, label: 'Business', icon: Building2 },
  { id: 2, label: 'Template', icon: Layout },
  { id: 3, label: 'Subscription', icon: CreditCard },
  { id: 4, label: 'Branding', icon: Palette },
  { id: 5, label: 'Features', icon: CheckSquare },
  { id: 6, label: 'Domain', icon: Globe },
  { id: 7, label: 'Environment', icon: Terminal },
  { id: 8, label: 'Review', icon: CheckCircle }
];

export default function AssignmentWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [businesses, setBusinesses] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assignmentId, setAssignmentId] = useState(null);

  const [form, setForm] = useState({
    businessId: '', templateId: '',
    theme: 'default', primaryColor: '#3B82F6', secondaryColor: '#10B981',
    language: 'en', currency: 'INR', timezone: 'Asia/Kolkata',
    contactEmail: '', contactPhone: '',
    metaTitle: '', metaDescription: '',
    googleAnalyticsId: '', facebookPixelId: ''
  });

  useEffect(() => {
    if (step === 1) {
      assignmentApi.findBusinesses('').then(r => setBusinesses(r.data || [])).catch(() => {});
    }
    if (step === 2) {
      fetch('/api/v1/cms/templates?limit=50', { headers: { Authorization: `Bearer ${localStorage.getItem('vs_auth_token')}` } })
        .then(r => r.json()).then(r => setTemplates(r.templates || r.data?.templates || [])).catch(() => {});
    }
  }, [step]);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await assignmentApi.begin({ businessId: form.businessId, templateId: form.templateId });
      const aid = res.data?.id || res.data?.assignment?.id;
      if (aid) {
        await assignmentApi.updateConfig(aid, {
          theme: form.theme, primaryColor: form.primaryColor, secondaryColor: form.secondaryColor,
          language: form.language, currency: form.currency, timezone: form.timezone,
          contactEmail: form.contactEmail, contactPhone: form.contactPhone,
          metaTitle: form.metaTitle, metaDescription: form.metaDescription,
          googleAnalyticsId: form.googleAnalyticsId, facebookPixelId: form.facebookPixelId
        });
        setAssignmentId(aid);
        navigate(`/admin/cms/business-assignment/${aid}`);
      }
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  const next = () => setStep(s => Math.min(s + 1, 8));
  const prev = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/cms/business-assignment')} className="p-1.5 hover:bg-gray-100 rounded"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-gray-900">New Business Assignment</h1>
      </div>

      <div className="flex gap-0 mb-8">
        {STEPS.map(s => (
          <div key={s.id} className={`flex-1 text-center py-3 text-sm font-medium border-b-2 transition-colors ${step === s.id ? 'border-blue-600 text-blue-600' : step > s.id ? 'border-green-500 text-green-600' : 'border-gray-200 text-gray-400'}`}>
            <s.icon className="w-4 h-4 mx-auto mb-1" />
            {s.label}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border p-6 min-h-[400px]">
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Select Business</h2>
            {businesses.length === 0 ? <p className="text-gray-400">No businesses found</p> : (
              <div className="grid grid-cols-2 gap-3">
                {businesses.map(b => (
                  <button key={b.id} onClick={() => setForm(f => ({ ...f, businessId: b.id }))} className={`p-4 border rounded-lg text-left transition-colors ${form.businessId === b.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <div className="font-medium text-sm">{b.name}</div>
                    <div className="text-xs text-gray-500">{b.id.substring(0, 12)}...</div>
                    <div className="text-xs text-gray-400 mt-1">{b.status}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Select Template</h2>
            {templates.length === 0 ? <p className="text-gray-400">No templates found</p> : (
              <div className="grid grid-cols-2 gap-3">
                {templates.filter(t => t.status === 'PUBLISHED').map(t => (
                  <button key={t.id} onClick={() => setForm(f => ({ ...f, templateId: t.id }))} className={`p-4 border rounded-lg text-left transition-colors ${form.templateId === t.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <div className="font-medium text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.tier} | v{t.version}</div>
                    <div className="text-xs text-gray-400 mt-1">{t.industry || ''}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Subscription Validation</h2>
            <p className="text-sm text-gray-500 mb-4">Subscription will be validated during the assignment process.</p>
            {form.businessId ? (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">Business ID: {form.businessId.substring(0, 12)}...</p>
                <p className="text-sm text-blue-600 mt-2">Click Next to proceed. Subscription validation runs automatically.</p>
              </div>
            ) : <p className="text-sm text-gray-400">Select a business first</p>}
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Branding Configuration</h2>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                <input type="text" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Feature Configuration</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                <input type="text" value={form.metaTitle} onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Business website title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                <input type="text" value={form.metaDescription} onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Site description for SEO" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label>
                <input type="text" value={form.googleAnalyticsId} onChange={e => setForm(f => ({ ...f, googleAnalyticsId: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="G-XXXXXXXXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Pixel ID</label>
                <input type="text" value={form.facebookPixelId} onChange={e => setForm(f => ({ ...f, facebookPixelId: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="1234567890" />
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Domain Configuration</h2>
            <p className="text-sm text-gray-500 mb-4">Domain can be configured after the assignment is created.</p>
            <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
              Domain setup is handled in the deployment phase. You can configure custom domains and subdomains after the assignment is ready.
            </div>
          </div>
        )}

        {step === 7 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Environment Configuration</h2>
            <p className="text-sm text-gray-500 mb-4">Environment variables will be set automatically from your configuration.</p>
            <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
              The following environment variables will be created:
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>SITE_NAME, PRIMARY_COLOR, SECONDARY_COLOR</li>
                <li>DEFAULT_LANGUAGE, DEFAULT_CURRENCY, TIMEZONE</li>
                <li>CONTACT_EMAIL, CONTACT_PHONE</li>
                <li>META_TITLE, META_DESCRIPTION</li>
                <li>GOOGLE_ANALYTICS_ID, FACEBOOK_PIXEL_ID</li>
                <li>LOGO_URL, FAVICON_URL</li>
              </ul>
            </div>
          </div>
        )}

        {step === 8 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Review & Create</h2>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg text-sm">
                <div className="font-medium mb-2">Business</div>
                <div>{businesses.find(b => b.id === form.businessId)?.name || form.businessId}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-sm">
                <div className="font-medium mb-2">Template</div>
                <div>{templates.find(t => t.id === form.templateId)?.name || form.templateId}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-sm">
                <div className="font-medium mb-2">Branding</div>
                <div>Theme: {form.theme} | Colors: {form.primaryColor} / {form.secondaryColor}</div>
                <div>Language: {form.language} | Currency: {form.currency} | TZ: {form.timezone}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <button onClick={step === 1 ? () => navigate('/admin/cms/business-assignment') : prev} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
          {step === 1 ? 'Cancel' : 'Back'}
        </button>
        <button
          onClick={step === 8 ? handleCreate : next}
          disabled={(step === 1 && !form.businessId) || (step === 2 && !form.templateId) || loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Creating...</> : step === 8 ? 'Create Assignment' : 'Next'}
        </button>
      </div>
    </div>
  );
}

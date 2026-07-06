import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, RefreshCw, Save, RotateCcw } from 'lucide-react';
import { aiCenterApi } from '../services/ai-center.api';

export default function AISettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({});

  const load = async () => {
    setLoading(true);
    try { const res = await aiCenterApi.getSettings(); setSettings(res.data || []); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try { await aiCenterApi.saveSettings(editing); alert('Settings saved'); load(); setEditing({}); } catch (err) { alert(err.message); }
  };

  const handleInit = async () => {
    try { await aiCenterApi.initSettings(); alert('Defaults initialized'); load(); } catch (err) { alert(err.message); }
  };

  const changeValue = (key, rawValue) => {
    let value = rawValue;
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (!isNaN(value) && value !== '') value = Number(value);
    setEditing({ ...editing, [key]: value });
  };

  const categories = [...new Set(settings.map(s => s.category))];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/cms/ai-center')} className="p-1.5 hover:bg-gray-100 rounded"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-2xl font-bold text-gray-900">AI Settings</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleInit} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"><RotateCcw className="w-4 h-4" /> Initialize Defaults</button>
          <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
      </div>

      {loading ? <div className="text-center py-12 text-gray-500">Loading settings...</div> : settings.length === 0 ? <div className="text-center py-12 text-gray-500">No settings. Click "Initialize Defaults" to create default settings.</div> : categories.map(cat => (
        <div key={cat} className="bg-white rounded-lg border mb-4">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 capitalize">{cat} Settings</h2>
          </div>
          <div className="p-4 space-y-3">
            {settings.filter(s => s.category === cat).map(s => (
              <div key={s.key} className="grid grid-cols-3 gap-4 items-center">
                <div>
                  <label className="text-sm font-medium text-gray-700">{s.key.replace(/_/g, ' ')}</label>
                  {s.description && <div className="text-xs text-gray-400">{s.description}</div>}
                </div>
                <div>
                  {typeof s.value === 'boolean' ? (
                    <select value={String(s.value)} onChange={e => changeValue(s.key, e.target.value)} className="border rounded px-2 py-1.5 text-sm w-full">
                      <option value="true">Enabled</option><option value="false">Disabled</option>
                    </select>
                  ) : typeof s.value === 'number' ? (
                    <input type="number" value={editing[s.key] !== undefined ? editing[s.key] : s.value} onChange={e => changeValue(s.key, e.target.value)} className="border rounded px-2 py-1.5 text-sm w-full" />
                  ) : (
                    <input value={editing[s.key] !== undefined ? editing[s.key] : s.value} onChange={e => changeValue(s.key, e.target.value)} className="border rounded px-2 py-1.5 text-sm w-full" />
                  )}
                </div>
                <div className="text-xs text-gray-400">{typeof s.value}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {Object.keys(editing).length > 0 && (
        <div className="fixed bottom-6 right-6">
          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700"><Save className="w-4 h-4" /> Save Changes</button>
        </div>
      )}
    </div>
  );
}

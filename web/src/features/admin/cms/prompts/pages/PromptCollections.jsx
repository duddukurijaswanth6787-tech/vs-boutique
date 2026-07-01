import React, { useState, useEffect } from 'react';
import { Plus, Folder, Trash2, Bookmark, ExternalLink } from 'lucide-react';
import { promptsApi } from '../services/prompts.api';

export default function PromptCollections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    promptsApi.getCollections().then(r => {
      setCollections(r.collections || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await promptsApi.createCollection({ name: newName, description: newDesc });
      setCollections(prev => [...prev, res.collection]);
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
    } catch (err) { alert('Create failed: ' + err.message); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Collections</h1>
          <p className="text-sm text-gray-400 mt-0.5">Organize prompts into collections</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm">
          <Plus size={16} /> New Collection
        </button>
      </div>

      {showCreate && (
        <div className="border border-gray-100 rounded-2xl p-4 bg-white space-y-3">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Collection name"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)" rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          <div className="flex items-center gap-2">
            <button onClick={handleCreate} className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-bold">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-500">Cancel</button>
          </div>
        </div>
      )}

      {collections.length === 0 ? (
        <div className="text-center py-16">
          <Folder size={48} className="mx-auto text-gray-200 mb-3" />
          <h3 className="text-lg font-bold text-gray-400 mb-1">No Collections Yet</h3>
          <p className="text-sm text-gray-300">Create your first collection to organize prompts</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map(c => (
            <div key={c.id} className="border border-gray-100 rounded-2xl p-5 bg-white hover:shadow-md transition-shadow space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
                  <Bookmark size={20} className="text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">{c.name}</h3>
                {c.description && <p className="text-xs text-gray-400 mt-1">{c.description}</p>}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{c._count?.items || 0} prompts</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

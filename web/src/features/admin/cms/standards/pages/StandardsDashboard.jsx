import React, { useState, useEffect } from 'react';
import api from '../../../../../services/api';

const StandardsDashboard = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('standards'); // 'standards', 'blueprints', 'builders', 'audit'
  
  // Data lists
  const [standards, setStandards] = useState([]);
  const [blueprints, setBlueprints] = useState([]);
  const [builders, setBuilders] = useState([]);
  const [logs, setLogs] = useState([]);

  // Selections & detail view
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Editing / Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE_STANDARD'); // 'CREATE_STANDARD', 'EDIT_STANDARD', 'CREATE_BLUEPRINT', 'CREATE_BUILDER'
  const [modalName, setModalName] = useState('');
  const [modalKey, setModalKey] = useState('');
  const [modalCategory, setModalCategory] = useState('DESIGN_SYSTEM');
  const [modalParentId, setModalParentId] = useState('');
  const [modalConfig, setModalConfig] = useState('{\n  "theme": {\n    "primaryColor": "#C89B3C",\n    "fontFamily": "Outfit"\n  }\n}');
  const [modalPages, setModalPages] = useState('{"required": ["/", "/about"]}');
  const [modalComponents, setModalComponents] = useState('{"required": ["Navbar", "Footer"]}');
  const [modalApis, setModalApis] = useState('{"required": ["GET /products"]}');
  const [modalDatabaseModels, setModalDatabaseModels] = useState('{"required": ["User"]}');
  const [modalFeatures, setModalFeatures] = useState('{"required": ["Cart"]}');
  const [modalFramework, setModalFramework] = useState('Vite+React');
  const [modalPromptTemplate, setModalPromptTemplate] = useState('');
  const [modalFolderStructure, setModalFolderStructure] = useState('{"requiredDirs": ["src/components"]}');
  const [modalLimitations, setModalLimitations] = useState('{"maxPageCount": 20}');
  const [modalDescription, setModalDescription] = useState('Initial setup');
  const [modalError, setModalError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Status stats
  const [stats, setStats] = useState({
    totalStandards: 0,
    totalBlueprints: 0,
    totalBuilders: 0,
    activeAudits: 0
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, searchQuery, categoryFilter]);

  const fetchData = async () => {
    try {
      if (activeTab === 'standards') {
        let path = `/api/v1/cms/standards?q=${searchQuery}`;
        if (categoryFilter) path += `&category=${categoryFilter}`;
        const res = await api.get(path);
        if (res.data?.success) {
          setStandards(res.data.standards);
          setStats(prev => ({ ...prev, totalStandards: res.data.standards.length }));
        }
      } else if (activeTab === 'blueprints') {
        const res = await api.get(`/api/v1/cms/standards/blueprints?q=${searchQuery}`);
        if (res.data?.success) {
          setBlueprints(res.data.blueprints);
          setStats(prev => ({ ...prev, totalBlueprints: res.data.blueprints.length }));
        }
      } else if (activeTab === 'builders') {
        const res = await api.get(`/api/v1/cms/standards/builders?q=${searchQuery}`);
        if (res.data?.success) {
          setBuilders(res.data.builders);
          setStats(prev => ({ ...prev, totalBuilders: res.data.builders.length }));
        }
      } else if (activeTab === 'audit') {
        const res = await api.get('/api/v1/cms/standards/audit-logs');
        if (res.data?.success) {
          setLogs(res.data.logs);
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'PUBLISHED' ? 'DEPRECATED' : 'PUBLISHED';
      await api.put(`/api/v1/cms/standards/${id}`, {
        data: { status: nextStatus },
        description: `Toggled status to ${nextStatus}`
      });
      fetchData();
    } catch (err) {
      alert(`Toggle failed: ${err.message}`);
    }
  };

  const handleRollback = async (id, version) => {
    if (!window.confirm(`Rollback standard to version ${version}?`)) return;
    try {
      const res = await api.post(`/api/v1/cms/standards/${id}/rollback`, { version });
      if (res.data?.success) {
        alert('Standard rolled back successfully!');
        setSelectedItem(null);
        fetchData();
      }
    } catch (err) {
      alert(`Rollback failed: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setIsSaving(true);

    try {
      if (modalMode === 'CREATE_STANDARD' || modalMode === 'EDIT_STANDARD') {
        // Validate Config JSON
        let parsedConfig;
        try {
          parsedConfig = JSON.parse(modalConfig);
        } catch (err) {
          throw new Error('Config configuration is not a valid JSON object.');
        }

        if (modalMode === 'CREATE_STANDARD') {
          await api.post('/api/v1/cms/standards', {
            category: modalCategory,
            key: modalKey,
            name: modalName,
            parentId: modalParentId || null,
            config: parsedConfig
          });
        } else {
          await api.put(`/api/v1/cms/standards/${selectedItem.id}`, {
            data: {
              name: modalName,
              parentId: modalParentId || null,
              config: parsedConfig
            },
            description: modalDescription
          });
        }
      } else if (modalMode === 'CREATE_BLUEPRINT') {
        const res = await api.post('/api/v1/cms/standards/blueprints', {
          key: modalKey,
          name: modalName,
          standardId: modalParentId || null,
          pages: JSON.parse(modalPages),
          components: JSON.parse(modalComponents),
          apis: JSON.parse(modalApis),
          databaseModels: JSON.parse(modalDatabaseModels),
          features: JSON.parse(modalFeatures)
        });
      } else if (modalMode === 'CREATE_BUILDER') {
        await api.post('/api/v1/cms/standards/builders', {
          key: modalKey,
          name: modalName,
          standardId: modalParentId || null,
          framework: modalFramework,
          promptTemplate: modalPromptTemplate,
          folderStructure: JSON.parse(modalFolderStructure),
          limitations: JSON.parse(modalLimitations)
        });
      }

      setIsModalOpen(false);
      setSelectedItem(null);
      fetchData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateModal = (mode) => {
    setModalMode(mode);
    setModalName('');
    setModalKey('');
    setModalCategory('DESIGN_SYSTEM');
    setModalParentId('');
    setModalDescription('Initial setup');
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setModalMode('EDIT_STANDARD');
    setModalName(item.name);
    setModalKey(item.key);
    setModalCategory(item.category);
    setModalParentId(item.parentId || '');
    setModalConfig(JSON.stringify(item.config, null, 2));
    setModalDescription('');
    setModalError('');
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
            CMS Standards Engine
          </h1>
          <p className="text-slate-400 mt-1">
            Enterprise Rules Authority, Inherited Blueprints, and Third-Party Builder Profiles
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openCreateModal('CREATE_STANDARD')}
            className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold px-4 py-2 rounded-lg transition-all"
          >
            Create Rule Standard
          </button>
          <button
            onClick={() => openCreateModal('CREATE_BLUEPRINT')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg transition-all"
          >
            Create Blueprint
          </button>
          <button
            onClick={() => openCreateModal('CREATE_BUILDER')}
            className="bg-teal-600 hover:bg-teal-500 text-white font-semibold px-4 py-2 rounded-lg transition-all"
          >
            Create Builder Profile
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-slate-800 mb-6">
        {[
          { id: 'standards', name: 'Rule Standards' },
          { id: 'blueprints', name: 'Expected Blueprints' },
          { id: 'builders', name: 'Builder Profiles' },
          { id: 'audit', name: 'Audit Timeline Logs' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedItem(null); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.id ? 'border-amber-500 text-amber-400 bg-amber-500/5' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Filter and Listing Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by key, name, or category..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500 w-full"
            />
            {activeTab === 'standards' && (
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="">All Categories</option>
                <option value="GLOBAL">Global</option>
                <option value="DESIGN_SYSTEM">Design System</option>
                <option value="SEO">SEO</option>
                <option value="SECURITY">Security</option>
                <option value="PERFORMANCE">Performance</option>
              </select>
            )}
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur">
            {activeTab === 'standards' && (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs uppercase font-semibold">
                    <th className="p-4">Name</th>
                    <th className="p-4">Key</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Version</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {standards.map(item => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-800/60 hover:bg-slate-800/20 cursor-pointer transition-all"
                      onClick={() => setSelectedItem(item)}
                    >
                      <td className="p-4 font-semibold text-white">{item.name}</td>
                      <td className="p-4 text-slate-400 font-mono text-xs">{item.key}</td>
                      <td className="p-4">
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-xs">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${
                          item.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">v{item.version}</td>
                      <td className="p-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="text-slate-400 hover:text-white transition-all text-xs"
                          >
                            Edit
                          </button>
                          <span className="text-slate-700">|</span>
                          <button
                            onClick={() => handleToggleActive(item.id, item.status)}
                            className={`${item.status === 'PUBLISHED' ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400 hover:text-emerald-300'} transition-all text-xs`}
                          >
                            {item.status === 'PUBLISHED' ? 'Deprecate' : 'Publish'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {standards.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500">
                        No rule standards found matching parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'blueprints' && (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs uppercase font-semibold">
                    <th className="p-4">Blueprint Name</th>
                    <th className="p-4">Key</th>
                    <th className="p-4">Standard Base</th>
                    <th className="p-4">Required Pages</th>
                    <th className="p-4">Required APIs</th>
                  </tr>
                </thead>
                <tbody>
                  {blueprints.map(item => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-800/60 hover:bg-slate-800/20 cursor-pointer transition-all"
                      onClick={() => setSelectedItem(item)}
                    >
                      <td className="p-4 font-semibold text-white">{item.name}</td>
                      <td className="p-4 text-slate-400 font-mono text-xs">{item.key}</td>
                      <td className="p-4 text-amber-400">{item.standard?.name || 'None'}</td>
                      <td className="p-4 text-slate-400">
                        {Object.keys(item.pages || {}).length} rules
                      </td>
                      <td className="p-4 text-slate-400">
                        {Object.keys(item.apis || {}).length} rules
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'builders' && (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs uppercase font-semibold">
                    <th className="p-4">Builder Name</th>
                    <th className="p-4">Key</th>
                    <th className="p-4">Framework</th>
                    <th className="p-4">Target Standard</th>
                  </tr>
                </thead>
                <tbody>
                  {builders.map(item => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-800/60 hover:bg-slate-800/20 cursor-pointer transition-all"
                      onClick={() => setSelectedItem(item)}
                    >
                      <td className="p-4 font-semibold text-white">{item.name}</td>
                      <td className="p-4 text-slate-400 font-mono text-xs">{item.key}</td>
                      <td className="p-4 text-teal-400">{item.framework}</td>
                      <td className="p-4 text-amber-400">{item.standard?.name || 'None'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'audit' && (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs uppercase font-semibold">
                    <th className="p-4">Action</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Operator ID</th>
                    <th className="p-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-slate-800/60 hover:bg-slate-800/20">
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300">{log.reason || 'No description provided'}</td>
                      <td className="p-4 text-slate-400 font-mono text-xs">{log.userId}</td>
                      <td className="p-4 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Config Panel Drawer */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-6 backdrop-blur">
          <h3 className="text-lg font-semibold mb-4 text-slate-200 border-b border-slate-800 pb-3 flex items-center justify-between">
            <span>Inspector Panel</span>
            {selectedItem && (
              <span className="text-xs text-amber-400 font-mono bg-amber-500/5 px-2.5 py-0.5 rounded-full border border-amber-500/15">
                ACTIVE
              </span>
            )}
          </h3>

          {selectedItem ? (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Item Details</h4>
                <div className="mt-2 space-y-1">
                  <p className="text-lg font-bold text-white">{selectedItem.name}</p>
                  <p className="text-sm font-mono text-slate-400">{selectedItem.key}</p>
                </div>
              </div>

              {selectedItem.parent && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inherits From</h4>
                  <p className="mt-1 text-sm text-amber-400">➔ {selectedItem.parent.name}</p>
                </div>
              )}

              {activeTab === 'standards' && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Configuration Rules</h4>
                  <pre className="mt-2 bg-slate-950/80 border border-slate-850 p-4 rounded-lg text-xs font-mono text-amber-300 overflow-x-auto">
                    {JSON.stringify(selectedItem.config, null, 2)}
                  </pre>
                </div>
              )}

              {activeTab === 'standards' && selectedItem.versions && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Version History Timeline</h4>
                  <div className="space-y-3">
                    {selectedItem.versions.map(v => (
                      <div key={v.id} className="flex items-center justify-between border-b border-slate-800/40 pb-2 text-xs">
                        <div>
                          <p className="font-semibold text-slate-300">Version {v.version}</p>
                          <p className="text-slate-500 mt-0.5">{v.description || 'No notes'}</p>
                        </div>
                        {v.version !== selectedItem.version && (
                          <button
                            onClick={() => handleRollback(selectedItem.id, v.version)}
                            className="bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded transition-all"
                          >
                            Rollback
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-500">
              <p>Select any item from the table to inspect configurations, dependency inheritance mappings, and version timelines.</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor Overlay Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-200 border-b border-slate-800 pb-3 mb-4">
              {modalMode === 'CREATE_STANDARD' ? 'Create Rule Standard' :
               modalMode === 'EDIT_STANDARD' ? 'Edit Rule Standard' :
               modalMode === 'CREATE_BLUEPRINT' ? 'Create Expected Blueprint' :
               'Create Builder Profile'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={modalName}
                    onChange={e => setModalName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Key Slug</label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'EDIT_STANDARD'}
                    value={modalKey}
                    onChange={e => setModalKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {(modalMode === 'CREATE_STANDARD' || modalMode === 'EDIT_STANDARD') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Category</label>
                    <select
                      value={modalCategory}
                      onChange={e => setModalCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="GLOBAL">Global</option>
                      <option value="DESIGN_SYSTEM">Design System</option>
                      <option value="SEO">SEO</option>
                      <option value="SECURITY">Security</option>
                      <option value="PERFORMANCE">Performance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Parent Standard (Inheritance)</label>
                    <select
                      value={modalParentId}
                      onChange={e => setModalParentId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">None (Root)</option>
                      {standards.filter(s => s.id !== selectedItem?.id).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {(modalMode === 'CREATE_STANDARD' || modalMode === 'EDIT_STANDARD') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Rules Configuration (JSON)</label>
                  <textarea
                    rows="8"
                    required
                    value={modalConfig}
                    onChange={e => setModalConfig(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {modalMode === 'EDIT_STANDARD' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Change Reason</label>
                  <input
                    type="text"
                    required
                    placeholder="Describe configuration adjustments"
                    value={modalDescription}
                    onChange={e => setModalDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Blueprint Creation Configuration Blocks */}
              {modalMode === 'CREATE_BLUEPRINT' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Parent Standard Base</label>
                    <select
                      value={modalParentId}
                      onChange={e => setModalParentId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="">Select Base Standard Rules</option>
                      {standards.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Required Pages</label>
                      <textarea rows="3" value={modalPages} onChange={e => setModalPages(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-indigo-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Required Components</label>
                      <textarea rows="3" value={modalComponents} onChange={e => setModalComponents(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-indigo-400" />
                    </div>
                  </div>
                </div>
              )}

              {modalError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg text-sm">
                  {modalError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StandardsDashboard;

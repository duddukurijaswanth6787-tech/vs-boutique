import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Save, RefreshCw, Eye, Edit, History, FileText, CheckCircle, AlertCircle, HelpCircle, Layers, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPolicies() {
  const queryClient = useQueryClient();
  const backendUrl = window.VITE_API_URL || import.meta.env.VITE_API_URL || '';

  // Active policy category being edited
  const [selectedKey, setSelectedKey] = useState('shipping');
  const [editorMode, setEditorMode] = useState('edit'); // 'edit' | 'preview' | 'history'

  // Policy Settings States
  const [settingsForm, setSettingsForm] = useState({
    shippingCharges: 99,
    freeShippingLimit: 999,
    returnDays: 7,
    exchangeDays: 7,
    refundDays: 7,
    businessHours: '',
    supportEmail: '',
    supportPhone: '',
    whatsApp: '',
    companyAddress: ''
  });

  // Editor states
  const [policyTitle, setPolicyTitle] = useState('');
  const [policyContent, setPolicyContent] = useState('');
  const [policyStatus, setPolicyStatus] = useState('PUBLISHED');

  // Load Settings
  const { data: settingsRes, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['adminPolicySettings'],
    queryFn: async () => {
      const res = await axios.get(`${backendUrl}/api/v1/cms/policies/settings`);
      if (res.data && res.data.success && res.data.data) {
        setSettingsForm(res.data.data);
      }
      return res.data;
    }
  });

  // Load Current Policy
  const { data: policyRes, isLoading: isPolicyLoading } = useQuery({
    queryKey: ['adminPolicyContent', selectedKey],
    queryFn: async () => {
      const res = await axios.get(`${backendUrl}/api/v1/cms/policies/${selectedKey}`);
      if (res.data && res.data.success && res.data.data) {
        const policy = res.data.data;
        setPolicyTitle(policy.title);
        setPolicyContent(policy.draftContent || policy.content || '');
        setPolicyStatus(policy.status);
      }
      return res.data;
    }
  });

  // Load History
  const { data: historyRes, isLoading: isHistoryLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['adminPolicyHistory', selectedKey],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${backendUrl}/api/v1/cms/policies/${selectedKey}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: editorMode === 'history'
  });

  const historyList = historyRes?.success ? historyRes.data : [];

  // Update Settings Mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${backendUrl}/api/v1/cms/policies/settings`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPolicySettings']);
      alert('Global policy configurations saved successfully!');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to save configurations');
    }
  });

  // Save Policy Mutation
  const savePolicyMutation = useMutation({
    mutationFn: async (payload) => {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${backendUrl}/api/v1/cms/policies/${selectedKey}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPolicyContent', selectedKey]);
      queryClient.invalidateQueries(['adminPolicyHistory', selectedKey]);
      alert(`Policy ${policyStatus === 'PUBLISHED' ? 'published' : 'saved as draft'} successfully!`);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to save policy');
    }
  });

  const handleSettingsSubmit = (e) => {
    e.preventDefault();
    saveSettingsMutation.mutate(settingsForm);
  };

  const handleSaveDraft = () => {
    savePolicyMutation.mutate({
      title: policyTitle,
      draftContent: policyContent,
      status: 'DRAFT'
    });
    setPolicyStatus('DRAFT');
  };

  const handlePublish = () => {
    savePolicyMutation.mutate({
      title: policyTitle,
      content: policyContent,
      draftContent: policyContent,
      status: 'PUBLISHED'
    });
    setPolicyStatus('PUBLISHED');
  };

  const handleRestoreHistory = (historyItem) => {
    if (confirm(`Restore editor content to version ${historyItem.version}?`)) {
      setPolicyTitle(historyItem.title);
      setPolicyContent(historyItem.content);
      setEditorMode('edit');
    }
  };

  // Helper formatting buttons for rich HTML text area
  const insertHtmlFormat = (tag, tagClose = '') => {
    const textarea = document.getElementById('policy-editor-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = tag + selected + (tagClose || `</${tag}>`);
    
    setPolicyContent(text.substring(0, start) + replacement + text.substring(end));
    
    // Focus back
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length + selected.length);
    }, 50);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 text-left">
      
      {/* LEFT COLUMN: GLOBAL POLICY VARIABLES */}
      <div className="xl:col-span-1 space-y-8">
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-premium">
          <h3 className="text-base font-black text-gray-900 mb-6 flex items-center space-x-2">
            <Layers className="text-primary" />
            <span>Policy Variables</span>
          </h3>

          {isSettingsLoading ? (
            <div className="flex justify-center items-center py-10">
              <RefreshCw className="animate-spin text-primary" size={24} />
            </div>
          ) : (
            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Free Ship limit (₹)</label>
                  <input
                    type="number"
                    value={settingsForm.freeShippingLimit}
                    onChange={(e) => setSettingsForm({ ...settingsForm, freeShippingLimit: Number(e.target.value) })}
                    className="w-full px-4 py-2 text-xs border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Flat Ship Charge (₹)</label>
                  <input
                    type="number"
                    value={settingsForm.shippingCharges}
                    onChange={(e) => setSettingsForm({ ...settingsForm, shippingCharges: Number(e.target.value) })}
                    className="w-full px-4 py-2 text-xs border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Return (Days)</label>
                  <input
                    type="number"
                    value={settingsForm.returnDays}
                    onChange={(e) => setSettingsForm({ ...settingsForm, returnDays: Number(e.target.value) })}
                    className="w-full px-4 py-2 text-xs border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Exchange (Days)</label>
                  <input
                    type="number"
                    value={settingsForm.exchangeDays}
                    onChange={(e) => setSettingsForm({ ...settingsForm, exchangeDays: Number(e.target.value) })}
                    className="w-full px-4 py-2 text-xs border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Refund (Days)</label>
                  <input
                    type="number"
                    value={settingsForm.refundDays}
                    onChange={(e) => setSettingsForm({ ...settingsForm, refundDays: Number(e.target.value) })}
                    className="w-full px-4 py-2 text-xs border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Business Hours</label>
                <input
                  type="text"
                  value={settingsForm.businessHours || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, businessHours: e.target.value })}
                  className="w-full px-4 py-2 text-xs border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Support Email</label>
                <input
                  type="email"
                  value={settingsForm.supportEmail || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                  className="w-full px-4 py-2 text-xs border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Support Phone</label>
                <input
                  type="text"
                  value={settingsForm.supportPhone || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, supportPhone: e.target.value })}
                  className="w-full px-4 py-2 text-xs border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">WhatsApp Contact</label>
                <input
                  type="text"
                  value={settingsForm.whatsApp || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsApp: e.target.value })}
                  className="w-full px-4 py-2 text-xs border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Company Address</label>
                <textarea
                  value={settingsForm.companyAddress || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, companyAddress: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 text-xs border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary bg-gray-50"
                />
              </div>

              <button
                type="submit"
                disabled={saveSettingsMutation.isPending}
                className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary transition-colors cursor-pointer"
              >
                {saveSettingsMutation.isPending ? 'Saving...' : 'Save Configurations'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* RIGHT 2 COLUMNS: POLICY CMS WORKSPACE */}
      <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-premium flex flex-col min-h-[700px] overflow-hidden">
        
        {/* Workspace Toolbar */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <select
              value={selectedKey}
              onChange={(e) => { setSelectedKey(e.target.value); setEditorMode('edit'); }}
              className="px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-black uppercase tracking-wider focus:outline-none"
            >
              <option value="shipping">Shipping Policy</option>
              <option value="returns">Returns & Exchange</option>
              <option value="terms">Terms & Conditions</option>
              <option value="privacy">Privacy Policy</option>
              <option value="payment">Payment Policy</option>
            </select>

            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
              policyStatus === 'PUBLISHED' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {policyStatus}
            </span>
          </div>

          {/* Mode Selector */}
          <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setEditorMode('edit')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 ${
                editorMode === 'edit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Edit size={12} /> Edit
            </button>
            <button
              onClick={() => setEditorMode('preview')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 ${
                editorMode === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Eye size={12} /> Live Preview
            </button>
            <button
              onClick={() => { setEditorMode('history'); refetchHistory(); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 ${
                editorMode === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <History size={12} /> Versions
            </button>
          </div>
        </div>

        {/* Content Panel */}
        <div className="flex-1 p-6 flex flex-col min-h-0">
          {isPolicyLoading ? (
            <div className="flex-grow flex justify-center items-center">
              <RefreshCw className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <div className="flex-grow flex flex-col h-full">
              
              {/* EDIT MODE */}
              {editorMode === 'edit' && (
                <div className="flex-grow flex flex-col space-y-4 h-full">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Document Title</label>
                    <input
                      type="text"
                      value={policyTitle}
                      onChange={(e) => setPolicyTitle(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary bg-gray-50"
                    />
                  </div>
                  
                  {/* Toolbar */}
                  <div className="flex items-center gap-1.5 border border-gray-100 p-2 rounded-xl bg-gray-50/50">
                    <button onClick={() => insertHtmlFormat('<h2>', '</h2>')} className="px-2.5 py-1 text-[10px] font-black border rounded hover:bg-white bg-gray-100 transition-colors uppercase">H2</button>
                    <button onClick={() => insertHtmlFormat('<h3>', '</h3>')} className="px-2.5 py-1 text-[10px] font-black border rounded hover:bg-white bg-gray-100 transition-colors uppercase">H3</button>
                    <button onClick={() => insertHtmlFormat('<strong>', '</strong>')} className="px-2.5 py-1 text-[10px] font-black border rounded hover:bg-white bg-gray-100 transition-colors uppercase font-black">B</button>
                    <button onClick={() => insertHtmlFormat('<em>', '</em>')} className="px-2.5 py-1 text-[10px] font-black border rounded hover:bg-white bg-gray-100 transition-colors uppercase italic">I</button>
                    <button onClick={() => insertHtmlFormat('<p>', '</p>')} className="px-2.5 py-1 text-[10px] font-black border rounded hover:bg-white bg-gray-100 transition-colors uppercase">P</button>
                    <button onClick={() => insertHtmlFormat('<ul>\n  <li>', '</li>\n</ul>')} className="px-2.5 py-1 text-[10px] font-black border rounded hover:bg-white bg-gray-100 transition-colors uppercase">List</button>
                    <button onClick={() => insertHtmlFormat('<a href="#">', '</a>')} className="px-2.5 py-1 text-[10px] font-black border rounded hover:bg-white bg-gray-100 transition-colors uppercase">Link</button>
                  </div>

                  <div className="flex-grow flex flex-col relative min-h-[300px]">
                    <textarea
                      id="policy-editor-textarea"
                      value={policyContent}
                      onChange={(e) => setPolicyContent(e.target.value)}
                      className="w-full flex-grow p-4 border border-gray-100 rounded-2xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary bg-gray-50 resize-none font-mono leading-relaxed"
                      placeholder="Insert your policy HTML here..."
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-50">
                    <button
                      onClick={handleSaveDraft}
                      className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={handlePublish}
                      className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-luxury-black transition-colors cursor-pointer"
                    >
                      Publish Version
                    </button>
                  </div>
                </div>
              )}

              {/* PREVIEW MODE */}
              {editorMode === 'preview' && (
                <div className="flex-grow flex flex-col space-y-4">
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-2 text-xs text-primary font-bold">
                    <Eye size={16} />
                    <span>Visual layout preview simulates how this looks to your customers.</span>
                  </div>
                  <div className="flex-grow border border-gray-100 rounded-3xl p-6 bg-white overflow-y-auto max-h-[500px]">
                    <h1 className="text-2xl font-black text-gray-900 font-serif mb-2">{policyTitle}</h1>
                    <p className="text-[10px] text-gray-400 mb-6 uppercase tracking-wider font-bold">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <div className="prose prose-sm prose-gray max-w-none text-left" dangerouslySetInnerHTML={{ __html: policyContent || '<p className="italic text-gray-400">Document is empty.</p>' }} />
                  </div>
                </div>
              )}

              {/* VERSION HISTORY */}
              {editorMode === 'history' && (
                <div className="flex-grow space-y-4">
                  {isHistoryLoading ? (
                    <div className="flex justify-center py-20">
                      <RefreshCw className="animate-spin text-primary" size={24} />
                    </div>
                  ) : historyList.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {historyList.map((item, index) => (
                        <div
                          key={index}
                          className="p-4 border border-gray-50 rounded-2xl bg-gray-50/50 hover:bg-gray-50 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                              v{item.version}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-gray-900">{item.title}</h4>
                              <p className="text-[10px] text-gray-400 font-medium">Updated on: {new Date(item.updatedAt).toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleRestoreHistory(item)}
                              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[9px] font-black uppercase text-gray-700 hover:text-primary transition-colors cursor-pointer"
                            >
                              Load in Editor
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-gray-50/30 rounded-3xl border border-dashed border-gray-100 flex flex-col items-center justify-center space-y-3">
                      <FileText size={36} className="text-gray-300 animate-bounce" />
                      <p className="text-xs text-gray-400 font-bold italic">No version history exists yet. Historical checkpoints are recorded upon publishing changes.</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>

    </div>
  );
}

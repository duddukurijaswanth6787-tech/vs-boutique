'use client';

import React, { useState } from 'react';
import {
  useRagAgents,
  useCreateRagAgent,
  useUpdateRagAgent,
  useDeleteRagAgent,
  useUpdateAgentStatus,
  useConfigureTools,
  useAssignKnowledgeSources,
  useKnowledgeSources,
} from '@/features/rag-agent/rag-agent.hooks';
import { RagAgent, CreateAgentDto, LLMProvider } from '@/features/rag-agent/rag-agent.types';
import {
  Bot,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Wrench,
  BookOpen,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { SectionLoader } from '@/components/feedback/FeedbackStates';

const AVAILABLE_TOOLS = [
  { id: 'PRODUCT_SEARCH', label: 'Product Search', desc: 'Find products matching keywords' },
  { id: 'PRODUCT_DETAILS', label: 'Product Details', desc: 'Get pricing, specs, and details' },
  { id: 'PRODUCT_AVAILABILITY', label: 'Product Availability', desc: 'Check real-time inventory' },
  { id: 'ORDER_STATUS', label: 'Order Status', desc: 'Verify order processing state' },
  { id: 'ORDER_TRACKING', label: 'Order Tracking', desc: 'Track shipments and timelines' },
  { id: 'RETURN_STATUS', label: 'Return Status', desc: 'Inspect customer return requests' },
];

export default function RagAgentsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useRagAgents(page, 10);
  const { data: sourcesData } = useKnowledgeSources(1, 100);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false);

  const [selectedAgent, setSelectedAgent] = useState<RagAgent | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateAgentDto>({
    name: '',
    agentKey: '',
    description: '',
    modelProvider: 'gemini',
    model: 'gemini-1.5-flash',
    systemRole: '',
    temperature: 0.7,
    maxTokens: 1024,
    isActive: true,
  });

  // Selected checkboxes
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  // Mutations
  const createMutation = useCreateRagAgent();
  const updateMutation = useUpdateRagAgent();
  const deleteMutation = useDeleteRagAgent();
  const statusMutation = useUpdateAgentStatus();
  const toolsMutation = useConfigureTools();
  const knowledgeMutation = useAssignKnowledgeSources();

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      agentKey: '',
      description: '',
      modelProvider: 'gemini',
      model: 'gemini-1.5-flash',
      systemRole: '',
      temperature: 0.7,
      maxTokens: 1024,
      isActive: true,
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (agent: RagAgent) => {
    setSelectedAgent(agent);
    setFormData({
      name: agent.name,
      agentKey: agent.agentKey,
      description: agent.description || '',
      modelProvider: agent.modelProvider,
      model: agent.model,
      systemRole: agent.systemRole || '',
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      isActive: agent.isActive,
    });
    setIsEditOpen(true);
  };

  const handleOpenTools = (agent: RagAgent) => {
    setSelectedAgent(agent);
    setSelectedTools(agent.tools || []);
    setIsToolsOpen(true);
  };

  const handleOpenKnowledge = (agent: RagAgent) => {
    setSelectedAgent(agent);
    const assignedIds = agent.knowledgeSources?.map((ks) => ks.knowledgeSourceId) || [];
    setSelectedSources(assignedIds);
    setIsKnowledgeOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync(formData);
    setIsCreateOpen(false);
    refetch();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;
    await updateMutation.mutateAsync({ id: selectedAgent.id, dto: formData });
    setIsEditOpen(false);
    refetch();
  };

  const handleToolsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;
    await toolsMutation.mutateAsync({ id: selectedAgent.id, tools: selectedTools });
    setIsToolsOpen(false);
    refetch();
  };

  const handleKnowledgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;
    await knowledgeMutation.mutateAsync({ id: selectedAgent.id, knowledgeSourceIds: selectedSources });
    setIsKnowledgeOpen(false);
    refetch();
  };

  const handleToggleStatus = async (agent: RagAgent) => {
    const action = agent.isActive ? 'DEACTIVATE' : 'ACTIVATE';
    await statusMutation.mutateAsync({ id: agent.id, action });
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      await deleteMutation.mutateAsync(id);
      refetch();
    }
  };

  const handleToolCheck = (toolId: string, checked: boolean) => {
    if (checked) {
      setSelectedTools([...selectedTools, toolId]);
    } else {
      setSelectedTools(selectedTools.filter((t) => t !== toolId));
    }
  };

  const handleSourceCheck = (sourceId: string, checked: boolean) => {
    if (checked) {
      setSelectedSources([...selectedSources, sourceId]);
    } else {
      setSelectedSources(selectedSources.filter((s) => s !== sourceId));
    }
  };

  if (isLoading) {
    return <SectionLoader message="Loading RAG agents catalog..." />;
  }

  const agents = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };
  const sources = sourcesData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">RAG Agents</h1>
          <p className="text-sm text-neutral-500 mt-1">Configure and manage AI system agents.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" /> Create Agent
        </button>
      </div>

      {/* Agents Table */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 text-neutral-500 font-semibold uppercase tracking-wider">
              <th className="p-4">Agent details</th>
              <th className="p-4">Model Provider</th>
              <th className="p-4">Temperature</th>
              <th className="p-4">Tools count</th>
              <th className="p-4">Sources</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-700">
            {agents.length > 0 ? (
              agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg border border-purple-100 bg-purple-50 p-2 text-purple-600">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div>
                        <Link
                          href={`/admin/ai/rag/agents/${agent.id}`}
                          className="font-bold text-neutral-900 hover:underline"
                        >
                          {agent.name}
                        </Link>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{agent.agentKey}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-neutral-800 capitalize">
                      {agent.modelProvider}
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono mt-0.5">{agent.model}</div>
                  </td>
                  <td className="p-4 font-mono text-neutral-600">{agent.temperature}</td>
                  <td className="p-4 font-semibold text-neutral-600">{agent.tools?.length || 0} enabled</td>
                  <td className="p-4 font-semibold text-neutral-600">
                    {agent.knowledgeSources?.length || 0} assigned
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleStatus(agent)}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all
                        ${
                          agent.isActive
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                        }
                      `}
                    >
                      {agent.isActive ? (
                        <>
                          <ToggleRight className="h-3.5 w-3.5" /> Active
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-3.5 w-3.5" /> Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Link
                        href={`/admin/ai/rag/agents/${agent.id}`}
                        className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleOpenTools(agent)}
                        className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                        title="Configure Tools"
                      >
                        <Wrench className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenKnowledge(agent)}
                        className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                        title="Assign Knowledge Sources"
                      >
                        <BookOpen className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(agent)}
                        className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
                        title="Edit config"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="rounded p-1 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                        title="Delete agent"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-neutral-400">
                  No RAG agents found. Create one above to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/50 px-4 py-3">
            <span className="text-xs text-neutral-500">
              Page {page} of {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
                disabled={page === meta.totalPages}
                className="rounded border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE AGENT DIALOG */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-neutral-100 bg-neutral-50 px-6 py-4">
              <h3 className="font-bold text-neutral-900">Create new RAG agent</h3>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Agent Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none"
                    placeholder="e.g. Shopping Assistant"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Agent Key</label>
                  <input
                    type="text"
                    required
                    value={formData.agentKey}
                    onChange={(e) => setFormData({ ...formData, agentKey: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none"
                    placeholder="e.g. shopping_assistant"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none h-16 resize-none"
                  placeholder="Provide short purpose of this agent..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">LLM Provider</label>
                  <select
                    value={formData.modelProvider}
                    onChange={(e) => setFormData({ ...formData, modelProvider: e.target.value as LLMProvider })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none bg-white"
                  >
                    <option value="gemini">Gemini</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">LLM Model</label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase">System Role Prompt</label>
                <textarea
                  value={formData.systemRole}
                  onChange={(e) => setFormData({ ...formData, systemRole: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none h-20"
                  placeholder="e.g. You are a helpful sales assistant representing Vasanthi Designers..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Temperature</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: Number(e.target.value) })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Max Tokens</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxTokens}
                    onChange={(e) => setFormData({ ...formData, maxTokens: Number(e.target.value) })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT AGENT DIALOG */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-neutral-100 bg-neutral-50 px-6 py-4">
              <h3 className="font-bold text-neutral-900">Edit configuration</h3>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Agent Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Agent Key</label>
                  <input
                    type="text"
                    required
                    disabled
                    value={formData.agentKey}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs bg-neutral-50 text-neutral-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none h-16 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">LLM Provider</label>
                  <select
                    value={formData.modelProvider}
                    onChange={(e) => setFormData({ ...formData, modelProvider: e.target.value as LLMProvider })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none bg-white"
                  >
                    <option value="gemini">Gemini</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">LLM Model</label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase">System Role Prompt</label>
                <textarea
                  value={formData.systemRole}
                  onChange={(e) => setFormData({ ...formData, systemRole: e.target.value })}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Temperature</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: Number(e.target.value) })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Max Tokens</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxTokens}
                    onChange={(e) => setFormData({ ...formData, maxTokens: Number(e.target.value) })}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIGURE TOOLS DIALOG */}
      {isToolsOpen && selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-neutral-100 bg-neutral-50 px-6 py-4">
              <h3 className="font-bold text-neutral-900">Configure enabled tools</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">Agent: {selectedAgent.name}</p>
            </div>
            <form onSubmit={handleToolsSubmit} className="p-6 space-y-4">
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {AVAILABLE_TOOLS.map((tool) => (
                  <label
                    key={tool.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50/50 transition-all cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTools.includes(tool.id)}
                      onChange={(e) => handleToolCheck(tool.id, e.target.checked)}
                      className="mt-1 h-3.5 w-3.5 accent-neutral-900 border-neutral-300 rounded"
                    />
                    <div>
                      <span className="text-xs font-bold text-neutral-800">{tool.label}</span>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{tool.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsToolsOpen(false)}
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
                >
                  Update tools
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN KNOWLEDGE SOURCES DIALOG */}
      {isKnowledgeOpen && selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-neutral-100 bg-neutral-50 px-6 py-4">
              <h3 className="font-bold text-neutral-900">Assign knowledge sources</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">Agent: {selectedAgent.name}</p>
            </div>
            <form onSubmit={handleKnowledgeSubmit} className="p-6 space-y-4">
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {sources.length > 0 ? (
                  sources.map((source) => (
                    <label
                      key={source.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50/50 transition-all cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(source.id)}
                        onChange={(e) => handleSourceCheck(source.id, e.target.checked)}
                        className="mt-1 h-3.5 w-3.5 accent-neutral-900 border-neutral-300 rounded"
                      />
                      <div>
                        <span className="text-xs font-bold text-neutral-800">{source.name}</span>
                        <div className="flex gap-2 mt-1">
                          <span className="inline-block px-1 rounded text-[9px] font-mono font-bold bg-neutral-100 text-neutral-600">
                            {source.sourceType}
                          </span>
                          <span className="inline-block px-1 rounded text-[9px] font-mono font-bold bg-green-50 text-green-700">
                            {source.status}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400 py-4 text-center">
                    No knowledge sources configured yet.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsKnowledgeOpen(false)}
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sources.length === 0}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  Save assignments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

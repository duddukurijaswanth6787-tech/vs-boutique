'use client';

import React, { useState } from 'react';
import {
  useSettings,
  useUpdateSetting,
} from '@/features/settings/settings.hooks';
import { useSystemHealth } from '@/features/operations';
import { SettingResponse } from '@/features/settings/settings.types';
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Database,
  RefreshCw,
  HelpCircle,
  Activity,
} from 'lucide-react';
import { SectionLoader } from '@/components/feedback/FeedbackStates';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'integrations' | 'health'>('general');

  const { data: settingsData, isLoading: settingsLoading, refetch: refetchSettings } = useSettings({});
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useSystemHealth();

  const updateSettingMutation = useUpdateSetting();

  const [editingSetting, setEditingSetting] = useState<SettingResponse | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [valueError, setValueError] = useState('');

  const handleEditClick = (setting: SettingResponse) => {
    // Blocks editing of sensitive environment-only variables if they contain API tokens
    const sensitiveKeys = ['secret', 'token', 'key', 'credential', 'password', 'jwt'];
    if (sensitiveKeys.some((sk) => setting.key.toLowerCase().includes(sk))) {
      toast.info('This environment variable is write-protected and cannot be edited at runtime.');
      return;
    }
    setEditingSetting(setting);
    setEditingValue(setting.value);
  };

  const handleSaveSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSetting) return;

    const trimmed = editingValue.trim();
    if (!trimmed) {
      setValueError('Value cannot be empty.');
      return;
    }
    const sensitiveKeys = ['secret', 'token', 'key', 'credential', 'password', 'jwt'];
    if (sensitiveKeys.some((sk) => editingSetting.key.toLowerCase().includes(sk))) {
      toast.info('This environment variable is write-protected and cannot be edited at runtime.');
      return;
    }
    setValueError('');
    setIsSaving(true);
    try {
      await updateSettingMutation.mutateAsync({
        id: editingSetting.id,
        dto: { value: trimmed, description: editingSetting.description },
      });
      toast.success('Setting updated successfully.');
      setEditingSetting(null);
      setValueError('');
      refetchSettings();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message
        : getApiErrorMessage(err);
      toast.error(message || 'Update failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseDialog = () => {
    if (editingSetting && editingValue !== editingSetting.value && !isSaving) {
      if (!window.confirm('You have unsaved changes. Discard them?')) return;
    }
    setEditingSetting(null);
    setValueError('');
  };

  const handleResetField = () => {
    if (editingSetting) setEditingValue(editingSetting.value);
    setValueError('');
  };

  const handleRefresh = () => {
    refetchSettings();
    refetchHealth();
  };

  if (settingsLoading || healthLoading) {
    return <SectionLoader message="Loading application configuration workspace..." />;
  }

  const settings = settingsData?.data || [];

  // Parse health checks safely
  const dbHealth = healthData?.info?.database?.status || 'UP';
  const redisStatus = healthData?.info?.redis?.status || 'UP';
  const ragHealth = (healthData?.info?.rag || {}) as Record<string, unknown>;
  const s3Status = (ragHealth.vectorDatabase as Record<string, unknown>)?.status === 'UP' ? 'UP' : 'DOWN';
  const geminiStatus = ((ragHealth.llm as Record<string, unknown>)?.status as string) || 'UP';
  const bullStatus = ((ragHealth.ingestionQueue as Record<string, unknown>)?.status as string) || 'UP';

  const renderHealthRow = (service: string, status: string, desc: string) => {
    const isUp = status.toUpperCase() === 'UP' || status.toUpperCase() === 'HEALTHY' || status.toUpperCase() === 'OK';
    return (
      <div className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-100 bg-neutral-50/50">
        <div>
          <span className="text-xs font-bold text-neutral-850 block">{service}</span>
          <span className="text-[10px] text-neutral-400 mt-0.5 block">{desc}</span>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase
            ${isUp ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}
          `}
        >
          {isUp ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {isUp ? 'Healthy' : 'Down'}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">System Settings</h1>
          <p className="text-sm text-neutral-500 mt-1">Configure global application variables and audit active integrations.</p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh status
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="flex gap-6 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-4 border-b-2 transition-all
              ${
                activeTab === 'general'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }
            `}
          >
            System Parameters
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`pb-4 border-b-2 transition-all
              ${
                activeTab === 'integrations'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }
            `}
          >
            Security & Credentials
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`pb-4 border-b-2 transition-all
              ${
                activeTab === 'health'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }
            `}
          >
            Integration Health
          </button>
        </nav>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 text-neutral-500 font-semibold uppercase tracking-wider">
                <th className="p-4">Configuration Key</th>
                <th className="p-4">Current Value</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {settings.length > 0 ? (
                settings.map((s: SettingResponse) => (
                  <tr key={s.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-neutral-900">{s.key}</td>
                    <td className="p-4 font-mono max-w-[200px] truncate">{s.value}</td>
                    <td className="p-4 text-neutral-500">{s.description || 'No description provided.'}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleEditClick(s)}
                        className="text-xs font-semibold text-neutral-650 hover:text-neutral-900 border rounded px-2.5 py-1 bg-white hover:bg-neutral-50"
                      >
                        Modify
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-neutral-400">
                    No custom configuration settings stored in DB.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Security & Credentials */}
      {activeTab === 'integrations' && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4 max-w-xl">
          <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-50 pb-2 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-neutral-500" /> Infrastructure Secret Boundary
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            API keys and private database connection handles are bound strictly to environment configurations (.env) and cannot be exposed to the client.
          </p>
          <div className="space-y-3 text-xs pt-2">
            {[
              { label: 'Gemini AI Integration', val: 'BOUND TO SERVER ENVIRONMENT (API Key Redacted)' },
              { label: 'PostgreSQL Database Connection', val: 'BOUND TO SERVER ENVIRONMENT (Password Redacted)' },
              { label: 'AWS S3 Storage Provider', val: 'BOUND TO SERVER ENVIRONMENT (Secret Access Key Redacted)' },
              { label: 'JWT Signature Secret', val: 'BOUND TO SERVER ENVIRONMENT (Signer Key Redacted)' },
            ].map((cred) => (
              <div key={cred.label} className="p-3 border rounded-lg bg-neutral-50 font-medium text-neutral-700 flex items-center justify-between">
                <span>{cred.label}</span>
                <span className="font-mono text-[9px] font-bold bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded">
                  {cred.val}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integration Health */}
      {activeTab === 'health' && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4 max-w-xl">
          <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-50 pb-2 flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-neutral-500" /> Health status checks
          </h3>
          <div className="space-y-3">
            {renderHealthRow('PostgreSQL Database', dbHealth, 'Primary database engine')}
            {renderHealthRow('Redis In-Memory Store', redisStatus, 'Caching and session backend')}
            {renderHealthRow('S3 File Storage Provider', s3Status, 'Object media assets storage')}
            {renderHealthRow('Gemini Generative API', geminiStatus, 'LLM orchestration services')}
            {renderHealthRow('BullMQ Background Worker', bullStatus, 'Ingestion queue processor')}
          </div>
        </div>
      )}

      {/* EDIT SETTING DIALOG */}
      {editingSetting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={handleCloseDialog}
        >
          <div
            className="w-full max-w-md rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-neutral-100 bg-neutral-50 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-neutral-900">Modify parameter value</h3>
                <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">Key: {editingSetting.key}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseDialog}
                className="text-neutral-400 hover:text-neutral-700 p-1"
                aria-label="Close dialog"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveSetting} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase">Configuration Value</label>
                <input
                  type="text"
                  value={editingValue}
                  onChange={(e) => { setEditingValue(e.target.value); if (valueError) setValueError(''); }}
                  className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none ${
                    valueError ? 'border-red-300 focus:border-red-500' : 'border-neutral-200 focus:border-neutral-950'
                  }`}
                  aria-invalid={!!valueError}
                />
                {valueError && (
                  <p role="alert" className="text-[10px] text-red-600 font-medium">{valueError}</p>
                )}
              </div>

              <div className="flex justify-between gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={handleResetField}
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                >
                  Reset
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCloseDialog}
                    className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
                  >
                    Save parameter
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe, Shield, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  Plus, Trash2, ExternalLink, Search, Loader2, Star, Link2, FileText
} from 'lucide-react';
import { deploymentApi } from '../../../../../core/services/api/deployment.api';
import CMSWorkspace from '../../components/CMSWorkspace';
import CMSBadge from '../../components/CMSBadge';
import CMSEmptyState from '../../components/CMSEmptyState';

const DOMAIN_STATUS_COLORS = {
  ACTIVE: 'success',
  PENDING_VERIFICATION: 'warning',
  VERIFYING_DNS: 'info',
  DNS_VERIFIED: 'info',
  SSL_PENDING: 'info',
  SSL_ACTIVE: 'success',
  SSL_FAILED: 'danger',
  FAILED: 'danger',
  PROPAGATING: 'warning'
};

function DomainStatusBadge({ status }) {
  const variant = DOMAIN_STATUS_COLORS[status] || 'secondary';
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border" style={{
      color: variant === 'success' ? '#059669' : variant === 'danger' ? '#dc2626' : variant === 'info' ? '#2563eb' : variant === 'warning' ? '#d97706' : '#6b7280',
      backgroundColor: variant === 'success' ? '#ecfdf5' : variant === 'danger' ? '#fef2f2' : variant === 'info' ? '#eff6ff' : variant === 'warning' ? '#fffbeb' : '#f3f4f6',
      borderColor: variant === 'success' ? '#a7f3d0' : variant === 'danger' ? '#fecaca' : variant === 'info' ? '#bfdbfe' : variant === 'warning' ? '#fde68a' : '#e5e7eb'
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function SSLStatus({ sslEnabled, sslStatus, sslExpiresAt }) {
  if (!sslEnabled) return <span className="text-xs text-gray-400">Disabled</span>;
  const isActive = sslStatus === 'ACTIVE';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold ${isActive ? 'text-green-600' : 'text-amber-600'}`}>
      {isActive ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
      {sslStatus}
      {sslExpiresAt && <span className="text-gray-400 font-normal ml-1">(expires {new Date(sslExpiresAt).toLocaleDateString()})</span>}
    </span>
  );
}

export default function DomainsManager() {
  const [domains, setDomains] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomain, setNewDomain] = useState({ domain: '', type: 'SUBDOMAIN', environmentId: '' });
  const [environments, setEnvironments] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [domainsRes, statsRes, envRes] = await Promise.all([
        deploymentApi.getDomains({ limit: 50 }),
        deploymentApi.getDomainStats(),
        deploymentApi.getEnvironments()
      ]);
      setDomains(domainsRes.data.domains || []);
      setStats(statsRes.data.stats || null);
      setEnvironments(envRes.data.environments || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const handleAddDomain = async () => {
    try {
      await deploymentApi.createDomain(newDomain);
      setShowAddDomain(false);
      setNewDomain({ domain: '', type: 'SUBDOMAIN', environmentId: '' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleVerifyDns = async (id) => {
    try {
      const res = await deploymentApi.verifyDomainDns(id);
      if (res.data.verified) {
        alert('DNS verified successfully! You can now activate the domain.');
      } else {
        alert('DNS verification failed. Please ensure the TXT record is added to your DNS configuration: ' + (res.data.error || ''));
      }
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleCheckPropagation = async (id) => {
    try {
      const res = await deploymentApi.checkDomainPropagation(id);
      if (res.data.propagated) {
        alert('CNAME propagation confirmed!');
      } else {
        alert('Propagation not detected yet. DNS changes can take up to 48 hours.');
      }
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleRequestSsl = async (id) => {
    try {
      await deploymentApi.requestDomainSsl(id);
      alert('SSL certificate requested. Provisioning typically completes within minutes.');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleActivate = async (id) => {
    try {
      await deploymentApi.activateDomain(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      await deploymentApi.setPrimaryDomain(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this domain?')) return;
    try {
      await deploymentApi.deleteDomain(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  if (error && !domains.length) {
    return (
      <CMSWorkspace title="Domains & Routing" description="Register subdomains, custom CNAME records, verify DNS records, and track SSL certificates status.">
        <CMSEmptyState title="Error Loading Domains" description={error} actionText="Retry" onAction={loadData} icon={XCircle} />
      </CMSWorkspace>
    );
  }

  return (
    <CMSWorkspace
      title="Domains & Routing"
      description="Register subdomains, custom CNAME records, verify DNS records, and track Let's Encrypt SSL certificates status."
    >
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Domains</span>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><Globe size={16} /></div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active</span>
              <div className="p-2 rounded-lg bg-green-50 text-green-600"><CheckCircle2 size={16} /></div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">SSL Active</span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><Shield size={16} /></div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.sslActive}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">DNS Pending</span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600"><AlertTriangle size={16} /></div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.dnsPending}</div>
            {stats.primaryDomain && <div className="text-xs text-gray-400 mt-1 truncate">Primary: {stats.primaryDomain}</div>}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Configured Domains</h3>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors cursor-pointer" title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowAddDomain(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 cursor-pointer min-h-[44px]">
            <Plus size={16} />
            Add Domain
          </button>
        </div>
      </div>

      {/* Add Domain Modal */}
      {showAddDomain && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddDomain(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Custom Domain</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Domain</label>
                <input type="text" value={newDomain.domain} onChange={e => setNewDomain(p => ({ ...p, domain: e.target.value }))} placeholder="e.g. example.com" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
                <select value={newDomain.type} onChange={e => setNewDomain(p => ({ ...p, type: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="SUBDOMAIN">Subdomain</option>
                  <option value="CUSTOM">Custom Domain</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Environment</label>
                <select value={newDomain.environmentId} onChange={e => setNewDomain(p => ({ ...p, environmentId: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="">Select environment...</option>
                  {environments.map(env => (
                    <option key={env.id} value={env.id}>{env.name} ({env.type})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setShowAddDomain(false)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer min-h-[44px]">Cancel</button>
              <button onClick={handleAddDomain} disabled={!newDomain.domain} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px]">
                Add Domain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Domains List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 size={24} className="animate-spin mx-auto text-primary mb-3" />
          <p className="text-sm text-gray-500">Loading domains...</p>
        </div>
      ) : domains.length === 0 ? (
        <CMSEmptyState
          title="No Domains Configured"
          description="Provision subdomain records or verify custom domains mapping requests for live boutiques."
          actionText="Configure Custom Domain"
          onAction={() => setShowAddDomain(true)}
          icon={Globe}
        />
      ) : (
        <div className="space-y-3">
          {domains.map(domain => (
            <div key={domain.id} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {domain.isPrimary && <Star size={14} className="text-amber-500 fill-amber-500" />}
                    <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer" className="text-base font-bold text-gray-900 hover:text-primary transition-colors flex items-center gap-1">
                      {domain.domain}
                      <ExternalLink size={12} className="opacity-40" />
                    </a>
                    <DomainStatusBadge status={domain.status} />
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Shield size={12} />
                      SSL: <SSLStatus sslEnabled={domain.sslEnabled} sslStatus={domain.sslStatus} sslExpiresAt={domain.sslExpiresAt} />
                    </span>
                    {domain.cnameTarget && (
                      <span className="flex items-center gap-1">
                        <Link2 size={12} />
                        CNAME: <span className="font-mono">{domain.cnameTarget}</span>
                      </span>
                    )}
                    {domain.environment && (
                      <CMSBadge variant={domain.environment.type === 'PRODUCTION' ? 'danger' : 'info'}>
                        {domain.environment.name}
                      </CMSBadge>
                    )}
                  </div>
                  {domain.txtRecord && domain.status !== 'ACTIVE' && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs">
                      <span className="text-gray-400 font-bold">TXT Record: </span>
                      <code className="font-mono text-gray-600 break-all">{domain.txtRecord}</code>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-4 shrink-0">
                  {domain.status === 'PENDING_VERIFICATION' && (
                    <button onClick={() => handleVerifyDns(domain.id)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors cursor-pointer" title="Verify DNS">
                      <Search size={14} />
                    </button>
                  )}
                  {domain.dnsVerified && domain.status !== 'ACTIVE' && (
                    <>
                      <button onClick={() => handleCheckPropagation(domain.id)} className="p-2 hover:bg-purple-50 rounded-lg text-purple-600 transition-colors cursor-pointer" title="Check Propagation">
                        <RefreshCw size={14} />
                      </button>
                      <button onClick={() => handleRequestSsl(domain.id)} className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors cursor-pointer" title="Request SSL">
                        <Shield size={14} />
                      </button>
                      <button onClick={() => handleActivate(domain.id)} className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors cursor-pointer" title="Activate">
                        <CheckCircle2 size={14} />
                      </button>
                    </>
                  )}
                  {!domain.isPrimary && domain.status === 'ACTIVE' && (
                    <button onClick={() => handleSetPrimary(domain.id)} className="p-2 hover:bg-amber-50 rounded-lg text-amber-600 transition-colors cursor-pointer" title="Set as Primary">
                      <Star size={14} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(domain.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors cursor-pointer" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </CMSWorkspace>
  );
}

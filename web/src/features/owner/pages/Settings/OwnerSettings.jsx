import React, { useState, useEffect, useContext } from 'react';
import { 
  Lock, Users, Settings, CreditCard, Download, Search, 
  ChevronLeft, ChevronRight, Loader2, CheckCircle, AlertTriangle, 
  Mail, Phone, User, Key
} from 'lucide-react';
import { AuthContext } from '@core/contexts';
import OwnerLayout from '../../../../components/OwnerLayout';
import { getOwnerStaff, changeOwnerPassword, getOwnerSubscription } from '@core/services';

const OwnerSettings = () => {
  const { user } = useContext(AuthContext);
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });

  // Staff State
  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffPage, setStaffPage] = useState(1);
  const staffPerPage = 5;

  // Subscription Stats State
  const [subscription, setSubscription] = useState(null);
  const [subLoading, setSubLoading] = useState(true);

  const fetchStaffAndSub = async () => {
    try {
      const [staffRes, subRes] = await Promise.all([
        getOwnerStaff(),
        getOwnerSubscription()
      ]);
      setStaff(staffRes || []);
      if (subRes?.success && subRes?.data?.subscription) {
        setSubscription(subRes.data.subscription);
      }
    } catch (err) {
      console.error('Error fetching settings data:', err);
    } finally {
      setStaffLoading(false);
      setSubLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffAndSub();
  }, []);

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus({ type: '', message: '' });

    if (newPassword !== confirmPassword) {
      return setPasswordStatus({ type: 'error', message: 'New passwords do not match' });
    }

    setPasswordLoading(true);
    try {
      const res = await changeOwnerPassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordStatus({ type: 'error', message: res.message || 'Failed to update password' });
      }
    } catch (err) {
      setPasswordStatus({ 
        type: 'error', 
        message: err.response?.data?.message || 'Error updating password. Ensure criteria are met.' 
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Staff List Filters & Pagination
  const filteredStaff = staff.filter(member => 
    (member.ownerName || '').toLowerCase().includes(staffSearch.toLowerCase()) ||
    (member.email || '').toLowerCase().includes(staffSearch.toLowerCase()) ||
    (member.username || '').toLowerCase().includes(staffSearch.toLowerCase())
  );

  const totalStaffPages = Math.ceil(filteredStaff.length / staffPerPage) || 1;
  const paginatedStaff = filteredStaff.slice((staffPage - 1) * staffPerPage, staffPage * staffPerPage);

  // Export Staff List CSV
  const exportStaffCSV = () => {
    if (filteredStaff.length === 0) return alert('No data to export');
    const headers = ['Name', 'Username', 'Email', 'Phone', 'Role', 'Status', 'Joined Date'];
    const rows = filteredStaff.map(member => [
      member.ownerName,
      member.username,
      member.email,
      member.mobileNumber,
      member.role,
      member.status,
      new Date(member.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `staff_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <OwnerLayout title="Store Settings">
      <div className="space-y-10">
        
        {/* Header */}
        <div>
          <h2 className="text-2xl font-black text-gray-900">Workspace Settings</h2>
          <p className="text-sm font-medium text-gray-400 mt-1">
            Manage your boutique credentials, team access, and subscription limits.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Credential Lock & Limit Gauges */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Password Credential Update */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-6">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-3">
                <Key className="text-primary" size={20} /> Update Password
              </h3>
              <p className="text-xs font-semibold text-gray-400 -mt-2">
                Keep your boutique account secure. Must contain uppercase, lowercase, numbers, and symbols.
              </p>

              {passwordStatus.message && (
                <div className={`p-4 rounded-xl flex items-center gap-2 border text-xs font-black uppercase ${
                  passwordStatus.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
                }`}>
                  {passwordStatus.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  <span>{passwordStatus.message}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Password</label>
                  <input 
                    type="password"
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                    <input 
                      type="password"
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                    <input 
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={passwordLoading}
                    className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                  >
                    {passwordLoading && <Loader2 size={14} className="animate-spin" />}
                    <span>UPDATE PASSWORD</span>
                  </button>
                </div>
              </form>
            </section>

            {/* Team Access / Staff Listing */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-50 pb-6">
                <div>
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-3">
                    <Users className="text-primary" size={20} /> Staff Accounts
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Accounts linked to this boutique profile.</p>
                </div>
                <button 
                  onClick={exportStaffCSV}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-xs font-black text-gray-600 rounded-xl transition-all"
                >
                  <Download size={14} />
                  <span>EXPORT CSV</span>
                </button>
              </div>

              {/* Staff filter toolbar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  placeholder="Search staff by name, email, or username..." 
                  value={staffSearch}
                  onChange={e => { setStaffSearch(e.target.value); setStaffPage(1); }}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all"
                />
              </div>

              {/* Staff rendering */}
              <div className="space-y-4">
                {staffLoading ? (
                  <div className="flex justify-center py-6"><Loader2 size={28} className="animate-spin text-primary" /></div>
                ) : paginatedStaff.length > 0 ? (
                  paginatedStaff.map(member => (
                    <div key={member.id} className="p-4 border border-gray-100 hover:bg-gray-50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 text-primary font-black rounded-xl flex items-center justify-center">
                          {member.ownerName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900">{member.ownerName} <span className="font-medium text-gray-400">(@{member.username})</span></p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] font-semibold text-gray-400">
                            <span className="flex items-center gap-0.5"><Mail size={10} /> {member.email}</span>
                            {member.mobileNumber && <span className="flex items-center gap-0.5"><Phone size={10} /> {member.mobileNumber}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:text-right shrink-0">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          member.role === 'super_admin' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}>
                          {member.role === 'super_admin' ? 'Super Admin' : 'Owner/Staff'}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          member.status === 'Active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {member.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-gray-400 font-bold text-xs uppercase tracking-widest">No staff accounts found</p>
                )}
              </div>

              {/* Pagination Controls */}
              {totalStaffPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-50 pt-6">
                  <span className="text-xs font-semibold text-gray-400">
                    Page {staffPage} of {totalStaffPages} ({filteredStaff.length} members)
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={staffPage === 1}
                      onClick={() => setStaffPage(prev => Math.max(1, prev - 1))}
                      className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      disabled={staffPage === totalStaffPages}
                      onClick={() => setStaffPage(prev => Math.min(totalStaffPages, prev + 1))}
                      className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* RIGHT: Active Subscription limits progress */}
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm space-y-6">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-3">
                <CreditCard className="text-primary" size={20} /> Subscription Limits
              </h3>

              {subLoading ? (
                <div className="flex justify-center py-6"><Loader2 size={24} className="animate-spin text-primary" /></div>
              ) : subscription ? (
                <div className="space-y-5">
                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Active Plan</span>
                    <h4 className="text-xl font-black text-gray-900 mt-1">{subscription.plan.name}</h4>
                    <p className="text-xs font-bold text-gray-400 mt-0.5">₹{subscription.plan.price}/month billing cycle</p>
                  </div>

                  {/* Limits progress bars */}
                  <div className="space-y-4">
                    {[
                      { label: 'Designs Limit', key: 'designs' },
                      { label: 'Monthly Orders Limit', key: 'orders' },
                      { label: 'Gallery Images Limit', key: 'gallery' },
                      { label: 'Staff Accounts Limit', key: 'staff' }
                    ].map(limit => {
                      const prog = subscription.usageProgress?.[limit.key];
                      if (!prog) return null;
                      const maxLabel = prog.max === 'Unlimited' ? 'Unlimited' : prog.max;
                      return (
                        <div key={limit.key} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-gray-500">
                            <span>{limit.label}</span>
                            <span className="text-gray-900">{prog.current} / {maxLabel}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${prog.warning ? 'bg-amber-500' : 'bg-primary'}`}
                              style={{ width: `${prog.max === 'Unlimited' ? 5 : Math.min(100, (prog.current / prog.max) * 100)}%` }}
                            />
                          </div>
                          {prog.warning && (
                            <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1">
                              <AlertTriangle size={10} /> Limit warning - upgrade plan soon
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">No active subscription plan found</p>
              )}
            </section>

            <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-3">
              <p className="text-xs font-black text-primary uppercase tracking-widest">Need more access?</p>
              <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                Unlock higher limits, analytics dashboards, and AI assistant tools by upgrading your plan.
              </p>
              <a href="/owner/subscription" className="inline-block text-xs font-black text-primary hover:underline uppercase tracking-wider">
                GO TO SUBSCRIPTIONS →
              </a>
            </div>
          </div>

        </div>

      </div>
    </OwnerLayout>
  );
};

export default OwnerSettings;

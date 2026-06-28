import React from 'react';
import { User, UserPlus, Link as LinkIcon, Mail, RefreshCw, ShieldCheck, ShieldOff, Ban, Unlink, Loader2, X } from 'lucide-react';
import { motion } from 'framer-motion';

const OwnerDetailsTab = ({ 
    owners, ownerMode, setOwnerMode, handleSendResetLink, handleResendInvite, 
    handleOwnerStatusToggle, handleUnlinkOwner, unassignedOwners, selectedOwnerId, 
    setSelectedOwnerId, handleLinkOwner, inviteData, setInviteData, handleInviteOwner, 
    submittingOwner 
}) => {
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black text-gray-900">
                        {owners.length === 0 ? 'No Owner Assigned' : `Owner${owners.length > 1 ? 's' : ''} (${owners.length}/2)`}
                    </h3>
                    <p className="text-sm text-gray-400 font-medium mt-0.5">
                        {owners.length === 0 ? 'Link or invite an owner to manage this boutique.' : 'Each owner has independent access control.'}
                    </p>
                </div>
                {owners.length < 2 && (
                    <button
                        onClick={() => setOwnerMode(ownerMode ? null : 'link')}
                        className="flex items-center space-x-2 px-5 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                    >
                        <UserPlus size={16} />
                        <span>{owners.length === 0 ? 'Add Owner' : '+ Add Co-owner'}</span>
                    </button>
                )}
            </div>

            {owners.map((o, idx) => (
                <div key={o._id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-primary/10 text-primary rounded-[1.5rem] flex items-center justify-center text-2xl font-black flex-shrink-0">
                            {o.ownerName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-lg font-black text-gray-900">{o.ownerName}</h4>
                                {idx === 0 && owners.length > 1 && (
                                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest rounded-full">Primary</span>
                                )}
                            </div>
                            <p className="text-sm font-bold text-gray-400">@{o.username}</p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            o.status === 'Active' ? 'bg-green-100 text-green-700' :
                            o.status === 'Blocked' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                        }`}>{o.status}</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { label: 'Email',      value: o.email },
                            { label: 'Mobile',     value: o.mobileNumber },
                            { label: 'Last Login', value: o.lastLogin ? new Date(o.lastLogin).toLocaleDateString() : 'Never' },
                            { label: 'Joined',     value: new Date(o.createdAt).toLocaleDateString() },
                            { label: 'Verified',   value: o.emailVerified ? '✓ Yes' : '✕ No' },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-gray-50 p-4 rounded-2xl">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                                <p className="text-sm font-bold text-gray-800 truncate">{value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-50">
                        <button onClick={() => handleSendResetLink(o)}
                            className="flex items-center space-x-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-700 transition-all">
                            <RefreshCw size={13}/><span>Reset Password</span>
                        </button>
                        {o.status === 'Pending' && (
                            <button onClick={() => handleResendInvite(o)}
                                className="flex items-center space-x-2 px-5 py-2.5 bg-amber-50 text-amber-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-100 transition-all">
                                <Mail size={13}/><span>Resend Invite</span>
                            </button>
                        )}
                        <button onClick={() => handleOwnerStatusToggle(o)}
                            className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                                o.status === 'Blocked' ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}>
                            {o.status === 'Blocked' ? <><ShieldCheck size={13}/><span>Unblock</span></> : <><Ban size={13}/><span>Block</span></>}
                        </button>
                        <button onClick={() => handleUnlinkOwner(o)}
                            className="flex items-center space-x-2 px-5 py-2.5 bg-gray-50 text-gray-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all ml-auto">
                            <Unlink size={13}/><span>Unlink</span>
                        </button>
                    </div>
                </div>
            ))}

            {owners.length === 0 && !ownerMode && (
                <div className="text-center p-16 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <User size={40} className="text-gray-300" />
                    </div>
                    <p className="text-gray-400 font-medium">Click <strong>Add Owner</strong> above to get started.</p>
                </div>
            )}

            {ownerMode && owners.length < 2 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-primary/20 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-black text-gray-900">Add {owners.length === 0 ? 'Owner' : 'Co-owner'}</h4>
                        <button onClick={() => setOwnerMode(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"><X size={18} /></button>
                    </div>
                    <div className="flex gap-3 mb-6">
                        {['link','invite'].map(m => (
                            <button key={m} onClick={() => setOwnerMode(m)}
                                className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                                    ownerMode === m ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}>
                                {m === 'link' ? <><LinkIcon size={14}/><span>Link Existing</span></> : <><Mail size={14}/><span>Invite New</span></>}
                            </button>
                        ))}
                    </div>

                    {ownerMode === 'link' && (
                        <div className="space-y-4">
                            <select value={selectedOwnerId} onChange={e => setSelectedOwnerId(e.target.value)}
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20">
                                <option value="">-- Select an unassigned owner --</option>
                                {unassignedOwners.map(u => (
                                    <option key={u._id} value={u._id}>{u.ownerName} ({u.email})</option>
                                ))}
                            </select>
                            <button disabled={submittingOwner || !selectedOwnerId} onClick={handleLinkOwner}
                                className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 disabled:opacity-50">
                                {submittingOwner ? <Loader2 className="animate-spin" /> : <><LinkIcon size={16}/><span>Link Account</span></>}
                            </button>
                        </div>
                    )}

                    {ownerMode === 'invite' && (
                        <form onSubmit={handleInviteOwner} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[['ownerName','Full Name'],['email','Email'],['username','Username'],['mobileNumber','Mobile']].map(([field, label]) => (
                                <div key={field} className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
                                    <input required type={field === 'email' ? 'email' : 'text'}
                                        value={inviteData[field]}
                                        onChange={e => setInviteData({...inviteData, [field]: e.target.value})}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                </div>
                            ))}
                            <div className="md:col-span-2">
                                <button disabled={submittingOwner} className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 disabled:opacity-50">
                                    {submittingOwner ? <Loader2 className="animate-spin" /> : <><Mail size={16}/><span>Send Invitation</span></>}
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default OwnerDetailsTab;

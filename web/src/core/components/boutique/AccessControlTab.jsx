import React from 'react';
import { User, Shield, ShieldCheck, ShieldOff, Loader2, Save } from 'lucide-react';

const AccessControlTab = ({ 
    owners, pendingPermissions, handlePermissionToggle, handleSavePermissions, savingPermissions 
}) => {
    return (
        <div className="space-y-6">
            {owners.length === 0 && (
                <div className="max-w-2xl mx-auto text-center py-20 px-8 bg-gradient-to-b from-gray-50 to-white rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User size={40} className="text-gray-300" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-800 mb-2">No Owner Linked</h3>
                    <p className="text-gray-500 font-medium mb-8">Go to Owner Details tab to add an owner first.</p>
                </div>
            )}

            {owners.map((o) => {
                const perms = pendingPermissions[o._id] || {};
                const isSaving = !!savingPermissions[o._id];

                return (
                    <div key={o._id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 bg-gray-50/50 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary font-black">
                                    {o.ownerName?.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-gray-900">{o.ownerName}</h4>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Access Control Panel</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleSavePermissions(o)}
                                disabled={isSaving}
                                className="flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={14}/> : <><Save size={14}/><span>Save Permissions</span></>}
                            </button>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { key: 'canEditProfile', label: 'Edit Boutique Profile', desc: 'Allow owner to change contact, location & info' },
                                { key: 'canManageMedia',  label: 'Manage Branding',     desc: 'Allow owner to update Logo & Cover Banner' },
                                { key: 'canEditServices', label: 'Service & Specialties',desc: 'Allow owner to manage work types' },
                                { key: 'canEditGallery',  label: 'Portfolio Gallery',   desc: 'Allow owner to upload/edit gallery images' },
                                { key: 'canManageDesigns',label: 'Design Catalog',      desc: 'Allow owner to add/edit shop designs' },
                                { key: 'canManageOrders', label: 'Order Processing',    desc: 'Allow owner to manage customer orders' },
                                { key: 'canViewAnalytics',label: 'View Analytics',      desc: 'Allow access to dashboard stats' }
                            ].map((perm) => (
                                <div 
                                    key={perm.key}
                                    onClick={() => handlePermissionToggle(o._id, perm.key)}
                                    className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer group ${
                                        perms[perm.key] ? 'bg-primary/5 border-primary/20 shadow-lg shadow-primary/5' : 'bg-white border-gray-50 hover:border-gray-100'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`p-2 rounded-xl transition-colors ${perms[perm.key] ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            {perms[perm.key] ? <ShieldCheck size={18} /> : <Shield size={18} />}
                                        </div>
                                        <div className={`w-10 h-5 rounded-full relative transition-all ${perms[perm.key] ? 'bg-primary' : 'bg-gray-200'}`}>
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${perms[perm.key] ? 'left-6' : 'left-1'}`} />
                                        </div>
                                    </div>
                                    <h5 className={`text-sm font-black uppercase tracking-tight mb-1 ${perms[perm.key] ? 'text-primary' : 'text-gray-900'}`}>{perm.label}</h5>
                                    <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-widest">{perm.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AccessControlTab;

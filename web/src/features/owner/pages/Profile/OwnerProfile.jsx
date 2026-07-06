import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import OwnerLayout from '../../../../components/OwnerLayout';
import { getOwnerBoutique, updateOwnerBoutique, updateOwnerMedia, uploadImage } from '@core/services';
import {
    Save, MapPin, Camera, Loader2, Store, AlertCircle,
    Image as ImageIcon, Upload, X, CheckCircle, Eye,
    Clock, Phone, AtSign, Globe, Users, Palette, Star
} from 'lucide-react';
import { AuthContext } from '@core/contexts';
import AppPreviewMockup from '@core/components/shared/AppPreviewMockup';

/* ─────────────────────────────────────────────────────────────
   Image Upload Card — logo / cover via backend POST /upload only
───────────────────────────────────────────────────────────── */
const ImageUploadCard = ({ label, hint, value, onChange, onFileUpload, disabled, uploading, aspectRatio = '1/1', height = 'h-40' }) => {
    const fileRef = useRef(null);
    const [previewErr, setPreviewErr] = useState(false);

    useEffect(() => { setPreviewErr(false); }, [value]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert('File too large. Max 5 MB.'); return; }
        onFileUpload(file).then((url) => {
            if (url) onChange(url);
        });
        e.target.value = '';
    };

    const handleClear = () => { onChange(''); setPreviewErr(false); };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
                {value && !disabled && (
                    <button type="button" onClick={handleClear}
                        className="flex items-center gap-1 text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-all">
                        <X size={10} /> Clear
                    </button>
                )}
            </div>

            <div className={`relative group w-full ${height} rounded-2xl overflow-hidden border-2 ${value && !previewErr ? 'border-primary/20' : 'border-dashed border-gray-200'} bg-gray-50 flex items-center justify-center`}>
                {value && !previewErr ? (
                    <>
                        <img
                            src={value}
                            alt={label}
                            className="w-full h-full object-cover"
                            style={{ aspectRatio }}
                            onError={() => setPreviewErr(true)}
                        />
                        {!disabled && !uploading && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button type="button" onClick={() => fileRef.current?.click()}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-white/90 rounded-xl text-[11px] font-black text-gray-800 hover:bg-white transition-all">
                                    <Upload size={13} /> Replace
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center text-center p-4">
                        {previewErr ? (
                            <>
                                <AlertCircle size={28} className="text-red-300 mb-2" />
                                <p className="text-xs font-bold text-red-400">Preview failed</p>
                                <p className="text-[10px] text-red-300 mt-1">Upload a new image</p>
                            </>
                        ) : (
                            <>
                                <Camera size={28} className="text-gray-300 mb-2" />
                                <p className="text-xs font-bold text-gray-400">No {label} yet</p>
                            </>
                        )}
                        {!disabled && !uploading && (
                            <button type="button" onClick={() => fileRef.current?.click()}
                                className="flex items-center gap-1.5 px-3 py-2 mt-3 bg-primary/10 text-primary rounded-xl text-[11px] font-black hover:bg-primary/20 transition-all">
                                <Upload size={12} /> Upload
                            </button>
                        )}
                    </div>
                )}
            </div>

            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} disabled={disabled || uploading} />
            {uploading && <p className="text-[10px] font-black text-primary uppercase tracking-widest">Uploading…</p>}
            <p className="text-[10px] text-gray-400 font-medium">{hint}</p>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   Main OwnerProfile Page
───────────────────────────────────────────────────────────── */
const OwnerProfile = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [boutique, setBoutique] = useState(null);
    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]     = useState(false);
    const [savingMedia, setSavingMedia] = useState(false);
    const [mediaSaved, setMediaSaved]   = useState(false);
    const [uploadingType, setUploadingType] = useState('');

    // Media state (separate from profile fields)
    const [logo,       setLogo]       = useState('');
    const [coverImage, setCoverImage] = useState('');

    const canEdit      = user?.permissions?.canEditProfile;
    const canManageMedia = user?.permissions?.canManageMedia;

    // Hard guard — redirect if permission revoked
    useEffect(() => {
        if (!loading && user && canEdit === false) {
            navigate('/owner/dashboard', { replace: true });
        }
    }, [canEdit, loading, user, navigate]);

    useEffect(() => {
        (async () => {
            try {
                const data = await getOwnerBoutique();
                setBoutique(data);
                setLogo(data.media?.logo || '');
                setCoverImage(data.media?.coverImage || '');
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Save profile info
    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateOwnerBoutique(boutique);
            alert('Profile updated successfully');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    // Save media (logo + cover) separately
    const handleSaveMedia = async () => {
        setSavingMedia(true);
        setMediaSaved(false);
        try {
            await updateOwnerMedia({ logo, coverImage });
            setBoutique(prev => ({ 
              ...prev, 
              media: { 
                ...prev.media, 
                logo, 
                coverImage 
              } 
            }));
            setMediaSaved(true);
            setTimeout(() => setMediaSaved(false), 3000);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update media');
        } finally {
            setSavingMedia(false);
        }
    };

    const handleS3Upload = async (file, type) => {
        try {
            setUploadingType(type);
            const response = await uploadImage(file, type);
            const url = response?.url || '';
            return url;
        } catch (err) {
            alert(err.response?.data?.message || err.message || 'Failed to upload image');
            return '';
        } finally {
            setUploadingType('');
        }
    };

    if (loading) return (
        <OwnerLayout title="Boutique Profile">
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        </OwnerLayout>
    );

    return (
        <OwnerLayout title="Boutique Profile">
            <form onSubmit={handleSave} className="space-y-10">

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">Edit Boutique Profile</h2>
                        <p className="text-sm font-medium text-gray-400 mt-1">Manage your business information and media.</p>
                    </div>
                    <button
                        type="submit"
                        disabled={saving || !canEdit}
                        className="flex items-center space-x-2 px-8 py-3 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /><span>Save Changes</span></>}
                    </button>
                </div>

                {/* Read-only banner */}
                {!canEdit && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center space-x-3 text-amber-700">
                        <AlertCircle size={20} />
                        <p className="text-xs font-black uppercase tracking-widest">Read-Only Mode: Profile editing is disabled by Super Admin.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ── LEFT: Info Sections ─────────────────────────────── */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* ── Basic Info ── */}
                        <section className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm space-y-6">
                            <h3 className="text-lg font-black text-gray-900 flex items-center">
                                <Store className="mr-3 text-primary" size={20} /> Basic Information
                                <span className="ml-auto text-[9px] font-black text-primary/50 uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-lg">📱 App: Name + Description</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Boutique Name</label>
                                    <input disabled={!canEdit} value={boutique.name || ''}
                                        onChange={e => setBoutique({ ...boutique, name: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Experience Years <span className="text-primary">📱</span></label>
                                    <input disabled={!canEdit} placeholder="e.g. 6+ Years" value={boutique.experienceYears || ''}
                                        onChange={e => setBoutique({ ...boutique, experienceYears: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Starting Price (₹)</label>
                                    <input disabled={!canEdit} value={boutique.startingPrice || ''}
                                        onChange={e => setBoutique({ ...boutique, startingPrice: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Turnaround Time</label>
                                    <input disabled={!canEdit} placeholder="e.g. 7–10 Days" value={boutique.turnaroundTime || ''}
                                        onChange={e => setBoutique({ ...boutique, turnaroundTime: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50" />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description <span className="text-primary">📱</span></label>
                                    <textarea disabled={!canEdit} rows={4} value={boutique.description || ''}
                                        onChange={e => setBoutique({ ...boutique, description: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 resize-none" />
                                </div>
                            </div>
                        </section>

                        {/* ── App Stats Panel ── */}
                        <section className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm space-y-6">
                            <h3 className="text-lg font-black text-gray-900 flex items-center">
                                <Star className="mr-3 text-primary" size={20} /> App Stats
                                <span className="ml-auto text-[9px] font-black text-primary/50 uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-lg">📱 App: Stat Chips</span>
                            </h3>
                            <p className="text-xs text-gray-400 font-medium -mt-2">These numbers appear as the 3 chips below the boutique name in the app (e.g. 500+ Happy Clients · 1000+ Designs)</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Users size={12}/> Happy Clients</label>
                                    <input disabled={!canEdit} placeholder="e.g. 500+" value={boutique.happyClients || ''}
                                        onChange={e => setBoutique({ ...boutique, happyClients: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Palette size={12}/> Total Designs</label>
                                    <input disabled={!canEdit} placeholder="e.g. 1000+" value={boutique.totalDesigns || ''}
                                        onChange={e => setBoutique({ ...boutique, totalDesigns: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50" />
                                </div>
                            </div>
                            {/* Live preview of what the stat chips look like */}
                            <div className="flex gap-3 pt-2">
                                {[{ v: boutique.happyClients || '500+', l: 'Happy Clients' }, { v: boutique.totalDesigns || '1000+', l: 'Designs' }, { v: 'Verified', l: 'Boutique' }].map((st, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center bg-gray-50 border border-gray-100 rounded-2xl py-3 px-2">
                                        <span className="text-xs font-black text-gray-900">{st.v}</span>
                                        <span className="text-[9px] font-semibold text-gray-400 mt-0.5 text-center">{st.l}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest text-center">↑ Live preview of app stat chips</p>
                        </section>

                        {/* ── Location & Contact ── */}
                        <section className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm space-y-6">
                            <h3 className="text-lg font-black text-gray-900 flex items-center">
                                <MapPin className="mr-3 text-primary" size={20} /> Location & Contact
                                <span className="ml-auto text-[9px] font-black text-primary/50 uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-lg">📱 App: Location line</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Phone size={11}/> Phone Number <span className="text-primary">📱</span></label>
                                    <input disabled={!canEdit} value={boutique.mobileNumber || boutique.phoneNumber || ''}
                                        onChange={e => setBoutique({ ...boutique, mobileNumber: e.target.value, phoneNumber: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp Number</label>
                                    <input disabled={!canEdit} value={boutique.whatsappNumber || ''}
                                        onChange={e => setBoutique({ ...boutique, whatsappNumber: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50" />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Address</label>
                                    <input disabled={!canEdit} value={boutique.fullAddress || ''}
                                        onChange={e => setBoutique({ ...boutique, fullAddress: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Area / Locality <span className="text-primary">📱</span></label>
                                    <input disabled={!canEdit} placeholder="e.g. Somajiguda" value={boutique.area || ''}
                                        onChange={e => setBoutique({ ...boutique, area: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">City <span className="text-primary">📱</span></label>
                                    <input disabled={!canEdit} value={boutique.city || ''}
                                        onChange={e => setBoutique({ ...boutique, city: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">State <span className="text-primary">📱</span></label>
                                    <input disabled={!canEdit} value={boutique.state || ''}
                                        onChange={e => setBoutique({ ...boutique, state: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pincode</label>
                                    <input disabled={!canEdit} value={boutique.pincode || ''}
                                        onChange={e => setBoutique({ ...boutique, pincode: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50" />
                                </div>
                            </div>
                            {/* Location preview */}
                            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-2xl">
                                <MapPin size={13} className="text-primary shrink-0" />
                                <p className="text-xs font-bold text-primary">
                                    {[boutique.area, boutique.city, boutique.state].filter(Boolean).join(', ') || 'Area, City, State'}
                                </p>
                            </div>
                        </section>

                        {/* ── Business Hours ── */}
                        <section className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm space-y-6">
                            <h3 className="text-lg font-black text-gray-900 flex items-center">
                                <Clock className="mr-3 text-primary" size={20} /> Business Hours
                                <span className="ml-auto text-[9px] font-black text-primary/50 uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-lg">📱 App: About Tab</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Opening Time <span className="text-primary">📱</span></label>
                                    <input disabled={!canEdit} placeholder="e.g. 11:00 AM" value={boutique.openingTime || ''}
                                        onChange={e => setBoutique({ ...boutique, openingTime: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Closing Time <span className="text-primary">📱</span></label>
                                    <input disabled={!canEdit} placeholder="e.g. 8:00 PM" value={boutique.closingTime || ''}
                                        onChange={e => setBoutique({ ...boutique, closingTime: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Open Days <span className="text-primary">📱</span></label>
                                    <input disabled={!canEdit} placeholder="e.g. Mon–Sat" value={boutique.openDays || ''}
                                        onChange={e => setBoutique({ ...boutique, openDays: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Weekly Holiday <span className="text-primary">📱</span></label>
                                    <input disabled={!canEdit} placeholder="e.g. Sunday" value={boutique.weeklyHoliday || ''}
                                        onChange={e => setBoutique({ ...boutique, weeklyHoliday: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50" />
                                </div>
                            </div>
                        </section>

                        {/* ── Social Links ── */}
                        <section className="bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm space-y-6">
                            <h3 className="text-lg font-black text-gray-900 flex items-center">
                                <AtSign className="mr-3 text-primary" size={20} /> Social & Web
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1"><AtSign size={11}/> Instagram Handle</label>
                                    <input disabled={!canEdit} placeholder="@yourboutique" value={boutique.instagramHandle || ''}
                                        onChange={e => setBoutique({ ...boutique, instagramHandle: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Globe size={11}/> Website Link</label>
                                    <input disabled={!canEdit} placeholder="https://yourboutique.com" value={boutique.websiteLink || ''}
                                        onChange={e => setBoutique({ ...boutique, websiteLink: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50" />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* ── RIGHT: Media & Preview Panel ───────────────────────────────── */}
                    <div className="space-y-6 lg:sticky lg:top-8 h-fit pb-8">
                        
                        {/* ── Live Phone Simulator ── */}
                        <div className="hidden lg:block mb-8">
                            <h3 className="text-sm font-black text-gray-900 flex items-center mb-4 uppercase tracking-widest">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
                                Live App Preview
                            </h3>
                            <AppPreviewMockup boutique={boutique} />
                        </div>

                        <div className="bg-white p-6 rounded-[3rem] border border-gray-50 shadow-sm space-y-6">

                            {/* Panel header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                    <ImageIcon size={18} className="text-primary" /> Media
                                </h3>
                                {mediaSaved && (
                                    <span className="flex items-center gap-1 text-[10px] font-black text-green-600 uppercase tracking-widest">
                                        <CheckCircle size={12} /> Saved
                                    </span>
                                )}
                            </div>

                            {/* No permission banner */}
                            {!canManageMedia && (
                                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-2 text-gray-500">
                                    <AlertCircle size={14} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Media editing disabled by Admin</p>
                                </div>
                            )}

                            {/* Logo */}
                            <ImageUploadCard
                                label="Boutique Logo"
                                hint="Square image · JPG, PNG, WebP · Max 5 MB · Stored on S3"
                                value={logo}
                                onChange={setLogo}
                                onFileUpload={(file) => handleS3Upload(file, 'logo')}
                                disabled={!canManageMedia}
                                uploading={uploadingType === 'logo'}
                                aspectRatio="1/1"
                                height="h-36"
                            />

                            {/* Cover Image */}
                            <ImageUploadCard
                                label="Cover Image"
                                hint="Landscape banner · 16:9 recommended · Max 5 MB · Stored on S3"
                                value={coverImage}
                                onChange={setCoverImage}
                                onFileUpload={(file) => handleS3Upload(file, 'cover')}
                                disabled={!canManageMedia}
                                uploading={uploadingType === 'cover'}
                                aspectRatio="16/9"
                                height="h-36"
                            />

                            {/* Save media button */}
                            <button
                                type="button"
                                onClick={handleSaveMedia}
                                disabled={savingMedia || !canManageMedia || !!uploadingType}
                                className="w-full flex items-center justify-center space-x-2 py-3.5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-40"
                            >
                                {savingMedia
                                    ? <><Loader2 size={15} className="animate-spin" /><span>Saving Media…</span></>
                                    : mediaSaved
                                    ? <><CheckCircle size={15} /><span>Media Saved!</span></>
                                    : <><Upload size={15} /><span>Save Logo & Cover</span></>
                                }
                            </button>

                            {/* Preview link if coverImage exists */}
                            {boutique?.media?.coverImage && (
                                <a href={boutique.media.coverImage} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
                                    <Eye size={12} /> Preview current cover
                                </a>
                            )}
                        </div>

                        {/* Info tip card */}
                        <div className="p-5 bg-primary/5 rounded-3xl border border-primary/10">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">📸 Image Tips</p>
                            <ul className="space-y-1.5 text-xs font-medium text-gray-500">
                                <li>• Logo: square, min 200×200px</li>
                                <li>• Cover: 1200×675px (16:9) for best quality</li>
                                <li>• Images upload to your S3 bucket via the server</li>
                                <li>• PNG with transparent background works best for logos</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </form>
        </OwnerLayout>
    );
};

export default OwnerProfile;

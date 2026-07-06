import React, { useState, useEffect, useContext } from 'react';
import OwnerLayout from '../../../../components/OwnerLayout';
import AppPreviewMockup from '@core/components/shared/AppPreviewMockup';
import { getDesigns, createDesign, updateDesign, deleteDesign, getOwnerBoutique, uploadImage } from '@core/services';
import { Plus, Edit2, Trash2, Image as ImageIcon, Check, X, Loader2, Filter, Search, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '@core/contexts';

const OwnerDesigns = () => {
    const { user } = useContext(AuthContext);
    const [designs, setDesigns] = useState([]);
    const [boutique, setBoutique] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDesign, setEditingDesign] = useState(null);
    const canManage = user?.permissions?.canManageDesigns;
    const [formData, setFormData] = useState({
        name: '',
        category: 'Blouse',
        price: 0,
        description: '',
        isAvailable: true,
        images: ['']
    });
    const [uploadingDesignImage, setUploadingDesignImage] = useState(false);

    const fetchData = async () => {
        try {
            const [designsData, boutiqueData] = await Promise.all([
                getDesigns(),
                getOwnerBoutique()
            ]);
            setDesigns(designsData);
            setBoutique(boutiqueData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchDesigns = async () => {
        try {
            const data = await getDesigns();
            setDesigns(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDesignImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingDesignImage(true);
        try {
            const data = await uploadImage(file, 'gallery');
            setFormData((prev) => ({ ...prev, images: [data.url || ''] }));
        } catch (err) {
            alert(err.response?.data?.message || err.message || 'Image upload failed');
        } finally {
            setUploadingDesignImage(false);
            e.target.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (uploadingDesignImage) return;
        const images = (formData.images || []).map((u) => (typeof u === 'string' ? u.trim() : '')).filter(Boolean);
        if (!images.length) {
            alert('Please upload a design image.');
            return;
        }
        const payload = { ...formData, images };
        try {
            if (editingDesign) {
                await updateDesign(editingDesign._id, payload);
            } else {
                await createDesign(payload);
            }
            setIsModalOpen(false);
            fetchDesigns();
        } catch (err) {
            alert('Failed to save design');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this design?')) return;
        try {
            await deleteDesign(id);
            fetchDesigns();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const openModal = (design = null) => {
        if (design) {
            setEditingDesign(design);
            const imgs = Array.isArray(design.images) && design.images.length ? design.images : [''];
            setFormData({ ...design, images: imgs });
        } else {
            setEditingDesign(null);
            setFormData({ name: '', category: 'Blouse', price: 0, description: '', isAvailable: true, images: [''] });
        }
        setUploadingDesignImage(false);
        setIsModalOpen(true);
    };

    return (
        <OwnerLayout title="My Designs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* ── LEFT: Gallery ── */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">Design Gallery</h2>
                            <p className="text-sm font-medium text-gray-400 mt-1">Manage and showcase your creations to customers.</p>
                        </div>
                        <button 
                            onClick={() => openModal()}
                            disabled={!canManage}
                            className="flex items-center space-x-2 px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            <Plus size={20} /> <span>Add New Design</span>
                        </button>
                    </div>

                    {!canManage && (
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center space-x-3 text-amber-700">
                            <AlertCircle size={20} />
                            <p className="text-xs font-black uppercase tracking-widest">Read-Only Mode: Design management is disabled by Super Admin.</p>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 bg-white p-4 rounded-[2rem] border border-gray-50 shadow-sm">
                        <div className="flex-1 min-w-[200px] relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input placeholder="Search designs..." className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div className="flex space-x-2">
                            {['All', 'Blouse', 'Lehenga', 'Saree'].map(cat => (
                                <button key={cat} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-gray-50 text-gray-500 hover:bg-primary hover:text-white transition-all">
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid */}
                    {loading ? <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={40} /></div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {designs.map((design) => (
                                <motion.div 
                                    layout
                                    key={design._id}
                                    className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-gray-200/50 transition-all"
                                >
                                    <div className="aspect-[4/5] bg-gray-100 relative">
                                        {design.images[0] ? (
                                            <img 
                                                src={design.images[0]} 
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://placehold.co/600x800/8B0000/FFFFFF?text=' + encodeURIComponent(design.name || 'Design');
                                                }}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={40} /></div>
                                        )}
                                        <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {canManage && (
                                                <>
                                                    <button onClick={() => openModal(design)} className="p-3 bg-white/90 backdrop-blur shadow-sm rounded-xl text-gray-900 hover:bg-primary hover:text-white transition-all"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDelete(design._id)} className="p-3 bg-white/90 backdrop-blur shadow-sm rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                                                </>
                                            )}
                                        </div>
                                        {!design.isAvailable && (
                                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                                                <span className="px-6 py-2 bg-white text-gray-900 rounded-full text-[10px] font-black uppercase tracking-widest">Out of Stock</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{design.category}</p>
                                                <h3 className="text-lg font-black text-gray-900 truncate">{design.name}</h3>
                                            </div>
                                            <span className="text-lg font-black text-gray-900">₹{design.price}</span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-400 line-clamp-2 mb-4">{design.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Live Phone Simulator ── */}
                <div className="lg:col-span-4 lg:sticky lg:top-8 h-fit pb-8">
                    <div className="hidden lg:block">
                        <h3 className="text-sm font-black text-gray-900 flex items-center mb-4 uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
                            Live App Preview
                        </h3>
                        <AppPreviewMockup boutique={boutique} designs={designs} />
                    </div>
                </div>

            </div>

            {/* Modal Placeholder */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden">
                            <div className="p-10">
                                <h3 className="text-2xl font-black text-gray-900 mb-8">{editingDesign ? 'Edit Design' : 'Add New Design'}</h3>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Design Name</label>
                                            <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price (₹)</label>
                                            <input type="number" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                                            <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900">
                                                <option>Blouse</option>
                                                <option>Lehenga</option>
                                                <option>Saree</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Design image (upload)</label>
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp"
                                                disabled={!canManage || uploadingDesignImage}
                                                onChange={handleDesignImageUpload}
                                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 disabled:opacity-50"
                                            />
                                            {uploadingDesignImage ? (
                                                <p className="text-xs font-bold text-primary flex items-center gap-2"><Loader2 className="animate-spin" size={14} /> Uploading…</p>
                                            ) : null}
                                            {formData.images?.[0] ? (
                                                <img 
                                                    src={formData.images[0]} 
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://placehold.co/600x400/8B0000/FFFFFF?text=Preview+Error';
                                                    }}
                                                    alt="Preview" 
                                                    className="w-full max-h-48 object-contain rounded-2xl border border-gray-100 bg-white mt-2" 
                                                />
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                                        <textarea rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900" />
                                    </div>
                                    <div className="flex items-center space-x-3 pt-4">
                                        <button type="submit" disabled={uploadingDesignImage || !canManage} className="flex-1 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50">Save Design</button>
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest">Cancel</button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </OwnerLayout>
    );
};

export default OwnerDesigns;

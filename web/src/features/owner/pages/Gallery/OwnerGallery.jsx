import React, { useState, useEffect, useContext } from 'react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import OwnerLayout from '../../../../components/OwnerLayout';
import { getOwnerBoutique, updateOwnerGallery, uploadImage } from '@core/services';
import { Image as ImageIcon, Plus, Trash2, Maximize2, Save, Loader2, AlertCircle, X, Camera } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { AuthContext } from '@core/contexts';

const OwnerGallery = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const canEdit = user?.permissions?.canEditGallery;

    // Hard guard — redirect if permission revoked
    useEffect(() => {
        if (!loading && user && canEdit === false) {
            navigate('/owner/dashboard', { replace: true });
        }
    }, [canEdit, loading, user, navigate]);

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const data = await getOwnerBoutique();
                setImages(Array.isArray(data.media?.gallery) ? data.media.gallery : []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchGallery();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateOwnerGallery({ galleryImages: images });
            alert('Gallery updated successfully');
        } catch (err) {
            alert('Failed to update gallery');
        } finally {
            setSaving(false);
        }
    };

    const removeImage = (index) => {
        if (!canEdit) return;
        setImages(images.filter((_, i) => i !== index));
    };

    const handleUploadClick = () => {
        if (!canEdit) return;
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setUploading(true);
        try {
            const uploaded = [];
            for (const file of files) {
                const result = await uploadImage(file, 'gallery');
                if (result?.url) {
                    uploaded.push(result.url);
                }
            }
            setImages((prev) => [...prev, ...uploaded]);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to upload images');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    if (loading) return <OwnerLayout title="Media Gallery"><div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={40} /></div></OwnerLayout>;

    return (
        <OwnerLayout title="Media Gallery">
            <div className="space-y-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Boutique Portfolio</h2>
                        <p className="text-sm font-medium text-gray-400 mt-1">Manage the images that represent your work quality.</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={handleUploadClick}
                            disabled={!canEdit}
                            className="flex items-center space-x-2 px-8 py-4 bg-white border border-gray-100 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                        >
                            {uploading ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />} <span>Upload Photo</span>
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={saving || !canEdit}
                            className="flex items-center space-x-2 px-10 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200"
                        >
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> <span>Save Gallery</span></>}
                        </button>
                    </div>
                </div>

                {!canEdit && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center space-x-3 text-amber-700">
                        <AlertCircle size={20} />
                        <p className="text-xs font-black uppercase tracking-widest">Read-Only Mode: Gallery management is disabled by Super Admin.</p>
                    </div>
                )}

                {/* Gallery Grid */}
                <Reorder.Group 
                    axis="x" 
                    values={images} 
                    onReorder={setImages} 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                >
                    <AnimatePresence>
                        {images.map((img, idx) => (
                            <Reorder.Item 
                                key={img}
                                value={img}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="group relative aspect-[4/5] bg-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 transition-all border border-gray-50 cursor-grab active:cursor-grabbing"
                            >
                                <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 pointer-events-none" />
                                
                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                                    <button 
                                        onClick={() => setPreviewImage(img)}
                                        className="p-3 bg-white text-gray-900 rounded-xl hover:bg-primary hover:text-white transition-all shadow-lg"
                                    >
                                        <Maximize2 size={18} />
                                    </button>
                                    {canEdit && (
                                        <button 
                                            onClick={() => removeImage(idx)}
                                            className="p-3 bg-white text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </Reorder.Item>
                        ))}
                    </AnimatePresence>

                    {/* Add Placeholder */}
                    {canEdit && (
                        <button 
                            onClick={handleUploadClick}
                            className="aspect-[4/5] border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 hover:bg-gray-50 hover:border-primary/30 transition-all group"
                        >
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                                <Plus size={32} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Add Image</span>
                        </button>
                    )}
                </Reorder.Group>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                />

                {images.length === 0 && (
                    <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                        <ImageIcon size={60} className="text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-gray-900 mb-2">No Gallery Images</h3>
                        <p className="text-gray-500 font-medium">Start uploading photos of your work to attract more customers.</p>
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-10"
                        onClick={() => setPreviewImage(null)}
                    >
                        <button className="absolute top-10 right-10 p-4 text-white hover:text-primary transition-colors">
                            <X size={40} />
                        </button>
                        <motion.img 
                            initial={{ scale: 0.9 }} 
                            animate={{ scale: 1 }} 
                            src={previewImage} 
                            className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl" 
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </OwnerLayout>
    );
};

export default OwnerGallery;

import React, { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadImage } from '../../../services/api';

const EditModal = ({ isOpen, onClose, boutique, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    rating: '',
    experienceYears: '',
    logo: '',
    servicesOffered: '',
  });

  useEffect(() => {
    if (boutique) {
      setFormData({
        name: boutique.name || '',
        city: boutique.city || '',
        rating: boutique.rating ?? '',
        experienceYears: boutique.experienceYears || '',
        logo: boutique.media?.logo || boutique.logo || '',
        servicesOffered: boutique.servicesOffered?.join(', ') || '',
      });
    }
  }, [boutique]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const data = await uploadImage(file, 'logo');
      console.log('Uploaded URL:', data.url);
      setFormData((prev) => ({ ...prev, logo: data.url || '' }));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || 'Logo upload failed');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploadingLogo) return;
    setLoading(true);
    try {
      const galleryList = Array.isArray(boutique?.galleryImages) ? boutique.galleryImages : [];
      const mediaGallery =
        Array.isArray(boutique?.media?.gallery) && boutique.media.gallery.length
          ? boutique.media.gallery
          : galleryList;

      const dataToSubmit = {
        ...formData,
        servicesOffered: typeof formData.servicesOffered === 'string' 
          ? formData.servicesOffered.split(',').map((tag) => tag.trim()).filter(t => t)
          : formData.servicesOffered,
        media: {
          logo: formData.logo || '',
          coverImage: boutique?.media?.coverImage || boutique?.coverImage || '',
          gallery: mediaGallery,
        },
      };
      await onUpdate(boutique.id, dataToSubmit);
      onClose();
    } catch (err) {
      console.error(err);
      alert('❌ Error updating boutique');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl relative z-10 overflow-hidden"
          >
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">Edit Boutique Entity</h3>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Name</label>
                  <input
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">City</label>
                  <input
                    id="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Rating</label>
                  <input
                    id="rating"
                    value={formData.rating}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Experience</label>
                  <input
                    id="experienceYears"
                    value={formData.experienceYears}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Logo (upload)</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={uploadingLogo}
                  onChange={handleLogoUpload}
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 transition-all font-bold disabled:opacity-50"
                />
                {uploadingLogo ? (
                  <p className="text-xs font-bold text-primary">Uploading…</p>
                ) : null}
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo preview" className="w-24 h-24 object-cover rounded-2xl border border-gray-100 mt-2" />
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Services (comma separated)</label>
                <input
                  id="servicesOffered"
                  value={formData.servicesOffered}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 transition-all font-bold"
                />
              </div>

              <div className="pt-4 flex space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingLogo}
                  className="flex-[2] py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center space-x-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> <span>Save Changes</span></>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditModal;

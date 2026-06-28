import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadImage } from '../../../services/api';

const BoutiqueEditModal = ({ isOpen, onClose, boutique, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    experienceYears: '',
    startingPrice: '',
    mobileNumber: '',
    whatsappNumber: '',
    email: '',
    fullAddress: '',
    area: '',
    city: '',
    state: '',
    pincode: '',
    googleMapsLink: '',
    serviceRadius: '',
    openDays: '',
    openingTime: '',
    closingTime: '',
    weeklyHoliday: '',
    turnaroundTime: '',
    servicesOffered: '',
    workTypeSpecialty: '',
    instagramHandle: '',
    facebookPage: '',
    websiteLink: '',
    logo: '',
    coverImage: '',
    internalNotes: '',
    pickupAvailable: false,
    deliveryAvailable: false,
    homeVisitAvailable: false,
    appointmentBookingAvailable: false,
    rushOrderAvailable: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState('');

  useEffect(() => {
    if (!boutique || !isOpen) return;
    setFormData({
      name: boutique.name || '',
      description: boutique.description || '',
      experienceYears: boutique.experienceYears || '',
      startingPrice: boutique.startingPrice || '',
      mobileNumber: boutique.mobileNumber || '',
      whatsappNumber: boutique.whatsappNumber || '',
      email: boutique.email || '',
      fullAddress: boutique.fullAddress || '',
      area: boutique.area || '',
      city: boutique.city || '',
      state: boutique.state || '',
      pincode: boutique.pincode || '',
      googleMapsLink: boutique.googleMapsLink || '',
      serviceRadius: boutique.serviceRadius || '',
      openDays: boutique.openDays || '',
      openingTime: boutique.openingTime || '',
      closingTime: boutique.closingTime || '',
      weeklyHoliday: boutique.weeklyHoliday || '',
      turnaroundTime: boutique.turnaroundTime || '',
      servicesOffered: boutique.servicesOffered?.join(', ') || '',
      workTypeSpecialty: boutique.workTypeSpecialty?.join(', ') || '',
      instagramHandle: boutique.instagramHandle || '',
      facebookPage: boutique.facebookPage || '',
      websiteLink: boutique.websiteLink || '',
      logo: boutique.media?.logo || '',
      coverImage: boutique.media?.coverImage || '',
      internalNotes: boutique.internalNotes || '',
      pickupAvailable: boutique.pickupAvailable || false,
      deliveryAvailable: boutique.deliveryAvailable || false,
      homeVisitAvailable: boutique.homeVisitAvailable || false,
      appointmentBookingAvailable: boutique.appointmentBookingAvailable || false,
      rushOrderAvailable: boutique.rushOrderAvailable || false,
    });
    setError('');
    setUploadingMedia('');
  }, [boutique, isOpen]);

  const handleMediaUpload = async (e, field, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setError('');
      setUploadingMedia(field);
      const data = await uploadImage(file, type);
      setFormData((prev) => ({ ...prev, [field]: data.url || '' }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Image upload failed');
    } finally {
      setUploadingMedia('');
      e.target.value = '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploadingMedia) {
      setError('Wait for the image upload to finish.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const mediaGallery = Array.isArray(boutique?.media?.gallery) ? boutique.media.gallery : [];

      const payload = {
        ...formData,
        __v: boutique?.__v,
        servicesOffered: formData.servicesOffered.split(',').map(s => s.trim()).filter(s => s !== ''),
        workTypeSpecialty: formData.workTypeSpecialty.split(',').map(s => s.trim()).filter(s => s !== ''),
        media: {
          logo: formData.logo || '',
          coverImage: formData.coverImage || '',
          gallery: mediaGallery,
        },
      };

      // Remove legacy fields from payload if they somehow leaked in from formData
      delete payload.logo;
      delete payload.coverImage;
      delete payload.galleryImages;

      await onUpdate(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update boutique details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const InputField = ({ label, name, type = "text", placeholder }) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
      />
    </div>
  );

  const CheckboxField = ({ label, name }) => (
    <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-all">
      <input
        type="checkbox"
        name={name}
        checked={formData[name]}
        onChange={handleChange}
        className="w-5 h-5 rounded-lg border-gray-300 text-primary focus:ring-primary"
      />
      <span className="text-xs font-black uppercase tracking-widest text-gray-700">{label}</span>
    </label>
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative z-10 flex flex-col"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-20">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Edit Boutique Profile</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage all business details</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={24} className="text-gray-400" />
            </button>
          </div>

          {/* Form Content */}
          <form id="edit-boutique-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-3 text-red-600">
                <AlertCircle size={20} />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}

            {/* Basic Info */}
            <section className="space-y-6">
              <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] flex items-center">
                <span className="w-8 h-[2px] bg-primary/20 mr-3"></span> Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Boutique Name" name="name" required />
                <InputField label="Experience Years" name="experienceYears" />
                <InputField label="Starting Price" name="startingPrice" placeholder="e.g. 500" />
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Location & Contact */}
            <section className="space-y-6">
              <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] flex items-center">
                <span className="w-8 h-[2px] bg-primary/20 mr-3"></span> Location & Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Mobile Number" name="mobileNumber" required />
                <InputField label="WhatsApp Number" name="whatsappNumber" />
                <InputField label="Email Address" name="email" type="email" required />
                <InputField label="Area" name="area" />
                <InputField label="City" name="city" required />
                <InputField label="State" name="state" required />
                <InputField label="Pincode" name="pincode" />
                <InputField label="Service Radius" name="serviceRadius" placeholder="e.g. 10km" />
                <div className="md:col-span-2">
                  <InputField label="Google Maps Link" name="googleMapsLink" />
                </div>
                <div className="md:col-span-2">
                  <InputField label="Full Address" name="fullAddress" required />
                </div>
              </div>
            </section>

            {/* Business Hours */}
            <section className="space-y-6">
              <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] flex items-center">
                <span className="w-8 h-[2px] bg-primary/20 mr-3"></span> Business Operations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <InputField label="Open Days" name="openDays" placeholder="Mon, Tue, Wed..." />
                </div>
                <InputField label="Weekly Holiday" name="weeklyHoliday" />
                <InputField label="Opening Time" name="openingTime" placeholder="9:00 AM" />
                <InputField label="Closing Time" name="closingTime" placeholder="8:00 PM" />
                <InputField label="Turnaround Time" name="turnaroundTime" placeholder="e.g. 3-5 days" />
              </div>
            </section>

            {/* Services & Specialities */}
            <section className="space-y-6">
              <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] flex items-center">
                <span className="w-8 h-[2px] bg-primary/20 mr-3"></span> Services & Specialities
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Services Offered (comma separated)</label>
                  <textarea
                    name="servicesOffered"
                    value={formData.servicesOffered}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Work Specialities (comma separated)</label>
                  <textarea
                    name="workTypeSpecialty"
                    value={formData.workTypeSpecialty}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-2">
                <CheckboxField label="Pickup" name="pickupAvailable" />
                <CheckboxField label="Delivery" name="deliveryAvailable" />
                <CheckboxField label="Home Visit" name="homeVisitAvailable" />
                <CheckboxField label="Appointment" name="appointmentBookingAvailable" />
                <CheckboxField label="Rush Orders" name="rushOrderAvailable" />
              </div>
            </section>

            {/* Media & Social */}
            <section className="space-y-6">
              <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] flex items-center">
                <span className="w-8 h-[2px] bg-primary/20 mr-3"></span> Media & Social Links
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Logo (upload)</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={!!uploadingMedia}
                    onChange={(e) => handleMediaUpload(e, 'logo', 'logo')}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold disabled:opacity-50"
                  />
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo" className="w-full h-32 object-contain rounded-2xl border border-gray-100 bg-white mt-2" />
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cover (upload)</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={!!uploadingMedia}
                    onChange={(e) => handleMediaUpload(e, 'coverImage', 'cover')}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold disabled:opacity-50"
                  />
                  {formData.coverImage ? (
                    <img src={formData.coverImage} alt="Cover" className="w-full h-32 object-cover rounded-2xl border border-gray-100 mt-2" />
                  ) : null}
                </div>
                {uploadingMedia ? (
                  <div className="md:col-span-2 flex items-center gap-2 text-sm font-bold text-primary">
                    <Loader2 className="animate-spin" size={18} /> Uploading {uploadingMedia}…
                  </div>
                ) : null}
                <InputField label="Instagram Handle" name="instagramHandle" />
                <InputField label="Facebook Page URL" name="facebookPage" />
                <div className="md:col-span-2">
                  <InputField label="Website Link" name="websiteLink" />
                </div>
              </div>
            </section>

            {/* Admin Info */}
            <section className="space-y-6">
              <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] flex items-center">
                <span className="w-8 h-[2px] bg-primary/20 mr-3"></span> Admin Notes
              </h3>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Internal Notes (Admin Only)</label>
                <textarea
                  name="internalNotes"
                  value={formData.internalNotes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </section>
          </form>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end space-x-4 sticky bottom-0 z-20">
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              form="edit-boutique-form"
              disabled={loading || !!uploadingMedia}
              className="px-8 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-600 transition-all shadow-lg shadow-primary/20 flex items-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <><Save size={18} /> <span>Save Changes</span></>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BoutiqueEditModal;

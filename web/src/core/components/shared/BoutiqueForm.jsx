import React, { useState } from 'react';
import { Loader2, Store, User, MapPin, Clock, Briefcase, Truck, DollarSign, Image as ImageIcon, Shield, Key, ChevronDown, ChevronUp } from 'lucide-react';
import { uploadImage } from '../../../services/api';

// ── Reusable sub-components ──────────────────────────────────────────────────

const Input = ({ label, id, value, onChange, required, placeholder, type = "text" }) => (
  <div className="space-y-2">
    <label htmlFor={id} className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <input
      id={id}
      type={type}
      required={required}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 md:px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 transition-all font-bold outline-none text-sm min-h-[48px]"
    />
  </div>
);

const Toggle = ({ label, id, checked, onChange }) => (
  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors min-h-[56px]">
    <span className="text-sm font-bold text-gray-700">{label}</span>
    <div className={`w-12 h-6 rounded-full p-1 transition-colors flex-shrink-0 ${checked ? 'bg-primary' : 'bg-gray-300'}`}>
      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </div>
    <input type="checkbox" id={id} checked={checked} onChange={onChange} className="hidden" />
  </label>
);

// Accordion section — collapses on mobile, always open on desktop
const AccordionSection = ({ title, icon: Icon, children, defaultOpen = false, accent = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-2xl border overflow-hidden ${accent ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100 bg-white'}`}>
      {/* Header (clickable on mobile, static label on desktop) */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between p-4 md:p-6 md:cursor-default transition-colors
          ${accent ? 'hover:bg-amber-50' : 'hover:bg-gray-50'} md:hover:bg-transparent`}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl ${accent ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>
            <Icon size={18} />
          </div>
          <h4 className={`text-sm md:text-base font-black tracking-wide uppercase ${accent ? 'text-amber-800' : 'text-gray-900'}`}>
            {title}
          </h4>
        </div>
        <span className="md:hidden text-gray-400">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {/* Content — always visible on desktop via CSS */}
      <div className={`px-4 pb-4 md:px-6 md:pb-6 md:block ${open ? 'block' : 'hidden'}`}>
        {children}
      </div>
    </div>
  );
};

// ── Main Form Component ───────────────────────────────────────────────────────

const BoutiqueForm = ({ onBoutiqueAdded }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingField, setUploadingField] = useState('');

  const [formData, setFormData] = useState({
    // 1. BASIC
    name: '', ownerName: '', description: '', experienceYears: '', status: 'Active', featuredBoutique: false,
    // 2. CONTACT
    mobileNumber: '', whatsappNumber: '', email: '',
    // 3. LOCATION
    fullAddress: '', area: '', city: '', state: '', pincode: '', googleMapsLink: '', serviceRadius: '',
    // 4. HOURS
    openDays: [], openingTime: '11:00 AM', closingTime: '08:00 PM', weeklyHoliday: 'Sunday',
    // 5. SERVICES
    servicesOffered: '', workTypeSpecialty: '',
    // 6. FEATURES
    pickupAvailable: false, deliveryAvailable: false, homeVisitAvailable: false,
    appointmentBookingAvailable: false, rushOrderAvailable: false,
    // 7. PRICING
    startingPrice: '', turnaroundTime: '3-5 Days',
    // 8. MEDIA (S3 URLs only — set via file upload)
    logo: '', coverImage: '', galleryImages: [], instagramHandle: '', facebookPage: '', websiteLink: '',
    // 9. ADMIN
    verificationDocuments: '', payoutDetails: '', internalNotes: '',
    // 10. CREDENTIALS
    ownerUsername: '', ownerEmail: '', ownerMobile: '', ownerPassword: ''
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      openDays: prev.openDays.includes(day)
        ? prev.openDays.filter(d => d !== day)
        : [...prev.openDays, day]
    }));
  };

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploadingField) {
      setError('Please wait for the current image upload to finish.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid boutique email address.'); return;
    }
    if (!phoneRegex.test(formData.mobileNumber)) {
      setError('Boutique mobile number must be 10 digits starting with 6-9.'); return;
    }
    if (formData.whatsappNumber && !phoneRegex.test(formData.whatsappNumber)) {
      setError('WhatsApp number must be 10 digits starting with 6-9.'); return;
    }

    const hasOwnerDetails = formData.ownerUsername || formData.ownerEmail || formData.ownerMobile || formData.ownerPassword;
    if (hasOwnerDetails) {
      if (!formData.ownerUsername) { setError('Please enter the owner username.'); return; }
      if (!emailRegex.test(formData.ownerEmail)) { setError('Please enter a valid owner email address.'); return; }
      if (!phoneRegex.test(formData.ownerMobile)) { setError('Owner mobile number must be 10 digits starting with 6-9.'); return; }
      if (formData.ownerPassword.length < 6) { setError('Owner password must be at least 6 characters.'); return; }
    }

    if (formData.openDays.length === 0) {
      setError('Please select at least one operational day.'); return;
    }

    setLoading(true);
    const parseArray = (str) => typeof str === 'string' ? str.split(',').map(s => s.trim()).filter(Boolean) : str;
    const galleryList = Array.isArray(formData.galleryImages) ? formData.galleryImages : [];

    const payload = {
      name: formData.name, ownerName: formData.ownerName, description: formData.description,
      experienceYears: formData.experienceYears, status: formData.status, featuredBoutique: formData.featuredBoutique,
      mobileNumber: formData.mobileNumber, whatsappNumber: formData.whatsappNumber, email: formData.email,
      fullAddress: formData.fullAddress, area: formData.area, city: formData.city, state: formData.state,
      pincode: formData.pincode, googleMapsLink: formData.googleMapsLink, serviceRadius: formData.serviceRadius,
      openDays: formData.openDays.join(', '), openingTime: formData.openingTime, closingTime: formData.closingTime,
      weeklyHoliday: formData.weeklyHoliday, servicesOffered: parseArray(formData.servicesOffered),
      workTypeSpecialty: parseArray(formData.workTypeSpecialty), pickupAvailable: formData.pickupAvailable,
      deliveryAvailable: formData.deliveryAvailable, homeVisitAvailable: formData.homeVisitAvailable,
      appointmentBookingAvailable: formData.appointmentBookingAvailable, rushOrderAvailable: formData.rushOrderAvailable,
      startingPrice: formData.startingPrice, turnaroundTime: formData.turnaroundTime,
      media: {
        logo: formData.logo || '',
        coverImage: formData.coverImage || '',
        gallery: galleryList
      },
      instagramHandle: formData.instagramHandle, facebookPage: formData.facebookPage, websiteLink: formData.websiteLink,
      verificationDocuments: parseArray(formData.verificationDocuments), payoutDetails: formData.payoutDetails,
      internalNotes: formData.internalNotes,
      ...(hasOwnerDetails && {
        ownerDetails: {
          username: formData.ownerUsername, email: formData.ownerEmail,
          mobileNumber: formData.ownerMobile, password: formData.ownerPassword
        }
      })
    };

    try {
      await onBoutiqueAdded(payload);
      setError('');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create boutique.';
      setError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleSingleImageUpload = async (e, field, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      setUploadingField(field);
      const result = await uploadImage(file, type);
      setFormData(prev => ({ ...prev, [field]: result.url || '' }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Image upload failed.');
    } finally {
      setUploadingField('');
      e.target.value = '';
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      setError('');
      setUploadingField('galleryImages');
      const uploadedUrls = [];
      for (const file of files) {
        const result = await uploadImage(file, 'gallery');
        if (result?.url) uploadedUrls.push(result.url);
      }

      setFormData(prev => ({
        ...prev,
        galleryImages: [...(Array.isArray(prev.galleryImages) ? prev.galleryImages : []), ...uploadedUrls]
      }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Gallery upload failed.');
    } finally {
      setUploadingField('');
      e.target.value = '';
    }
  };

  const removeGalleryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      galleryImages: (Array.isArray(prev.galleryImages) ? prev.galleryImages : []).filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-card border border-gray-50 overflow-hidden">
      {/* Form Header */}
      <div className="px-4 py-5 md:p-10 border-b border-gray-100">
        <h3 className="text-lg md:text-2xl font-black text-gray-900 tracking-tight">Register Complete Boutique Entity</h3>
        <p className="text-gray-500 font-medium mt-1 text-sm">Fill in the details to onboard a new boutique.</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 md:mx-10 mt-4 bg-red-50 text-red-600 p-4 rounded-2xl font-bold border border-red-100 text-sm">
          {error}
        </div>
      )}

      {/* Form — pb-28 leaves room for the sticky submit button on mobile */}
      <form id="boutique-form" onSubmit={handleSubmit} className="px-4 py-4 md:p-10 space-y-4 pb-28 md:pb-4">

        {/* 1. Basic Information */}
        <AccordionSection title="1. Basic Information" icon={Store} defaultOpen={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Input id="name" label="Boutique Name" value={formData.name} onChange={handleChange} required placeholder="e.g. Sri Boutique" />
            <Input id="ownerName" label="Owner Name" value={formData.ownerName} onChange={handleChange} required placeholder="e.g. Ayesha" />
            <div className="md:col-span-2">
              <Input id="description" label="Boutique Description" value={formData.description} onChange={handleChange} placeholder="Bridal and custom blouse specialist..." />
            </div>
            <Input id="experienceYears" label="Experience (Years)" value={formData.experienceYears} onChange={handleChange} placeholder="e.g. 8+ Years" />
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</label>
              <select id="status" value={formData.status} onChange={handleChange} className="w-full px-4 md:px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 transition-all font-bold outline-none appearance-none text-sm min-h-[48px]">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Toggle id="featuredBoutique" label="Featured Boutique?" checked={formData.featuredBoutique} onChange={handleChange} />
            </div>
          </div>
        </AccordionSection>

        {/* 2. Contact Details */}
        <AccordionSection title="2. Contact Details" icon={User}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <Input id="mobileNumber" label="Mobile Number" value={formData.mobileNumber} onChange={handleChange} required placeholder="9876543210" />
            <Input id="whatsappNumber" label="WhatsApp Number" value={formData.whatsappNumber} onChange={handleChange} placeholder="9876543210" />
            <Input id="email" label="Email Address" type="email" value={formData.email} onChange={handleChange} required placeholder="sri@gmail.com" />
          </div>
        </AccordionSection>

        {/* 3. Location Details */}
        <AccordionSection title="3. Location Details" icon={MapPin}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="md:col-span-2">
              <Input id="fullAddress" label="Full Address" value={formData.fullAddress} onChange={handleChange} required placeholder="Shop No. 12, Banjara Hills..." />
            </div>
            <Input id="area" label="Area / Locality" value={formData.area} onChange={handleChange} placeholder="Banjara Hills" />
            <Input id="city" label="City" value={formData.city} onChange={handleChange} required placeholder="Hyderabad" />
            <Input id="state" label="State" value={formData.state} onChange={handleChange} required placeholder="Telangana" />
            <Input id="pincode" label="Pincode" value={formData.pincode} onChange={handleChange} placeholder="500034" />
            <Input id="googleMapsLink" label="Google Maps Link" value={formData.googleMapsLink} onChange={handleChange} placeholder="https://maps.google.com/..." />
            <Input id="serviceRadius" label="Service Radius" value={formData.serviceRadius} onChange={handleChange} placeholder="Within 10 km" />
          </div>
        </AccordionSection>

        {/* 4. Business Hours */}
        <AccordionSection title="4. Business Hours" icon={Clock}>
          <div className="space-y-5">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block">Operational Days *</label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    className={`px-3 md:px-4 py-2 rounded-xl text-xs font-bold transition-all border min-h-[40px] ${
                      formData.openDays.includes(day)
                        ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input id="openingTime" label="Opening Time" value={formData.openingTime} onChange={handleChange} placeholder="e.g. 10:00 AM" />
              <Input id="closingTime" label="Closing Time" value={formData.closingTime} onChange={handleChange} placeholder="e.g. 09:00 PM" />
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Weekly Holiday</label>
                <select id="weeklyHoliday" value={formData.weeklyHoliday} onChange={handleChange} className="w-full px-4 md:px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 font-bold outline-none appearance-none text-sm min-h-[48px]">
                  <option value="None">None</option>
                  {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* 5. Services & Specialities */}
        <AccordionSection title="5. Services & Specialities" icon={Briefcase}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Input id="servicesOffered" label="Services Offered (comma separated)" value={formData.servicesOffered} onChange={handleChange} placeholder="Custom blouse, bridal wear, sarees" />
            <Input id="workTypeSpecialty" label="Work Specialty (comma separated)" value={formData.workTypeSpecialty} onChange={handleChange} placeholder="Maggam work, hand embroidery" />
          </div>
        </AccordionSection>

        {/* 6. Features & Availability */}
        <AccordionSection title="6. Features & Availability" icon={Truck}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Toggle id="pickupAvailable" label="Pickup Available" checked={formData.pickupAvailable} onChange={handleChange} />
            <Toggle id="deliveryAvailable" label="Delivery Available" checked={formData.deliveryAvailable} onChange={handleChange} />
            <Toggle id="homeVisitAvailable" label="Tailor Home Visit" checked={formData.homeVisitAvailable} onChange={handleChange} />
            <Toggle id="appointmentBookingAvailable" label="Appointment Booking" checked={formData.appointmentBookingAvailable} onChange={handleChange} />
            <Toggle id="rushOrderAvailable" label="Rush Order Available" checked={formData.rushOrderAvailable} onChange={handleChange} />
          </div>
        </AccordionSection>

        {/* 7. Pricing & Delivery */}
        <AccordionSection title="7. Pricing & Delivery" icon={DollarSign}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Input id="startingPrice" label="Starting Price" value={formData.startingPrice} onChange={handleChange} placeholder="₹999" />
            <Input id="turnaroundTime" label="Turnaround Time" value={formData.turnaroundTime} onChange={handleChange} placeholder="3 days" />
          </div>
        </AccordionSection>

        {/* 8. Media & Social */}
        <AccordionSection title="8. Media & Social" icon={ImageIcon}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Logo (upload)</label>
              <input type="file" accept="image/png,image/jpeg,image/webp" disabled={!!uploadingField} onChange={(e) => handleSingleImageUpload(e, 'logo', 'logo')} className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm disabled:opacity-50" />
              {formData.logo ? (
                <div className="mt-2 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 max-h-40">
                  <img src={formData.logo} alt="Logo preview" className="w-full h-36 object-contain bg-white" />
                </div>
              ) : (
                <p className="text-[10px] text-gray-400 font-medium">No logo uploaded yet.</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Cover image (upload)</label>
              <input type="file" accept="image/png,image/jpeg,image/webp" disabled={!!uploadingField} onChange={(e) => handleSingleImageUpload(e, 'coverImage', 'cover')} className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm disabled:opacity-50" />
              {formData.coverImage ? (
                <div className="mt-2 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 max-h-40">
                  <img src={formData.coverImage} alt="Cover preview" className="w-full h-36 object-cover" />
                </div>
              ) : (
                <p className="text-[10px] text-gray-400 font-medium">No cover uploaded yet.</p>
              )}
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Gallery (upload multiple)</label>
              <input type="file" multiple accept="image/png,image/jpeg,image/webp" disabled={!!uploadingField} onChange={handleGalleryUpload} className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm disabled:opacity-50" />
              {Array.isArray(formData.galleryImages) && formData.galleryImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                  {formData.galleryImages.map((url, idx) => (
                    <div key={`${url}-${idx}`} className="relative group rounded-xl overflow-hidden border border-gray-100 bg-gray-50 aspect-square">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        disabled={!!uploadingField}
                        className="absolute top-1 right-1 px-2 py-1 bg-red-500 text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-gray-400 font-medium">No gallery images yet.</p>
              )}
            </div>
            {uploadingField && (
              <div className="md:col-span-2 text-sm text-primary font-bold">Uploading {uploadingField}...</div>
            )}
            <Input id="instagramHandle" label="Instagram Handle" value={formData.instagramHandle} onChange={handleChange} placeholder="@sri_boutique" />
            <Input id="facebookPage" label="Facebook Page" value={formData.facebookPage} onChange={handleChange} placeholder="facebook.com/sriboutique" />
            <Input id="websiteLink" label="Website Link" value={formData.websiteLink} onChange={handleChange} placeholder="www.sriboutique.in" />
          </div>
        </AccordionSection>

        {/* 9. Admin & Verification */}
        <AccordionSection title="9. Admin & Verification" icon={Shield}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Input id="verificationDocuments" label="Docs Links (comma separated)" value={formData.verificationDocuments} onChange={handleChange} placeholder="ID proof link, GST link" />
            <Input id="payoutDetails" label="Payout Details" value={formData.payoutDetails} onChange={handleChange} placeholder="Bank account / UPI" />
            <div className="md:col-span-2">
              <Input id="internalNotes" label="Internal Notes" value={formData.internalNotes} onChange={handleChange} placeholder="Uses only silk fabric..." />
            </div>
          </div>
        </AccordionSection>

        {/* 10. Owner Login Credentials */}
        <AccordionSection title="10. Owner Login Credentials" icon={Key} accent={true} defaultOpen={true}>
          <p className="text-amber-700 font-medium mb-4 text-sm">
            Create the login details for the owner. They can use these <strong>immediately</strong> to log into the Owner Portal.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Input id="ownerUsername" label="Username" value={formData.ownerUsername} onChange={handleChange} placeholder="sri_boutique_owner" />
            <Input id="ownerEmail" label="Owner Email" type="email" value={formData.ownerEmail} onChange={handleChange} placeholder="owner@gmail.com" />
            <Input id="ownerMobile" label="Owner Mobile" value={formData.ownerMobile} onChange={handleChange} placeholder="9876543210" />
            <Input id="ownerPassword" label="Password" type="password" value={formData.ownerPassword} onChange={handleChange} placeholder="••••••••" />
          </div>
        </AccordionSection>

        {/* Submit button — desktop inline */}
        <div className="hidden md:block pt-6">
          <button
            type="submit"
            disabled={loading || !!uploadingField}
            className="w-full bg-primary hover:bg-primary-dark text-white text-base font-black py-5 px-6 rounded-2xl transition-all shadow-xl shadow-primary/30 flex items-center justify-center disabled:opacity-50 min-h-[56px]"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : 'Register Boutique & Create Owner Account'}
          </button>
        </div>
      </form>

      {/* Sticky Submit — mobile only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3 z-40 shadow-2xl">
        <button
          type="submit"
          form="boutique-form"
          disabled={loading || !!uploadingField}
          onClick={handleSubmit}
          className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/30 flex items-center justify-center disabled:opacity-50 min-h-[52px] text-sm"
        >
          {loading ? <Loader2 className="animate-spin" size={22} /> : 'Register Boutique & Create Owner Account'}
        </button>
      </div>
    </div>
  );
};

export default BoutiqueForm;

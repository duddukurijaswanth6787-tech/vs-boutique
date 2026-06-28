import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, Phone, Mail, Award, Clock, Star, Calendar, ArrowLeft, 
  Send, Sparkles, X, CheckCircle, MessageCircle, Navigation, Eye 
} from 'lucide-react';
import { api } from '@core/services';
import PremiumImage from '@core/components/ui/PremiumImage';
import { IMAGES } from '@core/services';
import Button from '@core/components/ui/Button';
import IconButton from '@core/components/ui/IconButton';
import Card from '@core/components/ui/Card';
import Modal from '@core/components/ui/Modal';
import BottomSheet from '@core/components/ui/BottomSheet';
import Input from '@core/components/ui/Input';
import Textarea from '@core/components/ui/Textarea';
import Select from '@core/components/ui/Select';
import CustomerLayout from '../../../../components/CustomerLayout';

export default function CustomerBoutiqueDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [boutique, setBoutique] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Lightbox & Mobile Form Drawer State
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [isMobileBookDrawerOpen, setIsMobileBookDrawerOpen] = useState(false);
  
  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    mobileNumber: '',
    selectedService: '',
    preferredDate: '',
    preferredTime: '',
    notes: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const fetchBoutiqueDetails = async () => {
    try {
      const response = await api.get(`/boutiques/public/${id}`);
      setBoutique(response.data);
      if (response.data?.features?.services?.length > 0) {
        setBookingForm(f => ({ ...f, selectedService: response.data.features.services[0] }));
      }
    } catch (err) {
      console.error(err);
      setError('Boutique details could not be found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoutiqueDetails();
  }, [id]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError('');
    setBookingSuccess(false);

    try {
      await api.post('/bookings', {
        boutiqueId: id,
        customerName: bookingForm.customerName,
        customerMobile: bookingForm.mobileNumber,
        bookingDate: bookingForm.preferredDate,
        bookingTime: bookingForm.preferredTime,
        notes: bookingForm.notes 
          ? `${bookingForm.notes} (Service: ${bookingForm.selectedService})` 
          : `Service: ${bookingForm.selectedService}`
      });
      setBookingSuccess(true);
      setBookingForm({
        customerName: '',
        mobileNumber: '',
        selectedService: boutique?.features?.services?.[0] || '',
        preferredDate: '',
        preferredTime: '',
        notes: ''
      });
      // Delay closing mobile drawer
      if (isMobileBookDrawerOpen) {
        setTimeout(() => setIsMobileBookDrawerOpen(false), 2500);
      }
    } catch (err) {
      console.error(err);
      setBookingError(err.response?.data?.message || 'Failed to submit booking. Please check details and try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff8f2]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#c89b3c] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (error || !boutique) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fff8f2] p-6 text-center space-y-6">
        <h2 className="text-3xl font-serif font-black text-gray-900">Boutique Not Found</h2>
        <p className="text-gray-500 max-w-md">{error || 'This boutique is not available or has been deactivated.'}</p>
        <Button onClick={() => navigate('/')}>
          Back to Directory
        </Button>
      </div>
    );
  }

  const coverImg = boutique.media?.coverImage || IMAGES.boutiques.interior;
  const logoImg = boutique.media?.logo || IMAGES.placeholder;

  const serviceOptions = boutique.features?.services?.length > 0
    ? boutique.features.services.map(s => ({ value: s, label: s }))
    : [{ value: 'General Tailoring', label: 'General Tailoring' }];

  const BookingFormContent = () => (
    <div className="space-y-5">
      {bookingSuccess ? (
        <div className="text-center py-6 space-y-4 animate-fadeIn">
          <CheckCircle className="text-emerald-500 w-16 h-16 mx-auto" />
          <h4 className="text-xl font-serif font-bold text-[#1f1b14]">Booking Requested!</h4>
          <p className="text-gray-500 text-xs font-semibold leading-relaxed">
            The boutique has received your request and will contact you shortly to confirm the appointment slot.
          </p>
          <Button
            onClick={() => setBookingSuccess(false)}
            className="w-full mt-4"
          >
            Request Another Slot
          </Button>
        </div>
      ) : (
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          {bookingError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold text-center border border-red-100">
              {bookingError}
            </div>
          )}

          <Input
            label="Your Name"
            type="text"
            required
            placeholder="Enter full name"
            value={bookingForm.customerName}
            onChange={(e) => setBookingForm(f => ({ ...f, customerName: e.target.value }))}
          />

          <Input
            label="Mobile Number"
            type="tel"
            required
            pattern="^[0-9]{10}$"
            placeholder="10-digit mobile number"
            value={bookingForm.mobileNumber}
            onChange={(e) => setBookingForm(f => ({ ...f, mobileNumber: e.target.value }))}
          />

          <Select
            label="Select Service"
            value={bookingForm.selectedService}
            onChange={(e) => setBookingForm(f => ({ ...f, selectedService: e.target.value }))}
            options={serviceOptions}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Preferred Date"
              type="date"
              required
              value={bookingForm.preferredDate}
              onChange={(e) => setBookingForm(f => ({ ...f, preferredDate: e.target.value }))}
            />
            <Input
              label="Preferred Time"
              type="time"
              required
              value={bookingForm.preferredTime}
              onChange={(e) => setBookingForm(f => ({ ...f, preferredTime: e.target.value }))}
            />
          </div>

          <Textarea
            label="Special Requests"
            rows={2}
            placeholder="Any specific style requirements..."
            value={bookingForm.notes}
            onChange={(e) => setBookingForm(f => ({ ...f, notes: e.target.value }))}
          />

          <Button
            type="submit"
            isLoading={bookingLoading}
            className="w-full mt-4"
          >
            <Calendar size={15} className="mr-2" /> Request Appointment
          </Button>
        </form>
      )}
    </div>
  );

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-[#fff8f2] font-sans text-[#1f1b14] pb-24 md:pb-16 antialiased">
      {/* Premium Hero Parallax Background */}
      <div className="relative h-[360px] md:h-[480px] w-full bg-gray-200 overflow-hidden">
        <PremiumImage src={coverImg} alt={boutique.name} productName="boutique cover" aspectRatio="absolute inset-0" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        
        {/* Elegant Back button */}
        <Button
          onClick={() => navigate('/')}
          variant="secondary"
          className="absolute top-6 left-6 bg-white/95 text-gray-900 border border-[#d2c5b1]/20 shadow-md"
        >
          <ArrowLeft size={14} className="mr-2" /> Back to Directory
        </Button>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 relative -mt-20 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Boutique identity & designs catalog */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Boutique details Identity Card */}
            <Card className="p-8 flex flex-col md:flex-row items-center md:items-start md:space-x-8 text-center md:text-left relative">
              <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-white -mt-20 md:-mt-24 mb-6 md:mb-0 flex-shrink-0 relative">
                <PremiumImage src={logoImg} alt={boutique.name} productName="boutique logo" aspectRatio="absolute inset-0" className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <h1 className="text-3xl font-serif font-black text-[#1f1b14] tracking-tight">{boutique.name}</h1>
                    <span className="material-symbols-outlined text-[#c89b3c]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                  <div className="flex items-center justify-center space-x-1.5 bg-[#c89b3c]/5 border border-[#c89b3c]/10 px-3 py-1.5 rounded-xl text-[#c89b3c] font-black text-xs self-center md:self-start">
                    <Star size={14} className="fill-current" />
                    <span>{boutique.stats?.rating || '4.5'} ({boutique.stats?.reviewsCount || 0} reviews)</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <span className="flex items-center">
                    <MapPin size={14} className="text-[#c89b3c] mr-1" />
                    {boutique.location?.displayLocation || 'Hyderabad'}
                  </span>
                  <span className="flex items-center">
                    <Award size={14} className="text-[#c89b3c] mr-1" />
                    {boutique.experience?.label || '3+ Years Exp'}
                  </span>
                  <span className="flex items-center">
                    <Clock size={14} className="text-[#c89b3c] mr-1" />
                    Turnaround: {boutique.business?.turnaroundTime || '3-5 Days'}
                  </span>
                </div>

                <p className="text-gray-500 text-sm leading-relaxed pt-2">
                  {boutique.description || 'Welcome to our premium boutique! We specialize in crafting tailor-made clothing customized to your fit.'}
                </p>

                {/* Direct buttons */}
                <div className="flex flex-wrap gap-3 pt-2 justify-center md:justify-start">
                  {boutique.contact?.mobile && (
                    <>
                      <a 
                        href={`tel:${boutique.contact.mobile}`}
                        className="inline-flex items-center space-x-2 px-5 py-2.5 border-[1.5px] border-[#1f1b14] rounded-xl font-bold text-xs text-[#1f1b14] hover:bg-gray-50 transition-colors"
                      >
                        <Phone size={14} />
                        <span>Call</span>
                      </a>
                      <a 
                        href={`https://wa.me/91${boutique.contact.mobile}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#25D366] text-white rounded-xl font-bold text-xs shadow-sm hover:opacity-90 transition-opacity"
                      >
                        <MessageCircle size={14} />
                        <span>WhatsApp</span>
                      </a>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Curated Catalog (Bento Layout) */}
            <Card className="p-8 space-y-6">
              <div className="border-b border-[#d2c5b1]/10 pb-4">
                <h2 className="text-2xl font-serif font-black tracking-tight text-[#1f1b14] flex items-center space-x-2">
                  <Sparkles className="text-[#c89b3c]" size={22} />
                  <span>Curated Lookbook</span>
                </h2>
                <p className="text-xs font-medium text-gray-400 mt-1">Click a design card to view high-resolution details.</p>
              </div>
              
              {!boutique.designs || boutique.designs.length === 0 ? (
                <div className="text-center py-12 text-gray-400 font-medium text-sm uppercase tracking-widest">
                  No catalog items uploaded yet. Contact designer for custom lookbooks.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {boutique.designs.map((design, index) => (
                    <Card
                      key={design.id}
                      onClick={() => setSelectedDesign(design)}
                      className={`group cursor-pointer p-0 relative rounded-2xl overflow-hidden bg-gray-50 flex flex-col hover:shadow-md ${
                        index === 0 ? 'col-span-2 row-span-2 min-h-[320px]' : 'h-[170px] md:h-[220px]'
                      }`}
                    >
                      <div className="w-full h-full relative overflow-hidden flex-1">
                        <PremiumImage
                          src={design.image}
                          alt={design.name}
                          productName={design.name}
                          category={design.category}
                          aspectRatio="absolute inset-0"
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-750"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="bg-white/95 backdrop-blur-sm text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-full shadow-md text-[#1f1b14] flex items-center space-x-1">
                            <Eye size={12} />
                            <span>Quick View</span>
                          </span>
                        </div>
                      </div>
                      <div className="p-4 bg-white border-t border-[#d2c5b1]/10 flex justify-between items-start">
                        <h4 className="font-bold text-xs text-[#1f1b14] truncate pr-2">{design.name}</h4>
                        <span className="text-xs font-black text-[#c89b3c]">₹{design.price}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {/* Specialties & Services */}
            <Card className="p-8 space-y-6">
              <h3 className="text-lg font-serif font-black text-[#1f1b14]">Expertise & Services Offered</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stitching Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {boutique.features?.services?.map((s) => (
                      <span key={s} className="px-3.5 py-2 bg-[#fff8f2] text-xs font-bold border border-[#d2c5b1]/30 rounded-xl text-gray-700">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Specialist Styles</h4>
                  <div className="flex flex-wrap gap-2">
                    {boutique.features?.specialties?.map((s) => (
                      <span key={s} className="px-3.5 py-2 bg-[#c89b3c]/5 text-xs font-bold border border-[#c89b3c]/15 rounded-xl text-[#c89b3c]">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

          </div>

          {/* RIGHT: Booking card & details (Desktop Sidebar) */}
          <div className="hidden lg:block space-y-8">
            {/* Sticky Form wrapper */}
            <div className="sticky top-24 space-y-8">
              
              {/* Consultation Form */}
              <Card className="p-8 relative overflow-hidden border-[#c89b3c]/20 shadow-premium">
                <div className="absolute top-0 right-0 bg-[#c89b3c]/5 p-4 rounded-bl-[2rem] text-[#c89b3c]">
                  <Calendar size={20} />
                </div>
                <h3 className="text-xl font-serif font-black text-[#1f1b14] mb-6">Book Consultation</h3>
                <BookingFormContent />
              </Card>

              {/* Direct Address details */}
              <Card className="p-8 space-y-6">
                <h3 className="text-lg font-serif font-black text-[#1f1b14]">Studio Location</h3>
                <div className="space-y-4">
                  {/* Digital Map Representation */}
                  <div className="h-40 rounded-xl overflow-hidden shadow-sm relative border border-[#d2c5b1]/20 bg-[#fff8f2]">
                    <PremiumImage 
                      src={IMAGES.boutiques.studio} 
                      alt="Map Location Placeholder" 
                      aspectRatio="absolute inset-0"
                      className="w-full h-full object-cover opacity-80" 
                    />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#c89b3c]/20 rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-3.5 h-3.5 bg-[#c89b3c] rounded-full border-2 border-white shadow-md"></div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 text-sm font-semibold text-gray-600">
                    <MapPin className="text-[#c89b3c] w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-[#1f1b14] leading-normal">{boutique.location?.address || 'Linking Road, Bandra West, Mumbai'}</p>
                      <p className="text-gray-400 text-xs">{boutique.location?.pincode}</p>
                    </div>
                  </div>
                  {boutique.contact?.email && (
                    <div className="flex items-center space-x-3 text-sm font-semibold text-gray-600 pt-3 border-t border-[#d2c5b1]/10">
                      <Mail className="text-[#c89b3c] w-5 h-5 flex-shrink-0" />
                      <span className="break-all">{boutique.contact.email}</span>
                    </div>
                  )}
                </div>
              </Card>

            </div>
          </div>

        </div>
      </div>

      {/* MOBILE ONLY: Bottom sticky CTA bar & drawer */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full z-40 bg-white border-t border-[#d2c5b1]/20 p-4 pb-safe flex items-center justify-between shadow-2xl">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Consultations</span>
          <span className="text-xs font-black text-[#c89b3c]">Booking Slots Available</span>
        </div>
        <Button
          onClick={() => setIsMobileBookDrawerOpen(true)}
          className="px-6 py-3.5 shadow-md shadow-[#c89b3c]/20"
        >
          <Calendar size={14} className="mr-2" /> Book Appointment
        </Button>
      </div>

      {/* Mobile Drawer (Slide-up Panel via BottomSheet) */}
      <BottomSheet
        isOpen={isMobileBookDrawerOpen}
        onClose={() => setIsMobileBookDrawerOpen(false)}
        title="Request Slot"
      >
        <BookingFormContent />
      </BottomSheet>

      {/* High-Resolution Design Lightbox Dialog */}
      <Modal
        isOpen={!!selectedDesign}
        onClose={() => setSelectedDesign(null)}
        title={selectedDesign?.name}
      >
        <div className="flex flex-col">
          <div className="w-full aspect-square bg-gray-100 overflow-hidden relative rounded-2xl">
            {selectedDesign && (
              <PremiumImage
                src={selectedDesign.image}
                alt={selectedDesign.name}
                productName={selectedDesign.name}
                aspectRatio="absolute inset-0"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="py-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-serif font-black text-[#1f1b14]">{selectedDesign?.name}</h3>
              <span className="text-lg font-black text-[#c89b3c]">₹{selectedDesign?.price}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest pt-2 border-t border-[#d2c5b1]/15">
              <span>Category</span>
              <span className="bg-[#c89b3c]/5 text-[#c89b3c] px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                {selectedDesign?.category || 'Specialty'}
              </span>
            </div>
          </div>
        </div>
      </Modal>
      </div>
    </CustomerLayout>
  );
}

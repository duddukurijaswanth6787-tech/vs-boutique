import React, { useState, useEffect } from 'react';
import { Mail, Phone, Clock, Search, HelpCircle, CheckCircle, ChevronDown, MessageSquare, AlertCircle, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import PremiumLegalPage from '../../../../core/components/shared/PremiumLegalPage';

// Standard FAQ Seed
const DEFAULT_FAQS = [
  {
    category: 'shipping',
    q: 'How long does delivery take?',
    a: 'Delivery to Metro cities takes 2-5 days, other cities take 4-8 days, and remote locations take 5-10 business days. Standard order processing is done within 24-48 business hours.'
  },
  {
    category: 'shipping',
    q: 'Do you charge for shipping?',
    a: 'We offer free shipping on all orders above ₹999. For orders below ₹999, a flat shipping fee of ₹99 is applicable at checkout.'
  },
  {
    category: 'returns',
    q: 'Can I return custom-tailored outfits?',
    a: 'Custom-tailored outfits are stitched specifically to your measurements. We do not accept standard returns on custom orders unless there is a clear fabric defect or craftsmanship error. Sizing alterations are fully covered in our 7-day exchange window.'
  },
  {
    category: 'returns',
    q: 'What is the refund processing window?',
    a: 'Once approved, refunds are credited to the original payment source within 7-10 business days. For cash-on-delivery orders, our support team will contact you to request bank transfer details.'
  },
  {
    category: 'payments',
    q: 'Which payment methods do you support?',
    a: 'We support all major payment modes including UPI (GPay, PhonePe, Paytm), Debit & Credit cards (Visa, MasterCard, RuPay), Net Banking across Indian banks, Wallets, and Cash on Delivery (COD) for orders under ₹10,000.'
  },
  {
    category: 'tailoring',
    q: 'How do I submit my tailoring measurements?',
    a: 'You can create a measurement profile on your profile dashboard. Alternatively, you can book a virtual master tailor consultation session directly from the Tailoring Services panel.'
  }
];

export default function SupportCenter() {
  // Policy Settings loaded dynamically
  const [settings, setSettings] = useState({
    businessHours: '9 AM - 6 PM, Mon-Sat',
    supportEmail: 'support@vsboutique.shop',
    supportPhone: '+91 90001 00020',
    whatsApp: '+91 90001 00020',
    companyAddress: 'Hyderabad, Telangana, India'
  });

  // Load backend configurations
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const backendUrl = (window as any).VITE_API_URL || (import.meta as any).env?.VITE_API_URL || '';
        const res = await axios.get(`${backendUrl}/api/v1/cms/policies/settings`);
        if (res.data && res.data.success && res.data.data) {
          setSettings(res.data.data);
        }
      } catch (err) {
        console.warn('Failed to load global policy settings, using defaults:', err);
      }
    };
    fetchSettings();
  }, []);

  // FAQ Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedFAQIndex, setExpandedFAQIndex] = useState<number | null>(null);

  const filteredFAQs = DEFAULT_FAQS.filter(faq => {
    const matchesSearch = faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Support Ticket Form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    orderId: '',
    message: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState<{ ticketNumber: string } | null>(null);

  // Ticket Lookup State
  const [lookupNumber, setLookupNumber] = useState('');
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }
    if (formData.phone.trim() && !/^\d{10}$/.test(formData.phone.trim())) {
      errors.phone = 'Phone must be exactly 10 digits';
    }
    if (!formData.subject.trim()) errors.subject = 'Subject is required';
    if (!formData.message.trim()) errors.message = 'Message is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const backendUrl = (window as any).VITE_API_URL || (import.meta as any).env?.VITE_API_URL || '';
      const res = await axios.post(`${backendUrl}/tickets/public`, formData);
      if (res.data && res.data.success && res.data.data) {
        setSuccessTicket(res.data.data);
        setFormData({ name: '', email: '', phone: '', subject: '', orderId: '', message: '' });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTicketLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupNumber.trim()) {
      setLookupError('Enter a ticket number');
      return;
    }

    setIsLookingUp(true);
    setLookupError('');
    setLookupResult(null);

    try {
      const backendUrl = (window as any).VITE_API_URL || (import.meta as any).env?.VITE_API_URL || '';
      // We search all tickets by ticket number. We will use a public ticket lookup endpoint.
      // Since tickets route by ID requires auth, let's create a public ticket check by ticketNumber.
      // Wait, we can implement lookup by sending request to `/tickets/public-status?ticketNumber=TKT-XXXXXX`
      const res = await axios.get(`${backendUrl}/tickets/public-status`, {
        params: { ticketNumber: lookupNumber.trim() }
      });
      if (res.data && res.data.success && res.data.data) {
        setLookupResult(res.data.data);
      } else {
        setLookupError('No ticket found with that number.');
      }
    } catch (err: any) {
      setLookupError(err.response?.data?.message || 'Ticket not found.');
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <PremiumLegalPage
      title="Support Center"
      lastUpdated=""
      seoTitle="Customer Support & FAQ | VS Boutique"
      seoDescription="Get help with your order, track shipments, request alterations, read FAQs, check ticket status, or submit a help inquiry at VS Boutique."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* LEFT 2 COLUMNS: FAQ & CONTACT FORM */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* FAQ Workspace */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif">Frequently Asked Questions</h3>
                <p className="text-sm text-gray-500">Quick answers to common questions</p>
              </div>

              {/* Live Search */}
              <div className="relative max-w-xs w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-gray-900"
                />
              </div>
            </div>

            {/* Category Filter buttons */}
            <div className="flex flex-wrap gap-2">
              {['all', 'shipping', 'returns', 'payments', 'tailoring'].map(cat => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setExpandedFAQIndex(null); }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                    activeCategory === cat
                      ? 'bg-primary border-primary text-white'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Accordion List */}
            <div className="space-y-3">
              {filteredFAQs.length > 0 ? (
                filteredFAQs.map((faq, idx) => {
                  const isExpanded = expandedFAQIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-gray-100 dark:border-gray-900 rounded-2xl bg-[#FBF9F6] dark:bg-gray-900/20 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedFAQIndex(isExpanded ? null : idx)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none hover:bg-gray-50/50 dark:hover:bg-gray-900/30"
                      >
                        <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                          <HelpCircle size={16} className="text-primary shrink-0" />
                          {faq.q}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 pt-1 text-xs text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-50 dark:border-gray-900 bg-white dark:bg-gray-900/40">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              ) : (
                <p className="text-center py-6 text-xs text-gray-400 italic">No FAQs matching your filters.</p>
              )}
            </div>
          </div>

          {/* Ticket Status Lookup */}
          <div className="bg-[#F8F5F0] dark:bg-gray-900/40 p-6 rounded-3xl border border-[#d2c5b1]/15 space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white font-sans flex items-center gap-1.5">
                <Search size={16} className="text-primary" />
                Track Ticket Status
              </h3>
              <p className="text-xs text-gray-500 mt-1">Check progress or view replies to your inquiry</p>
            </div>
            <form onSubmit={handleTicketLookup} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Ticket Number (e.g. TKT-123456)..."
                value={lookupNumber}
                onChange={(e) => setLookupNumber(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-gray-900"
              />
              <button
                type="submit"
                disabled={isLookingUp}
                className="px-5 py-2 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-primary transition-colors cursor-pointer"
              >
                {isLookingUp ? 'Searching...' : 'Search'}
              </button>
            </form>
            {lookupError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={14} /> {lookupError}
              </p>
            )}
            {lookupResult && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3 text-left"
              >
                <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <span className="text-xs font-black text-gray-900 dark:text-white">{lookupResult.ticketNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                    lookupResult.status === 'OPEN' ? 'bg-red-100 text-red-700' :
                    lookupResult.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {lookupResult.status}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <p className="text-gray-400">Subject: <span className="text-gray-800 dark:text-gray-200 font-bold">{lookupResult.subject}</span></p>
                  <p className="text-gray-400">Message: <span className="text-gray-600 dark:text-gray-300 font-medium">{lookupResult.description}</span></p>
                  {lookupResult.reply ? (
                    <div className="mt-3 p-3 bg-primary/5 border border-primary/10 rounded-xl space-y-1">
                      <p className="text-[10px] font-black text-primary uppercase tracking-wide flex items-center gap-1">
                        <MessageSquare size={12} /> Master Tailor / Support Reply
                      </p>
                      <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-semibold italic">
                        "{lookupResult.reply}"
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 italic mt-2">Our support master is reviewing your inquiry. We reply within 2 hours.</p>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Inquiry Contact Form */}
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif">Submit a Support Ticket</h3>
              <p className="text-sm text-gray-500">Need specific help? Fill the details below</p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-gray-900"
                  />
                  {formErrors.name && <p className="text-[10px] text-red-500 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-gray-900"
                  />
                  {formErrors.email && <p className="text-[10px] text-red-500 mt-1">{formErrors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone (10 Digits)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-gray-900"
                  />
                  {formErrors.phone && <p className="text-[10px] text-red-500 mt-1">{formErrors.phone}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Order ID (Optional)</label>
                  <input
                    type="text"
                    name="orderId"
                    value={formData.orderId}
                    placeholder="Enter order reference..."
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subject *</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-gray-900"
                />
                {formErrors.subject && <p className="text-[10px] text-red-500 mt-1">{formErrors.subject}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-gray-900"
                />
                {formErrors.message && <p className="text-[10px] text-red-500 mt-1">{formErrors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-luxury-black transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Sending Ticket...' : 'Submit Support Inquiry'}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: CONTACT DETAILS PANEL */}
        <div className="space-y-6">
          
          {/* Support Contacts Card */}
          <div className="bg-[#FAF8F5] dark:bg-gray-900/30 border border-[#d2c5b1]/15 p-6 rounded-3xl text-left space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-accent font-sans">Contact Channels</h4>
            
            <div className="space-y-4">
              <a
                href={`tel:${settings.supportPhone}`}
                className="flex items-start gap-3 hover:text-primary transition-colors text-xs text-gray-600 dark:text-gray-300"
              >
                <Phone size={18} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-gray-900 dark:text-white">Call Support</p>
                  <p className="mt-0.5">{settings.supportPhone}</p>
                </div>
              </a>

              <a
                href={`mailto:${settings.supportEmail}`}
                className="flex items-start gap-3 hover:text-primary transition-colors text-xs text-gray-600 dark:text-gray-300"
              >
                <Mail size={18} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-gray-900 dark:text-white">Email Address</p>
                  <p className="mt-0.5">{settings.supportEmail}</p>
                </div>
              </a>

              <a
                href={`https://wa.me/${settings.whatsApp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-3 hover:text-primary transition-colors text-xs text-gray-600 dark:text-gray-300"
              >
                <MessageCircle size={18} className="text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-gray-900 dark:text-white">WhatsApp Chats</p>
                  <p className="mt-0.5">{settings.whatsApp}</p>
                </div>
              </a>
            </div>
          </div>

          {/* Business & Operations Details */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl text-left space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-sans">Hours & Responses</h4>
            
            <div className="space-y-4 text-xs">
              <div className="flex gap-3">
                <Clock size={18} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Business Hours</p>
                  <p className="text-gray-500 mt-0.5">{settings.businessHours}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <MessageSquare size={18} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Average Response Time</p>
                  <p className="text-gray-500 mt-0.5">Within 2 Hours (Business Hours)</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50 dark:border-gray-900 text-[10px] text-gray-400 leading-relaxed uppercase tracking-wider">
                <p>Corporate Address:</p>
                <p className="mt-1 font-bold text-gray-500 dark:text-gray-300">{settings.companyAddress}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* SUCCESS MODAL FOR TICKETS */}
      <AnimatePresence>
        {successTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 max-w-md w-full p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl space-y-6 text-center"
            >
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={28} className="text-green-600" />
              </div>
              
              <div className="space-y-2">
                <h4 className="text-lg font-black text-gray-900 dark:text-white">Ticket Submitted Successfully!</h4>
                <p className="text-xs text-gray-500">Your inquiry has been stored. Our boutique support master will reach out shortly.</p>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Inquiry Ticket Reference</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white mt-1 tracking-wider">{successTicket.ticketNumber}</p>
              </div>

              <button
                onClick={() => setSuccessTicket(null)}
                className="w-full py-2.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PremiumLegalPage>
  );
}

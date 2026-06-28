import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Mail, Phone, MapPin, CheckCircle } from 'lucide-react';
import CustomerLayout from '../../../../components/CustomerLayout';
import { createTicket } from '@core/services';
import { useCustomerAuth } from '@core/contexts';

const CustomerContact = () => {
  const navigate = useNavigate();
  const { customer } = useCustomerAuth();
  const [form, setForm] = useState({ name: customer?.name || '', email: '', phone: customer?.phone || '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim() || !form.subject.trim()) return;
    setLoading(true);
    try {
      await createTicket({
        subject: form.subject.trim(),
        description: form.message.trim(),
        ticketType: 'GENERAL_QUERY',
        priority: 'MEDIUM',
        source: 'WEB',
      });
      setSubmitted(true);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <CustomerLayout>
        <div className="max-w-[600px] mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h1>
          <p className="text-gray-500 mb-6">Thank you for reaching out. We will get back to you within 24 hours.</p>
          <button onClick={() => navigate('/customer/home')} className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors">
            Back to Home
          </button>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-[800px] mx-auto px-4 md:px-6 py-8 md:py-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6">
          <ChevronLeft size={18} /> Back
        </button>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-serif mb-2">Contact Us</h1>
        <p className="text-gray-500 mb-8">We'd love to hear from you. Send us a message and we'll respond promptly.</p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl p-5 border border-gray-50 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
                  <Mail size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <a href="mailto:support@vsboutique.shop" className="text-sm font-semibold text-gray-900 hover:text-primary">support@vsboutique.shop</a>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
                  <Phone size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <a href="tel:+919000100020" className="text-sm font-semibold text-gray-900 hover:text-primary">+91 9000100020</a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
                  <MapPin size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Address</p>
                  <p className="text-sm font-semibold text-gray-900">Hyderabad, Telangana, India</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white rounded-2xl p-6 border border-gray-50 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Subject *</label>
              <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Message *</label>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={5}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 resize-none" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50">
              {loading ? 'Sending...' : <><Send size={18} /> Send Message</>}
            </button>
          </form>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerContact;

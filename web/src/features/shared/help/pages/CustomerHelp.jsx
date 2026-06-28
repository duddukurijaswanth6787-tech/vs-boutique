import { useNavigate } from 'react-router-dom';
import { ChevronLeft, HelpCircle, Package, Scissors, CreditCard, Truck, RefreshCw, MessageCircle } from 'lucide-react';
import CustomerLayout from '../../../../components/CustomerLayout';

const FAQS = [
  {
    icon: Package,
    title: 'Orders & Tracking',
    items: [
      { q: 'How do I track my order?', a: 'Go to My Orders in your profile. Each order has a Track button that shows real-time status updates.' },
      { q: 'How long does tailoring take?', a: 'Standard tailoring takes 7-14 business days. Express tailoring is available at additional cost.' },
      { q: 'Can I modify my order after placing it?', a: 'You can modify your order only before the boutique starts processing. Contact support for assistance.' },
    ],
  },
  {
    icon: Scissors,
    title: 'Measurements & Fit',
    items: [
      { q: 'How do I submit my measurements?', a: 'You can enter your measurements in the Digital Tape section under your profile. Follow our measurement guide for accuracy.' },
      { q: 'What if the fit is wrong?', a: 'Contact us within 48 hours of receiving your order. We will arrange alterations through the boutique.' },
    ],
  },
  {
    icon: CreditCard,
    title: 'Payments',
    items: [
      { q: 'What payment methods are accepted?', a: 'We accept all UPI apps, credit/debit cards, net banking, and wallets through Razorpay.' },
      { q: 'Is my payment information secure?', a: 'Yes. All payments are processed by Razorpay, a PCI-DSS compliant payment gateway. We never store your card details.' },
      { q: 'How does the advance payment work?', a: 'A 20% advance payment is required to confirm your order. The balance is paid after completion.' },
    ],
  },
  {
    icon: Truck,
    title: 'Shipping & Delivery',
    items: [
      { q: 'What are the shipping charges?', a: 'Free shipping on orders above ₹999. Standard shipping is ₹49, Express shipping is ₹99.' },
      { q: 'Do you ship internationally?', a: 'Currently, we only ship within India. International shipping will be available soon.' },
    ],
  },
  {
    icon: RefreshCw,
    title: 'Returns & Cancellations',
    items: [
      { q: 'What is your cancellation policy?', a: 'Orders can be cancelled before the boutique starts processing for a full refund. Partial refunds apply after processing begins.' },
      { q: 'How do I request a refund?', a: 'Submit a refund request through our Contact page. We review requests within 2-3 business days.' },
    ],
  },
];

const CustomerHelp = () => {
  const navigate = useNavigate();

  return (
    <CustomerLayout>
      <div className="max-w-[900px] mx-auto px-4 md:px-6 py-8 md:py-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6">
          <ChevronLeft size={18} /> Back
        </button>
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle size={28} className="text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-serif">Help Center</h1>
        </div>
        <p className="text-gray-500 mb-10">Find answers to common questions about ordering, payments, and more.</p>

        <div className="space-y-8">
          {FAQS.map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-2 mb-4">
                <section.icon size={20} className="text-primary" />
                <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
              </div>
              <div className="space-y-3">
                {section.items.map((faq) => (
                  <details key={faq.q} className="group bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
                    <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-gray-900 list-none flex items-center justify-between group-open:bg-gray-50 transition-colors">
                      {faq.q}
                      <ChevronLeft size={16} className="text-gray-400 -rotate-90 group-open:rotate-90 transition-transform ml-2 flex-shrink-0" />
                    </summary>
                    <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 bg-primary/5 rounded-2xl text-center">
          <MessageCircle size={24} className="text-primary mx-auto mb-2" />
          <p className="text-sm text-gray-600">Still have questions?</p>
          <button onClick={() => navigate('/customer/contact')} className="mt-2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors inline-flex items-center gap-1.5">
            <MessageCircle size={16} /> Contact Us
          </button>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerHelp;

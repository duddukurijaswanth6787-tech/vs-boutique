import { Link } from 'react-router-dom';

export default function PageFooter({
  brandName = 'VS Boutique',
  brandDescription = 'Premium custom tailoring and fashion boutique connecting you with skilled artisans across India.',
  copyrightText = `© ${new Date().getFullYear()} VS Boutique. All rights reserved.`,
  className = '',
  ...props
}) {
  const quickLinks = [
    { label: 'Home', path: '/customer/home' },
    { label: 'Shop All', path: '/customer/shop' },
    { label: 'New Arrivals', path: '/customer/shop?sort=newest' },
    { label: 'Custom Tailoring', path: '/customer/tailoring' },
    { label: 'My Orders', path: '/customer/orders' },
  ];

  const legalLinks = [
    { label: 'Privacy Policy', path: '/customer/privacy' },
    { label: 'Terms & Conditions', path: '/customer/terms' },
    { label: 'Refund Policy', path: '/customer/refund' },
    { label: 'Shipping Policy', path: '/customer/shipping' },
    { label: 'About Us', path: '/customer/about' },
  ];

  return (
    <footer className={`bg-gray-900 text-gray-300 font-sans ${className}`} {...props}>
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
                <span className="text-white font-serif font-bold text-sm">VS</span>
              </div>
              <span className="font-serif text-xl font-bold text-white tracking-tight">{brandName}</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {brandDescription}
            </p>
            <div className="flex gap-3">
              {['facebook', 'instagram', 'twitter', 'youtube'].map((s) => (
                <div
                  key={s}
                  className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center hover:bg-accent/20 hover:text-accent transition-colors cursor-pointer"
                >
                  <span className="text-xs font-semibold uppercase">{s[0]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <span className="text-accent mt-0.5">📍</span>
                <span>Hyderabad, Telangana, India</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-0.5">📧</span>
                <a href="mailto:support@vsboutique.shop" className="hover:text-white transition-colors">
                  support@vsboutique.shop
                </a>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-0.5">📞</span>
                <a href="tel:+919000100020" className="hover:text-white transition-colors">
                  +91 9000100020
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">{copyrightText}</p>
          <div className="flex gap-4 text-xs text-gray-500">
            <span>Secure Payments via Razorpay</span>
            <span>|</span>
            <span>100% Authentic Products</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

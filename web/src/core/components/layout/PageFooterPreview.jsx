import { Link } from 'react-router-dom';

export default function PageFooterPreview({
  brandName = 'VS Boutique',
  brandDescription = 'Premium custom tailoring and fashion boutique connecting you with skilled artisans across India.',
  copyrightText = `© ${new Date().getFullYear()} VS Boutique. All rights reserved.`,
  className = '',
  ...props
}) {
  const categories = [
    { label: 'Sarees', path: '/customer/shop?category=sarees' },
    { label: 'Lehengas', path: '/customer/shop?category=lehengas' },
    { label: 'Kurtis', path: '/customer/shop?category=kurtis' },
    { label: 'Dresses', path: '/customer/shop?category=dresses' },
    { label: 'Blouses', path: '/customer/shop?category=blouses' },
  ];

  const tailoringServices = [
    { label: 'Custom Stitching', path: '/customer/tailoring' },
    { label: 'Alterations', path: '/customer/tailoring' },
    { label: 'Bridal Wear', path: '/customer/tailoring' },
    { label: 'Express Delivery', path: '/customer/tailoring' },
  ];

  const quickLinks = [
    { label: 'Home', path: '/customer/home' },
    { label: 'Shop All', path: '/customer/shop' },
    { label: 'About Us', path: '/customer/about' },
    { label: 'Partner Boutiques', path: '/customer/tailoring' },
    { label: 'Contact Us', path: '/customer/contact' },
  ];

  const legalLinks = [
    { label: 'Privacy Policy', path: '/customer/privacy' },
    { label: 'Terms & Conditions', path: '/customer/terms' },
    { label: 'Refund Policy', path: '/customer/refund' },
    { label: 'Shipping Policy', path: '/customer/shipping' },
  ];

  return (
    <footer className={`bg-[#111827] text-gray-400 font-sans border-t border-[#d2c5b1]/15 ${className}`} {...props}>
      <div className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 pb-12 border-b border-gray-800">
          {/* Column 1: Brand Info */}
          <div className="space-y-4 col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#C5A059] flex items-center justify-center">
                <span className="text-white font-serif font-black text-xs">VS</span>
              </div>
              <span className="font-serif text-lg font-black text-white tracking-widest uppercase">{brandName}</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              {brandDescription}
            </p>
            <div className="flex gap-2.5 pt-2">
              {['Facebook', 'Instagram', 'Pinterest', 'Youtube'].map((s) => (
                <div
                  key={s}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent/20 hover:text-accent hover:border-accent transition-colors cursor-pointer text-[10px] font-black uppercase tracking-wider text-gray-400"
                  title={s}
                >
                  {s[0]}
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Categories */}
          <div>
            <h4 className="text-xs font-black text-[#C5A059] uppercase tracking-widest mb-4">Categories</h4>
            <ul className="space-y-2.5">
              {categories.map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-xs font-semibold text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Tailoring Services */}
          <div>
            <h4 className="text-xs font-black text-[#C5A059] uppercase tracking-widest mb-4">Services</h4>
            <ul className="space-y-2.5">
              {tailoringServices.map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-xs font-semibold text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Quick Links */}
          <div>
            <h4 className="text-xs font-black text-[#C5A059] uppercase tracking-widest mb-4">Company</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-xs font-semibold text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Legal */}
          <div>
            <h4 className="text-xs font-black text-[#C5A059] uppercase tracking-widest mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-xs font-semibold text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 6: Contact */}
          <div>
            <h4 className="text-xs font-black text-[#C5A059] uppercase tracking-widest mb-4">Contact</h4>
            <ul className="space-y-3.5 text-xs text-gray-400">
              <li className="flex items-start gap-2.5">
                <span className="text-accent shrink-0">📍</span>
                <span className="font-semibold">Hyderabad, Telangana, India</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-accent shrink-0">📧</span>
                <a href="mailto:support@vsboutique.shop" className="hover:text-white transition-colors font-semibold truncate block">
                  support@vsboutique.shop
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-accent shrink-0">📞</span>
                <a href="tel:+919000100020" className="hover:text-white transition-colors font-semibold">
                  +91 9000100020
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-semibold text-gray-500">{copyrightText}</p>
          <div className="flex gap-4 text-xs font-semibold text-gray-500">
            <span>Secure Payments via Razorpay</span>
            <span>|</span>
            <span>100% Authentic Products</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

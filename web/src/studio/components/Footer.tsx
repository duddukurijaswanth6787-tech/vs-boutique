import { ArrowUp, Mail, Phone, Clock, ShieldCheck, Play, Globe } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#FAF8F5] border-t border-accent/20 pt-16 pb-8 px-4 md:px-8 relative" id="page-footer">
      
      {/* 6-Column Structured Grid */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 pb-12 border-b border-accent/10">
        
        {/* Column 1: Brand Info & App Links */}
        <div className="col-span-2 md:col-span-3 lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 border border-accent/40 rounded-full flex items-center justify-center bg-white p-0.5">
              <span className="text-accent font-serif text-base font-bold italic">VS</span>
            </div>
            <span className="text-sm font-bold text-luxury-black font-serif italic leading-none flex flex-col">
              VS Boutique
              <span className="text-[7px] font-sans font-bold tracking-[0.3em] text-accent mt-0.5 uppercase">Stitched To Perfection</span>
            </span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
            Your premium destination for bespoke ethnic wear, master custom tailoring, and luxury collections.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-3 pt-2">
            <a href="#" className="h-7 w-7 rounded-full border border-accent/20 bg-white hover:bg-accent hover:border-accent hover:text-white text-gray-500 flex items-center justify-center transition-all cursor-pointer shadow-sm" aria-label="Instagram">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="#" className="h-7 w-7 rounded-full border border-accent/20 bg-white hover:bg-accent hover:border-accent hover:text-white text-gray-500 flex items-center justify-center transition-all cursor-pointer shadow-sm" aria-label="Facebook">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            <a href="#" className="h-7 w-7 rounded-full border border-accent/20 bg-white hover:bg-accent hover:border-accent hover:text-white text-gray-500 flex items-center justify-center transition-all cursor-pointer shadow-sm" aria-label="YouTube">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
            </a>
            <a href="#" className="h-7 w-7 rounded-full border border-accent/20 bg-white hover:bg-accent hover:border-accent hover:text-white text-gray-500 flex items-center justify-center transition-all cursor-pointer shadow-sm" aria-label="Website">
              <Globe className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* App download links */}
          <div className="space-y-1.5 pt-4">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Download Our App</span>
            <div className="flex gap-2">
              <a href="#" className="flex items-center gap-1.5 px-2 py-1 border border-accent/20 rounded-md bg-white hover:bg-luxury-ivory transition-colors">
                <span className="text-[8px] font-sans text-gray-400 block leading-none">Download on the<strong className="text-[10px] text-luxury-black font-bold block mt-0.5">App Store</strong></span>
              </a>
              <a href="#" className="flex items-center gap-1.5 px-2 py-1 border border-accent/20 rounded-md bg-white hover:bg-luxury-ivory transition-colors">
                <span className="text-[8px] font-sans text-gray-400 block leading-none">Get it on<strong className="text-[10px] text-luxury-black font-bold block mt-0.5">Google Play</strong></span>
              </a>
            </div>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-accent uppercase tracking-widest font-sans">Quick Links</h4>
          <ul className="space-y-1.5 text-xs text-gray-500 font-sans">
            <li><a href="#" className="hover:text-accent transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Contact Us</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Size Guide</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Track Order</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">FAQs</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Blog</a></li>
          </ul>
        </div>

        {/* Column 3: Categories */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-accent uppercase tracking-widest font-sans">Categories</h4>
          <ul className="space-y-1.5 text-xs text-gray-500 font-sans">
            <li><a href="#" className="hover:text-accent transition-colors">Sarees</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Lehengas</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Kurtis</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Dresses</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Menswear</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Kidswear</a></li>
          </ul>
        </div>

        {/* Column 4: Customer Service */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-accent uppercase tracking-widest font-sans">Customer Service</h4>
          <ul className="space-y-1.5 text-xs text-gray-500 font-sans">
            <li><a href="#" className="hover:text-accent transition-colors">Shipping Policy</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Returns & Exchange</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Terms & Conditions</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Payment Policy</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Support Center</a></li>
          </ul>
        </div>

        {/* Column 5: Tailoring */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-accent uppercase tracking-widest font-sans">Tailoring</h4>
          <ul className="space-y-1.5 text-xs text-gray-500 font-sans">
            <li><a href="#" className="hover:text-accent transition-colors">Custom Stitching</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Blouse Stitching</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Alterations</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Measurement Guide</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Fabric Consultation</a></li>
            <li><a href="#" className="hover:text-accent transition-colors">Tailoring FAQs</a></li>
          </ul>
        </div>

        {/* Column 6: Get In Touch */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-accent uppercase tracking-widest font-sans">Get In Touch</h4>
          <div className="space-y-3 text-xs text-gray-500 font-sans">
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <span>+91 98765 43210</span>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <span className="break-all">support@vsboutique.com</span>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <span>Mon - Sun: 9AM - 9PM IST</span>
            </div>
          </div>

          <div className="pt-3 border-t border-accent/10">
            <p className="text-[10px] text-green-600 font-semibold flex items-center gap-1 leading-none">
              <ShieldCheck className="h-4.5 w-4.5 text-green-600 stroke-[2.5]" /> Guaranteed Perfect Fit
            </p>
          </div>
        </div>

      </div>

      {/* Bottom Footer Row: Copyright & Payment Badges & Scroll Top */}
      <div className="max-w-[1400px] mx-auto pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Copyright info */}
        <div className="text-[11px] text-gray-400 font-sans order-2 md:order-1 text-center md:text-left">
          © {currentYear} VS Boutique. All Rights Reserved. Crafted with perfect fits & custom stitching.
        </div>

        {/* Payment logos list */}
        <div className="flex items-center gap-3 order-1 md:order-2 flex-wrap justify-center">
          <span className="text-[10px] text-gray-400 uppercase font-bold mr-1 tracking-wider">Secure Payment with</span>
          <div className="flex gap-2">
            <span className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-[9px] font-bold text-gray-400 shadow-sm leading-none flex items-center uppercase">Visa</span>
            <span className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-[9px] font-bold text-gray-400 shadow-sm leading-none flex items-center uppercase">Mastercard</span>
            <span className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-[9px] font-bold text-gray-400 shadow-sm leading-none flex items-center uppercase">RuPay</span>
            <span className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-[9px] font-bold text-gray-400 shadow-sm leading-none flex items-center uppercase">UPI</span>
            <span className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-[9px] font-bold text-gray-400 shadow-sm leading-none flex items-center uppercase">GPay</span>
          </div>
        </div>

        {/* Scroll To Top button */}
        <button
          onClick={scrollToTop}
          className="absolute right-4 bottom-4 md:right-8 md:bottom-8 h-10 w-10 bg-accent hover:bg-accent-dark text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all cursor-pointer"
          title="Scroll To Top"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>

      </div>

    </footer>
  );
}

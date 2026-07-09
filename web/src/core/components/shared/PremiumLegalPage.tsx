import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ArrowUp, Printer, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PremiumLegalPageProps {
  title: string;
  lastUpdated?: string;
  seoTitle?: string;
  seoDescription?: string;
  children: React.ReactNode;
}

export default function PremiumLegalPage({
  title,
  lastUpdated = 'July 9, 2026',
  seoTitle,
  seoDescription,
  children
}: PremiumLegalPageProps) {
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulated premium load screen/skeleton
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Handle scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Inject SEO metadata and Schema Markup
  useEffect(() => {
    const defaultTitle = `${title} | VS Boutique - Stitched to Perfection`;
    const defaultDesc = `Read the official ${title} for VS Boutique. Production ready, payment gateway verified customer policy.`;

    document.title = seoTitle || defaultTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', seoDescription || defaultDesc);

    // OpenGraph Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', seoTitle || defaultTitle);

    // OpenGraph Description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', seoDescription || defaultDesc);

    // Structured Data JSON-LD
    const schemaId = `ld-schema-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const existingSchema = document.getElementById(schemaId);
    if (existingSchema) {
      existingSchema.remove();
    }
    const schemaScript = document.createElement('script');
    schemaScript.id = schemaId;
    schemaScript.type = 'application/ld+json';
    
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": title,
      "description": seoDescription || defaultDesc,
      "url": window.location.href,
      "dateModified": lastUpdated,
      "publisher": {
        "@type": "Organization",
        "name": "VS Boutique",
        "logo": {
          "@type": "ImageObject",
          "url": "https://vsboutique.shop/logo.png"
        }
      }
    };
    schemaScript.textContent = JSON.stringify(schemaData);
    document.head.appendChild(schemaScript);

    return () => {
      schemaScript?.remove();
    };
  }, [title, seoTitle, seoDescription, lastUpdated]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 dark:bg-gray-950 dark:text-gray-100 font-sans transition-colors duration-300">
      
      {/* 1. Elegant Header Area / Breadcrumbs */}
      <div className="border-b border-gray-100 dark:border-gray-900 print:hidden">
        <div className="max-w-[1000px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          
          {/* Breadcrumb List */}
          <nav className="flex items-center space-x-2 text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1 font-bold">
              <Home size={14} /> Home
            </Link>
            <span className="text-gray-300 dark:text-gray-700">/</span>
            <span className="text-gray-900 dark:text-white font-extrabold uppercase tracking-wide">{title}</span>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-xs md:text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-bold px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 border border-transparent hover:border-gray-200/50"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 text-xs md:text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-bold px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 border border-transparent hover:border-gray-200/50"
              aria-label="Print page"
            >
              <Printer size={16} /> Print
            </button>
          </div>
        </div>
      </div>

      {/* 2. Hero Header Area */}
      <div className="bg-[#F8F5F0] dark:bg-gray-900/50 py-12 md:py-20 text-center border-b border-gray-100/50 dark:border-gray-900/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="max-w-[1000px] mx-auto px-6 relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white font-serif tracking-tight"
          >
            {title}
          </motion.h1>
          {lastUpdated && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-4 font-bold uppercase tracking-wider"
            >
              Last Updated: {lastUpdated}
            </motion.p>
          )}
        </div>
      </div>

      {/* 3. Main Content / Skeleton */}
      <div className="max-w-[1000px] mx-auto px-6 py-12 md:py-16">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              </div>
              <div className="h-6 w-1/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse pt-4" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="prose prose-luxury max-w-none dark:prose-invert text-left"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Scroll To Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-full shadow-lg hover:text-primary transition-colors z-50 print:hidden cursor-pointer"
            aria-label="Scroll to top"
          >
            <ArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

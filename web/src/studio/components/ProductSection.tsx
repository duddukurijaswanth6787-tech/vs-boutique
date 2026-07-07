/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, ShoppingCart, Eye, X, Check, Scissors, ChevronRight, MessageSquareCode, Share2 } from 'lucide-react';
import { Product } from '../types';
import { products } from '../data';

interface ProductSectionProps {
  onAddToCart: (p: Product, size: string, color: string, stitching: boolean, notes: string) => void;
  onToggleWishlist: (p: Product) => void;
  wishlistIds: Set<string>;
  activeProduct: Product | null;
  setActiveProduct: (p: Product | null) => void;
}

export default function ProductSection({
  onAddToCart,
  onToggleWishlist,
  wishlistIds,
  activeProduct,
  setActiveProduct
}: ProductSectionProps) {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [addCustomStitching, setAddCustomStitching] = useState(false);
  const [stitchingNotes, setStitchingNotes] = useState('');
  const [addedMessage, setAddedMessage] = useState(false);

  const handleShareProduct = (p: Product) => {
    const shareUrl = `${window.location.origin}/customer/shop/${p.id}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        alert(`✨ Share link copied to clipboard!:\n${shareUrl}`);
      })
      .catch(() => {
        alert(`Product Link: ${shareUrl}`);
      });
  };

  const newArrivals = products.filter(p => p.isNewArrival);
  const trendingNow = products.filter(p => p.isTrending);

  // Open quick view and reset modal configuration states
  const handleQuickView = (p: Product) => {
    setActiveProduct(p);
    setSelectedSize(p.sizes ? p.sizes[0] : 'Free Size');
    setSelectedColor(p.colors ? p.colors[0] : 'Default');
    setAddCustomStitching(false);
    setStitchingNotes('');
    setAddedMessage(false);
  };

  const handleAddToCartSubmit = (p: Product) => {
    onAddToCart(p, selectedSize, selectedColor, addCustomStitching, stitchingNotes);
    setAddedMessage(true);
    setTimeout(() => {
      setAddedMessage(false);
      setActiveProduct(null);
    }, 1500);
  };

  // Shared card rendering sub-component
  const ProductCard = ({ product }: { product: Product }) => {
    const isWishlisted = wishlistIds.has(product.id);
    return (
      <div className="group bg-white rounded-[12px] border border-accent/10 shadow-card overflow-hidden hover:border-accent/30 hover:shadow-hover transition-all duration-300 flex flex-col h-full relative">
        
        {/* Aspect 3:4 PORTRAIT images for classic fashion catalogs */}
        <div 
          onClick={() => handleQuickView(product)}
          className="relative aspect-[3/4] overflow-hidden bg-gray-100 flex-shrink-0 rounded-t-[12px] cursor-pointer"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            loading="lazy"
            referrerPolicy="no-referrer"
          />

          {/* Floating tags */}
          {product.tag && (
            <span className="absolute top-3 left-3 bg-accent text-white text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-1 rounded-[4px] shadow-sm">
              {product.tag}
            </span>
          )}

          {/* Floating Wishlist Heart */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product);
            }}
            className="absolute top-3 right-3 h-8 w-8 bg-white/95 hover:bg-white text-luxury-black hover:text-accent rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer border border-accent/10"
            aria-label="Add to Wishlist"
          >
            <Heart className={`h-4 w-4 transition-colors ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'}`} />
          </button>

          {/* Quick-view hover overlay trigger */}
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 gap-2">
            <button
              onClick={() => handleQuickView(product)}
              className="bg-white hover:bg-accent hover:text-white text-luxury-black p-2.5 rounded-full shadow-lg transition-all cursor-pointer transform translate-y-4 group-hover:translate-y-0 duration-300"
              title="Quick View"
            >
              <Eye className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => handleQuickView(product)}
              className="bg-accent hover:bg-accent-dark text-white text-[9px] font-bold uppercase tracking-widest px-4 py-2 rounded-[8px] shadow-lg transition-all cursor-pointer transform translate-y-4 group-hover:translate-y-0 duration-300"
            >
              Custom Fitting
            </button>
          </div>
        </div>

        {/* Info panel */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Rating */}
            <div className="flex items-center gap-1">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`} />
                ))}
              </div>
              <span className="text-[9px] text-gray-400 font-bold">{product.rating}</span>
            </div>

            {/* Product Title */}
            <h3 
              onClick={() => handleQuickView(product)}
              className="text-[11px] font-bold uppercase tracking-wider text-luxury-black mt-2 font-sans truncate group-hover:text-accent transition-colors leading-tight cursor-pointer"
            >
              {product.name}
            </h3>
            <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mt-0.5 cursor-pointer" onClick={() => handleQuickView(product)}>{product.category}</p>
          </div>

          {/* Price Tag with discount */}
          <div className="flex items-center justify-between gap-2 mt-4 pt-2 border-t border-accent/5">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-luxury-black">₹{product.price}</span>
              {product.originalPrice && (
                <span className="text-[9px] text-gray-400 line-through">₹{product.originalPrice}</span>
              )}
            </div>

            {product.discountPercent && (
              <span className="bg-red-50 text-red-600 border border-red-100 text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-[4px]">
                {product.discountPercent}% OFF
              </span>
            )}
          </div>
        </div>

      </div>
    );
  };

  return (
    <section className="w-full py-12 px-4 md:px-8 bg-luxury-ivory/35" id="new-arrivals">
      <div className="max-w-[1400px] mx-auto space-y-10">

        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-[9px] tracking-widest text-accent font-extrabold uppercase font-sans block">Boutique Curations</span>
          <h2 className="text-3xl font-serif italic font-semibold text-luxury-black">Shop Our Exquisite Outfits</h2>
          <div className="h-[1px] w-12 bg-accent/30 mx-auto mt-2" />
        </div>

        {/* Main Stacked Rows */}
        <div className="space-y-12">
          
          {/* New Arrivals (5 products) */}
          <div className="space-y-5" id="new-arrivals-column">
            <div className="flex items-center justify-between border-b border-accent/15 pb-2">
              <h3 className="text-sm md:text-base font-extrabold uppercase tracking-wider text-luxury-black font-sans">
                New Arrivals
              </h3>
              <button
                onClick={() => {}}
                className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-accent hover:text-accent-dark transition-all duration-300 cursor-pointer flex items-center gap-1"
              >
                View All <span className="font-serif text-xs font-semibold">&gt;</span>
              </button>
            </div>

            <div className="flex overflow-x-auto gap-4 pb-4 md:grid md:grid-cols-3 lg:grid-cols-5 md:gap-5 md:pb-0 scrollbar-none">
              {newArrivals.map((product) => (
                <div key={product.id} className="w-56 sm:w-64 md:w-full shrink-0">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>

          {/* Trending Now (3 products) */}
          <div className="space-y-5" id="trending-column">
            <div className="flex items-center justify-between border-b border-accent/15 pb-2">
              <h3 className="text-sm md:text-base font-extrabold uppercase tracking-wider text-luxury-black font-sans">
                Trending Now
              </h3>
              <button
                onClick={() => {}}
                className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-accent hover:text-accent-dark transition-all duration-300 cursor-pointer flex items-center gap-1"
              >
                View All <span className="font-serif text-xs font-semibold">&gt;</span>
              </button>
            </div>

            <div className="flex overflow-x-auto gap-4 pb-4 md:grid md:grid-cols-3 lg:grid-cols-3 md:gap-5 md:pb-0 scrollbar-none">
              {trendingNow.map((product) => (
                <div key={product.id} className="w-56 sm:w-64 md:w-full shrink-0">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Product Detail & Custom Tailoring Addon Dialog */}
      <AnimatePresence>
        {activeProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" id="quickview-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-luxury border border-accent/20 max-h-[90vh] relative flex flex-col"
            >
              {/* Floating Close Button: stable/stationary during modal scroll */}
              <button
                onClick={() => setActiveProduct(null)}
                className="absolute top-4 right-4 z-50 p-2 bg-white/90 hover:bg-white text-gray-500 hover:text-red-500 rounded-full transition-all border border-accent/15 shadow-md cursor-pointer flex items-center justify-center"
                aria-label="Close details"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              {/* Scrollable inner content container */}
              <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto w-full max-h-[90vh]">
                {/* Left Column: Image (Col-span 5) */}
                <div className="md:col-span-5 bg-luxury-ivory p-6 flex flex-col justify-center relative">
                <img
                  src={activeProduct.image}
                  alt={activeProduct.name}
                  className="w-full aspect-[3/4] object-cover rounded-xl shadow-card"
                  referrerPolicy="no-referrer"
                />
                
                {/* Floating Discount details */}
                {activeProduct.discountPercent && (
                  <span className="absolute top-8 left-8 bg-red-600 text-white text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-md uppercase">
                    {activeProduct.discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Right Column: Detailed parameters & selectors (Col-span 7) */}
              <div className="md:col-span-7 p-6 flex flex-col justify-between space-y-6">
                
                {/* Header title */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] tracking-widest text-accent font-extrabold uppercase font-sans">
                      {activeProduct.category}
                    </span>
                    <h3 className="text-lg font-bold text-luxury-black mt-1 font-serif">
                      {activeProduct.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleShareProduct(activeProduct)}
                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-accent transition-colors cursor-pointer flex items-center justify-center"
                    title="Share Product"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>

                {/* Rating & Pricing */}
                <div className="flex items-center gap-4 py-2 border-y border-gray-100">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-luxury-black">₹{activeProduct.price}</span>
                    {activeProduct.originalPrice && (
                      <span className="text-xs text-gray-400 line-through">₹{activeProduct.originalPrice}</span>
                    )}
                  </div>
                  <div className="h-4 w-[1px] bg-gray-200" />
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    <span className="font-bold text-luxury-black">{activeProduct.rating}</span>
                    <span className="text-gray-400">({activeProduct.reviewCount} customer reviews)</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 leading-relaxed">
                  {activeProduct.description}
                </p>

                {/* Size & Color Selectors */}
                <div className="grid grid-cols-2 gap-4">
                  {activeProduct.sizes && activeProduct.sizes.length > 0 && (
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Select Fitting Size
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {activeProduct.sizes.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSelectedSize(s)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${selectedSize === s ? 'border-accent bg-accent/10 text-accent font-black' : 'border-gray-200 bg-white hover:border-accent/30 text-gray-600'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeProduct.colors && activeProduct.colors.length > 0 && (
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Available Color
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {activeProduct.colors.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setSelectedColor(c)}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${selectedColor === c ? 'border-accent bg-accent/10 text-accent font-black' : 'border-gray-200 bg-white hover:border-accent/30 text-gray-600'}`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* BESPOKE CUSTOM TAILORING ADDON PANELS */}
                <div className="p-4 bg-luxury-ivory border border-accent/20 rounded-xl space-y-3">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center">
                        <Scissors className="h-4.5 w-4.5 text-accent" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-luxury-black block group-hover:text-accent transition-colors">
                          Need Custom Stitching? (+₹999)
                        </span>
                        <span className="text-[10px] text-gray-400">
                          Tailored perfectly to your unique body measurements
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={addCustomStitching}
                      onChange={(e) => setAddCustomStitching(e.target.checked)}
                      className="h-4 w-4 accent-accent rounded"
                    />
                  </label>

                  {/* Instructions textbox */}
                  {addCustomStitching && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="space-y-2 pt-2 border-t border-accent/10"
                    >
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Tailor Instruction Notes (Neck style, sleeves, height length...)
                      </label>
                      <textarea
                        value={stitchingNotes}
                        onChange={(e) => setStitchingNotes(e.target.value)}
                        placeholder="e.g. Please stitch blouse with 10-inch elbow sleeves, sweetheart neckline, and back deep-hook drapes. Inner cotton lining added."
                        className="w-full bg-white border border-accent/20 rounded-lg p-2.5 text-xs focus:outline-none focus:border-accent"
                        rows={2}
                      />
                    </motion.div>
                  )}
                </div>

                {/* Specs Specifications dropdown */}
                {activeProduct.specs && (
                  <div className="border border-gray-150 rounded-xl p-3 text-xs bg-white/40">
                    <span className="font-bold text-luxury-black block border-b border-gray-100 pb-1.5 mb-1.5 uppercase text-[10px] tracking-wider text-accent">
                      Garment Specifications
                    </span>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-500 text-[10.5px]">
                      {Object.entries(activeProduct.specs).map(([key, value]) => (
                        <div key={key} className="flex justify-between border-b border-gray-50 pb-0.5 last:border-0">
                          <span>{key}:</span>
                          <strong className="text-gray-700">{value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submitting Actions */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    disabled={addedMessage}
                    onClick={() => handleAddToCartSubmit(activeProduct)}
                    className="flex-1 flex items-center justify-center gap-2 bg-luxury-black text-white hover:bg-accent py-3 px-4 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-md hover:shadow-lg disabled:bg-green-600 disabled:text-white"
                  >
                    {addedMessage ? (
                      <>
                        <Check className="h-4.5 w-4.5 text-white" />
                        Stitching Config Configured!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4.5 w-4.5" />
                        Add To My Fitting Cart
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      onToggleWishlist(activeProduct);
                    }}
                    className="border border-accent/35 hover:bg-luxury-ivory p-3 rounded-xl text-luxury-black hover:text-accent cursor-pointer transition-colors"
                    title="Add to Wishlist"
                  >
                    <Heart className={`h-4.5 w-4.5 ${wishlistIds.has(activeProduct.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}

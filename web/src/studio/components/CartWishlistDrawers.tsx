/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingBag, Heart, ArrowRight, Check, CreditCard, ShieldCheck } from 'lucide-react';
import { CartItem, WishlistItem, Product } from '../types';
import React, { useState } from 'react';
import { apiService } from '../services/api';

interface CartWishlistDrawersProps {
  isCartOpen: boolean;
  onCartClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveFromCart: (id: string) => void;
  isWishlistOpen: boolean;
  onWishlistClose: () => void;
  wishlistItems: WishlistItem[];
  onRemoveFromWishlist: (id: string) => void;
  onAddToCartFromWishlist: (p: Product) => void;
  onCheckoutSuccess: () => void;
}

export default function CartWishlistDrawers({
  isCartOpen,
  onCartClose,
  cartItems,
  onUpdateQuantity,
  onRemoveFromCart,
  isWishlistOpen,
  onWishlistClose,
  wishlistItems,
  onRemoveFromWishlist,
  onAddToCartFromWishlist,
  onCheckoutSuccess
}: CartWishlistDrawersProps) {
  const [checkoutStep, setCheckoutStep] = useState<number | null>(null); // null = not checking out, 1 = details, 2 = payment, 3 = success
  const [address, setAddress] = useState({ name: '', phone: '', addressLine: '', city: '', pinCode: '' });
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('cod');

  const cartSubtotal = cartItems.reduce((acc, item) => acc + (item.product.price + item.stitchingPrice) * item.quantity, 0);
  const cartTax = Math.round(cartSubtotal * 0.05); // 5% GST
  const shippingFee = cartSubtotal >= 999 ? 0 : 99;
  const cartTotal = cartSubtotal + cartTax + shippingFee;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutStep === 1) {
      setCheckoutStep(2);
    } else if (checkoutStep === 2) {
      try {
        let locked: any = {};
        const stored = localStorage.getItem('vs_locked_measurement');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            locked = parsed.values;
          } catch (e) {
            console.error('Failed to parse locked measurements during checkout:', e);
          }
        }

        // Create a custom order on the backend for each item in the cart
        for (const item of cartItems) {
          await apiService.createOrder({
            productName: `${item.product.name} (${item.stitchingNotes || 'Standard fit'})`,
            price: item.product.price + item.stitchingPrice,
            lockedMeasurements: locked
          });
        }
      } catch (err) {
        console.error('Bespoke checkout orders creation failed:', err);
      }
      setCheckoutStep(3);
    }
  };

  const handleFinishCheckout = () => {
    setCheckoutStep(null);
    onCheckoutSuccess();
  };

  return (
    <>
      <AnimatePresence>
        {/* Cart Drawer */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden" id="cart-drawer-overlay">
            <div className="absolute inset-0 overflow-hidden">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={onCartClose}
                className="absolute inset-0 bg-black/60 transition-opacity backdrop-blur-xs"
              />

              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="pointer-events-auto w-screen max-w-md"
                >
                  <div className="flex h-full flex-col bg-luxury-ivory shadow-xl border-l border-accent/20">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-accent/20 px-6 py-5 bg-white">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-accent" />
                        <h2 className="text-lg font-medium text-luxury-black font-sans">Shopping Cart ({cartItems.length})</h2>
                      </div>
                      <button
                        onClick={onCartClose}
                        className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                        aria-label="Close cart"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                      {cartItems.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center py-12">
                          <ShoppingBag className="h-16 w-16 text-accent/30 stroke-[1.5] mb-4" />
                          <p className="text-gray-500 font-medium">Your cart is empty</p>
                          <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Add some luxury ethnic items or custom tailoring designs to get started.</p>
                          <button
                            onClick={onCartClose}
                            className="mt-6 px-6 py-2.5 bg-luxury-black text-white text-xs font-medium tracking-wider uppercase rounded-full hover:bg-accent hover:text-white transition-colors"
                          >
                            Browse Products
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {cartItems.map((item) => (
                            <div key={item.id} className="flex gap-4 p-3 bg-white rounded-xl border border-accent/10 shadow-card">
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="h-20 w-16 object-cover rounded-md flex-shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-1 min-w-0">
                                <h3 className="text-xs font-semibold text-luxury-black truncate font-sans">{item.product.name}</h3>
                                <p className="text-[10px] text-gray-500 mt-0.5">{item.product.category}</p>
                                
                                <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 text-[10px] text-gray-400">
                                  <span>Size: <strong className="text-gray-700">{item.selectedSize}</strong></span>
                                  {item.isCustomStitched && (
                                    <span className="text-accent font-medium">✨ Custom Stitched (+₹{item.stitchingPrice})</span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center border border-accent/20 rounded-md bg-luxury-ivory">
                                    <button
                                      disabled={item.quantity <= 1}
                                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                      className="px-2 py-0.5 text-xs text-gray-500 hover:text-accent disabled:opacity-30"
                                    >
                                      -
                                    </button>
                                    <span className="px-2 py-0.5 text-xs text-luxury-black font-medium">{item.quantity}</span>
                                    <button
                                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                      className="px-2 py-0.5 text-xs text-gray-500 hover:text-accent"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-luxury-black">
                                      ₹{(item.product.price + item.stitchingPrice) * item.quantity}
                                    </span>
                                    <button
                                      onClick={() => onRemoveFromCart(item.id)}
                                      className="text-gray-400 hover:text-red-500 transition-colors"
                                      aria-label="Remove item"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Summary Footer */}
                    {cartItems.length > 0 && (
                      <div className="border-t border-accent/20 bg-white px-6 py-6 space-y-4">
                        <div className="space-y-1.5 text-xs text-gray-500">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-semibold text-luxury-black">₹{cartSubtotal}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>GST (5%)</span>
                            <span className="font-semibold text-luxury-black">₹{cartTax}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Shipping</span>
                            <span>{shippingFee === 0 ? <strong className="text-green-600">FREE</strong> : `₹${shippingFee}`}</span>
                          </div>
                          <div className="border-t border-dashed border-accent/10 pt-2 flex justify-between text-sm text-luxury-black font-bold">
                            <span>Total Estimated</span>
                            <span className="text-accent font-serif">₹{cartTotal}</span>
                          </div>
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={() => {
                              onCartClose();
                              setCheckoutStep(1);
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-luxury-black text-white py-3 px-4 rounded-xl text-xs font-semibold tracking-wider uppercase hover:bg-accent hover:text-white transition-all shadow-md hover:shadow-lg active:scale-95"
                          >
                            Proceed to Checkout
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-[10px] text-center text-gray-400 flex items-center justify-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-accent" /> 100% Safe and Secure Checkout
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* Wishlist Drawer */}
        {isWishlistOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden" id="wishlist-drawer-overlay">
            <div className="absolute inset-0 overflow-hidden">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={onWishlistClose}
                className="absolute inset-0 bg-black/60 transition-opacity backdrop-blur-xs"
              />

              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="pointer-events-auto w-screen max-w-md"
                >
                  <div className="flex h-full flex-col bg-luxury-ivory shadow-xl border-l border-accent/20">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-accent/20 px-6 py-5 bg-white">
                      <div className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-accent fill-accent" />
                        <h2 className="text-lg font-medium text-luxury-black font-sans">My Wishlist ({wishlistItems.length})</h2>
                      </div>
                      <button
                        onClick={onWishlistClose}
                        className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                        aria-label="Close wishlist"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                      {wishlistItems.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center py-12">
                          <Heart className="h-16 w-16 text-accent/30 stroke-[1.5] mb-4" />
                          <p className="text-gray-500 font-medium">Your wishlist is empty</p>
                          <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Save premium outfits you love to purchase them later.</p>
                          <button
                            onClick={onWishlistClose}
                            className="mt-6 px-6 py-2.5 bg-luxury-black text-white text-xs font-medium tracking-wider uppercase rounded-full hover:bg-accent hover:text-white transition-colors"
                          >
                            Explore Collections
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {wishlistItems.map((item) => (
                            <div key={item.id} className="flex gap-4 p-3 bg-white rounded-xl border border-accent/10 shadow-card">
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="h-20 w-16 object-cover rounded-md flex-shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                  <h3 className="text-xs font-semibold text-luxury-black truncate font-sans">{item.product.name}</h3>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{item.product.category}</p>
                                  <span className="text-xs font-bold text-luxury-black mt-1 block">₹{item.product.price}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-3">
                                  <button
                                    onClick={() => onAddToCartFromWishlist(item.product)}
                                    className="flex-1 bg-accent hover:bg-accent-dark text-white text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg transition-colors text-center"
                                  >
                                    Add To Cart
                                  </button>
                                  <button
                                    onClick={() => onRemoveFromWishlist(item.id)}
                                    className="rounded-lg border border-red-200 p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                                    aria-label="Remove wishlist"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Dialog */}
      <AnimatePresence>
        {checkoutStep !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" id="checkout-modal-backdrop">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-luxury-ivory rounded-2xl max-w-lg w-full overflow-hidden shadow-luxury border border-accent/20"
            >
              {/* Checkout Wizard Header */}
              <div className="bg-white border-b border-accent/15 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-accent font-sans">Checkout Wizard</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Secure payment & express tailoring booking</p>
                </div>
                <button
                  onClick={() => setCheckoutStep(null)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Steps Indicator */}
              <div className="flex border-b border-accent/10 bg-white/60 text-xs text-gray-500 font-medium">
                <div className={`flex-1 py-3 text-center border-b-2 transition-colors ${checkoutStep === 1 ? 'border-accent text-accent font-bold' : 'border-transparent text-gray-400'}`}>
                  1. Delivery Details
                </div>
                <div className={`flex-1 py-3 text-center border-b-2 transition-colors ${checkoutStep === 2 ? 'border-accent text-accent font-bold' : 'border-transparent'}`}>
                  2. Payment Mode
                </div>
                <div className={`flex-1 py-3 text-center border-b-2 transition-colors ${checkoutStep === 3 ? 'border-accent text-accent font-bold' : 'border-transparent'}`}>
                  3. Success Confirmation
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCheckoutSubmit}>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  {checkoutStep === 1 && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-black">Shipping & Billing Address</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={address.name}
                            onChange={(e) => setAddress({ ...address, name: e.target.value })}
                            placeholder="e.g. Priya Sharma"
                            className="w-full bg-white border border-accent/25 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Mobile Number *</label>
                          <input
                            type="tel"
                            required
                            value={address.phone}
                            onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                            placeholder="e.g. +91 9876543210"
                            className="w-full bg-white border border-accent/25 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Street Address *</label>
                        <input
                          type="text"
                          required
                          value={address.addressLine}
                          onChange={(e) => setAddress({ ...address, addressLine: e.target.value })}
                          placeholder="Apartment, suite, block details"
                          className="w-full bg-white border border-accent/25 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">City *</label>
                          <input
                            type="text"
                            required
                            value={address.city}
                            onChange={(e) => setAddress({ ...address, city: e.target.value })}
                            placeholder="e.g. Bangalore"
                            className="w-full bg-white border border-accent/25 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Pin Code *</label>
                          <input
                            type="text"
                            required
                            value={address.pinCode}
                            onChange={(e) => setAddress({ ...address, pinCode: e.target.value })}
                            placeholder="600001"
                            className="w-full bg-white border border-accent/25 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {checkoutStep === 2 && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-black">Select Payment Option</h4>
                      <div className="space-y-3">
                        <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-accent bg-accent/5' : 'border-gray-200 bg-white hover:border-accent/40'}`}>
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="payment"
                              checked={paymentMethod === 'cod'}
                              onChange={() => setPaymentMethod('cod')}
                              className="accent-accent"
                            />
                            <div>
                              <span className="text-xs font-semibold text-luxury-black block">Cash On Delivery (COD)</span>
                              <span className="text-[10px] text-gray-400">Pay inside your home during delivery</span>
                            </div>
                          </div>
                          <span className="text-xs text-accent font-semibold">Free COD Available</span>
                        </label>

                        <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'upi' ? 'border-accent bg-accent/5' : 'border-gray-200 bg-white hover:border-accent/40'}`}>
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="payment"
                              checked={paymentMethod === 'upi'}
                              onChange={() => setPaymentMethod('upi')}
                              className="accent-accent"
                            />
                            <div>
                              <span className="text-xs font-semibold text-luxury-black block">Instant UPI QR (GPay / PhonePe / Paytm)</span>
                              <span className="text-[10px] text-gray-400">Secure UPI intent response</span>
                            </div>
                          </div>
                          <span className="text-xs text-green-600 font-semibold">Extra ₹50 Off</span>
                        </label>

                        <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-accent bg-accent/5' : 'border-gray-200 bg-white hover:border-accent/40'}`}>
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="payment"
                              checked={paymentMethod === 'card'}
                              onChange={() => setPaymentMethod('card')}
                              className="accent-accent"
                            />
                            <div>
                              <span className="text-xs font-semibold text-luxury-black block">Credit or Debit Card</span>
                              <span className="text-[10px] text-gray-400">Visa, Mastercard, RuPay cards supported</span>
                            </div>
                          </div>
                          <CreditCard className="h-5 w-5 text-accent" />
                        </label>
                      </div>

                      <div className="p-4 bg-white border border-accent/10 rounded-xl space-y-2 mt-4 text-xs text-gray-500">
                        <div className="flex justify-between font-semibold text-luxury-black">
                          <span>Total Amount Payable:</span>
                          <span className="text-accent text-sm font-serif">₹{cartTotal}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {checkoutStep === 3 && (
                    <div className="text-center py-6 space-y-4">
                      <div className="mx-auto h-16 w-16 bg-green-50 rounded-full flex items-center justify-center border border-green-200">
                        <Check className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-bold text-luxury-black font-serif">Your Order is Placed Successfully!</h3>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        Thank you for shopping at <strong>VS Boutique</strong>, {address.name || 'Priya Sharma'}. Your order has been dispatched and our partner tailored expert has been synchronized.
                      </p>
                      
                      <div className="p-4 bg-white border border-accent/15 rounded-xl text-left text-xs space-y-2 max-w-sm mx-auto">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Order ID:</span>
                          <strong className="text-gray-700">#VSB-2026-{(Math.floor(Math.random() * 90000) + 10000)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Delivery To:</span>
                          <span className="text-gray-700">{address.city || 'Bangalore'}, Pin {address.pinCode || '600001'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Charged:</span>
                          <span className="text-accent font-bold">₹{cartTotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Payment Status:</span>
                          <span className="text-green-600 font-bold">{paymentMethod === 'cod' ? 'Pending COD' : 'Paid Success'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="bg-white border-t border-accent/15 px-6 py-4 flex items-center justify-between">
                  {checkoutStep !== 3 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => checkoutStep === 1 ? setCheckoutStep(null) : setCheckoutStep(1)}
                        className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-luxury-black"
                      >
                        {checkoutStep === 1 ? 'Cancel' : 'Back'}
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-2 bg-luxury-black text-white px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase hover:bg-accent transition-colors"
                      >
                        {checkoutStep === 1 ? 'Next: Payment' : `Pay ₹${cartTotal}`}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFinishCheckout}
                      className="w-full bg-luxury-black text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl hover:bg-accent transition-colors text-center"
                    >
                      Return to Storefront
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

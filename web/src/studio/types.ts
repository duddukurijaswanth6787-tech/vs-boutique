/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating: number;
  reviewCount: number;
  image: string;
  tag?: string; // e.g. "Best Seller", "New", "Trending"
  isTrending?: boolean;
  isNewArrival?: boolean;
  description: string;
  colors?: string[];
  sizes?: string[];
  specs?: { [key: string]: string };
}

export interface Category {
  id: string;
  name: string;
  image: string;
  count?: number;
}

export interface Collection {
  id: string;
  title: string;
  subtitle: string;
  image: string;
}

export interface TailoringService {
  id: string;
  name: string;
  subtitle: string;
  priceEstimate: string;
  iconName: string; // Map to Lucide icon string
  description: string;
  durationDays: number;
}

export interface Boutique {
  id: string;
  name: string;
  city: string;
  rating: number;
  reviewCount: number;
  image: string;
  logo: string;
  specialties: string[];
  address: string;
  phone: string;
  verified: boolean;
}

export interface CartItem {
  id: string; // Unique ID (product_id + selected_size + custom_stitching)
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor?: string;
  isCustomStitched: boolean;
  stitchingNotes?: string;
  stitchingPrice: number;
}

export interface WishlistItem {
  id: string;
  product: Product;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  quote: string;
  avatar: string;
  verified: boolean;
}

export interface TailoringBooking {
  serviceId: string;
  boutiqueId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  measurementType: 'standard' | 'manual' | 'at-home';
  standardSize?: string;
  manualMeasurements?: {
    chest?: string;
    waist?: string;
    hips?: string;
    length?: string;
    shoulders?: string;
    sleeves?: string;
  };
  fabricOption: 'provided' | 'boutique';
  additionalInstructions?: string;
  appointmentDate: string;
  appointmentTime: string;
  priceTotal: number;
}

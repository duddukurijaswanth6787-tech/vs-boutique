/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Category, Collection, TailoringService, Boutique, Testimonial } from './types';

export const categories: Category[] = [
  {
    id: 'sarees',
    name: 'Sarees',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=300&auto=format&fit=crop',
    count: 142
  },
  {
    id: 'lehengas',
    name: 'Lehengas',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=300&auto=format&fit=crop',
    count: 85
  },
  {
    id: 'kurtis',
    name: 'Kurtis',
    image: 'https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=300&auto=format&fit=crop',
    count: 194
  },
  {
    id: 'dresses',
    name: 'Dresses',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=300&auto=format&fit=crop',
    count: 110
  },
  {
    id: 'menswear',
    name: 'Menswear',
    image: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?q=80&w=300&auto=format&fit=crop',
    count: 75
  },
  {
    id: 'kidswear',
    name: 'Kidswear',
    image: 'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?q=80&w=300&auto=format&fit=crop',
    count: 62
  },
  {
    id: 'blouses',
    name: 'Blouses',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=300&auto=format&fit=crop',
    count: 95
  },
  {
    id: 'fabrics',
    name: 'Fabrics',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop',
    count: 120
  },
  {
    id: 'accessories',
    name: 'Accessories',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=300&auto=format&fit=crop',
    count: 150
  },
  {
    id: 'custom_design',
    name: 'Custom Design',
    image: 'https://images.unsplash.com/photo-1558603668-6570496b66f8?q=80&w=300&auto=format&fit=crop',
    count: 45
  }
];

export const collections: Collection[] = [
  {
    id: 'festive_edit',
    title: 'Festive Edit',
    subtitle: 'For Every Celebration',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=500&auto=format&fit=crop'
  },
  {
    id: 'designer_picks',
    title: 'Designer Picks',
    subtitle: 'Handpicked Just For You',
    image: 'https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=500&auto=format&fit=crop'
  },
  {
    id: 'wedding_collection',
    title: 'Wedding Collection',
    subtitle: 'Make Every Moment Special',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=500&auto=format&fit=crop'
  },
  {
    id: 'lounge_wear',
    title: 'Lounge Wear',
    subtitle: 'Comfort Meets Style',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=500&auto=format&fit=crop'
  }
];

export const products: Product[] = [
  // New Arrivals
  {
    id: 'na_1',
    name: 'Embroidered Anarkali Suit',
    category: 'Kurtis',
    price: 2999,
    originalPrice: 4999,
    discountPercent: 40,
    rating: 4.8,
    reviewCount: 120,
    image: 'https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=400&auto=format&fit=crop',
    tag: 'New',
    isNewArrival: true,
    description: 'A beautiful embroidered Anarkali suit featuring detailed hand-thread embroidery, made with premium soft georgette fabric. Ideal for elegant festive dinners and evening gatherings.',
    colors: ['Gold', 'Ivory', 'Ruby Red'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    specs: {
      'Fabric': 'Faux Georgette',
      'Inner Fabric': 'Micro Cotton',
      'Work': 'Heavy Thread Embroidery & Sequins',
      'Stitch Type': 'Semi-Stitched / Custom Fitting available',
      'Care': 'Dry Clean Only'
    }
  },
  {
    id: 'na_2',
    name: 'Designer Lehenga Choli',
    category: 'Lehengas',
    price: 6499,
    originalPrice: 9999,
    discountPercent: 35,
    rating: 4.9,
    reviewCount: 95,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=400&auto=format&fit=crop',
    tag: 'Trending',
    isNewArrival: true,
    description: 'Make a statement in this masterfully crafted Designer Lehenga Choli. Embroidered with delicate floral thread work, metallic sequence detailing, and a matching sheer net dupatta.',
    colors: ['Blush Pink', 'Emerald Green', 'Maroon'],
    sizes: ['S', 'M', 'L', 'XL'],
    specs: {
      'Lehenga Fabric': 'Soft Velvet',
      'Choli Fabric': 'Soft Velvet',
      'Dupatta Fabric': 'Soft Net with Border Lace',
      'Embroidery': 'Zardozi and Sequins',
      'Waist Size': 'Supported up to 42 inches'
    }
  },
  {
    id: 'na_3',
    name: 'Silk Saree with Blouse',
    category: 'Sarees',
    price: 1999,
    originalPrice: 3299,
    discountPercent: 39,
    rating: 4.7,
    reviewCount: 210,
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=400&auto=format&fit=crop',
    tag: 'Best Seller',
    isNewArrival: true,
    description: 'This gorgeous Kanchipuram art silk saree features a heavy golden zari border and a rich pallu. Comes with an unstitched blouse piece that can be custom tailored at our partner boutiques.',
    colors: ['Royal Blue', 'Mustard Yellow', 'Crimson'],
    sizes: ['Free Size'],
    specs: {
      'Saree Length': '5.5 meters',
      'Blouse Length': '0.8 meters (Unstitched)',
      'Fabric': 'Art Silk Blend',
      'Zari': 'Golden Metallic Thread Yarn',
      'Occasion': 'Wedding, Festive ceremonies'
    }
  },
  {
    id: 'na_4',
    name: 'Party Wear Gown',
    category: 'Dresses',
    price: 3499,
    originalPrice: 5499,
    discountPercent: 36,
    rating: 4.8,
    reviewCount: 84,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=400&auto=format&fit=crop',
    isNewArrival: true,
    description: 'Captivate the room in this floor-sweeping modern gown featuring traditional ethnic elements, high-grade georgette layers, and a hand-beaded yoke line.',
    colors: ['Wine', 'Navy Blue', 'Teal'],
    sizes: ['S', 'M', 'L', 'XL'],
    specs: {
      'Fabric': 'Heavy Faux Georgette',
      'Work': 'Handmade Stones & Golden Beads',
      'Style': 'Ankle Length Maxi Flared Gown',
      'Inner Layer': 'Comfortable Santoon Cotton'
    }
  },
  {
    id: 'na_5',
    name: 'Embroidered Kurti',
    category: 'Kurtis',
    price: 1299,
    originalPrice: 2099,
    discountPercent: 38,
    rating: 4.6,
    reviewCount: 145,
    image: 'https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=400&auto=format&fit=crop',
    isNewArrival: true,
    description: 'A versatile day-to-evening lightweight kurti with delicate Lucknowi Chikankari shadow embroidery on the front panel. Elegant, breezy, and incredibly soft.',
    colors: ['Sky Blue', 'Peach', 'Mint Green'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    specs: {
      'Fabric': 'Pure Cambric Cotton',
      'Work': 'Hand Chikankari shadow stitch',
      'Length': '44 inches (Knee length)',
      'Care': 'Gentle Hand Wash'
    }
  },

  // Trending Now
  {
    id: 'tr_1',
    name: 'Banarasi Silk Saree',
    category: 'Sarees',
    price: 2799,
    originalPrice: 3999,
    discountPercent: 30,
    rating: 4.9,
    reviewCount: 310,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=400&auto=format&fit=crop',
    tag: 'Trending',
    isTrending: true,
    description: 'Woven with absolute precision, this Banarasi silk saree holds beautiful traditional floral motifs and a rich heavy pallu. Symbolizes pure luxury and fine craftsmanship.',
    colors: ['Bright Red', 'Saffron Orange', 'Deep Magenta'],
    sizes: ['Free Size'],
    specs: {
      'Fabric': 'Fine Banarasi Art Silk',
      'Work': 'Detailed Golden Thread Brocade Zari',
      'Length': '5.5 meters',
      'Blouse Piece': 'Included (0.8m plain silk with zari border)'
    }
  },
  {
    id: 'tr_2',
    name: 'Designer Sharara Set',
    category: 'Kurtis',
    price: 3999,
    originalPrice: 6499,
    discountPercent: 38,
    rating: 4.8,
    reviewCount: 68,
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=400&auto=format&fit=crop',
    tag: 'Hot Item',
    isTrending: true,
    description: 'Turn heads in this chic Sharara Set. Featuring a short flared kurti embellished with gotta-patti laces, paired with matching heavy flared sharara bottoms and an organza dupatta.',
    colors: ['Mustard Gold', 'Mint Sage', 'Lilac'],
    sizes: ['S', 'M', 'L', 'XL'],
    specs: {
      'Kurti Fabric': 'Pure Cotton Slub',
      'Sharara Fabric': 'Pure Cotton Slub with heavy inner lining',
      'Dupatta': 'Digital Printed Floral Organza',
      'Lace Work': 'Gotta Patti and Gota Borders'
    }
  },
  {
    id: 'tr_3',
    name: 'Readymade Blouse',
    category: 'Blouses',
    price: 799,
    originalPrice: 1299,
    discountPercent: 38,
    rating: 4.5,
    reviewCount: 180,
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=400&auto=format&fit=crop',
    tag: 'Must Have',
    isTrending: true,
    description: 'This readymade designer padded blouse comes with a luxury sweetheart neck and back hook closure. Crafted in soft brocade silk with margins for easy resizing.',
    colors: ['Golden Gold', 'Silver', 'Black', 'Bright Red'],
    sizes: ['34', '36', '38', '40', '42'],
    specs: {
      'Fabric': 'Brocade Silk with Cotton Lining',
      'Padding': 'Included (Removable cups)',
      'Sleeves': 'Short cap sleeves included inside',
      'Closure': 'Back closure hooks with tassels'
    }
  }
];

export const tailoringServices: TailoringService[] = [
  {
    id: 'cust_stitch',
    name: 'Custom Stitching',
    subtitle: 'Perfect fit, just for you',
    priceEstimate: 'From ₹1,200',
    iconName: 'Scissors',
    description: 'Full bespoke tailoring services starting from scratch. Bring your own fabric or purchase high-end silks and georgettes from our partner boutiques.',
    durationDays: 7
  },
  {
    id: 'blouse_stitch',
    name: 'Blouse Stitching',
    subtitle: 'Designer blouse stitching',
    priceEstimate: 'From ₹800',
    iconName: 'Sparkles',
    description: 'Custom backless, sweetheart, halterneck, or traditional blouses styled perfectly to pair with your favorite luxury sarees.',
    durationDays: 5
  },
  {
    id: 'alterations',
    name: 'Alterations',
    subtitle: 'We alter, you adore',
    priceEstimate: 'From ₹250',
    iconName: 'Undo',
    description: 'Seamless resizing, length adjustments, hem lining additions, or sleeve custom-fitting on any pre-owned or newly purchased outfit.',
    durationDays: 2
  },
  {
    id: 'wedding_outfit',
    name: 'Wedding Outfit',
    subtitle: 'Bespoke wedding wear',
    priceEstimate: 'From ₹5,000',
    iconName: 'Heart',
    description: 'Exclusive bridal master-tailors dedicated to crafting your dream bridal lehengas, heavy anarkalis, or grooms sherwanis with meticulous fitting sessions.',
    durationDays: 14
  },
  {
    id: 'kids_stitch',
    name: 'Kids Stitching',
    subtitle: 'Stylish & comfy outfits',
    priceEstimate: 'From ₹600',
    iconName: 'UserCheck',
    description: 'Fun, miniature traditional clothing for boys and girls made with soft organic skin-friendly cotton linings so they stay active and happy.',
    durationDays: 5
  },
  {
    id: 'express_delivery',
    name: 'Express Delivery',
    subtitle: 'On-time delivery',
    priceEstimate: '+₹500 flat fee',
    iconName: 'Truck',
    description: 'Need an outfit tailored immediately for an unplanned party? Activate Express Delivery to get your customized garment in under 48 hours.',
    durationDays: 2
  },
  {
    id: 'fabric_consult',
    name: 'Fabric Consultation',
    subtitle: 'Choose the best',
    priceEstimate: 'Free of Cost',
    iconName: 'Feather',
    description: 'Unsure which fabric maps to your dream design? Sit down with our fabric specialists to review samples, weights, falls, and styling advice.',
    durationDays: 1
  }
];

export const boutiques: Boutique[] = [
  {
    id: 'bt_1',
    name: 'Elegance House',
    city: 'Chennai',
    rating: 4.8,
    reviewCount: 340,
    image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=400&auto=format&fit=crop',
    logo: 'EH',
    specialties: ['Custom Bridal Lehengas', 'Embroidered Sarees', 'Blouses'],
    address: '12 Khader Nawaz Khan Road, Nungambakkam, Chennai, TN 600006',
    phone: '+91 94440 12345',
    verified: true
  },
  {
    id: 'bt_2',
    name: 'Sakhi Couture',
    city: 'Hyderabad',
    rating: 4.7,
    reviewCount: 280,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=400&auto=format&fit=crop',
    logo: 'SC',
    specialties: ['Zardozi Work', 'Custom Fitting Anarkalis', 'Kurtis'],
    address: 'Plot 45 Road No. 36, Jubilee Hills, Hyderabad, TS 500033',
    phone: '+91 90000 98765',
    verified: true
  },
  {
    id: 'bt_3',
    name: 'Thread & Needles',
    city: 'Bangalore',
    rating: 4.9,
    reviewCount: 420,
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400&auto=format&fit=crop',
    logo: 'TN',
    specialties: ['Indo-Western Gowns', 'Designer Blouses', 'Alterations'],
    address: '158 100 Feet Road, Indiranagar, Bangalore, KA 560038',
    phone: '+91 80222 55555',
    verified: true
  },
  {
    id: 'bt_4',
    name: 'Vastra House',
    city: 'Mumbai',
    rating: 4.6,
    reviewCount: 195,
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=400&auto=format&fit=crop',
    logo: 'VH',
    specialties: ['Premium Silk Sarees', 'Traditional Drapes', 'Kids Ethnic Wear'],
    address: '52 Linking Road, Santacruz West, Mumbai, MH 400054',
    phone: '+91 98200 44321',
    verified: true
  },
  {
    id: 'bt_5',
    name: 'Ethnic Studio',
    city: 'Delhi',
    rating: 4.8,
    reviewCount: 510,
    image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=400&auto=format&fit=crop',
    logo: 'ES',
    specialties: ['Heavily Embroidered Outfits', 'Banarasi Weaves', 'Dupatta Crafting'],
    address: 'Block E Central Market, Lajpat Nagar II, New Delhi, DL 110024',
    phone: '+91 98111 22233',
    verified: true
  },
  {
    id: 'bt_6',
    name: 'The Fabric Story',
    city: 'Kolkata',
    rating: 4.7,
    reviewCount: 165,
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=400&auto=format&fit=crop',
    logo: 'FS',
    specialties: ['Handloom Sarees', 'Kantha Embroidery', 'Custom Kurta Pajamas'],
    address: '25 Park Street, Chowringhee, Kolkata, WB 700016',
    phone: '+91 93300 11223',
    verified: true
  }
];

export const testimonials: Testimonial[] = [
  {
    id: 't_1',
    name: 'Priya S.',
    location: 'Bangalore',
    rating: 5,
    quote: 'The fabric quality is amazing and the stitching is absolutely perfect! I had a custom blouse made for my sister\'s wedding by Thread & Needles, and it fits like a glove. Highly recommend the bespoke tailoring experience!',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
    verified: true
  },
  {
    id: 't_2',
    name: 'Ananya R.',
    location: 'Chennai',
    rating: 5,
    quote: 'I purchased the Designer Lehenga Choli and utilized the custom stitching option at Elegance House. The tailoring masters were extremely professional, scheduling a virtual video fitting call to ensure all measurements were precise. Excellent service!',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop',
    verified: true
  },
  {
    id: 't_3',
    name: 'Meera K.',
    location: 'Hyderabad',
    rating: 5,
    quote: 'VS Boutique has made ethnic shopping so stress-free. Choosing my saree online and instantly booking a tailoring session in Sakhi Couture saved me days of running around markets. Simply brilliant integration!',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop',
    verified: true
  }
];

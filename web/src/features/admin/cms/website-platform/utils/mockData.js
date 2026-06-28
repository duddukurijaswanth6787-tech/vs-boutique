export const INITIAL_BLUEPRINTS = [
  {
    id: "boutique-standard-id",
    name: "Boutique Standard",
    description: "Standard blueprint contract optimized for high-end luxury apparel and retail storefronts.",
    version: "v1.0.0",
    businessType: "Apparel & Retail",
    category: "Luxury",
    status: "Active",
    lastUpdated: "2 hours ago",
    pages: {
      core: {
        Home: "required",
        Shop: "required",
        Product: "required",
        Cart: "required",
        Checkout: "required"
      },
      business: {
        About: "optional",
        Contact: "required",
        Gallery: "optional",
        Blog: "optional"
      },
      legal: {
        "Privacy Policy": "required",
        "Refund Policy": "required",
        "Shipping Policy": "required",
        "Terms & Conditions": "required"
      }
    },
    sections: {
      Hero: "required",
      "Featured Categories": "required",
      "Featured Products": "required",
      Collections: "optional",
      Testimonials: "optional",
      Reviews: "required",
      Instagram: "optional",
      Newsletter: "required",
      Footer: "required"
    },
    cmsFields: {
      Brand: "required",
      Business: "required",
      Contact: "required",
      SEO: "required",
      Policies: "required",
      "Social Media": "optional",
      "Google Maps": "optional",
      "Banner Images": "required",
      Logo: "required",
      Footer: "required"
    },
    apis: {
      Authentication: "required",
      Products: "required",
      Categories: "required",
      Orders: "required",
      Customers: "required",
      Wishlist: "optional",
      Cart: "required",
      Checkout: "required",
      Reviews: "required",
      Blogs: "optional",
      Coupons: "optional"
    },
    features: {
      Search: "required",
      Wishlist: "optional",
      Cart: "required",
      Checkout: "required",
      Reviews: "required",
      Coupons: "optional",
      Blogs: "optional",
      "Live Chat": "optional",
      WhatsApp: "required",
      Analytics: "required"
    },
    responsive: {
      Desktop: true,
      Laptop: true,
      Tablet: true,
      Mobile: true,
      minResolution: "320px"
    },
    performance: {
      Performance: 90,
      SEO: 95,
      Accessibility: 90,
      "Best Practices": 95
    },
    security: {
      HTTPS: true,
      "No Secrets": true,
      "Sanitized Inputs": true,
      "Dependency Scan": true,
      "Content Security Policy": true,
      "Rate Limiting": true,
      "Security Headers": true
    },
    accessibility: {
      "Keyboard Navigation": true,
      "Alt Text": true,
      "Color Contrast": true,
      "ARIA Labels": true
    },
    seo: {
      "Meta Tags": true,
      "Open Graph": true,
      "Structured Data": true,
      "Canonical URLs": true,
      Robots: true,
      Sitemap: true
    }
  },
  {
    id: "restaurant-standard-id",
    name: "Restaurant Standard",
    description: "Blueprint tailored for food services, table booking, and local online ordering.",
    version: "v1.2.0",
    businessType: "Food & Beverage",
    category: "Casual Dining",
    status: "Active",
    lastUpdated: "Yesterday",
    pages: {
      core: {
        Home: "required",
        Shop: "disabled",
        Product: "required",
        Cart: "required",
        Checkout: "required"
      },
      business: {
        About: "required",
        Contact: "required",
        Gallery: "required",
        Blog: "optional"
      },
      legal: {
        "Privacy Policy": "required",
        "Refund Policy": "optional",
        "Shipping Policy": "disabled",
        "Terms & Conditions": "required"
      }
    },
    sections: {
      Hero: "required",
      "Featured Categories": "required",
      "Featured Products": "required",
      Collections: "disabled",
      Testimonials: "required",
      Reviews: "required",
      Instagram: "required",
      Newsletter: "optional",
      Footer: "required"
    },
    cmsFields: {
      Brand: "required",
      Business: "required",
      Contact: "required",
      SEO: "required",
      Policies: "optional",
      "Social Media": "required",
      "Google Maps": "required",
      "Banner Images": "required",
      Logo: "required",
      Footer: "required"
    },
    apis: {
      Authentication: "optional",
      Products: "required",
      Categories: "required",
      Orders: "required",
      Customers: "optional",
      Wishlist: "disabled",
      Cart: "required",
      Checkout: "required",
      Reviews: "optional",
      Blogs: "optional",
      Coupons: "optional"
    },
    features: {
      Search: "optional",
      Wishlist: "disabled",
      Cart: "required",
      Checkout: "required",
      Reviews: "optional",
      Coupons: "optional",
      Blogs: "disabled",
      "Live Chat": "optional",
      WhatsApp: "required",
      Analytics: "required"
    },
    responsive: {
      Desktop: true,
      Laptop: true,
      Tablet: true,
      Mobile: true,
      minResolution: "360px"
    },
    performance: {
      Performance: 85,
      SEO: 90,
      Accessibility: 95,
      "Best Practices": 90
    },
    security: {
      HTTPS: true,
      "No Secrets": true,
      "Sanitized Inputs": true,
      "Dependency Scan": false,
      "Content Security Policy": true,
      "Rate Limiting": true,
      "Security Headers": false
    },
    accessibility: {
      "Keyboard Navigation": true,
      "Alt Text": true,
      "Color Contrast": true,
      "ARIA Labels": false
    },
    seo: {
      "Meta Tags": true,
      "Open Graph": true,
      "Structured Data": true,
      "Canonical URLs": false,
      Robots: true,
      Sitemap: true
    }
  },
  {
    id: "salon-standard-id",
    name: "Salon Standard",
    description: "Design parameters for luxury beauty parlors and personal care appointment workflows.",
    version: "v1.0.0",
    businessType: "Beauty & Wellness",
    category: "Salon",
    status: "Draft",
    lastUpdated: "3 days ago",
    pages: {
      core: {
        Home: "required",
        Shop: "optional",
        Product: "optional",
        Cart: "optional",
        Checkout: "optional"
      },
      business: {
        About: "required",
        Contact: "required",
        Gallery: "required",
        Blog: "optional"
      },
      legal: {
        "Privacy Policy": "required",
        "Refund Policy": "disabled",
        "Shipping Policy": "disabled",
        "Terms & Conditions": "required"
      }
    },
    sections: {
      Hero: "required",
      "Featured Categories": "optional",
      "Featured Products": "optional",
      Collections: "optional",
      Testimonials: "required",
      Reviews: "required",
      Instagram: "required",
      Newsletter: "optional",
      Footer: "required"
    },
    cmsFields: {
      Brand: "required",
      Business: "required",
      Contact: "required",
      SEO: "optional",
      Policies: "hidden",
      "Social Media": "required",
      "Google Maps": "required",
      "Banner Images": "required",
      Logo: "required",
      Footer: "required"
    },
    apis: {
      Authentication: "required",
      Products: "optional",
      Categories: "optional",
      Orders: "optional",
      Customers: "required",
      Wishlist: "disabled",
      Cart: "optional",
      Checkout: "optional",
      Reviews: "required",
      Blogs: "optional",
      Coupons: "optional"
    },
    features: {
      Search: "optional",
      Wishlist: "disabled",
      Cart: "optional",
      Checkout: "optional",
      Reviews: "required",
      Coupons: "optional",
      Blogs: "optional",
      "Live Chat": "optional",
      WhatsApp: "required",
      Analytics: "optional"
    },
    responsive: {
      Desktop: true,
      Laptop: true,
      Tablet: true,
      Mobile: true,
      minResolution: "320px"
    },
    performance: {
      Performance: 90,
      SEO: 90,
      Accessibility: 90,
      "Best Practices": 90
    },
    security: {
      HTTPS: true,
      "No Secrets": true,
      "Sanitized Inputs": true,
      "Dependency Scan": true,
      "Content Security Policy": false,
      "Rate Limiting": false,
      "Security Headers": false
    },
    accessibility: {
      "Keyboard Navigation": true,
      "Alt Text": true,
      "Color Contrast": true,
      "ARIA Labels": true
    },
    seo: {
      "Meta Tags": true,
      "Open Graph": false,
      "Structured Data": false,
      "Canonical URLs": false,
      Robots: true,
      Sitemap: false
    }
  }
];

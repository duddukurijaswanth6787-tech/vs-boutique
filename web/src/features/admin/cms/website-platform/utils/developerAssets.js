// Central Developer Asset Registry for the CMS
// Shared by Website Standards, Website Blueprint, Validation Engine, AI Certification, and Prompt Generator.

export const SHARED_FOLDER_TREES = {
  reactViteBase: [
    { name: "src/", type: "folder", indent: 0 },
    { name: "components/", type: "folder", indent: 1 },
    { name: "ProductCard.jsx", type: "file", indent: 2 },
    { name: "Header.jsx", type: "file", indent: 2 },
    { name: "pages/", type: "folder", indent: 1 },
    { name: "Home.jsx", type: "file", indent: 2 },
    { name: "ProductDetail.jsx", type: "file", indent: 2 },
    { name: "hooks/", type: "folder", indent: 1 },
    { name: "useCart.js", type: "file", indent: 2 },
    { name: "services/", type: "folder", indent: 1 },
    { name: "api.js", type: "file", indent: 2 },
    { name: "manifest.json", type: "file", indent: 0 },
    { name: "vite.config.js", type: "file", indent: 0 },
    { name: "package.json", type: "file", indent: 0 }
  ]
};

export const SHARED_API_CONTRACTS = {
  getProducts: {
    endpoint: "/api/v1/products",
    method: "GET",
    authentication: "None (Public)",
    permissions: "customer:read",
    request: {
      headers: { "Content-Type": "application/json" },
      params: { "limit": 10, "page": 1 }
    },
    response: {
      success: true,
      data: [
        { id: "p-1", name: "Premium Shirt", price: 120.00, stock: 15 }
      ]
    },
    validation: "AST scanning checks that api requests handle timeout key parameters.",
    errors: {
      "401": "Unauthorized token",
      "404": "Products category not found"
    },
    examples: "axios.get('/api/v1/products', { params: { limit: 10 }, timeout: 10000 })",
    futureRules: "Matches output payload fields to prevent runtime parsing crash."
  }
};

export const SHARED_PROMPTS = {
  homepage: {
    id: "prompt-homepage-boutique",
    title: "Homepage Prompt",
    category: "Visual Layouts",
    businessType: "Apparel & Retail",
    description: "Generates a fully responsive boutique homepage component mapping Hero slider, categories, and reviews.",
    prompt: "Build a responsive React homepage component for an e-commerce boutique. It must import components from '@/components/Header' and '@/components/Footer'. For styling, rely fully on Tailwind CSS classes. Define elements for a Hero banner with text overlay, a grid container of products, and a newsletter sign-up form. Use alt properties on all images.",
    variables: {
      "Header Path": "@/components/Header",
      "Footer Path": "@/components/Footer",
      "Styling Engine": "Tailwind CSS"
    },
    expectedOutput: "A single React component displaying responsive hero, grid collections, and alt-tag optimized images.",
    supportedAIModels: ["Claude 3.5 Sonnet", "GPT-4o", "Gemini 1.5 Pro"],
    tags: ["Homepage", "E-commerce"],
    version: "v1.1.0"
  }
};

export const SHARED_STARTERS = [
  {
    name: "Boutique Starter",
    category: "Apparel & Retail",
    features: ["Product Filters", "Shopping Cart", "WhatsApp Contact"],
    apisCount: 5,
    tier: "Starter",
    compatibility: "React 18 / Vite 5",
    requiredModules: ["Products API", "Cart API", "Orders API"]
  },
  {
    name: "Restaurant Starter",
    category: "Food & Beverage",
    features: ["Online Ordering", "Table Reservation", "Interactive Menu"],
    apisCount: 7,
    tier: "Pro",
    compatibility: "React 18 / Vite 5",
    requiredModules: ["Products API", "Bookings API", "Cart API"]
  },
  {
    name: "Salon Starter",
    category: "Beauty & Wellness",
    features: ["Booking Scheduler", "Staff Profiles", "Service Gallery"],
    apisCount: 4,
    tier: "Pro",
    compatibility: "React 18 / Vite 5",
    requiredModules: ["Bookings API", "Customers API"]
  }
];

export const SHARED_SCHEMAS = {
  manifest: {
    branding: {
      businessName: "VS Apparel Studio",
      logoUrl: "https://cdn.vsboutique.com/logo.png",
      whatsappNumber: "+919999999999"
    },
    theme: {
      primaryColor: "#C5A059",
      fontFamily: "Inter, sans-serif",
      darkModeEnabled: true
    }
  }
};

import {
  SHARED_FOLDER_TREES,
  SHARED_API_CONTRACTS,
  SHARED_PROMPTS,
  SHARED_STARTERS,
  SHARED_SCHEMAS
} from './developerAssets';

export const WDK_CHAPTERS = [
  {
    id: "wdk-intro",
    slug: "introduction",
    title: "Introduction",
    icon: "Globe",
    description: "Overview of the Antigravity Website Development Kit (WDK) specifications, architectural guidelines, and AI integration workflow.",
    version: "v1.0.0",
    category: "Get Started",
    difficulty: "Easy",
    estimatedReadingTime: "4 mins",
    lastUpdated: "2026-06-28T12:00:00Z",
    searchKeywords: ["introduction", "architecture", "wdk", "developer", "concept", "lifecycle"],
    relatedDocuments: ["folder-structure", "component-library"],
    futureConsumers: ["Upload Website", "AI Certification"],
    versionHistory: [
      { version: "v1.0.0", created: "2026-06-20T10:00:00Z", author: "Super Admin", status: "Published" }
    ],
    sections: [
      {
        type: "text",
        heading: "Operating System for AI Websites",
        body: "The Website Development Kit (WDK) defines the precise engineering contract between the Antigravity CMS, human developers, and autonomous code generator tools (Claude Code, ChatGPT, Bolt, Lovable). Any template that satisfies the WDK specifications compiles cleanly, passes AI Certification, and deploys instantly onto our global high-speed edge CDN."
      },
      {
        type: "tip",
        heading: "AI Developer Instruction",
        body: "You can copy WDK prompts directly into Cursor or ChatGPT to generate compliant React codebases. The resulting outputs will satisfy all CMS layout rules automatically."
      },
      {
        type: "terminal",
        heading: "Quick Start Setup",
        command: "npm install @antigravity/wdk-cli --global",
        cwd: "~"
      }
    ]
  },
  {
    id: "wdk-structure",
    slug: "folder-structure",
    title: "Folder Structure",
    icon: "Layers",
    description: "Detailed file tree specifications, naming rules, and location conventions for static template codebases.",
    version: "v1.0.0",
    category: "Structure",
    difficulty: "Intermediate",
    estimatedReadingTime: "5 mins",
    lastUpdated: "2026-06-28T12:00:00Z",
    searchKeywords: ["folder", "structure", "directories", "files", "entrypoint", "manifest"],
    relatedDocuments: ["introduction", "naming-convention"],
    futureConsumers: ["Validation Engine", "Upload Website"],
    versionHistory: [
      { version: "v1.0.0", created: "2026-06-22T09:00:00Z", author: "Platform Architect", status: "Published" }
    ],
    sections: [
      {
        type: "text",
        heading: "Required Directory Layout",
        body: "Vite template uploads must structure files inside the root directory as follows. The validation engine will execute directory checks to verify directory paths before launching compilers."
      },
      {
        type: "folder",
        heading: "Boutique Base File Tree",
        treeData: SHARED_FOLDER_TREES.reactViteBase
      },
      {
        type: "warning",
        heading: "Restricted Root Modifications",
        body: "Do not place source React components in root. All code files must reside in src/ to prevent bundler tree-shaking failures."
      }
    ]
  },
  {
    id: "wdk-components",
    slug: "component-library",
    title: "Component Library",
    icon: "Cpu",
    description: "Developer guidelines for modular component structure, React hooks rules, and UI parameters contracts.",
    version: "v1.0.2",
    category: "UI Standards",
    difficulty: "Intermediate",
    estimatedReadingTime: "6 mins",
    lastUpdated: "2026-06-28T14:00:00Z",
    searchKeywords: ["component", "atomic", "props", "hooks", "jsx", "tailwind"],
    relatedDocuments: ["folder-structure", "theme-system"],
    futureConsumers: ["AI Certification", "Template Builder"],
    versionHistory: [
      { version: "v1.0.2", created: "2026-06-25T11:00:00Z", author: "Lead UX Engineer", status: "Published" },
      { version: "v1.0.0", created: "2026-06-22T10:00:00Z", author: "Platform Architect", status: "Deprecated" }
    ],
    sections: [
      {
        type: "text",
        heading: "Atomic Design Philosophy",
        body: "WDK templates expect presentation components to be modular. Avoid inline stylesheet objects; rely fully on Tailwind CSS utility variables to allow CMS color theme overrides."
      },
      {
        type: "code",
        heading: "Compliant Product Card Component",
        codeBlocks: [
          {
            language: "javascript",
            label: "ProductCard.jsx (JavaScript)",
            code: `import React from 'react';\n\nexport default function ProductCard({ product, onAddToCart }) {\n  return (\n    <div className="border border-gray-100 hover:shadow-lg rounded-2xl p-4 transition-all duration-200">\n      <img src={product.image} alt={product.name} className="h-48 w-full object-cover rounded-xl" />\n      <h3 className="font-bold text-gray-800 text-sm mt-3">{product.name}</h3>\n      <p className="text-xs text-gray-500 mt-1">{product.price}</p>\n      <button onClick={() => onAddToCart(product)} className="w-full mt-4 bg-primary text-white py-2 rounded-xl text-xs font-bold">\n        Add to Cart\n      </button>\n    </div>\n  );\n}`
          },
          {
            language: "typescript",
            label: "ProductCard.tsx (TypeScript)",
            code: `import React from 'react';\n\ninterface Product {\n  id: string;\n  name: string;\n  price: string;\n  image: string;\n}\n\ninterface CardProps {\n  product: Product;\n  onAddToCart: (p: Product) => void;\n}\n\nexport default function ProductCard({ product, onAddToCart }: CardProps) {\n  return (\n    <div className="border border-gray-100 hover:shadow-lg rounded-2xl p-4 transition-all duration-200">\n      <img src={product.image} alt={product.name} className="h-48 w-full object-cover rounded-xl" />\n      <h3 className="font-bold text-gray-800 text-sm mt-3">{product.name}</h3>\n      <button onClick={() => onAddToCart(product)} className="w-full mt-4 bg-primary text-white py-2 rounded-xl text-xs font-bold">\n        Add to Cart\n      </button>\n    </div>\n  );\n}`
          }
        ]
      }
    ]
  },
  {
    id: "wdk-api",
    slug: "api-sdk",
    title: "API SDK Specs",
    icon: "Globe",
    description: "Interface definitions for API endpoints, request headers, error models, and retry logic contracts.",
    version: "v1.1.0",
    category: "Integration",
    difficulty: "Advanced",
    estimatedReadingTime: "8 mins",
    lastUpdated: "2026-06-28T15:00:00Z",
    searchKeywords: ["api", "endpoints", "axios", "fetch", "request", "response", "json"],
    relatedDocuments: ["cms-integration"],
    futureConsumers: ["Validation Engine", "AI Certification"],
    versionHistory: [
      { version: "v1.1.0", created: "2026-06-26T14:30:00Z", author: "Lead Backend Developer", status: "Published" }
    ],
    sections: [
      {
        type: "text",
        heading: "Standard Request Configurations",
        body: "All template network requests must utilize the global API client instance containing preset timeouts. This enables validation engines to audit routes compatibility."
      },
      {
        type: "api",
        heading: "GET Products List contract",
        apiData: SHARED_API_CONTRACTS.getProducts
      }
    ]
  },
  {
    id: "wdk-cms",
    slug: "cms-integration",
    title: "CMS Integration Rules",
    icon: "Settings",
    description: "Map static HTML components dynamically to CMS properties configurations edited by boutique owners.",
    version: "v1.0.0",
    category: "Integration",
    difficulty: "Intermediate",
    estimatedReadingTime: "5 mins",
    lastUpdated: "2026-06-28T10:00:00Z",
    searchKeywords: ["cms", "editable", "fields", "branding", "configuration", "theme", "logo"],
    relatedDocuments: ["api-sdk"],
    futureConsumers: ["AI Agents", "Prompt Generator"],
    versionHistory: [
      { version: "v1.0.0", created: "2026-06-20T12:00:00Z", author: "Platform Architect", status: "Published" }
    ],
    sections: [
      {
        type: "text",
        heading: "Branding Configuration Mapping",
        body: "All editable attributes (e.g. logos, business names, support phone) must read values from the global site settings config payload injected during deployment compiles."
      },
      {
        type: "json",
        heading: "Settings Manifest Schema",
        jsonSchema: SHARED_SCHEMAS.manifest
      }
    ]
  },
  {
    id: "wdk-prompts",
    slug: "prompt-library",
    title: "AI Prompt Library",
    icon: "Cpu",
    description: "Standard prompts engineered to write manifest-compliant codebases with AI builders.",
    version: "v1.2.0",
    category: "AI Prompts",
    difficulty: "Easy",
    estimatedReadingTime: "10 mins",
    lastUpdated: "2026-06-28T16:00:00Z",
    searchKeywords: ["prompt", "chatgpt", "claude", "lovable", "bolt", "generation", "contract"],
    relatedDocuments: ["introduction", "component-library"],
    futureConsumers: ["Prompt Generator", "Marketplace"],
    versionHistory: [
      { version: "v1.2.0", created: "2026-06-28T15:00:00Z", author: "Prompt Specialist", status: "Published" }
    ],
    sections: [
      {
        type: "text",
        heading: "Compliant Prompt Boilerplates",
        body: "Feed these prompt templates directly into generative engines (Claude, ChatGPT) to compile pages matching sitemap, design tokens, and AST folder standards."
      },
      {
        type: "prompt",
        heading: "Boutique Homepage Prompt",
        promptData: SHARED_PROMPTS.homepage
      }
    ]
  },
  {
    id: "wdk-starters",
    slug: "starter-templates",
    title: "Starter Templates",
    icon: "Layers",
    description: "Mock preview packages demonstrating baseline setups for common retail verticals.",
    version: "v1.0.0",
    category: "Starters",
    difficulty: "Easy",
    estimatedReadingTime: "3 mins",
    lastUpdated: "2026-06-28T16:00:00Z",
    searchKeywords: ["starters", "boilerplate", "boutique", "restaurant", "salon", "pharmacy"],
    relatedDocuments: ["folder-structure"],
    futureConsumers: ["Marketplace", "Website Generator"],
    versionHistory: [
      { version: "v1.0.0", created: "2026-06-28T16:00:00Z", author: "Platform Architect", status: "Published" }
    ],
    sections: [
      {
        type: "text",
        heading: "Certified Starter Baselines",
        body: "Download these starting structures to quickly spin up custom visual boutiques. They contain valid vite configs, npm package structures, and sample pages."
      },
      {
        type: "starter",
        heading: "Starter Gallery",
        startersList: SHARED_STARTERS
      }
    ]
  }
];

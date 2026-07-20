import {
  LayoutDashboard,
  ShoppingBag,
  FolderOpen,
  Tag,
  Sliders,
  Image,
  Package,
  Home,
  ArrowLeftRight,
  ShoppingCart,
  Undo2,
  XCircle,
  CreditCard,
  Receipt,
  Gift,
  Flame,
  Megaphone,
  Share2,
  Video,
  ShieldAlert,
  FileText,
  LayoutGrid,
  HelpCircle,
  Bot,
  Brain,
  MessageSquare,
  BarChart3,
  Users,
  MessageSquareHeart,
  Ticket,
  Mail,
  UserCheck,
  Key,
  Settings,
  History,
  Activity,
} from 'lucide-react';

export interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  permissions?: string[];
  implemented: boolean;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const adminNavigation: NavGroup[] = [
  {
    group: 'OVERVIEW',
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        implemented: true,
      },
      {
        id: 'analytics',
        title: 'Analytics',
        href: '/admin/analytics',
        icon: BarChart3,
        implemented: true,
      },
      // ponytail: sales items under overview per user request

    ],
  },
  {
    group: 'SALES',
    items: [
      {
        id: 'orders',
        title: 'Orders',
        href: '/admin/orders',
        icon: LayoutDashboard,
        implemented: true,
      },
      // ponytail: sales items under overview per user request

      {
        id: 'returns',
        title: 'Returns',
        href: '/admin/returns',
        icon: Undo2,
        implemented: true,
      },
      {
        id: 'cancellations',
        title: 'Cancellations',
        href: '/admin/cancellations',
        icon: XCircle,
        implemented: true,
      },
      {
        id: 'payments',
        title: 'Payments',
        href: '/admin/payments',
        icon: CreditCard,
        implemented: true,
      },
      {
        id: 'refunds',
        title: 'Refunds',
        href: '/admin/refunds',
        icon: Undo2,
        implemented: true,
      },
      {
        id: 'invoices',
        title: 'Invoices',
        href: '/admin/invoices',
        icon: Receipt,
        implemented: true,
      },
    ],
  },
  {
    group: 'OPERATIONS',
    items: [
      {
        id: 'command-center',
        title: 'Command Center',
        href: '/admin/operations',
        icon: Activity,
        implemented: true,
      },
      {
        id: 'notifications',
        title: 'Notifications',
        href: '/admin/notifications',
        icon: Mail,
        implemented: true,
      },
    ],
  },
  {
    group: 'CATALOG',
    items: [
      {
        id: 'products',
        title: 'Products',
        href: '/admin/catalog/products',
        icon: ShoppingBag,
        implemented: true,
      },
      {
        id: 'categories',
        title: 'Categories',
        href: '/admin/catalog/categories',
        icon: FolderOpen,
        implemented: true,
      },
      {
        id: 'brands',
        title: 'Brands',
        href: '/admin/catalog/brands',
        icon: Tag,
        implemented: true,
      },
      {
        id: 'attributes',
        title: 'Attributes',
        href: '/admin/catalog/attributes',
        icon: Sliders,
        implemented: true,
      },
      {
        id: 'media',
        title: 'Media',
        href: '/admin/catalog/media',
        icon: Image,
        implemented: false,
      },
    ],
  },
  {
    group: 'INVENTORY',
    items: [
      {
        id: 'inventory',
        title: 'Inventory',
        href: '/admin/inventory',
        icon: Package,
        implemented: true,
      },
      {
        id: 'warehouses',
        title: 'Warehouses',
        href: '/admin/warehouses',
        icon: Home,
        implemented: true,
      },
      {
        id: 'stock-movements',
        title: 'Stock Movements',
        href: '/admin/inventory/movements',
        icon: ArrowLeftRight,
        implemented: true,
      },
      {
        id: 'shipping',
        title: 'Shipping Operations',
        href: '/admin/shipping',
        icon: Sliders,
        implemented: true,
      },
    ],
  },
  {
    group: 'PROMOTIONS',
    items: [
      {
        id: 'coupons',
        title: 'Coupons',
        href: '/admin/promotions/coupons',
        icon: Gift,
        implemented: true,
      },
      {
        id: 'offers',
        title: 'Offers',
        href: '/admin/promotions/offers',
        icon: Flame,
        implemented: true,
      },
      {
        id: 'campaigns',
        title: 'Campaigns',
        href: '/admin/promotions/campaigns',
        icon: Megaphone,
        implemented: true,
      },
    ],
  },
  {
    group: 'SOCIAL COMMERCE',
    items: [
      {
        id: 'posts',
        title: 'Posts',
        href: '/admin/social?tab=posts',
        icon: Share2,
        implemented: true,
      },
      {
        id: 'reels',
        title: 'Reels',
        href: '/admin/reels',
        icon: Video,
        implemented: true,
      },
      {
        id: 'moderation',
        title: 'Moderation',
        href: '/admin/social?tab=reports',
        icon: ShieldAlert,
        implemented: true,
      },
    ],
  },
  {
    group: 'CONTENT',
    items: [
      {
        id: 'banners',
        title: 'Banners',
        href: '/admin/banners',
        icon: Image,
        implemented: true,
      },
      {
        id: 'pages',
        title: 'Pages',
        href: '/admin/cms/pages',
        icon: FileText,
        implemented: true,
      },
      {
        id: 'sections',
        title: 'Sections',
        href: '/admin/cms/sections',
        icon: LayoutGrid,
        implemented: true,
      },
      {
        id: 'faqs',
        title: 'FAQs',
        href: '/admin/faqs',
        icon: HelpCircle,
        implemented: true,
      },
    ],
  },
  {
    group: 'AI & RAG',
    items: [
      {
        id: 'rag-overview',
        title: 'RAG Overview',
        href: '/admin/ai/rag',
        icon: LayoutDashboard,
        // ponytail: backend routes don't exist yet — hide until built
        implemented: false,
      },
      {
        id: 'rag-agents',
        title: 'Agents',
        href: '/admin/ai/rag/agents',
        icon: Bot,
        implemented: false,
      },
      {
        id: 'rag-knowledge',
        title: 'Knowledge Base',
        href: '/admin/ai/rag/knowledge',
        icon: Brain,
        implemented: false,
      },
      {
        id: 'rag-ingestion',
        title: 'Ingestion',
        href: '/admin/ai/rag/ingestion',
        icon: Activity,
        implemented: false,
      },
      {
        id: 'rag-conversations',
        title: 'Conversations',
        href: '/admin/ai/rag/conversations',
        icon: MessageSquare,
        implemented: false,
      },
      {
        id: 'rag-metrics',
        title: 'Metrics',
        href: '/admin/ai/rag/metrics',
        icon: BarChart3,
        implemented: false,
      },
      {
        id: 'rag-playground',
        title: 'RAG Playground',
        href: '/admin/ai/rag/playground',
        icon: Sliders,
        // ponytail: backend routes don't exist yet — hide until built
        implemented: false,
      },
    ],
  },
  {
    group: 'CUSTOMERS',
    items: [
      {
        id: 'customers',
        title: 'Customers',
        href: '/admin/customers',
        icon: Users,
        implemented: true,
      },
      {
        id: 'reviews',
        title: 'Reviews',
        href: '/admin/customers/reviews',
        icon: MessageSquareHeart,
        implemented: true,
      },
      // ponytail: reports under customers per user request
      {
        id: 'reports-center',
        title: 'Report Center',
        href: '/admin/reports',
        icon: FileText,
        implemented: true,
      },
      {
        id: 'export-jobs',
        title: 'Export Jobs',
        href: '/admin/reports/exports',
        icon: History,
        implemented: true,
      },
    ],
  },
  {
    group: 'STAFF & ACCESS',
    items: [
      {
        id: 'staff',
        title: 'Staff',
        href: '/admin/staff',
        icon: UserCheck,
        implemented: true,
      },
      {
        id: 'roles',
        title: 'Roles',
        href: '/admin/access/roles',
        icon: Key,
        implemented: true,
      },
      {
        id: 'permissions',
        title: 'Permissions',
        href: '/admin/access/permissions',
        icon: ShieldAlert,
        implemented: true,
      },
      {
        id: 'matrix',
        title: 'RBAC Matrix',
        href: '/admin/access/matrix',
        icon: Sliders,
        implemented: true,
      },
      // ponytail: analytics grouped under staff & access per user request
      {
        id: 'analytics-sales',
        title: 'Sales Analytics',
        href: '/admin/analytics/sales',
        icon: BarChart3,
        implemented: true,
      },
      {
        id: 'analytics-orders',
        title: 'Order Analytics',
        href: '/admin/analytics/orders',
        icon: ShoppingCart,
        implemented: true,
      },
      {
        id: 'analytics-products',
        title: 'Product Analytics',
        href: '/admin/analytics/products',
        icon: ShoppingBag,
        implemented: true,
      },
      {
        id: 'analytics-inventory',
        title: 'Inventory Analytics',
        href: '/admin/analytics/inventory',
        icon: Package,
        implemented: true,
      },
      {
        id: 'analytics-customers',
        title: 'Customer Analytics',
        href: '/admin/analytics/customers',
        icon: Users,
        implemented: true,
      },
      {
        id: 'analytics-social',
        title: 'Social Analytics',
        href: '/admin/analytics/social',
        icon: Share2,
        implemented: true,
      },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      {
        id: 'settings',
        title: 'Settings',
        href: '/admin/settings',
        icon: Settings,
        implemented: true,
      },
      {
        id: 'audit-logs',
        title: 'Audit Logs',
        href: '/admin/audit',
        icon: History,
        implemented: true,
      },
      {
        id: 'health',
        title: 'System Health',
        href: '/admin/system/health',
        icon: Activity,
        implemented: true,
      },
    ],
  },
];

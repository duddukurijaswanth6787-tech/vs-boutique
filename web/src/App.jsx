import React, { useState, Suspense, lazy, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import Sidebar from './core/components/navigation/Sidebar';
import Navbar from './core/components/navigation/Navbar';
import { Loader2 } from 'lucide-react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { CartProvider } from './context/CartContext';
import { AddressProvider } from './context/AddressContext';
import { ReviewProvider } from './context/ReviewContext';
import { ReturnsProvider } from './context/ReturnsContext';
import { NotificationProvider } from './context/NotificationContext';
import { AdminNotificationProvider } from './context/AdminNotificationContext';
import Login from './features/auth/login/pages/Login';
import OwnerDashboard from './features/owner/pages/Dashboard/OwnerDashboard';
import OwnerLayout from './components/OwnerLayout';
import OwnerProfile from './features/owner/pages/Profile/OwnerProfile';
import OwnerDesigns from './features/owner/pages/Designs/OwnerDesigns';
import OwnerServices from './features/owner/pages/Services/OwnerServices';
import OwnerGallery from './features/owner/pages/Gallery/OwnerGallery';
import OwnerAnalytics from './features/owner/pages/Analytics/OwnerAnalytics';

// Lazy load pages
const Boutiques = lazy(() => import('./features/admin/pages/Boutiques/Boutiques'));
const BoutiqueDetails = lazy(() => import('./features/admin/pages/Boutiques/BoutiqueDetails'));
const ResetPassword = lazy(() => import('./features/auth/password-reset/pages/ResetPassword'));
const SetPassword = lazy(() => import('./features/auth/password-reset/pages/SetPassword'));
const ActivityLogs = lazy(() => import('./features/admin/pages/ActivityLogs/ActivityLogs'));
const OwnerOrders = lazy(() => import('./features/owner/pages/Orders/OwnerOrders'));
const OrderDetails = lazy(() => import('./features/admin/pages/Orders/OrderDetails'));
const AdminOrders = lazy(() => import('./features/admin/pages/Orders/AdminOrders'));
const Payments = lazy(() => import('./features/admin/pages/Payments/Payments'));
const Customers = lazy(() => import('./features/admin/pages/Customers/Customers'));
const Bookings = lazy(() => import('./features/admin/pages/Bookings/Bookings'));
const Reviews = lazy(() => import('./features/admin/pages/Reviews/Reviews'));
const MarketplaceInsights = lazy(() => import('./features/admin/pages/CommandCenter/MarketplaceInsights'));
const OwnerBookings = lazy(() => import('./features/owner/pages/Bookings/OwnerBookings'));
const OwnerReviews = lazy(() => import('./features/owner/pages/Reviews/OwnerReviews'));
const AdminPayouts = lazy(() => import('./features/admin/pages/Payouts/AdminPayouts'));
const AdminSettings = lazy(() => import('./features/admin/pages/Settings/AdminSettings'));
const OwnerPayouts = lazy(() => import('./features/owner/pages/Payouts/OwnerPayouts'));
const OwnerProducts = lazy(() => import('./features/owner/pages/Products/OwnerProducts'));
const OwnerSubscription = lazy(() => import('./features/owner/pages/Subscriptions/OwnerSubscription'));
const AdminTickets = lazy(() => import('./features/admin/pages/Tickets/AdminTickets'));
const AdminNotifications = lazy(() => import('./features/admin/pages/Notifications/AdminNotifications'));
const OwnerTickets = lazy(() => import('./features/owner/pages/Tickets/OwnerTickets'));
const OwnerDeliveryTracking = lazy(() => import('./features/owner/pages/DeliveryTracking/OwnerDeliveryTracking'));
const OwnerCoupons = lazy(() => import('./features/owner/pages/Coupons/OwnerCoupons'));
const OwnerProductReviews = lazy(() => import('./features/owner/pages/Reviews/OwnerProductReviews'));

// New upgraded workspaces
const AdminRevenue = lazy(() => import('./features/admin/pages/Revenue/AdminRevenue'));
const AdminFraud = lazy(() => import('./features/admin/pages/Fraud/AdminFraud'));
const AdminWishlists = lazy(() => import('./features/admin/pages/CommandCenter/AdminWishlists'));
const AdminCommandCenter = lazy(() => import('./features/admin/pages/CommandCenter/AdminCommandCenter'));
const OwnerSettings = lazy(() => import('./features/owner/pages/Settings/OwnerSettings'));
const AdminSubscriptions = lazy(() => import('./features/admin/pages/Subscriptions/AdminSubscriptions'));
const Categories = lazy(() => import('./features/admin/pages/Categories/Categories'));
const AdminCoupons = lazy(() => import('./features/admin/pages/Coupons/AdminCoupons'));
const AdminProductReviews = lazy(() => import('./features/admin/pages/Products/AdminProductReviews'));
const AdminCommerceOrders = lazy(() => import('./features/admin/pages/CommerceOrders/AdminCommerceOrders'));
const AdminDeliveryTracking = lazy(() => import('./features/admin/pages/DeliveryTracking/AdminDeliveryTracking'));
const CustomerPrivacy = lazy(() => import('./features/shared/info/pages/CustomerPrivacy'));
const CustomerTerms = lazy(() => import('./features/shared/info/pages/CustomerTerms'));
const CustomerRefund = lazy(() => import('./features/shared/info/pages/CustomerRefund'));
const CustomerShipping = lazy(() => import('./features/shared/info/pages/CustomerShipping'));
const CustomerAbout = lazy(() => import('./features/shared/info/pages/CustomerAbout'));
const CustomerContact = lazy(() => import('./features/shared/info/pages/CustomerContact'));
const CustomerHelp = lazy(() => import('./features/shared/help/pages/CustomerHelp'));
const DesignSystemShowcase = lazy(() => import('./features/shared/info/pages/DesignSystemShowcase'));
const LiveWebsiteControl = lazy(() => import('./features/admin/pages/LiveWebsite/LiveWebsiteControl'));
const StudioApp = lazy(() => import('./studio/StudioApp'));

// CMS Workspace Pages
const CMSDashboard = lazy(() => import('./features/admin/cms/dashboard/pages/CMSDashboard'));
const WebsiteBlueprint = lazy(() => import('./features/admin/cms/website-platform/pages/WebsiteBlueprint'));
const WebsiteStandards = lazy(() => import('./features/admin/cms/standards/pages/StandardsDashboard'));
const RequirementsSelector = lazy(() => import('./features/admin/cms/requirements/pages/RequirementsSelector'));
const WebsiteDevelopmentKit = lazy(() => import('./features/admin/cms/website-platform/pages/WebsiteDevelopmentKit'));
const PromptLibrary = lazy(() => import('./features/admin/cms/website-platform/pages/PromptLibrary'));
const AIRequirementGenerator = lazy(() => import('./features/admin/cms/website-platform/pages/AIRequirementGenerator'));
const AIWebsiteGenerator = lazy(() => import('./features/admin/cms/website-platform/pages/AIWebsiteGenerator'));
const UploadWebsite = lazy(() => import('./features/admin/cms/website-platform/pages/UploadWebsite'));
const TemplateLibrary = lazy(() => import('./features/admin/cms/website-platform/pages/TemplateLibrary'));
const AICertification = lazy(() => import('./features/admin/cms/ai-certification/pages/AICertification'));
const MarketplaceHome = lazy(() => import('./features/admin/cms/marketplace/pages/MarketplaceHome'));
const ValidationReports = lazy(() => import('./features/admin/cms/ai-certification/pages/ValidationReports'));
const PromptGenerator = lazy(() => import('./features/admin/cms/ai-certification/pages/PromptGenerator'));
const AIAgentsConfig = lazy(() => import('./features/admin/cms/ai-certification/pages/AIAgentsConfig'));
const CertificationRules = lazy(() => import('./features/admin/cms/ai-certification/pages/CertificationRules'));
const SubscriptionPlans = lazy(() => import('./features/admin/cms/platform/pages/SubscriptionPlans'));
const FeatureFlags = lazy(() => import('./features/admin/cms/platform/pages/FeatureFlags'));
const DomainsManager = lazy(() => import('./features/admin/cms/platform/pages/DomainsManager'));
const DeploymentCenter = lazy(() => import('./features/admin/cms/platform/pages/DeploymentCenter'));
const WebsiteHealth = lazy(() => import('./features/admin/cms/platform/pages/WebsiteHealth'));
const CMSSettings = lazy(() => import('./features/admin/cms/configuration/pages/CMSSettings'));

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/admin" replace />; // Or a generic unauthorized page
  }

  return children;
};

const AdminLayout = ({ children }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('admin/command-center')) return 'Command Center';
    if (path.includes('admin/revenue')) return 'Revenue Analytics';
    if (path.includes('admin/fraud')) return 'Fraud & Spam Moderation';
    if (path.includes('admin/wishlists')) return 'Wishlists & Demand';
    if (path.includes('admin-dashboard')) return 'Dashboard';
    if (path.includes('boutiques')) return 'Boutique Management';
    if (path.includes('orders')) return 'Orders';
    if (path.includes('payments')) return 'Payments';
    if (path.includes('customers')) return 'Customer Management';
    if (path.includes('bookings')) return 'Consultation Bookings';
    if (path.includes('reviews')) return 'Reviews Moderation';
    if (path.includes('marketplace-insights')) return 'Marketplace Insights';
    if (path.includes('activity-logs')) return 'Activity Logs';
    if (path.includes('admin/payouts')) return 'Payout Settlements';
    if (path.includes('admin/settings')) return 'Platform Settings';
    if (path.includes('admin/tickets')) return 'Support Tickets';
    if (path.includes('admin/categories')) return 'Category Management';
    if (path.includes('admin/coupons')) return 'Coupon Management';
    if (path.includes('admin/product-reviews')) return 'Product Reviews';
    if (path.includes('admin/commerce-orders')) return 'Commerce Orders';
    if (path.includes('admin/delivery-tracking')) return 'Delivery Tracking';
    if (path.includes('admin/notifications')) return 'Broadcast Announcer';
    if (path.includes('admin/cms/dashboard')) return 'CMS Workspace Overview';
    if (path.includes('admin/cms/blueprint')) return 'Website Blueprint';
    if (path.includes('admin/cms/standards')) return 'Website Standards';
    if (path.includes('admin/cms/sdk')) return 'Website Dev Kit (WDK)';
    if (path.includes('admin/cms/prompt-library')) return 'Prompt Library';
    if (path.includes('admin/cms/requirement-generator')) return 'AI Requirement Generator';
    if (path.includes('admin/cms/upload')) return 'Upload Website codebase';
    if (path.includes('admin/cms/templates')) return 'Template Library';
    if (path.includes('admin/cms/certification')) return 'AI Certification Hub';
    if (path.includes('admin/cms/reports')) return 'Validation Reports';
    if (path.includes('admin/cms/prompt-generator')) return 'Prompt Generator';
    if (path.includes('admin/cms/agents')) return 'AI Agents configuration';
    if (path.includes('admin/cms/rules')) return 'Certification Rules Engine';
    if (path.includes('admin/cms/subscriptions')) return 'Subscription Plans Configurator';
    if (path.includes('admin/cms/feature-flags')) return 'Tenant Feature Flags';
    if (path.includes('admin/cms/domains')) return 'Domains & Routing';
    if (path.includes('admin/cms/deployment')) return 'Deployment & Release Center';
    if (path.includes('admin/cms/health')) return 'Website Health Monitoring';
    if (path.includes('admin/cms/settings')) return 'CMS Settings';
    if (path.includes('settings')) return 'Settings';
    return 'VS Admin';
  };

  return (
    <AdminNotificationProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Navbar
            title={getPageTitle()}
            onMenuClick={() => setIsSidebarOpen(true)}
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 custom-scrollbar">
            <div className="max-w-7xl mx-auto">
              <Suspense fallback={
                <div className="flex items-center justify-center h-96">
                  <Loader2 className="animate-spin text-primary" size={48} />
                </div>
              }>
                {children}
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </AdminNotificationProvider>
  );
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/admin" element={<Login />} />
      <Route path="/login" element={<Navigate to="/admin" replace />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/set-password" element={<SetPassword />} />
      
      {/* Super Admin Routes */}
      <Route path="/admin-dashboard" element={<Navigate to="/admin/command-center" replace />} />
      <Route 
        path="/admin/command-center" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><AdminCommandCenter /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/revenue" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><AdminRevenue /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/fraud" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><AdminFraud /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/wishlists" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><AdminWishlists /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/subscriptions" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><AdminSubscriptions /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/boutiques" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><Boutiques /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/boutiques/:id" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><BoutiqueDetails /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/categories" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><Categories /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/activity-logs" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><ActivityLogs /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/orders" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><AdminOrders /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/payments" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><Payments /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customers" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><Customers /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/bookings" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><Bookings /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reviews" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><Reviews /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/marketplace-insights" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><MarketplaceInsights /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/payouts" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><AdminPayouts /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/live-website" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><LiveWebsiteControl /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/settings" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><AdminSettings /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/tickets" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><AdminTickets /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/coupons" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><AdminCoupons /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/product-reviews" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><AdminProductReviews /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/notifications" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><AdminNotifications /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/commerce-orders" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><AdminCommerceOrders /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/delivery-tracking" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><AdminDeliveryTracking /></AdminLayout>
          </ProtectedRoute>
        } 
      />

      {/* CMS Routes */}
      <Route path="/admin/cms" element={<Navigate to="/admin/cms/dashboard" replace />} />
      <Route 
        path="/admin/cms/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><CMSDashboard /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cms/blueprint" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><WebsiteBlueprint /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cms/standards" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><WebsiteStandards /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cms/requirements" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><RequirementsSelector /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cms/sdk" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><WebsiteDevelopmentKit /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cms/prompt-library" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><PromptLibrary /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cms/requirement-generator" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><AIRequirementGenerator /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cms/website-generator" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><AIWebsiteGenerator /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cms/upload" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><UploadWebsite /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cms/templates" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><TemplateLibrary /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cms/certification" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><AICertification /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cms/marketplace" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><MarketplaceHome /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cms/reports" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><ValidationReports /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cms/prompt-generator" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><PromptGenerator /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cms/agents" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><AIAgentsConfig /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cms/rules" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><CertificationRules /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cms/subscriptions" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><SubscriptionPlans /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cms/feature-flags" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><FeatureFlags /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cms/domains" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><DomainsManager /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cms/deployment" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><DeploymentCenter /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cms/health" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><WebsiteHealth /></AdminLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/cms/settings" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><CMSSettings /></AdminLayout>
          </ProtectedRoute>
        } 
      />

      {/* Owner Routes */}
      <Route 
        path="/owner/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="/owner-dashboard" element={<Navigate to="/owner/dashboard" replace />} />
      <Route 
        path="/owner/analytics" 
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerAnalytics />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/owner/profile" 
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/owner/designs" 
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerDesigns />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/owner/products" 
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerProducts />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/owner/services" 
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerServices />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/owner/gallery" 
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerGallery />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/owner/orders" 
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerOrders />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/owner/orders/:id" 
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OrderDetails />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/owner/bookings" 
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerBookings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/owner/reviews" 
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerReviews />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/owner/payouts" 
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerPayouts />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/owner/subscription" 
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerSubscription />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/owner/tickets" 
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerTickets />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/owner/tracking" 
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerDeliveryTracking />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/owner/coupons" 
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerCoupons />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/owner/product-reviews" 
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerProductReviews />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/owner/settings" 
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerLayout title="Workspace Settings"><OwnerSettings /></OwnerLayout>
          </ProtectedRoute>
        } 
      />

      {/* Shared Order Details for Admin */}
      <Route 
        path="/orders/:id" 
        element={
          <ProtectedRoute allowedRoles={['super-admin']}>
            <AdminLayout><OrderDetails /></AdminLayout>
          </ProtectedRoute>
        } 
      />

      {/* Customer Routes (Unified Providers Layout) */}
      <Route element={
        <CustomerAuthProvider>
          <NotificationProvider>
            <CartProvider>
              <WishlistProvider>
                <AddressProvider>
                  <Outlet />
                </AddressProvider>
              </WishlistProvider>
            </CartProvider>
          </NotificationProvider>
        </CustomerAuthProvider>
      }>
        <Route path="/" element={<StudioApp />} />
        <Route path="/boutique/:id" element={<StudioApp />} />
        <Route path="/products" element={<StudioApp />} />
        <Route path="/products/:id" element={<StudioApp />} />
        <Route path="/wishlist" element={<StudioApp />} />

        {/* Mobile Commerce Routes */}
        <Route path="/customer/home" element={<StudioApp />} />
        <Route path="/customer/shop" element={<StudioApp />} />
        <Route path="/customer/shop/:id" element={<StudioApp />} />
        <Route path="/customer/cart" element={<StudioApp />} />
        <Route path="/customer/checkout" element={<StudioApp />} />
        <Route path="/customer/orders" element={<StudioApp />} />
        <Route path="/customer/orders/:id" element={<StudioApp />} />
        <Route path="/customer/wishlist" element={<StudioApp />} />
        <Route path="/customer/profile" element={<StudioApp />} />
        <Route path="/customer/returns" element={<StudioApp />} />
        <Route path="/customer/tailoring" element={<StudioApp />} />
        <Route path="/customer/bookings" element={<StudioApp />} />
        <Route path="/customer/measurements" element={<StudioApp />} />
        <Route path="/customer/addresses" element={<StudioApp />} />
        <Route path="/customer/order-success/:orderId" element={<StudioApp />} />
        <Route path="/customer/notifications" element={<StudioApp />} />
        <Route path="/customer/privacy" element={<CustomerPrivacy />} />
        <Route path="/customer/terms" element={<CustomerTerms />} />
        <Route path="/customer/refund" element={<CustomerRefund />} />
        <Route path="/customer/shipping" element={<CustomerShipping />} />
        <Route path="/customer/about" element={<CustomerAbout />} />
        <Route path="/customer/contact" element={<CustomerContact />} />
        <Route path="/customer/help" element={<CustomerHelp />} />
        <Route path="/design-system" element={<DesignSystemShowcase />} />
        <Route path="/customer/design-system" element={<DesignSystemShowcase />} />
        <Route path="/customer/preview" element={<StudioApp />} />
      </Route>
    </Routes>
  );
}

const RoleBasedRedirect = () => {
  const { user } = useContext(AuthContext);
  if (user?.role === 'super-admin') return <Navigate to="/admin/command-center" replace />;
  if (user?.role === 'owner') return <Navigate to="/owner/dashboard" replace />;
  return <Navigate to="/admin" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
console.log('[API CONFIG] API_BASE_URL is resolved to:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const endpoint = config.url;
    console.log("[API CALL]", endpoint);
    console.log(`[API Request] ${config.method?.toUpperCase()} ${endpoint}`, config.data || '');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration (401)
api.interceptors.response.use(
  (response) => {
    const endpoint = response.config.url;
    console.log("[API RESPONSE]", response.data);
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${endpoint}`, response.status, response.data);
    return response;
  },
  (error) => {
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.status, error.response?.data || error.message);
    if (error.response && error.response.status === 401) {
      console.warn('Token expired or unauthorized. Logging out...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Prevent redirecting customer storefront users to the admin login page
      const path = window.location.pathname;
      const isCustomerPath = path === '/' || path.startsWith('/customer') || path.startsWith('/products') || path.startsWith('/boutique') || path === '/wishlist' || path.startsWith('/design-system');
      if (!isCustomerPath) {
        window.location.href = '/admin'; // Force redirect to login
      }
    }
    return Promise.reject(error);
  }
);

export const getBoutiques = async () => {
  const response = await api.get('/boutiques');
  return response.data;
};

export const getPublicBoutiques = async () => {
  const response = await api.get('/boutiques/public');
  return response.data;
};

export const getBoutiqueDetails = async (id) => {
  const response = await api.get(`/boutiques/${id}/details`);
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

export const addBoutique = async (boutiqueData) => {
  const response = await api.post('/boutiques/add', boutiqueData);
  return response.data;
};

export const updateBoutique = async (id, boutiqueData) => {
  const response = await api.put(`/boutiques/${id}`, boutiqueData);
  return response.data;
};

export const updateBoutiqueStatus = async (id, statusData) => {
  const response = await api.put(`/boutiques/${id}/status`, statusData);
  return response.data;
};

export const deleteBoutique = async (id, adminPassword) => {
  const response = await api.delete(`/boutiques/${id}`, {
    data: { adminPassword }
  });
  return response.data;
};

export const uploadImage = async (file, type = 'gallery') => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post(`/upload?type=${encodeURIComponent(type)}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const data = response.data;
  if (!data?.success || !data?.url) {
    const err = new Error(data?.message || 'Upload failed');
    err.response = response;
    throw err;
  }
  console.log('Uploaded URL:', data.url);
  return data;
};

// Owner APIs
export const updateOwnerPermissions = async (ownerId, permissions) => {
  const response = await api.put(`/owners/${ownerId}/permissions`, { permissions });
  return response.data;
};

export const updateOwnerStatus = async (ownerId, status) => {
  const response = await api.put(`/owners/${ownerId}/status`, { status });
  return response.data;
};

export const sendPasswordResetLink = async (ownerId) => {
  const response = await api.post(`/owners/${ownerId}/send-reset-link`);
  return response.data;
};

export const getUnassignedOwners = async () => {
  const response = await api.get('/owners/unassigned');
  return response.data;
};

export const inviteOwner = async (inviteData) => {
  const response = await api.post('/owners/invite', inviteData);
  return response.data;
};

export const linkOwner = async (linkData) => {
  const response = await api.post('/owners/link', linkData);
  return response.data;
};

export const unlinkOwner = async (unlinkData) => {
  const response = await api.post('/owners/unlink', unlinkData);
  return response.data;
};

export const resendInvite = async (ownerId) => {
  const response = await api.post(`/owners/${ownerId}/resend-invite`);
  return response.data;
};

export const setPassword = async (setData) => {
  const response = await api.post('/auth/set-password', setData);
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await api.post(`/auth/reset-password/${token}`, { password });
  return response.data;
};

// --- OWNER PORTAL API ---

export const getOwnerDashboard = async () => {
  const response = await api.get('/owner/dashboard');
  return response.data;
};

// Fetch current owner's fresh profile + permissions from DB (bypasses stale localStorage)
export const getOwnerProfile = async () => {
  const response = await api.get('/owner/me');
  return response.data;
};

export const getOwnerBoutique = async () => {
  const response = await api.get('/owner/boutique');
  return response.data;
};

export const updateOwnerBoutique = async (boutiqueData) => {
  const response = await api.put('/owner/boutique', boutiqueData);
  return response.data;
};

export const updateOwnerServices = async (serviceData) => {
  const response = await api.put('/owner/services', serviceData);
  return response.data;
};

export const updateOwnerGallery = async (galleryData) => {
  const response = await api.put('/owner/gallery', galleryData);
  return response.data;
};

export const updateOwnerMedia = async (mediaData) => {
  const response = await api.put('/owner/media', mediaData);
  return response.data;
};

export const getDesigns = async () => {
  const response = await api.get('/designs');
  return response.data;
};

export const createDesign = async (designData) => {
  const response = await api.post('/designs', designData);
  return response.data;
};

export const updateDesign = async (id, designData) => {
  const response = await api.put(`/designs/${id}`, designData);
  return response.data;
};

export const deleteDesign = async (id) => {
  const response = await api.delete(`/designs/${id}`);
  return response.data;
};

// --- ORDERS API ---

export const getOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const createOrder = async (orderData) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

export const updateOrderStatus = async (id, statusData) => {
  const response = await api.put(`/orders/${id}/status`, statusData);
  return response.data;
};

export const updateOrderPayment = async (id, paymentData) => {
  const response = await api.put(`/orders/${id}/payment`, paymentData);
  return response.data;
};

export const updateOrderMeasurements = async (id, measurements) => {
  const response = await api.put(`/orders/${id}/measurements`, measurements);
  return response.data;
};

// --- NOTIFICATIONS API ---

export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

// --- PAYMENTS API ---

export const getAllPayments = async (params) => {
  const response = await api.get('/payments', { params });
  return response.data;
};

export const getPaymentReports = async () => {
  const response = await api.get('/payments/reports');
  return response.data;
};

export const refundPayment = async (refundData) => {
  const response = await api.post('/payments/refund', refundData);
  return response.data;
};

export const processPayout = async (paymentIds) => {
  const response = await api.post('/payments/payout', { paymentIds });
  return response.data;
};

// --- CUSTOMERS API ---

export const getCustomers = async (params) => {
  const response = await api.get('/admin/customers', { params });
  return response.data;
};

export const getCustomerProfile = async (id) => {
  const response = await api.get(`/admin/customers/${id}`);
  return response.data;
};

export const toggleCustomerBlock = async (id, status, reason) => {
  const response = await api.put(`/admin/customers/${id}/status`, { status, reason });
  return response.data;
};

export const exportCustomerData = async (id) => {
  const response = await api.get(`/admin/customers/${id}/export`);
  return response.data;
};

export const getCustomerAddresses = async (id) => {
  const response = await api.get(`/admin/customers/${id}/addresses`);
  return response.data;
};

export const addCustomerAddress = async (id, addressData) => {
  const response = await api.post(`/admin/customers/${id}/addresses`, addressData);
  return response.data;
};

export const updateCustomerAddress = async (id, addressId, addressData) => {
  const response = await api.put(`/admin/customers/${id}/addresses/${addressId}`, addressData);
  return response.data;
};

export const deleteCustomerAddress = async (id, addressId) => {
  const response = await api.delete(`/admin/customers/${id}/addresses/${addressId}`);
  return response.data;
};

// --- BOOKINGS API ---

export const getBookings = async (params) => {
  const response = await api.get('/bookings/admin', { params });
  return response.data;
};

export const getOwnerBookings = async (params) => {
  const response = await api.get('/bookings/owner', { params });
  return response.data;
};

export const getBookingStats = async () => {
  const response = await api.get('/bookings/stats');
  return response.data;
};

export const updateBookingStatus = async (id, status, note, orderId) => {
  const response = await api.put(`/bookings/${id}/status`, { status, note, orderId });
  return response.data;
};

export const rescheduleBooking = async (id, bookingDate, bookingTime, note) => {
  const response = await api.put(`/bookings/${id}/reschedule`, { bookingDate, bookingTime, note });
  return response.data;
};

export const assignBooking = async (id, assignedOwnerId) => {
  const response = await api.put(`/bookings/${id}/assign`, { assignedOwnerId });
  return response.data;
};

export const updateBookingNotes = async (id, notes) => {
  const response = await api.put(`/bookings/${id}/notes`, { notes });
  return response.data;
};

export const triggerReminder = async (id) => {
  const response = await api.post(`/bookings/${id}/remind`);
  return response.data;
};

// --- REVIEWS API ---

export const getAllReviews = async (params) => {
  const response = await api.get('/reviews/admin', { params });
  return response.data;
};

export const getOwnerReviews = async (params) => {
  const response = await api.get('/reviews/owner', { params });
  return response.data;
};

export const getReviewStats = async () => {
  const response = await api.get('/reviews/stats');
  return response.data;
};

export const moderateReview = async (id, moderationStatus) => {
  const response = await api.put(`/reviews/${id}/moderation`, { moderationStatus });
  return response.data;
};

export const replyToReview = async (id, reply) => {
  const response = await api.put(`/reviews/${id}/reply`, { reply });
  return response.data;
};

// --- MARKETPLACE INSIGHTS API ---

export const getMarketplaceInsights = async () => {
  const response = await api.get('/admin/marketplace-insights');
  return response.data;
};

// --- PAYOUTS & COMMISSIONS API ---

export const getPlatformCommissionSettings = async () => {
  const response = await api.get('/payouts/commission-settings');
  return response.data;
};

export const updatePlatformCommissionSettings = async (settingsData) => {
  const response = await api.put('/payouts/commission-settings', settingsData);
  return response.data;
};

export const setBoutiqueCommissionOverride = async (boutiqueId, commissionRate) => {
  const response = await api.put(`/payouts/boutiques/${boutiqueId}/commission`, { commissionRate });
  return response.data;
};

export const getAdminPayouts = async (params) => {
  const response = await api.get('/payouts/admin', { params });
  return response.data;
};

export const getOwnerPayouts = async () => {
  const response = await api.get('/payouts/owner');
  return response.data;
};

export const generatePayout = async (payoutData) => {
  const response = await api.post('/payouts/admin/generate', payoutData);
  return response.data;
};

export const updatePayoutStatus = async (id, statusData) => {
  const response = await api.put(`/payouts/admin/${id}/status`, statusData);
  return response.data;
};

// --- SUBSCRIPTIONS API ---

export const getOwnerSubscription = async () => {
  const response = await api.get('/subscriptions/owner');
  return response.data;
};

export const upgradeSubscription = async (planName) => {
  const response = await api.post('/subscriptions/owner/upgrade', { planName });
  return response.data;
};

export const createSubscriptionPaymentOrder = async (planName) => {
  const response = await api.post('/subscriptions/owner/create-payment', { planName });
  return response.data;
};

export const verifySubscriptionPayment = async (paymentDetails) => {
  const response = await api.post('/subscriptions/owner/verify-payment', paymentDetails);
  return response.data;
};

export const cancelSubscription = async () => {
  const response = await api.post('/subscriptions/owner/cancel');
  return response.data;
};

export const getSubscriptionPlans = async (includeInactive = false) => {
  const response = await api.get(`/subscriptions/plans?includeInactive=${includeInactive}`);
  return response.data;
};

export const createSubscriptionPlan = async (planData) => {
  const response = await api.post('/subscriptions/plans', planData);
  return response.data;
};

export const updateSubscriptionPlan = async (id, planData) => {
  const response = await api.put(`/subscriptions/plans/${id}`, planData);
  return response.data;
};

export const cloneSubscriptionPlan = async (id, cloneData) => {
  const response = await api.post(`/subscriptions/plans/${id}/clone`, cloneData);
  return response.data;
};

export const deleteSubscriptionPlan = async (id) => {
  const response = await api.delete(`/subscriptions/plans/${id}`);
  return response.data;
};

export const requestCustomPlan = async (requestData) => {
  const response = await api.post('/subscriptions/owner/request-custom', requestData);
  return response.data;
};

export const getOwnerCustomPlanRequests = async () => {
  const response = await api.get('/subscriptions/owner/requests');
  return response.data;
};

export const getCustomPlanRequests = async () => {
  const response = await api.get('/subscriptions/admin/requests');
  return response.data;
};

export const updateCustomPlanRequest = async (id, status) => {
  const response = await api.put(`/subscriptions/admin/requests/${id}`, { status });
  return response.data;
};

export const getAdminSubscriptionAnalytics = async () => {
  const response = await api.get('/subscriptions/admin/analytics');
  return response.data;
};

// --- SUPPORT TICKETS API ---

export const getAdminTickets = async (params) => {
  const response = await api.get('/tickets/admin', { params });
  return response.data;
};

export const getOwnerTickets = async () => {
  const response = await api.get('/tickets/owner');
  return response.data;
};

export const getCustomerTickets = async (userId) => {
  const response = await api.get('/tickets/customer', { params: { userId } });
  return response.data;
};

export const getTicketById = async (id) => {
  const response = await api.get(`/tickets/${id}`);
  return response.data;
};

export const getTicketMessages = async (id) => {
  const response = await api.get(`/tickets/${id}/messages`);
  return response.data;
};

export const createTicketMessage = async (id, messageData) => {
  const response = await api.post(`/tickets/${id}/messages`, messageData);
  return response.data;
};

export const getTicketNotes = async (id) => {
  const response = await api.get(`/tickets/${id}/notes`);
  return response.data;
};

export const createTicketNote = async (id, noteData) => {
  const response = await api.post(`/tickets/${id}/notes`, noteData);
  return response.data;
};

export const assignTicket = async (id, assignedAdminId) => {
  const response = await api.put(`/tickets/${id}/assign`, { assignedAdminId });
  return response.data;
};

export const updateTicketStatusText = async (id, status) => {
  const response = await api.put(`/tickets/${id}/status`, { status });
  return response.data;
};

export const getTicketAnalytics = async () => {
  const response = await api.get('/tickets/admin/analytics');
  return response.data;
};

// --- BROADCAST NOTIFICATIONS API ---

export const broadcastNotification = async (notifData) => {
  const response = await api.post('/notifications/broadcast', notifData);
  return response.data;
};

export const getNotificationAnalytics = async () => {
  const response = await api.get('/notifications/admin/analytics');
  return response.data;
};

export const getNotificationTemplates = async () => {
  const response = await api.get('/notifications/templates');
  return response.data;
};

export const createNotificationTemplate = async (templateData) => {
  const response = await api.post('/notifications/templates', templateData);
  return response.data;
};

export const getNotificationCampaigns = async () => {
  const response = await api.get('/notifications/campaigns');
  return response.data;
};

export const createNotificationCampaign = async (campaignData) => {
  const response = await api.post('/notifications/campaigns', campaignData);
  return response.data;
};

// --- NEW DASHBOARDS ANALYTICS API ---

export const getAdminRevenue = async () => {
  const response = await api.get('/admin/revenue');
  return response.data;
};

export const getAdminFraud = async () => {
  const response = await api.get('/admin/fraud');
  return response.data;
};

export const getAdminWishlists = async () => {
  const response = await api.get('/admin/wishlists');
  return response.data;
};

export const getAdminCommandCenter = async () => {
  const response = await api.get('/admin/command-center');
  return response.data;
};

export const getOwnerStaff = async () => {
  const response = await api.get('/owner/staff');
  return response.data;
};

export const changeOwnerPassword = async (currentPassword, newPassword) => {
  const response = await api.post('/owner/change-password', { currentPassword, newPassword });
  return response.data;
};

export const getAdminCategories = async () => {
  const response = await api.get('/categories/admin');
  return response.data.data;
};

export const getActiveCategories = async () => {
  const response = await api.get('/categories');
  return response.data.data;
};

export const getCategory = async (id) => {
  const response = await api.get(`/categories/${id}`);
  return response.data.data;
};

export const createCategory = async (data) => {
  const response = await api.post('/categories', data);
  return response.data.data;
};

export const updateCategory = async (id, data) => {
  const response = await api.put(`/categories/${id}`, data);
  return response.data.data;
};

export const deleteCategory = async (id, adminPassword) => {
  const response = await api.delete(`/categories/${id}`, { data: { adminPassword } });
  return response.data;
};

export const toggleCategory = async (id) => {
  const response = await api.put(`/categories/${id}/toggle`);
  return response.data.data;
};

export const createSubCategory = async (categoryId, data) => {
  const response = await api.post(`/categories/${categoryId}/subcategories`, data);
  return response.data.data;
};

export const updateSubCategory = async (id, data) => {
  const response = await api.put(`/categories/subcategories/${id}`, data);
  return response.data.data;
};

export const deleteSubCategory = async (id, adminPassword) => {
  const response = await api.delete(`/categories/subcategories/${id}`, { data: { adminPassword } });
  return response.data;
};

export const toggleSubCategory = async (id) => {
  const response = await api.put(`/categories/subcategories/${id}/toggle`);
  return response.data.data;
};

export const getAdminSubscriptions = async () => {
  const response = await api.get('/admin/subscriptions');
  return response.data;
};

export const updateAdminSubscription = async (updateData) => {
  const response = await api.put('/admin/subscriptions/update', updateData);
  return response.data;
};

// ─────────────────────────────────────────────
// Owner Products API
// ─────────────────────────────────────────────

export const getOwnerProducts = async (params) => {
    const response = await api.get('/owner/products', { params });
    return response.data;
};

export const getOwnerProduct = async (id) => {
    const response = await api.get(`/owner/products/${id}`);
    return response.data;
};

export const createOwnerProduct = async (data) => {
    const response = await api.post('/owner/products', data);
    return response.data;
};

export const updateOwnerProduct = async (id, data) => {
    const response = await api.put(`/owner/products/${id}`, data);
    return response.data;
};

export const deleteOwnerProduct = async (id) => {
    const response = await api.delete(`/owner/products/${id}`);
    return response.data;
};

// Product Images
export const getOwnerProductImages = async (productId) => {
    const response = await api.get(`/owner/products/${productId}/images`);
    return response.data;
};

export const addOwnerProductImage = async (productId, data) => {
    const response = await api.post(`/owner/products/${productId}/images`, data);
    return response.data;
};

export const deleteOwnerProductImage = async (productId, imageId) => {
    const response = await api.delete(`/owner/products/${productId}/images/${imageId}`);
    return response.data;
};

// Brands
export const getOwnerBrands = async () => {
    const response = await api.get('/products/brands');
    return response.data;
};

export const createOwnerBrand = async (data) => {
    const response = await api.post('/products/brands', data);
    return response.data;
};

export const updateOwnerBrand = async (id, data) => {
    const response = await api.put(`/products/brands/${id}`, data);
    return response.data;
};

export const deleteOwnerBrand = async (id) => {
    const response = await api.delete(`/products/brands/${id}`);
    return response.data;
};

// Tags
export const getOwnerTags = async () => {
    const response = await api.get('/products/tags');
    return response.data;
};

export const createOwnerTag = async (data) => {
    const response = await api.post('/products/tags', data);
    return response.data;
};

export const updateOwnerTag = async (id, data) => {
    const response = await api.put(`/products/tags/${id}`, data);
    return response.data;
};

export const deleteOwnerTag = async (id) => {
    const response = await api.delete(`/products/tags/${id}`);
    return response.data;
};

// Variants
export const getProductVariants = async (productId) => {
    const response = await api.get(`/products/${productId}/variants`);
    return response.data;
};

export const createProductVariant = async (productId, data) => {
    const response = await api.post(`/products/${productId}/variants`, data);
    return response.data;
};

export const updateProductVariant = async (productId, variantId, data) => {
    const response = await api.put(`/products/${productId}/variants/${variantId}`, data);
    return response.data;
};

export const deleteProductVariant = async (productId, variantId) => {
    const response = await api.delete(`/products/${productId}/variants/${variantId}`);
    return response.data;
};

// Inventory
export const updateProductInventory = async (productId, variantId, data) => {
    const response = await api.put(`/products/${productId}/variants/${variantId}/inventory`, data);
    return response.data;
};

export const getProductInventoryLogs = async (productId) => {
    const response = await api.get(`/products/${productId}/inventory-logs`);
    return response.data;
};

// Public product browse
export const getPublicProducts = async (params) => {
    const response = await api.get('/products/public/browse', { params });
    return response.data;
};

export const getPublicProduct = async (id) => {
    const response = await api.get(`/products/public/${id}`);
    return response.data;
};

// Wishlist
export const getWishlist = async () => {
    const response = await customerApi.get('/products/wishlists/my');
    return response.data;
};

export const addToWishlist = async (productId) => {
    const response = await customerApi.post(`/products/wishlists/${productId}`);
    return response.data;
};

export const removeFromWishlist = async (productId) => {
    const response = await customerApi.delete(`/products/wishlists/${productId}`);
    return response.data;
};

// Customer Auth
export const sendOtp = async (phone) => {
    const response = await api.post('/auth/send-otp', { phone });
    return response.data;
};

export const verifyOtp = async (phone, otp) => {
    const response = await api.post('/auth/verify-otp', { phone, otp });
    return response.data;
};

export const getDevOtpMetadata = async (phone) => {
    const response = await api.get(`/auth/dev-otp-metadata/${phone}`);
    return response.data;
};


// ─────────────────────────────────────────────
// Coupon Management API
// ─────────────────────────────────────────────

export const getAdminCoupons = async () => {
  const response = await api.get('/admin/coupons');
  return response.data.data;
};

export const getAdminCoupon = async (id) => {
  const response = await api.get(`/admin/coupons/${id}`);
  return response.data.data;
};

export const createAdminCoupon = async (data) => {
  const response = await api.post('/admin/coupons', data);
  return response.data.data;
};

export const updateAdminCoupon = async (id, data) => {
  const response = await api.put(`/admin/coupons/${id}`, data);
  return response.data.data;
};

export const toggleAdminCoupon = async (id) => {
  const response = await api.patch(`/admin/coupons/${id}/toggle`);
  return response.data.data;
};

export const deleteAdminCoupon = async (id) => {
  const response = await api.delete(`/admin/coupons/${id}`);
  return response.data;
};

// ─────────────────────────────────────────────
// Product Reviews Admin API
// ─────────────────────────────────────────────

export const getAdminProductReviews = async (params) => {
  const response = await api.get('/admin/product-reviews', { params });
  return response.data.data;
};

export const approveProductReview = async (productId, reviewId) => {
  const response = await api.put(`/admin/products/${productId}/reviews/${reviewId}/approve`);
  return response.data.data;
};

export const rejectProductReview = async (productId, reviewId) => {
  const response = await api.put(`/admin/products/${productId}/reviews/${reviewId}/reject`);
  return response.data.data;
};

export const hideProductReview = async (productId, reviewId) => {
  const response = await api.put(`/admin/products/${productId}/reviews/${reviewId}/hide`);
  return response.data.data;
};

export const adminDeleteProductReview = async (productId, reviewId) => {
  const response = await api.delete(`/admin/products/${productId}/reviews/${reviewId}`);
  return response.data;
};

// ─────────────────────────────────────────────
// Commerce Orders Admin API
// ─────────────────────────────────────────────

export const getAdminCommerceOrders = async () => {
  const response = await api.get('/owner/orders');
  return response.data.data;
};

export const getAdminCommerceOrder = async (id) => {
  const response = await api.get(`/owner/orders/${id}`);
  return response.data.data;
};

export const confirmCommerceOrder = async (id) => {
  const response = await api.put(`/owner/orders/${id}/confirm`);
  return response.data.data;
};

export const packCommerceOrder = async (id) => {
  const response = await api.put(`/owner/orders/${id}/pack`);
  return response.data.data;
};

export const shipCommerceOrder = async (id) => {
  const response = await api.put(`/owner/orders/${id}/ship`);
  return response.data.data;
};

export const outForDeliveryCommerceOrder = async (id) => {
  const response = await api.put(`/owner/orders/${id}/out-for-delivery`);
  return response.data.data;
};

export const deliverCommerceOrder = async (id) => {
  const response = await api.put(`/owner/orders/${id}/deliver`);
  return response.data.data;
};

export const cancelCommerceOrder = async (id, note) => {
  const response = await api.put(`/owner/orders/${id}/cancel`, { note });
  return response.data.data;
};

// ─────────────────────────────────────────────
// Delivery Tracking Admin API
// ─────────────────────────────────────────────

export const getOrderTracking = async (orderId) => {
  const response = await api.get(`/owner/orders/${orderId}/tracking`);
  return response.data.data;
};

export const createOrderTracking = async (orderId, data) => {
  const response = await api.post(`/owner/orders/${orderId}/tracking`, data);
  return response.data.data;
};

export const updateTrackingStatus = async (orderId, data) => {
  const response = await api.put(`/owner/orders/${orderId}/tracking/status`, data);
  return response.data.data;
};

// ─────────────────────────────────────────────
// Owner Coupon API
// ─────────────────────────────────────────────

export const getOwnerCoupons = async (params) => {
  const response = await api.get('/owner/coupons', { params });
  return response.data.data;
};

export const createOwnerCoupon = async (data) => {
  const response = await api.post('/owner/coupons', data);
  return response.data.data;
};

export const updateOwnerCoupon = async (id, data) => {
  const response = await api.put(`/owner/coupons/${id}`, data);
  return response.data.data;
};

export const toggleOwnerCoupon = async (id) => {
  const response = await api.patch(`/owner/coupons/${id}/toggle`);
  return response.data.data;
};

export const deleteOwnerCoupon = async (id) => {
  const response = await api.delete(`/owner/coupons/${id}`);
  return response.data.data;
};

// ─────────────────────────────────────────────
// Owner Product Review API
// ─────────────────────────────────────────────

export const getOwnerProductReviews = async (productId, params) => {
  const response = await api.get(`/owner/products/${productId}/reviews`, { params });
  return response.data.data;
};

export const replyToOwnerProductReview = async (productId, reviewId, data) => {
  const response = await api.post(`/owner/products/${productId}/reviews/${reviewId}/reply`, data);
  return response.data.data;
};

export const deleteOwnerProductReviewReply = async (productId, reviewId) => {
  const response = await api.delete(`/owner/products/${productId}/reviews/${reviewId}/reply`);
  return response.data.data;
};

// ─────────────────────────────────────────────
// Customer Commerce API (uses customerToken)
// ─────────────────────────────────────────────

export const customerApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

customerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('customerToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

customerApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customerUser');
    }
    return Promise.reject(error);
  }
);

// Cart API
export const getCart = async () => {
  const response = await customerApi.get('/cart');
  return response.data.data || response.data;
};

export const addToCart = async (data) => {
  const response = await customerApi.post('/cart/add', data);
  return response.data;
};

export const updateCartItem = async (itemId, data) => {
  const response = await customerApi.put(`/cart/${itemId}`, data);
  return response.data;
};

export const removeCartItem = async (itemId) => {
  const response = await customerApi.delete(`/cart/${itemId}`);
  return response.data;
};

export const clearCart = async () => {
  const response = await customerApi.delete('/cart');
  return response.data;
};

// Checkout API
export const validateCheckout = async () => {
  const response = await customerApi.post('/checkout/validate');
  return response.data;
};

export const createCommerceOrder = async (data) => {
  const response = await customerApi.post('/checkout/create-order', data);
  return response.data;
};

export const createPayment = async (data) => {
  const response = await customerApi.post('/checkout/create-payment', data);
  return response.data;
};

export const verifyPayment = async (data) => {
  const response = await customerApi.post('/checkout/verify-payment', data);
  return response.data;
};

// Shipping Address API
export const getAddresses = async () => {
  const response = await customerApi.get('/shipping-addresses');
  return response.data.data;
};

export const createAddress = async (data) => {
  const response = await customerApi.post('/shipping-addresses', data);
  return response.data.data;
};

export const updateAddress = async (id, data) => {
  const response = await customerApi.put(`/shipping-addresses/${id}`, data);
  return response.data.data;
};

export const deleteAddress = async (id) => {
  const response = await customerApi.delete(`/shipping-addresses/${id}`);
  return response.data;
};

export const setDefaultAddress = async (id) => {
  const response = await customerApi.put(`/shipping-addresses/${id}/default`);
  return response.data.data;
};

// Coupon API (Customer)
export const validateCoupon = async (data) => {
  const response = await customerApi.post('/coupons/validate', data);
  return response.data.data;
};

// Commerce Orders API (Customer)
export const getMyCommerceOrders = async () => {
  const response = await customerApi.get('/commerce-orders/my');
  return response.data.data;
};

export const getMyCommerceOrder = async (id) => {
  const response = await customerApi.get(`/commerce-orders/my/${id}`);
  return response.data.data;
};

export const customerCancelOrder = async (id, reason) => {
  const response = await customerApi.post(`/commerce-orders/${id}/cancel`, { reason });
  return response.data;
};

export const getOrderTimeline = async (id) => {
  const response = await customerApi.get(`/commerce-orders/${id}/timeline`);
  return response.data.data;
};

// Customer Delivery Tracking
export const getCustomerOrderTracking = async (orderId) => {
  const response = await customerApi.get(`/orders/${orderId}/tracking`);
  return response.data.data;
};

// Customer Measurements API
export const getMyMeasurements = async () => {
  const response = await customerApi.get('/measurements/me');
  return response.data;
};

export const saveMyMeasurements = async (data) => {
  const response = await customerApi.put('/measurements/me', data);
  return response.data;
};

export const deleteMyMeasurements = async () => {
  const response = await customerApi.delete('/measurements/me');
  return response.data;
};

// Customer Booking API
export const getMyBookings = async () => {
  const response = await customerApi.get('/bookings/my');
  return response.data;
};

export const createBooking = async (data) => {
  const response = await customerApi.post('/bookings', data);
  return response.data;
};

// ── Customer Product Reviews ──────────────────────────────────────────

export const getProductReviews = async (productId) => {
  const response = await api.get(`/products/${productId}/reviews`);
  return response.data.data;
};

export const getProductReviewSummary = async (productId) => {
  const response = await api.get(`/products/${productId}/reviews/summary`);
  return response.data.data;
};

export const createProductReview = async (productId, data) => {
  const response = await customerApi.post(`/products/${productId}/reviews`, data);
  return response.data.data;
};

export const updateProductReview = async (productId, reviewId, data) => {
  const response = await customerApi.put(`/products/${productId}/reviews/${reviewId}`, data);
  return response.data.data;
};

export const deleteProductReview = async (productId, reviewId) => {
  const response = await customerApi.delete(`/products/${productId}/reviews/${reviewId}`);
  return response.data;
};

// ── Returns API ───────────────────────────────────────────────────────

export const createReturnRequest = async (data) => {
  const response = await customerApi.post('/returns', data);
  return response.data.data;
};

export const getMyReturns = async () => {
  const response = await customerApi.get('/returns/my');
  return response.data.data;
};

export const getReturnDetails = async (id) => {
  const response = await customerApi.get(`/returns/${id}`);
  return response.data.data;
};

// ── Exchanges API ────────────────────────────────────────────────────

export const createExchangeRequest = async (data) => {
  const response = await customerApi.post('/exchanges', data);
  return response.data.data;
};

export const getMyExchanges = async () => {
  const response = await customerApi.get('/exchanges/my');
  return response.data.data;
};

export const getExchangeDetails = async (id) => {
  const response = await customerApi.get(`/exchanges/${id}`);
  return response.data.data;
};

// ── Customer Tickets API ──────────────────────────────────────────────

export const createTicket = async (data) => {
  const response = await customerApi.post('/tickets', data);
  return response.data;
};

// ── Customer Notifications API ──────────────────────────────────────────

export const getCustomerNotifications = async (params = {}) => {
  const response = await customerApi.get('/customer/notifications', { params });
  return response.data;
};

export const getCustomerUnreadNotificationCount = async () => {
  const response = await customerApi.get('/customer/notifications/unread-count');
  return response.data;
};

export const markCustomerNotificationRead = async (id) => {
  const response = await customerApi.patch(`/customer/notifications/${id}/read`);
  return response.data;
};

export const markAllCustomerNotificationsRead = async () => {
  const response = await customerApi.patch('/customer/notifications/read-all');
  return response.data;
};

export const deleteCustomerNotification = async (id) => {
  const response = await customerApi.delete(`/customer/notifications/${id}`);
  return response.data;
};

// ── Admin Notifications API ─────────────────────────────────────────────

export const getAdminNotifications = async (params = {}) => {
  const response = await api.get('/admin/notifications', { params });
  return response.data;
};

export const getAdminUnreadNotificationCount = async () => {
  const response = await api.get('/admin/notifications/unread-count');
  return response.data;
};

export const markAdminNotificationRead = async (id) => {
  const response = await api.patch(`/admin/notifications/${id}/read`);
  return response.data;
};

export const markAllAdminNotificationsRead = async () => {
  const response = await api.patch('/admin/notifications/read-all');
  return response.data;
};

export const deleteAdminNotification = async (id) => {
  const response = await api.delete(`/admin/notifications/${id}`);
  return response.data;
};

export default api;

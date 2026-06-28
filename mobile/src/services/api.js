import { logRequest, logResponse, logError } from '../utils/apiLogger';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getToken, removeToken } from './tokenStorage';

function getDefaultApiHost() {
    const hostFromExpo =
        Constants.expoConfig?.hostUri ||
        Constants.expoGoConfig?.debuggerHost ||
        Constants.manifest2?.extra?.expoGo?.debuggerHost;

    if (hostFromExpo) {
        return hostFromExpo.split(':')[0];
    }

    // Android emulator maps localhost to host machine through 10.0.2.2
    if (Platform.OS === 'android') return '10.0.2.2';
    return 'localhost';
}

const BASE_URL = Platform.OS === 'web'
    ? 'http://localhost:3005'
    : (process.env.EXPO_PUBLIC_API_URL || `http://${getDefaultApiHost()}:3005`);

const pendingRequests = {};
let apiCallCount = 0;

/**
 * Centralized Fetch Wrapper
 * Handles logging, error parsing, and auth headers.
 */
async function apiCall(method, endpoint, body = null, customHeaders = {}) {
    const cacheKey = `${method}:${endpoint}:${body ? JSON.stringify(body) : ''}`;
    
    if (pendingRequests[cacheKey]) {
        console.log(`[DEDUPLICATE] Reusing pending request promise for: ${endpoint}`);
        return pendingRequests[cacheKey];
    }

    apiCallCount++;
    console.log(`[METRIC] API Request: ${method} ${endpoint} (Total: ${apiCallCount})`);

    const url = `${BASE_URL}${endpoint}`;
    const startTime = Date.now();
    
    const headers = {
        'Content-Type': 'application/json',
        ...customHeaders
    };

    // Authentication: automatically attach Bearer token from AsyncStorage
    const token = await getToken(); 
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log(`[AUTH] Token Found: YES`);
        console.log(`[AUTH HEADER] Bearer ${token.substring(0, 20)}...${token.slice(-4)}`);
    } else {
        console.log(`[AUTH] Token Found: NO`);
    }
    
    console.log("[API CALL]", endpoint);
    console.log(`[API] ${method} ${url} Triggered`);
    logRequest(method, url, body, headers);

    const promise = (async () => {
        try {
            const options = {
                method,
                headers,
            };
            if (body) options.body = JSON.stringify(body);

            const response = await fetch(url, options);
            const data = await response.json();

            console.log("[API RESPONSE]", data);
            if (!response.ok) {
                const error = new Error(data.message || `API Error: ${response.status}`);
                error.status = response.status;
                error.response = data;
                throw error;
            }

            logResponse(method, url, data, startTime, response.status);
            return data;
        } catch (error) {
            logError(method, url, error, startTime, error.status);
            throw error;
        }
    })();

    pendingRequests[cacheKey] = promise;

    try {
        return await promise;
    } finally {
        delete pendingRequests[cacheKey];
    }
}

// --- MODULE: AUTH ---
const login = (credentials) => apiCall('POST', '/auth/login', credentials);
const logout = () => apiCall('POST', '/auth/logout');
const sendOtp = (phone) => apiCall('POST', '/auth/send-otp', { phone });
const verifyOtp = (phone, otp) => apiCall('POST', '/auth/verify-otp', { phone, otp });

// --- MODULE: BOUTIQUE ---
const fetchBoutiques = () => apiCall('GET', '/boutiques/public');
const fetchBoutiqueById = (id) => apiCall('GET', `/boutiques/public/${id}`);

// --- MODULE: DESIGN ---
const fetchDesigns = (boutiqueId) => apiCall('GET', `/designs?boutiqueId=${boutiqueId}`);
const generateAIDesign = (prompt) => apiCall('POST', '/ai/generate', { prompt });

// --- MODULE: MEASUREMENT ---
const saveMeasurements = (data) => apiCall('POST', '/measurements', data);

// --- MODULE: ORDER ---
const createOrder = (data) => apiCall('POST', '/orders', data);
const fetchOrders = () => apiCall('GET', '/orders');
const fetchOrderById = (id) => apiCall('GET', `/orders/${id}`);
const updateOrderStatus = (id, data) => apiCall('PUT', `/orders/${id}/status`, data);

// --- MODULE: CUSTOMER ORDERS (mobile-specific) ---
const fetchMyOrders = () => apiCall('GET', '/orders/my');
const fetchMyOrderById = (id) => apiCall('GET', `/orders/my/${id}`);
const cancelMyOrder = (id, reason) => apiCall('POST', `/orders/${id}/cancel`, { reason });

// --- MODULE: NOTIFICATION ---
const fetchNotifications = () => apiCall('GET', '/notifications');
const markAsRead = (id) => apiCall('PUT', `/notifications/${id}/read`);

// --- MODULE: PAYMENT ---
const createPaymentOrder = (data) => apiCall('POST', '/payments/create-order', data);
const verifyPayment = (data) => apiCall('POST', '/payments/verify', data);

// --- MODULE: BOOKING & REVIEWS ---
const createBooking = (data) => apiCall('POST', '/bookings', data);
const fetchBoutiqueReviews = (boutiqueId) => apiCall('GET', `/reviews/boutique/${boutiqueId}`);

// --- MODULE: SUPPORT / TICKETS ---
const createTicket = (data) => apiCall('POST', '/tickets', data);

// --- MODULE: CART ---
const fetchCart = () => apiCall('GET', '/cart');
const addToCart = (data) => apiCall('POST', '/cart/add', data);
const updateCartItem = (itemId, data) => apiCall('PUT', `/cart/${itemId}`, data);
const removeCartItem = (itemId) => apiCall('DELETE', `/cart/${itemId}`);

// --- MODULE: ADDRESS ---
const fetchAddresses = () => apiCall('GET', '/shipping-addresses');
const createAddress = (data) => apiCall('POST', '/shipping-addresses', data);
const updateAddress = (id, data) => apiCall('PUT', `/shipping-addresses/${id}`, data);
const deleteAddress = (id) => apiCall('DELETE', `/shipping-addresses/${id}`);
const setDefaultAddress = (id) => apiCall('PUT', `/shipping-addresses/${id}/default`);

// --- MODULE: CHECKOUT ---
const validateCheckout = () => apiCall('POST', '/checkout/validate');
const createCheckoutOrder = (data) => apiCall('POST', '/checkout/create-order', data);
const createCheckoutPayment = (data) => apiCall('POST', '/checkout/create-payment', data);
const verifyCheckoutPayment = (data) => apiCall('POST', '/checkout/verify-payment', data);
const cancelCheckoutOrder = (data) => apiCall('POST', '/checkout/cancel', data);

// --- MODULE: COUPONS ---
const validateCoupon = (data) => apiCall('POST', '/coupons/validate', data);

// Centralized API Export
const api = {
    BASE_URL,
    // Auth
    login,
    logout,
    sendOtp,
    verifyOtp,
    
    // Boutiques
    fetchBoutiques,
    fetchBoutiqueById,
    
    // Designs
    fetchDesigns,
    generateAIDesign,
    
    // Measurements
    saveMeasurements,
    
    // Orders
    createOrder,
    fetchOrders,
    fetchOrderById,
    updateOrderStatus,
    
    // Customer Orders
    fetchMyOrders,
    fetchMyOrderById,
    cancelMyOrder,
    
    // Notifications
    fetchNotifications,
    markAsRead,

    // Payments
    createPaymentOrder,
    verifyPayment,

    // Bookings & Reviews
    createBooking,
    fetchBoutiqueReviews,

    // Support
    createTicket,

    // Cart
    fetchCart,
    addToCart,
    updateCartItem,
    removeCartItem,

    // Address
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,

    // Checkout
    validateCheckout,
    createCheckoutOrder,
    createCheckoutPayment,
    verifyCheckoutPayment,
    cancelCheckoutOrder,

    // Coupons
    validateCoupon
};

export default api;

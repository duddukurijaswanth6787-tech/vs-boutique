import api from './api';
import { Alert, Platform } from 'react-native';

let RazorpayCheckout;
try {
    RazorpayCheckout = require('react-native-razorpay').default;
} catch (e) {
    console.warn('[PAYMENT] Razorpay SDK not found. Using fallback flow.');
}

const MAX_RETRIES = 2;
const RETRY_DELAY = 1500;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const isOnline = async () => {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        await fetch('https://api.razorpay.com', { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeout);
        return true;
    } catch {
        return false;
    }
};

const showAlert = (title, message, cb) => {
    return new Promise((resolve) => {
        Alert.alert(title, message, [{ text: 'OK', onPress: () => { if (cb) cb(); resolve(); } }], { cancelable: false });
    });
};

const createPaymentOrder = async (amount, userInfo = {}) => {
    const orderData = await api.createPaymentOrder({
        amount: Math.round(amount),
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
        orderId: userInfo.orderId,
        boutiqueId: userInfo.boutiqueId
    });
    return orderData;
};

export const startPayment = async (amount, description, userInfo = {}) => {
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (attempt > 1) {
                console.log(`[PAYMENT] Retry attempt ${attempt}/${MAX_RETRIES}`);
                await sleep(RETRY_DELAY * attempt);
            }

            const online = await isOnline();
            if (!online) {
                await showAlert(
                    'No Internet Connection',
                    'Please check your internet connection and try again.'
                );
                throw new Error('No internet connection');
            }

            console.log(`[PAYMENT] Attempt ${attempt}: Starting payment for ₹${amount}`);

            const orderData = await createPaymentOrder(amount, userInfo);
            console.log('[PAYMENT] Backend Order Created:', orderData.razorpay_order_id);

            if (RazorpayCheckout) {
                return await new Promise((resolve, reject) => {
                    const options = {
                        description: description || 'Payment for VS Boutique',
                        image: 'https://vsboutique.shop/logo.png',
                        currency: 'INR',
                        key: orderData.key || process.env.EXPO_PUBLIC_RAZORPAY_KEY,
                        amount: orderData.amount,
                        name: 'VS Boutique',
                        order_id: orderData.razorpay_order_id,
                        prefill: {
                            email: userInfo.email || '',
                            contact: userInfo.phone || '',
                            name: userInfo.name || 'VS Customer'
                        },
                        theme: { color: '#8B0000' },
                        modal: {
                            ondismiss: () => {
                                reject(new Error('Payment cancelled by user'));
                            }
                        }
                    };
                    RazorpayCheckout.open(options).then(async (data) => {
                        console.log('[PAYMENT] Checkout Success:', data.razorpay_payment_id);
                        try {
                            const verification = await api.verifyPayment({
                                razorpay_order_id: data.razorpay_order_id,
                                razorpay_payment_id: data.razorpay_payment_id,
                                razorpay_signature: data.razorpay_signature,
                                orderId: userInfo.orderId
                            });
                            resolve({ ...verification, paymentId: data.razorpay_payment_id });
                        } catch (err) {
                            console.error('[PAYMENT] Verification failed:', err);
                            reject(new Error(err.message || 'Payment verification failed. Please contact support.'));
                        }
                    }).catch((error) => {
                        console.error('[PAYMENT] Checkout Error:', error);
                        const errorMsg = error.description || error.message || 'Transaction cancelled';
                        reject(new Error(errorMsg));
                    });
                });
            } else {
                await showAlert(
                    'Payment Success (Demo)',
                    `₹${amount} paid successfully in demo mode.\n\nOrder: ${userInfo.orderId || 'N/A'}`
                );
                return { message: 'Mock verification successful', paymentId: `mock_${Date.now()}` };
            }
        } catch (error) {
            lastError = error;
            console.error(`[PAYMENT] Attempt ${attempt} failed:`, error.message);

            if (attempt < MAX_RETRIES) {
                const shouldRetry = await new Promise((resolve) => {
                    Alert.alert(
                        'Payment Failed',
                        `${error.message}\n\nWould you like to retry?`,
                        [
                            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                            { text: 'Retry', onPress: () => resolve(true) }
                        ]
                    );
                });
                if (!shouldRetry) break;
            }
        }
    }

    if (lastError) {
        await showAlert(
            'Payment Failed',
            lastError.message || 'Could not complete payment. Please try again later.'
        );
        throw lastError;
    }
};

export const retryPayment = async (orderId, amount, userInfo) => {
    return startPayment(amount, `Retry payment for order ${orderId}`, { ...userInfo, orderId });
};

export const verifyExistingPayment = async (razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId) => {
    return await api.verifyPayment({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        orderId
    });
};

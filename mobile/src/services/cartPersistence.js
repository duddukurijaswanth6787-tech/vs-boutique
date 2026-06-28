import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_KEY = '@vs_boutique_cart';

export const getLocalCart = async () => {
    try {
        const json = await AsyncStorage.getItem(CART_KEY);
        const cart = json ? JSON.parse(json) : [];
        return Array.isArray(cart) ? cart : [];
    } catch (e) {
        console.error('[CART] Failed to read local cart:', e.message);
        return [];
    }
};

export const saveLocalCart = async (items) => {
    try {
        const cart = Array.isArray(items) ? items : [];
        await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart));
        return true;
    } catch (e) {
        console.error('[CART] Failed to save local cart:', e.message);
        return false;
    }
};

export const clearLocalCart = async () => {
    try {
        await AsyncStorage.removeItem(CART_KEY);
        return true;
    } catch (e) {
        console.error('[CART] Failed to clear local cart:', e.message);
        return false;
    }
};

export const addToLocalCart = async (item) => {
    const cart = await getLocalCart();
    const existingIndex = cart.findIndex(
        ci => ci.designId === item.designId && ci.boutiqueId === item.boutiqueId
    );
    if (existingIndex >= 0) {
        cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
    } else {
        cart.push({ ...item, quantity: 1, id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` });
    }
    await saveLocalCart(cart);
    return cart;
};

export const removeFromLocalCart = async (itemId) => {
    const cart = await getLocalCart();
    const filtered = cart.filter(item => item.id !== itemId);
    await saveLocalCart(filtered);
    return filtered;
};

export const updateLocalCartItem = async (itemId, updates) => {
    const cart = await getLocalCart();
    const index = cart.findIndex(item => item.id === itemId);
    if (index >= 0) {
        cart[index] = { ...cart[index], ...updates };
        await saveLocalCart(cart);
    }
    return cart;
};

export const getLocalCartCount = async () => {
    const cart = await getLocalCart();
    return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
};

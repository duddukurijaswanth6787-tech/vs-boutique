import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@vs_boutique_token';
const USER_KEY = '@vs_boutique_user';

export const saveToken = async (token) => {
    try {
        await AsyncStorage.setItem(TOKEN_KEY, token);
        console.log('[AUTH] Token saved to AsyncStorage');
        return true;
    } catch (e) {
        console.error('[AUTH] Failed to save token:', e.message);
        return false;
    }
};

export const getToken = async () => {
    try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        console.log('[AUTH] Token read from AsyncStorage:', token ? 'YES (length: ' + token.length + ')' : 'NO');
        return token;
    } catch (e) {
        console.error('[AUTH] Failed to read token:', e.message);
        return null;
    }
};

export const removeToken = async () => {
    try {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(USER_KEY);
        console.log('[AUTH] Token cleared from AsyncStorage');
        return true;
    } catch (e) {
        console.error('[AUTH] Failed to clear token:', e.message);
        return false;
    }
};

export const saveUser = async (user) => {
    try {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        console.log('[AUTH] User data saved to AsyncStorage');
        return true;
    } catch (e) {
        console.error('[AUTH] Failed to save user:', e.message);
        return false;
    }
};

export const getUser = async () => {
    try {
        const userJson = await AsyncStorage.getItem(USER_KEY);
        if (userJson) {
            console.log('[AUTH] User data read from AsyncStorage');
            return JSON.parse(userJson);
        }
        return null;
    } catch (e) {
        console.error('[AUTH] Failed to read user:', e.message);
        return null;
    }
};

import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getToken, getUser } from '../src/services/tokenStorage';
import useStore from '../src/store/useStore';
import HomeScreen from '../src/screens/HomeScreen';
import LoginScreen from '../src/screens/LoginScreen';

export default function Index() {
    const [checking, setChecking] = useState(true);
    const isAuthenticated = useStore((state) => state.isAuthenticated);
    const setAuth = useStore((state) => state.setAuth);
    const router = useRouter();

    useEffect(() => {
        async function checkAuth() {
            try {
                const token = await getToken();
                const user = await getUser();
                console.log('[AUTH] App startup - token found:', !!token);
                if (token && user) {
                    setAuth(user, token);
                    console.log('[AUTH] Session restored for user:', user.name || user.phone);
                } else {
                    console.log('[AUTH] No saved session, showing login');
                }
            } catch (e) {
                const message = e instanceof Error ? e.message : String(e);
                console.error('[AUTH] Startup check error:', message);
            } finally {
                setChecking(false);
            }
        }
        checkAuth();
    }, []);

    if (checking) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a0a0a' }}>
                <ActivityIndicator size="large" color="#C89B3C" />
            </View>
        );
    }

    if (isAuthenticated) {
        return <HomeScreen />;
    }

    return <LoginScreen />;
}

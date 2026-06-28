import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { getLocalCartCount } from '../services/cartPersistence';

const PRIMARY = '#8B0000';

const BottomNavigation = ({ activeTab }) => {
    const router = useRouter();
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        const loadCount = async () => {
            const count = await getLocalCartCount();
            setCartCount(count);
        };
        loadCount();
        const interval = setInterval(loadCount, 5000);
        return () => clearInterval(interval);
    }, []);

    const tabs = [
        { name: 'Home', icon: 'home', iconActive: 'home', route: '/home' },
        { name: 'Cart', icon: 'cart-outline', iconActive: 'cart', route: '/Cart', badge: cartCount },
        { name: 'Add', icon: 'add', route: '/design', isCenter: true },
        { name: 'Orders', icon: 'bag-outline', iconActive: 'bag', route: '/MyOrders' },
        { name: 'Profile', icon: 'person-outline', iconActive: 'person', route: '/profile' }
    ];

    return (
        <View style={styles.nav}>
            {tabs.map((tab, index) => (
                <TouchableOpacity
                    key={index}
                    style={[styles.navItem, tab.isCenter && styles.centerButton]}
                    onPress={() => router.push(tab.route)}
                >
                    <View>
                        <Ionicons
                            name={tab.isCenter ? tab.icon : (activeTab === tab.name ? tab.iconActive : tab.icon)}
                            size={tab.isCenter ? 28 : 22}
                            color={activeTab === tab.name ? PRIMARY : (tab.isCenter ? '#fff' : '#999')}
                        />
                        {tab.badge > 0 && !tab.isCenter && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{tab.badge > 9 ? '9+' : tab.badge}</Text>
                            </View>
                        )}
                    </View>
                    {!tab.isCenter && (
                        <Text style={[styles.navText, activeTab === tab.name && styles.navTextActive]}>
                            {tab.name}
                        </Text>
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    nav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingVertical: 8,
        paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 14,
    },
    navItem: { alignItems: 'center', justifyContent: 'center', minHeight: 48, minWidth: 56 },
    navText: { fontSize: 10, color: '#999', marginTop: 3, fontWeight: '600' },
    navTextActive: { color: PRIMARY, fontWeight: '800' },
    centerButton: {
        backgroundColor: PRIMARY,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -20,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 10,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: '#D32F2F',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: '#FFF',
    },
    badgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
});

export default BottomNavigation;

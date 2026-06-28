import React, { useEffect } from 'react';
import { 
    StyleSheet, Text, View, Image, TouchableOpacity, 
    ScrollView, SafeAreaView, Dimensions, Alert 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useStore from '../store/useStore';
import { removeToken } from '../services/tokenStorage';

const { width: W } = Dimensions.get('window');
const PRIMARY = '#8B0000';
const BG = '#FAF6F2';

const ProfileScreen = () => {
    const router = useRouter();
    const clearAuth = useStore((state) => state.clearAuth);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout', style: 'destructive', onPress: async () => {
                        try {
                            await removeToken();
                            clearAuth();
                            router.replace('/');
                        } catch (e) {
                            console.error('[AUTH] Logout failed:', e.message);
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        console.log('[SCREEN MOUNT] Profile');
        return () => {
            console.log('[SCREEN UNMOUNT] Profile');
        };
    }, []);

    const MenuItem = ({ icon, label, sublabel, route, onPress, color = PRIMARY, right }) => (
        <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
                if (onPress) onPress();
                else if (route) router.push(route);
            }}
        >
            <View style={[styles.menuIcon, { backgroundColor: color + '10' }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{label}</Text>
                {sublabel && <Text style={styles.menuSublabel}>{sublabel}</Text>}
            </View>
            {right || <Ionicons name="chevron-forward" size={20} color="#CCC" />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safe}>
            {/* Top Navigation */}
            <View style={styles.topNav}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
                    <Ionicons name="chevron-back" size={24} color="#222" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                
                {/* Profile Header */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <Image 
                            source={{ uri: 'https://placehold.co/100x100/8B0000/FFFFFF?text=JD' }} 
                            style={styles.avatar} 
                        />
                        <TouchableOpacity style={styles.editBtn}>
                            <Ionicons name="camera" size={16} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>Jashwanth Duddukur</Text>
                    <Text style={styles.userEmail}>jashwanth@example.com</Text>
                </View>

                {/* Account Stats */}
                <View style={styles.statsRow}>
                    <TouchableOpacity style={styles.statBox} onPress={() => router.push('/MyOrders')}>
                        <Text style={styles.statVal}>12</Text>
                        <Text style={styles.statLbl}>Orders</Text>
                    </TouchableOpacity>
                    <View style={[styles.statBox, styles.statBorder]}>
                        <Text style={styles.statVal}>4</Text>
                        <Text style={styles.statLbl}>Saved Sizes</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statVal}>8</Text>
                        <Text style={styles.statLbl}>Wishlist</Text>
                    </View>
                </View>

                {/* Menu Sections */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>MY FASHION TOOLS</Text>
                    <MenuItem 
                        icon="resize-outline" 
                        label="Digital Tape" 
                        sublabel="Manage your body measurements" 
                        route="/measurements"
                    />
                    <MenuItem 
                        icon="heart-outline" 
                        label="Saved Designs" 
                        sublabel="Your wishlist items"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ORDERS & PAYMENTS</Text>
                    <MenuItem 
                        icon="bag-handle-outline" 
                        label="Order History" 
                        sublabel="Track and view past orders"
                        route="/MyOrders"
                    />
                    <MenuItem 
                        icon="location-outline" 
                        label="Saved Addresses" 
                        sublabel="Manage your shipping addresses"
                        route="/AddressList"
                        color="#2E7D32"
                    />
                    <MenuItem 
                        icon="card-outline" 
                        label="Payment Methods" 
                        sublabel="Saved cards & UPI"
                        color="#2E7D32"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>LEGAL</Text>
                    <MenuItem 
                        icon="document-text-outline" 
                        label="Privacy Policy" 
                        route="/privacy-policy"
                        color="#555"
                    />
                    <MenuItem 
                        icon="scale-outline" 
                        label="Terms & Conditions" 
                        route="/terms-conditions"
                        color="#555"
                    />
                    <MenuItem 
                        icon="return-up-back-outline" 
                        label="Refund Policy" 
                        route="/refund-policy"
                        color="#555"
                    />
                    <MenuItem 
                        icon="cube-outline" 
                        label="Shipping Policy" 
                        route="/shipping-policy"
                        color="#555"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ABOUT</Text>
                    <MenuItem 
                        icon="information-circle-outline" 
                        label="About Us" 
                        route="/about"
                        color="#1976D2"
                    />
                    <MenuItem 
                        icon="chatbubble-ellipses-outline" 
                        label="Contact Us" 
                        route="/contact"
                        color="#1976D2"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ACCOUNT</Text>
                    <MenuItem 
                        icon="log-out-outline" 
                        label="Logout" 
                        color="#D32F2F"
                        onPress={handleLogout}
                    />
                </View>

                <Text style={styles.version}>VS Boutique v1.0.4</Text>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BG },
    topNav: {
        paddingHorizontal: 20,
        paddingTop: 10,
        backgroundColor: '#FFF',
    },
    backCircle: { 
        width: 40, height: 40, borderRadius: 20, backgroundColor: BG, 
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
    },
    header: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#FFF' },
    avatarContainer: { position: 'relative', marginBottom: 15 },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: BG },
    editBtn: { 
        position: 'absolute', bottom: 0, right: 0, 
        backgroundColor: PRIMARY, width: 32, height: 32, 
        borderRadius: 16, alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#FFF'
    },
    userName: { fontSize: 22, fontWeight: '900', color: '#222', letterSpacing: -0.5 },
    userEmail: { fontSize: 13, fontWeight: '600', color: '#999', marginTop: 4 },

    statsRow: { 
        flexDirection: 'row', backgroundColor: '#FFF', 
        paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F0F0F0' 
    },
    statBox: { flex: 1, alignItems: 'center' },
    statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F0F0F0' },
    statVal: { fontSize: 18, fontWeight: '900', color: PRIMARY },
    statLbl: { fontSize: 11, fontWeight: '700', color: '#999', textTransform: 'uppercase', marginTop: 2 },

    section: { padding: 20 },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: '#999', letterSpacing: 1.5, marginBottom: 15 },
    
    menuItem: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', 
        padding: 16, borderRadius: 20, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
    },
    menuIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    menuText: { flex: 1 },
    menuLabel: { fontSize: 15, fontWeight: '800', color: '#222' },
    menuSublabel: { fontSize: 12, fontWeight: '500', color: '#999', marginTop: 2 },
    
    version: { textAlign: 'center', color: '#CCC', fontSize: 11, fontWeight: '700', paddingVertical: 20 }
});

export default ProfileScreen;

import React, { useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    SafeAreaView, StatusBar, ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const PRIMARY = '#8B0000';
const BG = '#FDFBF9';
const ACCENT = '#C89B3C';

const OrderConfirmationScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { orderId, orderRef, amount, paymentId } = params;

    useEffect(() => {
        console.log('[SCREEN MOUNT] OrderConfirmation');
    }, []);

    return (
        <SafeAreaView style={s.safe}>
            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Success Animation */}
                <View style={s.successIconWrapper}>
                    <View style={s.successCircle}>
                        <Ionicons name="checkmark-circle" size={80} color="#2E7D32" />
                    </View>
                    <Text style={s.successTitle}>Order Placed!</Text>
                    <Text style={s.successSub}>Your order has been confirmed and is being processed.</Text>
                </View>

                {/* Order Details Card */}
                <View style={s.detailsCard}>
                    <View style={s.cardHeader}>
                        <MaterialCommunityIcons name="receipt" size={20} color={PRIMARY} />
                        <Text style={s.cardHeaderTitle}>Order Details</Text>
                    </View>

                    <View style={s.detailRow}>
                        <Text style={s.detailLabel}>Order Reference</Text>
                        <Text style={s.detailValue}>{orderRef || `#VS${Date.now()}`}</Text>
                    </View>
                    <View style={s.detailRow}>
                        <Text style={s.detailLabel}>Order ID</Text>
                        <Text style={s.detailValue}>{orderId || 'N/A'}</Text>
                    </View>
                    <View style={s.detailRow}>
                        <Text style={s.detailLabel}>Amount Paid</Text>
                        <Text style={[s.detailValue, { color: PRIMARY, fontWeight: '900' }]}>₹{amount || '0'}</Text>
                    </View>
                    <View style={s.detailRow}>
                        <Text style={s.detailLabel}>Payment ID</Text>
                        <Text style={s.detailValue} numberOfLines={1}>{paymentId || 'N/A'}</Text>
                    </View>
                    <View style={s.detailRow}>
                        <Text style={s.detailLabel}>Status</Text>
                        <View style={s.statusBadge}>
                            <Text style={s.statusText}>CONFIRMED</Text>
                        </View>
                    </View>
                </View>

                {/* Next Steps */}
                <View style={s.stepsCard}>
                    <View style={s.cardHeader}>
                        <MaterialCommunityIcons name="clock-outline" size={20} color={ACCENT} />
                        <Text style={s.cardHeaderTitle}>What Happens Next?</Text>
                    </View>
                    {[
                        { icon: 'storefront-outline', step: 'Boutique will confirm your order within 24 hours' },
                        { icon: 'tape-measure', step: 'They will take your measurements and start stitching' },
                        { icon: 'hanger', step: 'Garment will go through quality check' },
                        { icon: 'truck-delivery-outline', step: 'Ready item will be delivered to your address' }
                    ].map((item, idx) => (
                        <View key={idx} style={s.stepRow}>
                            <View style={s.stepIcon}>
                                <MaterialCommunityIcons name={item.icon} size={18} color={PRIMARY} />
                            </View>
                            <Text style={s.stepText}>{item.step}</Text>
                        </View>
                    ))}
                </View>

                {/* Action Buttons */}
                <View style={s.actionSection}>
                    <TouchableOpacity
                        style={s.trackBtn}
                        onPress={() => router.replace({ pathname: '/OrderTracking', params: { orderId } })}
                    >
                        <Ionicons name="location-outline" size={20} color="#FFF" />
                        <Text style={s.trackBtnText}>Track Order</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={s.ordersBtn}
                        onPress={() => router.replace('/MyOrders')}
                    >
                        <Ionicons name="bag-handle-outline" size={20} color={PRIMARY} />
                        <Text style={s.ordersBtnText}>My Orders</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={s.homeBtn}
                        onPress={() => router.replace('/home')}
                    >
                        <Ionicons name="home-outline" size={20} color="#888" />
                        <Text style={s.homeBtnText}>Back to Home</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BG },
    scrollContent: { padding: 20 },
    successIconWrapper: { alignItems: 'center', paddingVertical: 30 },
    successCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    successTitle: { fontSize: 28, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
    successSub: { fontSize: 14, color: '#888', fontWeight: '600', textAlign: 'center', marginTop: 8, lineHeight: 20, paddingHorizontal: 20 },
    detailsCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
    cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F0EC' },
    detailLabel: { fontSize: 13, fontWeight: '600', color: '#888' },
    detailValue: { fontSize: 13, fontWeight: '700', color: '#333', maxWidth: '50%', textAlign: 'right' },
    statusBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: '900', color: '#2E7D32', letterSpacing: 0.5 },
    stepsCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 },
    stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
    stepIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: PRIMARY + '10', alignItems: 'center', justifyContent: 'center' },
    stepText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#555', lineHeight: 20 },
    actionSection: { gap: 12, marginTop: 8, marginBottom: 40 },
    trackBtn: { backgroundColor: PRIMARY, height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
    trackBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    ordersBtn: { height: 50, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: PRIMARY, backgroundColor: '#FFF' },
    ordersBtnText: { color: PRIMARY, fontSize: 14, fontWeight: '800' },
    homeBtn: { height: 44, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    homeBtnText: { color: '#888', fontSize: 14, fontWeight: '700' }
});

export default OrderConfirmationScreen;

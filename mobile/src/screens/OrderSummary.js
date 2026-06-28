import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, Image, Dimensions, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../services/api';
import { startPayment } from '../services/PaymentService';
import useStore from '../store/useStore';

const { width: W } = Dimensions.get('window');
const PRIMARY = '#8B0000';
const BG = '#FDFBF9';
const ACCENT = '#C89B3C';
const OrderSummary = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    const [loading, setLoading] = React.useState(false);
    const user = useStore((state) => state.user);

    const { 
        designImage, designName, category, 
        measurements, notes, boutiqueId, designId, price
    } = params;

    let parsedMeasurements = {};
    try {
        parsedMeasurements = measurements ? JSON.parse(measurements) : {};
    } catch {};
    const safeDesignImage =
        typeof designImage === 'string' && designImage.startsWith('https://') ? designImage : null;

    const handlePlaceOrder = async () => {
        setLoading(true);
        try {
            const orderPrice = parseInt(price, 10) || 2499;
            const advanceAmount = Math.min(500, Math.round(orderPrice * 0.2));

            const orderData = {
                boutiqueId,
                designId,
                customerName: user?.name || user?.phone || 'Customer',
                customerPhone: user?.phone || '',
                category,
                designName,
                measurements: parsedMeasurements,
                notes,
                orderStatus: 'pending',
                pricing: {
                    price: orderPrice,
                    advancePaid: 0
                }
            };

            const newOrder = await api.createOrder(orderData);
            console.log("[ORDER] Created ID:", newOrder._id);

            const paymentResult = await startPayment(advanceAmount, `Advance for ${designName}`, {
                orderId: newOrder._id,
                boutiqueId: boutiqueId
            });

            if (paymentResult) {
                router.replace({
                    pathname: '/OrderConfirmation',
                    params: {
                        orderId: newOrder._id,
                        orderRef: newOrder.orderId || newOrder.orderRef || `#VS${Date.now()}`,
                        amount: advanceAmount,
                        paymentId: paymentResult.paymentId || 'N/A'
                    }
                });
            } else {
                Alert.alert(
                    'Order Saved',
                    'Your order is saved, but advance payment was not completed. Please pay from "My Orders" to start processing.',
                    [{ text: 'Go to Orders', onPress: () => router.push('/MyOrders') }]
                );
            }
        } catch (error) {
            console.error("Order Creation Error:", error);
            Alert.alert('Error', 'Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={s.safe}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backCircle}>
                    <Ionicons name="chevron-back" size={24} color="#222" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Review Order</Text>
                <View style={{width: 40}} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
                {/* Design Summary */}
                <View style={s.card}>
                    {safeDesignImage ? (
                        <Image source={{ uri: safeDesignImage }} style={s.mainImg} />
                    ) : (
                        <View style={[s.mainImg, { backgroundColor: '#EEE', justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="image-outline" size={40} color="#CCC" />
                        </View>
                    )}
                    <View style={s.cardInfo}>
                        <Text style={s.catText}>{category}</Text>
                        <Text style={s.nameText}>{designName}</Text>
                        <Text style={s.priceText}>Estimated Price: ₹{parseInt(price, 10) || 2499}</Text>
                    </View>
                </View>

                {/* Measurements Summary */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <MaterialCommunityIcons name="tape-measure" size={20} color={PRIMARY} />
                        <Text style={s.sectionTitle}>Measurements</Text>
                    </View>
                    <View style={s.measureGrid}>
                        {Object.entries(parsedMeasurements).map(([key, val]) => (
                            <View key={key} style={s.measureItem}>
                                <Text style={s.measureKey}>{key.toUpperCase()}</Text>
                                <Text style={s.measureVal}>{val || '—'} <Text style={s.unit}>INCH</Text></Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Notes Summary */}
                {notes ? (
                    <View style={s.section}>
                        <View style={s.sectionHeader}>
                            <MaterialCommunityIcons name="note-text-outline" size={20} color={PRIMARY} />
                            <Text style={s.sectionTitle}>Your Instructions</Text>
                        </View>
                        <Text style={s.notesText}>{notes}</Text>
                    </View>
                ) : null}

                <View style={s.warningBox}>
                    <Ionicons name="information-circle" size={20} color="#888" />
                    <Text style={s.warningText}>Final price and delivery date will be confirmed by the boutique after reviewing your order.</Text>
                </View>

                <View style={{height: 100}} />
            </ScrollView>

            <View style={s.bottomBar}>
                <TouchableOpacity 
                    style={[s.confirmBtn, loading && { opacity: 0.7 }]} 
                    onPress={handlePlaceOrder}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={s.confirmText}>Place Order</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 15, backgroundColor: BG
    },
    backCircle: { 
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', 
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#111' },

    scrollContent: { padding: 20 },
    card: {
        backgroundColor: '#FFF', borderRadius: 25, padding: 15,
        flexDirection: 'row', alignItems: 'center', marginBottom: 25,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03, shadowRadius: 10, elevation: 2
    },
    mainImg: { width: 90, height: 110, borderRadius: 15 },
    cardInfo: { flex: 1, marginLeft: 20 },
    catText: { fontSize: 10, fontWeight: '900', color: ACCENT, textTransform: 'uppercase', letterSpacing: 1 },
    nameText: { fontSize: 18, fontWeight: '900', color: '#222', marginVertical: 4 },
    priceText: { fontSize: 14, fontWeight: '700', color: PRIMARY },

    section: { backgroundColor: '#FFF', borderRadius: 25, padding: 20, marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    sectionTitle: { fontSize: 14, fontWeight: '900', color: '#111', textTransform: 'uppercase', letterSpacing: 0.5 },
    
    measureGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    measureItem: { width: '33.33%', marginBottom: 15 },
    measureKey: { fontSize: 9, fontWeight: '900', color: '#AAA', marginBottom: 2 },
    measureVal: { fontSize: 15, fontWeight: '900', color: '#333' },
    unit: { fontSize: 10, color: '#CCC' },

    notesText: { fontSize: 14, color: '#555', fontWeight: '600', fontStyle: 'italic', lineHeight: 20 },

    warningBox: { 
        flexDirection: 'row', gap: 12, padding: 15, backgroundColor: '#FFF', 
        borderRadius: 20, alignItems: 'center', marginBottom: 25,
        borderWidth: 1, borderColor: '#EEE'
    },
    warningText: { flex: 1, fontSize: 11, fontWeight: '600', color: '#888', lineHeight: 16 },

    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 20, paddingBottom: 35, backgroundColor: BG
    },
    confirmBtn: {
        backgroundColor: PRIMARY, height: 60, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 15, elevation: 8
    },
    confirmText: { color: '#FFF', fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }
});

export default OrderSummary;

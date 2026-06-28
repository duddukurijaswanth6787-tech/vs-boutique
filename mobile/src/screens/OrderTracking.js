import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator, Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../services/api';

const PRIMARY = '#8B0000';
const BG = '#FDFBF9';
const ACCENT = '#C89B3C';

const OrderTracking = () => {
    const router = useRouter();
    const { orderId } = useLocalSearchParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('[SCREEN MOUNT] OrderTracking');
        const loadOrder = async () => {
            console.log('[API REQUEST] OrderTracking -> GET /orders/' + orderId);
            try {
                const data = await api.fetchOrderById(orderId);
                console.log('[API RESPONSE] OrderTracking -> GET /orders/' + orderId + ' 200');
                setOrder(data);
            } catch (error) {
                console.error(error);
                console.log('[API RESPONSE] OrderTracking -> GET /orders/' + orderId + ' ' + (error.status || 500));
            } finally {
                setLoading(false);
            }
        };
        loadOrder();
        return () => {
            console.log('[SCREEN UNMOUNT] OrderTracking');
        };
    }, [orderId]);

    const steps = [
        { key: 'pending', label: 'Order Placed', icon: 'package-variant-closed', desc: 'Awaiting boutique confirmation' },
        { key: 'accepted', label: 'Accepted', icon: 'check-circle-outline', desc: 'Boutique has started processing' },
        { key: 'stitching', label: 'Stitching', icon: 'hanger', desc: 'Your garment is being stitched' },
        { key: 'ready', label: 'Quality Check', icon: 'star-outline', desc: 'Ready for final inspection' },
        { key: 'delivered', label: 'Delivered', icon: 'truck-delivery-outline', desc: 'Package handed over to you' }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === order?.orderStatus?.toLowerCase());

    if (loading) return <View style={s.center}><ActivityIndicator size="large" color={PRIMARY} /></View>;
    if (!order) return <View style={s.center}><Text>Order not found</Text></View>;

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backCircle}>
                    <Ionicons name="chevron-back" size={24} color="#222" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Order Tracking</Text>
                <View style={{width: 40}} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
                {/* Header Info */}
                <View style={s.orderSummary}>
                    <Text style={s.orderIdText}>{order.orderId}</Text>
                    <Text style={s.boutiqueName}>{order.boutiqueId?.name}</Text>
                    <View style={s.priceBadge}>
                        <Text style={s.priceText}>₹{order.pricing?.price}</Text>
                    </View>
                </View>

                {/* Tracking Stepper */}
                <View style={s.stepperContainer}>
                    {steps.map((step, index) => {
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        const isLast = index === steps.length - 1;

                        return (
                            <View key={step.key} style={s.stepRow}>
                                <View style={s.leftColumn}>
                                    <View style={[s.dot, isCompleted ? s.dotActive : s.dotInactive]}>
                                        {isCompleted ? <Ionicons name="checkmark" size={12} color="#FFF" /> : null}
                                    </View>
                                    {!isLast && <View style={[s.line, isCompleted && index < currentStepIndex ? s.lineActive : s.lineInactive]} />}
                                </View>
                                <View style={s.rightColumn}>
                                    <View style={s.stepHeader}>
                                        <MaterialCommunityIcons 
                                            name={step.icon} 
                                            size={20} 
                                            color={isCompleted ? PRIMARY : '#CCC'} 
                                        />
                                        <Text style={[s.stepLabel, isCompleted ? s.stepLabelActive : s.stepLabelInactive]}>
                                            {step.label}
                                        </Text>
                                    </View>
                                    <Text style={s.stepDesc}>{step.desc}</Text>
                                    {isCurrent && (
                                        <View style={s.currentTimeBadge}>
                                            <Text style={s.currentTimeText}>Current Status</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Details Section */}
                <View style={s.detailsSection}>
                    <Text style={s.sectionTitle}>Order Details</Text>
                    <View style={s.detailCard}>
                        <View style={s.detailRow}>
                            <Text style={s.detailKey}>Category</Text>
                            <Text style={s.detailVal}>{order.category}</Text>
                        </View>
                        <View style={s.detailRow}>
                            <Text style={s.detailKey}>Design</Text>
                            <Text style={s.detailVal}>{order.designName}</Text>
                        </View>
                        <View style={s.detailRow}>
                            <Text style={s.detailKey}>Placed On</Text>
                            <Text style={s.detailVal}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
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
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    scrollContent: { padding: 20 },
    orderSummary: { alignItems: 'center', marginBottom: 30 },
    orderIdText: { fontSize: 24, fontWeight: '900', color: '#111' },
    boutiqueName: { fontSize: 14, fontWeight: '700', color: '#888', marginTop: 4 },
    priceBadge: { backgroundColor: PRIMARY + '10', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginTop: 10 },
    priceText: { color: PRIMARY, fontWeight: '900', fontSize: 14 },

    stepperContainer: { backgroundColor: '#FFF', borderRadius: 25, padding: 25, marginBottom: 25 },
    stepRow: { flexDirection: 'row', minHeight: 80 },
    leftColumn: { width: 30, alignItems: 'center' },
    dot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
    dotActive: { backgroundColor: PRIMARY },
    dotInactive: { backgroundColor: '#EEE', borderWidth: 1, borderColor: '#DDD' },
    line: { width: 2, position: 'absolute', top: 20, bottom: 0 },
    lineActive: { backgroundColor: PRIMARY },
    lineInactive: { backgroundColor: '#EEE' },
    rightColumn: { flex: 1, marginLeft: 15, paddingBottom: 30 },
    stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
    stepLabel: { fontSize: 15, fontWeight: '800' },
    stepLabelActive: { color: '#111' },
    stepLabelInactive: { color: '#BBB' },
    stepDesc: { fontSize: 12, color: '#999', fontWeight: '500' },
    currentTimeBadge: { backgroundColor: PRIMARY, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 8 },
    currentTimeText: { color: '#FFF', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },

    detailsSection: { marginTop: 10 },
    sectionTitle: { fontSize: 14, fontWeight: '900', color: '#111', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 15, paddingLeft: 5 },
    detailCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8F8F8' },
    detailKey: { fontSize: 13, color: '#888', fontWeight: '600' },
    detailVal: { fontSize: 13, color: '#333', fontWeight: '800' }
});

export default OrderTracking;

import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    SafeAreaView, ActivityIndicator, RefreshControl, Alert, ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../services/api';

const PRIMARY = '#8B0000';
const BG = '#FDFBF9';
const ACCENT = '#C89B3C';

const STATUS_FILTERS = ['All', 'Pending', 'Accepted', 'Stitching', 'Ready', 'Delivered', 'Cancelled'];

const STATUS_CONFIG = {
    pending: { color: '#FFA500', bg: '#FFF8E1', icon: 'clock-outline', label: 'Pending' },
    accepted: { color: '#4169E1', bg: '#E8EEFD', icon: 'check-circle-outline', label: 'Accepted' },
    stitching: { color: PRIMARY, bg: '#FDE8E8', icon: 'hanger', label: 'Stitching' },
    ready: { color: '#32CD32', bg: '#E8F5E9', icon: 'star-outline', label: 'Ready' },
    delivered: { color: '#006400', bg: '#E8F5E9', icon: 'truck-delivery-outline', label: 'Delivered' },
    cancelled: { color: '#D32F2F', bg: '#FFEBEE', icon: 'close-circle-outline', label: 'Cancelled' }
};

const MyOrders = () => {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');
    const [cancellingId, setCancellingId] = useState(null);

    const loadOrders = useCallback(async () => {
        try {
            const data = await api.fetchMyOrders();
            const list = Array.isArray(data) ? data : data?.orders || data?.data || [];
            setOrders(list);
        } catch (e) {
            console.error('[ORDERS] Fetch error:', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        loadOrders();
    }, [loadOrders]));

    const filteredOrders = activeFilter === 'All'
        ? orders
        : orders.filter(o => o.orderStatus?.toLowerCase() === activeFilter.toLowerCase());

    const handleCancel = (order) => {
        Alert.alert(
            'Cancel Order',
            'Are you sure you want to cancel this order? This action cannot be undone.',
            [
                { text: 'Keep Order', style: 'cancel' },
                {
                    text: 'Cancel Order', style: 'destructive', onPress: async () => {
                        setCancellingId(order._id);
                        try {
                            await api.cancelMyOrder(order._id, 'Cancelled by customer');
                            setOrders(prev => prev.map(o =>
                                o._id === order._id ? { ...o, orderStatus: 'cancelled' } : o
                            ));
                            Alert.alert('Cancelled', 'Your order has been cancelled successfully.');
                        } catch (e) {
                            Alert.alert('Error', e.message || 'Failed to cancel order.');
                        } finally {
                            setCancellingId(null);
                        }
                    }
                }
            ]
        );
    };

    const getStatusConfig = (status) => {
        const s = (status || '').toLowerCase();
        return STATUS_CONFIG[s] || { color: '#888', bg: '#F5F5F5', icon: 'help-circle-outline', label: status || 'Unknown' };
    };

    const renderOrderItem = ({ item }) => {
        const cfg = getStatusConfig(item.orderStatus);
        const canCancel = ['pending', 'accepted'].includes(item.orderStatus?.toLowerCase());
        const isCancelling = cancellingId === item._id;

        return (
            <TouchableOpacity
                style={s.orderCard}
                onPress={() => router.push({ pathname: '/OrderTracking', params: { orderId: item._id } })}
                activeOpacity={0.85}
            >
                <View style={s.cardHeader}>
                    <View style={s.cardHeaderLeft}>
                        <Text style={s.orderId}>{item.orderId || `#${item._id?.slice(-6)}`}</Text>
                        <Text style={s.orderDate}>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
                        <MaterialCommunityIcons name={cfg.icon} size={12} color={cfg.color} />
                        <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                </View>

                <View style={s.cardBody}>
                    <View style={s.infoRow}>
                        <MaterialCommunityIcons name="hanger" size={16} color="#888" />
                        <Text style={s.infoText}>{item.category || 'Custom'} - {item.designName || 'Design'}</Text>
                    </View>
                    <View style={s.infoRow}>
                        <MaterialCommunityIcons name="storefront" size={16} color="#888" />
                        <Text style={s.infoText}>{item.boutiqueId?.name || 'Boutique'}</Text>
                    </View>
                    {item.pricing?.price && (
                        <View style={s.infoRow}>
                            <MaterialCommunityIcons name="currency-inr" size={16} color={PRIMARY} />
                            <Text style={[s.infoText, { color: PRIMARY, fontWeight: '800' }]}>₹{item.pricing.price}</Text>
                        </View>
                    )}
                </View>

                <View style={s.cardFooter}>
                    <TouchableOpacity
                        style={s.trackBtn}
                        onPress={() => router.push({ pathname: '/OrderTracking', params: { orderId: item._id } })}
                    >
                        <Text style={s.trackBtnText}>Track</Text>
                        <Ionicons name="chevron-forward" size={14} color={PRIMARY} />
                    </TouchableOpacity>
                    {canCancel && (
                        <TouchableOpacity
                            style={s.cancelBtn}
                            onPress={() => handleCancel(item)}
                            disabled={isCancelling}
                        >
                            {isCancelling ? (
                                <ActivityIndicator size="small" color="#D32F2F" />
                            ) : (
                                <Text style={s.cancelBtnText}>Cancel</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={s.safe}>
                <View style={s.center}><ActivityIndicator size="large" color={PRIMARY} /></View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backCircle}>
                    <Ionicons name="chevron-back" size={24} color="#222" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>My Orders</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Status Filter Tabs */}
            <View style={s.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
                    {STATUS_FILTERS.map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[s.filterChip, activeFilter === filter && s.filterChipActive]}
                            onPress={() => setActiveFilter(filter)}
                        >
                            <Text style={[s.filterChipText, activeFilter === filter && s.filterChipTextActive]}>
                                {filter}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {filteredOrders.length === 0 ? (
                <View style={s.emptyState}>
                    <MaterialCommunityIcons name="package-variant" size={72} color="#DDD" />
                    <Text style={s.emptyTitle}>
                        {activeFilter === 'All' ? 'No Orders Yet' : `No ${activeFilter} Orders`}
                    </Text>
                    <Text style={s.emptySub}>
                        {activeFilter === 'All'
                            ? 'Your custom creations will appear here.'
                            : `You don't have any orders with status "${activeFilter}".`}
                    </Text>
                    <TouchableOpacity style={s.shopBtn} onPress={() => router.push('/home')}>
                        <Text style={s.shopBtnText}>Start Shopping</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(item) => item._id}
                    renderItem={renderOrderItem}
                    contentContainerStyle={s.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} />}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
    filterContainer: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0E4DC' },
    filterRow: { paddingHorizontal: 20, gap: 8 },
    filterChip: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EDE0D8'
    },
    filterChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
    filterChipText: { fontSize: 12, fontWeight: '700', color: '#888' },
    filterChipTextActive: { color: '#FFF' },
    listContent: { padding: 20 },
    orderCard: {
        backgroundColor: '#FFF', borderRadius: 22, padding: 18, marginBottom: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04, shadowRadius: 10, elevation: 3
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    cardHeaderLeft: { flex: 1 },
    orderId: { fontSize: 15, fontWeight: '900', color: '#1A1A1A' },
    orderDate: { fontSize: 12, color: '#999', fontWeight: '600', marginTop: 2 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    statusText: { fontSize: 10, fontWeight: '900' },
    cardBody: { borderBottomWidth: 1, borderBottomColor: '#F5F0EC', paddingBottom: 14, marginBottom: 14, gap: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    infoText: { fontSize: 13, color: '#555', fontWeight: '600', flex: 1 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    trackBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    trackBtnText: { fontSize: 13, fontWeight: '800', color: PRIMARY },
    cancelBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#FFCDD2' },
    cancelBtnText: { fontSize: 12, fontWeight: '800', color: '#D32F2F' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, marginTop: -40 },
    emptyTitle: { fontSize: 20, fontWeight: '900', color: '#333', marginTop: 20 },
    emptySub: { fontSize: 14, color: '#888', fontWeight: '600', textAlign: 'center', marginTop: 8, lineHeight: 20 },
    shopBtn: { backgroundColor: PRIMARY, paddingHorizontal: 30, paddingVertical: 14, borderRadius: 16, marginTop: 28, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
    shopBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }
});

export default MyOrders;

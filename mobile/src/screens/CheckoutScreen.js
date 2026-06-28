import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator, Alert, TextInput
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import api from '../services/api';
import { startPayment } from '../services/PaymentService';
import { getLocalCart, clearLocalCart } from '../services/cartPersistence';

const PRIMARY = '#8B0000';
const BG = '#FDFBF9';

const CheckoutScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [items, setItems] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [couponApplied, setCouponApplied] = useState(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const [cartData, addrData] = await Promise.all([
                api.fetchCart().catch(() => null),
                api.fetchAddresses().catch(() => null)
            ]);
            const cartList = Array.isArray(cartData) ? cartData : [];
            const addrList = Array.isArray(addrData) ? addrData : addrData?.addresses || addrData?.data || [];

            if (cartList.length === 0) {
                const local = await getLocalCart();
                setItems(local);
            } else {
                setItems(cartList);
            }

            const defaultAddr = addrList.find(a => a.isDefault) || addrList[0] || null;
            setSelectedAddress(defaultAddr);

            if (params.selectedAddress) {
                try {
                    const parsed = JSON.parse(params.selectedAddress);
                    setSelectedAddress(parsed);
                } catch {}
            }
        } catch (e) {
            console.error('[CHECKOUT] Load error:', e.message);
        } finally {
            setLoading(false);
        }
    }, [params.selectedAddress]);

    useFocusEffect(useCallback(() => {
        loadData();
    }, [loadData]));

    const getPrice = (item) => item.price || item.pricing?.price || item.amount || 2499;

    const subtotal = items.reduce((sum, item) => sum + getPrice(item) * (item.quantity || 1), 0);
    const shipping = subtotal >= 999 ? 0 : 49;
    const discount = couponApplied ? (subtotal * (couponApplied.discountPercent || 0)) / 100 : 0;
    const total = Math.max(0, subtotal + shipping - discount);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) { Alert.alert('Enter Code', 'Please enter a coupon code.'); return; }
        setCouponLoading(true);
        try {
            const res = await api.validateCoupon({ code: couponCode.trim(), amount: subtotal });
            if (res?.valid) {
                setCouponApplied(res);
                Alert.alert('Coupon Applied!', `You saved ₹${((subtotal * (res.discountPercent || 0)) / 100).toFixed(2)}`);
            } else {
                Alert.alert('Invalid Coupon', res?.message || 'This coupon is not valid.');
            }
        } catch (e) {
            Alert.alert('Error', e.message || 'Failed to validate coupon.');
        } finally {
            setCouponLoading(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            Alert.alert('Address Required', 'Please select a shipping address.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Add Address', onPress: () => router.push('/AddressList?selectMode=true') }
            ]);
            return;
        }
        if (items.length === 0) {
            Alert.alert('Cart Empty', 'Your cart is empty.');
            return;
        }

        setPlacingOrder(true);
        try {
            const checkoutData = {
                items: items.map(item => ({
                    boutiqueId: item.boutiqueId,
                    designId: item.designId,
                    designName: item.designName || item.name,
                    category: item.category,
                    price: getPrice(item),
                    quantity: item.quantity || 1
                })),
                shippingAddress: {
                    addressId: selectedAddress._id,
                    fullName: selectedAddress.fullName || selectedAddress.name,
                    phone: selectedAddress.phone || selectedAddress.mobile,
                    addressLine1: selectedAddress.addressLine1,
                    addressLine2: selectedAddress.addressLine2,
                    city: selectedAddress.city,
                    state: selectedAddress.state,
                    pincode: selectedAddress.pincode
                },
                couponCode: couponApplied?.code || null,
                subtotal,
                shipping,
                discount,
                total: Math.round(total)
            };

            const order = await api.createCheckoutOrder(checkoutData);
            console.log('[CHECKOUT] Order created:', order._id || order.orderId);

            const paymentResult = await startPayment(total, 'Checkout Payment', {
                orderId: order._id || order.orderId,
                amount: Math.round(total)
            });

            if (paymentResult) {
                await clearLocalCart();
                router.replace({
                    pathname: '/OrderConfirmation',
                    params: {
                        orderId: order._id || order.orderId,
                        orderRef: order.orderId || order.orderRef || `#VS${Date.now()}`,
                        amount: Math.round(total),
                        paymentId: paymentResult.paymentId || 'N/A'
                    }
                });
            }
        } catch (e) {
            console.error('[CHECKOUT] Error:', e.message);
            Alert.alert('Order Failed', e.message || 'Failed to place order. Please try again.', [
                { text: 'OK' }
            ]);
        } finally {
            setPlacingOrder(false);
        }
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
                <Text style={s.headerTitle}>Checkout</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
                {items.length === 0 ? (
                    <View style={s.emptyState}>
                        <MaterialCommunityIcons name="cart-off" size={60} color="#DDD" />
                        <Text style={s.emptyTitle}>Nothing to Checkout</Text>
                        <Text style={s.emptySub}>Add items to your cart first.</Text>
                        <TouchableOpacity style={s.shopBtn} onPress={() => router.push('/home')}>
                            <Text style={s.shopBtnText}>Shop Now</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Shipping Address */}
                        <View style={s.section}>
                            <View style={s.sectionHeader}>
                                <MaterialCommunityIcons name="map-marker" size={20} color={PRIMARY} />
                                <Text style={s.sectionTitle}>Shipping Address</Text>
                            </View>
                            {selectedAddress ? (
                                <TouchableOpacity
                                    style={s.addressBox}
                                    onPress={() => router.push('/AddressList?selectMode=true')}
                                >
                                    <View style={s.addressTop}>
                                        <Text style={s.addressName}>{selectedAddress.fullName || selectedAddress.name}</Text>
                                        <Text style={s.addressPhone}>{selectedAddress.phone || selectedAddress.mobile}</Text>
                                    </View>
                                    <Text style={s.addressDetail} numberOfLines={2}>
                                        {selectedAddress.addressLine1}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                                    </Text>
                                    <View style={s.changeRow}>
                                        <Text style={s.changeText}>Change</Text>
                                        <Ionicons name="chevron-forward" size={14} color={PRIMARY} />
                                    </View>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={s.addAddressBtn}
                                    onPress={() => router.push('/AddressForm')}
                                >
                                    <Ionicons name="add-circle" size={22} color={PRIMARY} />
                                    <Text style={s.addAddressText}>Add Shipping Address</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Order Items */}
                        <View style={s.section}>
                            <View style={s.sectionHeader}>
                                <MaterialCommunityIcons name="shopping-outline" size={20} color={PRIMARY} />
                                <Text style={s.sectionTitle}>Order Items ({items.length})</Text>
                            </View>
                            {items.map((item, idx) => (
                                <View key={item._id || item.id || idx} style={s.orderItem}>
                                    <View style={s.itemInfo}>
                                        <Text style={s.itemName} numberOfLines={1}>{item.designName || item.name}</Text>
                                        <Text style={s.itemCat}>{item.category || 'Custom Stitching'}</Text>
                                    </View>
                                    <View style={s.itemRight}>
                                        <Text style={s.itemQty}>x{item.quantity || 1}</Text>
                                        <Text style={s.itemPrice}>₹{getPrice(item)}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Coupon */}
                        <View style={s.section}>
                            <View style={s.sectionHeader}>
                                <MaterialCommunityIcons name="percent" size={20} color={PRIMARY} />
                                <Text style={s.sectionTitle}>Coupon Code</Text>
                            </View>
                            {couponApplied ? (
                                <View style={s.couponApplied}>
                                    <View style={s.couponAppliedLeft}>
                                        <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                                        <Text style={s.couponAppliedText}>{couponApplied.code} - {couponApplied.discountPercent}% OFF</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => { setCouponApplied(null); setCouponCode(''); }}>
                                        <Text style={s.removeCouponText}>Remove</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={s.couponRow}>
                                    <TextInput
                                        style={s.couponInput}
                                        value={couponCode}
                                        onChangeText={setCouponCode}
                                        placeholder="Enter coupon code"
                                        placeholderTextColor="#BBB"
                                        autoCapitalize="characters"
                                    />
                                    <TouchableOpacity
                                        style={[s.applyBtn, couponLoading && { opacity: 0.7 }]}
                                        onPress={handleApplyCoupon}
                                        disabled={couponLoading}
                                    >
                                        {couponLoading ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <Text style={s.applyText}>Apply</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Price Summary */}
                        <View style={s.section}>
                            <View style={s.sectionHeader}>
                                <MaterialCommunityIcons name="receipt" size={20} color={PRIMARY} />
                                <Text style={s.sectionTitle}>Price Summary</Text>
                            </View>
                            <View style={s.priceRow}>
                                <Text style={s.priceLabel}>Subtotal</Text>
                                <Text style={s.priceValue}>₹{subtotal.toFixed(2)}</Text>
                            </View>
                            <View style={s.priceRow}>
                                <Text style={s.priceLabel}>Shipping</Text>
                                <Text style={s.priceValue}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</Text>
                            </View>
                            {discount > 0 && (
                                <View style={s.priceRow}>
                                    <Text style={s.priceLabel}>Discount</Text>
                                    <Text style={[s.priceValue, { color: '#2E7D32' }]}>-₹{discount.toFixed(2)}</Text>
                                </View>
                            )}
                            <View style={[s.priceRow, s.totalRow]}>
                                <Text style={s.totalLabel}>Total</Text>
                                <Text style={s.totalValue}>₹{total.toFixed(2)}</Text>
                            </View>
                        </View>

                        <View style={{ height: 100 }} />
                    </>
                )}
            </ScrollView>

            {items.length > 0 && (
                <View style={s.bottomBar}>
                    <View style={s.bottomTotalRow}>
                        <Text style={s.bottomTotalLabel}>Total:</Text>
                        <Text style={s.bottomTotalValue}>₹{total.toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity
                        style={[s.placeOrderBtn, placingOrder && { opacity: 0.7 }]}
                        onPress={handlePlaceOrder}
                        disabled={placingOrder}
                    >
                        {placingOrder ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Text style={s.placeOrderText}>Place Order</Text>
                                <Ionicons name="lock-closed" size={18} color="#FFF" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
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
    scrollContent: { padding: 20 },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    emptyTitle: { fontSize: 18, fontWeight: '900', color: '#333', marginTop: 16 },
    emptySub: { fontSize: 14, color: '#888', fontWeight: '600', textAlign: 'center', marginTop: 6 },
    shopBtn: { backgroundColor: PRIMARY, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 15, marginTop: 24 },
    shopBtnText: { color: '#FFF', fontWeight: '900', textTransform: 'uppercase', fontSize: 13 },
    section: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
    addressBox: { backgroundColor: '#FAF6F2', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#EDE0D8' },
    addressTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    addressName: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
    addressPhone: { fontSize: 13, fontWeight: '600', color: '#888' },
    addressDetail: { fontSize: 13, color: '#555', fontWeight: '500', lineHeight: 18, marginBottom: 6 },
    changeRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end' },
    changeText: { fontSize: 12, fontWeight: '800', color: PRIMARY },
    addAddressBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: '#FAF6F2', borderRadius: 14, borderWidth: 1, borderColor: '#EDE0D8', borderStyle: 'dashed' },
    addAddressText: { fontSize: 14, fontWeight: '700', color: PRIMARY },
    orderItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F0EC' },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
    itemCat: { fontSize: 11, fontWeight: '600', color: '#999', marginTop: 2 },
    itemRight: { alignItems: 'flex-end' },
    itemQty: { fontSize: 12, fontWeight: '600', color: '#888' },
    itemPrice: { fontSize: 15, fontWeight: '900', color: PRIMARY, marginTop: 2 },
    couponRow: { flexDirection: 'row', gap: 10 },
    couponInput: { flex: 1, backgroundColor: '#FAF6F2', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: '#1A1A1A', borderWidth: 1, borderColor: '#EDE0D8' },
    applyBtn: { backgroundColor: PRIMARY, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
    applyText: { color: '#FFF', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
    couponApplied: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 12, padding: 14 },
    couponAppliedLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    couponAppliedText: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
    removeCouponText: { fontSize: 12, fontWeight: '800', color: '#D32F2F' },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    priceLabel: { fontSize: 14, fontWeight: '600', color: '#888' },
    priceValue: { fontSize: 14, fontWeight: '700', color: '#333' },
    totalRow: { borderTopWidth: 1, borderTopColor: '#EDE0D8', marginTop: 8, paddingTop: 12 },
    totalLabel: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
    totalValue: { fontSize: 20, fontWeight: '900', color: PRIMARY },
    bottomBar: {
        padding: 20, paddingBottom: 35, backgroundColor: BG,
        borderTopWidth: 1, borderTopColor: '#EDE0D8'
    },
    bottomTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    bottomTotalLabel: { fontSize: 16, fontWeight: '700', color: '#888' },
    bottomTotalValue: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
    placeOrderBtn: {
        backgroundColor: PRIMARY, height: 56, borderRadius: 18,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 6
    },
    placeOrderText: { color: '#FFF', fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }
});

export default CheckoutScreen;

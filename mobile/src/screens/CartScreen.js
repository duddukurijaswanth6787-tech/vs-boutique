import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    SafeAreaView, ActivityIndicator, RefreshControl, Image, Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../services/api';
import { getLocalCart, saveLocalCart, clearLocalCart } from '../services/cartPersistence';

const PRIMARY = '#8B0000';
const BG = '#FDFBF9';
const ACCENT = '#C89B3C';

const CartScreen = () => {
    const router = useRouter();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const loadCart = useCallback(async () => {
        try {
            const serverCart = await api.fetchCart().catch(() => null);
            if (serverCart && Array.isArray(serverCart)) {
                setItems(serverCart);
                await saveLocalCart(serverCart);
            } else {
                const local = await getLocalCart();
                setItems(local);
            }
        } catch {
            const local = await getLocalCart();
            setItems(local);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        loadCart();
    }, [loadCart]));

    const handleRemove = (itemId) => {
        Alert.alert('Remove Item', 'Are you sure you want to remove this item?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive', onPress: async () => {
                    try {
                        if (!String(itemId).startsWith('cart_')) {
                            await api.removeCartItem(itemId).catch(() => {});
                        }
                        const updated = await removeFromLocalCartFallback(itemId);
                        setItems(updated);
                    } catch {
                        const updated = await removeFromLocalCartFallback(itemId);
                        setItems(updated);
                    }
                }
            }
        ]);
    };

    const removeFromLocalCartFallback = async (itemId) => {
        const cart = await getLocalCart();
        const filtered = cart.filter(item => item.id !== itemId && item._id !== itemId);
        await saveLocalCart(filtered);
        return filtered;
    };

    const handleQuantity = async (item, delta) => {
        const newQty = Math.max(1, (item.quantity || 1) + delta);
        const serverId = item._id && !String(item._id).startsWith('cart_') ? item._id : null;
        if (serverId) {
            try {
                await api.updateCartItem(serverId, { quantity: newQty });
            } catch {}
        }
        const local = await getLocalCart();
        const idx = local.findIndex(i => (i.id && i.id === item.id) || (i._id && i._id === item._id));
        if (idx >= 0) {
            local[idx].quantity = newQty;
            await saveLocalCart(local);
            setItems([...local]);
        }
    };

    const getImage = (item) => {
        return item.designImage || item.image || item.media?.coverImage || null;
    };

    const getItemName = (item) => item.designName || item.name || 'Design Item';

    const getItemPrice = (item) => {
        return item.price || item.pricing?.price || item.amount || 2499;
    };

    const totalAmount = items.reduce((sum, item) => sum + getItemPrice(item) * (item.quantity || 1), 0);
    const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

    const syncWithServer = async () => {
        setSyncing(true);
        try {
            const local = await getLocalCart();
            for (const item of local) {
                if (!item._id) {
                    await api.addToCart({
                        boutiqueId: item.boutiqueId,
                        designId: item.designId,
                        designName: item.designName,
                        designImage: item.designImage,
                        category: item.category,
                        price: item.price,
                        quantity: item.quantity || 1
                    }).catch(() => {});
                }
            }
            const serverCart = await api.fetchCart().catch(() => null);
            if (serverCart) setItems(serverCart);
        } catch (e) {
            console.error('[CART] Sync failed:', e.message);
        } finally {
            setSyncing(false);
        }
    };

    const renderItem = ({ item }) => {
        const imgUri = getImage(item);
        const price = getItemPrice(item);
        const qty = item.quantity || 1;
        return (
            <View style={s.cartItem}>
                <View style={s.itemLeft}>
                    {imgUri ? (
                        <Image source={{ uri: imgUri }} style={s.itemImg} resizeMode="cover" />
                    ) : (
                        <View style={[s.itemImg, { backgroundColor: '#F2E5E5', justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="shirt-outline" size={24} color="#8B000055" />
                        </View>
                    )}
                </View>
                <View style={s.itemCenter}>
                    <Text style={s.itemName} numberOfLines={1}>{getItemName(item)}</Text>
                    {item.category ? <Text style={s.itemCat}>{item.category}</Text> : null}
                    <Text style={s.itemPrice}>₹{price}</Text>
                    <View style={s.qtyRow}>
                        <TouchableOpacity style={s.qtyBtn} onPress={() => handleQuantity(item, -1)}>
                            <Ionicons name="remove" size={16} color={PRIMARY} />
                        </TouchableOpacity>
                        <Text style={s.qtyVal}>{qty}</Text>
                        <TouchableOpacity style={s.qtyBtn} onPress={() => handleQuantity(item, 1)}>
                            <Ionicons name="add" size={16} color={PRIMARY} />
                        </TouchableOpacity>
                    </View>
                </View>
                <TouchableOpacity style={s.removeBtn} onPress={() => handleRemove(item._id || item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={s.safe}>
                <View style={s.center}>
                    <ActivityIndicator size="large" color={PRIMARY} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backCircle}>
                    <Ionicons name="chevron-back" size={24} color="#222" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Shopping Cart</Text>
                <TouchableOpacity onPress={syncWithServer} style={s.syncBtn}>
                    <Ionicons name="sync-outline" size={22} color={syncing ? '#CCC' : PRIMARY} />
                </TouchableOpacity>
            </View>

            {items.length === 0 ? (
                <View style={s.emptyState}>
                    <MaterialCommunityIcons name="cart-off" size={72} color="#DDD" />
                    <Text style={s.emptyTitle}>Your Cart is Empty</Text>
                    <Text style={s.emptySub}>Browse boutiques and add designs to get started.</Text>
                    <TouchableOpacity style={s.shopBtn} onPress={() => router.push('/home')}>
                        <Text style={s.shopBtnText}>Start Shopping</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <FlatList
                        data={items}
                        keyExtractor={(item) => item._id || item.id}
                        renderItem={renderItem}
                        contentContainerStyle={s.listContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCart(); }} />}
                        ListHeaderComponent={
                            <View style={s.cartSummary}>
                                <Text style={s.cartSummaryText}>{totalItems} Item{totalItems !== 1 ? 's' : ''} in Cart</Text>
                                <TouchableOpacity onPress={() => {
                                    Alert.alert('Clear Cart', 'Remove all items?', [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: 'Clear', style: 'destructive', onPress: async () => {
                                            await clearLocalCart();
                                            setItems([]);
                                        }}
                                    ]);
                                }}>
                                    <Text style={s.clearText}>Clear All</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />

                    <View style={s.bottomBar}>
                        <View style={s.totalRow}>
                            <Text style={s.totalLabel}>Total:</Text>
                            <Text style={s.totalAmount}>₹{totalAmount.toLocaleString('en-IN')}</Text>
                        </View>
                        <TouchableOpacity
                            style={s.checkoutBtn}
                            onPress={() => router.push('/Checkout')}
                        >
                            <Text style={s.checkoutText}>Proceed to Checkout</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </>
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
    syncBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 20, paddingBottom: 120 },
    cartSummary: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16
    },
    cartSummaryText: { fontSize: 14, fontWeight: '700', color: '#888' },
    clearText: { fontSize: 13, fontWeight: '800', color: '#D32F2F' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontSize: 20, fontWeight: '900', color: '#333', marginTop: 20 },
    emptySub: { fontSize: 14, color: '#888', fontWeight: '600', textAlign: 'center', marginTop: 8, lineHeight: 20 },
    shopBtn: { backgroundColor: PRIMARY, paddingHorizontal: 30, paddingVertical: 14, borderRadius: 16, marginTop: 28, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
    shopBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
    cartItem: {
        flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, padding: 14,
        marginBottom: 12, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 8, elevation: 2
    },
    itemLeft: { marginRight: 14 },
    itemImg: { width: 80, height: 90, borderRadius: 14, backgroundColor: '#F2E5E5' },
    itemCenter: { flex: 1 },
    itemName: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
    itemCat: { fontSize: 11, fontWeight: '700', color: ACCENT, textTransform: 'uppercase', marginTop: 2, letterSpacing: 0.5 },
    itemPrice: { fontSize: 16, fontWeight: '900', color: PRIMARY, marginTop: 4 },
    qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 },
    qtyBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F5F0EC', alignItems: 'center', justifyContent: 'center' },
    qtyVal: { fontSize: 15, fontWeight: '900', color: '#1A1A1A', minWidth: 20, textAlign: 'center' },
    removeBtn: { padding: 8 },
    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 20, paddingBottom: 35, backgroundColor: BG,
        borderTopWidth: 1, borderTopColor: '#EDE0D8'
    },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    totalLabel: { fontSize: 16, fontWeight: '700', color: '#888' },
    totalAmount: { fontSize: 24, fontWeight: '900', color: '#1A1A1A' },
    checkoutBtn: {
        backgroundColor: PRIMARY, height: 56, borderRadius: 18,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 6
    },
    checkoutText: { color: '#FFF', fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }
});

export default CartScreen;

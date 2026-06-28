import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    SafeAreaView, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import api from '../services/api';

const PRIMARY = '#8B0000';
const BG = '#FDFBF9';

const AddressListScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const selectMode = params.selectMode === 'true';

    const loadAddresses = useCallback(async () => {
        try {
            const data = await api.fetchAddresses();
            const list = Array.isArray(data) ? data : data?.addresses || data?.data || [];
            setAddresses(list);
        } catch (_) {
            console.error('[ADDRESS] Fetch error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        loadAddresses();
    }, [loadAddresses]));

    const handleDelete = (id) => {
        Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await api.deleteAddress(id);
                        setAddresses(prev => prev.filter(a => a._id !== id));
                    } catch (_) {
                        Alert.alert('Error', 'Failed to delete address.');
                    }
                }
            }
        ]);
    };

    const handleSetDefault = async (id) => {
        try {
            await api.setDefaultAddress(id);
            setAddresses(prev => prev.map(a => ({ ...a, isDefault: a._id === id })));
        } catch (e) {
            Alert.alert('Error', 'Failed to set default address.');
        }
    };

    const handleSelect = (address) => {
        if (selectMode) {
            router.back();
            setTimeout(() => {
                router.navigate({
                    pathname: '/Checkout',
                    params: { selectedAddress: JSON.stringify(address) }
                });
            }, 100);
        }
    };

    const renderAddress = ({ item }) => {
        const isDefault = item.isDefault;
        return (
            <TouchableOpacity
                style={[s.addressCard, isDefault && s.defaultCard]}
                onPress={() => handleSelect(item)}
                activeOpacity={selectMode ? 0.7 : 1}
            >
                <View style={s.addressHeader}>
                    <View style={s.addressLabelRow}>
                        <MaterialCommunityIcons name="map-marker" size={20} color={PRIMARY} />
                        <Text style={s.addressType}>{item.label || item.type || 'Home'}</Text>
                        {isDefault && (
                            <View style={s.defaultBadge}>
                                <Text style={s.defaultBadgeText}>DEFAULT</Text>
                            </View>
                        )}
                    </View>
                    <View style={s.actionRow}>
                        <TouchableOpacity style={s.actionBtn} onPress={() => router.push({ pathname: '/AddressForm', params: { address: JSON.stringify(item) } })}>
                            <Ionicons name="create-outline" size={18} color="#666" />
                        </TouchableOpacity>
                        <TouchableOpacity style={s.actionBtn} onPress={() => handleDelete(item._id)}>
                            <Ionicons name="trash-outline" size={18} color="#D32F2F" />
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={s.fullName}>{item.fullName || item.name || 'Recipient'}</Text>
                <Text style={s.phone}>{item.phone || item.mobile || ''}</Text>
                <Text style={s.addressText} numberOfLines={2}>
                    {item.addressLine1}, {item.addressLine2 ? `${item.addressLine2}, ` : ''}
                    {item.city}, {item.state} - {item.pincode || item.zipCode}
                </Text>
                {!isDefault && !selectMode && (
                    <TouchableOpacity style={s.setDefaultBtn} onPress={() => handleSetDefault(item._id)}>
                        <Text style={s.setDefaultText}>Set as Default</Text>
                    </TouchableOpacity>
                )}
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
                <Text style={s.headerTitle}>{selectMode ? 'Select Address' : 'Saved Addresses'}</Text>
                <TouchableOpacity onPress={() => router.push('/AddressForm')} style={s.addBtn}>
                    <Ionicons name="add" size={24} color={PRIMARY} />
                </TouchableOpacity>
            </View>

            {addresses.length === 0 ? (
                <View style={s.emptyState}>
                    <MaterialCommunityIcons name="map-marker-off" size={72} color="#DDD" />
                    <Text style={s.emptyTitle}>No Addresses Saved</Text>
                    <Text style={s.emptySub}>Add an address to proceed with checkout.</Text>
                    <TouchableOpacity style={s.addAddrBtn} onPress={() => router.push('/AddressForm')}>
                        <Text style={s.addAddrText}>Add New Address</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={addresses}
                    keyExtractor={(item) => item._id}
                    renderItem={renderAddress}
                    contentContainerStyle={s.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAddresses(); }} />}
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
    addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 20, paddingBottom: 40 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontSize: 20, fontWeight: '900', color: '#333', marginTop: 20 },
    emptySub: { fontSize: 14, color: '#888', fontWeight: '600', textAlign: 'center', marginTop: 8 },
    addAddrBtn: { backgroundColor: PRIMARY, paddingHorizontal: 30, paddingVertical: 14, borderRadius: 16, marginTop: 28, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
    addAddrText: { color: '#FFF', fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
    addressCard: {
        backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginBottom: 14,
        borderWidth: 1, borderColor: '#F0E4DC',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 8, elevation: 2
    },
    defaultCard: { borderColor: PRIMARY, borderWidth: 1.5 },
    addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    addressLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    addressType: { fontSize: 14, fontWeight: '800', color: '#333' },
    defaultBadge: { backgroundColor: PRIMARY + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    defaultBadgeText: { fontSize: 9, fontWeight: '900', color: PRIMARY, letterSpacing: 0.5 },
    actionRow: { flexDirection: 'row', gap: 8 },
    actionBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F5F0EC', alignItems: 'center', justifyContent: 'center' },
    fullName: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
    phone: { fontSize: 13, fontWeight: '600', color: '#888', marginTop: 2 },
    addressText: { fontSize: 13, color: '#555', fontWeight: '500', marginTop: 6, lineHeight: 18 },
    setDefaultBtn: { marginTop: 12, alignSelf: 'flex-start' },
    setDefaultText: { fontSize: 12, fontWeight: '800', color: PRIMARY }
});

export default AddressListScreen;

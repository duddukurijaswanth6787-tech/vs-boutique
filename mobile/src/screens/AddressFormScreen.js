import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, SafeAreaView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../services/api';

const PRIMARY = '#8B0000';
const BG = '#FDFBF9';

const LABELS = ['Home', 'Work', 'Other'];

const AddressFormScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    let editAddress = null;
    try {
        editAddress = params.address ? JSON.parse(params.address) : null;
    } catch {
        editAddress = null;
    }
    const isEditing = !!editAddress;

    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        label: editAddress?.label || editAddress?.type || 'Home',
        fullName: editAddress?.fullName || editAddress?.name || '',
        phone: editAddress?.phone || editAddress?.mobile || '',
        addressLine1: editAddress?.addressLine1 || '',
        addressLine2: editAddress?.addressLine2 || '',
        city: editAddress?.city || '',
        state: editAddress?.state || '',
        pincode: editAddress?.pincode || editAddress?.zipCode || ''
    });

    const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const validate = () => {
        if (!form.fullName.trim()) { Alert.alert('Required', 'Please enter full name.'); return false; }
        if (!form.phone.trim() || form.phone.length < 10) { Alert.alert('Required', 'Please enter a valid phone number.'); return false; }
        if (!form.addressLine1.trim()) { Alert.alert('Required', 'Please enter address line 1.'); return false; }
        if (!form.city.trim()) { Alert.alert('Required', 'Please enter city.'); return false; }
        if (!form.state.trim()) { Alert.alert('Required', 'Please enter state.'); return false; }
        if (!form.pincode.trim() || form.pincode.length < 6) { Alert.alert('Required', 'Please enter a valid 6-digit pincode.'); return false; }
        return true;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const payload = {
                label: form.label,
                fullName: form.fullName,
                phone: form.phone,
                addressLine1: form.addressLine1,
                addressLine2: form.addressLine2,
                city: form.city,
                state: form.state,
                pincode: form.pincode
            };

            if (isEditing) {
                await api.updateAddress(editAddress._id, payload);
            } else {
                await api.createAddress(payload);
            }

            router.back();
        } catch (e) {
            Alert.alert('Error', e.message || 'Failed to save address. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backCircle}>
                    <Ionicons name="chevron-back" size={24} color="#222" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>{isEditing ? 'Edit Address' : 'New Address'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
                    <Text style={s.sectionLabel}>ADDRESS LABEL</Text>
                    <View style={s.labelRow}>
                        {LABELS.map(lbl => (
                            <TouchableOpacity
                                key={lbl}
                                style={[s.labelChip, form.label === lbl && s.labelChipActive]}
                                onPress={() => updateField('label', lbl)}
                            >
                                <Text style={[s.labelChipText, form.label === lbl && s.labelChipTextActive]}>{lbl}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={s.sectionLabel}>CONTACT DETAILS</Text>
                    <View style={s.inputGroup}>
                        <Text style={s.inputLabel}>Full Name *</Text>
                        <TextInput
                            style={s.input}
                            value={form.fullName}
                            onChangeText={(v) => updateField('fullName', v)}
                            placeholder="Full name"
                            placeholderTextColor="#BBB"
                        />
                    </View>
                    <View style={s.inputGroup}>
                        <Text style={s.inputLabel}>Phone Number *</Text>
                        <TextInput
                            style={s.input}
                            value={form.phone}
                            onChangeText={(v) => updateField('phone', v.replace(/[^0-9]/g, '').slice(0, 10))}
                            placeholder="10-digit mobile number"
                            keyboardType="phone-pad"
                            placeholderTextColor="#BBB"
                        />
                    </View>

                    <Text style={s.sectionLabel}>ADDRESS DETAILS</Text>
                    <View style={s.inputGroup}>
                        <Text style={s.inputLabel}>Address Line 1 *</Text>
                        <TextInput
                            style={s.input}
                            value={form.addressLine1}
                            onChangeText={(v) => updateField('addressLine1', v)}
                            placeholder="Flat, House no., Building"
                            placeholderTextColor="#BBB"
                        />
                    </View>
                    <View style={s.inputGroup}>
                        <Text style={s.inputLabel}>Address Line 2</Text>
                        <TextInput
                            style={s.input}
                            value={form.addressLine2}
                            onChangeText={(v) => updateField('addressLine2', v)}
                            placeholder="Street, Area, Landmark"
                            placeholderTextColor="#BBB"
                        />
                    </View>

                    <View style={s.rowInputs}>
                        <View style={[s.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={s.inputLabel}>City *</Text>
                            <TextInput
                                style={s.input}
                                value={form.city}
                                onChangeText={(v) => updateField('city', v)}
                                placeholder="City"
                                placeholderTextColor="#BBB"
                            />
                        </View>
                        <View style={[s.inputGroup, { flex: 1 }]}>
                            <Text style={s.inputLabel}>State *</Text>
                            <TextInput
                                style={s.input}
                                value={form.state}
                                onChangeText={(v) => updateField('state', v)}
                                placeholder="State"
                                placeholderTextColor="#BBB"
                            />
                        </View>
                    </View>
                    <View style={[s.inputGroup, { width: '45%' }]}>
                        <Text style={s.inputLabel}>Pincode *</Text>
                        <TextInput
                            style={s.input}
                            value={form.pincode}
                            onChangeText={(v) => updateField('pincode', v.replace(/[^0-9]/g, '').slice(0, 6))}
                            placeholder="6-digit pincode"
                            keyboardType="number-pad"
                            placeholderTextColor="#BBB"
                        />
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>

                <View style={s.bottomBar}>
                    <TouchableOpacity
                        style={[s.submitBtn, loading && { opacity: 0.7 }]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                <Text style={s.submitText}>{isEditing ? 'Update Address' : 'Save Address'}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
    sectionLabel: { fontSize: 11, fontWeight: '900', color: '#888', letterSpacing: 1, marginBottom: 12, marginTop: 10 },
    labelRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    labelChip: {
        paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
        backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EDE0D8'
    },
    labelChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
    labelChipText: { fontSize: 13, fontWeight: '700', color: '#666' },
    labelChipTextActive: { color: '#FFF' },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 12, fontWeight: '800', color: '#555', marginBottom: 6 },
    input: {
        backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
        fontSize: 15, fontWeight: '600', color: '#1A1A1A',
        borderWidth: 1, borderColor: '#EDE0D8'
    },
    rowInputs: { flexDirection: 'row' },
    bottomBar: {
        padding: 20, paddingBottom: 35, backgroundColor: BG,
        borderTopWidth: 1, borderTopColor: '#EDE0D8'
    },
    submitBtn: {
        backgroundColor: PRIMARY, height: 56, borderRadius: 18,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 6
    },
    submitText: { color: '#FFF', fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }
});

export default AddressFormScreen;

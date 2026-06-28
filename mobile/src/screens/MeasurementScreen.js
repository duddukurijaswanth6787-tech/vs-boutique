import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Dimensions, SafeAreaView, KeyboardAvoidingView, Platform,
    Image, Alert, ActivityIndicator, Switch
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../services/api';

const { width: W } = Dimensions.get('window');
const PRIMARY = '#8B0000';
const BG = '#FDFBF9';
const ACCENT = '#C89B3C';

const MeasurementScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    // Params from previous screen
    const { designId, boutiqueId, designImage, designName, category } = params;

    const [loading, setLoading] = useState(false);
    const [saveToProfile, setSaveToProfile] = useState(false);
    const [notes, setNotes] = useState('');
    
    const [form, setForm] = useState({
        chest: '',
        waist: '',
        length: '',
        shoulder: '',
        sleeveLength: '',
        neck: ''
    });

    useEffect(() => {
        console.log('[SCREEN MOUNT] Measurements');
        return () => {
            console.log('[SCREEN UNMOUNT] Measurements');
        };
    }, []);

    const handleInputChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        const required = ['chest', 'waist', 'length'];
        for (const field of required) {
            const val = parseFloat(form[field]);
            if (!form[field] || isNaN(val)) {
                Alert.alert('Required Fields', `Please enter a valid numeric value for ${field.charAt(0).toUpperCase() + field.slice(1)}.`);
                return false;
            }
            if (val < 5 || val > 100) {
                Alert.alert('Invalid Range', `${field.charAt(0).toUpperCase() + field.slice(1)} must be between 5 and 100 inches.`);
                return false;
            }
        }
        return true;
    };

    const handleContinue = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            if (saveToProfile) {
                console.log('[API REQUEST] Measurements -> POST /measurements');
                // Ensure data structure is consistent
                await api.saveMeasurements({
                    measurements: {
                        chest: parseFloat(form.chest),
                        waist: parseFloat(form.waist),
                        length: parseFloat(form.length),
                        shoulder: form.shoulder ? parseFloat(form.shoulder) : undefined,
                        sleeveLength: form.sleeveLength ? parseFloat(form.sleeveLength) : undefined,
                        neck: form.neck ? parseFloat(form.neck) : undefined
                    },
                    notes: notes
                });
                console.log('[API RESPONSE] Measurements -> POST /measurements 200');
            }

            // Navigate to Order Summary
            router.push({
                pathname: '/summary',
                params: {
                    boutiqueId,
                    designId,
                    measurements: JSON.stringify(form),
                    notes: notes.trim(),
                    designImage,
                    designName,
                    category
                }
            });
        } catch (error) {
            console.error('Measurement Error:', error);
            const errMsg = error.response?.message || 'Failed to save measurements to your profile. You can still proceed with the order.';
            Alert.alert(
                'Sync Failed', 
                errMsg,
                [
                    { text: 'Try Again', style: 'cancel' },
                    { text: 'Proceed Anyway', onPress: () => {
                        router.push({
                            pathname: '/summary',
                            params: { boutiqueId, designId, measurements: JSON.stringify(form), notes: notes.trim(), designImage, designName, category }
                        });
                    }}
                ]
            );
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (label, field, icon, placeholder, required = false) => (
        <View style={s.inputWrapper}>
            <View style={s.labelRow}>
                <MaterialCommunityIcons name={icon} size={18} color={PRIMARY} />
                <Text style={s.label}>{label} {required && <Text style={{color: 'red'}}>*</Text>}</Text>
            </View>
            <View style={[s.inputField, loading && { backgroundColor: '#F0F0F0', borderColor: '#DDD' }]}>
                <TextInput
                    style={s.textInput}
                    value={form[field]}
                    onChangeText={(v) => handleInputChange(field, v.replace(/[^0-9.]/g, ''))}
                    placeholder={placeholder}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#BBB"
                    editable={!loading}
                />
                <Text style={s.unit}>INCH</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={s.safe}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={{ flex: 1 }}
            >
                {/* Custom Header */}
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backCircle}>
                        <Ionicons name="chevron-back" size={24} color="#222" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Measurements</Text>
                    <View style={{width: 40}} />
                </View>

                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={s.scrollContent}
                >
                    {/* Design Preview Card */}
                    <View style={s.designCard}>
                        {typeof designImage === 'string' && designImage.startsWith('https://') ? (
                            <Image source={{ uri: designImage }} style={s.designImg} />
                        ) : (
                            <View style={[s.designImg, { backgroundColor: '#EEE', justifyContent: 'center', alignItems: 'center' }]}>
                                <Ionicons name="image-outline" size={28} color="#CCC" />
                            </View>
                        )}
                        <View style={s.designInfo}>
                            <Text style={s.designCat}>{category || 'Custom Stitching'}</Text>
                            <Text style={s.designName}>{designName || 'Selected Design'}</Text>
                            <View style={s.boutiqueTag}>
                                <MaterialCommunityIcons name="storefront-outline" size={12} color={ACCENT} />
                                <Text style={s.boutiqueText}>Premium Boutique</Text>
                            </View>
                        </View>
                    </View>

                    <View style={s.formHeader}>
                        <Text style={s.formTitle}>Enter Body Measurements</Text>
                        <Text style={s.formSubtitle}>Accurate measurements ensure a perfect fit.</Text>
                    </View>

                    {/* Measurement Form */}
                    <View style={s.formGrid}>
                        {renderInput('Chest', 'chest', 'tape-measure', '0.0', true)}
                        {renderInput('Waist', 'waist', 'human-female', '0.0', true)}
                        {renderInput('Length', 'length', 'ruler', '0.0', true)}
                        {renderInput('Shoulder', 'shoulder', 'arrow-expand-horizontal', '0.0')}
                        {renderInput('Sleeve', 'sleeveLength', 'arm-flex', '0.0')}
                        {renderInput('Neck', 'neck', 'vector-square', '0.0')}
                    </View>

                    {/* Notes Section */}
                    <View style={s.section}>
                        <Text style={s.sectionLabel}>Special Instructions</Text>
                        <TextInput
                            style={[s.notesInput, loading && { backgroundColor: '#F8F8F8' }]}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Add any specific requests (e.g. Loose fit, zip at back...)"
                            multiline
                            numberOfLines={4}
                            placeholderTextColor="#BBB"
                            editable={!loading}
                        />
                    </View>

                    {/* Save Toggle */}
                    <View style={s.saveToggle}>
                        <View style={s.toggleInfo}>
                            <Text style={s.saveTitle}>Save to Profile</Text>
                            <Text style={s.saveSub}>Store these for future orders</Text>
                        </View>
                        <Switch 
                            value={saveToProfile} 
                            onValueChange={setSaveToProfile}
                            trackColor={{ false: '#EEE', true: PRIMARY + '40' }}
                            thumbColor={saveToProfile ? PRIMARY : '#f4f3f4'}
                            disabled={loading}
                        />
                    </View>

                    <View style={{height: 100}} />
                </ScrollView>

                {/* Sticky Continue Button */}
                <View style={s.bottomBar}>
                    <TouchableOpacity 
                        style={[s.continueBtn, loading && {opacity: 0.7}]} 
                        onPress={handleContinue}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Text style={s.continueText}>Confirm & Continue</Text>
                                <Ionicons name="arrow-forward" size={20} color="#FFF" />
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
    
    designCard: {
        flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, padding: 12,
        alignItems: 'center', marginBottom: 25,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03, shadowRadius: 10, elevation: 2
    },
    designImg: { width: 70, height: 70, borderRadius: 15, marginRight: 15 },
    designInfo: { flex: 1 },
    designCat: { fontSize: 10, fontWeight: '900', color: ACCENT, textTransform: 'uppercase', letterSpacing: 1 },
    designName: { fontSize: 16, fontWeight: '800', color: '#222', marginVertical: 2 },
    boutiqueTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    boutiqueText: { fontSize: 11, fontWeight: '700', color: '#888' },

    formHeader: { marginBottom: 20 },
    formTitle: { fontSize: 20, fontWeight: '900', color: '#111' },
    formSubtitle: { fontSize: 13, color: '#888', marginTop: 4, fontWeight: '600' },

    formGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    inputWrapper: { width: (W - 55) / 2, marginBottom: 18 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, paddingLeft: 4 },
    label: { fontSize: 12, fontWeight: '800', color: '#555', textTransform: 'uppercase' },
    inputField: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', 
        borderRadius: 15, height: 50, paddingHorizontal: 12,
        borderWidth: 1, borderColor: '#EEE'
    },
    textInput: { flex: 1, fontSize: 16, fontWeight: '800', color: PRIMARY },
    unit: { fontSize: 10, fontWeight: '900', color: '#CCC', marginLeft: 5 },

    section: { marginTop: 10 },
    sectionLabel: { fontSize: 12, fontWeight: '800', color: '#555', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 },
    notesInput: {
        backgroundColor: '#FFF', borderRadius: 20, padding: 16, height: 100,
        textAlignVertical: 'top', fontSize: 14, fontWeight: '600', color: '#444',
        borderWidth: 1, borderColor: '#EEE'
    },

    saveToggle: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#FFF', padding: 15, borderRadius: 20, marginTop: 25,
        borderWidth: 1, borderColor: '#EEE'
    },
    toggleInfo: { flex: 1 },
    saveTitle: { fontSize: 15, fontWeight: '800', color: '#222' },
    saveSub: { fontSize: 11, color: '#888', fontWeight: '600' },

    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 20, paddingBottom: Platform.OS === 'ios' ? 35 : 20,
        backgroundColor: 'rgba(253, 251, 249, 0.9)',
    },
    continueBtn: {
        backgroundColor: PRIMARY, height: 60, borderRadius: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 15, elevation: 8
    },
    continueText: { color: '#FFF', fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }
});

export default MeasurementScreen;

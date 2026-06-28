import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, SafeAreaView, StatusBar, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../src/services/api';
import useStore from '../src/store/useStore';

const PRIMARY = '#8B0000';
const BG = '#FAF6F2';

export default function Contact() {
    const router = useRouter();
    const user = useStore((state) => state.user);
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim() || !message.trim() || !subject.trim()) {
            Alert.alert('Required Fields', 'Please fill in name, subject, and message.');
            return;
        }
        setLoading(true);
        try {
            await api.createTicket({
                subject: subject.trim(),
                description: message.trim(),
                ticketType: 'GENERAL_QUERY',
                priority: 'MEDIUM',
                source: 'MOBILE',
                userId: user?.id
            });
            setSubmitted(true);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <SafeAreaView style={s.safe}>
                <StatusBar barStyle="dark-content" backgroundColor={BG} />
                <View style={s.successContainer}>
                    <View style={s.successIcon}>
                        <Ionicons name="checkmark-circle" size={72} color="#2E7D32" />
                    </View>
                    <Text style={s.successTitle}>Message Sent!</Text>
                    <Text style={s.successText}>
                        Thank you for reaching out. We will get back to you within 24 hours.
                    </Text>
                    <TouchableOpacity style={s.successBtn} onPress={() => router.back()}>
                        <Text style={s.successBtnText}>Back to Profile</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={BG} />
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Contact Us</Text>
                <View style={{ width: 40 }} />
            </View>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
                    <View style={s.infoSection}>
                        <View style={s.infoRow}>
                            <Ionicons name="mail-outline" size={18} color={PRIMARY} />
                            <Text style={s.infoText}>support@vsboutique.shop</Text>
                        </View>
                        <View style={s.infoRow}>
                            <Ionicons name="call-outline" size={18} color={PRIMARY} />
                            <Text style={s.infoText}>+91 9000100020</Text>
                        </View>
                        <View style={s.infoRow}>
                            <Ionicons name="location-outline" size={18} color={PRIMARY} />
                            <Text style={s.infoText}>Hyderabad, Telangana, India</Text>
                        </View>
                    </View>

                    <Text style={s.formTitle}>Send us a message</Text>

                    <View style={s.inputGroup}>
                        <Text style={s.label}>Name *</Text>
                        <TextInput
                            style={s.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Your full name"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={s.inputGroup}>
                        <Text style={s.label}>Email</Text>
                        <TextInput
                            style={s.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="your@email.com"
                            keyboardType="email-address"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={s.inputGroup}>
                        <Text style={s.label}>Phone</Text>
                        <TextInput
                            style={s.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Phone number"
                            keyboardType="phone-pad"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={s.inputGroup}>
                        <Text style={s.label}>Subject *</Text>
                        <TextInput
                            style={s.input}
                            value={subject}
                            onChangeText={setSubject}
                            placeholder="What is this about?"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={s.inputGroup}>
                        <Text style={s.label}>Message *</Text>
                        <TextInput
                            style={[s.input, s.textArea]}
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Describe your inquiry in detail..."
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <TouchableOpacity
                        style={[s.submitBtn, loading && { opacity: 0.7 }]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            <>
                                <Ionicons name="send" size={18} color="#FFF" />
                                <Text style={s.submitText}>Send Message</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF',
        borderBottomWidth: 1, borderBottomColor: '#F0E4DC'
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: BG,
        alignItems: 'center', justifyContent: 'center'
    },
    headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
    content: { padding: 20 },
    infoSection: {
        backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginBottom: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 8, elevation: 2
    },
    infoRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8,
        borderBottomWidth: 1, borderBottomColor: '#F5F0EC'
    },
    infoText: { fontSize: 14, color: '#444', fontWeight: '600' },
    formTitle: { fontSize: 18, fontWeight: '900', color: '#1A1A1A', marginBottom: 20 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 12, fontWeight: '800', color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
        fontSize: 15, fontWeight: '600', color: '#1A1A1A',
        borderWidth: 1, borderColor: '#EDE0D8'
    },
    textArea: { height: 120, paddingTop: 14 },
    submitBtn: {
        backgroundColor: PRIMARY, borderRadius: 18, height: 56,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        marginTop: 10, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 6
    },
    submitText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
    successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    successIcon: { marginBottom: 20 },
    successTitle: { fontSize: 24, fontWeight: '900', color: '#1A1A1A', marginBottom: 12 },
    successText: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
    successBtn: { backgroundColor: PRIMARY, paddingHorizontal: 30, paddingVertical: 14, borderRadius: 16 },
    successBtnText: { color: '#FFF', fontWeight: '900', fontSize: 15 }
});
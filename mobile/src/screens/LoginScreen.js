import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/LoginStyles';
import api from '../services/api';

export default function LoginScreen() {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    return (
        <ImageBackground
            source={require('../../assets/Login-imag.jpg')}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    contentContainerStyle={styles.overlay}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >

                    {/* --- Logo Area --- */}
                    <View style={styles.logoContainer}>
                        {/* Custom Circular Logo */}
                        <View style={styles.vsCircle}>
                            <View style={styles.vsTextContainer}>
                                <Text style={styles.vText}>V</Text>
                                <Text style={styles.sText}>S</Text>
                            </View>
                            <MaterialCommunityIcons
                                name="human-female"
                                size={40}
                                color="#C89B3C"
                                style={styles.mannequinIcon}
                            />
                        </View>

                        <Text style={styles.boutiqueText}>VS BOUTIQUE</Text>

                        <View style={styles.decorativeLineContainer}>
                            <View style={styles.decorativeLine} />
                            <Ionicons name="leaf" size={16} color="#C89B3C" style={styles.decorativeIcon} />
                            <View style={styles.decorativeLine} />
                        </View>

                        <Text style={styles.tagline}>Design your perfect style ✨</Text>
                    </View>

                    {/* --- Main Card --- */}
                    <View style={styles.card}>
                        <View style={styles.labelContainer}>
                            <Ionicons name="call-outline" size={20} color="#6F1111" />
                            <Text style={styles.label}>Phone Number</Text>
                        </View>

                        <View style={styles.phoneContainer}>
                            <TouchableOpacity style={styles.countryCodeContainer}>
                                <Text style={styles.countryCode}>+91</Text>
                                <Ionicons name="chevron-down" size={16} color="#333" />
                            </TouchableOpacity>
                            <View style={styles.verticalDivider} />
                            <TextInput
                                placeholder="Enter your number"
                                placeholderTextColor="#999"
                                value={phone}
                                onChangeText={(text) => {
                                    const cleaned = text.replace(/[^0-9]/g, '');
                                    if (cleaned.length <= 10) {
                                        setPhone(cleaned);
                                    }
                                }}
                                keyboardType="numeric"
                                style={styles.phoneInput}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && { opacity: 0.7 }]}
                            disabled={loading}
                            onPress={async () => {
                                if (!phone || phone.length !== 10) {
                                    alert("Please enter a valid 10-digit phone number.");
                                    return;
                                }
                                setLoading(true);
                                try {
                                    await api.sendOtp(phone);
                                    router.push({
                                        pathname: '/otp',
                                        params: { phone: phone }
                                    });
                                } catch (err) {
                                    alert(err.message || 'Failed to send OTP. Please try again.');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.buttonText}>Continue</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>

                        <View style={styles.orContainer}>
                            <View style={styles.orLine} />
                            <Text style={styles.orText}>or</Text>
                            <View style={styles.orLine} />
                        </View>

                        <View style={styles.privacyContainer}>
                            <Ionicons name="shield-checkmark-outline" size={26} color="#6F1111" />
                            <Text style={styles.privacyText}>
                                We respect your privacy and{"\n"}never share your information.
                            </Text>
                        </View>
                    </View>

                    {/* --- Bottom Area --- */}
                    <View style={styles.bottomArea}>
                        <View style={styles.bottomIconContainer}>
                            <Ionicons name="shield-checkmark" size={22} color="#C89B3C" />
                        </View>
                        <Text style={styles.trustedText}>Trusted by Tailors. Loved by Customers.</Text>
                        <Text style={styles.bottomTagline}>Your style, our passion. 💛</Text>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

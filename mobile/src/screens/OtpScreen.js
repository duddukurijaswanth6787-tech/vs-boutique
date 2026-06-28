import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/OtpStyles';
import api from '../services/api';
import { saveToken, saveUser } from '../services/tokenStorage';
import useStore from '../store/useStore';

export default function OtpScreen() {
    const { phone } = useLocalSearchParams();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(30);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const inputRefs = useRef([]);
    const setAuth = useStore((state) => state.setAuth);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleOtpChange = (text, index) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        // Move to next input if filled
        if (text && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyPress = (e, index) => {
        // Handle backspace moving to previous input
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const isOtpComplete = otp.join('').length === 6;

    return (
        <ImageBackground 
            source={require('../../assets/otp-bg.jpg')} 
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={28} color="#8B0000" />
            </TouchableOpacity>

            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "padding"}
            >
                <View style={{ flex: 1 }}>
                    
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
                                size={34} 
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
                    </View>

                    {/* --- OTP Content --- */}
                    <View style={styles.contentContainer}>
                        <Text style={styles.titleText}>Enter OTP</Text>
                        <Text style={styles.subtitleText}>We have sent a 6-digit OTP to</Text>
                        
                        <View style={styles.phoneTextContainer}>
                            <Text style={styles.phoneNumber}>+91 {phone || '98765 43210'}</Text>
                            <TouchableOpacity onPress={() => router.back()}>
                                <Text style={styles.changeText}>Change</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.otpContainer}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => inputRefs.current[index] = ref}
                                    style={[styles.otpInput, digit ? styles.otpInputActive : null]}
                                    value={digit}
                                    onChangeText={(text) => handleOtpChange(text.replace(/[^0-9]/g, ''), index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    keyboardType="numeric"
                                    maxLength={1}
                                    selectTextOnFocus
                                />
                            ))}
                        </View>

                        {timer > 0 ? (
                            <View style={styles.resendContainer}>
                                <Text style={styles.resendText}>Resend OTP in</Text>
                                <Text style={styles.timerText}>{formatTime(timer)}</Text>
                            </View>
                        ) : (
                            <TouchableOpacity 
                                style={[styles.resendContainer, { paddingVertical: 5 }]}
                                onPress={async () => {
                                    setTimer(30);
                                    try {
                                        await api.sendOtp(phone);
                                        console.log("[AUTH] OTP resent successfully");
                                    } catch (err) {
                                        console.error("[AUTH] Resend OTP failed:", err.message);
                                    }
                                }}
                            >
                                <Text style={[styles.resendText, { color: '#8B0000', fontWeight: 'bold' }]}>Resend OTP</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.verifyButton,
                                { opacity: (isOtpComplete && !loading) ? 1 : 0.5 }
                            ]}
                            disabled={!isOtpComplete || loading}
                            onPress={async () => {
                                const otpCode = otp.join('');
                                if (otpCode.length !== 6) {
                                    alert("Please enter the full 6-digit OTP.");
                                    return;
                                }
                                setLoading(true);
                                try {
                                    const response = await api.verifyOtp(phone, otpCode);
                                    const { token, user } = response;
                                    console.log('[AUTH] Login successful, saving credentials');
                                    console.log('[AUTH] Token:', token ? token.substring(0, 20) + '...' : 'MISSING');
                                    if (token) {
                                        await saveToken(token);
                                        if (user) await saveUser(user);
                                        setAuth(user, token);
                                    }
                                    router.replace('/home');
                                } catch (err) {
                                    alert(err.message || 'Invalid OTP. Please try again.');
                                    setOtp(['', '', '', '', '', '']);
                                    inputRefs.current[0]?.focus();
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.verifyButtonText}>Verify OTP</Text>
                            )}
                        </TouchableOpacity>

                        {/* --- Bottom Secure Card --- */}
                        <View style={styles.secureCard}>
                            <View style={styles.secureIconContainer}>
                                <Ionicons name="shield-checkmark-outline" size={32} color="#8B0000" />
                            </View>
                            <View style={styles.secureTextContainer}>
                                <Text style={styles.secureTitle}>Secure & Safe</Text>
                                <Text style={styles.secureSubtitle}>
                                    Your information is protected with us. 🔒
                                </Text>
                            </View>
                        </View>

                    </View>
                </View>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

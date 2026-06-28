import { StyleSheet, Dimensions, Platform, StatusBar } from 'react-native';
import { makeShadow } from './theme';

const { width, height } = Dimensions.get('window');
const STATUS_H    = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
const SAFE_TOP    = STATUS_H + 8;

// VS circle sized responsively like LoginStyles
const CIRCLE_SIZE = Math.min(width * 0.24, 96);
const VS_FONT_V   = CIRCLE_SIZE * 0.50;
const VS_FONT_S   = CIRCLE_SIZE * 0.40;

// OTP box: 6 boxes across full width with gaps
const OTP_BOX_W = Math.floor((width - 48 - 50) / 6);  // 48=padding, 50=total gaps

const styles = StyleSheet.create({
    // ── Screen ───────────────────────────────────────────────────────────────
    backgroundImage: {
        flex:   1,
        width:  '100%',
        height: '100%',
    },
    container: {
        flex:       1,
        paddingTop: SAFE_TOP + 50,   // below status bar + back button
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },

    // ── Back button (respects status bar height) ─────────────────────────────
    backButton: {
        position: 'absolute',
        top:      SAFE_TOP + 4,
        left:     16,
        zIndex:   10,
        width:    44,
        height:   44,
        borderRadius:    22,
        backgroundColor: 'rgba(255,255,255,0.85)',
        justifyContent:  'center',
        alignItems:      'center',
    },

    // ── Logo area ─────────────────────────────────────────────────────────────
    logoContainer: {
        alignItems:    'center',
        marginBottom:  20,
    },
    vsCircle: {
        width:           CIRCLE_SIZE,
        height:          CIRCLE_SIZE,
        borderRadius:    CIRCLE_SIZE / 2,
        borderWidth:     1.5,
        borderColor:     '#C89B3C',
        justifyContent:  'center',
        alignItems:      'center',
        marginBottom:    10,
        backgroundColor: 'rgba(255,255,255,0.45)',
        overflow:        'hidden',
    },
    vsTextContainer: {
        flexDirection: 'row',
        alignItems:    'baseline',
    },
    vText: {
        fontSize:   VS_FONT_V,
        fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
        color:      '#6F1111',
        fontWeight: 'bold',
        lineHeight: VS_FONT_V * 1.1,
    },
    sText: {
        fontSize:   VS_FONT_S,
        fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
        color:      '#6F1111',
        fontWeight: 'bold',
        marginLeft: -3,
        lineHeight: VS_FONT_S * 1.1,
    },
    mannequinIcon: {
        position: 'absolute',
        right:    6,
        bottom:   8,
    },
    boutiqueText: {
        fontSize:      Math.min(18, width * 0.045),
        fontFamily:    Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
        letterSpacing: 2.5,
        color:         '#6F1111',
        fontWeight:    '700',
        marginTop:     6,
    },
    decorativeLineContainer: {
        flexDirection:  'row',
        alignItems:     'center',
        marginVertical: 8,
        width:          '55%',
    },
    decorativeLine: {
        flex:            1,
        height:          1,
        backgroundColor: '#C89B3C',
    },
    decorativeIcon: {
        marginHorizontal: 6,
    },

    // ── Content area ─────────────────────────────────────────────────────────
    contentContainer: {
        alignItems:      'center',
        paddingHorizontal: 4,
    },
    titleText: {
        fontSize:     26,
        fontWeight:   '800',
        color:        '#1A1A1A',
        marginBottom: 6,
    },
    subtitleText: {
        fontSize:     14,
        color:        '#666',
        marginBottom: 4,
    },
    phoneTextContainer: {
        flexDirection: 'row',
        alignItems:    'center',
        marginBottom:  24,
    },
    phoneNumber: {
        fontSize:    15,
        fontWeight:  '700',
        color:       '#111',
        marginRight: 10,
    },
    changeText: {
        fontSize:   14,
        color:      '#8B0000',
        fontWeight: '600',
    },

    // ── OTP input boxes ───────────────────────────────────────────────────────
    otpContainer: {
        flexDirection:  'row',
        justifyContent: 'space-between',
        width:          '100%',
        marginBottom:   24,
    },
    otpInput: {
        width:           OTP_BOX_W,
        height:          OTP_BOX_W,        // square boxes
        borderWidth:     1.5,
        borderColor:     '#DDD',
        borderRadius:    12,
        backgroundColor: '#FFF',
        fontSize:        Math.min(22, OTP_BOX_W * 0.5),
        fontWeight:      'bold',
        textAlign:       'center',
        color:           '#333',
    },
    otpInputActive: {
        borderColor: '#8B0000',
        borderWidth: 2.5,
    },

    // ── Resend row ────────────────────────────────────────────────────────────
    resendContainer: {
        flexDirection: 'row',
        marginBottom:  20,
        alignItems:    'center',
    },
    resendText: {
        fontSize: 14,
        color:    '#666',
    },
    timerText: {
        fontSize:   14,
        color:      '#8B0000',
        fontWeight: 'bold',
        marginLeft: 4,
    },

    // ── Verify button ─────────────────────────────────────────────────────────
    verifyButton: {
        backgroundColor: '#6F1111',
        width:           '100%',
        height:          52,
        borderRadius:    14,
        justifyContent:  'center',
        alignItems:      'center',
        marginBottom:    24,
        ...makeShadow('#6F1111', 0, 4, 8, 0.30, 6),
    },
    verifyButtonText: {
        color:      '#fff',
        fontSize:   17,
        fontWeight: '700',
    },

    // ── Secure card ───────────────────────────────────────────────────────────
    secureCard: {
        flexDirection: 'row',
        alignItems:    'center',
        backgroundColor: '#FCFAF8',
        borderWidth:   1,
        borderColor:   '#F0EBE1',
        borderRadius:  16,
        padding:       14,
        width:         '100%',
    },
    secureIconContainer: {
        marginRight: 14,
    },
    secureTextContainer: {
        flex: 1,
    },
    secureTitle: {
        fontSize:     14,
        fontWeight:   '700',
        color:        '#111',
        marginBottom: 3,
    },
    secureSubtitle: {
        fontSize:   12,
        color:      '#666',
        lineHeight: 17,
    },
});

export default styles;

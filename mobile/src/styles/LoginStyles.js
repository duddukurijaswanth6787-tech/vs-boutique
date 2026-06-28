import { StyleSheet, Dimensions, Platform } from 'react-native';
import { makeShadow } from './theme';

const { width, height } = Dimensions.get('window');

// Logo circle scales to 28% of screen width (fits all phone sizes)
const CIRCLE_SIZE = Math.min(width * 0.28, 110);
// VS text inside the circle: slightly less than circle diameter
const VS_FONT_V   = CIRCLE_SIZE * 0.52;
const VS_FONT_S   = CIRCLE_SIZE * 0.42;

const styles = StyleSheet.create({
    // ── Screen & background ─────────────────────────────────────────────────
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    container: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: height * 0.07,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        backgroundColor: 'rgba(255,255,255,0.35)',  // subtle frosted overlay
    },

    // ── Logo area ────────────────────────────────────────────────────────────
    logoContainer: {
        alignItems: 'center',
        marginTop: 8,
    },
    vsCircle: {
        width:        CIRCLE_SIZE,
        height:       CIRCLE_SIZE,
        borderRadius: CIRCLE_SIZE / 2,
        borderWidth:  1.5,
        borderColor:  '#C89B3C',
        justifyContent: 'center',
        alignItems:     'center',
        marginBottom:   12,
        backgroundColor: 'rgba(255,255,255,0.45)',
        overflow: 'hidden',          // prevents text from bleeding out
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
        marginLeft: -4,
        lineHeight: VS_FONT_S * 1.1,
    },
    mannequinIcon: {
        position: 'absolute',
        right:    8,
        bottom:   10,
    },
    boutiqueText: {
        fontSize:   Math.min(22, width * 0.055),
        fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
        letterSpacing: 3,
        color:      '#6F1111',
        fontWeight: '700',
        marginTop:  8,
    },
    decorativeLineContainer: {
        flexDirection: 'row',
        alignItems:    'center',
        marginVertical: 10,
        width: '65%',
    },
    decorativeLine: {
        flex:            1,
        height:          1,
        backgroundColor: '#C89B3C',
    },
    decorativeIcon: {
        marginHorizontal: 8,
    },
    tagline: {
        fontSize:   14,
        color:      '#444',
        fontWeight: '500',
    },

    // ── Card (phone input area) ──────────────────────────────────────────────
    card: {
        backgroundColor: '#fff',
        borderRadius:    24,
        padding:         20,
        ...makeShadow('#000000', 0, 8, 16, 0.10, 8),
        marginVertical:  12,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems:    'center',
        marginBottom:  12,
    },
    label: {
        fontSize:   15,
        color:      '#333',
        fontWeight: '600',
        marginLeft: 8,
    },

    // ── Phone input row ──────────────────────────────────────────────────────
    phoneContainer: {
        flexDirection: 'row',
        alignItems:    'center',
        borderWidth:   1.5,
        borderColor:   '#E0E0E0',
        borderRadius:  14,
        height:        52,
        marginBottom:  20,
        backgroundColor: '#FAFAFA',
    },
    countryCodeContainer: {
        flexDirection:   'row',
        alignItems:      'center',
        paddingHorizontal: 14,
        height:          '100%',
    },
    countryCode: {
        fontSize:   16,
        fontWeight: '700',
        color:      '#333',
        marginRight: 4,
    },
    verticalDivider: {
        width:           1,
        height:          '55%',
        backgroundColor: '#E0E0E0',
    },
    phoneInput: {
        flex:            1,
        fontSize:        16,
        color:           '#333',
        paddingHorizontal: 14,
        height:          '100%',
    },

    // ── Continue button ──────────────────────────────────────────────────────
    button: {
        backgroundColor: '#6F1111',
        flexDirection:   'row',
        justifyContent:  'center',
        alignItems:      'center',
        height:          52,
        borderRadius:    14,
        marginBottom:    20,
        ...makeShadow('#6F1111', 0, 4, 8, 0.30, 6),
    },
    buttonText: {
        color:      '#fff',
        fontSize:   17,
        fontWeight: '700',
        marginRight: 8,
    },

    // ── OR divider ───────────────────────────────────────────────────────────
    orContainer: {
        flexDirection: 'row',
        alignItems:    'center',
        marginBottom:  20,
    },
    orLine: {
        flex:            1,
        height:          1,
        backgroundColor: '#E0E0E0',
    },
    orText: {
        color:           '#999',
        paddingHorizontal: 14,
        fontSize:        13,
    },

    // ── Privacy notice ───────────────────────────────────────────────────────
    privacyContainer: {
        flexDirection: 'row',
        alignItems:    'center',
        justifyContent: 'center',
    },
    privacyText: {
        color:      '#666',
        fontSize:   12,
        marginLeft: 10,
        lineHeight: 18,
        flexShrink: 1,    // prevents overflow on small screens
    },

    // ── Bottom tagline ───────────────────────────────────────────────────────
    bottomArea: {
        alignItems:  'center',
        paddingBottom: 8,
    },
    bottomIconContainer: {
        width:           40,
        height:          40,
        borderRadius:    20,
        borderWidth:     1,
        borderColor:     '#C89B3C',
        justifyContent:  'center',
        alignItems:      'center',
        marginBottom:    10,
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    trustedText: {
        fontSize:   14,
        color:      '#6F1111',
        fontWeight: '600',
        marginBottom: 4,
    },
    bottomTagline: {
        fontSize: 13,
        color:    '#555',
    },
});

export default styles;
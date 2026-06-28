/**
 * VS Boutique — Premium Boutique Design Tokens
 * Mobile-first luxury styling system.
 */
import { Dimensions, Platform, StatusBar } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const STATUS_H = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 50;
const BOTTOM_NAV_H = Platform.OS === 'ios' ? 85 : 68;

const COLOR = {
    primary:       '#8B0000',
    primaryDark:   '#6F1111',
    primaryLight:  '#A52A2A',
    gold:          '#C89B3C',
    goldLight:     '#E8D5A3',
    bg:            '#F6F2EF',
    bgWarm:        '#FAF6F2',
    white:         '#FFFFFF',
    card:          '#FFFFFF',
    border:        '#E8E0D8',
    borderLight:   '#F0E4DC',
    text:          '#1A1A1A',
    textSub:       '#555555',
    textMuted:     '#999999',
    textLight:     '#BBBBBB',
    tag:           '#F2E5E5',
    shadow:        '#000000',
    success:       '#2E7D32',
    error:         '#D32F2F',
    warning:       '#FFA500',
    info:          '#4169E1',
    overlay:       'rgba(0,0,0,0.5)',
};

const FONT = {
    xs:    10,
    sm:    12,
    base:  14,
    md:    16,
    lg:    18,
    xl:    22,
    xxl:   28,
    hero:  34,
};

const SPACE = {
    xs:  4,
    sm:  8,
    md:  12,
    lg:  16,
    xl:  20,
    xxl: 28,
    xxxl: 36,
};

const BORDER_RADIUS = {
    sm:  8,
    md:  12,
    lg:  16,
    xl:  20,
    xxl: 24,
    full: 999,
};

const MIN_TOUCH = 48;

const makeShadow = (color = '#000000', offsetX = 0, offsetY = 3, blur = 8, opacity = 0.10, elevation = 4) => {
    if (Platform.OS === 'web') {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) || 0;
        const g = parseInt(hex.substring(2, 4), 16) || 0;
        const b = parseInt(hex.substring(4, 6), 16) || 0;
        return { boxShadow: `${offsetX}px ${offsetY}px ${blur}px rgba(${r},${g},${b},${opacity})` };
    }
    return {
        shadowColor: color,
        shadowOffset: { width: offsetX, height: offsetY },
        shadowOpacity: opacity,
        shadowRadius: blur,
        elevation,
    };
};

const SHADOW_SM  = makeShadow('#000000', 0, 1, 4,  0.06, 2);
const SHADOW_MD  = makeShadow('#000000', 0, 3, 8,  0.08, 4);
const SHADOW_LG  = makeShadow('#000000', 0, 6, 14, 0.10, 6);
const SHADOW_XL  = makeShadow('#000000', 0, 10, 24, 0.12, 10);
const SHADOW_RED = makeShadow('#6F1111', 0, 4, 10, 0.25, 6);

const safeContainer = {
    flex: 1,
    backgroundColor: COLOR.bg,
    paddingTop: STATUS_H,
    paddingBottom: BOTTOM_NAV_H,
    paddingHorizontal: SPACE.lg,
};

const cardStyle = {
    backgroundColor: COLOR.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACE.xl,
    ...SHADOW_SM,
};

const rowCenter = {
    flexDirection: 'row',
    alignItems: 'center',
};

const rowBetween = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
};

const sectionTitle = {
    fontSize: FONT.xs,
    fontWeight: '900',
    color: COLOR.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACE.md,
};

export {
    SCREEN_W,
    SCREEN_H,
    STATUS_H,
    BOTTOM_NAV_H,
    COLOR,
    FONT,
    SPACE,
    BORDER_RADIUS,
    MIN_TOUCH,
    makeShadow,
    SHADOW_SM,
    SHADOW_MD,
    SHADOW_LG,
    SHADOW_XL,
    SHADOW_RED,
    safeContainer,
    cardStyle,
    rowCenter,
    rowBetween,
    sectionTitle,
};

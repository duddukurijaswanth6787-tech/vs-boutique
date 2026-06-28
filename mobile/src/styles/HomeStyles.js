import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';
import { makeShadow } from './theme';

const { width } = Dimensions.get('window');
const STATUS_H     = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
const BOTTOM_NAV_H = Platform.OS === 'ios' ? 80 : 64;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F2EF',
    },
    scrollContent: {
        paddingTop: STATUS_H + 8,
        paddingHorizontal: 16,
        paddingBottom: BOTTOM_NAV_H + 16,
    },

    // ── Header ──────────────────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
        paddingHorizontal: 4,
    },
    headerIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        ...makeShadow('#000000', 0, 4, 10, 0.05, 3),
    },
    logo: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1A1A1A',
        letterSpacing: -0.5,
    },
    tagline: {
        textAlign: 'center',
        color: '#C89B3C',
        fontSize: 14,
        fontWeight: '600',
        marginVertical: 8,
        letterSpacing: 0.2,
    },

    // ── Location ─────────────────────────────────────────────────────────────
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    locationText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        marginLeft: 4,
    },

    // ── Search bar ───────────────────────────────────────────────────────────
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        borderRadius: 18,
        marginBottom: 14,
        height: 52,
        ...makeShadow('#000000', 0, 6, 15, 0.06, 5),
    },
    searchIcon: {
        marginRight: 8,
        color: '#8B0000',
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        height: '100%',
    },
    filterButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F6F2EF',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },

    // ── Category chips ───────────────────────────────────────────────────────
    categoriesContainer: {
        marginBottom: 16,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 22,
        backgroundColor: '#fff',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E8E0D8',
        minHeight: 38,
        justifyContent: 'center',
    },
    categoryChipActive: {
        backgroundColor: '#8B0000',
        borderColor: '#8B0000',
    },
    categoryText: {
        color: '#555',
        fontSize: 13,
        fontWeight: '600',
    },
    categoryTextActive: {
        color: '#fff',
    },

    // ── Section header ───────────────────────────────────────────────────────
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1A1A1A',
        letterSpacing: -0.3,
    },
    viewAll: {
        color: '#8B0000',
        fontSize: 13,
        fontWeight: '600',
    },

    // ── Boutique card ────────────────────────────────────────────────────────
    card: {
        backgroundColor: '#fff',
        borderRadius: 22,
        marginBottom: 12,
        flexDirection: 'row',
        padding: 10,
        ...makeShadow('#000000', 0, 8, 20, 0.06, 6),
        position: 'relative',
        overflow: 'visible',
    },
    wishlistIcon: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 16,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: 100,
        height: 110,
        borderRadius: 14,
        backgroundColor: '#F2E5E5',
    },
    cardContent: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    name: {
        fontWeight: '800',
        fontSize: 15,
        color: '#1A1A1A',
    },
    location: {
        color: '#777',
        fontSize: 12,
        marginTop: 2,
    },
    rating: {
        marginTop: 4,
        color: '#444',
        fontSize: 13,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4,
    },
    tag: {
        backgroundColor: '#F2E5E5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginRight: 5,
        marginTop: 4,
        fontSize: 11,
        color: '#8B0000',
        fontWeight: '600',
    },
    button: {
        backgroundColor: '#8B0000',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 10,
        marginTop: 8,
        alignSelf: 'flex-start',
        minHeight: 34,
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },

    // ── Bottom Navigation (fixed at screen bottom) ───────────────────────────
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: BOTTOM_NAV_H,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        paddingBottom: Platform.OS === 'ios' ? 16 : 0,
        // top shadow using boxShadow on web, shadow* on native
        ...(Platform.OS === 'web'
            ? { boxShadow: '0px -3px 10px rgba(0,0,0,0.08)' }
            : {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -3 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
                elevation: 12,
            }),
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    navText: {
        fontSize: 10,
        color: '#999',
        marginTop: 2,
    },
    navTextActive: {
        fontSize: 10,
        color: '#8B0000',
        fontWeight: '700',
        marginTop: 2,
    },
    centerButton: {
        backgroundColor: '#8B0000',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -28,
        ...makeShadow('#8B0000', 0, 4, 8, 0.40, 8),
    },

    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        color: '#999',
        fontSize: 15,
        marginTop: 12,
    },
});

export default styles;
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    FlatList,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    ScrollView,
    Platform,
    Keyboard,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import * as Location from 'expo-location';
import styles from '../styles/HomeStyles';
import useStore from '../store/useStore';
import { useDebounce } from '../hooks/useDebounce';
import api from '../services/api';
import { getLocalCartCount } from '../services/cartPersistence';

const CATEGORIES = ['All', 'Bridal Wear', 'Lehengas', 'Sarees', 'Gowns', 'Custom Blouse'];

const getBoutiqueImage = (item) => {
    if (!item) return null;
    const candidates = [
        item.media?.coverImage,
        item.media?.logo,
    ];
    const uri = candidates.find((u) => typeof u === 'string' && (u.startsWith('https://') || u.startsWith('http://')));
    return uri || null;
};

// Memoized Boutique Card Item component to prevent unnecessary FlatList item re-renders
const BoutiqueCard = React.memo(({ item, isFav, onPress, onToggleFavorite }) => {
    const thumbUri = getBoutiqueImage(item);
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
            {/* Wishlist heart */}
            <TouchableOpacity 
                style={styles.wishlistIcon} 
                onPress={onToggleFavorite} 
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
                <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={20} color={isFav ? '#8B0000' : '#aaa'} />
            </TouchableOpacity>

            {/* Thumbnail */}
            {thumbUri ? (
                <Image
                    source={{ uri: thumbUri }}
                    style={styles.image}
                    resizeMode="cover"
                />
            ) : (
                <View style={[styles.image, { backgroundColor: '#F2E5E5', justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="storefront-outline" size={36} color="#8B000055" />
                </View>
            )}

            {/* Details */}
            <View style={styles.cardContent}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.location} numberOfLines={1}>
                    <Ionicons name="location-outline" size={11} color="#777" /> {item.location?.displayLocation || item.city || ''}
                </Text>
                <Text style={styles.rating}>⭐ {item.rating || '4.5'}{item.yearsExperience ? `  ·  ${item.yearsExperience}` : ''}</Text>
                <View style={styles.tagContainer}>
                    {item.tags?.slice(0, 3).map((tag, i) => (
                        <Text key={i} style={styles.tag}>{tag}</Text>
                    ))}
                </View>
                <TouchableOpacity style={styles.button} onPress={onPress}>
                    <Text style={styles.buttonText}>View Designs →</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
});
BoutiqueCard.displayName = 'BoutiqueCard';

export default function HomeScreen() {
    const [boutiques, setBoutiques]       = useState([]);
    const [searchQuery, setSearchQuery]   = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [cartCount, setCartCount]       = useState(0);

    const debouncedSearch = useDebounce(searchQuery, 300);
    
    // Select only what is needed from the Zustand store
    const favorites = useStore(state => state.favorites);
    const toggleFavorite = useStore(state => state.toggleFavorite);
    const location = useStore(state => state.location);
    const setLocation = useStore(state => state.setLocation);

    const navigation = useNavigation();

    // Metrics refs
    const mountCountRef = React.useRef(0);
    const renderCountRef = React.useRef(0);

    renderCountRef.current++;

    // Stable fetch function
    const fetchBoutiques = useCallback(async () => {
        setError(null);
        console.log('[API REQUEST] HomeScreen -> GET /boutiques/public');
        try {
            const data = await api.fetchBoutiques();
            console.log('[API RESPONSE] HomeScreen -> GET /boutiques/public 200');
            setBoutiques(data);
        } catch (err) {
            console.log('API ERROR:', err);
            console.log(`[API RESPONSE] HomeScreen -> GET /boutiques/public ${err.status || 500}`);
            setError(err.message || 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    }, []);

    // Stable location request
    const requestLocation = useCallback(async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        try {
            await Location.getCurrentPositionAsync({});
            const state = useStore.getState();
            if (!state.location.city) {
                state.setLocation('Hyderabad', 'Telangana');
            }
        } catch (error) {
            console.log('Location error:', error);
        }
    }, []);

    useEffect(() => {
        console.log('[SCREEN MOUNT] HomeScreen');
        mountCountRef.current++;
        console.log(`[METRIC] Screen Mount: HomeScreen (Count: ${mountCountRef.current})`);
        fetchBoutiques();
        requestLocation();
        getLocalCartCount().then(setCartCount);

        // Fix for "Blocked aria-hidden" warning on web
        const unsubscribe = navigation.addListener('blur', () => {
            if (Platform.OS === 'web') {
                try {
                    // @ts-ignore
                    document.activeElement?.blur();
                } catch (e) {}
            }
            Keyboard.dismiss();
        });
        return () => {
            console.log('[SCREEN UNMOUNT] HomeScreen');
            unsubscribe();
        };
    }, [navigation, fetchBoutiques, requestLocation]);

    useEffect(() => {
        console.log(`[METRIC] Re-render: HomeScreen (Count: ${renderCountRef.current})`);
    });

    const filteredBoutiques = useMemo(() => {
        let filtered = boutiques;
        if (activeCategory !== 'All') {
            filtered = filtered.filter(b => b.tags?.includes(activeCategory));
        }
        if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase();
            filtered = filtered.filter(b =>
                b.name?.toLowerCase().includes(q) ||
                b.location?.toLowerCase().includes(q) ||
                b.tags?.some(t => t.toLowerCase().includes(q))
            );
        }
        return filtered;
    }, [boutiques, activeCategory, debouncedSearch]);

    // Stable navigation callback
    const goToDetails = useCallback((item) => {
        router.push({ pathname: '/details', params: { boutique: JSON.stringify(item) } });
    }, []);

    // Stable toggle callback
    const handleToggleFavorite = useCallback((id) => {
        toggleFavorite(id);
    }, [toggleFavorite]);

    // Memoized item renderer
    const renderItem = useCallback(({ item }) => {
        const isFav = favorites.includes(item.id);
        return (
            <BoutiqueCard 
                item={item} 
                isFav={isFav} 
                onPress={() => goToDetails(item)} 
                onToggleFavorite={() => handleToggleFavorite(item.id)} 
            />
        );
    }, [favorites, goToDetails, handleToggleFavorite]);

    // Memoize static / segmented parts of the header
    const headerComponent = useMemo(() => (
        <View style={styles.header}>
            <TouchableOpacity style={styles.headerIconBtn}>
                <Ionicons name="menu" size={22} color="#8B0000" />
            </TouchableOpacity>
            <Text style={styles.logo}>VS Boutique</Text>
            <TouchableOpacity style={styles.headerIconBtn}>
                <Ionicons name="notifications-outline" size={22} color="#8B0000" />
            </TouchableOpacity>
        </View>
    ), []);

    const locationHeaderComponent = useMemo(() => (
        <View style={styles.locationHeader}>
            <Ionicons name="location" size={16} color="#8B0000" />
            <Text style={styles.locationText}>
                {location.city ? `${location.city}, ${location.region}` : 'Locating...'}
            </Text>
        </View>
    ), [location]);

    const categoriesComponent = useMemo(() => (
        <View style={styles.categoriesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CATEGORIES.map((cat, idx) => (
                    <TouchableOpacity
                        key={idx}
                        style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
                        onPress={() => setActiveCategory(cat)}
                    >
                        <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    ), [activeCategory]);

    const listHeader = useMemo(() => (
        <>
            {headerComponent}
            <Text style={styles.tagline}>Design your perfect style ✨</Text>
            {locationHeaderComponent}
            
            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} style={styles.searchIcon} />
                <TextInput
                    placeholder="Search name, location, style..."
                    placeholderTextColor="#999"
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <TouchableOpacity style={styles.filterButton}>
                    <Ionicons name="options-outline" size={20} color="#8B0000" />
                </TouchableOpacity>
            </View>

            {categoriesComponent}

            {/* Section title */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Nearby Boutiques</Text>
                <Text style={styles.viewAll}>View All</Text>
            </View>

            {/* Loading */}
            {loading && <ActivityIndicator size="large" color="#8B0000" style={{ marginTop: 40 }} />}

            {/* Error Alert */}
            {error && (
                <View style={{ margin: 15, padding: 15, backgroundColor: '#FFF5F5', borderRadius: 8, borderWidth: 1, borderColor: '#FEB2B2' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                        <Ionicons name="alert-circle" size={20} color="#C53030" style={{ marginRight: 6 }} />
                        <Text style={{ color: '#9B2C2C', fontWeight: 'bold' }}>Connection Error</Text>
                    </View>
                    <Text style={{ color: '#C53030', fontSize: 13, marginBottom: 8 }}>{error}</Text>
                    <Text style={{ color: '#718096', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                        Target: {api.BASE_URL || 'Unknown'}
                    </Text>
                    <TouchableOpacity 
                        onPress={fetchBoutiques}
                        style={{ marginTop: 10, padding: 8, backgroundColor: '#C53030', borderRadius: 4, alignItems: 'center' }}
                    >
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Retry Connection</Text>
                    </TouchableOpacity>
                </View>
            )}
        </>
    ), [
        headerComponent, 
        locationHeaderComponent, 
        categoriesComponent, 
        searchQuery, 
        loading, 
        error, 
        fetchBoutiques
    ]);

    return (
        // Outer View — fills screen, provides background
        <View style={styles.container}>

            {/* Scrollable area — has paddingBottom = BOTTOM_NAV_H so list clears the nav */}
            <FlatList
                data={filteredBoutiques}
                renderItem={renderItem}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                showsVerticalScrollIndicator={false}
                initialNumToRender={6}
                contentContainerStyle={styles.scrollContent}
                ListHeaderComponent={listHeader}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="storefront-outline" size={60} color="#ddd" />
                            <Text style={styles.emptyText}>No boutiques found</Text>
                        </View>
                    ) : null
                }
            />

            {/* Bottom Navigation — FIXED, overlays content */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/home')}>
                    <Ionicons name="home" size={22} color="#8B0000" />
                    <Text style={styles.navTextActive}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="calendar-outline" size={22} color="#999" />
                    <Text style={styles.navText}>Bookings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.centerButton}>
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/Cart')}>
                    <View>
                        <Ionicons name="cart-outline" size={22} color="#999" />
                        {cartCount > 0 && (
                            <View style={{
                                position: 'absolute', top: -6, right: -10,
                                backgroundColor: '#D32F2F', borderRadius: 10,
                                minWidth: 18, height: 18,
                                alignItems: 'center', justifyContent: 'center',
                                paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#FFF'
                            }}>
                                <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900' }}>
                                    {cartCount > 9 ? '9+' : cartCount}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.navText}>Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/MyOrders')}>
                    <Ionicons name="bag-outline" size={22} color="#999" />
                    <Text style={styles.navText}>Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
                    <Ionicons name="person-outline" size={22} color="#999" />
                    <Text style={styles.navText}>Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Image, ScrollView,
    TouchableOpacity, Dimensions, StatusBar, Linking, Platform,
    ActivityIndicator, Keyboard, Modal, TextInput, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../src/services/api';
import useStore from '../src/store/useStore';

const { width: W } = Dimensions.get('window');
const STATUS_H = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
const NAV_H    = Platform.OS === 'ios' ? 80 : 64;
const PRIMARY  = '#8B0000';
const GOLD     = '#C89B3C';
const BG       = '#FAF6F2';
const TABS     = ['About', 'Designs', 'Tailors', 'Reviews', 'Photos'];

function pickHttpsUri(...vals: unknown[]): string | null {
    for (const v of vals) {
        if (typeof v === 'string' && (v.startsWith('https://') || v.startsWith('http://'))) return v;
    }
    return null;
}

// Map specialty text → MaterialCommunityIcons name
const ICON_MAP: Record<string, string> = {
    'Bridal Wear':           'crown',
    'Custom Blouse':         'tshirt-crew',
    'Lehengas':              'star-four-points',
    'Sarees':                'weather-windy',
    'Gowns':                 'human-female',
    'Kids Wear':             'baby-face-outline',
    'Anarkalis':             'flower',
    'Suits':                 'briefcase-outline',
    'Pattu Langa Stitching': 'needle',
    'Birthday Frocks':       'cake-variant',
    'New Born Sets':         'baby',
    "Boy's Dhoti Sets":      'human-male',
    'Salwar Kameez':         'hanger',
};

export default function Details() {
    const { boutique } = useLocalSearchParams();
    const router       = useRouter();
    const [activeTab, setActiveTab] = useState('About');
    const [liked, setLiked]         = useState(false);
    const [loading, setLoading]     = useState(true);

    const initialBoutique = React.useMemo(() => {
        if (boutique && typeof boutique === 'string') {
            try {
                return JSON.parse(boutique);
            } catch (e) {
                console.error("Failed to parse boutique param", e);
            }
        }
        return null;
    }, [boutique]);

    const [data, setData]           = useState<any>(initialBoutique);
    const navigation                = useNavigation();

    // Metrics refs
    const mountCountRef = React.useRef(0);
    const renderCountRef = React.useRef(0);

    renderCountRef.current++;

    React.useEffect(() => {
        mountCountRef.current++;
        console.log(`[METRIC] Screen Mount: BoutiqueDetails (Count: ${mountCountRef.current})`);
    }, []);

    React.useEffect(() => {
        console.log(`[METRIC] Re-render: BoutiqueDetails (Count: ${renderCountRef.current})`);
    });

    // Booking states
    const [bookingModalVisible, setBookingModalVisible] = useState(false);
    const [bookingType, setBookingType] = useState('STORE_VISIT');
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    const [bookingNotes, setBookingNotes] = useState('');
    const [bookingSubmitting, setBookingSubmitting] = useState(false);

    // Caching states
    const [designsLoading, setDesignsLoading] = useState(false);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    // Reviews state
    const [reviews, setReviews] = useState<any[]>([]);

    const designsCache = useStore(state => state.designsCache);
    const reviewsCache = useStore(state => state.reviewsCache);
    const galleryCache = useStore(state => state.galleryCache);
    const setDesignsInCache = useStore(state => state.setDesignsInCache);
    const setReviewsInCache = useStore(state => state.setReviewsInCache);
    const setGalleryInCache = useStore(state => state.setGalleryInCache);

    const id = initialBoutique?.id || initialBoutique?._id;

    React.useEffect(() => {
        console.log('[SCREEN MOUNT] BoutiqueDetails');
        return () => {
            console.log('[SCREEN UNMOUNT] BoutiqueDetails');
        };
    }, []);

    React.useEffect(() => {
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
        return unsubscribe;
    }, [navigation]);

    React.useEffect(() => {
        console.log("[SCREEN] BoutiqueDetails Running cache / fetch validation checks");
        if (!id) return;

        const state = useStore.getState();
        const designsInCache = state.designsCache[id];
        const reviewsInCache = state.reviewsCache[id];
        const galleryInCache = state.galleryCache[id];

        // 1. Designs and Gallery Cache Check
        if (!designsInCache) {
            setDesignsLoading(true);
            console.log(`[CACHE] Designs/Gallery NOT found in cache for boutique ${id}. Fetching...`);
            console.log('[API REQUEST] BoutiqueDetails -> GET /boutiques/public/' + id);
            api.fetchBoutiqueById(id)
                .then((fullData) => {
                    console.log('[API RESPONSE] BoutiqueDetails -> GET /boutiques/public/' + id + ' 200');
                    console.log(`[FETCH] Boutique details & designs fetched successfully for ${id}`);
                    setData(fullData);
                    setDesignsInCache(id, fullData.designs || []);
                    if (fullData.media?.gallery) {
                        setGalleryInCache(id, fullData.media.gallery);
                    }
                })
                .catch((err) => {
                    console.log(`Error fetching boutique details:`, err);
                    console.log('[API RESPONSE] BoutiqueDetails -> GET /boutiques/public/' + id + ' ' + (err.status || 500));
                })
                .finally(() => {
                    setDesignsLoading(false);
                    setLoading(false);
                });
        } else {
            console.log(`[CACHE] Designs/Gallery found in cache for boutique ${id}. Skipping fetch.`);
            console.log('[CACHE HIT] BoutiqueDetails (Designs)');
            setData((prev: any) => ({
                ...(prev || initialBoutique),
                designs: designsInCache,
                media: {
                    ...(prev?.media || initialBoutique?.media),
                    gallery: galleryInCache || prev?.media?.gallery || initialBoutique?.media?.gallery || []
                }
            }));
            setLoading(false);
        }

        // 2. Reviews Cache Check
        if (!reviewsInCache) {
            setReviewsLoading(true);
            console.log(`[CACHE] Reviews NOT found in cache for boutique ${id}. Fetching...`);
            console.log('[API REQUEST] BoutiqueDetails -> GET /reviews/boutique/' + id);
            api.fetchBoutiqueReviews(id)
                .then((res) => {
                    if (res?.success) {
                        console.log('[API RESPONSE] BoutiqueDetails -> GET /reviews/boutique/' + id + ' 200');
                        console.log(`[FETCH] Reviews fetched successfully for boutique ${id}`);
                        setReviews(res.data || []);
                        setReviewsInCache(id, res.data || []);
                    }
                })
                .catch((err) => {
                    console.log(`Error fetching reviews:`, err);
                    console.log('[API RESPONSE] BoutiqueDetails -> GET /reviews/boutique/' + id + ' ' + (err.status || 500));
                })
                .finally(() => {
                    setReviewsLoading(false);
                });
        } else {
            console.log(`[CACHE] Reviews found in cache for boutique ${id}. Skipping fetch.`);
            console.log('[CACHE HIT] BoutiqueDetails (Reviews)');
            setReviews(reviewsInCache);
        }
    }, [id]);

    const handleConfirmBooking = async () => {
        if (!bookingDate || !bookingTime) {
            Alert.alert('Required Fields', 'Please select a date and time slot.');
            return;
        }
        setBookingSubmitting(true);
        try {
            const res = await api.createBooking({
                boutiqueId: data.id || data._id,
                customerName: 'Mobile Customer',
                customerMobile: '9000100020',
                bookingDate,
                bookingTime,
                notes: bookingNotes,
                bookingType
            });
            if (res?.success) {
                Alert.alert('Booking Confirmed', 'Your consultation booking request has been submitted successfully.');
                setBookingModalVisible(false);
                setBookingDate('');
                setBookingTime('');
                setBookingNotes('');
            }
        } catch (err: any) {
            Alert.alert('Booking Failed', err.message || 'An error occurred.');
        } finally {
            setBookingSubmitting(false);
        }
    };

    if (!data && loading) return (
        <View style={s.centered}>
            <ActivityIndicator size="large" color={PRIMARY} />
        </View>
    );

    if (!data) return (
        <View style={s.centered}>
            <Ionicons name="storefront-outline" size={52} color="#ddd" />
            <Text style={s.noData}>Boutique not found</Text>
        </View>
    );

    const mediaCover = pickHttpsUri(
        data.media?.coverImage,
        data.media?.logo
    );
    const rawGallery = Array.isArray(data.media?.gallery)
        ? data.media.gallery
        : [];
    const mediaGallery = rawGallery.filter(
        (u: string) => typeof u === 'string' && (u.startsWith('https://') || u.startsWith('http://'))
    );
    const tags    = data.workTypeSpecialty || data.tags || data.specialties || [];
    const designs = data.designs || data.popularDesigns || [];
    const phone   = data.mobileNumber || data.phoneNumber || data.phone || '';

    return (
        <View style={s.screen}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            {/* ── FLOATING HEADER ─────────────────────── */}
            <View style={s.header}>
                <TouchableOpacity style={s.hBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity style={s.hBtn} onPress={() => setLiked(!liked)}>
                        <Ionicons name={liked ? "heart" : "heart-outline"} size={22} color={liked ? PRIMARY : "#1A1A1A"} />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.hBtn}>
                        <Ionicons name="share-outline" size={22} color="#1A1A1A" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── MAIN SCROLL ──────────────────────────── */}
            <ScrollView showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: NAV_H + 90 }}>

                {/* HERO */}
                <View style={s.hero}>
                    {mediaCover ? (
                        <Image
                            source={{ uri: mediaCover }}
                            style={s.heroImg}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[s.heroImg, { backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="image-outline" size={48} color={GOLD} />
                        </View>
                    )}
                    <View style={s.heroText}>
                        <Text style={s.boutiqueTitle}>
                            {data.name}{'  '}
                            <MaterialCommunityIcons name="human-female" size={20} color={GOLD} />
                        </Text>

                        <View style={s.ratingRow}>
                            <Ionicons name="star" size={14} color="#F5A623" />
                            <Text style={s.ratingVal}> {data.rating ?? '4.8'}</Text>
                            <Text style={s.ratingCount}> ({data.reviewCount ?? 126} Reviews)</Text>
                        </View>

                        <View style={s.experienceRow}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color="#666" />
                            <Text style={s.years}>
                                {' '}{typeof data.experience === 'object' ? data.experience.label : (data.yearsExperience ? `${data.yearsExperience} Years Experience` : '15+ Years Experience')}
                            </Text>
                        </View>

                        <View style={s.locRow}>
                            <Ionicons name="location" size={12} color={PRIMARY} />
                            <Text style={s.locText} numberOfLines={2}>
                                {' '}{data.location?.displayLocation || [data.area, data.city, data.state].filter(Boolean).join(', ')}
                            </Text>
                        </View>

                        {/* Stats — 3 in one row */}
                        <View style={s.statsRow}>
                            {[
                                { 
                                    icon: 'people-outline', 
                                    val: typeof data.happyClients === 'object' ? data.happyClients.label : (data.happyClients || '500+'), 
                                    lbl: 'Happy Clients' 
                                },
                                { 
                                    icon: 'shirt-outline', 
                                    val: typeof data.totalDesigns === 'object' ? data.totalDesigns.label : (data.totalDesigns || '1000+'), 
                                    lbl: 'Designs' 
                                },
                                { icon: 'shield-checkmark-outline', val: 'Verified', lbl: 'Boutique' },
                            ].map((st, i) => (
                                <View key={i} style={s.statChip}>
                                    <Ionicons name={st.icon as any} size={14} color={PRIMARY} />
                                    <Text style={s.statVal}>{st.val}</Text>
                                    <Text style={s.statLbl}>{st.lbl}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>


                {/* TABS */}
                <View style={s.tabBar}>
                    {TABS.map(t => (
                        <TouchableOpacity key={t} style={s.tabItem} onPress={() => setActiveTab(t)}>
                            <Text style={[s.tabTxt, activeTab === t && s.tabTxtOn]}>{t}</Text>
                            {activeTab === t && <View style={s.tabLine} />}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ABOUT TAB */}
                {activeTab === 'About' && (
                    <View style={{ paddingBottom: 8 }}>

                        {/* Specialties */}
                        {tags.length > 0 && (
                            <View style={s.sec}>
                                <Text style={s.secTitle}>Our Specialties</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {tags.map((tag: string, i: number) => (
                                        <View key={i} style={s.spItem}>
                                            <View style={s.spCircle}>
                                                <MaterialCommunityIcons
                                                    name={(ICON_MAP[tag] ?? 'hanger') as any}
                                                    size={26} color={PRIMARY}
                                                />
                                            </View>
                                            <Text style={s.spLabel} numberOfLines={2}>{tag}</Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Popular Designs */}
                        <View style={s.sec}>
                            <View style={s.rowBetween}>
                                <Text style={s.secTitle}>Popular Designs</Text>
                                <TouchableOpacity onPress={() => setActiveTab('Designs')} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={s.viewAll}>VIEW ALL ›</Text>
                                </TouchableOpacity>
                            </View>
                            {designsLoading ? (
                                <View style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
                                    <ActivityIndicator size="small" color={PRIMARY} />
                                </View>
                            ) : designs.length > 0 ? (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {designs.map((d: any, i: number) => {
                                        const dUri = pickHttpsUri(d.image, d.images?.[0]);
                                        return (
                                        <TouchableOpacity key={i} style={s.dCard}>
                                            {dUri ? (
                                                <Image
                                                    source={{ uri: dUri }}
                                                    style={s.dImg}
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <View style={[s.dImg, { backgroundColor: '#F2E5E5', justifyContent: 'center', alignItems: 'center' }]}>
                                                    <Ionicons name="shirt-outline" size={28} color="#8B000055" />
                                                </View>
                                            )}
                                            <Text style={s.dName} numberOfLines={1}>{d.name || d.title}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 8 }}>
                                                <Ionicons name="star" size={11} color="#F5A623" />
                                                <Text style={s.dRating}> {d.rating || '4.8'} ({d.reviews || 0})</Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                    })}
                                </ScrollView>
                            ) : (
                                <View style={s.empty}>
                                    <Ionicons name="shirt-outline" size={40} color="#ddd" />
                                    <Text style={s.emptyTxt}>Designs coming soon</Text>
                                </View>
                            )}
                        </View>

                        {/* Business Hours */}
                        {(data.openingTime || data.closingTime) && (
                            <View style={s.sec}>
                                <Text style={s.secTitle}>Business Hours</Text>
                                <View style={s.hoursCard}>
                                    <Ionicons name="time-outline" size={16} color={PRIMARY} />
                                    <Text style={s.hoursText}>
                                        {'  '}{data.openingTime} – {data.closingTime}
                                        {data.weeklyHoliday ? `  ·  Closed on ${data.weeklyHoliday}` : ''}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* DESIGNS TAB */}
                {activeTab === 'Designs' && (
                    <View style={s.designsGrid}>
                        {designsLoading ? (
                            <View style={s.coming}>
                                <ActivityIndicator size="large" color={PRIMARY} />
                            </View>
                        ) : designs.length > 0 ? (
                            <View style={s.gridRow}>
                                {designs.map((d: any, i: number) => {
                                    const dUri = pickHttpsUri(d.image, d.images?.[0]);
                                    return (
                                    <TouchableOpacity key={i} style={s.gridCard}>
                                        {dUri ? (
                                            <Image
                                                source={{ uri: dUri }}
                                                style={s.gridImg}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={[s.gridImg, { backgroundColor: '#F2E5E5', justifyContent: 'center', alignItems: 'center' }]}>
                                                <Ionicons name="shirt-outline" size={32} color="#8B000055" />
                                            </View>
                                        )}
                                        <View style={s.gridContent}>
                                            <Text style={s.dName} numberOfLines={1}>{d.name || d.title}</Text>
                                            <Text style={s.dPrice}>₹{d.price}</Text>
                                        </View>
                                    </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            <View style={s.coming}>
                                <Ionicons name="shirt-outline" size={52} color="#ddd" />
                                <Text style={s.comingTxt}>No designs found</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* OTHER TABS */}
                {activeTab === 'Photos' && (
                    <View style={s.designsGrid}>
                        {designsLoading ? (
                            <View style={s.coming}>
                                <ActivityIndicator size="large" color={PRIMARY} />
                            </View>
                        ) : mediaGallery.length > 0 ? (
                            <View style={s.gridRow}>
                                {mediaGallery.map((img: string, i: number) => (
                                    <View key={`${img}-${i}`} style={s.gridCard}>
                                        <Image source={{ uri: img }} style={s.gridImg} resizeMode="cover" />
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={s.coming}>
                                <Ionicons name="images-outline" size={52} color="#ddd" />
                                <Text style={s.comingTxt}>No gallery photos yet</Text>
                            </View>
                        )}
                    </View>
                )}

                {activeTab === 'Tailors' && (
                    <View style={s.coming}>
                        <Ionicons name="cut-outline" size={52} color="#ddd" />
                        <Text style={s.comingTxt}>Tailors coming soon</Text>
                    </View>
                )}

                {activeTab === 'Reviews' && (
                    <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                        {reviewsLoading ? (
                            <View style={s.coming}>
                                <ActivityIndicator size="large" color={PRIMARY} />
                            </View>
                        ) : reviews.length > 0 ? (
                            reviews.map((r: any, i: number) => (
                                <View key={i} style={{ backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F0E4DC' }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <Text style={{ fontWeight: '800', color: '#1A1A1A', fontSize: 13 }}>{r.user?.name || 'Customer'}</Text>
                                        <View style={{ flexDirection: 'row', gap: 1 }}>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Ionicons 
                                                    key={star} 
                                                    name="star" 
                                                    size={11} 
                                                    color={star <= r.rating ? '#F5A623' : '#ddd'} 
                                                />
                                            ))}
                                        </View>
                                    </View>
                                    <Text style={{ fontSize: 13, color: '#444', lineHeight: 18 }}>{r.comment || 'No comment text'}</Text>
                                    {r.reply && (
                                        <View style={{ marginTop: 8, padding: 10, backgroundColor: '#FAF6F2', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: PRIMARY }}>
                                            <Text style={{ fontSize: 11, fontWeight: '700', color: PRIMARY, marginBottom: 2 }}>Boutique Response:</Text>
                                            <Text style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>{'\"'}{r.reply}{'\"'}</Text>
                                        </View>
                                    )}
                                </View>
                            ))
                        ) : (
                            <View style={s.coming}>
                                <Ionicons name="chatbubble-ellipses-outline" size={52} color="#ddd" />
                                <Text style={s.comingTxt}>No reviews published yet</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* ── CTA BUTTONS ──────────────────────────── */}
            <View style={s.cta}>
                <TouchableOpacity style={s.callBtn} onPress={() => phone && Linking.openURL(`tel:${phone}`)}>
                    <Ionicons name="call" size={18} color={PRIMARY} />
                    <Text style={s.callTxt}>Call Now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.bookBtn} onPress={() => setBookingModalVisible(true)}>
                    <Ionicons name="calendar" size={18} color="#fff" />
                    <Text style={s.bookTxt}>Book Appointment</Text>
                </TouchableOpacity>
            </View>

            {/* ── BOTTOM NAV ───────────────────────────── */}
            <View style={s.nav}>
                <TouchableOpacity style={s.navItem} onPress={() => router.push('/home')}>
                    <Ionicons name="home" size={22} color={PRIMARY} />
                    <Text style={s.navOn}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.navItem} onPress={() => router.navigate('Cart' as any)}>
                    <Ionicons name="cart-outline" size={22} color="#999" />
                    <Text style={s.navOff}>Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.fab}>
                    <Ionicons name="add" size={26} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={s.navItem} onPress={() => router.navigate('MyOrders' as any)}>
                    <Ionicons name="bag-outline" size={22} color="#999" />
                    <Text style={s.navOff}>Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.navItem}>
                    <Ionicons name="person-outline" size={22} color="#999" />
                    <Text style={s.navOff}>Profile</Text>
                </TouchableOpacity>
            </View>

            {/* ── BOOKING MODAL SCHEDULER ────────────────── */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={bookingModalVisible}
                onRequestClose={() => setBookingModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                            <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A1A1A' }}>Book Consultation Slot</Text>
                            <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                                <Ionicons name="close-circle" size={24} color="#aaa" />
                            </TouchableOpacity>
                        </View>

                        {/* Booking Type chips */}
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#666', marginBottom: 8, letterSpacing: 0.5 }}>SESSION CATEGORY</Text>
                        <View style={{ marginBottom: 16 }}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 6 }}>
                                {[
                                    { id: 'STORE_VISIT', label: 'Store Visit' },
                                    { id: 'HOME_MEASUREMENT', label: 'Home Visit' },
                                    { id: 'VIDEO_CONSULTATION', label: 'Video Call' },
                                    { id: 'DESIGN_DISCUSSION', label: 'Design Talk' }
                                ].map((type) => (
                                    <TouchableOpacity 
                                        key={type.id} 
                                        onPress={() => setBookingType(type.id)}
                                        style={{ 
                                            paddingHorizontal: 12, 
                                            paddingVertical: 8, 
                                            borderRadius: 10, 
                                            backgroundColor: bookingType === type.id ? PRIMARY : '#FAF6F2',
                                            borderWidth: 1,
                                            borderColor: bookingType === type.id ? PRIMARY : '#EDE0D8',
                                        }}
                                    >
                                        <Text style={{ fontSize: 11, fontWeight: '800', color: bookingType === type.id ? '#FFF' : '#666' }}>{type.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Date field */}
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#666', marginBottom: 6, letterSpacing: 0.5 }}>DATE (YYYY-MM-DD)</Text>
                        <TextInput
                            placeholder="e.g. 2026-06-15"
                            placeholderTextColor="#999"
                            value={bookingDate}
                            onChangeText={setBookingDate}
                            style={{ 
                                padding: 12, 
                                borderWidth: 1, 
                                borderColor: '#EDE0D8', 
                                borderRadius: 12, 
                                backgroundColor: '#FAF6F2',
                                fontSize: 13,
                                fontWeight: '600',
                                color: '#1A1A1A',
                                marginBottom: 16
                            }}
                        />

                        {/* Time field */}
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#666', marginBottom: 6, letterSpacing: 0.5 }}>TIME SLOT</Text>
                        <TextInput
                            placeholder="e.g. 11:00 AM"
                            placeholderTextColor="#999"
                            value={bookingTime}
                            onChangeText={setBookingTime}
                            style={{ 
                                padding: 12, 
                                borderWidth: 1, 
                                borderColor: '#EDE0D8', 
                                borderRadius: 12, 
                                backgroundColor: '#FAF6F2',
                                fontSize: 13,
                                fontWeight: '600',
                                color: '#1A1A1A',
                                marginBottom: 16
                            }}
                        />

                        {/* Consultation notes */}
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#666', marginBottom: 6, letterSpacing: 0.5 }}>CONSULTATION NOTES</Text>
                        <TextInput
                            placeholder="Describe your design specifications or preferences..."
                            placeholderTextColor="#999"
                            value={bookingNotes}
                            onChangeText={setBookingNotes}
                            multiline
                            numberOfLines={3}
                            style={{ 
                                padding: 12, 
                                borderWidth: 1, 
                                borderColor: '#EDE0D8', 
                                borderRadius: 12, 
                                backgroundColor: '#FAF6F2',
                                fontSize: 13,
                                fontWeight: '600',
                                color: '#1A1A1A',
                                textAlignVertical: 'top',
                                marginBottom: 20
                            }}
                        />

                        {/* Submit button */}
                        <TouchableOpacity 
                            onPress={handleConfirmBooking}
                            disabled={bookingSubmitting}
                            style={{ 
                                height: 50, 
                                backgroundColor: PRIMARY, 
                                borderRadius: 14, 
                                justifyContent: 'center', 
                                alignItems: 'center' 
                            }}
                        >
                            {bookingSubmitting ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>Confirm Consultation Slot</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

/* ─── STYLES ─────────────────────────────────────────── */
const s = StyleSheet.create({
    screen:  { flex: 1, backgroundColor: BG },
    centered:{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG },
    noData:  { color: '#999', fontSize: 14, marginTop: 12 },

    /* Header */
    header: {
        position: 'absolute', top: STATUS_H + 6,
        left: 0, right: 0, zIndex: 50,
        flexDirection: 'row', justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    hBtn: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.93)',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
    },

    /* Hero */
    hero: {
        paddingTop: STATUS_H + 64,
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 8,
        backgroundColor: BG,
    },
    heroImg: {
        width: W * 0.34,
        height: W * 0.44,
        borderRadius: 22,
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
    },
    heroText: { flex: 1, justifyContent: 'center' },
    boutiqueTitle: {
        fontSize: 22, fontWeight: '900', color: '#1A1A1A',
        letterSpacing: -0.5, lineHeight: 28, marginBottom: 2,
    },

    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    ratingVal:   { fontSize: 13, fontWeight: '800', color: '#1A1A1A' },
    ratingCount: { fontSize: 12, color: '#666', marginLeft: 4 },
    
    experienceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    years:       { fontSize: 12, fontWeight: '600', color: '#444' },

    locRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    locText: { fontSize: 12, color: '#666', flex: 1, lineHeight: 16, fontWeight: '500' },

    /* Stats — distribute equally in available space */
    statsRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
    statChip: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 2,
        borderWidth: 1,
        borderColor: '#F0E4DC',
    },
    statVal: { fontSize: 12, fontWeight: '900', color: '#1A1A1A', marginTop: 3 },
    statLbl: { fontSize: 9,  fontWeight: '600', color: '#888', textAlign: 'center', marginTop: 1 },

    /* Description */
    descBox: {
        marginHorizontal: 16, marginBottom: 4,
        padding: 16,
        backgroundColor: '#FFF8F4',
        borderRadius: 16,
        borderWidth: 1, borderColor: '#EDE0D8',
    },
    descText: { fontSize: 13, color: '#444', lineHeight: 21 },

    /* Tabs */
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderBottomWidth: 1, borderBottomColor: '#EEE',
        paddingHorizontal: 8,
    },
    tabItem: {
        flex: 1, alignItems: 'center', paddingVertical: 13,
        position: 'relative',
    },
    tabTxt:  { fontSize: 13, fontWeight: '600', color: '#AAA' },
    tabTxtOn:{ color: PRIMARY, fontWeight: '800' },
    tabLine: {
        position: 'absolute', bottom: 0, left: 6, right: 6,
        height: 2.5, backgroundColor: PRIMARY, borderRadius: 2,
    },

    /* Section */
    sec:      { paddingHorizontal: 16, marginTop: 22 },
    rowBetween:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    secTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 14 },
    viewAll:  { fontSize: 13, color: PRIMARY, fontWeight: '600' },

    /* Specialties */
    spItem:   { alignItems: 'center', marginRight: 18, width: 68 },
    spCircle: {
        width: 62, height: 62, borderRadius: 31,
        backgroundColor: '#FFF0EF',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#F5DDD8',
        marginBottom: 7,
    },
    spLabel: { fontSize: 11, fontWeight: '600', color: '#333', textAlign: 'center', lineHeight: 15 },

    /* Design cards */
    dCard: {
        width: 132, marginRight: 12, borderRadius: 16,
        backgroundColor: '#FFF', overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
    },
    dImg:  { width: 132, height: 155, backgroundColor: '#F2E5E5' },
    dName: { fontSize: 12, fontWeight: '700', color: '#1A1A1A', paddingHorizontal: 8, paddingTop: 7, marginBottom: 2 },
    dRating:{ fontSize: 11, color: '#666' },

    /* Hours */
    hoursCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF8F4', padding: 13,
        borderRadius: 12, borderWidth: 1, borderColor: '#EDE0D8',
    },
    hoursText: { fontSize: 13, color: '#444', fontWeight: '500' },

    /* Empty */
    empty:    { alignItems: 'center', paddingVertical: 32 },
    emptyTxt: { color: '#bbb', fontSize: 13, marginTop: 10 },
    coming:   { alignItems: 'center', paddingVertical: 70 },
    comingTxt:{ color: '#bbb', fontSize: 14, marginTop: 14 },

    /* CTA */
    cta: {
        position: 'absolute', bottom: NAV_H,
        left: 0, right: 0,
        flexDirection: 'row', gap: 12,
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: 'rgba(250,246,242,0.97)',
        borderTopWidth: 1, borderTopColor: '#EDE0D8',
    },
    callBtn: {
        flex: 1, height: 52, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        borderRadius: 14, backgroundColor: '#FFF',
        borderWidth: 1.5, borderColor: PRIMARY,
    },
    callTxt: { fontSize: 15, fontWeight: '800', color: PRIMARY },
    bookBtn: {
        flex: 1.6, height: 52, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        borderRadius: 14, backgroundColor: PRIMARY,
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35, shadowRadius: 8, elevation: 7,
    },
    bookTxt: { fontSize: 15, fontWeight: '800', color: '#FFF' },

    /* Designs Grid Tab */
    designsGrid: { paddingHorizontal: 16, paddingTop: 8 },
    gridRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gridCard: {
        width: (W - 44) / 2,
        backgroundColor: '#FFF',
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },
    gridImg: { width: '100%', height: 180, backgroundColor: '#F2E5E5' },
    gridContent: { padding: 12 },
    dPrice: { fontSize: 13, fontWeight: '800', color: PRIMARY, marginTop: 4 },

    /* Bottom Nav */
    nav: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: NAV_H, flexDirection: 'row',
        justifyContent: 'space-around', alignItems: 'center',
        backgroundColor: '#FFF',
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        paddingBottom: Platform.OS === 'ios' ? 16 : 0,
        shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08, shadowRadius: 10, elevation: 14,
    },
    navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
    navOn:   { fontSize: 10, color: PRIMARY, fontWeight: '700', marginTop: 2 },
    navOff:  { fontSize: 10, color: '#999', marginTop: 2 },
    fab: {
        width: 54, height: 54, borderRadius: 27,
        backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center',
        marginTop: -26,
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.40, shadowRadius: 8, elevation: 9,
    },
});
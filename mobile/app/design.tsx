import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import styles from '@/src/styles/detailsStyles';

function pickHttpsUri(...vals: unknown[]): string | null {
    for (const v of vals) {
        if (typeof v === 'string' && v.startsWith('https://')) return v;
    }
    return null;
}

export default function Details() {
    const { boutique } = useLocalSearchParams();

    // Parse data
    const data = boutique ? JSON.parse(boutique as string) : null;

    if (!data) {
        return (
            <View style={styles.container}>
                <Text>No Data Found</Text>
            </View>
        );
    }

    const heroUri = pickHttpsUri(
        data.media?.coverImage,
        data.media?.logo
    );

    return (
        <ScrollView style={styles.container}>

            {/* Top Image */}
            {heroUri ? (
                <Image source={{ uri: heroUri }} style={styles.image} />
            ) : (
                <View style={[styles.image, { backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="image-outline" size={48} color="#C89B3C" />
                </View>
            )}

            {/* Back Button */}
            <TouchableOpacity style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.content}>

                {/* Name */}
                <Text style={styles.name}>{data.name}</Text>
                <Text style={styles.location}>{typeof data.location === 'object' ? data.location?.displayLocation : data.location}</Text>

                {/* Rating */}
                <Text style={styles.rating}>
                    ⭐ {data.rating} | {data.years}
                </Text>

                {/* Tags */}
                <View style={styles.tagContainer}>
                    {data.tags?.map((tag: string, index: number) => (
                        <Text key={index} style={styles.tag}>
                            {tag}
                        </Text>
                    ))}
                </View>

                {/* Description */}
                <Text style={styles.description}>
                    We specialize in custom blouse designs, bridal wear, and
                    high-quality stitching tailored to your style.
                </Text>

                {/* Button */}
                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Start Designing</Text>
                </TouchableOpacity>

            </View>

        </ScrollView>

    );



}
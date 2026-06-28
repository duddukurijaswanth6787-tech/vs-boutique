import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import styles from '../styles/HomeStyles';

const BoutiqueCard = ({ boutique, onPress }) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Image source={{ uri: boutique.image }} style={styles.image} />
            <View style={styles.cardContent}>
                <Text style={styles.name}>{boutique.name}</Text>
                <Text style={styles.location}>{boutique.location}</Text>
                <Text style={styles.rating}>⭐ {boutique.rating} | {boutique.years}</Text>
                <View style={styles.tagContainer}>
                    {boutique.tags && boutique.tags.map((tag, index) => (
                        <Text key={index} style={styles.tag}>{tag}</Text>
                    ))}
                </View>
                <View style={styles.button}>
                    <Text style={styles.buttonText}>View Designs →</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default BoutiqueCard;

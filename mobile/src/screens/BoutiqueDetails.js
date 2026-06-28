import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const BoutiqueDetails = () => (
    <View style={styles.container}>
        <Text style={styles.text}>Boutique Details Screen</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    text: { fontSize: 20, fontWeight: 'bold' }
});

export default BoutiqueDetails;

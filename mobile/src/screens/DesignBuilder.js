import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BlousePreview from '../components/BlousePreview';

const DesignBuilder = () => {
    const [selectedLayers, setSelectedLayers] = useState({
        base: 'https://via.placeholder.com/300x400?text=Base',
        neck: null,
        sleeve: null,
        back: null
    });

    const updateLayer = (type, uri) => {
        setSelectedLayers(prev => ({ ...prev, [type]: uri }));
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Design Your Blouse</Text>
            
            <BlousePreview layers={selectedLayers} />

            <View style={styles.options}>
                <Text style={styles.label}>Neck Designs</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['Round', 'V-Neck', 'Square'].map(neck => (
                        <TouchableOpacity 
                            key={neck} 
                            onPress={() => updateLayer('neck', `https://via.placeholder.com/100?text=${neck}`)}
                            style={styles.optionButton}
                        >
                            <Text>{neck}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.label}>Sleeve Designs</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['Short', 'Elbow', 'Full'].map(sleeve => (
                        <TouchableOpacity 
                            key={sleeve} 
                            onPress={() => updateLayer('sleeve', `https://via.placeholder.com/100?text=${sleeve}`)}
                            style={styles.optionButton}
                        >
                            <Text>{sleeve}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <TouchableOpacity style={styles.submitButton}>
                <Text style={styles.submitText}>Save Design</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f6f2ef', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#8B0000' },
    options: { marginTop: 30 },
    label: { fontSize: 18, fontWeight: 'bold', marginTop: 15 },
    optionButton: { padding: 10, backgroundColor: '#fff', borderRadius: 10, marginRight: 10, marginTop: 10, borderWidth: 1, borderColor: '#ddd' },
    submitButton: { backgroundColor: '#8B0000', padding: 15, borderRadius: 15, marginTop: 30, alignItems: 'center' },
    submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default DesignBuilder;

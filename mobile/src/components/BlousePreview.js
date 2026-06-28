import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const BlousePreview = ({ layers }) => {
    // layers = { neck: 'uri', sleeve: 'uri', back: 'uri', base: 'uri', color: 'rgba(...)' }
    return (
        <View style={styles.container}>
            {/* Base Layer */}
            <Image source={{ uri: layers.base }} style={styles.layer} />
            
            {/* Back Design */}
            {layers.back && <Image source={{ uri: layers.back }} style={styles.layer} />}
            
            {/* Neck Design */}
            {layers.neck && <Image source={{ uri: layers.neck }} style={styles.layer} />}
            
            {/* Sleeve Design */}
            {layers.sleeve && <Image source={{ uri: layers.sleeve }} style={styles.layer} />}
            
            {/* Color Overlay (optional) */}
            {layers.color && <View style={[styles.layer, { backgroundColor: layers.color, opacity: 0.3 }]} />}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 300,
        height: 400,
        position: 'relative',
        alignSelf: 'center',
    },
    layer: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        resizeMode: 'contain',
    }
});

export default BlousePreview;

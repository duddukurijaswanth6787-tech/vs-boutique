import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PRIMARY = '#8B0000';
const BG = '#FAF6F2';

const LegalPageScreen = ({ title, lastUpdated, sections }) => {
    const router = useRouter();

    return (
        <SafeAreaView style={s.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={BG} />
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>{title}</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
                {lastUpdated && (
                    <Text style={s.lastUpdated}>Last Updated: {lastUpdated}</Text>
                )}
                {sections.map((section, i) => (
                    <View key={i} style={s.section}>
                        {section.heading && (
                            <Text style={s.sectionHeading}>{section.heading}</Text>
                        )}
                        {Array.isArray(section.content) ? (
                            section.content.map((line, j) => (
                                <Text key={j} style={[s.text, line.bold && s.textBold, line.highlight && s.textHighlight]}>
                                    {line.prefix && <Text style={s.textPrefix}>{line.prefix}</Text>}
                                    {line.body || line}
                                </Text>
                            ))
                        ) : (
                            <Text style={s.text}>{section.content}</Text>
                        )}
                    </View>
                ))}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF',
        borderBottomWidth: 1, borderBottomColor: '#F0E4DC'
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: BG,
        alignItems: 'center', justifyContent: 'center'
    },
    headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
    content: { padding: 20 },
    lastUpdated: { fontSize: 12, color: '#999', fontWeight: '600', marginBottom: 20, fontStyle: 'italic' },
    section: { marginBottom: 24 },
    sectionHeading: {
        fontSize: 16, fontWeight: '900', color: PRIMARY, marginBottom: 10,
        letterSpacing: -0.3
    },
    text: { fontSize: 14, color: '#444', lineHeight: 22, fontWeight: '500', marginBottom: 6 },
    textBold: { fontWeight: '800', color: '#1A1A1A' },
    textHighlight: { color: PRIMARY, fontWeight: '700' },
    textPrefix: { fontWeight: '800', color: '#1A1A1A' }
});

export default LegalPageScreen;
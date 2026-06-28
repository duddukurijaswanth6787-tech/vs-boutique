import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },

    image: {
        width: '100%',
        height: 250,
    },

    backBtn: {
        position: 'absolute',
        top: 40,
        left: 20,
        backgroundColor: '#8B0000',
        padding: 8,
        borderRadius: 10,
    },

    content: {
        padding: 20,
    },

    name: {
        fontSize: 24,
        fontWeight: 'bold',
    },

    location: {
        color: '#777',
        marginVertical: 5,
    },

    rating: {
        marginBottom: 10,
    },

    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },

    tag: {
        backgroundColor: '#f2e5e5',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        marginRight: 5,
        marginTop: 5,
        fontSize: 12,
    },

    description: {
        color: '#444',
        marginVertical: 15,
        lineHeight: 20,
    },

    button: {
        backgroundColor: '#8B0000',
        padding: 15,
        borderRadius: 12,
    },

    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
});

export default styles;
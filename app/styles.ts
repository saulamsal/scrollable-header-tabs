import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    headerContainer: {
        width: '100%',
        height: 450,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#3498db',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    headerContainerStyle: {
        zIndex: 1,
        elevation: 1,
    },
    containerStyle: {
        zIndex: 0,
    },

    headerSubtitle: {
        fontSize: 16,
        color: 'white',
        marginTop: 5,
    },
    postItem: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        height: 450,
        backgroundColor: 'yellow',
    },
    followingItem: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        height: 300,
        backgroundColor: '#f9f9f9',
    },
    videoItem: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        height: 300,
        backgroundColor: '#f9f9f9',
    },
    visibleItem: {
        backgroundColor: '#e6e6e6',
    },
});
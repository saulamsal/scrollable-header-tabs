import { StyleSheet } from 'react-native';

const TabBarHeight = 48;

const styles = StyleSheet.create({
    container: { flex: 1 },
    label: { fontSize: 16, color: '#222' },
    tab: { elevation: 0, shadowOpacity: 0, backgroundColor: '#FFCC80', height: TabBarHeight },
    indicator: { backgroundColor: '#222' },
});

export default styles;

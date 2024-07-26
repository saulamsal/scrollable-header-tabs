import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import TabViewComponent from './components/TabViewComponent';

const ITEMS_PER_PAGE = 20;

const generateFakeData = (startIndex, count) => {
    return Array.from({ length: count }, (_, i) => ({
        id: startIndex + i,
        title: `Item ${startIndex + i}`
    }));
};

const PostItem = ({ item }) => (
    <View style={styles.item}>
        <Text>Post {item.title}</Text>
    </View>
);

const FollowingItem = ({ item }) => (
    <View style={styles.item}>
        <Text>Following {item.title}</Text>
    </View>
);

const App = () => {
    const [postsData, setPostsData] = useState(generateFakeData(1, ITEMS_PER_PAGE));
    const [followingData, setFollowingData] = useState(generateFakeData(1, ITEMS_PER_PAGE));

    const onEndReached = useCallback((tabName) => {
        const newData = generateFakeData(
            tabName === 'Posts' ? postsData.length + 1 : followingData.length + 1,
            ITEMS_PER_PAGE
        );
        if (tabName === 'Posts') {
            setPostsData(prev => [...prev, ...newData]);
        } else {
            setFollowingData(prev => [...prev, ...newData]);
        }
    }, [postsData, followingData]);

    const tabs = useMemo(() => [
        {
            name: 'For You',
            label: 'For You',
            listType: 'FlashList',
            data: postsData,
            renderItem: ({ item }) => <PostItem item={item} />,
            keyExtractor: (item) => `post-${item.id}`,
            onEndReached: () => onEndReached('Posts'),
            estimatedItemSize: 50,
        },
        {
            name: 'Following',
            label: 'Following',
            listType: 'FlatList',
            data: followingData,
            renderItem: ({ item }) => <FollowingItem item={item} />,
            keyExtractor: (item) => `following-${item.id}`,
            onEndReached: () => onEndReached('Following'),
        },
    ], [postsData, followingData, onEndReached]);

    const HeaderComponent = () => (
        <View style={styles.header}>
            <Text style={styles.headerTitle}>My App</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <TabViewComponent
                tabs={tabs}
                HeaderComponent={HeaderComponent}
                headerHeight={100}
                tabBarHeight={48}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    header: {
        height: 100,
        justifyContent: 'flex-end',
        paddingBottom: 10,
        paddingHorizontal: 20,
        backgroundColor: '#3498db',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    item: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#ffffff',
    },
});

export default App;
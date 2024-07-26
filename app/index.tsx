import React, { useState, useCallback, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import TabViewComponent, { ViewabilityItemsContext, ItemKeyContext } from './components/TabViewComponent';

const PostItem = ({ item }) => {
    const id = useContext(ItemKeyContext);
    const visibleItems = useContext(ViewabilityItemsContext);
    const isCentered = visibleItems.includes(id);

    return (
        <View style={[styles.postItem, isCentered && styles.centeredItem]}>
            <Text>Post {item}</Text>
        </View>
    );
};

const FollowingItem = ({ item }) => {
    const id = useContext(ItemKeyContext);
    const visibleItems = useContext(ViewabilityItemsContext);
    const isCentered = visibleItems.includes(id);

    return (
        <View style={[styles.followingItem, isCentered && styles.centeredItem]}>
            <Text>Following Content {item}</Text>
        </View>
    );
};

const VideoItem = ({ item }) => {
    const id = useContext(ItemKeyContext);
    const visibleItems = useContext(ViewabilityItemsContext);
    const isCentered = visibleItems.includes(id);

    return (
        <View style={[styles.videoItem, isCentered && styles.centeredItem]}>
            <Text>Video {item}</Text>
        </View>
    );
};

const App = () => {
    const [postsData, setPostsData] = useState(Array.from({ length: 20 }, (_, i) => i + 1));
    const [followingData, setFollowingData] = useState(Array.from({ length: 20 }, (_, i) => i + 1));
    const [videosData, setVideosData] = useState(Array.from({ length: 20 }, (_, i) => i + 1));
    const [refreshing, setRefreshing] = useState({ posts: false, following: false, videos: false });

    const onRefresh = useCallback((tabName) => {
        setRefreshing(prev => ({ ...prev, [tabName]: true }));
        setTimeout(() => {
            setRefreshing(prev => ({ ...prev, [tabName]: false }));
            Alert.alert(`${tabName} refreshed!`);
        }, 1500);
    }, []);

    const onEndReached = useCallback((tabName) => {
        Alert.alert(`End of ${tabName} list reached!`);
        // Here you would typically load more data
    }, []);

    const [tabs, setTabs] = useState([
        {
            name: 'For You',
            label: 'For You',
            listType: 'FlashList',
            data: postsData,
            renderItem: ({ item }) => <PostItem item={item} />,
            keyExtractor: (item) => `post-${item}`,
            onRefresh: () => onRefresh('Posts'),
            refreshing: refreshing.posts,
            onEndReached: () => onEndReached('Posts'),
            estimatedItemSize: 50,
        },
        {
            name: 'Following',
            label: 'Following',
            listType: 'FlatList',
            data: followingData,
            renderItem: ({ item }) => <FollowingItem item={item} />,
            keyExtractor: (item) => `following-${item}`,
            onRefresh: () => onRefresh('Following'),
            refreshing: refreshing.following,
            onEndReached: () => onEndReached('Following'),
        },
        {
            name: 'Recap',
            label: 'Recap',
            listType: 'ScrollView',
            component: (
                <View>
                    {videosData.map(item => (
                        <VideoItem key={`video-${item}`} item={item} />
                    ))}
                </View>
            ),
            onRefresh: () => onRefresh('Videos'),
            refreshing: refreshing.videos,

        },
    ]);


    const HeaderComponent = ({ scrollY, headerHeight, effectiveHeaderHeightOnScroll }) => {
        const contentTranslateY = scrollY.interpolate({
            inputRange: [0, headerHeight - effectiveHeaderHeightOnScroll],
            outputRange: [0, -(headerHeight - effectiveHeaderHeightOnScroll)],
            extrapolate: 'clamp',
        });

        return (
            <View style={styles.headerContainer}>
                <Animated.View style={[
                    styles.contentContainer,
                    { transform: [{ translateY: contentTranslateY }] }
                ]}>
                    <Text style={styles.headerTitle}>My App</Text>
                    <Text style={styles.headerSubtitle}>Welcome to the enhanced TabView demo!</Text>
                </Animated.View>
            </View>
        );
    };

    return (
        <TabViewComponent
            tabs={tabs}
            HeaderComponent={HeaderComponent}
            headerHeightOnScroll={80}
            materialTopTabProps={{
                lazy: true,
                lazyPreloadDistance: 2,
                tabBarScrollEnabled: true,
                tabStyle: { width: 'auto' },
                labelStyle: { fontSize: 14, color: 'black' },
            }}
        />
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: '#3498db',
        width: '100%',
        height: 120,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
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
        height:300,
        backgroundColor:'red'
    },
    followingItem: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        height:300,
        backgroundColor:'red'
    },
    videoItem: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    centeredItem: {
        backgroundColor: 'green',
    },
});

export default App;
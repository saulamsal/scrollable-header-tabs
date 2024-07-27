import React, { useState, useCallback, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, SafeAreaView } from 'react-native';
import ScrollableHeaderTabs, { ViewabilityItemsContext, ItemKeyContext } from './components/ScrollableHeaderTabs';

const ITEMS_PER_PAGE = 20;

const generateFakeData = (startIndex, count) => {
    return Array.from({ length: count }, (_, i) => ({
        id: startIndex + i,
        title: `Item ${startIndex + i}`
    }));
};

const fakeApiCall = (delay = 1500) => {
    return new Promise(resolve => setTimeout(resolve, delay));
};

const PostItem = ({ item }) => {
    const id = useContext(ItemKeyContext);
    const visibleItems = useContext(ViewabilityItemsContext);
    const isCentered = visibleItems.includes(id);

    return (
        <View style={[styles.postItem, isCentered && styles.centeredItem]}>
            <Text>Post {item.title}</Text>
        </View>
    );
};

const FollowingItem = ({ item }) => {
    const id = useContext(ItemKeyContext);
    const visibleItems = useContext(ViewabilityItemsContext);
    const isCentered = visibleItems.includes(id);

    return (
        <View style={[styles.followingItem, isCentered && styles.centeredItem]}>
            <Text>Following {item.title}</Text>
        </View>
    );
};

const VideoItem = ({ item }) => {
    const id = useContext(ItemKeyContext);
    const visibleItems = useContext(ViewabilityItemsContext);
    const isCentered = visibleItems.includes(id);

    return (
        <View style={[styles.videoItem, isCentered && styles.centeredItem]}>
            <Text>Video {item.title}</Text>
        </View>
    );
};

const App = () => {
    const [postsData, setPostsData] = useState(generateFakeData(1, ITEMS_PER_PAGE));
    const [followingData, setFollowingData] = useState(generateFakeData(1, ITEMS_PER_PAGE));
    const [videosData, setVideosData] = useState(generateFakeData(1, ITEMS_PER_PAGE));
    const [refreshing, setRefreshing] = useState({ posts: false, following: false, videos: false });
    const [loading, setLoading] = useState({ posts: false, following: false, videos: false });

    const onRefresh = useCallback(async (tabName) => {
        setRefreshing(prev => ({ ...prev, [tabName]: true }));
        await fakeApiCall();
        const newData = generateFakeData(1, ITEMS_PER_PAGE);
        switch (tabName) {
            case 'Posts':
                setPostsData(newData);
                break;
            case 'Following':
                setFollowingData(newData);
                break;
            case 'Videos':
                setVideosData(newData);
                break;
        }
        setRefreshing(prev => ({ ...prev, [tabName]: false }));
        Alert.alert(`${tabName} refreshed!`);
    }, []);

    const onEndReached = useCallback(async (tabName) => {
        if (loading[tabName]) return;
        setLoading(prev => ({ ...prev, [tabName]: true }));
        await fakeApiCall(1000);
        const newData = generateFakeData(
            tabName === 'Posts' ? postsData.length + 1 :
                tabName === 'Following' ? followingData.length + 1 :
                    videosData.length + 1,
            ITEMS_PER_PAGE
        );
        switch (tabName) {
            case 'Posts':
                setPostsData(prev => [...prev, ...newData]);
                break;
            case 'Following':
                setFollowingData(prev => [...prev, ...newData]);
                break;
            case 'Videos':
                setVideosData(prev => [...prev, ...newData]);
                break;
        }
        setLoading(prev => ({ ...prev, [tabName]: false }));
    }, [loading, postsData, followingData, videosData]);

    const [tabs, setTabs] = useState([
        {
            name: 'For You',
            label: 'For You',
            listType: 'FlashList',
            data: postsData,
            renderItem: ({ item }) => <PostItem item={item} />,
            keyExtractor: (item) => `post-${item.id}`,
            onRefresh: () => onRefresh('Posts'),
            refreshing: refreshing.posts,
            onEndReached: () => onEndReached('Posts'),
            estimatedItemSize: 300,
        },
        {
            name: 'Following',
            label: 'Following',
            listType: 'FlatList',
            data: followingData,
            renderItem: ({ item }) => <FollowingItem item={item} />,
            keyExtractor: (item) => `following-${item.id}`,
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
                        <VideoItem key={`video-${item.id}`} item={item} />
                    ))}
                </View>
            ),
            onRefresh: () => onRefresh('Videos'),
            refreshing: refreshing.videos,
        },
    ]);

    useEffect(() => {
        setTabs(prevTabs => prevTabs.map(tab => {
            if (tab.name === 'For You') {
                return { ...tab, data: postsData };
            } else if (tab.name === 'Following') {
                return { ...tab, data: followingData };
            } else if (tab.name === 'Recap') {
                return {
                    ...tab,
                    component: (
                        <View>
                            {videosData.map(item => (
                                <VideoItem key={`video-${item.id}`} item={item} />
                            ))}
                        </View>
                    ),
                };
            }
            return tab;
        }));
    }, [postsData, followingData, videosData]);

    const HeaderComponent = ({ scrollY, headerHeight, effectiveHeaderHeightOnScroll, isTabSticky }) => {
        const contentTranslateY = scrollY.interpolate({
            inputRange: [0, headerHeight - effectiveHeaderHeightOnScroll],
            outputRange: [0, -(headerHeight - effectiveHeaderHeightOnScroll)],
            extrapolate: 'clamp',
        });

console.log(scrollY.value);

        return (
            <Animated.View
                style={[
                    styles.headerContainer,
                    {
                        height: headerHeight,
                        transform: [{ translateY: contentTranslateY }],
                    },
                ]}
            >

                <View style={styles.contentContainer}>
                    <Text style={styles.headerTitle}>My App</Text>
                    <Text style={styles.headerSubtitle}>Welcome to the enhanced TabView demo!</Text>
                </View>
            </Animated.View>
        );
    };




    return (
        <ScrollableHeaderTabs
            tabs={tabs}
            HeaderComponent={HeaderComponent}
            headerHeightOnScroll={120}
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
    },
    safeArea: {
        backgroundColor: '#2980b9',
    },
    menuContainer: {
        height: 40,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    menuText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    contentContainer: {
        height: 80,
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
        height: 300,
        backgroundColor: 'red',
    },
    followingItem: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        height: 300,
        backgroundColor: 'red',
    },
    videoItem: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        height: 300,
        backgroundColor: 'red',
    },
    centeredItem: {
        backgroundColor: 'green',
    },
});

export default App;
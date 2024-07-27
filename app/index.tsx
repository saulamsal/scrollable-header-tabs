import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Tabs, CollapsibleRef, MaterialTabBar } from 'react-native-collapsible-tab-view';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { styles } from './styles';


const ITEMS_PER_PAGE = 20;

const generateFakeData = (startIndex, count) => {
    return Array.from({ length: count }, (_, i) => ({
        id: startIndex + i,
        title: `Item ${startIndex + i}`,
        isVisible: false
    }));
};

const fakeApiCall = (delay = 1500) => {
    return new Promise(resolve => setTimeout(resolve, delay));
};

const PostItem = React.memo(({ item }) => (
    <View style={[styles.postItem, item.isVisible && styles.visibleItem]}>
        <Text>Post {item.title} {item.isVisible ? '(Visible)' : ''}</Text>
    </View>
));

const FollowingItem = React.memo(({ item }) => (
    <View style={[styles.followingItem, item.isVisible && styles.visibleItem]}>
        <Text>Following {item.title} {item.isVisible ? '(Visible)' : ''}</Text>
    </View>
));

const VideoItem = React.memo(({ item }) => (
    <View style={[styles.videoItem, item.isVisible && styles.visibleItem]}>
        <Text>Video {item.title} {item.isVisible ? '(Visible)' : ''}</Text>
    </View>
));

const App = () => {
    const [postsData, setPostsData] = useState(generateFakeData(1, ITEMS_PER_PAGE));
    const [followingData, setFollowingData] = useState(generateFakeData(1, ITEMS_PER_PAGE));
    const [videosData, setVideosData] = useState(generateFakeData(1, ITEMS_PER_PAGE));
    const [refreshing, setRefreshing] = useState({ posts: false, following: false, videos: false });
    const [loading, setLoading] = useState({ posts: false, following: false, videos: false });
    const collapsibleRef = useRef<CollapsibleRef>();

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

    const HeaderComponent = useCallback(() => {
        return (
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>My App</Text>
                <Text style={styles.headerSubtitle}>Welcome to the enhanced TabView demo!</Text>
            </View>
        );
    }, []);

    const renderItem = useCallback((type) => ({ item }) => {
        switch (type) {
            case 'Posts':
                return <PostItem item={item} />;
            case 'Following':
                return <FollowingItem item={item} />;
            case 'Videos':
                return <VideoItem item={item} />;
        }
    }, []);

    const onViewableItemsChanged = useCallback((type) => ({ viewableItems, changed }) => {
        const updateData = (prevData) => {
            const newData = [...prevData];
            changed.forEach((change) => {
                const index = newData.findIndex((item) => item.id === change.item.id);
                if (index !== -1) {
                    newData[index] = { ...newData[index], isVisible: change.isViewable };
                }
            });
            return newData;
        };

        switch (type) {
            case 'Posts':
                setPostsData(updateData);
                break;
            case 'Following':
                setFollowingData(updateData);
                break;
            case 'Videos':
                setVideosData(updateData);
                break;
        }

        // Here you can trigger your API calls for view count or start/stop video playback
        viewableItems.forEach((viewableItem) => {
            if (viewableItem.isViewable) {
                console.log(`Item ${viewableItem.item.id} is now visible`);
                // Call your API here, e.g.:
                // updateViewCount(viewableItem.item.id);
                // or
                // startVideoPlayback(viewableItem.item.id);
            }
        });
    }, []);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50 // Item is considered visible when 50% or more of it is visible
    }).current;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Tabs.Container
                ref={collapsibleRef}
                renderHeader={HeaderComponent}
                headerHeight={120}
                renderTabBar={props => <MaterialTabBar {...props} scrollEnabled tabStyle={{ width: 'auto' }} />}
            >
                <Tabs.Tab name="For You" label="For You">
                    <Tabs.FlashList
                        data={postsData}
                        renderItem={renderItem('Posts')}
                        keyExtractor={(item) => `post-${item.id}`}
                        estimatedItemSize={300}
                        onEndReached={() => onEndReached('Posts')}
                        onEndReachedThreshold={0.1}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing.posts}
                                onRefresh={() => onRefresh('Posts')}
                            />
                        }
                        onViewableItemsChanged={onViewableItemsChanged('Posts')}
                        viewabilityConfig={viewabilityConfig}
                    />
                </Tabs.Tab>
                <Tabs.Tab name="Following" label="Following">
                    <Tabs.FlashList
                        data={followingData}
                        renderItem={renderItem('Following')}
                        keyExtractor={(item) => `following-${item.id}`}
                        onEndReached={() => onEndReached('Following')}
                        onEndReachedThreshold={0.1}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing.following}
                                onRefresh={() => onRefresh('Following')}
                            />
                        }
                        onViewableItemsChanged={onViewableItemsChanged('Following')}
                        viewabilityConfig={viewabilityConfig}
                    />
                </Tabs.Tab>
                <Tabs.Tab name="Recap" label="Recap">
                    <Tabs.FlashList
                        data={videosData}
                        renderItem={renderItem('Videos')}
                        keyExtractor={(item) => `video-${item.id}`}
                        estimatedItemSize={300}
                        onEndReached={() => onEndReached('Videos')}
                        onEndReachedThreshold={0.1}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing.videos}
                                onRefresh={() => onRefresh('Videos')}
                            />
                        }
                        onViewableItemsChanged={onViewableItemsChanged('Videos')}
                        viewabilityConfig={viewabilityConfig}
                    />
                </Tabs.Tab>
            </Tabs.Container>
        </GestureHandlerRootView>
    );
};



export default App;
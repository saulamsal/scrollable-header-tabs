import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Button, Alert, RefreshControl, Dimensions } from 'react-native';
import { Tabs, CollapsibleRef, MaterialTabBar } from 'react-native-collapsible-tab-view';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { styles } from './styles';

const ITEMS_PER_PAGE = 20;

const generateFakeData = (startIndex, count) => {
    return Array.from({ length: count }, (_, i) => ({
        id: startIndex + i,
        title: `Item ${startIndex + i}`,
        isInCenter: false
    }));
};

const fakeApiCall = (delay = 1500) => {
    return new Promise(resolve => setTimeout(resolve, delay));
};

const PostItem = React.memo(
    ({ item }) => (
        <View style={[styles.postItem, item.isInCenter && styles.visibleItem]}>
            <Text>Post {item.title} {item.isInCenter ? '(In Center)' : ''}</Text>
        </View>
    ),
    (prevProps, nextProps) => prevProps.item.isInCenter === nextProps.item.isInCenter
);

const FollowingItem = React.memo(
    ({ item }) => (
        <View style={[styles.followingItem, item.isInCenter && styles.visibleItem]}>
            <Text>Following {item.title} {item.isInCenter ? '(In Center)' : ''}</Text>
        </View>
    ),
    (prevProps, nextProps) => prevProps.item.isInCenter === nextProps.item.isInCenter
);

const VideoItem = React.memo(
    ({ item }) => (
        <View style={[styles.videoItem, item.isInCenter && styles.visibleItem]}>
            <Text>Video {item.title} {item.isInCenter ? '(In Center)' : ''}</Text>
        </View>
    ),
    (prevProps, nextProps) => prevProps.item.isInCenter === nextProps.item.isInCenter
);

const App = () => {
    const [postsData, setPostsData] = useState(generateFakeData(1, ITEMS_PER_PAGE));
    const [followingData, setFollowingData] = useState(generateFakeData(1, ITEMS_PER_PAGE));
    const [videosData, setVideosData] = useState(generateFakeData(1, ITEMS_PER_PAGE));
    const [refreshing, setRefreshing] = useState({ posts: false, following: false, videos: false });
    const [loading, setLoading] = useState({ posts: false, following: false, videos: false });
    const collapsibleRef = useRef();

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
            <View style={styles.headerContainer} pointerEvents="box-none">
                <Text style={styles.headerTitle}>My App</Text>
                <Button title='Follow' onPress={()=>alert('asd')} />
                <Text style={styles.headerSubtitle}>Welcome to the enhanced TabView demo!</Text>
            </View>
        );
    }, []);

    const renderItem = useCallback((type) => {
        return useMemo(() => ({ item, index }) => {
            const ItemComponent = type === 'Posts' ? PostItem : type === 'Following' ? FollowingItem : VideoItem;
            return (
                <View
                    onLayout={(event) => {
                        const layout = event.nativeEvent.layout;
                        item.y = layout.y;
                        item.height = layout.height;
                    }}
                >
                    <ItemComponent item={item} />
                </View>
            );
        }, [type]);
    }, []);

    const onViewableItemsChanged = useCallback((type) => {
        return useMemo(() => ({ viewableItems, changed }) => {
            if (viewableItems.length === 0) return;

            const screenHeight = Dimensions.get('window').height;
            const screenCenter = screenHeight / 2;
            let closestItem = viewableItems.reduce((prev, current) => {
                const prevDistance = Math.abs(prev.item.y + prev.item.height / 2 - screenCenter);
                const currDistance = Math.abs(current.item.y + current.item.height / 2 - screenCenter);
                return prevDistance < currDistance ? prev : current;
            });

            updateCenterItem(type, closestItem.item.id);
            console.log(`Item ${closestItem.item.id} is now in the center`);
        }, [type]);
    }, []);

    const updateCenterItem = useCallback((type, centerItemId) => {
        
        const updateFn = (prevData) => prevData.map(item => ({
            ...item,
            isInCenter: item.id === centerItemId
        }));

        switch (type) {
            case 'Posts':
                setPostsData(updateFn);
                break;
            case 'Following':
                setFollowingData(updateFn);
                break;
            case 'Videos':
                setVideosData(updateFn);
                break;
        }
    }, []);

    const getItemLayout = useCallback((data, index) => ({
        length: 300, // Assuming each item has a fixed height of 300
        offset: 300 * index,
        index,
    }), []);

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
                snapThreshold={0.5}
                headerContainerStyle={styles.headerContainerStyle}
                containerStyle={styles.containerStyle}
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
                        getItemLayout={getItemLayout}
                        maxToRenderPerBatch={10}
                        updateCellsBatchingPeriod={50}
                        initialNumToRender={5}
                        windowSize={5}
                    />
                </Tabs.Tab>
                <Tabs.Tab name="Following" label="Following">
                    <Tabs.FlashList
                        data={followingData}
                        renderItem={renderItem('Following')}
                        keyExtractor={(item) => `following-${item.id}`}
                        onEndReached={() => onEndReached('Following')}
                        onEndReachedThreshold={0.1}
                        estimatedItemSize={300}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing.following}
                                onRefresh={() => onRefresh('Following')}
                            />
                        }
                        onViewableItemsChanged={onViewableItemsChanged('Following')}
                        viewabilityConfig={viewabilityConfig}
                        getItemLayout={getItemLayout}
                        maxToRenderPerBatch={10}
                        updateCellsBatchingPeriod={50}
                        initialNumToRender={5}
                        windowSize={5}
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
                        getItemLayout={getItemLayout}
                        maxToRenderPerBatch={10}
                        updateCellsBatchingPeriod={50}
                        initialNumToRender={5}
                        windowSize={5}
                    />
                </Tabs.Tab>
            </Tabs.Container>
        </GestureHandlerRootView>
    );
};

export default App;
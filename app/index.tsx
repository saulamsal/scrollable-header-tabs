import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Alert, RefreshControl, Dimensions } from 'react-native';
import { Tabs, CollapsibleRef, MaterialTabBar, useHeaderMeasurements, useCurrentTabScrollY } from 'react-native-collapsible-tab-view';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { styles } from './styles';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Link } from 'expo-router';

const ITEMS_PER_PAGE = 20;

const HeaderComponent = () => {
    const { top, height } = useHeaderMeasurements();
    const scrollY = useCurrentTabScrollY();

    const headerAnimatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scrollY.value, [0, 60], [1, 0], 'clamp');
        return { opacity };
    });

    return (
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]} pointerEvents="box-none">
            <View>
                <Text style={styles.headerTitle} pointerEvents="auto">HomePage</Text>
            </View>
            <Link href="/your-team">
                <Text>Your Team</Text>
            </Link>
        </Animated.View>
    );
};

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

const PostItem = React.memo(({ item }) => (
    <View style={[styles.postItem, item.isInCenter && styles.visibleItem]}>
        <Text>Post {item.title} {item.isInCenter ? '(In Center)' : ''}</Text>
    </View>
), (prevProps, nextProps) => prevProps.item.isInCenter === nextProps.item.isInCenter);

const FollowingItem = React.memo(({ item }) => (
    <View style={[styles.followingItem, item.isInCenter && styles.visibleItem]}>
        <Text>Following {item.title} {item.isInCenter ? '(In Center)' : ''}</Text>
    </View>
), (prevProps, nextProps) => prevProps.item.isInCenter === nextProps.item.isInCenter);

const VideoItem = React.memo(({ item }) => (
    <View style={[styles.videoItem, item.isInCenter && styles.visibleItem]}>
        <Text>Video {item.title} {item.isInCenter ? '(In Center)' : ''}</Text>
    </View>
), (prevProps, nextProps) => prevProps.item.isInCenter === nextProps.item.isInCenter);

const HomePage = () => {
    const [postsData, setPostsData] = useState(generateFakeData(1, ITEMS_PER_PAGE));
    const [followingData, setFollowingData] = useState(generateFakeData(1, ITEMS_PER_PAGE));
    const [refreshing, setRefreshing] = useState({ posts: false, following: false });
    const [loading, setLoading] = useState({ posts: false, following: false });
    const collapsibleRef = useRef();

    const onRefresh = useCallback(async (tabName) => {
        setRefreshing(prev => ({ ...prev, [tabName]: true }));
        await fakeApiCall();
        const newData = generateFakeData(1, ITEMS_PER_PAGE);
        if (tabName === 'Posts') {
            setPostsData(newData);
        } else if (tabName === 'Following') {
            setFollowingData(newData);
        }
        setRefreshing(prev => ({ ...prev, [tabName]: false }));
        Alert.alert(`${tabName} refreshed!`);
    }, []);

    const onEndReached = useCallback(async (tabName) => {
        if (loading[tabName]) return;
        setLoading(prev => ({ ...prev, [tabName]: true }));
        await fakeApiCall(1000);
        const newData = generateFakeData(
            tabName === 'Posts' ? postsData.length + 1 : followingData.length + 1,
            ITEMS_PER_PAGE
        );
        if (tabName === 'Posts') {
            setPostsData(prev => [...prev, ...newData]);
        } else if (tabName === 'Following') {
            setFollowingData(prev => [...prev, ...newData]);
        }
        setLoading(prev => ({ ...prev, [tabName]: false }));
    }, [loading, postsData, followingData]);

    const renderItem = useCallback((type) => {
        return ({ item, index }) => {
            const ItemComponent = type === 'Posts' ? PostItem : FollowingItem;
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
        };
    }, []);

    const handleViewableItemsChanged = useCallback((type, { viewableItems }) => {
        if (viewableItems.length === 0) return;

        const screenHeight = Dimensions.get('window').height;
        const screenCenter = screenHeight / 2;

        let maxOverlapItem = viewableItems.reduce((prev, current) => {
            const prevTop = prev.item.y;
            const prevBottom = prev.item.y + prev.item.height;
            const currTop = current.item.y;
            const currBottom = current.item.y + current.item.height;

            const prevOverlap = Math.min(prevBottom, screenCenter) - Math.max(prevTop, screenCenter);
            const currOverlap = Math.min(currBottom, screenCenter) - Math.max(currTop, screenCenter);

            return currOverlap > prevOverlap ? current : prev;
        });

        updateCenterItem(type, maxOverlapItem.item.id);
        console.log(`Item ${maxOverlapItem.item.id} is now in the center`);
    }, []);

    const updateCenterItem = useCallback((type, centerItemId) => {
        const updateFn = (prevData) => prevData.map(item => ({
            ...item,
            isInCenter: item.id === centerItemId
        }));

        if (type === 'Posts') {
            setPostsData(updateFn);
        } else if (type === 'Following') {
            setFollowingData(updateFn);
        }
    }, []);

    const getItemLayout = useCallback((data, index) => ({
        length: 300,
        offset: 300 * index,
        index,
    }), []);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 95
    }).current;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Tabs.Container
                ref={collapsibleRef}
                renderHeader={() => <HeaderComponent />}
                headerHeight={120}
                renderTabBar={props => <MaterialTabBar {...props} scrollEnabled />}
                snapThreshold={0.5}
                headerContainerStyle={styles.headerContainerStyle}
                containerStyle={styles.containerStyle}
                lazy
                cancelLazyFadeIn
            >
                <Tabs.Tab name="News" label="News">
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
                        onViewableItemsChanged={info => handleViewableItemsChanged('Posts', info)}
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
                        onViewableItemsChanged={info => handleViewableItemsChanged('Following', info)}
                        viewabilityConfig={viewabilityConfig}
                        getItemLayout={getItemLayout}
                        maxToRenderPerBatch={10}
                        updateCellsBatchingPeriod={50}
                        initialNumToRender={5}
                        windowSize={5}
                    />
                </Tabs.Tab>
                <Tabs.Tab name="About" label="About">
                    <Tabs.ScrollView>
                        <Text>Manchester United</Text>
                        <Text>Premier League</Text>
                        <Text>Founded: 1878</Text>
                        <Text>Stadium: Old Trafford</Text>
                        <Text>Manager: Erik ten Hag</Text>
                        <Text>Captain: Harry Maguire</Text>
                        <Text>Top Scorer: Marcus Rashford</Text>
                        <Text>Top Assists: Bruno Fernandes</Text>
                    </Tabs.ScrollView>
                </Tabs.Tab>
            </Tabs.Container>
        </GestureHandlerRootView>
    );
};

export default HomePage;

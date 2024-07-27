import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, Image, Text, StyleSheet, Button, Alert, RefreshControl, Dimensions } from 'react-native';
import { Tabs, CollapsibleRef, MaterialTabBar, useHeaderMeasurements, useCurrentTabScrollY } from 'react-native-collapsible-tab-view';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { styles } from './styles';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const ITEMS_PER_PAGE = 20;

const HeaderComponent = () => {
    const { top, height } = useHeaderMeasurements();
    const scrollY = useCurrentTabScrollY();
    const insets = useSafeAreaInsets();

    
    const fadeAnimatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scrollY.value, [0, 60], [1, 0], 'clamp');
        return { opacity };
    });
    return (
        <Animated.View style={[styles.headerContainer]} pointerEvents="box-none">
            <Link href="/" style={styles.backButton}>
                <Text>Back</Text>
            </Link>
         <View>
                <Animated.View style={[styles.fadeContainer, fadeAnimatedStyle]}>
                    <Image
                        pointerEvents="auto"
                        source={{ uri: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/640px-Manchester_United_FC_crest.svg.png' }}
                        style={styles.headerImage}
                    />

                </Animated.View>
                <Text style={styles.headerTitle}>Manchester United</Text>
                <Animated.View style={[fadeAnimatedStyle]}>
                    <Text pointerEvents="auto">Premier League</Text>
                </Animated.View>
         </View>
        
            <Button onPress={() => alert('follow')} title="Follow" />

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

type TabName = 'posts' | 'following' | 'videos';

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

        const viewableItems = newData.map((item, index) => ({
            item,
            index,
            isViewable: true,
            section: null,
            key: `${tabName.toLowerCase()}-${item.id}`,
        }));
        handleViewableItemsChanged(tabName, { viewableItems, changed: [] });
    }, []);

    const onEndReached = useCallback(async (tabName: TabName) => {
        if (loading[tabName]) return;
        setLoading(prev => ({ ...prev, [tabName]: true }));
        await fakeApiCall(1000);
        const newData = generateFakeData(
            tabName === 'posts' ? postsData.length + 1 :
                tabName === 'following' ? followingData.length + 1 :
                    videosData.length + 1,
            ITEMS_PER_PAGE
        );
        switch (tabName) {
            case 'posts':
                setPostsData(prev => [...prev, ...newData]);
                break;
            case 'following':
                setFollowingData(prev => [...prev, ...newData]);
                break;
            case 'videos':
                setVideosData(prev => [...prev, ...newData]);
                break;
        }
        setLoading(prev => ({ ...prev, [tabName]: false }));
    }, [loading, postsData, followingData, videosData]);

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

    const handleViewableItemsChanged = useCallback((type, { viewableItems, changed }) => {
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

    const updateCenterItem = useCallback((type: TabName, centerItemId: number) => {
        const updateFn = (prevData) => prevData.map(item => ({
            ...item,
            isInCenter: item.id === centerItemId
        }));

        switch (type) {
            case 'posts':
                setPostsData(updateFn);
                break;
            case 'following':
                setFollowingData(updateFn);
                break;
            case 'videos':
                setVideosData(updateFn);
                break;
        }
    }, []);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 95
    }).current;

    const insets = useSafeAreaInsets();
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Tabs.Container
                ref={collapsibleRef}
                renderHeader={() => <HeaderComponent />}
                headerHeight={undefined}
                minHeaderHeight={80} 
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
                        onEndReached={() => onEndReached('posts')}
                        onEndReachedThreshold={0.1}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing.posts}
                                onRefresh={() => onRefresh('Posts')}
                            />
                        }
                        onViewableItemsChanged={handleViewableItemsChanged.bind(null, 'Posts')}
                        viewabilityConfig={viewabilityConfig}
                    />
                </Tabs.Tab>
                <Tabs.Tab name="Following" label="Following">
                    <Tabs.FlashList
                        data={followingData}
                        renderItem={renderItem('Following')}
                        keyExtractor={(item) => `following-${item.id}`}
                        onEndReached={() => onEndReached('following')}
                        onEndReachedThreshold={0.1}
                        estimatedItemSize={300}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing.following}
                                onRefresh={() => onRefresh('Following')}
                            />
                        }
                        onViewableItemsChanged={handleViewableItemsChanged.bind(null, 'Following')}
                        viewabilityConfig={viewabilityConfig}
                    />
                </Tabs.Tab>
                <Tabs.Tab name="About" label="About">
                    <Tabs.ScrollView>
                        {/* add some random info about the team like description, estd etc etc */}
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

export default App;
import React, { useState, useRef, useEffect, useCallback, useMemo, createContext } from 'react';
import {
    StyleSheet,
    View,
    Dimensions,
    TouchableOpacity,
    Text,
    RefreshControl,
} from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';

import { FlashList } from '@shopify/flash-list';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolate,
    withDecay,
    runOnJS,
    useAnimatedGestureHandler,
    useAnimatedRef,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

const windowWidth = Dimensions.get('window').width;
const TabBarHeight = 48;
const SCROLL_THRESHOLD = 5;

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

const MAX_VIEWABLE_ITEMS = 1;

export const ViewabilityItemsContext = createContext([]);
export const ItemKeyContext = createContext(undefined);

export const ViewabilityTracker = React.forwardRef(({ listType, onScroll: parentOnScroll, scrollY, ...props }, ref) => {
    const [visibleItems, setVisibleItems] = useState([]);
    const { renderItem: originalRenderItem, onEndReached } = props;
    const hasScrolled = useRef(false);
    const animatedRef = useAnimatedRef();


    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
            console.log('ViewabilityTracker onScroll:', event.contentOffset.y);
            runOnJS(parentOnScroll)(event);
        },
    });


    const renderItem = useCallback((params) => (
        <ItemKeyContext.Provider value={params.index}>
            {originalRenderItem(params)}
        </ItemKeyContext.Provider>
    ), [originalRenderItem]);

    const onViewableItemsChanged = useCallback(({ viewableItems }) => {
        setVisibleItems(viewableItems
            .slice(0, MAX_VIEWABLE_ITEMS)
            .map((item) => item.index));
    }, []);

    const handleEndReached = useCallback((info) => {
        if (hasScrolled.current) {
            onEndReached?.(info);
        }
    }, [onEndReached]);

    const handleScroll = useCallback((event) => {
        if (!hasScrolled.current) {
            hasScrolled.current = true;
        }
        if (typeof parentOnScroll === 'function') {
            parentOnScroll(event);
        }
    }, [parentOnScroll]);

    const ListComponent = listType === 'FlashList' ? AnimatedFlashList : Animated.FlatList;

    return (
        <ViewabilityItemsContext.Provider value={visibleItems}>
            <ListComponent
                {...props}
                ref={(r) => {
                    animatedRef.current = r;
                    if (ref) {
                        if (typeof ref === 'function') ref(r);
                        else ref.current = r;
                    }
                }}
                renderItem={renderItem}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{
                    minimumViewTime: 10,
                    itemVisiblePercentThreshold: 100,
                }}
                onEndReached={handleEndReached}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                maintainVisibleContentPosition={{
                    minIndexForVisible: 0,
                    autoscrollToTopThreshold: 10,
                }}
            />
        </ViewabilityItemsContext.Provider>
    );
});

const ScrollableHeaderTabs = React.memo(({
    tabs,
    HeaderComponent,
    headerHeightOnScroll,
    tabBarStyle,
    renderTabLabel,
    onTabChange,
    materialTopTabProps = {},
    TabBackgroundComponent = View,
    ExtraTabComponent,
    scrollY // Add scrollY as a prop
}) => {
    const [index, setIndex] = useState(0);
    const [routes] = useState(tabs.map(tab => ({ key: tab.name, title: tab.label })));
    const [headerHeight, setHeaderHeight] = useState(0);
    const [effectiveHeaderHeightOnScroll, setEffectiveHeaderHeightOnScroll] = useState(0);
    const scrollViewRefs = useRef({});
    const panRef = useRef(null);
    const headerPanRef = useRef(null);
    const headerScrollStartY = useSharedValue(0);
    const headerScrolling = useSharedValue(false);

    const hasHeader = !!HeaderComponent || headerHeightOnScroll > 0;

    useEffect(() => {
        setEffectiveHeaderHeightOnScroll(Math.min(headerHeight, headerHeightOnScroll || 0));
    }, [headerHeight, headerHeightOnScroll]);

    const headerAnimatedStyle = useAnimatedStyle(() => {
        const translateY = interpolate(
            scrollY.value,
            [0, headerHeight - effectiveHeaderHeightOnScroll],
            [0, -(headerHeight - effectiveHeaderHeightOnScroll)],
            Extrapolate.CLAMP
        );
        return {
            transform: [{ translateY }],
        };
    });

    const tabBarAnimatedStyle = useAnimatedStyle(() => {
        if (!hasHeader) return {};
        const translateY = interpolate(
            scrollY.value,
            [0, headerHeight - effectiveHeaderHeightOnScroll],
            [headerHeight, effectiveHeaderHeightOnScroll],
            Extrapolate.CLAMP
        );
        return {
            transform: [{ translateY }],
        };
    });

    const isTabSticky = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [0, headerHeight - effectiveHeaderHeightOnScroll],
            [0, 1],
            Extrapolate.CLAMP
        );
        return { opacity };
    });

    const syncScrollOffset = useCallback(() => {
        const curRoute = routes[index].key;
        const scrollValue = scrollY.value;
        Object.keys(scrollViewRefs.current).forEach((key) => {
            const ref = scrollViewRefs.current[key];
            if (ref && key !== curRoute) {
                ref.scrollTo({ y: scrollValue, animated: false });
            }
        });
    }, [routes, index, scrollY]);

    const onMomentumScrollEnd = useCallback(() => {
        syncScrollOffset();
    }, [syncScrollOffset]);

    const onScrollEndDrag = useCallback(() => {
        syncScrollOffset();
    }, [syncScrollOffset]);

    const onGestureEvent = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y; // Update scrollY value
            console.log('onScroll:', event.contentOffset.y); // Add this line
            runOnJS(syncScrollOffset)();
        },
        onMomentumEnd: () => {
            runOnJS(onMomentumScrollEnd)();
        },
        onEndDrag: () => {
            runOnJS(onScrollEndDrag)();
        },
    });


    const headerPanGestureHandler = useAnimatedGestureHandler({
        onStart: (event) => {
            headerScrollStartY.value = event.absoluteY;
            headerScrolling.value = false;
        },
        onActive: (event) => {
            const diff = Math.abs(event.absoluteY - headerScrollStartY.value);
            if (diff > SCROLL_THRESHOLD || headerScrolling.value) {
                headerScrolling.value = true;
                scrollY.value = Math.max(0, Math.min(scrollY.value - event.translationY, headerHeight - effectiveHeaderHeightOnScroll));
                runOnJS(syncScrollOffset)();
            }
        },
        onEnd: (event) => {
            if (headerScrolling.value) {
                scrollY.value = withDecay({
                    velocity: -event.velocityY,
                    clamp: [0, headerHeight - effectiveHeaderHeightOnScroll],
                });
                runOnJS(onScrollEndDrag)();
            }
            headerScrolling.value = false;
        },
    });


    const renderHeader = useCallback(() => {
        if (!hasHeader) return null;
        return (
            <PanGestureHandler
                ref={headerPanRef}
                simultaneousHandlers={[panRef, ...Object.values(scrollViewRefs.current)]}
                onGestureEvent={headerPanGestureHandler}
                minDist={SCROLL_THRESHOLD}
            >
                <Animated.View
                    onLayout={(event) => {
                        const height = event.nativeEvent.layout.height;
                        setHeaderHeight(height);
                    }}
                    style={[
                        styles.header,
                        {
                            height: HeaderComponent ? undefined : headerHeightOnScroll,
                        },
                        headerAnimatedStyle,
                    ]}
                >
                    {HeaderComponent && (
                        <HeaderComponent
                            scrollY={scrollY}
                            isTabSticky={isTabSticky}
                            headerHeight={headerHeight}
                            effectiveHeaderHeightOnScroll={effectiveHeaderHeightOnScroll}
                        />
                    )}
                </Animated.View>
            </PanGestureHandler>
        );
    }, [headerAnimatedStyle, HeaderComponent, headerHeightOnScroll, hasHeader, scrollY, isTabSticky, headerHeight, effectiveHeaderHeightOnScroll, headerPanGestureHandler]);

    const renderTabBar = useCallback(() => {
        return (
            <Animated.View
                style={[
                    styles.tabBar,
                    tabBarStyle,
                    hasHeader ? tabBarAnimatedStyle : null,
                    !hasHeader ? { top: 0 } : null,
                ]}
            >
                <Animated.ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tabScroll}
                    contentContainerStyle={styles.tabScrollContent}
                >
                    {routes.map((route, i) => (
                        <TouchableOpacity
                            key={route.key}
                            style={[styles.tabItem, i === index && styles.tabItemActive]}
                            onPress={() => {
                                setIndex(i);
                                onTabChange?.(i);
                            }}
                        >
                            {renderTabLabel ? (
                                renderTabLabel({ route, focused: i === index })
                            ) : (
                                <Text style={[styles.tabText, i === index && styles.tabTextActive]}>
                                    {route.title}
                                </Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </Animated.ScrollView>
                {ExtraTabComponent && <ExtraTabComponent />}
            </Animated.View>
        );
    }, [routes, index, tabBarStyle, tabBarAnimatedStyle, hasHeader, renderTabLabel, onTabChange]);

    const renderScene = useCallback(({ route }) => {
        const tab = tabs.find(t => t.name === route.key);
        if (!tab) return null;

        if (tab.listType === 'ScrollView') {
            const Content = tab.component;
            return (
                <Animated.ScrollView
                    ref={(ref) => {
                        if (ref) {
                            scrollViewRefs.current[route.key] = ref;
                        }
                    }}
                    contentContainerStyle={{
                        paddingTop: hasHeader ? headerHeight + TabBarHeight : TabBarHeight,
                        minHeight: Dimensions.get('window').height + headerHeight,
                    }}
                    scrollEventThrottle={16}
                    onScroll={useAnimatedScrollHandler({
                        onScroll: (event) => {
                            scrollY.value = event.contentOffset.y;
                            console.log('ScrollView onScroll:', event.contentOffset.y);
                        },
                    })}
                    simultaneousHandlers={[panRef, headerPanRef]}
                    bounces={true}
                    refreshControl={
                        <RefreshControl
                            refreshing={tab.refreshing}
                            onRefresh={tab.onRefresh}
                            progressViewOffset={hasHeader ? headerHeight + TabBarHeight : TabBarHeight}
                        />
                    }
                >
                    {Content && <Content />}
                </Animated.ScrollView>
            );
        } else {
            return (
                <ViewabilityTracker
                    ref={(ref) => {
                        if (ref) {
                            scrollViewRefs.current[route.key] = ref;
                        }
                    }}
                    contentContainerStyle={{
                        paddingTop: hasHeader ? headerHeight + TabBarHeight : TabBarHeight,
                        minHeight: Dimensions.get('window').height + headerHeight,
                    }}
                    onScroll={syncScrollOffset}
                    scrollY={scrollY}
                    scrollEventThrottle={16}
                    simultaneousHandlers={[panRef, headerPanRef]}
                    bounces={true}
                    listType={tab.listType}
                    refreshControl={
                        <RefreshControl
                            refreshing={tab.refreshing}
                            onRefresh={tab.onRefresh}
                            progressViewOffset={hasHeader ? headerHeight + TabBarHeight : TabBarHeight}
                        />
                    }
                    {...tab}
                />
            );
        }
    }, [tabs, headerHeight, hasHeader, scrollY]);

    const sceneMap = useMemo(() => {
        return tabs.reduce((acc, tab) => {
            acc[tab.name] = () => renderScene({ route: { key: tab.name } });
            return acc;
        }, {});
    }, [tabs, renderScene]);

    return (
        <View style={styles.container}>
            <TabBackgroundComponent headerHeight={headerHeight} style={[StyleSheet.absoluteFillObject]} />
            {renderHeader()}
            {renderTabBar()}
            <TabView
                {...materialTopTabProps}
                navigationState={{ index, routes }}
                renderScene={SceneMap(sceneMap)}
                onIndexChange={(i) => {
                    setIndex(i);
                    onTabChange?.(i);
                    materialTopTabProps.onIndexChange?.(i);
                }}
                renderTabBar={() => null}
                initialLayout={{ width: Dimensions.get('window').width }}
            />
        </View>
    );
});


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: 'transparent',
    },
    tabBar: {
        backgroundColor: '#fff',
        height: TabBarHeight,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        zIndex: 10,
    },
    tabScroll: {
        height: TabBarHeight,
    },
    tabScrollContent: {
        flexDirection: 'row',
        paddingLeft: 18,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: TabBarHeight,
    },
    tabItemActive: {
        borderBottomWidth: 2,
        borderBottomColor: 'black',
    },
    tabText: {
        fontSize: 16,
        color: 'gray',
        paddingHorizontal: 8,
    },
    tabTextActive: {
        color: 'black',
    },
});

export default ScrollableHeaderTabs;
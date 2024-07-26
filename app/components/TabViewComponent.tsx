import React, { useState, useRef, useEffect, useCallback, useMemo, createContext } from 'react';
import {
    StyleSheet,
    View,
    Dimensions,
    TouchableOpacity,
    Text,
    PanResponder,
    FlatList,
    ScrollView,
    RefreshControl,
    Animated,
} from 'react-native';
import { TabView } from 'react-native-tab-view';
import { FlashList } from '@shopify/flash-list';

const windowWidth = Dimensions.get('window').width;
const TabBarHeight = 48;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const MAX_VIEWABLE_ITEMS = 1;

export const ViewabilityItemsContext = createContext([]);
export const ItemKeyContext = createContext(undefined);

const ViewabilityTracker = React.forwardRef(({ listType, onScroll: parentOnScroll, ...props }, ref) => {
    const [visibleItems, setVisibleItems] = useState([]);
    const { renderItem: originalRenderItem, onEndReached } = props;
    const hasScrolled = useRef(false);

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
        } else if (parentOnScroll && typeof parentOnScroll.onScroll === 'function') {
            parentOnScroll.onScroll(event);
        }
    }, [parentOnScroll]);

    const ListComponent = listType === 'FlatList' ? AnimatedFlatList :
        listType === 'FlashList' ? AnimatedFlashList :
            AnimatedScrollView;

    return (
        <ViewabilityItemsContext.Provider value={visibleItems}>
            <ListComponent
                {...props}
                ref={ref}
                renderItem={renderItem}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{
                    minimumViewTime: 10,
                    itemVisiblePercentThreshold: 100,
                }}
                onEndReached={handleEndReached}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            />
        </ViewabilityItemsContext.Provider>
    );
});

const TabViewComponent = React.memo(({
                                         tabs,
                                         HeaderComponent,
                                         headerHeightOnScroll,
                                         tabBarStyle,
                                         renderTabLabel,
                                         onTabChange,
                                         materialTopTabProps = {},
                                     }) => {
    const [index, setIndex] = useState(0);
    const [routes] = useState(tabs.map(tab => ({ key: tab.name, title: tab.label })));
    const scrollY = useRef(new Animated.Value(0)).current;
    const [headerHeight, setHeaderHeight] = useState(0);
    const [effectiveHeaderHeightOnScroll, setEffectiveHeaderHeightOnScroll] = useState(0);
    const tabViewRef = useRef(null);
    const listRefs = useRef({});

    const hasHeader = !!HeaderComponent || headerHeightOnScroll > 0;

    useEffect(() => {
        setEffectiveHeaderHeightOnScroll(Math.min(headerHeight, headerHeightOnScroll || 0));
    }, [headerHeight, headerHeightOnScroll]);

    const headerPanResponder = useMemo(() => PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
        onPanResponderMove: (_, gestureState) => {
            const activeList = listRefs.current[routes[index]?.key];
            activeList?.scrollToOffset({ offset: -gestureState.dy, animated: false });
        },
        onPanResponderRelease: (_, gestureState) => {
            const activeList = listRefs.current[routes[index]?.key];
            if (activeList && Math.abs(gestureState.vy) > 0.5) {
                Animated.decay(scrollY, {
                    velocity: -gestureState.vy,
                    useNativeDriver: true,
                }).start();
            }
        },
    }), [routes, index]);

    const headerTranslateY = useMemo(() => scrollY.interpolate({
        inputRange: [0, headerHeight - effectiveHeaderHeightOnScroll],
        outputRange: [0, -(headerHeight - effectiveHeaderHeightOnScroll)],
        extrapolate: 'clamp',
    }), [headerHeight, effectiveHeaderHeightOnScroll]);

    const tabBarTranslateY = useMemo(() => {
        if (!hasHeader) return 0;
        return scrollY.interpolate({
            inputRange: [0, headerHeight - effectiveHeaderHeightOnScroll],
            outputRange: [headerHeight, effectiveHeaderHeightOnScroll],
            extrapolate: 'clamp',
        });
    }, [headerHeight, effectiveHeaderHeightOnScroll, hasHeader]);

    const isTabSticky = useMemo(() => scrollY.interpolate({
        inputRange: [0, headerHeight - effectiveHeaderHeightOnScroll],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    }), [headerHeight, effectiveHeaderHeightOnScroll]);

    const renderHeader = useCallback(() => {
        if (!hasHeader) return null;
        return (
            <Animated.View
                {...headerPanResponder.panHandlers}
                onLayout={(event) => {
                    const height = event.nativeEvent.layout.height;
                    setHeaderHeight(height);
                }}
                style={[
                    styles.header,
                    {
                        height: HeaderComponent ? undefined : headerHeightOnScroll,
                        transform: [{ translateY: headerTranslateY }]
                    }
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
        );
    }, [headerPanResponder, headerTranslateY, HeaderComponent, headerHeightOnScroll, hasHeader, scrollY, isTabSticky, headerHeight, effectiveHeaderHeightOnScroll]);

    const renderTabBar = useCallback(() => {
        return (
            <Animated.View
                style={[
                    styles.tabBar,
                    tabBarStyle,
                    hasHeader ? { transform: [{ translateY: tabBarTranslateY }] } : null,
                    !hasHeader ? { top: 0 } : null
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
            </Animated.View>
        );
    }, [routes, index, tabBarStyle, tabBarTranslateY, hasHeader, renderTabLabel, onTabChange]);


    const renderScene = useCallback(({ route }) => {
        const tab = tabs.find(t => t.name === route.key);
        if (!tab) return null;

        const onScroll = Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
        );

        const refreshControl = (
            <RefreshControl
                refreshing={tab.refreshing}
                onRefresh={tab.onRefresh}
                progressViewOffset={hasHeader ? headerHeight : 0}
            />
        );

        const commonProps = {
            ref: (ref) => {
                if (ref) {
                    listRefs.current[route.key] = ref;
                }
            },
            contentContainerStyle: {
                paddingTop: hasHeader ? headerHeight + TabBarHeight : TabBarHeight,
                minHeight: Dimensions.get('window').height,
            },
            scrollEventThrottle: 16,
            refreshControl: refreshControl,
            onScroll: onScroll,  // Pass the Animated.event object directly
        };

        if (tab.listType === 'ScrollView') {
            return (
                <AnimatedScrollView {...commonProps}>
                    {tab.component}
                </AnimatedScrollView>
            );
        }

        return (
            <ViewabilityTracker
                {...commonProps}
                listType={tab.listType}
                data={tab.data}
                renderItem={tab.renderItem}
                keyExtractor={tab.keyExtractor}
                onEndReached={tab.onEndReached}
                onEndReachedThreshold={0.5}
                estimatedItemSize={tab.estimatedItemSize}
            />
        );
    }, [tabs, headerHeight, scrollY, hasHeader]);



    return (
        <View style={styles.container}>
            {renderHeader()}
            {renderTabBar()}
            <TabView
                {...materialTopTabProps}
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={(i) => {
                    setIndex(i);
                    onTabChange?.(i);
                    materialTopTabProps.onIndexChange?.(i);
                }}
                renderTabBar={() => null}
                initialLayout={{ width: windowWidth }}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'blue',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1,
        backgroundColor: 'transparent',
    },
    tabBar: {
        backgroundColor: 'white',
        height: TabBarHeight,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        zIndex: 1,
    },
    tabScroll: {
        height: TabBarHeight,
    },
    tabScrollContent: {
        flexDirection: 'row',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 15,
        height: TabBarHeight,
    },
    tabItemActive: {
        borderBottomWidth: 2,
        borderBottomColor: 'black',
    },
    tabText: {
        fontSize: 16,
        color: 'gray',
    },
    tabTextActive: {
        color: 'black',
    },
});

export default TabViewComponent;

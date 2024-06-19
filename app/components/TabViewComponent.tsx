import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    Animated,
    PanResponder,
    Platform,
    StatusBar,
} from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';

const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;
const TabBarHeight = 48;
const HeaderHeight = 300;
const SafeStatusBar = Platform.select({
    ios: 44,
    android: StatusBar.currentHeight,
});

const TabViewComponent = ({ tabs, HeaderComponent }) => {
    const [tabIndex, setIndex] = useState(0);
    const [routes] = useState(tabs.map(tab => ({ key: tab.name, title: tab.label })));
    const scrollY = useRef(new Animated.Value(0)).current;
    const headerScrollY = useRef(new Animated.Value(0)).current;
    const listRefArr = useRef([]);
    const listOffset = useRef({});
    const isListGliding = useRef(false);
    const headerScrollStart = useRef(0);
    const _tabIndex = useRef(0);

    const headerPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponderCapture: () => false,
            onMoveShouldSetPanResponderCapture: () => false,
            onStartShouldSetPanResponder: () => {
                headerScrollY.stopAnimation();
                syncScrollOffset();
                return false;
            },
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                headerScrollY.stopAnimation();
                return Math.abs(gestureState.dy) > 5;
            },
            onPanResponderRelease: (evt, gestureState) => {
                syncScrollOffset();
                if (Math.abs(gestureState.vy) < 0.2) return;
                headerScrollY.setValue(scrollY._value);
                Animated.decay(headerScrollY, {
                    velocity: -gestureState.vy,
                    useNativeDriver: true,
                }).start(() => syncScrollOffset());
            },
            onPanResponderMove: (evt, gestureState) => {
                listRefArr.current.forEach((item) => {
                    if (item.key !== routes[_tabIndex.current].key) return;
                    if (item.value) {
                        item.value.scrollToOffset({
                            offset: -gestureState.dy + headerScrollStart.current,
                            animated: false,
                        });
                    }
                });
            },
            onShouldBlockNativeResponder: () => true,
            onPanResponderGrant: (evt, gestureState) => {
                headerScrollStart.current = scrollY._value;
            },
        })
    ).current;

    useEffect(() => {
        scrollY.addListener(({ value }) => {
            const curRoute = routes[tabIndex].key;
            listOffset.current[curRoute] = value;
        });

        headerScrollY.addListener(({ value }) => {
            listRefArr.current.forEach((item) => {
                if (item.key !== routes[tabIndex].key) return;
                if (value > HeaderHeight || value < 0) {
                    headerScrollY.stopAnimation();
                    syncScrollOffset();
                }
                if (item.value && value <= HeaderHeight) {
                    item.value.scrollToOffset({
                        offset: value,
                        animated: false,
                    });
                }
            });
        });
        return () => {
            scrollY.removeAllListeners();
            headerScrollY.removeAllListeners();
        };
    }, [routes, tabIndex]);

    const syncScrollOffset = () => {
        const curRouteKey = routes[_tabIndex.current].key;
        listRefArr.current.forEach((item) => {
            if (item.key !== curRouteKey) {
                if (scrollY._value < HeaderHeight && scrollY._value >= 0) {
                    if (item.value) {
                        item.value.scrollToOffset({
                            offset: scrollY._value,
                            animated: false,
                        });
                        listOffset.current[item.key] = scrollY._value;
                    }
                } else if (scrollY._value >= HeaderHeight) {
                    if (
                        listOffset.current[item.key] < HeaderHeight ||
                        listOffset.current[item.key] == null
                    ) {
                        if (item.value) {
                            item.value.scrollToOffset({
                                offset: HeaderHeight,
                                animated: false,
                            });
                            listOffset.current[item.key] = HeaderHeight;
                        }
                    }
                }
            }
        });
    };

    const onMomentumScrollBegin = () => {
        isListGliding.current = true;
    };

    const onMomentumScrollEnd = () => {
        isListGliding.current = false;
        syncScrollOffset();
    };

    const onScrollEndDrag = () => {
        syncScrollOffset();
    };

    const renderHeader = () => {
        const y = scrollY.interpolate({
            inputRange: [0, HeaderHeight],
            outputRange: [0, -HeaderHeight],
            extrapolate: 'clamp',
        });
        return (
            <Animated.View
                {...headerPanResponder.panHandlers}
                style={[styles.header, { transform: [{ translateY: y }] }]}>
                <View style={{ height: HeaderHeight, justifyContent: 'center', alignItems: 'center' }}>
                    {HeaderComponent ? <HeaderComponent /> : <Text style={{ fontSize: 24 }}>Header</Text>}
                </View>
            </Animated.View>
        );
    };

    const renderScene = ({ route }) => {
        const tab = tabs.find(t => t.name === route.key);
        return (
            <Animated.ScrollView
                contentContainerStyle={{ paddingTop: HeaderHeight + TabBarHeight }}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={
                    Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )
                }
                {...headerPanResponder.panHandlers}
            >
                {tab.component}
            </Animated.ScrollView>
        );
    };

    const renderLabel = ({ route, focused }) => (
        <Text style={[styles.label, { opacity: focused ? 1 : 0.5 }]}>
            {route.title}
        </Text>
    );

    const renderTabBar = (props) => {
        const y = scrollY.interpolate({
            inputRange: [0, HeaderHeight],
            outputRange: [HeaderHeight, 0],
            extrapolate: 'clamp',
        });
        return (
            <Animated.View
                style={{
                    top: 0,
                    zIndex: 1,
                    position: 'absolute',
                    transform: [{ translateY: y }],
                    width: '100%',
                }}>
                <TabBar
                    {...props}
                    onTabPress={({ route, preventDefault }) => {
                        if (isListGliding.current) preventDefault();
                    }}
                    style={styles.tab}
                    renderLabel={renderLabel}
                    indicatorStyle={styles.indicator}
                    scrollEnabled
                />
            </Animated.View>
        );
    };

    const renderTabView = () => (
        <TabView
            onSwipeStart={() => { }}
            onSwipeEnd={() => { }}
            onIndexChange={(id) => {
                _tabIndex.current = id;
                setIndex(id);
            }}
            navigationState={{ index: tabIndex, routes }}
            renderScene={renderScene}
            renderTabBar={renderTabBar}
            initialLayout={{ height: 0, width: windowWidth }}
        />
    );

    return (
        <View style={styles.container}>
            {renderTabView()}
            {renderHeader()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: HeaderHeight,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        backgroundColor: '#FFF',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1,
    },
    label: { fontSize: 16, color: 'black' },
    tab: {
        elevation: 0,
        shadowOpacity: 0,
        backgroundColor: 'peachpuff',
        height: TabBarHeight,
    },
    indicator: { backgroundColor: 'black' },
});

export default TabViewComponent;

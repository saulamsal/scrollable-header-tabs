import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Dimensions, Animated, PanResponder, Text, FlatList,
    Platform, StatusBar
 } from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import Header from './Header';


const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;
const TabBarHeight = 48;
const HeaderHeight = 300;
const SafeStatusBar = Platform.select({
    ios: 44,
    android: StatusBar.currentHeight,
});
const tab1ItemSize = (windowWidth - 30) / 2;
const tab2ItemSize = (windowWidth - 40) / 3;

const TabViewComponent = () => {
    const [tabIndex, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'tab1', title: 'Tab1' },
        { key: 'tab2', title: 'Tab2' },
    ]);
    const [canScroll, setCanScroll] = useState(true);
    const [tab1Data] = useState(Array(40).fill(0));
    const [tab2Data] = useState(Array(30).fill(0));
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

    const listPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponderCapture: () => false,
            onMoveShouldSetPanResponderCapture: () => false,
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: () => {
                headerScrollY.stopAnimation();
                return false;
            },
            onShouldBlockNativeResponder: () => true,
            onPanResponderGrant: () => {
                headerScrollY.stopAnimation();
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

    const renderTab1Item = ({ item, index }) => (
        <View
            style={{
                borderRadius: 16,
                marginLeft: index % 2 === 0 ? 0 : 10,
                width: tab1ItemSize,
                height: tab1ItemSize,
                backgroundColor: '#aaa',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
            <Text>{index}</Text>
        </View>
    );

    const renderTab2Item = ({ item, index }) => (
        <View
            style={{
                marginLeft: index % 3 === 0 ? 0 : 10,
                borderRadius: 16,
                width: tab2ItemSize,
                height: tab2ItemSize,
                backgroundColor: '#aaa',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
            <Text>{index}</Text>
        </View>
    );

    const renderLabel = ({ route, focused }) => (
        <Text style={[styles.label, { opacity: focused ? 1 : 0.5 }]}>
            {route.title}
        </Text>
    );

    const renderScene = ({ route }) => {
        const focused = route.key === routes[tabIndex].key;
        let numCols;
        let data;
        let renderItem;
        switch (route.key) {
            case 'tab1':
                numCols = 2;
                data = tab1Data;
                renderItem = renderTab1Item;
                break;
            case 'tab2':
                numCols = 3;
                data = tab2Data;
                renderItem = renderTab2Item;
                break;
            default:
                return null;
        }
        return (
            <Animated.FlatList
                {...listPanResponder.panHandlers}
                numColumns={numCols}
                ref={(ref) => {
                    if (ref) {
                        const found = listRefArr.current.find((e) => e.key === route.key);
                        if (!found) {
                            listRefArr.current.push({
                                key: route.key,
                                value: ref,
                            });
                        }
                    }
                }}
                scrollEventThrottle={16}
                onScroll={
                    focused
                        ? Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: true }
                        )
                        : null
                }
                onMomentumScrollBegin={onMomentumScrollBegin}
                onScrollEndDrag={onScrollEndDrag}
                onMomentumScrollEnd={onMomentumScrollEnd}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                ListHeaderComponent={() => <View style={{ height: 10 }} />}
                contentContainerStyle={{
                    paddingTop: HeaderHeight + TabBarHeight,
                    paddingHorizontal: 10,
                    minHeight: windowHeight - SafeStatusBar + HeaderHeight,
                }}
                showsHorizontalScrollIndicator={false}
                data={data}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
            />
        );
    };

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
                />
            </Animated.View>
        );
    };

    const renderTabView = () => (
        <TabView
            onSwipeStart={() => setCanScroll(false)}
            onSwipeEnd={() => setCanScroll(true)}
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
            <Header scrollY={scrollY} headerPanResponder={headerPanResponder} HeaderHeight={HeaderHeight} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    label: { fontSize: 16, color: '#222' },
    tab: { elevation: 0, shadowOpacity: 0, backgroundColor: '#FFCC80', height: TabBarHeight },
    indicator: { backgroundColor: '#222' },
});

export default TabViewComponent;

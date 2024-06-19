import { useState, useRef, useEffect } from 'react';
import { Animated, PanResponder, Platform, StatusBar, Dimensions } from 'react-native';

const windowHeight = Dimensions.get('window').height;
const SafeStatusBar = Platform.select({
    ios: 44,
    android: StatusBar.currentHeight,
});

const useScrollableHeader = ({ routes, minHeaderHeightOnCollapse, refreshAction }) => {
    const [tabIndex, setIndex] = useState(0);
    const [canScroll, setCanScroll] = useState(true);
    const scrollY = useRef(new Animated.Value(0)).current;
    const headerScrollY = useRef(new Animated.Value(0)).current;
    const headerMoveScrollY = useRef(new Animated.Value(0)).current;
    const listRefArr = useRef([]);
    const listOffset = useRef({});
    const isListGliding = useRef(false);
    const headerScrollStart = useRef(0);
    const _tabIndex = useRef(0);
    const refreshStatusRef = useRef(false);

    const syncScrollOffset = (HeaderHeight) => {
        const curRouteKey = routes[_tabIndex.current].key;
        listRefArr.current.forEach((item) => {
            if (item.key !== curRouteKey) {
                if (scrollY._value < HeaderHeight && scrollY._value >= minHeaderHeightOnCollapse) {
                    if (item.value) {
                        item.value.scrollToOffset({ offset: scrollY._value, animated: false });
                        listOffset.current[item.key] = scrollY._value;
                    }
                } else if (scrollY._value >= HeaderHeight) {
                    if (listOffset.current[item.key] < HeaderHeight || listOffset.current[item.key] == null) {
                        if (item.value) {
                            item.value.scrollToOffset({ offset: HeaderHeight, animated: false });
                            listOffset.current[item.key] = HeaderHeight;
                        }
                    }
                }
            }
        });
    };

    const headerPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponderCapture: () => false,
            onMoveShouldSetPanResponderCapture: () => false,
            onStartShouldSetPanResponder: () => {
                headerScrollY.stopAnimation();
                syncScrollOffset();
                return false;
            },
            onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dy) > 5,
            onPanResponderEnd: (evt, gestureState) => handlePanReleaseOrEnd(evt, gestureState),
            onPanResponderMove: (evt, gestureState) => handlePanMove(evt, gestureState),
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
            onMoveShouldSetPanResponder: () => false,
            onShouldBlockNativeResponder: () => true,
            onPanResponderGrant: () => headerScrollY.stopAnimation(),
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
                if (value > HeaderHeight || value < minHeaderHeightOnCollapse) {
                    headerScrollY.stopAnimation();
                    syncScrollOffset();
                }
                if (item.value && value <= HeaderHeight && value >= minHeaderHeightOnCollapse) {
                    item.value.scrollToOffset({ offset: value, animated: false });
                }
            });
        });

        return () => {
            scrollY.removeAllListeners();
            headerScrollY.removeAllListeners();
        };
    }, [routes, tabIndex]);

    const handlePanReleaseOrEnd = (evt, gestureState) => {
        syncScrollOffset();
        headerScrollY.setValue(scrollY._value);
        if (Platform.OS === 'ios') {
            if (scrollY._value < 0) {
                if (scrollY._value < -150 && !refreshStatusRef.current) {
                    startRefreshAction();
                } else {
                    listRefArr.current.forEach((listRef) => {
                        listRef.value.scrollToOffset({ offset: 0, animated: true });
                    });
                }
            } else if (Math.abs(gestureState.vy) >= 0.2) {
                Animated.decay(headerScrollY, {
                    velocity: -gestureState.vy,
                    useNativeDriver: true,
                }).start(() => syncScrollOffset());
            }
        } else if (Platform.OS === 'android' && headerMoveScrollY._value < 0 && headerMoveScrollY._value / 1.5 < -150) {
            startRefreshAction();
        } else {
            Animated.timing(headerMoveScrollY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    };

    const handlePanMove = (evt, gestureState) => {
        const curListRef = listRefArr.current.find(ref => ref.key === routes[_tabIndex.current].key);
        const headerScrollOffset = -gestureState.dy + headerScrollStart.current;
        if (curListRef?.value) {
            if (headerScrollOffset > minHeaderHeightOnCollapse) {
                curListRef.value.scrollToOffset({ offset: headerScrollOffset, animated: false });
            } else if (Platform.OS === 'ios') {
                curListRef.value.scrollToOffset({ offset: headerScrollOffset / 3, animated: false });
            } else if (Platform.OS === 'android' && !refreshStatusRef.current) {
                headerMoveScrollY.setValue(headerScrollOffset / 1.5);
            }
        }
    };

    const startRefreshAction = () => {
        if (Platform.OS === 'ios') {
            listRefArr.current.forEach((listRef) => {
                listRef.value.scrollToOffset({ offset: -50, animated: true });
            });
            refreshAction().finally(() => {
                syncScrollOffset();
                if (scrollY._value < 0) {
                    listRefArr.current.forEach((listRef) => {
                        listRef.value.scrollToOffset({ offset: 0, animated: true });
                    });
                }
            });
        } else if (Platform.OS === 'android') {
            Animated.timing(headerMoveScrollY, {
                toValue: -150,
                duration: 300,
                useNativeDriver: true,
            }).start(() => refreshAction().finally(() => {
                Animated.timing(headerMoveScrollY, { toValue: 0, duration: 300, useNativeDriver: true }).start();
            }));
        }
    };

    return {
        tabIndex,
        setIndex,
        canScroll,
        setCanScroll,
        scrollY,
        headerScrollY,
        headerMoveScrollY,
        listRefArr,
        listPanResponder,
        headerPanResponder,
        isListGliding,
        syncScrollOffset,
        startRefreshAction,
    };
};

export default useScrollableHeader;

import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Dimensions,
    Animated,
    TouchableOpacity,
    Text,
    PanResponder,
} from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';

const windowWidth = Dimensions.get('window').width;
const TabBarHeight = 48;

const TabViewComponent = ({ tabs, HeaderComponent, headerHeightOnScroll = 200 }) => {
    const [index, setIndex] = useState(0);
    const [routes] = useState(tabs.map(tab => ({ key: tab.name, title: tab.label })));
    const scrollY = useRef(new Animated.Value(0)).current;
    const [headerHeight, setHeaderHeight] = useState(headerHeightOnScroll);
    const tabViewRef = useRef(null);
    const scrollViewRefs = useRef({});

    const headerPanResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
            return Math.abs(gestureState.dy) > 5;
        },
        onPanResponderMove: (_, gestureState) => {
            const activeScrollView = scrollViewRefs.current[routes[index].key];
            if (activeScrollView) {
                activeScrollView.scrollTo({
                    y: -gestureState.dy,
                    animated: false,
                });
            }
        },
        onPanResponderRelease: (_, gestureState) => {
            const activeScrollView = scrollViewRefs.current[routes[index].key];
            if (activeScrollView) {
                if (Math.abs(gestureState.vy) > 0.5) {
                    Animated.decay(scrollY, {
                        velocity: -gestureState.vy,
                        useNativeDriver: true,
                    }).start();
                }
            }
        },
    });

    const headerTranslateY = scrollY.interpolate({
        inputRange: [0, Math.max(headerHeight - headerHeightOnScroll, 0)],
        outputRange: [0, -Math.max(headerHeight - headerHeightOnScroll, 0)],
        extrapolate: 'clamp',
    });

    const tabBarTranslateY = scrollY.interpolate({
        inputRange: [0, Math.max(headerHeight - headerHeightOnScroll, 0)],
        outputRange: [headerHeight, headerHeightOnScroll],
        extrapolate: 'clamp',
    });

    const renderHeader = () => (
        <Animated.View
            {...headerPanResponder.panHandlers}
            onLayout={(event) => {
                const height = event.nativeEvent.layout.height;
                setHeaderHeight(Math.max(height, headerHeightOnScroll));
            }}
            style={[
                styles.header,
                { transform: [{ translateY: headerTranslateY }] }
            ]}
        >
            {HeaderComponent ? <HeaderComponent /> : <Text>Header</Text>}
        </Animated.View>
    );

    const renderTabBar = () => (
        <Animated.View
            style={[
                styles.tabBar,
                { transform: [{ translateY: tabBarTranslateY }] }
            ]}
        >
            {routes.map((route, i) => (
                <TouchableOpacity
                    key={route.key}
                    style={[styles.tabItem, index === i && styles.tabItemActive]}
                    onPress={() => setIndex(i)}
                >
                    <Text style={[styles.tabText, index === i && styles.tabTextActive]}>
                        {route.title}
                    </Text>
                </TouchableOpacity>
            ))}
        </Animated.View>
    );

    const renderScene = SceneMap(
        tabs.reduce((acc, tab) => {
            acc[tab.name] = () => (
                <Animated.ScrollView
                    ref={(ref) => {
                        if (ref) {
                            scrollViewRefs.current[tab.name] = ref;
                        }
                    }}
                    contentContainerStyle={{
                        paddingTop: headerHeight + TabBarHeight,
                        minHeight: Dimensions.get('window').height,
                    }}
                    scrollEventThrottle={16}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )}
                >
                    {tab.component}
                </Animated.ScrollView>
            );
            return acc;
        }, {})
    );

    return (
        <View style={styles.container}>
            {renderHeader()}
            {renderTabBar()}
            <TabView
                ref={tabViewRef}
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width: windowWidth }}
                renderTabBar={() => null}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1,
        backgroundColor: 'red',
    },
    tabBar: {
        flexDirection: 'row',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1,
        backgroundColor: 'peachpuff',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
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
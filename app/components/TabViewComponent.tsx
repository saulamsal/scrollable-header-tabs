import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, FlatList } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolate,
    runOnJS,
    useAnimatedRef,
    useAnimatedProps,
    scrollTo,
} from 'react-native-reanimated';

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TabViewComponent = ({ tabs, HeaderComponent, headerHeight, tabBarHeight }) => {
    const [activeTab, setActiveTab] = useState(0);
    const scrollY = useSharedValue(0);
    const scrollX = useSharedValue(0);
    const flatListRef = useRef(null);
    const flashListRef = useAnimatedRef();

    const headerAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: interpolate(
                        scrollY.value,
                        [0, headerHeight],
                        [0, -headerHeight],
                        Extrapolate.CLAMP
                    ),
                },
            ],
        };
    });

    const tabBarAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: interpolate(
                        scrollY.value,
                        [0, headerHeight],
                        [headerHeight, 0],
                        Extrapolate.CLAMP
                    ),
                },
            ],
        };
    });

    const onScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const onTabPress = useCallback((index) => {
        setActiveTab(index);
        flatListRef.current?.scrollToOffset({
            offset: index * SCREEN_WIDTH,
            animated: true,
        });
    }, []);

    const renderTab = useCallback(({ item, index }) => {
        if (item.listType === 'FlashList') {
            return (
                <View style={{ width: SCREEN_WIDTH, height: '100%' }}>
                    <AnimatedFlashList
                        ref={flashListRef}
                        data={item.data}
                        renderItem={item.renderItem}
                        keyExtractor={item.keyExtractor}
                        onEndReached={item.onEndReached}
                        onEndReachedThreshold={0.5}
                        estimatedItemSize={item.estimatedItemSize}
                        contentContainerStyle={{
                            paddingTop: headerHeight + tabBarHeight,
                            minHeight: Dimensions.get('window').height + headerHeight,
                        }}
                        onScroll={(event) => {
                            const offsetY = event.nativeEvent.contentOffset.y;
                            scrollY.value = offsetY;
                        }}
                        scrollEventThrottle={16}
                    />
                </View>
            );
        } else {
            return (
                <View style={{ width: SCREEN_WIDTH, height: '100%' }}>
                    <AnimatedFlatList
                        data={item.data}
                        renderItem={item.renderItem}
                        keyExtractor={item.keyExtractor}
                        onEndReached={item.onEndReached}
                        onEndReachedThreshold={0.5}
                        contentContainerStyle={{
                            paddingTop: headerHeight + tabBarHeight,
                            minHeight: Dimensions.get('window').height + headerHeight,
                        }}
                        onScroll={onScroll}
                        scrollEventThrottle={16}
                    />
                </View>
            );
        }
    }, [headerHeight, tabBarHeight, onScroll, flashListRef]);

    const onHorizontalScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
            const tabIndex = Math.round(event.contentOffset.x / SCREEN_WIDTH);
            runOnJS(setActiveTab)(tabIndex);
        },
    });

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.header, headerAnimatedStyle]}>
                <HeaderComponent />
            </Animated.View>
            <Animated.View style={[styles.tabBar, tabBarAnimatedStyle]}>
                {tabs.map((tab, index) => (
                    <TouchableOpacity
                        key={tab.name}
                        style={[styles.tab, activeTab === index && styles.activeTab]}
                        onPress={() => onTabPress(index)}
                    >
                        <Text style={[styles.tabText, activeTab === index && styles.activeTabText]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </Animated.View>
            <Animated.FlatList
                ref={flatListRef}
                data={tabs}
                renderItem={renderTab}
                keyExtractor={(item) => item.name}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onHorizontalScroll}
                scrollEventThrottle={16}
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
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: 'black',
    },
    tabText: {
        fontSize: 16,
        color: 'gray',
    },
    activeTabText: {
        color: 'black',
    },
});

export default TabViewComponent;
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import TabViewComponent from './components/TabViewComponent';
import { FlashList } from '@shopify/flash-list';

const PostComponent = () => (
    <View>
        {Array(100).fill(0).map((_, i) => (
            <View key={i} style={{ padding: 20 }}>
                <Text>Post {i}</Text>
            </View>
        ))}
    </View>
);

const FollowingComponent = () => {
    const items = Array.from({ length: 100 }, (_, index) => index + 1);

    return (
        <FlashList
            data={items}
            renderItem={({ item }) => (
                <View style={{ padding: 20 }}>
                    <Text>Following Content {item}</Text>
                </View>
            )}
            estimatedItemSize={50}
            keyExtractor={(item) => item.toString()}
        />
    );
};

const RandomComponent = ({ name }) => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{name} Content</Text>
    </View>
);

const App = () => {
    const [tabs, setTabs] = useState([
        { name: 'Posts', label: 'Posts', component: <PostComponent /> },
        { name: 'Following', label: 'Following', component: <FollowingComponent /> },
    ]);
    const [key, setKey] = useState(0);

    const addRandomTab = useCallback(() => {
        const randomTabs = ['Photos', 'Videos', 'Music', 'Books', 'Games', 'Movies', 'TV Shows', 'Sports'];
        const randomIndex = Math.floor(Math.random() * randomTabs.length);
        const newTabName = randomTabs[randomIndex];

        setTabs(prevTabs => [
            ...prevTabs,
            {
                name: newTabName,
                label: newTabName,
                component: <RandomComponent name={newTabName} />
            }
        ]);
    }, []);

    const removeLastTab = useCallback(() => {
        if (tabs.length > 1) {
            setTabs(prevTabs => prevTabs.slice(0, -1));
        } else {
            alert('Cannot remove the last tab');
        }
    }, [tabs]);

    useEffect(() => {
        setKey(prevKey => prevKey + 1);
    }, [tabs]);

    const SomeHeaderComponent = ({ scrollY, headerHeight, effectiveHeaderHeightOnScroll }) => {
        const contentTranslateY = scrollY.interpolate({
            inputRange: [0, headerHeight - effectiveHeaderHeightOnScroll],
            outputRange: [0, -(headerHeight - effectiveHeaderHeightOnScroll)],
            extrapolate: 'clamp',
        });

        const buttonsOpacity = scrollY.interpolate({
            inputRange: [0, (headerHeight - effectiveHeaderHeightOnScroll) / 2],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        });

        return (
            <View style={styles.headerContainer}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Header</Text>
                </View>
                <Animated.View style={[
                    styles.contentContainer,
                    { transform: [{ translateY: contentTranslateY }] }
                ]}>
                    <Animated.View style={[styles.buttonsContainer, { opacity: buttonsOpacity }]}>
                        <TouchableOpacity onPress={addRandomTab} style={styles.button}>
                            <Text>Add Random Tab</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={removeLastTab} style={styles.button}>
                            <Text>Remove Last Tab</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            </View>
        );
    };

    return (
        <TabViewComponent
            key={key}
            tabs={tabs}
            HeaderComponent={SomeHeaderComponent}
            headerHeightOnScroll={80}
            materialTopTabProps={{
                lazy: true,
                lazyPreloadDistance: 2,
                tabBarScrollEnabled: true,
                tabStyle: { width: 'auto' },
                labelStyle: { fontSize: 14, color: 'black' },
            }}
        />
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: 'red',
        width: '100%',
    },
    titleContainer: {
        height: 80,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontWeight: '500',
        fontSize: 28,
        color: 'white',
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    buttonsContainer: {
        marginTop: 10,
    },
    button: {
        backgroundColor: 'white',
        padding: 10,
        marginBottom: 10,
    },
});

export default App;
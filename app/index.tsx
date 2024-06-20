import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
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
    const items = Array.from({ length: 1000 }, (_, index) => index + 1);

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

    const addRandomTab = () => {
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
    };

    const removeLastTab = () => {
        if (tabs.length > 1) {
            setTabs(prevTabs => prevTabs.slice(0, -1));
        } else {
            alert('Cannot remove the last tab');
        }
    };

    const SomeHeaderComponent = () => (
        <View style={{ backgroundColor: 'red', padding: 40, width: '100%' }}>
            <TouchableOpacity
                onPress={addRandomTab}
                style={{ backgroundColor: 'white', padding: 10, marginBottom: 10 }}
            >
                <Text>Add Random Tab</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={removeLastTab}
                style={{ backgroundColor: 'white', padding: 10 }}
            >
                <Text>Remove Last Tab</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <TabViewComponent
            tabs={tabs}
            HeaderComponent={SomeHeaderComponent}
            headerHeightOnScroll={100}
        />
    );
};

export default App;
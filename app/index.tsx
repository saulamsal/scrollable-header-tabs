import React from 'react';
import { View, Text } from 'react-native';
import TabViewComponent from './components/TabViewComponent';
import { FlashList } from '@shopify/flash-list';

const PostComponent = () => {
    return (
        Array(100).fill(0).map((_, i) => (
            <View key={i}>
                <Text>Post {i}</Text>
            </View>
        ))
    );
};


const FollowingComponent = () => {
    const items = Array.from({ length: 1000 }, (_, index) => index + 1);

    return (
        <FlashList
            data={items}
            renderItem={({ item }) => (
                <View>
                    <Text>Following Content {item}</Text>
                </View>
            )}
            estimatedItemSize={50} // Adjust the size based on your item height
            keyExtractor={(item) => item.toString()}
        />
    );
};


const SomeHeaderComponent = () => (
    <View>
        <Text>Custom Header</Text>
    </View>
);

const App = () => (
    <TabViewComponent
        tabs={[
            { name: 'Posts', label: 'Posts', component: <PostComponent /> },
            { name: 'Following', label: 'Following', component: <FollowingComponent /> },
        ]}
        headerComponent={SomeHeaderComponent}
    />
);

export default App;

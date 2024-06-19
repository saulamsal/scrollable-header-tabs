import React from 'react';
import { View, Text, Animated } from 'react-native';

const Header = ({ scrollY, headerPanResponder, HeaderHeight, headerComponent: HeaderComponent }) => {
    const headerTranslate = scrollY.interpolate({
        inputRange: [0, HeaderHeight],
        outputRange: [0, -HeaderHeight],
        extrapolate: 'clamp',
    });

    return (
        <Animated.View
            {...headerPanResponder.panHandlers}
            style={{
                height: HeaderHeight,
                transform: [{ translateY: headerTranslate }],
                backgroundColor: '#FFF',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1,
            }}>
            <View style={{ height: HeaderHeight, justifyContent: 'center', alignItems: 'center' }}>
                {HeaderComponent ? <HeaderComponent /> : <Text style={{ fontSize: 24 }}>Header</Text>}
            </View>
        </Animated.View>
    );
};

export default Header;

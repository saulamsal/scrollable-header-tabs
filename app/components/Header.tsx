import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Animated } from 'react-native';

const Header = ({ scrollY, headerPanResponder, HeaderHeight }) => {
    const y = scrollY.interpolate({
        inputRange: [0, HeaderHeight],
        outputRange: [0, -HeaderHeight],
        extrapolate: 'clamp',
    });
    return (
        <Animated.View
            {...headerPanResponder.panHandlers}
            style={[styles.header, {height: HeaderHeight, transform: [{ translateY: y }] }]}>
            <TouchableOpacity
                style={{ flex: 1, justifyContent: 'center' }}
                activeOpacity={1}
                onPress={() => Alert.alert('header Clicked!')}>
                <Text>Scrollable Header</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    header: {
     
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        backgroundColor: '#40FFC4',
    },
});

export default Header;

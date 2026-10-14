import { Animated, Easing } from 'react-native';
import React, { useEffect, useRef } from 'react';

export const WavingHand = () => {
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 300,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(rotateAnim, {
                    toValue: -1,
                    duration: 300,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(rotateAnim, {
                    toValue: 0,
                    duration: 200,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ]),
            { iterations: 4 } // 3-4 times wave
        ).start();
    }, []);

    const rotate = rotateAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-20deg', '0deg', '20deg'],
    });

    return (
        <Animated.Text style={{ transform: [{ rotate }], fontSize: 18 }}>
            👋
        </Animated.Text>
    );
};

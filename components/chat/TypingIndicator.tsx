import React, {useEffect, useRef} from "react";
import {Animated, Easing, View} from "react-native";

export const TypingIndicator = ({color = ""}) => {

    const animations = [
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
    ];

    useEffect(() => {
        const animateDots = () => {
            const animationSequence = animations.map((anim, index) => {
                return Animated.sequence([
                    Animated.delay(index * 200),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                        easing: Easing.ease,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                        easing: Easing.ease,
                    }),
                ]);
            });

            Animated.loop(
                Animated.stagger(150, animationSequence)
            ).start();
        };

        animateDots();

        return () => {
            animations.forEach(anim => anim.stopAnimation());
        };
    }, []);

    return (
        <View style={{flexDirection: 'row', padding: 4}}>
            {animations.map((anim, index) => (
                <Animated.View
                    key={index}
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: 4,
                        backgroundColor: color !== "" ? color : '#FFF',
                        marginHorizontal: 2,
                        opacity: 0.6,
                        transform: [
                            {
                                translateY: anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -6],
                                }),
                            },
                        ],
                    }}
                />
            ))}
        </View>
    );
};
import React, {useEffect, useRef} from 'react';
import {Animated, Easing, View} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';


type SuccessAnimationProps = {
    visible: boolean;
    onClose: () => void;
};

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({visible, onClose}) => {

    const scaleValue = useRef(new Animated.Value(0)).current;
    const opacityValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Reset values
            scaleValue.setValue(0);
            opacityValue.setValue(0);

            // Animate in
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(scaleValue, {
                        toValue: 1.2,
                        duration: 300,
                        easing: Easing.out(Easing.exp),
                        useNativeDriver: true
                    }),
                    Animated.timing(scaleValue, {
                        toValue: 1,
                        duration: 200,
                        easing: Easing.out(Easing.exp),
                        useNativeDriver: true
                    })
                ]),
                Animated.timing(opacityValue, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.out(Easing.exp),
                    useNativeDriver: true
                })
            ]).start();

            // Auto close with fade out
            const timer = setTimeout(() => {
                Animated.timing(opacityValue, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true
                }).start(() => {
                    if (onClose) {
                        onClose()
                    }
                });
            }, 1500);

            return () => clearTimeout(timer);
        } else {
            scaleValue.setValue(0);
            opacityValue.setValue(0);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <View style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)'
        }}>
            <Animated.View
                style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: "#4CAF50",
                    justifyContent: 'center',
                    alignItems: 'center',
                    transform: [{scale: scaleValue}],
                    opacity: opacityValue
                }}
            >
                <MaterialIcons name="check" size={60} color="white"/>
            </Animated.View>
        </View>
    );
};
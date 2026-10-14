import * as React from "react";
import { Pressable, View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface CustomSwitchProps {
  size?: number;
  onPress: () => void;
  isActive: boolean;
  disabled?: boolean;
}

const SIZE = 30;
const TRACK_SIZE = SIZE * 1.2;
const TRACK_HEIGHT = SIZE * 0.4;
const transitionConfig = {
  duration: 300,
  easing: Easing.inOut(Easing.ease),
};

const CustomSwitch: React.FC<CustomSwitchProps> = ({
  size = SIZE,
  onPress,
  isActive,
  disabled = false,
}) => {
  const translateX = useSharedValue<number>(
    isActive ? TRACK_SIZE / 4 : -TRACK_SIZE / 4
  );
  const trackColor = useSharedValue<string>(isActive ? "#2C2C2C" : "#DCDCDC");
  const knobColor = useSharedValue<string>(isActive ? "#FF0000" : "#FFFFFF");

  React.useEffect(() => {
    translateX.value = withTiming(
      isActive ? TRACK_SIZE / 4 : -TRACK_SIZE / 4,
      transitionConfig
    );
    trackColor.value = withTiming(
      isActive ? "#F0E5D1" : "#F0E5D1",
      transitionConfig
    );
    knobColor.value = withTiming(
      isActive ? "#DD8550" : "#B9B9B9",
      transitionConfig
    );
  }, [isActive]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: trackColor.value,
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    backgroundColor: knobColor.value,
  }));

  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <View style={styles.container}>
        <Animated.View style={[styles.track, trackStyle]} />
        <Animated.View style={[styles.knob, knobStyle]}></Animated.View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  track: {
    position: "absolute",
    width: TRACK_SIZE,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT,
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: SIZE,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    height: SIZE * 0.6,
    borderRadius: SIZE * 0.6,
    borderWidth: SIZE * 0.1,
  },
});

export default CustomSwitch;

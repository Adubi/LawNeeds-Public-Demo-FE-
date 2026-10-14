import { StyleSheet, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import React from 'react';

export const HapticTab = ({
  onPress,
  children,
  accessibilityState,
  style,
  ...props
}: any) => {
  const lastTap = useRef<number | null>(null);

  const handleDoubleTap = (e: any) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (lastTap.current && (now - lastTap.current) < DOUBLE_PRESS_DELAY) {
      // Double tap detected
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onPress?.({ ...e, detail: 2 });
      lastTap.current = null; // Reset after double tap
    } else {
      // Single tap
      if (accessibilityState?.selected) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress?.(e);
      lastTap.current = now;
    }
  };

  return (
    <TouchableOpacity
      {...props}
      onPress={handleDoubleTap}
      accessibilityState={accessibilityState}
      activeOpacity={0.76}
      style={[style, styles.button]}
    >
      <View pointerEvents="none" style={styles.content}>{children}</View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});

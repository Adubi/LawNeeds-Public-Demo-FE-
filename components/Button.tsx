// biome-ignore lint/style/useImportType: <explanation>
import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, Text } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from "../constants/theme";
import { useThemeColor } from "../hooks/useThemeColor";
import { ActivityIndicator } from "react-native";
import { View } from "react-native";
import { TouchableOpacity } from "react-native";
import { ThemedText } from "./ThemedText";
import { RFValue } from "react-native-responsive-fontsize";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  leftIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style,

  leftIcon,
  children,
}: ButtonProps) {
  const primary = useThemeColor({}, "primary");
  const secondary = useThemeColor({}, "secondary");
  const background = useThemeColor({}, "background");
  const text = useThemeColor({}, "text");

  const getBackgroundColor = (): string => {
    if (variant === "primary") return primary.toString();
    if (variant === "secondary") return secondary.toString();
    return "transparent";
  };

  const getBorderColor = (): string => {
    if (variant === "outline") return text.toString();
    return "transparent";
  };

  const getTextColor = (): string => {
    if (variant === "outline") {
      return text.toString();
    }
    console.log("background.toString()", background.toString());
    return "#fff";
  };

  const textStyle= styles.text

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
        (disabled || loading) && styles.disabledButton,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? "#000000" : "#ffffff"}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
          <Text
            style={[
              textStyle,

              { color: variant === "outline" ? "#000000" : "#ffffff" },
              (disabled || loading) && styles.disabledText,
            ]}
            allowFontScaling={false}
          >
            {title}
          </Text>
          {children}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: hp("6%"), // Responsive height
    borderRadius: BORDER_RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: wp("5%"), // Responsive padding
    borderWidth: 1,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: SPACING.sm,
  },
  text: {
    fontSize: RFValue(14),
    fontFamily: "InstrumentSansSemiBold",
  },

  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
});

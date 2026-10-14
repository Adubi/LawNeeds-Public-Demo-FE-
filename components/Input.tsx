import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type TextInputProps,
} from "react-native";
import { COLORS, SPACING } from "../constants/theme";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  rightIcon,
  style,
  ...props
}: InputProps) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            error && styles.inputError,
            style,
          ]}
          placeholderTextColor={COLORS.light.text}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: COLORS.light.text,
  },
  inputContainer: {
    position: "relative",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: COLORS.light.text,
  },
  inputError: {
    borderColor: "red",
  },
  inputWithIcon: {
    paddingRight: 48,
  },
  rightIcon: {
    position: "absolute",
    right: SPACING.md,
    height: "100%",
    justifyContent: "center",
  },
  error: {
    color: "red",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});

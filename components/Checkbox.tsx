import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SPACING } from "../constants/theme";
import { COLORS } from "@/constants/colors";
import { RFValue } from "react-native-responsive-fontsize";

interface CheckboxProps {
  label: string;
  checked: boolean;
  onCheck: (checked: boolean) => void;
}

export function Checkbox({ label, checked, onCheck }: CheckboxProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onCheck(!checked)}
      activeOpacity={0.7}
    >
      <TouchableOpacity
        style={[styles.checkbox, checked && styles.checked]}
        onPress={() => onCheck(!checked)}
        activeOpacity={0.7}
      >
        {checked && <Feather name="check" size={16} color={COLORS.White} />}
      </TouchableOpacity>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.Gray,
    justifyContent: "center",
    alignItems: "center",
  },
  checked: {
    backgroundColor: COLORS.SecodaryColor,
    borderColor: COLORS.SecodaryColor,
  },
  label: {
    fontSize: RFValue(12),
    fontFamily: "InstrumentSansBold",
    color: COLORS.PrimaryColor,
  },
});

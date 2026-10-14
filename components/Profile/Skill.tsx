import { Text, StyleSheet } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from "@/constants/theme";
import React from "react";

interface SkillProps {
  label: string;
}

export function Skill({ label }: SkillProps) {
  return <Text style={styles.skill}>{label}</Text>;
}

const styles = StyleSheet.create({
  skill: {
    backgroundColor: COLORS.light.background,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    fontSize: FONT_SIZES.md,
    fontFamily: "Inter_400Regular",
    color: COLORS.light.text,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
});

// biome-ignore lint/style/useImportType: <explanation>
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES } from "@/constants/theme";
import { router } from "expo-router";
interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
}

export function ProfileSection({
  title,
  children,
}: ProfileSectionProps) {

  const handleEditPress = () => {
    router.navigate('/(app)/(tabs)/profile/profile-edit');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={handleEditPress}>
          <Feather name="edit-2" size={20} color={COLORS.light.text} />
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.light.text,
  },
});

import React from "react";
import { TouchableOpacity, StyleSheet, Image, View } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { SPACING, BORDER_RADIUS, FONT_SIZES } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ThemedView } from "../ThemedView";
import { ThemedText } from "../ThemedText";
import {useTranslation} from 'react-i18next';

export default function GetStarted() {

  const {t} = useTranslation();

  const primary = useThemeColor({}, "primary");
  const secondary = useThemeColor({}, "secondary");
  const card = useThemeColor({}, "primary");

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Feather name="chevron-left" size={24} color={primary as string} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuButton}
        accessibilityRole="button"
        accessibilityLabel="Open menu"
      >
        <Feather name="menu" size={24} color={primary as string} />
      </TouchableOpacity>

      <Image
        source={require("@/assets/images/appIcon.png")}
        style={styles.logo}
        accessibilityLabel="LawNeeds logo"
      />

      <ThemedText
        style={styles.welcome}
        lightColor={secondary as string}
        darkColor={secondary as string}
      >
        Welcome to LawNeeds
      </ThemedText>

      <ThemedText type="subtitle" style={styles.subtitle}>
        {t('chat.get_started')}
      </ThemedText>

      {/* <ThemedText
        style={{
          fontSize: FONT_SIZES.md,
          color: '#2E7D32', // A professional green color
          textAlign: 'center',
          marginVertical: SPACING.sm,
          fontWeight: '500'
        }}
      >
        Immigration support made easy
      </ThemedText> */}

      <View style={styles.buttonContainer}>
        <Button
          title={t('chat.previous_chat')}
          variant="outline"
          onPress={() => {}}
          leftIcon={<Feather name="clock" size={20} color={primary as string} />}
          style={styles.button}
        />
        <Button
          title={t('chat.new_chat')}
          variant="outline"
          onPress={() => {}}
          leftIcon={<Feather name="edit" size={20} color={secondary as string} />}
          style={styles.button}
        />
      </View>

      <ThemedView style={[styles.tabBar, { backgroundColor: card as string }]}>
        <TouchableOpacity style={styles.tabItem}>
          <Feather name="user" size={24} color={primary as string   } />
          <ThemedText style={styles.tabText}>Account</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Feather name="inbox" size={24} color={primary as string} />
          <ThemedText style={styles.tabText}>Inbox</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Feather name="star" size={24} color={primary as string} />
          <ThemedText style={styles.tabText}>Chat</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Feather name="search" size={24} color={primary as string} />
          <ThemedText style={styles.tabText}>Search</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Feather name="settings" size={24} color={primary as string} />
          <ThemedText style={styles.tabText}>Settings</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.xl,
  },
  backButton: {
    position: "absolute",
    top: SPACING.xl,
    left: SPACING.xl,
    zIndex: 1,
  },
  menuButton: {
    position: "absolute",
    top: SPACING.xl,
    right: SPACING.xl,
    zIndex: 1,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginTop: 100,
    marginBottom: SPACING.xl,
  },
  welcome: {
    fontSize: FONT_SIZES.xl,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  buttonContainer: {
    gap: SPACING.md,
  },
  button: {
    width: "100%",
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    position: "absolute",
    bottom: SPACING.xl,
    left: SPACING.xl,
    right: SPACING.xl,
  },
  tabItem: {
    alignItems: "center",
  },
  tabText: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
});

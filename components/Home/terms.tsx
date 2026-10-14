import React, { useState } from "react";
import { ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { SPACING, BORDER_RADIUS, FONT_SIZES } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function Terms() {
  const [agreed, setAgreed] = useState(false);
  const primary = useThemeColor({}, "primary");
  const secondary = useThemeColor({}, "secondary");
  const card = useThemeColor({}, "primary");
  const border = useThemeColor({}, "border");

  const handleNext = () => {
    if (agreed) {
      router.push("/");
    }
  };

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

      <ThemedText type="title" style={styles.header}>
        LawNeeds
      </ThemedText>

      <ThemedView style={[styles.card, { backgroundColor: card as string }]}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText
            style={styles.welcome}
            lightColor={secondary as string}
            darkColor={secondary as string}
          >
            Welcome to LawNeeds!
          </ThemedText>

          <ThemedText style={styles.terms}>
            1. By using this app, you agree to these terms and must be at least
            18 years old.
          </ThemedText>
          <ThemedText style={styles.terms}>
            2. LawNeeds provides legal assistance but does not replace
            professional legal representation.
          </ThemedText>
          <ThemedText style={styles.terms}>
            3. You are responsible for providing accurate and truthful
            information.
          </ThemedText>
          <ThemedText style={styles.terms}>
            4. Your information is private, but you must keep your account
            credentials secret
          </ThemedText>
        </ScrollView>

        <TouchableOpacity
          style={[styles.checkbox, { borderColor: border as string }]}
          onPress={() => setAgreed(!agreed)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          accessibilityLabel="I agree to the terms and conditions"
        >
          {agreed && <Feather name="check" size={20} color={primary as string} />}
        </TouchableOpacity>
        <ThemedText style={styles.agreeText}>I agree</ThemedText>

        <Button
          title="Next"
          onPress={handleNext}
          disabled={!agreed}
          style={styles.button}
        />
      </ThemedView>

      <ThemedView style={[styles.tabBar, { backgroundColor: card as string }]}>
        <TouchableOpacity style={styles.tabItem}>
          <Feather name="user" size={24} color={primary as string} />
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
    marginBottom: SPACING.lg,
  },
  header: {
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  card: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  content: {
    flex: 1,
  },
  welcome: {
    fontSize: FONT_SIZES.xl,
    marginBottom: SPACING.xl,
  },
  terms: {
    marginBottom: SPACING.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    marginTop: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  agreeText: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  button: {
    width: "100%",
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
  },
  tabItem: {
    alignItems: "center",
  },
  tabText: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
});

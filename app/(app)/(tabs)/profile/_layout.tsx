import React from "react";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const ProfileLayout = () => (
  <Stack screenOptions={{ headerShown: false, navigationBarHidden: true }}>
    <Stack.Screen
      name="profile"
      options={{
        headerTitle: "Profile",
        headerRight: () => (
          <Ionicons name="settings-outline" size={24} color="black" />
        ),
      }}
    />
    <Stack.Screen name="edit-profile" />
  </Stack>
);

export default ProfileLayout;

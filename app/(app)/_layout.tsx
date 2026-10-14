import {Stack, router, usePathname} from "expo-router";
import React, {useEffect, useRef} from "react";

import {
  getIdentityVerificationStatus,
  identityVerificationIsRequired,
  isIdentityProtectedPath,
} from "@/services/identityVerificationGate";

export default function TabLayout() {
  const pathname = usePathname();
  const protectedRoute = isIdentityProtectedPath(pathname);
  const redirectingPath = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!protectedRoute) {
      redirectingPath.current = null;
      return () => {
        active = false;
      };
    }

    getIdentityVerificationStatus()
      .then((status) => {
        if (!active) return;

        if (identityVerificationIsRequired(status) && redirectingPath.current !== pathname) {
          redirectingPath.current = pathname;
          router.replace("/(app)/identity-verification");
        }
      })
      .catch((error) => {
        console.warn("Unable to enforce identity verification:", error);
        if (active && redirectingPath.current !== pathname) {
          redirectingPath.current = pathname;
          router.replace("/(app)/(tabs)/profile");
        }
      });

    return () => {
      active = false;
    };
  }, [pathname, protectedRoute]);

  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="(tabs)">
      <Stack.Screen name="(tabs)" options={{gestureEnabled: false}} />
      <Stack.Screen name="login" options={{gestureEnabled: false}} />
      <Stack.Screen name="signup" />
      <Stack.Screen name="identity-verification" options={{gestureEnabled: false}} />
    </Stack>
  );
}

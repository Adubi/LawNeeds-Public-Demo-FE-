import React, {useCallback, useEffect, useState} from "react";
import {ActivityIndicator, Alert, StyleSheet, Text, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {router} from "expo-router";
import {Inquiry} from "react-native-persona";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {Button} from "@/components/Button";
import {COLORS} from "@/constants/colors";
import {ProTypes} from "@/constants/protypes";
import {
  getIdentityVerificationStatus,
  IdentityVerificationStatus,
  startIdentityVerification,
  syncIdentityVerificationStatus,
} from "@/services/identityVerificationGate";

const STATUS_COPY: Record<string, string> = {
  not_started: "Verify your identity to continue using LawNeeds.",
  in_progress: "Your verification has started. You can resume it at any time.",
  pending_review: "Your verification is being reviewed. This may take a few minutes.",
  declined: "We could not approve your identity verification. Please retry or contact support.",
  failed: "The verification could not be completed. Please try again.",
  expired: "Your verification session expired. Start again to continue.",
};

const ACCOUNT_COPY: Record<string, {title: string; privacy: string}> = {
  user: {
    title: "Identity verification",
    privacy: "Verification is securely completed by Persona. LawNeeds uses the result to protect clients and lawyers.",
  },
  lawyer: {
    title: "Lawyer verification",
    privacy: "Persona verifies your identity as the representative of your professional profile. LawNeeds uses this to protect clients and legal professionals.",
  },
  law_firm: {
    title: "Law firm verification",
    privacy: "Persona verifies the authorised representative for this law firm profile. LawNeeds uses your submitted firm details to support business profile review.",
  },
  a2j_partner: {
    title: "A2J partner verification",
    privacy: "Persona verifies the authorised representative for this A2J partner profile. LawNeeds uses your submitted organisation details to support partner review.",
  },
  sme: {
    title: "SME representative verification",
    privacy: "Persona verifies the authorised representative for this HR/Legal SME profile. LawNeeds uses your submitted company details to support business profile review.",
  },
};

export default function IdentityVerificationScreen() {
  const [status, setStatus] = useState<IdentityVerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);

  const loadStatus = useCallback(async (sync = false, showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const result = sync
        ? await syncIdentityVerificationStatus()
        : await getIdentityVerificationStatus();
      setStatus(result);
      if (!result?.required || result?.approved) {
        router.replace("/(app)/(tabs)");
      }
    } catch (error: any) {
      Alert.alert("Identity verification", error?.detail || "Unable to load verification status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const launchPersona = async () => {
    try {
      setLaunching(true);
      const result = await startIdentityVerification();
      setStatus(result);

      if (result?.approved) {
        router.replace("/(app)/(tabs)");
        return;
      }
      if (!result?.inquiry_id || !result?.session_token) {
        await loadStatus(true);
        return;
      }

      Inquiry.fromInquiry(result.inquiry_id)
        .sessionToken(result.session_token)
        .onComplete(() => loadStatus(true))
        .onCanceled(() => loadStatus(false, false))
        .onError((error) => Alert.alert("Identity verification", error.message))
        .build()
        .start();
    } catch (error: any) {
      Alert.alert("Identity verification", error?.detail || "Unable to start identity verification.");
    } finally {
      setLaunching(false);
    }
  };

  const continueWithoutVerification = async () => {
    const userType = await AsyncStorage.getItem("user_type");
    const proTypes = [
      ProTypes.LAWYER,
      ProTypes.LAW_FIRM,
      ProTypes.HR_LEGAL,
      ProTypes.A2J_PARTNERS,
    ];

    router.replace(
      proTypes.includes(userType as ProTypes)
        ? "/(app)/(tabs)/profile/profile-pro-user"
        : "/(app)/(tabs)/profile",
    );
  };

  if (loading && !status) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.PrimaryColor}/>
      </SafeAreaView>
    );
  }

  const pendingReview = status?.status === "pending_review";
  const accountCopy = ACCOUNT_COPY[status?.account_type || "user"] || ACCOUNT_COPY.user;
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title} allowFontScaling={false}>{accountCopy.title}</Text>
        <Text style={styles.body} allowFontScaling={false}>
          {STATUS_COPY[status?.status || "not_started"] || STATUS_COPY.not_started}
        </Text>
        <Text style={styles.privacy} allowFontScaling={false}>
          {accountCopy.privacy}
        </Text>

        {pendingReview ? (
          <Button title="Check status" onPress={() => loadStatus(true)} loading={loading}/>
        ) : (
          <Button
            title={status?.status === "in_progress" ? "Resume verification" : "Start verification"}
            onPress={launchPersona}
            loading={launching}
          />
        )}
        {!status?.blocking && (
          <Button
            title="Do this later"
            variant="outline"
            onPress={continueWithoutVerification}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: COLORS.BackgroundColor,
  },
  card: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: COLORS.White,
    gap: 20,
  },
  title: {
    color: COLORS.PrimaryColor,
    fontFamily: "InstrumentSansSemiBold",
    fontSize: 24,
    textAlign: "center",
  },
  body: {
    color: COLORS.PrimaryColorText,
    fontFamily: "InstrumentSansRegular",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  privacy: {
    color: COLORS.Gray,
    fontFamily: "InstrumentSansRegular",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});

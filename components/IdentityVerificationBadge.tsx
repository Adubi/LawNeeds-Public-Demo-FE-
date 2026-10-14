import React, {useCallback, useState} from "react";
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity} from "react-native";
import {MaterialIcons} from "@expo/vector-icons";
import {router, useFocusEffect} from "expo-router";

import {COLORS} from "@/constants/colors";
import {
    getCachedIdentityVerificationStatus,
    getIdentityVerificationStatus,
    IdentityVerificationStatus,
} from "@/services/identityVerificationGate";

export const IdentityVerificationBadge = () => {
    const initialStatus = getCachedIdentityVerificationStatus();
    const [status, setStatus] = useState<IdentityVerificationStatus | null>(initialStatus);
    const [loading, setLoading] = useState(!initialStatus);

    useFocusEffect(
        useCallback(() => {
            let active = true;

            getIdentityVerificationStatus()
                .then((result) => {
                    if (active) setStatus(result);
                })
                .catch((error) => console.warn("Unable to load identity verification badge:", error))
                .finally(() => {
                    if (active) setLoading(false);
                });

            return () => {
                active = false;
            };
        }, []),
    );

    if (loading) {
        return <ActivityIndicator size="small" color={COLORS.PrimaryColor}/>;
    }

    if (!status?.required) {
        return null;
    }

    const approved = status.approved;
    const label = approved
        ? "Verified"
        : status.status === "in_progress"
          ? "Resume verification"
          : status.status === "pending_review"
            ? "Verification pending"
            : "Verify identity";

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={label}
            disabled={approved}
            onPress={() => router.push("/(app)/identity-verification")}
            style={[styles.badge, approved ? styles.approved : styles.unverified]}
        >
            <MaterialIcons
                name={approved ? "verified" : "error-outline"}
                size={18}
                color={approved ? COLORS.PrimaryColor : COLORS.Gray}
            />
            <Text style={[styles.label, approved && styles.approvedLabel]}>{label}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    badge: {
        alignItems: "center",
        alignSelf: "center",
        borderRadius: 18,
        borderWidth: 1,
        flexDirection: "row",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    approved: {
        backgroundColor: "#EEF8F1",
        borderColor: COLORS.PrimaryColor,
    },
    unverified: {
        backgroundColor: COLORS.BackgroundColor,
        borderColor: COLORS.Gray,
    },
    label: {
        color: COLORS.Gray,
        fontFamily: "InstrumentSansSemiBold",
        fontSize: 12,
    },
    approvedLabel: {
        color: COLORS.PrimaryColor,
    },
});

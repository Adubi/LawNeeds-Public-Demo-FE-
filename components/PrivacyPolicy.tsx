"use client";

import React, {useState} from "react";
import {ScrollView, TouchableOpacity, View} from "react-native";
import {ThemedView} from "./ThemedView";
import {ThemedText} from "./ThemedText";
import {COLORS, SPACING, FONT_SIZES, BORDER_RADIUS} from "@/constants/theme";
import {useApp} from "@/contexts/AppContext";
import {Feather} from "@expo/vector-icons";
import {router} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useTranslation} from 'react-i18next';
import {ThemedTextNew} from "./ThemedTextNew";
import {removeTokenData} from "@/constants/Utility";

export function PrivacyPolicy() {

    const {t} = useTranslation();

    const {setHasAcceptedPrivacyPolicy} = useApp();
    const [agreed, setAgreed] = useState(false);

    const handleDisagree = async () => {
        try {
            // Clear auth token to log the user out
            await removeTokenData();
            // Redirect to welcome screen
            router.replace("/welcome");
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    return (
        <ThemedView
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                justifyContent: "center",
                alignItems: "center",
                padding: SPACING.lg,
            }}
        >
            <ThemedView
                style={{
                    backgroundColor: COLORS.light.background,
                    borderRadius: BORDER_RADIUS.lg,
                    width: "100%",
                    maxWidth: 500,
                    maxHeight: "80%",
                    padding: SPACING.md,
                    shadowColor: "#000",
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                }}
            >
                <ScrollView
                    style={{padding: SPACING.sm}}
                    showsVerticalScrollIndicator={true}
                    persistentScrollbar={true}
                    scrollEnabled={true}
                    nestedScrollEnabled={true}
                    contentContainerStyle={{flexGrow: 1}}
                    scrollIndicatorInsets={{right: 1, bottom: 1}}
                >
                    <ThemedText
                        style={{
                            fontSize: FONT_SIZES.xl,
                            fontWeight: "600",
                            textAlign: "left",
                            color: 'rgb(3, 49, 38)',
                            marginBottom: SPACING.md,
                            alignItems: "flex-start"
                        }}
                    >
                        {t('privacy_policy')}
                    </ThemedText>

                    <ThemedTextNew
                        style={{
                            fontSize: FONT_SIZES.md,
                            color: COLORS.light.subtext,
                            marginBottom: SPACING.xs,
                            lineHeight: 24,
                        }}
                    >
                        {t('policy_text.policy_details')}
                    </ThemedTextNew>

                    {/* Additional detailed sections of the privacy policy */}
                    <ThemedText
                        style={{
                            fontSize: FONT_SIZES.md,
                            color: COLORS.light.subtext,
                            marginBottom: SPACING.xs,
                            lineHeight: 24,
                        }}
                    >
                        {t('policy_text.label_1')}
                    </ThemedText>

                    <ThemedText
                        style={{
                            fontSize: FONT_SIZES.md,
                            color: COLORS.light.subtext,
                            marginBottom: SPACING.xs,
                            lineHeight: 24,
                        }}
                    >
                        {t('policy_text.label_2')}
                    </ThemedText>

                    <ThemedText
                        style={{
                            fontSize: FONT_SIZES.md,
                            color: COLORS.light.subtext,
                            marginBottom: SPACING.xs,
                            lineHeight: 24,
                        }}
                    >
                        {t('policy_text.label_3')}
                    </ThemedText>

                    <ThemedText
                        style={{
                            fontSize: FONT_SIZES.md,
                            color: COLORS.light.subtext,
                            marginBottom: SPACING.xs,
                            lineHeight: 24,
                        }}
                    >
                        {t('policy_text.label_4')}
                    </ThemedText>

                    <ThemedText
                        style={{
                            fontSize: FONT_SIZES.md,
                            color: COLORS.light.subtext,
                            marginBottom: SPACING.xs,
                            lineHeight: 24,
                        }}
                    >
                        {t('policy_text.label_5')}
                    </ThemedText>

                    <ThemedText
                        style={{
                            fontSize: FONT_SIZES.md,
                            color: COLORS.light.subtext,
                            marginBottom: SPACING.xs,
                            lineHeight: 24,
                        }}
                    >
                        {t('policy_text.label_6')}
                    </ThemedText>

                    <ThemedText
                        style={{
                            fontSize: FONT_SIZES.md,
                            color: COLORS.light.subtext,
                            marginBottom: SPACING.xs,
                            lineHeight: 24,
                        }}
                    >
                        {t('policy_text.label_7')}
                    </ThemedText>

                </ScrollView>

                <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: SPACING.sm,
                    marginBottom: SPACING.md,
                    marginRight: SPACING.md
                }}>
                    <View style={{flexDirection: "row", alignItems: "center"}}>
                        <TouchableOpacity
                            style={{
                                width: 22,
                                height: 22,
                                borderWidth: 1,
                                borderColor: 'rgb(3, 49, 38)',
                                justifyContent: "center",
                                alignItems: "center",
                                marginRight: SPACING.sm,
                            }}
                            onPress={() => {
                                setHasAcceptedPrivacyPolicy(true);
                            }}
                        >
                            {agreed && <Feather name="check" size={20} color='rgb(3, 49, 38)'/>}
                        </TouchableOpacity>
                        <ThemedText
                            style={{
                                fontSize: FONT_SIZES.md,
                                color: 'rgb(3, 49, 38)',
                            }}
                        >
                            {t('policy_text.i_agree')}
                        </ThemedText>
                    </View>

                    <TouchableOpacity
                        onPress={handleDisagree}
                    >
                        <ThemedText
                            style={{
                                fontSize: FONT_SIZES.md,
                                color: 'rgb(3, 49, 38)',
                                textDecorationLine: 'underline',
                            }}
                        >
                            {t('policy_text.i_dont_agree')}
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </ThemedView>
        </ThemedView>
    );
}
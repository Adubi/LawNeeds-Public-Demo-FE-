"use client";

import React, {useState} from "react";
import {Button, ScrollView, TouchableOpacity, View} from "react-native";
import {ThemedView} from "./ThemedView";
import {ThemedText} from "./ThemedText";
import {BORDER_RADIUS, COLORS, FONT_SIZES, SPACING} from "@/constants/theme";
import {useApp} from "@/contexts/AppContext";
import {Feather} from "@expo/vector-icons";
import {router} from "expo-router";
import {removeTokenData} from "@/constants/Utility";
import {useTranslation} from "react-i18next";

export function TermsAndConditions() {
    const {t} = useTranslation();
    const {setHasAcceptedTerms} = useApp();
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

    const handleAgree = () => {
        const newValue = !agreed;
        setAgreed(newValue);
        setHasAcceptedTerms(true);

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
                        {t("terms_and_conditions")}
                    </ThemedText>

                    <ThemedText
                        style={{
                            fontSize: FONT_SIZES.lg,
                            marginBottom: SPACING.sm,
                            color: COLORS.light.secondary,
                            fontWeight: "bold",
                        }}
                    >
                        {t("welcome_to_lawneeds")}
                    </ThemedText>

                    {[1, 2, 3, 4, 5].map((item) => (
                        <ThemedText
                            key={item}
                            style={{
                                fontSize: FONT_SIZES.md,
                                color: COLORS.light.subtext,
                                marginBottom:
                                    item === 5 ? SPACING.md : SPACING.xs,
                                lineHeight: 24,
                            }}
                        >
                            {t(`terms_condition_${item}`)}
                        </ThemedText>
                    ))}
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
                            onPress={handleAgree}
                        >
                            {agreed && (
                                <Feather
                                    name="check"
                                    size={16}
                                    color="white"
                                />
                            )}
                        </TouchableOpacity>
                        <ThemedText
                            style={{
                                fontSize: FONT_SIZES.md,
                                color: 'rgb(3, 49, 38)',
                            }}
                        >
                            {t("i_agree")}
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
                            {t("i_dont_agree")}
                        </ThemedText>
                    </TouchableOpacity>

                </View>
            </ThemedView>
        </ThemedView>
    );
}

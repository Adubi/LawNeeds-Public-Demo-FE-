import React, {useEffect, useState} from "react";
import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {COLORS} from "@/constants/colors";
import {SPACING} from "@/constants/theme";
import {useTranslation} from "react-i18next";
import {getDailyPassOffering} from "@/constants/Utility";
import {findRevenueCatPackageForPlan} from "@/services/planToRevenueCat";


export const FreemiumBanner = ({
                                   response,
                                   onUpgrade,
                                   onDailyPass,
                               }: {
    response: any;
    onUpgrade: () => void;
    onDailyPass: () => void;
}) => {

    const {t} = useTranslation();
    const [dailyPassPrice, setDailyPassPrice] = useState("£4.99");

    const {freemium, subscription, limits, monthly_usage} = response;

    useEffect(() => {
        let isMounted = true;

        getDailyPassOffering().then((packages) => {
            if (!isMounted) return;
            const dailyPassPackage = findRevenueCatPackageForPlan(packages || [], "express-daily", "express");
            const priceString = dailyPassPackage?.product?.priceString;
            if (priceString) {
                setDailyPassPrice(priceString);
            }
        });

        return () => {
            isMounted = false;
        };
    }, []);

    const queriesLeft = freemium.queries_remaining;
    const maxQueries = freemium.queries_limit ?? freemium.base_query_limit ?? 10;
    const progressPercent = Math.min(100, (queriesLeft / maxQueries) * 100);
    const formatUsageCount = (used?: number | null, limit?: number | null) => {
        if (limit == null) {
            return t('unlimited');
        }

        return `${Math.min(used ?? 0, limit)}/${limit}`;
    };

    return (
        <View style={styles.container}>
            {freemium && (
                <View style={styles.bannerContainer}>
                    {/* Header */}
                    <View style={styles.headerRow}>
                        {/* LEFT SIDE: Wrapped in a View with flex: 1 */}
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.planLabel} numberOfLines={1}>
                                {t("freemium.banner.plan_label", {
                                    plan_name: (subscription.plan_name.toLowerCase() === "basic" && freemium.daily_pass_active) ? t('express') : subscription.plan_name.toUpperCase()
                                })}

                            </Text>

                            {!freemium.daily_pass_active ? (
                                <Text
                                    style={styles.queryCount}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                >
                                    {t("freemium.banner.queries_left", {
                                        remaining: queriesLeft,
                                        total: maxQueries
                                    })}
                                </Text>
                            ) : (
                                <View style={styles.passBadge}>
                                    <Text style={styles.passBadgeText}>
                                        {t('freemium.banner.daily_pass_active')}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* RIGHT SIDE: Button */}
                        <TouchableOpacity
                            style={styles.upgradeBtn}
                            onPress={onUpgrade}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.upgradeBtnText}>
                                {t('freemium.banner.upgrade_cta')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Usage Section */}
                    <View style={styles.usageSection}>
                        {!freemium.daily_pass_active && (
                            <View style={styles.track}>
                                <View
                                    style={[
                                        styles.fill,
                                        {
                                            width: `${progressPercent}%`,
                                            backgroundColor:
                                                progressPercent < 30
                                                    ? "#EF4444"
                                                    : COLORS.PrimaryColor,
                                        },
                                    ]}
                                />
                            </View>
                        )}

                        <View style={styles.usageGrid}>
                            <View style={styles.usageItem}>
                                <Text
                                    style={styles.usageNumber}>{formatUsageCount(monthly_usage?.voice_notes, limits.voice_notes_limit)}</Text>
                                <Text style={styles.usageLabel}>{t('plan_card.features.voice_notes')}</Text>
                            </View>

                            <View style={styles.usageItem}>
                                <Text style={styles.usageNumber}>{formatUsageCount(monthly_usage?.uploads, limits.uploads_limit)}</Text>
                                <Text style={styles.usageLabel}>{t('plan_card.features.uploads')}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {/* Daily Pass Upsell */}
            {!freemium?.daily_pass_active &&
                freemium?.queries_remaining === 0 && (
                    <View style={styles.dailyPassBox}>
                        <Text style={styles.dailyTitle}>
                            {t('freemium.banner.daily_pass.title')}
                        </Text>
                        <Text style={styles.dailyText}>
                            {t("freemium.banner.daily_pass.description", {
                                price: dailyPassPrice
                            })}
                        </Text>

                        <TouchableOpacity
                            onPress={onDailyPass}
                            style={styles.dailyPassBtn}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.dailyPassBtnText}>
                                {t("freemium.banner.daily_pass.cta", {
                                    price: dailyPassPrice
                                })}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: SPACING.md
    },
    bannerContainer: {
        backgroundColor: COLORS.SecodaryColor,
        borderRadius: 24,
        padding: 18,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: {width: 0, height: 6},
        elevation: 6,
    },

    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center", // Changed from flex-start for better vertical centering
    },

    headerTextContainer: {
        flex: 1,           // Forces the text container to take available space only
        marginRight: 12,   // Ensures a gap between text and button
    },

    upgradeBtn: {
        backgroundColor: COLORS.PrimaryColor,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 999,
        flexShrink: 0,     // CRITICAL: Prevents the button from being squished
    },

    queryCount: {
        fontSize: 20,
        fontFamily: "InstrumentSansSemiBold",
        color: COLORS.PrimaryColorText,
        marginTop: 4,
        minHeight: 28,     // Prevents layout jump if text scales down
    },

    planLabel: {
        fontSize: 11,
        letterSpacing: 1,
        color: COLORS.White,
        fontFamily: "InstrumentSansSemiBold",
    },

    /* queryCount: {
         fontSize: 22,
         fontFamily: "InstrumentSansSemiBold",
         color: COLORS.PrimaryColorText,
         marginTop: 4,
     },*/

    querySubText: {
        fontSize: 14,
        fontFamily: "InstrumentSansRegular",
        color: COLORS.PrimaryColorText,
    },

    /* upgradeBtn: {
         backgroundColor: COLORS.PrimaryColor,
         paddingHorizontal: 18,
         paddingVertical: 10,
         borderRadius: 999,
     },*/

    upgradeBtnText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontFamily: "InstrumentSansSemiBold",
    },

    progressSection: {
        marginTop: 16,
    },

    track: {
        height: 10,
        backgroundColor: "#F3F4F6",
        borderRadius: 999,
        overflow: "hidden",
    },

    fill: {
        height: "100%",
        borderRadius: 999,
    },

    footerRow: {
        marginTop: 8,
    },

    limitText: {
        fontSize: 12,
        color: COLORS.Gray,
        fontFamily: "InstrumentSansRegular",
    },

    passBadge: {
        marginTop: 8,
        backgroundColor: "#111827",
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 999,
    },

    passBadgeText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontFamily: "InstrumentSansSemiBold",
    },

    dailyPassBox: {
        backgroundColor: "#111827",
        borderRadius: 24,
        padding: 20,
        marginTop: 8,
    },

    dailyTitle: {
        fontSize: 16,
        fontFamily: "InstrumentSansSemiBold",
        color: "#FFFFFF",
        marginBottom: 6,
    },

    dailyText: {
        fontSize: 13,
        color: "#D1D5DB",
        marginBottom: 16,
        fontFamily: "InstrumentSansRegular",
    },

    dailyPassBtn: {
        backgroundColor: "#FFFFFF",
        paddingVertical: 12,
        borderRadius: 999,
        alignItems: "center",
    },

    dailyPassBtnText: {
        color: "#111827",
        fontFamily: "InstrumentSansSemiBold",
        fontSize: 14,
    },
    usageSection: {
        marginTop: 8,
    },

    usageGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F1F1F1",
    },

    usageItem: {
        alignItems: "center",
        flex: 1,
    },

    usageNumber: {
        fontSize: 16,
        fontFamily: "InstrumentSansSemiBold",
        color: COLORS.PrimaryColorText,
    },

    usageLabel: {
        fontSize: 11,
        color: COLORS.Black,
        marginTop: 2,
        fontFamily: "InstrumentSansRegular",
    },
});

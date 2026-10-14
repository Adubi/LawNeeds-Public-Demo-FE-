import React, {useEffect, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {MaterialCommunityIcons, MaterialIcons} from '@expo/vector-icons';
import {ThemedText} from "@/components/ThemedText";
import {SafeAreaView} from "react-native-safe-area-context";
import {router} from "expo-router"; // Expo Router for navigation
import {getUserPlan} from "@/services/subscriptionHelper";
import TopUpModal from "@/components/subscription/TopUpModal";
import {useApp} from '@/contexts/AppContext';
import Purchases from "react-native-purchases";
import {handleSubscriptionSync} from "@/services/subscriptionManager";
import {useTranslation} from "react-i18next";
import PageTourProvider from "@/app/(app)/manage/PageTourProvider";
import {useTour} from "@/app/(app)/manage/useTour";
import TourHighlight from "@/app/(app)/manage/TourHighlight";

const Colors = {
    PrimaryColor: '#176535',
    AccentOrange: '#DD8550',
    Background: '#FFF7ED',
    CardBackground: '#FFFFFF',
    TextDark: '#033126',
    TextMuted: '#6D6D72',
    Danger: '#E74C3C',
    BorderGray: '#EFEFEF',
};

const APPLE_SUBSCRIPTION_URL = "https://apps.apple.com/account/subscriptions";
const PLAY_SUBSCRIPTION_URL = "https://play.google.com/store/account/subscriptions?package=com.steve.LawNeeds";

const getPlatformSubscriptionManagementUrl = (managementUrl?: string | null) => {
    const url = managementUrl ?? "";

    if (Platform.OS === "ios") {
        return url && !url.includes("play.google.com")
            ? url
            : APPLE_SUBSCRIPTION_URL;
    }

    if (Platform.OS === "android") {
        return url && url.includes("play.google.com")
            ? url
            : PLAY_SUBSCRIPTION_URL;
    }

    return url || PLAY_SUBSCRIPTION_URL;
};

// --- Sub-component: Usage Row ---
const UsageItem = ({ nameKey, used, limit, icon }: any) => {
    const { t } = useTranslation();

    return (
        <View style={usageStyles.itemContainer}>
            <View style={usageStyles.leftContent}>
                <View style={usageStyles.iconCircle}>
                    <MaterialCommunityIcons name={icon} size={18} color={Colors.PrimaryColor} />
                </View>
                <Text style={usageStyles.itemName}>{t(nameKey)}</Text>
            </View>
            <Text style={usageStyles.itemValue}>
                {limit === null ? (
                    <Text style={{ fontWeight: '800', color: Colors.PrimaryColor }}>
                        {t('unlimited')}
                    </Text>
                ) : (
                    <>
                        <Text style={{ fontWeight: '800', color: Colors.PrimaryColor }}>
                            {used >= limit ? limit : used}
                        </Text>
                        <Text style={{ color: Colors.TextMuted }}> / {limit}</Text>
                    </>
                )}
            </Text>
        </View>
    );
};



const CurrentPlanContent = () => {

    const {t} = useTranslation();
    const { isTopUpVisible, topUpData, closeTopUp, refreshPlanInfo } = useApp();
    const [walletData, setWalletData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);


    useTour("CurrentPlan", true);

    const loadData = () => {
        setIsLoading(true);
        getUserPlan(
            (response: any) => {
                setWalletData(response);
                setIsLoading(false);
            },
            () => {
                setIsLoading(false);
            }
        );
    };

    useEffect(() => {
         handleSubscriptionSync({
            forceSync: false,
            onSuccess: () => {
               refreshPlanInfo()
                console.log("refreshPlanInfo called")

            },
            onError: (error) => {
                console.log("handleSubscriptionSync error")

                console.log("Subscription sync error:", error);
            },
        });
    }, []);

    const handleCancelSubscription = async () => {
        try {
            const customerInfo = await Purchases.getCustomerInfo();

            const hasActiveSubscription =
                Object.keys(customerInfo.entitlements.active || {}).length > 0;

            if (!hasActiveSubscription) {
                Alert.alert(
                    t('subscription.no_active_title'),
                    t('subscription.no_active_message')
                );
                return;
            }

            const managementUrl = customerInfo.managementURL;

            Alert.alert(
                t('manage_subscription_title'),
                t('manage_subscription_desc'),
                [
                    { text: t('stay_with_us'), style: "cancel" },
                    {
                        text: t('continue'),
                        style: "destructive",
                        onPress: async () => {
                            try {
                                const urlToOpen = getPlatformSubscriptionManagementUrl(managementUrl);

                                // ✅ check before opening
                                const supported = await Linking.canOpenURL(urlToOpen);

                                if (!supported) {
                                    throw new Error("URL not supported");
                                }

                                await Linking.openURL(urlToOpen);

                            } catch (err) {
                                console.error("Open subscription error:", err);
                                Alert.alert(t('error'), t('open_store_error'));
                            }
                        },
                    },
                ]
            );
        } catch (e) {
            Alert.alert(t('error.title'), t('subscription_fetch_error'));
        }
    };

    const handleUpgradePlan = () => {
        router.push("/(app)/manageSubscription/upgrade-plans-screen");
    };

    useEffect(() => {
        loadData();
    }, []);

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.PrimaryColor} />
                <Text style={styles.loadingText}>{t('updating_balance')}</Text>
            </View>
        );
    }

    if (!walletData) return null;

    const { subscription, minutes, limits, monthly_usage, freemium } = walletData;

    // Logic to check if user is on a free tier or paid
    const isPaidUser = subscription?.plan_id && subscription.plan_id !== 'free' && subscription.plan_id !== 'freemium';

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
                    <MaterialIcons name="arrow-back-ios" size={22} color={Colors.TextDark} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>{t('current_plan')}</ThemedText>
                <TouchableOpacity onPress={loadData} style={styles.headerIcon}>
                    <MaterialIcons name="refresh" size={24} color={Colors.TextDark} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* 1. Main Balance Card */}
                <View style={styles.walletCard}>
                    <View style={styles.tierBadge}>
                        { (subscription.plan_name.toLowerCase() === "basic" && freemium.daily_pass_active) ?
                        <Text style={styles.tierBadgeText}>{t('express')}</Text>  :
                         <Text style={styles.tierBadgeText}>{subscription.plan_name.toUpperCase()}</Text>
                        }
                    </View>
                    <Text style={styles.walletTitle}>{subscription.wallet_balance}</Text>
                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceValue}>{minutes.available}</Text>
                        <Text style={styles.balanceUnit}>{t('unit_min')}</Text>
                    </View>
                    <View style={styles.usageLabelRow}>
                        <Text style={styles.usageText}>
                            {t('used')}: {minutes.used} {t('unit_min')}
                        </Text>
                        <Text style={styles.usageText}>
                            {t('total')}: {minutes.total} {t('unit_min')}
                        </Text>
                    </View>
                </View>

                {/* 2. Usage Limits Section */}
                <View style={styles.detailCard}>
                    <Text style={styles.sectionTitle}>{t('usage_limits')}</Text>

                    <UsageItem
                        icon="microphone"
                        nameKey="voice_notes"
                        used={monthly_usage.voice_notes}
                        limit={limits.voice_notes_limit}
                    />

                    <UsageItem
                        icon="file-upload"
                        nameKey="uploads"
                        used={monthly_usage.uploads}
                        limit={limits.uploads_limit}
                    />

                    {/*
                      <UsageItem icon="file-document-edit"
                      name="AI Document Gen"
                      used={monthly_usage.docgen}
                      limit={limits.docgen_limit}
                      />
                  */}
                </View>

                <TourHighlight
                    zone={1}
                    title={t('tour_usage_history_title')}
                    text={t('tour_usage_history_desc')}
                >
                <TouchableOpacity style={styles.historyButton} onPress={() => router.push("/(app)/manageSubscription/UsageHistoryScreen")}>
                    <MaterialCommunityIcons name="history" size={20} color={Colors.TextMuted} />
                    <Text style={styles.historyButtonText}>{t('usage_history')}</Text>
                    <MaterialIcons name="chevron-right" size={20} color={Colors.TextMuted} />
                </TouchableOpacity>
                </TourHighlight>

                {/* 4. Action Section (The requested change) */}

                {isPaidUser ? (
                    <View style={styles.subscriptionActions}>
                        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradePlan}>
                            <MaterialIcons name="settings" size={20} color="#FFF" />
                            <Text style={styles.upgradeButtonText}>{t('manage_plan')}</Text>

                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSubscription}>
                            <MaterialIcons name="close" size={20} color={Colors.Danger} />
                            <Text style={styles.cancelButtonText}>{t('cancel_subscription')}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.upgradeButton}
                        onPress={() => router.push("/(app)/manageSubscription/subscription-plans-screen")}
                    >
                        <MaterialIcons name="bolt" size={22} color="#FFF" />
                        <Text style={styles.upgradeButtonText}>{t('explore_premium_plans')}</Text>
                    </TouchableOpacity>
                )}

                {topUpData && (
                    <TopUpModal {...topUpData} isVisible={isTopUpVisible} onClose={closeTopUp} />
                )}
            </ScrollView>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.Background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.Background },
    loadingText: { marginTop: 10, color: Colors.TextMuted, fontWeight: '600' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 60,
    },
    headerIcon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.TextDark },
    scrollContent: { padding: 20 },

    // Balance Card
    walletCard: {
        backgroundColor: Colors.CardBackground,
        padding: 24,
        borderRadius: 28,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
    tierBadge: {
        backgroundColor: 'rgba(23, 101, 53, 0.08)',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        marginBottom: 12,
    },
    tierBadgeText: { color: Colors.PrimaryColor, fontSize: 11, fontWeight: '900' },
    walletTitle: { fontSize: 14, fontWeight: '600', color: Colors.TextMuted },
    balanceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
    balanceValue: { fontSize: 52, fontWeight: '900', color: Colors.PrimaryColor, letterSpacing: -1 },
    balanceUnit: { fontSize: 20, fontWeight: '700', color: Colors.TextDark, marginLeft: 6 },
    progressBarContainer: { marginTop: 24 },
    usageLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    usageText: { fontSize: 12, fontWeight: '700', color: Colors.TextMuted },

    // Freemium Card
    freemiumCard: {
        backgroundColor: Colors.CardBackground,
        borderRadius: 20,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#FFE0B2',
    },
    freemiumInfo: { flexDirection: 'row', alignItems: 'center' },
    freemiumTitle: { fontSize: 13, color: Colors.TextMuted, fontWeight: '700' },
    freemiumValue: { fontSize: 17, color: Colors.AccentOrange, fontWeight: '900' },
    miniUpgradeBtn: { backgroundColor: Colors.AccentOrange, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
    miniUpgradeText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

    // Limits Card
    detailCard: {
        backgroundColor: Colors.CardBackground,
        borderRadius: 28,
        padding: 24,
        marginBottom: 16,
    },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.TextDark, marginBottom: 18 },
    divider: { height: 1, backgroundColor: Colors.BorderGray, marginVertical: 20 },
    upgradeCTA: {
        backgroundColor: Colors.PrimaryColor,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 20,
        gap: 10
    },
    upgradeCTAText: { color: '#FFF', fontWeight: '800', fontSize: 16 },

    // History
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        backgroundColor: 'rgba(3, 49, 38, 0.04)',
        borderRadius: 20,
        marginBottom: 30,
    },
    historyButtonText: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '700', color: Colors.TextMuted },
    subscriptionActions: {
        gap: 12,
        marginBottom: 16,
    },

    upgradeButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        borderRadius: 20,
        gap: 10,
        backgroundColor: Colors.PrimaryColor,
    },

    upgradeButtonText: {
        color: "#FFF",
        fontSize: 15,
        fontWeight: "800",
    },

    cancelButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: Colors.Danger,
        gap: 10,
        backgroundColor: "rgba(231, 76, 60, 0.05)",
    },

    cancelButtonText: {
        color: Colors.Danger,
        fontSize: 15,
        fontWeight: "800",
    },

});

export default function CurrentPlanScreen() {
    return (
        <PageTourProvider>
            <CurrentPlanContent/>
        </PageTourProvider>
    );
}


const usageStyles = StyleSheet.create({
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
    },
    leftContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(23, 101, 53, 0.05)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    itemName: { fontSize: 15, color: Colors.TextDark, fontWeight: '700' },
    itemValue: { fontSize: 15, fontWeight: '600' },
});

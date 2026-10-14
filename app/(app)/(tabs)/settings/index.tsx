import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {ActivityIndicator, Alert, AppState, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {RFValue} from "react-native-responsive-fontsize";
import {AntDesign, Feather, Ionicons, MaterialIcons, Octicons} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {router, useFocusEffect} from "expo-router";
import {widthPercentageToDP as wp,} from "react-native-responsive-screen";
import {useTranslation} from 'react-i18next';
import {COLORS} from "@/constants/colors";
import {SPACING} from "@/constants/theme";
import {getAppSelectedLanguage, languageDataList} from "@/components/i18n";
import {ProTypes} from "@/constants/protypes";
import {
    a2j_partner_terms,
    cancellationPolicy,
    faqs,
    getAuthToken,
    hr_legal_terms,
    lawyer_and_law_firm_terms,
    privacy_policy_url,
    standard_user_terms
} from "@/services/httpservice";
import Purchases from 'react-native-purchases';
import {removeTokenData} from "@/constants/Utility";
import {useApp} from "@/contexts/AppContext";
import {FreemiumBanner} from "@/components/subscription/FreemiumBanner";
import {buyDailyPass} from "@/services/subscriptionHelper";
import {handleSubscriptionSync} from "@/services/subscriptionManager";
import ConsultationService from "@/services/ConsultationService";
import * as WebBrowser from "expo-web-browser";
import {setCurrentRoute} from "@/utils/navigationState";
import {deleteDevice, unRegisterDevice} from "@/services/apiHelper";
import UserServices from "@/services/UserServices";
import Analytics from "@/helpers/AnalyticsHelper";
import PageTourProvider from "@/app/(app)/manage/PageTourProvider";
import TourHighlight from "../../manage/TourHighlight";
import {useTour} from "@/app/(app)/manage/useTour";
import {useTourGuideController} from "rn-tourguide";
import {requireIdentityVerification} from "@/services/identityVerificationGate";

const LOGOUT_STORAGE_KEYS = [
    "conversation_id",
    "conversations",
    "auth_token",
    "auth_user",
    "user_type",
    "isOnBoarded",
] as const;

const formatDateAPI = (isoString: string): string => {
    const date = new Date(isoString);
    return date
        .toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        })
        .replace(",", "");
};

const Settings = () => {
    // const version = Constants.expoConfig?.version
    // const androidVersionCode = Constants.expoConfig?.android?.versionCode;
    // const iosBuildNumber = Constants.expoConfig?.ios?.buildNumber;

    const {t} = useTranslation();
    const {isProUser, walletData, refreshPlanInfo, resetAppState, languageUpdated} = useApp();

    const appState = useRef(AppState.currentState);

    const [activePlanName, setActivePlanName] = useState<string | null>(null);
    const [expiryDate, setExpiryDate] = useState<string | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState(languageDataList[0]);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isStripeConnected, setIsStripeConnected] = useState<boolean>(false);
    const [isStripeConnecting, setIsStripeConnecting] = useState(false);
    const [isOpeningStripeDashboard, setIsOpeningStripeDashboard] = useState(false);
    const stripeStatusCheckRef = useRef<Promise<void> | null>(null);
    const lastStripeStatusCheckAtRef = useRef(0);

    const [userType, setUserType] = useState<string | null>(null);
    const [userTypeReady, setUserTypeReady] = useState(false);

    const scrollRef = useRef<ScrollView>(null);
    const logoutYRef = useRef<number>(0);      // stores Y position of logout zone
    const stripeYRef = useRef<number>(0);      // stores Y position of stripe zone

    const {eventEmitter} = useTourGuideController();

    const [isNotificationOn, setIsNotificationOn] = useState<boolean>(false);


    const selectedUrl = useMemo(() => {
        switch (userType) {
            case ProTypes.LAWYER:
            case ProTypes.LAW_FIRM:
                return lawyer_and_law_firm_terms;
            case ProTypes.HR_LEGAL:
                return hr_legal_terms;
            case ProTypes.A2J_PARTNERS:
                return a2j_partner_terms;
            default:
                return standard_user_terms;
        }
    }, [userType]);

    const isLawyerOrFirm = useMemo(
        () => userType === ProTypes.LAWYER || userType === ProTypes.LAW_FIRM,
        [userType]
    );

    useEffect(() => {
        AsyncStorage.getItem("user_type").then((type) => {
            setUserType(type);
            setUserTypeReady((prev) => prev ? prev : true); // only flip once
        });
    }, []);

    useTour("SETTINGS", userTypeReady);

    useEffect(() => {
        if (!eventEmitter) return;

        const handler = (payload: { current: { order: number } } | null | undefined) => {
            // Guard: payload or current can be null when tour finishes/stops
            if (!payload?.current) {
                scrollRef.current?.scrollTo({y: 0, animated: true});
                return;
            }

            const {current} = payload;
            const logoutZone = !isProUser ? 5 : 4;
            const stripeZone = !isProUser ? 4 : 3;

            if (current.order === logoutZone) {
                scrollRef.current?.scrollToEnd({animated: true});
            } else if (current.order === stripeZone) {
                scrollRef.current?.scrollTo({y: stripeYRef.current - 100, animated: true});
            } else {
                scrollRef.current?.scrollTo({y: 0, animated: true});
            }
        };

        eventEmitter.on("stepChange", handler);
        return () => eventEmitter.off("stepChange", handler);
    }, [eventEmitter, isProUser]);

    // Derived value — no state needed, recomputed only when activePlanName changes
    const isSubscribed = useMemo(
        () => !!activePlanName && activePlanName.toLowerCase() !== "basic",
        [activePlanName]
    );

    const checkStripeStatus = useCallback(async () => {
        if (!isLawyerOrFirm) {
            setIsStripeConnected(false);
            return;
        }

        if (stripeStatusCheckRef.current) {
            await stripeStatusCheckRef.current;
            return;
        }

        const now = Date.now();
        if (now - lastStripeStatusCheckAtRef.current < 1500) {
            return;
        }
        lastStripeStatusCheckAtRef.current = now;

        const statusCheck = (async () => {
            try {
                const authToken = await getAuthToken();
                if (!authToken) {
                    console.warn("Skipping Stripe status check: no auth token available.");
                    return;
                }

                const res = await ConsultationService.GetStripeStatus();
                setIsStripeConnected(res?.onboarded ?? false);

                if (res?.onboarded) {
                    const alreadyTracked = await AsyncStorage.getItem("isOnBoarded");
                    if (alreadyTracked === null) {
                        await AsyncStorage.setItem("isOnBoarded", "true");
                        await Analytics.onboardingCompleted();
                    }
                }
            } catch (error) {
                console.log("Stripe status error:", error);
            }
        })();

        stripeStatusCheckRef.current = statusCheck;
        try {
            await statusCheck;
        } finally {
            if (stripeStatusCheckRef.current === statusCheck) {
                stripeStatusCheckRef.current = null;
            }
        }
    }, [isLawyerOrFirm]);

    const handleStripeOnboard = useCallback(async () => {
        if (!isLawyerOrFirm || isStripeConnecting) return;

        setIsStripeConnecting(true);
        try {
            const res = await ConsultationService.StripeOnboard({
                return_url: "",
                refresh_url: "",
            });

            const url = res?.onboarding_url;
            if (!url) throw new Error("Onboarding URL missing");

            await WebBrowser.openBrowserAsync(url);

            // Re-check after browser returns
            setTimeout(checkStripeStatus, 2000);
        } catch (error) {
            console.log("Stripe onboard error:", error);
            Alert.alert(t("error.title"), t("error.error_msg"));
        } finally {
            setIsStripeConnecting(false);
        }
    }, [checkStripeStatus, isLawyerOrFirm, isStripeConnecting, t]);

    const handleStripeDashboard = useCallback(async () => {
        if (!isLawyerOrFirm || isOpeningStripeDashboard) return;

        setIsOpeningStripeDashboard(true);
        try {
            const res = await ConsultationService.GetStripeDashboardLink();
            const url = res?.url;
            if (!url) throw new Error("Stripe dashboard URL missing");

            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                await WebBrowser.openBrowserAsync(url);
            }
        } catch (error) {
            console.log("Stripe dashboard link error:", error);
            Alert.alert(t("error.title"), t("error.error_msg"));
        } finally {
            setIsOpeningStripeDashboard(false);
        }
    }, [isLawyerOrFirm, isOpeningStripeDashboard, t]);


    useFocusEffect(
        useCallback(() => {
            setCurrentRoute("Settings", {session_id: "", referral_id: ""});

            // Sync plan info from wallet data
            if (!walletData) {
                setActivePlanName("Basic");
                setExpiryDate(null);
            } else {
                const subscription = walletData.subscription;
                if (subscription) {
                    setActivePlanName(subscription.plan_name || "Basic");
                    setExpiryDate(
                        subscription.current_period_end
                            ? formatDateAPI(subscription.current_period_end)
                            : null
                    );
                } else {
                    setActivePlanName("Basic");
                    setExpiryDate(null);
                }
            }

            if (isLawyerOrFirm) {
                checkStripeStatus();
            }
        }, [walletData, isLawyerOrFirm, checkStripeStatus])
    );

    useEffect(() => {
        const subscription = AppState.addEventListener("change", (nextAppState) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === "active" &&
                isLawyerOrFirm
            ) {
                checkStripeStatus();
            }
            appState.current = nextAppState;
        });
        return () => subscription.remove();
    }, [checkStripeStatus, isLawyerOrFirm]);


    useEffect(() => {

        if (walletData) return;

        refreshPlanInfo();

        handleSubscriptionSync({
            forceSync: false,
            onSuccess: refreshPlanInfo,
            onError: (error) => console.log(error),
        });

    }, []);

    useEffect(() => {
        let cancelled = false;
        const getSelectedLanguage = async () => {
            const code = await getAppSelectedLanguage();
            if (cancelled) return;
            const found = languageDataList.find((item) => item.code === code);
            setSelectedLanguage(found ?? languageDataList[0]);
        };
        getSelectedLanguage();
        return () => {
            cancelled = true;
        };
    }, [languageUpdated]);

    const safeLogout = useCallback(async () => {
        try {
            const info = await Purchases.getCustomerInfo();
            const isAnonymous = info.originalAppUserId?.startsWith("$RCAnonymousID");
            if (!isAnonymous) {
                await Purchases.logOut();
            }
        } catch (e) {
            console.error("RevenueCat logout error:", e);
        }
    }, []);

    const performCleanup = useCallback(async () => {
        await safeLogout();
        resetAppState();
        await removeTokenData();
        await AsyncStorage.multiRemove([...LOGOUT_STORAGE_KEYS]);
    }, [safeLogout, resetAppState]);

    const unregisterOrDeleteDevice = useCallback(async (isDelete: boolean) => {
        if (isDelete) {
            await deleteDevice(
                () => console.log("Device deleted successfully"),
                () => console.log("Failed to delete device")
            );
            return;
        }

        const pushToken = await AsyncStorage.getItem("push_token");
        if (!pushToken) {
            console.warn("No push token found, skipping unregister");
            return;
        }

        await unRegisterDevice(
            pushToken,
            () => console.log("Device unregistered successfully"),
            () => console.log("Failed to unregister device")
        );
    }, []);


    const handleLogout = useCallback(
        async (isDelete = false) => {
            try {
                await unregisterOrDeleteDevice(isDelete);
                await performCleanup();
            } catch (error) {
                console.error("Logout failed:", error);
            } finally {
                router.replace("/welcome");
            }
        },
        [unregisterOrDeleteDevice, performCleanup]
    );

    const handleDeleteAccount = useCallback(() => {
        Alert.alert(t("delete_account"), t("delete_confirmation_message"), [
            {text: t("cancel"), style: "cancel"},
            {
                text: t("delete"),
                style: "destructive",
                onPress: async () => {
                    try {
                        const response = await UserServices.deleteAccount();
                        if (response.message) Alert.alert(response.message);
                        handleLogout(true);
                    } catch (error) {
                        console.error(error);
                        Alert.alert(t("error.title"), t("delete_account_error_message"));
                    }
                },
            },
        ]);
    }, [t, handleLogout]);

    const handlePressSubscription = useCallback(async () => {
        if (!await requireIdentityVerification()) return;

        if (!isSubscribed) {
            router.push("/(app)/manageSubscription/subscription-plans-screen");
        } else {
            router.push("/(app)/manageSubscription/current-plan-screen");
        }
    }, [isSubscribed]);

    const handleDailyPass = useCallback(async () => {
        if (!await requireIdentityVerification()) return;

        setIsPurchasing(true);
        buyDailyPass(
            t,
            () => {
                refreshPlanInfo();
                setIsPurchasing(false);
            },
            () => setIsPurchasing(false)
        );
    }, [t, refreshPlanInfo]);

    return (
        <SafeAreaView style={styles.container}>
                    {/* --- HEADER --- */}
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            onPress={() => router.replace("/(app)/(tabs)")}
                            style={styles.backButton}
                        >
                            <MaterialIcons name="arrow-back-ios" size={24}/>
                        </TouchableOpacity>
                        <Text style={styles.title} allowFontScaling={false}>
                            {t('setting.settings')}
                        </Text>
                    </View>

                    <ScrollView
                        ref={scrollRef}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                        scrollEventThrottle={16}
                    >

                        {!isProUser && (
                            (!isSubscribed && walletData?.freemium) ? (
                                <TourHighlight
                                    zone={1}
                                    text={t('tour_explore_subscribe_plans')}
                                >
                                    <FreemiumBanner
                                        onUpgrade={handlePressSubscription}
                                        response={walletData}
                                        onDailyPass={handleDailyPass}
                                    />
                                </TourHighlight>
                            ) : (
                                <TourHighlight
                                    zone={1}
                                    title={isSubscribed ? "" : ""}
                                    text={t('tour_explore_upgrade_plans')}
                                >
                                    <TouchableOpacity
                                        style={[styles.subscriptionCard, !isSubscribed && styles.promoCard]}
                                        onPress={handlePressSubscription}
                                        activeOpacity={0.9}
                                    >
                                        <View style={styles.cardHeader}>
                                            <View style={styles.iconCircle}>
                                                <MaterialIcons
                                                    name={isSubscribed ? "verified" : "stars"}
                                                    size={24}
                                                    color={COLORS.PrimaryColorText}
                                                />
                                            </View>
                                            <View style={styles.cardTextContent}>
                                                <Text style={styles.cardLabel}>{t("current_plan")}</Text>
                                                <Text style={styles.planName}>{activePlanName}</Text>
                                            </View>
                                            <Ionicons
                                                name="chevron-forward"
                                                size={20}
                                                color={COLORS.PrimaryColorText}
                                            />
                                        </View>
                                        {activePlanName && expiryDate && (
                                            <Text style={styles.expiryText}>
                                                {t("expires", {expiryDate})}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </TourHighlight>
                            )
                        )}

                        {/* --- LANGUAGE --- */}
                        <TourHighlight
                            zone={isProUser ? 1 : 2}
                            title={t('tour_language_title')}
                            text={t('tour_language_desc')}
                        >
                            <TouchableOpacity
                                onPress={() => router.push("/(app)/manage/selectLanguage")}
                                style={styles.languageRow}
                            >
                                <View style={[styles.toggleRow, {gap: wp(5)}]}>
                                    <Text style={[styles.text, styles.languageLabel]}>
                                        {t("setting.select_language")}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={24} color={COLORS.SecodaryColor}/>
                                </View>
                                <Text style={styles.description}>
                                    {selectedLanguage?.name ?? "English"}
                                </Text>
                            </TouchableOpacity>
                        </TourHighlight>

                        {/* --- NOTIFICATIONS --- */}
                        {/* <View style={{gap: wp(5), marginTop: SPACING.lg}}>
                            <View style={styles.toggleRow}>
                                <Text style={styles.text}>{t('setting.notifications')}</Text>
                                <View style={{paddingHorizontal: SPACING.md}}>
                                    <CustomeSwitch
                                        isActive={isNotificationOn}
                                        onPress={() => setIsNotificationOn((prev) => !prev)}
                                    />
                                </View>
                            </View>
                        </View>*/}

                        {/* --- MENU ITEMS --- */}
                        <View style={styles.menuSection}>
                            {/* Account */}
                            {!isProUser && (

                                <View>
                                    <Text style={styles.text}>{t("tab.account")}</Text>

                                    <TourHighlight
                                        zone={3}
                                        title={t('tour_current_plan_title')}
                                        text={t('tour_current_plan_desc')}
                                    >
                                        <View style={styles.menuItem}>
                                            <AntDesign name="star" size={wp(5)} color="black"/>
                                            <TouchableOpacity
                                                onPress={() =>
                                                    router.push(
                                                        "/(app)/manageSubscription/current-plan-screen"
                                                    )
                                                }
                                            >
                                                <Text style={styles.menuText}>{t("current_plan")}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </TourHighlight>

                                    {isSubscribed && !walletData?.freemium && (
                                        <TourHighlight
                                            zone={4}
                                            title={t('tour_wallet_title')}
                                            text={t('tour_wallet_desc')}
                                        >
                                            <View style={styles.menuItem}>
                                                <AntDesign name="wallet" size={wp(5)} color="black"/>
                                                <TouchableOpacity
                                                    onPress={() =>
                                                        router.push(
                                                            "/(app)/manageSubscription/WalletScreen"
                                                        )
                                                    }
                                                >
                                                    <Text style={styles.menuText}>
                                                        {t("subscription.wallet_title")}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </TourHighlight>

                                    )}

                                </View>
                            )}

                            {isLawyerOrFirm && (
                                <View
                                    onLayout={(e) => {
                                        stripeYRef.current = e.nativeEvent.layout.y;
                                    }}
                                >
                                    <TourHighlight
                                        zone={2}
                                        title={"Payments"}
                                        text={
                                            isStripeConnected
                                                ? t('tour_lawyer_stripe_connected')
                                                : t('tour_lawyer_stripe_not_connected')
                                        }
                                    >
                                        <View>
                                            <View style={styles.sectionTitleRow}>
                                                <Text style={styles.text}>{t("payments")}</Text>
                                                <TouchableOpacity
                                                    onPress={() => Alert.alert(
                                                        t("payments"),
                                                        t("payments_instruction", {
                                                            defaultValue: "This area is for setting up Stripe payments and viewing your Stripe earnings.",
                                                        })
                                                    )}
                                                    accessibilityRole="button"
                                                    accessibilityLabel={t("payments_instruction", {
                                                        defaultValue: "This area is for setting up Stripe payments and viewing your Stripe earnings.",
                                                    })}
                                                    hitSlop={{top: 8, right: 8, bottom: 8, left: 8}}
                                                >
                                                    <MaterialIcons
                                                        name="info-outline"
                                                        size={18}
                                                        color={COLORS.Gray}
                                                    />
                                                </TouchableOpacity>
                                            </View>
                                            <View style={styles.menuItem}>
                                                <MaterialIcons
                                                    name="account-balance-wallet"
                                                    size={wp(5)}
                                                    color="black"
                                                />
                                                <TouchableOpacity
                                                    onPress={handleStripeOnboard}
                                                    disabled={isStripeConnected || isStripeConnecting}
                                                    style={styles.stripeButton}
                                                >
                                                    {isStripeConnecting ? (
                                                        <View style={styles.inlineLoading}>
                                                            <ActivityIndicator size="small" color={COLORS.Gray}/>
                                                            <Text style={styles.menuText}>{t("connect_with_stripe")}</Text>
                                                        </View>
                                                    ) : (
                                                        <Text style={styles.menuText}>
                                                            {isStripeConnected
                                                                ? t("stripe_connected")
                                                                : t("connect_with_stripe")}
                                                        </Text>
                                                    )}
                                                </TouchableOpacity>
                                                {isStripeConnected ? (
                                                    <View style={styles.activeBadge}>
                                                        <MaterialIcons
                                                            name="check-circle"
                                                            size={14}
                                                            color="#1E8E3E"
                                                        />
                                                        <Text style={styles.activeBadgeText}>
                                                            {t("active")}
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    <MaterialIcons
                                                        name="chevron-right"
                                                        size={20}
                                                        color="#CCC"
                                                    />
                                                )}
                                            </View>
                                            {isStripeConnected && (
                                                <TouchableOpacity
                                                    onPress={handleStripeDashboard}
                                                    disabled={isOpeningStripeDashboard}
                                                    style={styles.stripeDashboardLink}
                                                    accessibilityRole="link"
                                                >
                                                    {isOpeningStripeDashboard ? (
                                                        <ActivityIndicator size="small" color={COLORS.SecodaryColor}/>
                                                    ) : (
                                                        <Text style={styles.stripeDashboardText}>
                                                            {t("view_earnings_in_stripe", {
                                                                defaultValue: "View earnings in Stripe",
                                                            })}
                                                        </Text>
                                                    )}
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </TourHighlight>
                                </View>
                            )}

                            <View>
                                <Text style={styles.text}>{t("contact_support")}</Text>
                                <View style={styles.menuItem}>
                                    <MaterialIcons name="feedback" size={wp(5)} color="black"/>
                                    <TouchableOpacity
                                        onPress={() => router.push("/(app)/manage/support")}
                                    >
                                        <Text style={styles.menuText}>
                                            {t("setting.submit_feedback")}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() =>
                                        router.push(
                                            `/(app)/terms-and-privacy?terms_endpoint=${faqs}&isFaq=true`
                                        )
                                    }
                                >
                                    <AntDesign name="question-circle" size={wp(5)} color="black"/>
                                    <Text style={styles.menuText}>{t("faqs")}</Text>
                                </TouchableOpacity>
                            </View>

                            <View>
                                <Text style={styles.text}>{t("setting.about")}</Text>
                                <View style={styles.menuItem}>
                                    <Feather name="book-open" size={wp(5)} color="black"/>
                                    <TouchableOpacity
                                        onPress={() => router.push("/(app)/manage/philosophy")}
                                    >
                                        <Text style={styles.menuText}>
                                            {t("setting.our_philosophy")}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View>
                                <Text style={styles.text}>{t("setting.legal")}</Text>
                                <View style={styles.menuItem}>
                                    <Octicons name="checklist" size={wp(5)}/>
                                    <TouchableOpacity
                                        onPress={() =>
                                            router.push(
                                                `/(app)/terms-and-privacy?terms_endpoint=${selectedUrl}`
                                            )
                                        }
                                    >
                                        <Text style={styles.menuText}>
                                            {t("terms_n_conditions")}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.menuItem}>
                                    <MaterialIcons name="privacy-tip" size={wp(5)}/>
                                    <TouchableOpacity
                                        onPress={() =>
                                            router.push(
                                                `/(app)/terms-and-privacy?terms_endpoint=${privacy_policy_url}`
                                            )
                                        }
                                    >
                                        <Text style={styles.menuText}>{t("privacy_policy")}</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.menuItem}>
                                    <MaterialIcons name="policy" size={wp(5)}/>
                                    <TouchableOpacity
                                        onPress={() =>
                                            router.push(
                                                `/(app)/terms-and-privacy?terms_endpoint=${cancellationPolicy}`
                                            )
                                        }
                                    >
                                        <Text style={styles.menuText}>{t("cancellation_policy")}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View
                                onLayout={(e) => {
                                    logoutYRef.current = e.nativeEvent.layout.y;
                                }}
                            >
                                <View style={styles.accountManagement}>
                                    <Text style={styles.text}>{t("setting.account_management")}</Text>
                                    <View style={styles.menuItem}>
                                        <Ionicons name="log-out-outline" size={wp(6)} color="black"/>
                                        <TouchableOpacity onPress={() => handleLogout()}>
                                            <Text style={styles.menuText}>{t("setting.logout")}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.deleteRow}>
                                        <MaterialIcons name="delete-forever" size={wp(6)} color="black"/>
                                        <TouchableOpacity onPress={handleDeleteAccount}>
                                            <Text style={styles.deleteButtonText}>
                                                {t("delete_account")}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>

                    </ScrollView>

                </SafeAreaView>
    );
};

export default React.memo(function SettingsScreen() {
    return (
        <PageTourProvider>
            <Settings/>
        </PageTourProvider>
    );
});

const styles = StyleSheet.create({
    rootView: {flex: 1},
    container: {
        flex: 1,
        backgroundColor: COLORS.BackgroundColor,
        padding: SPACING.md,
    },
    headerRow: {flexDirection: "row", alignItems: "center"},
    backButton: {width: 40, height: 40, justifyContent: "center"},
    title: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(18),
        color: COLORS.PrimaryColorText,
    },
    scrollContent: {flexGrow: 1},
    subscriptionCard: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: COLORS.SecodaryColor,
        marginTop: SPACING.lg,
        shadowColor: COLORS.SecodaryColor,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    promoCard: {
        backgroundColor: COLORS.White,
        borderWidth: 1,
        borderColor: COLORS.GrayLight,
    },
    cardHeader: {flexDirection: "row", alignItems: "center"},
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(3, 49, 38, 0.12)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    cardTextContent: {flex: 1},
    cardLabel: {
        fontSize: RFValue(10),
        fontFamily: "InstrumentSansSemiBold",
        color: COLORS.PrimaryColorText,
        letterSpacing: 1,
    },
    planName: {
        fontSize: RFValue(18),
        fontFamily: "InstrumentSansSemiBold",
        color: COLORS.PrimaryColorText,
    },
    expiryText: {
        fontSize: 10,
        color: COLORS.PrimaryColorText,
        marginTop: 12,
    },
    languageRow: {marginTop: SPACING.md},
    languageLabel: {
        color: COLORS.SecodaryColor,
        textDecorationLine: "underline",
    },
    toggleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    text: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(16),
        color: COLORS.PrimaryColorText,
    },
    sectionTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    menuText: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
        color: COLORS.Gray,
        paddingVertical: SPACING.md,
    },
    menuItem: {flexDirection: "row", alignItems: "center", gap: 5},
    menuSection: {flex: 1, gap: wp(5), marginTop: SPACING.lg},
    description: {
        fontFamily: "InstrumentSansRegular",
        fontSize: RFValue(10),
        color: COLORS.Gray,
    },
    stripeButton: {flex: 1},
    inlineLoading: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    stripeDashboardLink: {
        alignSelf: "flex-start",
        marginLeft: wp(5) + 5,
        paddingVertical: 4,
    },
    stripeDashboardText: {
        color: COLORS.SecodaryColor,
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(12),
        textDecorationLine: "underline",
    },
    activeBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#E6F4EA",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    activeBadgeText: {
        color: "#1E8E3E",
        fontSize: 11,
        fontWeight: "600",
        marginLeft: 4,
        textTransform: "uppercase",
    },
    accountManagement: {marginBottom: 120},
    deleteRow: {flexDirection: "row", alignItems: "center", marginTop: 8},
    versionContainer: {
        alignItems: "center",
        position: "absolute",
        start: 0,
        end: 0,
        bottom: Platform.OS === "ios" ? 65 : 85,
    },
    secondaryButtonText: {
        color: COLORS.Gray,
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(12),
        marginTop: 8,
    },
    deleteButtonText: {
        color: COLORS.Gray,
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
    }
});

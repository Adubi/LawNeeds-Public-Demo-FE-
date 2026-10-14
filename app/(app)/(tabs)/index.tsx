import React, {useCallback, useEffect, useRef, useState} from "react";
import {AppState, Image, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {router, useFocusEffect} from "expo-router";
import {ThemedView} from "@/components/ThemedView";
import {ThemedText} from "@/components/ThemedText";
import {BORDER_RADIUS, FONT_SIZES, SPACING} from "@/constants/theme";
import {useThemeColor} from "@/hooks/useThemeColor";
import {Feather} from "@expo/vector-icons";
import {widthPercentageToDP as wp} from "react-native-responsive-screen";
import {COLORS} from "@/constants/colors";
import {useTranslation} from "react-i18next";
import {RFValue} from "react-native-responsive-fontsize";
import {setCurrentRoute} from "@/utils/navigationState";
import {SafeAreaView} from "react-native-safe-area-context";
import {getNotificationsList} from "@/services/apiHelper";
import TourHighlight from "@/app/(app)/manage/TourHighlight";
import {useTour} from "@/app/(app)/manage/useTour";
import PageTourProvider from "@/app/(app)/manage/PageTourProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Analytics from "@/helpers/AnalyticsHelper";
import {ProTypes} from "@/constants/protypes";

// ─── Inner component — consumes TourGuideProvider context ─────────────────────
function InboxContent() {
    const {t} = useTranslation();
    const primary = useThemeColor({}, "primary");

    const [unreadCount, setUnReadCount] = useState<number>(0);
    const appState = useRef(AppState.currentState);
    const [userTypeReady, setUserTypeReady] = useState(false);
    const [userType, setUserType] = useState<string | null>(null);


    useEffect(() => {
        AsyncStorage.getItem("user_type").then((type) => {
            setUserType(type);
            setUserTypeReady((prev) => prev ? prev : true); // only flip once
        });
    }, []);

    const isProfessional = [
        ProTypes.LAWYER,
        ProTypes.LAW_FIRM,
        ProTypes.HR_LEGAL,
        ProTypes.A2J_PARTNERS,
    ].includes(userType as ProTypes);

    const selectHomeAction = (
        action: "ask_lawneeds_ai" | "find_professional" | "book_consultation",
    ) => {
        void Analytics.homeActionSelected({action});

        if (action === "find_professional") {
            router.push("/(app)/(tabs)/search");
            return;
        }

        router.push({
            pathname: "/chats/chat-screen",
            params: {
                isPrevious: "false",
                ...(action === "book_consultation" ? {startReferral: "true"} : {}),
            },
        });
    };

    useTour("HOME", userTypeReady && !isProfessional);


    const fetchNotifications = useCallback(async () => {
        try {
            const response = await getNotificationsList();
            if (response?.notifications) {
                const unread = response.notifications.filter((item: any) => !item.is_read);
                setUnReadCount(unread.length);
            }
        } catch {
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setCurrentRoute("Main", {session_id: "", referral_id: ""});
            fetchNotifications();
        }, [fetchNotifications])
    );

    useEffect(() => {
        const subscription = AppState.addEventListener("change", (nextState) => {
            if (appState.current.match(/inactive|background/) && nextState === "active") {
                fetchNotifications();
            }
            appState.current = nextState;
        });
        return () => subscription.remove();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
                <View style={{flex: 1}}>
                    {/* ── Header OUTSIDE ScrollView ── */}
                    <ThemedView style={styles.header}>
                        <View/>
                        <TourHighlight
                            zone={1}
                            title={t('tour_notifications_title')}
                            text={t('tour_notifications_desc')}
                            shape="circle"
                        >
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={() => router.push("/(app)/chats/NotificationsScreen")}
                            >
                                <Feather name="bell" size={22} color={primary as string}/>
                                {unreadCount > 0 && (
                                    <View style={styles.notificationBadge}>
                                        <Text style={styles.notificationBadgeText}>
                                            {unreadCount > 99 ? "99+" : unreadCount}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </TourHighlight>
                    </ThemedView>

                    {/* ── Content OUTSIDE ScrollView too ── */}
                    <ThemedView style={styles.content}>
                        <Image
                            source={require("@/assets/images/logo-no-text.png")}
                            style={{width: wp(28), height: wp(28), borderRadius: wp(20)}}
                            resizeMode="cover"
                        />
                        <ThemedText style={styles.welcome} accessibilityRole="header">
                            {t("chat.get_started")}
                        </ThemedText>

                        <ThemedView style={styles.buttonContainer}>
                            <TourHighlight
                                zone={2}
                                title={t('home_actions.ask_ai')}
                                text={t('home_actions.ask_ai_description')}
                                style={styles.tourAction}
                            >
                                <TouchableOpacity
                                    style={styles.button}
                                    accessibilityRole="button"
                                    accessibilityLabel={t('home_actions.ask_ai')}
                                    onPress={() => selectHomeAction("ask_lawneeds_ai")}
                                >
                                    <View style={styles.actionIcon}>
                                        <Feather name="message-circle" size={22} color={primary as string}/>
                                    </View>
                                    <View style={styles.actionCopy}>
                                        <ThemedText style={styles.buttonText}>{t('home_actions.ask_ai')}</ThemedText>
                                        <ThemedText style={styles.buttonDescription}>{t('home_actions.ask_ai_description')}</ThemedText>
                                    </View>
                                    <Feather name="chevron-right" size={22} color={primary as string}/>
                                </TouchableOpacity>
                            </TourHighlight>

                            {!isProfessional && <TourHighlight
                                zone={3}
                                title={t('home_actions.find_professional')}
                                text={t('home_actions.find_professional_description')}
                                style={styles.tourAction}
                            >
                                <TouchableOpacity
                                    style={styles.button}
                                    accessibilityRole="button"
                                    accessibilityLabel={t('home_actions.find_professional')}
                                    onPress={() => selectHomeAction("find_professional")}
                                >
                                    <View style={styles.actionIcon}>
                                        <Feather name="search" size={22} color={primary as string}/>
                                    </View>
                                    <View style={styles.actionCopy}>
                                        <ThemedText style={styles.buttonText}>{t('home_actions.find_professional')}</ThemedText>
                                        <ThemedText style={styles.buttonDescription}>{t('home_actions.find_professional_description')}</ThemedText>
                                    </View>
                                    <Feather name="chevron-right" size={22} color={primary as string}/>
                                </TouchableOpacity>
                            </TourHighlight>}

                            {!isProfessional && <TourHighlight
                                zone={4}
                                title={t('home_actions.book_consultation')}
                                text={t('home_actions.book_consultation_description')}
                                style={styles.tourAction}
                            >
                                <TouchableOpacity
                                    style={styles.button}
                                    accessibilityRole="button"
                                    accessibilityLabel={t('home_actions.book_consultation')}
                                    onPress={() => selectHomeAction("book_consultation")}
                                >
                                    <View style={styles.actionIcon}>
                                        <Feather name="calendar" size={22} color={primary as string}/>
                                    </View>
                                    <View style={styles.actionCopy}>
                                        <ThemedText style={styles.buttonText}>{t('home_actions.book_consultation')}</ThemedText>
                                        <ThemedText style={styles.buttonDescription}>{t('home_actions.book_consultation_description')}</ThemedText>
                                    </View>
                                    <Feather name="chevron-right" size={22} color={primary as string}/>
                                </TouchableOpacity>
                            </TourHighlight>}
                        </ThemedView>
                    </ThemedView>

                </View>
            </SafeAreaView>
    );
}

// ─── Outer shell ──────────────────────────────────────────────────────────────
export default function Inbox() {
    return (
        <PageTourProvider >
            <InboxContent/>
        </PageTourProvider>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: COLORS.BackgroundColor},
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: SPACING.lg,
        backgroundColor: COLORS.BackgroundColor
    },
    headerButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: BORDER_RADIUS.full
    },
    content: {
        flex: 1,
        alignItems: "center",
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
        backgroundColor: COLORS.BackgroundColor
    },
    welcome: {
        fontSize: FONT_SIZES.xl,
        fontFamily: "InstrumentSansSemiBold",
        fontWeight: "400",
        paddingTop: SPACING.lg,
        color: COLORS.PrimaryColor,
        paddingBottom: SPACING.md,
        marginBottom: SPACING.xs
    },
    buttonContainer: {
        flexDirection: "column",
        width: "100%",
        gap: SPACING.md,
        color: COLORS.BackgroundColor,
        backgroundColor: COLORS.BackgroundColor
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 72,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: "#ABABAB",
        gap: SPACING.md,
        backgroundColor: COLORS.BackgroundColor
    },
    tourAction: {width: "100%"},
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.BackgroundColor,
        borderWidth: 1,
        borderColor: "#D8D8D8",
    },
    actionCopy: {flex: 1, gap: 2},
    buttonText: {fontFamily: "InstrumentSansSemiBold", color: COLORS.PrimaryColorText},
    buttonDescription: {fontFamily: "InstrumentSansRegular", color: "#666666", fontSize: RFValue(11), lineHeight: 17},
    secondaryButtonText: {color: COLORS.Gray, fontFamily: "InstrumentSansSemiBold", fontSize: RFValue(12)},
    notificationBadge: {
        position: "absolute",
        top: 4,
        right: 4,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "red",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 3
    },
    notificationBadgeText: {color: "white", fontSize: RFValue(8), fontFamily: "InstrumentSansSemiBold", lineHeight: 16},
});

import React, {useCallback, useEffect, useRef, useState} from "react";
import {
    ActivityIndicator,
    AppState,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {SPACING} from "@/constants/theme";
import {router, useFocusEffect} from "expo-router";
import {Ionicons, MaterialIcons} from "@expo/vector-icons";
import {COLORS} from "@/constants/colors";
import {RFValue} from "react-native-responsive-fontsize";
import {useTranslation} from 'react-i18next';
import RequestList from "@/components/Search/requestList";
import {getLawyerCaseList, getUserCaseList} from "@/services/apiHelper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useApp} from "@/contexts/AppContext";
import {ProTypes} from "@/constants/protypes";
import {getUserData} from "@/constants/Utility";
import {setCurrentRoute} from "@/utils/navigationState";
import TourHighlight from "../../manage/TourHighlight";
import PageTourProvider from "@/app/(app)/manage/PageTourProvider";
import {useBottomTabBarHeight} from "@react-navigation/bottom-tabs";
import {useTour} from "@/app/(app)/manage/useTour";

// ─── Inner component ──────────────────────────────────────────────────────────
function InboxContent() {
    const {t} = useTranslation();

    const [loading, setLoading] = useState(false);
    const [lawyerList, setLawyerList] = useState([]);
    const [pendingList, setPendingList] = useState([]);
    const [isUserPro, setIsUserPro] = useState<boolean | null>(null); // null = not yet resolved
    const [refreshItem, setRefreshItem] = useState(false);
    const [selectedTab, setSelectedTab] = useState<"active" | "pending">("active");
    const [loginUserData, setLoginUserData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const {isCaseListReload, isReloadRequestDetails} = useApp();
    const appState = useRef(AppState.currentState);


    useTour("INBOX", true);

    useFocusEffect(
        useCallback(() => {
            setCurrentRoute("Inbox", {session_id: "", referral_id: ""});
        }, [])
    );

    const isProUser = async (): Promise<boolean> => {
        const userType = await AsyncStorage.getItem("user_type");
        if (!userType) return false;
        return [
            ProTypes.LAWYER,
            ProTypes.LAW_FIRM,
            ProTypes.HR_LEGAL,
            ProTypes.A2J_PARTNERS,
        ].includes(userType as ProTypes);
    };

    const handleRefreshActive = async () => {
        setRefreshing(true);
        await getLawyerCaseList(
            true,
            (response: any) => setLawyerList(response),
            (error: any) => console.log("error", error),
            () => setRefreshing(false)
        );
    };

    const handleRefreshPending = async () => {
        setRefreshing(true);
        await getLawyerCaseList(
            false,
            (response: any) => {
                setPendingList(
                    response.sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )
                );
            },
            (error: any) => console.log("error", error),
            () => setRefreshing(false)
        );
    };

    const handleRefreshUser = async () => {
        setRefreshing(true);
        await getUserCaseList(
            (response: any) => {
                setLawyerList(response.filter((item: any) => item.lawyer_name !== null));
            },
            (error: any) => console.log("error", error),
            () => setRefreshing(false)
        );
    };

    const getListData = async () => {
        setLoading(true);
        const pro = await isProUser();
        setIsUserPro(pro);

        if (pro) {
            await getLawyerCaseList(
                true,
                (response: any) => setLawyerList(response),
                (error: any) => console.log("error", error),
                () => setRefreshing(false)
            );
            await getLawyerCaseList(
                false,
                (response: any) => {
                    setPendingList(
                        response.sort((a: any, b: any) =>
                            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                        )
                    );
                },
                (error: any) => console.log("error", error),
                () => setLoading(false)
            );
        } else {
            await getUserCaseList(
                (response: any) => {
                    setLawyerList(response.filter((item: any) => item.lawyer_name !== null));
                },
                (error: any) => console.log("error", error),
                () => setLoading(false)
            );
        }
    };

    useEffect(() => {
        (async () => {
            const userData = await getUserData();
            if (userData !== null) setLoginUserData(userData);
        })();
    }, []);

    useEffect(() => {
        getListData();
    }, [isCaseListReload, refreshItem, isReloadRequestDetails]);

    useEffect(() => {
        const subscription = AppState.addEventListener("change", (nextState) => {
            if (appState.current.match(/inactive|background/) && nextState === "active") {
                getListData();
            }
            appState.current = nextState;
        });
        return () => subscription.remove();
    }, []);

    const navigateToDetails = (item: any, forceSessionId?: string) => {
        const updatedItem = {...item, isUserPro};
        router.push({
            pathname: "/(app)/requestFlow/RequestDetails",
            params: {
                data: JSON.stringify(updatedItem),
                referral_id: updatedItem.referral_id,
                session_id: forceSessionId ?? updatedItem.session_id ?? "",
                isUserPro: String(isUserPro),
            },
        });
    };

    // Don't render zones until we know user type — prevents wrong zone count
    if (isUserPro === null) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator
                    size="small"
                    color={COLORS.PrimaryColorText}
                    style={styles.loader}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>

                {/* ── Header ───────────────────────────────────────────── */}
                <View style={styles.header}>
                    <View style={styles.headerTitleContainer}>
                        <TouchableOpacity
                            onPress={() => router.replace("/(app)/(tabs)")}
                            style={styles.backButton}
                            accessibilityRole="button"
                            accessibilityLabel={t('change_email.go_back')}
                        >
                            <MaterialIcons name="arrow-back-ios" size={24}/>
                        </TouchableOpacity>
                        <Text style={styles.title} allowFontScaling={false}>
                            {t('tab.inbox')}
                        </Text>
                    </View>

                    {/*
                        Zone 1 — language icon (top-right)
                        keepTooltipPosition=false so tooltip renders at
                        screen center instead of anchored to the icon
                    */}
                    <TourHighlight
                        zone={1}
                        title={t('tour_language_title')}
                        text={t('tour_language_desc')}
                        keepTooltipPosition={false}
                        shape="circle"
                        style={{width: 40, height: 40}}   // ← explicit size = correct spotlight
                    >
                        <TouchableOpacity
                            onPress={() =>
                                router.push({
                                    pathname: "/(app)/manage/selectLanguage",
                                    params: {from: "/(app)/(tabs)/inbox"},
                                })
                            }
                            style={styles.languageButton}
                            accessibilityRole="button"
                            accessibilityLabel={t('setting.select_language')}
                        >
                            <Ionicons name="language-outline" size={24} color={COLORS.PrimaryColorText}/>
                        </TouchableOpacity>
                    </TourHighlight>
                </View>

                {/* ── Pro: active / pending tabs — Zone 2 ──────────────── */}
                {isUserPro && (
                    <TourHighlight zone={2} text="Switch between your active and pending legal requests.">
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tabButton, selectedTab === "active" && styles.activeTab]}
                                onPress={() => setSelectedTab("active")}
                            >
                                <Text style={[styles.tabText, selectedTab === "active" && styles.activeTabText]}>
                                    {t('active')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tabButton, selectedTab === "pending" && styles.activeTab]}
                                onPress={() => setSelectedTab("pending")}
                            >
                                <Text style={[styles.tabText, selectedTab === "pending" && styles.activeTabText]}>
                                    {t('pending')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TourHighlight>
                )}

                {/* ── List area ────────────────────────────────────────── */}
                {/*
                    Zone numbering:
                      Pro user   → zone 1 (language), zone 2 (tabs), zone 3 (list)
                      Normal user → zone 1 (language), zone 2 (list)   ← no gap
                */}
                <View style={{flex: 1, backgroundColor: COLORS.White, marginBottom: 60}}>
                    {isUserPro ? (
                        // ── PRO: active tab ───────────────────────────────
                        selectedTab === "active" ? (
                            lawyerList.length > 0 ? (
                                    <RequestList
                                        isActive={true}
                                        setRefreshItem={() => setRefreshItem(p => !p)}
                                        loginUserData={loginUserData}
                                        data={lawyerList}
                                        isProUser={isUserPro}
                                        onListItemClick={(item: any) => navigateToDetails(item)}
                                        refreshControl={
                                            <RefreshControl
                                                refreshing={refreshing}
                                                onRefresh={handleRefreshActive}
                                                colors={[COLORS.PrimaryColorText]}
                                            />
                                        }
                                    />
                            ) : (
                                    <ScrollView
                                        contentContainerStyle={styles.emptyContainer}
                                        refreshControl={
                                            <RefreshControl
                                                refreshing={refreshing}
                                                onRefresh={handleRefreshActive}
                                                colors={[COLORS.PrimaryColorText]}
                                            />
                                        }
                                    >
                                        <Text style={styles.emptyText}>{t('no_active_cases_available')}</Text>
                                    </ScrollView>
                            )
                        ) : (
                            // ── PRO: pending tab ──────────────────────────
                            pendingList.length > 0 ? (
                                    <RequestList
                                        isActive={false}
                                        setRefreshItem={() => setRefreshItem(p => !p)}
                                        loginUserData={loginUserData}
                                        data={pendingList}
                                        isProUser={isUserPro}
                                        onListItemClick={(item: any) => navigateToDetails(item)}
                                        refreshControl={
                                            <RefreshControl
                                                refreshing={refreshing}
                                                onRefresh={handleRefreshPending}
                                                colors={[COLORS.PrimaryColorText]}
                                            />
                                        }
                                    />
                            ) : (
                                    <ScrollView
                                        contentContainerStyle={styles.emptyContainer}
                                        refreshControl={
                                            <RefreshControl
                                                refreshing={refreshing}
                                                onRefresh={handleRefreshPending}
                                                colors={[COLORS.PrimaryColorText]}
                                            />
                                        }
                                    >
                                        <Text style={styles.emptyText}>{t('no_pending_cases_available')}</Text>
                                    </ScrollView>
                            )
                        )
                    ) : (
                        // ── REGULAR USER: single list — zone 2 (no tabs) ──
                        lawyerList.length > 0 ? (
                                <RequestList
                                    isActive={false}
                                    data={lawyerList}
                                    isProUser={isUserPro}
                                    setRefreshItem={() => setRefreshItem(p => !p)}
                                    loginUserData={loginUserData}
                                    onListItemClick={(item: any) => navigateToDetails(item, "")}
                                    refreshControl={
                                        <RefreshControl
                                            refreshing={refreshing}
                                            onRefresh={handleRefreshUser}
                                            colors={[COLORS.PrimaryColorText]}
                                        />
                                    }
                                />
                        ) : (
                                <ScrollView
                                    contentContainerStyle={styles.emptyContainer}
                                    refreshControl={
                                        <RefreshControl
                                            refreshing={refreshing}
                                            onRefresh={handleRefreshUser}
                                            colors={[COLORS.PrimaryColorText]}
                                        />
                                    }
                                >
                                    <Text style={styles.emptyText}>{t('no_cases_available')}</Text>
                                </ScrollView>
                        )
                    )}
                </View>

                {loading && (
                    <ActivityIndicator
                        size="small"
                        color={COLORS.PrimaryColorText}
                        style={styles.loader}
                    />
                )}

            </SafeAreaView>
    );
}

// ─── Outer shell ──────────────────────────────────────────────────────────────
export default function Index() {
    return (
        <PageTourProvider >
            <InboxContent/>
        </PageTourProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BackgroundColor,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: SPACING.md,
    },
    headerTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
    },
    languageButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(18),
        color: COLORS.PrimaryColorText,
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: COLORS.White,
        borderBottomWidth: 1,
        borderColor: COLORS.GrayLight,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
    },
    tabText: {
        fontSize: RFValue(14),
        color: COLORS.GrayDark,
        fontFamily: "InstrumentSansRegular",
    },
    activeTab: {
        borderBottomWidth: 2,
        borderColor: COLORS.PrimaryColorText,
    },
    activeTabText: {
        color: COLORS.PrimaryColorText,
        fontFamily: "InstrumentSansSemiBold",
    },
    loader: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyText: {
        fontSize: RFValue(14),
        color: COLORS.GrayDark,
        fontFamily: "InstrumentSansRegular",
    },
});

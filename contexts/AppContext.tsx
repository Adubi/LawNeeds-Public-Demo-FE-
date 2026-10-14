import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {TopUpModalProps} from "@/components/subscription/TopUpModal";
import {getUserPlan, syncTopUpOrDailyPass} from "@/services/subscriptionHelper";
import Purchases from "react-native-purchases";
import {Alert} from "react-native";
import {UserPlanData} from "@/components/subscription/userPlan";
import Analytics from "@/helpers/AnalyticsHelper";

type TopUpData = Omit<TopUpModalProps, "isVisible" | "onClose">;

type BannerData = {
    visible: boolean;
    title: string;
    body: string;
    type?: "payment" | "referral" | "message" | "default";
    data?: any; // for navigation
};
type ExtendTimerData = {
    visible: boolean;
    referral_id: string;
    session_id: string;
    shownOnce?: boolean; // prevent showing twice
};


type AppContextType = {
    hasAcceptedTerms: boolean;
    setHasAcceptedTerms: (accepted: boolean) => void;

    hasAcceptedAnalytics: boolean;
    setHasAcceptedAnalytics: (accepted: boolean) => void;

    hasAcceptedPrivacyPolicy: boolean;
    setHasAcceptedPrivacyPolicy: (accepted: boolean) => void;

    setRefreshReloadCaseList: () => void;
    isCaseListReload: boolean;

    isReloadRequestDetails: number;
    consultationTimerRefreshKey: number;
    setReloadRequestDetails: () => void;

    setCommentsReload: () => void;
    isCommentsReload: boolean;

    isTopUpVisible: boolean;
    topUpData: TopUpData | null;
    openTopUp: (data: TopUpData) => void;
    closeTopUp: () => void;

    purchaseTopUp: (productId: string) => void;

    refreshConsultationTimer: () => void;
    isConsultationActive: boolean;
    setConsultationActive: (active: boolean) => void;
    triggerOneMinuteWarning: () => void;

    showTopUpView: (show: boolean) => void;
    showPremiumTopUpView: (show: boolean) => void;
    showAdsPopupView: (show: boolean) => void;

    isShowTopUpView: boolean;
    isShowPremiumTopUpView: boolean;
    isShowAdsView: boolean;

    resetAppState: () => void;

    walletData?: UserPlanData;
    refreshPlanInfo: () => void;

    isProUser: boolean;
    setUserStatus: (status: boolean) => void;

    offeringData: any;
    getOfferingList: () => void;

    // 🔔 Notifications
    unreadNotifications: number;
    addNotification: () => void;
    clearNotifications: () => void;
    markOneAsRead: () => void;

    banner: BannerData | null;
    showBanner: (payload: Omit<BannerData, "visible">) => void;
    hideBanner: () => void;

    languageUpdated: number;
    triggerLanguageUpdate: () => void;

    extendTimerData: ExtendTimerData | null;
    showExtendTimer: (referral_id: string, session_id: string) => void;
    hideExtendTimer: () => void;
    onExtendTimerSelect: ((minutes: number) => void) | null;
    setOnExtendTimerSelect: (fn: ((minutes: number) => void) | null) => void;

};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [unreadNotifications, setUnreadNotifications] = useState(0);

    const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
    const [hasAcceptedAnalytics, setHasAcceptedAnalytics] = useState(false);
    const [hasAcceptedPrivacyPolicy, setHasAcceptedPrivacyPolicy] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [isCaseListReload, setReloadCaseList] = useState(true);
    const [isReloadRequestDetails, setReloadRequestDetails] = useState(0);
    const [isCommentsReload, setCommentsReload] = useState(true);

    const [consultationTimerRefreshKey, setConsultationTimerRefreshKey] = useState(0);

    const [isTopUpVisible, setIsTopUpVisible] = useState(false);
    const [topUpData, setTopUpData] = useState<TopUpData | null>(null);

    const [isProUser, setProUser] = useState(false);

    const [walletData, setWalletData] = useState<UserPlanData>();
    const [isReloadPlanInfo, setReloadPlanInfo] = useState(false);

    const [isShowTopUpView, setShowTopUpView] = useState(false);
    const [isShowPremiumTopUpView, setShowPremiumTopUpView] = useState(false);
    const [isShowAdsView, setShowAdsView] = useState(false);

    const [offeringData, setOfferingData] = useState<any>();
    const [banner, setBanner] = useState<BannerData | null>(null);

    const [isConsultationActive, setIsConsultationActive] = useState(false);
    const [languageUpdated, setLanguageUpdated] = useState(0);

    const [extendTimerData, setExtendTimerData] = useState<ExtendTimerData | null>(null);
    const [onExtendTimerSelect, setOnExtendTimerSelectState] = useState<((minutes: number) => void) | null>(null);

    const refreshConsultationTimer = useCallback(() => {
        setConsultationTimerRefreshKey(prev => prev + 1);
    }, []);

    const showExtendTimer = useCallback((referral_id: string, session_id: string) => {
        setExtendTimerData({ visible: true, referral_id, session_id });
    }, []);

    const hideExtendTimer = useCallback(() => {
        setExtendTimerData(null);
    }, []);

    const setOnExtendTimerSelect = useCallback((fn: ((minutes: number) => void) | null) => {
        setOnExtendTimerSelectState(() => fn); // wrap in fn to avoid useState treating it as updater
    }, []);

    const setConsultationActive = useCallback((active: boolean) => {
        setIsConsultationActive(active);
    }, []);


    const triggerLanguageUpdate = useCallback(() => {
        setLanguageUpdated(prev => prev + 1);
    }, []);


    const triggerOneMinuteWarning = useCallback(() => {

        if (isConsultationActive) {
            Alert.alert(
                'Session Ending Soon',
                'Your consultation session will end in 1 minute.',
                [{ text: 'OK' }]
            );
        }
    }, [isConsultationActive]);

    // 🔹 Load stored flags
    useEffect(() => {
        (async () => {
            try {
                const termsAccepted = await AsyncStorage.getItem("hasAcceptedTerms");
                const privacyAccepted = await AsyncStorage.getItem("hasAcceptedPrivacyPolicy");
                const analyticsAccepted = await AsyncStorage.getItem("hasAcceptedAnalytics");

                setHasAcceptedAnalytics(analyticsAccepted === "true");
                setHasAcceptedTerms(termsAccepted === "true");
                setHasAcceptedPrivacyPolicy(privacyAccepted === "true");
            } catch (e) {
                console.error("Error loading data:", e);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const showBanner = useCallback((payload: Omit<BannerData, "visible">) => {
        setBanner({ visible: true, ...payload });

        // auto hide after 4 sec
        setTimeout(() => {
            setBanner(null);
        }, 10000);
    }, []);

    const hideBanner = useCallback(() => {
        setBanner(null);
    }, []);

    const addNotification = useCallback(() => {
        setUnreadNotifications(prev => prev + 1);
    }, []);

    const clearNotifications = useCallback(() => {
        setUnreadNotifications(0);
    }, []);

    const markOneAsRead = useCallback(() => {
        setUnreadNotifications(prev => (prev > 0 ? prev - 1 : 0));
    }, []);

    // 🔹 Fetch plan info
    const updateUsageInfo = useCallback(() => {
        getUserPlan(
            (res: any) => {
                if (!res) return;
                setWalletData(res);
            },
            () => {}
        );
    }, []);

    useEffect(() => {
        updateUsageInfo();
    }, [isReloadPlanInfo, updateUsageInfo]);

    // 🔹 Reload triggers
    const setRefreshReloadCaseList = useCallback(() => {
        setReloadCaseList(prev => !prev);
    }, []);

    const toggleRequestDetailsReload = useCallback(() => {
        setReloadRequestDetails(prev => prev + 1);
    }, []);

    const setCommentsRefresh = useCallback(() => {
        setCommentsReload(prev => !prev);
    }, []);

    const refreshPlanInfo = useCallback(() => {
        setReloadPlanInfo(prev => !prev);
    }, []);

    // 🔹 User status
    const setUserStatus = useCallback((status: boolean) => {
        setProUser(status);
    }, []);

    const resetAppState = useCallback(() => {
        setWalletData(undefined);
        setProUser(false);
        setOfferingData(undefined);

        // optional resets (recommended)
        setUnreadNotifications(0);
        setIsTopUpVisible(false);
        setTopUpData(null);

        setShowTopUpView(false);
        setShowPremiumTopUpView(false);
        setShowAdsView(false);
        setIsConsultationActive(false);
    }, []);

    // 🔹 Offerings
    const getOfferingList = useCallback(async () => {
        try {
            const offerings = await Purchases.getOfferings();
            const offering = offerings.all["freemium_upsell"];
            if (offering) {
                setOfferingData(offering.availablePackages);
            }
        } catch (e) {
            console.log("Offerings error", e);
        }
    }, []);

    // 🔹 Purchase
    const purchaseTopUp = useCallback(async (productId: string) => {
        try {
            const offerings = await Purchases.getOfferings();
            const offering = offerings.all["freemium_upsell"];
            if (!offering) {
                Analytics.purchaseFailed({
                    planType: 'topup',
                    packageId: productId,
                    source: 'top_up',
                    reason: 'offering_not_found',
                });
                return;
            }

            const pkg = offering.availablePackages.find(p => p.identifier === productId);
            if (!pkg) {
                Analytics.purchaseFailed({
                    planType: 'topup',
                    packageId: productId,
                    source: 'top_up',
                    reason: 'package_not_found',
                });
                Alert.alert("Error", "Product not found");
                return;
            }

            Analytics.purchaseAttempted({
                planType: 'topup',
                price: pkg.product.price,
                currency: pkg.product.currencyCode,
                productId: pkg.product.identifier,
                packageId: pkg.identifier,
                source: 'top_up',
            });

            const { transaction } = await Purchases.purchasePackage(pkg);

            Analytics.planPurchased({
                planType: 'topup',
                price: pkg.product.price,
                currency: pkg.product.currencyCode,
                productId: pkg.product.identifier,
                packageId: pkg.identifier,
                transactionId: transaction?.transactionIdentifier,
                source: 'top_up',
            });

            setShowTopUpView(false);
            Alert.alert("Success", "Top-up purchased!");

            syncTopUpOrDailyPass(transaction, () => {
                refreshPlanInfo();
            }, ()=> {

            });

        } catch (e: any) {
            Analytics.purchaseFailed({
                planType: 'topup',
                packageId: productId,
                source: 'top_up',
                reason: e?.message ?? 'top_up_purchase_failed',
                userCancelled: e?.userCancelled ?? false,
            });
            if (!e.userCancelled) {
                Alert.alert("Purchase failed", e.message);
            }
        }
    }, [refreshPlanInfo]);

    // 🔹 UI toggles
    const showTopUpView = useCallback((v: boolean) => setShowTopUpView(v), []);
    const showPremiumTopUpView = useCallback((v: boolean) => setShowPremiumTopUpView(v), []);
    const showAdsPopupView = useCallback((v: boolean) => setShowAdsView(v), []);

    // 🔹 Storage setters
    const handleSetHasAcceptedTerms = useCallback(async (accepted: boolean) => {
        await AsyncStorage.setItem("hasAcceptedTerms", String(accepted));
        setHasAcceptedTerms(accepted);
    }, []);

    const handleSetHasAnalytics = useCallback(async (accepted: boolean) => {
        await AsyncStorage.setItem("hasAcceptedAnalytics", String(accepted));
        setHasAcceptedAnalytics(accepted);
    }, []);

    const handleSetHasAcceptedPrivacyPolicy = useCallback(async (accepted: boolean) => {
        await AsyncStorage.setItem("hasAcceptedPrivacyPolicy", String(accepted));
        setHasAcceptedPrivacyPolicy(accepted);
    }, []);

    // 🔹 TopUp modal
    const openTopUp = useCallback((data: TopUpData) => {
        setTopUpData(data);
        setIsTopUpVisible(true);
    }, []);

    const closeTopUp = useCallback(() => {
        setIsTopUpVisible(false);
        setTopUpData(null);
    }, []);

    const value = useMemo(() => ({
        hasAcceptedTerms,
        setHasAcceptedTerms: handleSetHasAcceptedTerms,
        hasAcceptedAnalytics,
        setHasAcceptedAnalytics: handleSetHasAnalytics,
        hasAcceptedPrivacyPolicy,
        setHasAcceptedPrivacyPolicy: handleSetHasAcceptedPrivacyPolicy,

        setRefreshReloadCaseList,
        isCaseListReload,

        isReloadRequestDetails,
        setReloadRequestDetails: toggleRequestDetailsReload,
        refreshConsultationTimer,
        consultationTimerRefreshKey,
        isCommentsReload,
        setCommentsReload: setCommentsRefresh,

        isTopUpVisible,
        topUpData,
        openTopUp,
        closeTopUp,

        banner,
        showBanner,
        hideBanner,

        purchaseTopUp,

        isShowTopUpView,
        showTopUpView,
        isShowPremiumTopUpView,
        showPremiumTopUpView,
        isShowAdsView,
        showAdsPopupView,

        walletData,
        refreshPlanInfo,

        isProUser,
        setUserStatus,

        resetAppState,

        offeringData,
        getOfferingList,

        // 🔔 Notifications
        unreadNotifications,
        addNotification,
        clearNotifications,
        markOneAsRead,
        isConsultationActive,
        setConsultationActive,
        triggerOneMinuteWarning,
        languageUpdated,
        triggerLanguageUpdate,

        extendTimerData,
        showExtendTimer,
        hideExtendTimer,
        onExtendTimerSelect,
        setOnExtendTimerSelect,

    }), [
        hasAcceptedTerms,
        hasAcceptedPrivacyPolicy,
        hasAcceptedAnalytics,
        isCaseListReload,
        isReloadRequestDetails,
        isCommentsReload,
        isTopUpVisible,
        topUpData,
        isShowTopUpView,
        resetAppState,
        isShowPremiumTopUpView,
        isShowAdsView,
        walletData,
        isProUser,
        offeringData,
        banner,
        unreadNotifications,
        isConsultationActive,
        languageUpdated,
        triggerLanguageUpdate,
        showBanner,
        hideBanner,
        addNotification,
        clearNotifications,
        markOneAsRead,
        setConsultationActive,
        triggerOneMinuteWarning,
        refreshPlanInfo,
        setUserStatus,
        getOfferingList,
        purchaseTopUp,
        openTopUp,
        closeTopUp,
        showTopUpView,
        showPremiumTopUpView,
        showAdsPopupView,
        setRefreshReloadCaseList,
        toggleRequestDetailsReload,
        setCommentsRefresh,
        handleSetHasAcceptedTerms,
        handleSetHasAnalytics,
        handleSetHasAcceptedPrivacyPolicy,
        consultationTimerRefreshKey,
        refreshConsultationTimer,
        extendTimerData,
        showExtendTimer,
        hideExtendTimer,
        onExtendTimerSelect,
        setOnExtendTimerSelect,
    ]);

    if (isLoading) return null;

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useApp must be used within an AppProvider");
    }
    return context;
}

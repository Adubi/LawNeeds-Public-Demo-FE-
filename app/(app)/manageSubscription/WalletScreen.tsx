import React, {useEffect, useState} from "react";
import {ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View,} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {router} from "expo-router";
import {getUserPlan} from "@/services/subscriptionHelper";
import {useApp} from "@/contexts/AppContext";
import TopUpModal from "@/components/subscription/TopUpModal";
import {MaterialIcons} from "@expo/vector-icons";
import Purchases from "react-native-purchases";
import {useTranslation} from "react-i18next";
import {getUserData} from "@/constants/Utility";
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

const WalletContent = () => {

    const {t} = useTranslation();

    const {
        isShowTopUpView,
        showTopUpView,
    } = useApp();

    useTour("Wallet", true);

    const [walletData, setWalletData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reloadPlan, setReloadPlan] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isPurchasing, setIsPurchasing] = useState(false);


    useEffect(() => {
        const loadTransactions = async () => {
            const data = await getRevenueCatTransactionHistory();
            if (data) {
                setTransactions(data);
            }
        };

        loadTransactions();

    }, [reloadPlan]);


    useEffect(() => {
        setLoading(true)
        getUserPlan(
            (res: any) => {
                setWalletData(res);
                setLoading(false);
            },
            () => setLoading(false)
        );
    }, [reloadPlan]);


    const getRevenueCatTransactionHistory = async () => {
        try {
            const loginUserData = await getUserData();
            const userId = loginUserData?.id?.toString();

            if (!userId) return [];

            const customerInfo = await Purchases.getCustomerInfo();

            const transactions: any[] = [];

            if (customerInfo.allPurchaseDates) {
                Object.keys(customerInfo.allPurchaseDates).forEach((productId) => {
                    const purchaseDate = customerInfo.allPurchaseDates[productId];
                    const expirationDate = customerInfo.allExpirationDates?.[productId] || null;

                    if (!purchaseDate) return;

                    transactions.push({
                        type: "subscription",
                        productId,
                        purchaseDate,
                        expirationDate,
                    });
                });
            }

            if (customerInfo?.nonSubscriptionTransactions?.length) {
                customerInfo.nonSubscriptionTransactions.forEach((txn) => {
                    if (!txn?.purchaseDate) return;

                    transactions.push({
                        type: "non_subscription",
                        productId: txn.productIdentifier,
                        purchaseDate: txn.purchaseDate,
                        transactionId: txn.transactionIdentifier,
                    });
                });
            }

            transactions.sort((a, b) => {
                const dateA = new Date(a.purchaseDate || 0).getTime();
                const dateB = new Date(b.purchaseDate || 0).getTime();
                return dateB - dateA;
            });

            return transactions;

        } catch (error) {
            console.log("RevenueCat Transaction Error:", error);
            return [];
        }
    };

    const formatProductName = (productId: string) => {
        switch (productId) {
            case "standard_weekly":
                return "Standard Weekly Plan";
            case "standard_monthly":
                return "Standard Monthly Plan";
            case "standard_annual":
                return "Standard Annual Plan";
            case "premium_monthly":
                return "Premium Monthly Plan";
            case "premium_annual":
                return "Premium Annual Plan";
            case "topup_5":
                return "Top-Up 5 Minutes";
            case "topup_10":
                return "Top-Up 10 Minutes";
            case "topup_15":
                return "Top-Up 15 Minutes";
            case "topup_20":
                return "Top-Up 20 Minutes";
            case "topup_25":
                return "Top-Up 25 Minutes";
            case "topup_30":
                return "Top-Up 30 Minutes";
            case "daily_pass":
                return "Daily Pass";
            default:
                return productId;
        }
    };


    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.PrimaryColor}/>
                <Text style={styles.loadingText}>{t('subscription.wallet_loading')}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>

            {/* Header (Preserved) */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
                    <MaterialIcons name="arrow-back-ios" size={22} color={Colors.TextDark}/>
                </TouchableOpacity>

                <Text style={styles.headerTitle}>{t('subscription.wallet_title')}</Text>

                <TouchableOpacity onPress={() => {
                    setReloadPlan(prev => !prev);
                }} style={styles.headerIcon}>
                    <MaterialIcons name="refresh" size={22} color={Colors.TextDark}/>
                </TouchableOpacity>

            </View>

            <ScrollView contentContainerStyle={styles.container}>

                {/* Remaining Minutes Card */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>{t('subscription.wallet_balance')}</Text>

                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceValue}>
                            {walletData?.minutes?.available ?? 0}
                        </Text>
                        <Text
                            style={styles.balanceUnit}>{walletData?.minutes?.available > 1 ? t('minutes') : t('subscription.unit_minute')}</Text>
                    </View>

                    <TourHighlight
                        zone={1}
                        title={t('tour_top_up_title')}
                        text={t('tour_top_up_desc')}
                    >

                        <TouchableOpacity
                            style={styles.topUpButton}
                            onPress={() => {
                                showTopUpView(true)
                            }}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.topUpText}>{t('subscription.wallet_top_up')}</Text>
                        </TouchableOpacity>
                    </TourHighlight>
                </View>

                {/* Transaction History */}
                <View style={styles.historyCard}>
                    <Text style={styles.sectionTitle}>{t('subscription.wallet_transactions')}</Text>

                    {transactions.length > 0 ? transactions.map((item: any, index: number) => (
                            <View key={item.transactionId || item.productId + item.purchaseDate}
                                  style={styles.transactionRow}>
                                <View>
                                    <Text style={styles.transactionTitle}>
                                        {formatProductName(item.productId)}
                                    </Text>
                                    <Text style={styles.transactionDate}>
                                        {item.purchaseDate
                                            ? new Date(item.purchaseDate).toLocaleDateString()
                                            : "-"}
                                    </Text>
                                </View>

                                <Text
                                    style={[
                                        styles.transactionAmount,
                                        {
                                            color:
                                                item.type === "subscription"
                                                    ? "#176535"
                                                    : "#DD8550",
                                        },
                                    ]}
                                >
                                    {item.type === "subscription"
                                        ? t('subscription.transaction_plan_purchase')
                                        : t('subscription.wallet_top_up')
                                    }
                                </Text>
                            </View>
                        )) :
                        <Text style={styles.transactionTitle}>
                            {t('no_transaction_yet')}
                        </Text>}

                </View>

                {isShowTopUpView && (
                    <TopUpModal
                        isVisible={isShowTopUpView}
                        onClose={() => {
                            showTopUpView(false);
                            setIsPurchasing(false);
                            setReloadPlan(prev => !prev);
                        }}
                        isPurchasing={isPurchasing}
                        monthlyTopUpCount={walletData?.minutes?.top_ups_this_month ?? 0}
                    />
                )}

            </ScrollView>
        </SafeAreaView>
    );
};


export default function WalletScreen() {
    return (
        <PageTourProvider>
            <WalletContent/>
        </PageTourProvider>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.Background,
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        height: 60,
    },

    headerIcon: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },

    headerTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: Colors.TextDark,
    },

    container: {
        padding: 20,
    },

    /* Balance Card */
    balanceCard: {
        backgroundColor: Colors.CardBackground,
        borderRadius: 28,
        padding: 28,
        alignItems: "center",
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 10},
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 6,
    },

    balanceLabel: {
        fontSize: 14,
        color: Colors.TextMuted,
        fontWeight: "600",
    },

    balanceRow: {
        flexDirection: "row",
        alignItems: "baseline",
        marginVertical: 12,
    },

    balanceValue: {
        fontSize: 56,
        fontWeight: "900",
        color: Colors.PrimaryColor,
        letterSpacing: -1,
    },

    balanceUnit: {
        fontSize: 20,
        marginLeft: 6,
        fontWeight: "700",
        color: Colors.TextDark,
    },

    topUpButton: {
        marginTop: 16,
        backgroundColor: Colors.PrimaryColor,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 999,
    },

    topUpText: {
        color: "#FFF",
        fontWeight: "800",
        fontSize: 15,
    },

    /* History Card */
    historyCard: {
        backgroundColor: Colors.CardBackground,
        borderRadius: 24,
        padding: 20,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: Colors.TextDark,
        marginBottom: 16,
    },

    transactionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.BorderGray,
    },

    transactionTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: Colors.TextDark,
    },

    transactionDate: {
        fontSize: 12,
        color: Colors.TextMuted,
        marginTop: 2,
    },

    transactionAmount: {
        fontSize: 15,
        fontWeight: "800",
    },

    emptyText: {
        textAlign: "center",
        color: Colors.TextMuted,
        marginTop: 10,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.Background,
    },

    loadingText: {
        marginTop: 10,
        color: Colors.TextMuted,
    },

});

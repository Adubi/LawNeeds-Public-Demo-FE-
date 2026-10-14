import React, { FC, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import PlanCard, { Plan } from "@/components/subscription/PlanCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  buyDailyPass,
  getSubscriptionPlans,
  getUserPlan,
  syncSubscription,
} from "@/services/subscriptionHelper";
import Carousel from "react-native-reanimated-carousel";
import Purchases, { CustomerInfo } from "react-native-purchases";
import {
  applyRevenueCatPriceToPlan,
  getRevenueCatPackage,
  idMatchesPlan,
  planIdVariants,
} from "@/services/planToRevenueCat";
import { getOfferingList, getUserData } from "@/constants/Utility";
import {
  buildSubscriptionSyncPayload,
  PurchaseData,
} from "@/services/SubscriptionSyncPayload";
import Analytics from "@/helpers/AnalyticsHelper";
import { useTranslation } from "react-i18next";
import { useApp } from "@/contexts/AppContext";

const { width, height } = Dimensions.get("window");

const Colors = {
  Background: "#FFF7ED",
  PrimaryColor: "#176535",
  PrimaryColorText: "#033126",
  White: "#FFFFFF",
};

type PlanAction =
  | "current"
  | "upgrade"
  | "downgrade"
  | "switch"
  | "subscribe"
  | "daily_pass"
  | "cancel_to_basic";

const TIER_ORDER = ["freemium", "express", "standard", "premium"];
const PLAN_TIER_RANK: Record<string, number> = {
  freemium: 0,
  express: 1,
  standard: 2,
  premium: 3,
};

const APPLE_SUBSCRIPTION_URL = "https://apps.apple.com/account/subscriptions";
const PLAY_SUBSCRIPTION_URL =
  "https://play.google.com/store/account/subscriptions?package=com.steve.LawNeeds";

const getPlatformSubscriptionManagementUrl = (
  managementUrl?: string | null,
) => {
  const url = managementUrl ?? "";

  if (Platform.OS === "ios") {
    return url && !url.includes("play.google.com")
      ? url
      : APPLE_SUBSCRIPTION_URL;
  }

  if (Platform.OS === "android") {
    return url && url.includes("play.google.com") ? url : PLAY_SUBSCRIPTION_URL;
  }

  return url || PLAY_SUBSCRIPTION_URL;
};

interface TierGroup {
  tier_key: string;
  tier_name: string;
  options: Plan[];
}

const SubscriptionPlansScreen: FC = () => {
  const { t } = useTranslation();
  const { refreshPlanInfo } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [groupedTiers, setGroupedTiers] = useState<TierGroup[]>([]);
  const [billingPrefs, setBillingPrefs] = useState<Record<string, string>>({});
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [isDailyPassActive, setIsDailyPassActive] = useState(false);
  const [isSyncingSubscription, setIsSyncingSubscription] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPlanManagementData = async () => {
      setIsLoading(true);
      try {
        const [revenueCatData, customerInfoData] = await Promise.all([
          getOfferingList(),
          Purchases.getCustomerInfo().catch(() => null),
        ]);

        if (!isMounted) return;
        setCustomerInfo(customerInfoData);

        getUserPlan(
          (response: any) => {
            if (!isMounted) return;
            setCurrentPlanId(response?.subscription?.plan_id ?? null);
            setCurrentTier(response?.subscription?.tier ?? null);
            setIsDailyPassActive(
              Boolean(response?.freemium?.daily_pass_active),
            );
          },
          () => {
            if (!isMounted) return;
            setCurrentPlanId(null);
            setCurrentTier(null);
            setIsDailyPassActive(false);
          },
        );

        getSubscriptionPlans(
          (dataList: Plan[]) => {
            if (!isMounted) return;

            const updatedPlans = dataList.map((plan) =>
              applyRevenueCatPriceToPlan(
                plan,
                revenueCatData?.availablePackages || [],
              ),
            );

            processData(updatedPlans);
            setIsLoading(false);
          },
          () => {
            if (isMounted) setIsLoading(false);
          },
        );
      } catch (error) {
        console.error("Plan management initialization error:", error);
        if (isMounted) setIsLoading(false);
      }
    };

    loadPlanManagementData();

    return () => {
      isMounted = false;
    };
  }, []);

  const processData = (dataList: Plan[]) => {
    const groups: Record<string, Plan[]> = {};
    dataList.forEach((plan) => {
      const key = plan.tier || "basic";
      if (!groups[key]) groups[key] = [];
      groups[key].push(plan);
    });

    const formatted: TierGroup[] = TIER_ORDER.map((key) => ({
      tier_key: key,
      tier_name: key.charAt(0).toUpperCase() + key.slice(1),
      options: groups[key] || [],
    })).filter((g) => g.options.length > 0);

    const prefs: Record<string, string> = {};
    formatted.forEach((group) => {
      const hasMonthly = group.options.find(
        (o) => o.billing_period === "monthly",
      );
      prefs[group.tier_key] = hasMonthly
        ? "monthly"
        : group.options[0].billing_period!;
    });

    setGroupedTiers(formatted);
    setBillingPrefs(prefs);
    setIsLoading(false);
  };

  const isCurrentPlan = (plan: Plan) => {
    const variants = planIdVariants(plan.id, plan.tier);
    const activeSubscriptions = customerInfo?.activeSubscriptions || [];

    return (
      idMatchesPlan(currentPlanId, variants) ||
      activeSubscriptions.some((sub: string) => idMatchesPlan(sub, variants))
    );
  };

  const getPlanAction = (plan: Plan): PlanAction => {
    if (isCurrentPlan(plan)) return "current";
    if (plan.tier === "express")
      return isDailyPassActive ? "current" : "daily_pass";
    if (plan.tier === "freemium")
      return !currentTier || currentTier === "freemium"
        ? "current"
        : "cancel_to_basic";
    if (!currentTier || currentTier === "freemium") return "subscribe";

    const targetRank = PLAN_TIER_RANK[plan.tier] ?? 0;
    const currentRank = PLAN_TIER_RANK[currentTier] ?? 0;

    if (targetRank > currentRank) return "upgrade";
    if (targetRank < currentRank) return "downgrade";
    return "switch";
  };

  const getCtaLabel = (action: PlanAction) => {
    switch (action) {
      case "current":
        return t("plan_card.cta.current_plan", {
          defaultValue: "Current Plan",
        });
      case "upgrade":
        return t("plan_card.cta.upgrade", { defaultValue: "Upgrade" });
      case "downgrade":
        return t("plan_card.cta.downgrade", { defaultValue: "Downgrade" });
      case "switch":
        return t("plan_card.cta.switch_billing", {
          defaultValue: "Switch Billing",
        });
      case "daily_pass":
        return t("plan_card.cta.daily_pass", {
          defaultValue: "Get Daily Pass",
        });
      case "cancel_to_basic":
        return t("plan_card.cta.switch_to_basic", {
          defaultValue: "Switch to Basic",
        });
      default:
        return t("plan_card.cta.subscribe");
    }
  };

  const completeRevenueCatSync = async (
    updatedInfo: CustomerInfo,
    purchaseData?: PurchaseData | null,
  ) => {
    const loginUserData = await getUserData();
    const payload = buildSubscriptionSyncPayload(
      updatedInfo,
      loginUserData?.id ?? "",
      purchaseData,
    );

    await new Promise((resolve, reject) => {
      syncSubscription(payload, resolve, reject);
    });

    setCustomerInfo(updatedInfo);
  };

  const purchasePlan = async (plan: Plan, action: PlanAction) => {
    if (plan.tier === "freemium") return;

    let packageToPurchase: Awaited<
      ReturnType<typeof getRevenueCatPackage>
    > | null = null;

    try {
      Analytics.paywallViewed({
        planType: plan.billing_period,
      });
      setIsPurchasing(true); // Start Loader

      packageToPurchase = await getRevenueCatPackage(plan.id);

      if (!packageToPurchase) {
        Analytics.purchaseFailed({
          planType: plan.billing_period,
          price: plan.price_gbp,
          currency: plan.currencyCode,
          source: "upgrade_plans",
          reason: "package_not_found",
        });
        Alert.alert(
          t("subscription.plan_unavailable_title"),
          t("subscription.plan_unavailable_message"),
        );
        return;
      }

      Analytics.purchaseAttempted({
        planType: plan.billing_period,
        price: plan.price_gbp,
        currency: plan.currencyCode,
        productId: packageToPurchase.product.identifier,
        packageId: packageToPurchase.identifier,
        source: "upgrade_plans",
      });

      const { customerInfo: updatedInfo, transaction } =
        await Purchases.purchasePackage(packageToPurchase);

      Analytics.planPurchased({
        planType: plan.billing_period,
        price: plan.price_gbp,
        currency: plan.currencyCode,
        productId: packageToPurchase.product.identifier,
        packageId: packageToPurchase.identifier,
        transactionId: transaction?.transactionIdentifier,
        source: "upgrade_plans",
      });

      setIsSyncingSubscription(true);
      await completeRevenueCatSync(updatedInfo, {
        price_paid: packageToPurchase.product.price,
        currency: packageToPurchase.product.currencyCode,
        transaction_id: transaction?.transactionIdentifier ?? "",
      });

      Alert.alert(
        t("success.success"),
        action === "downgrade"
          ? t("subscription.downgrade_success_message", {
              defaultValue:
                "Your plan change has been sent to the store and your account is being updated.",
            })
          : t("subscription.plan_change_success_message", {
              defaultValue: "Your plan has been updated.",
            }),
        [
          {
            text: t("ok"),
            onPress: () => router.replace("/(app)/(tabs)/settings"),
          },
        ],
      );
    } catch (e: any) {
      Analytics.purchaseFailed({
        planType: plan.billing_period,
        price: plan.price_gbp,
        currency: plan.currencyCode,
        productId: packageToPurchase?.product.identifier,
        packageId: packageToPurchase?.identifier,
        source: "upgrade_plans",
        reason: e?.message ?? "purchase_failed",
        userCancelled: e?.userCancelled ?? false,
      });
      if (!e.userCancelled) {
        Alert.alert(
          t("subscription.purchase_error_title"),
          e.message || t("subscription.purchase_error_message"),
        );
      }
    } finally {
      setIsPurchasing(false); // Stop Loader
      setIsSyncingSubscription(false);
    }
  };

  const openSubscriptionManagement = async () => {
    try {
      const latestCustomerInfo = await Purchases.getCustomerInfo().catch(
        () => customerInfo,
      );
      const managementUrl =
        latestCustomerInfo?.managementURL ?? customerInfo?.managementURL;
      const urlToOpen = getPlatformSubscriptionManagementUrl(managementUrl);
      const supported = await Linking.canOpenURL(urlToOpen);

      if (!supported) {
        throw new Error("URL not supported");
      }

      await Linking.openURL(urlToOpen);
    } catch (error) {
      console.error("Open subscription management error:", error);
      Alert.alert(t("error.title"), t("open_store_error"));
    }
  };

  const handleSwitchToBasic = () => {
    Alert.alert(
      t("manage_subscription_title"),
      t("subscription.switch_to_basic_message", {
        defaultValue:
          "To move back to Basic, cancel your current app store subscription. Your paid access remains active until the store billing period ends.",
      }),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("continue"),
          style: "destructive",
          onPress: openSubscriptionManagement,
        },
      ],
    );
  };

  const purchaseDailyPass = () => {
    setIsPurchasing(true);
    buyDailyPass(
      t,
      () => {
        refreshPlanInfo();
        setIsPurchasing(false);
      },
      () => {
        setIsPurchasing(false);
      },
    );
  };

  const handleSubscribe = async (plan: Plan) => {
    const action = getPlanAction(plan);
    if (action === "current") return;

    if (action === "daily_pass") {
      purchaseDailyPass();
      return;
    }

    if (action === "cancel_to_basic") {
      handleSwitchToBasic();
      return;
    }

    if (action === "downgrade") {
      Alert.alert(
        t("subscription.downgrade_confirm_title", {
          defaultValue: "Downgrade plan?",
        }),
        t("subscription.downgrade_confirm_message", {
          defaultValue:
            "Your plan change will be handled by the app store. Timing and proration depend on Apple or Google billing rules.",
        }),
        [
          { text: t("cancel"), style: "cancel" },
          {
            text: t("plan_card.cta.downgrade", { defaultValue: "Downgrade" }),
            style: "destructive",
            onPress: () => purchasePlan(plan, action),
          },
        ],
      );
      return;
    }

    await purchasePlan(plan, action);
  };

  if (isLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.PrimaryColor} />
      </View>
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerIcon}
        >
          <MaterialIcons
            name="arrow-back-ios"
            size={22}
            color={Colors.PrimaryColorText}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("subscription.manage_plans", { defaultValue: "Manage Plans" })}
        </Text>
        <View style={styles.headerIcon} />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.description}>
          {t("subscription.plans_pricing_subtitle")}
        </Text>
        <Text style={styles.vatNotice}>
          {t("subscription.vat_checkout_notice", {
            defaultValue: "* VAT may apply at checkout.",
          })}
        </Text>
      </View>

      <View style={styles.carouselWrapper}>
        <Carousel
          loop={false}
          width={width}
          height={height * 0.82}
          data={groupedTiers}
          mode="parallax"
          modeConfig={{
            parallaxScrollingScale: 0.9,
            parallaxScrollingOffset: 50,
          }}
          renderItem={({ item: tierGroup }) => {
            const selectedPeriod = billingPrefs[tierGroup.tier_key];
            const activeOption =
              tierGroup.options.find(
                (o) => o.billing_period === selectedPeriod,
              ) || tierGroup.options[0];
            const action = getPlanAction(activeOption);
            const isActive = action === "current";
            Analytics.planViewed({
              planType: activeOption.billing_period,
            });

            return (
              <View style={styles.cardContainer}>
                <PlanCard
                  plan={activeOption}
                  isSelected={true}
                  isShowDiscount={false}
                  isActive={isActive}
                  ctaLabel={getCtaLabel(action)}
                  ctaDisabled={isActive}
                  onSubscribe={() => handleSubscribe(activeOption)}
                  // Props for internal billing toggle
                  allTierOptions={tierGroup.options}
                  selectedPeriod={selectedPeriod}
                  onPeriodChange={(p) =>
                    setBillingPrefs((prev) => ({
                      ...prev,
                      [tierGroup.tier_key]: p,
                    }))
                  }
                />
              </View>
            );
          }}
        />
      </View>

      {(isPurchasing || isSyncingSubscription) && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color={Colors.PrimaryColor} />
            <Text style={styles.loaderText}>
              {isSyncingSubscription
                ? t("subscription.syncing_account")
                : t("subscription.processing_purchase")}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.Background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.PrimaryColorText,
  },
  headerIcon: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    marginVertical: 10,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  description: { fontSize: 14, color: "#7F8C8D", textAlign: "center" },
  vatNotice: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.PrimaryColorText,
    fontWeight: "700",
    textAlign: "center",
  },
  carouselWrapper: { flex: 1 },
  cardContainer: { flex: 1, paddingHorizontal: 5 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)", // Dim the background
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  loaderCard: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  loaderText: {
    marginTop: 15,
    fontWeight: "600",
    color: Colors.PrimaryColorText,
  },
});

export default SubscriptionPlansScreen;

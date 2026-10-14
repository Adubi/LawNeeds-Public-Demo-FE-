import React, { FC, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
  syncSubscription,
} from "@/services/subscriptionHelper";
import Carousel from "react-native-reanimated-carousel";
import Purchases, { CustomerInfo } from "react-native-purchases";
import {
  applyRevenueCatPriceToPlan,
  getRevenueCatPackage,
} from "@/services/planToRevenueCat";
import {
  getDailyPassOffering,
  getOfferingList,
  getUserData,
  isUserPro,
} from "@/constants/Utility";
import { useTranslation } from "react-i18next";
import { useApp } from "@/contexts/AppContext";
import {
  buildSubscriptionSyncPayload,
  PurchaseData,
} from "@/services/SubscriptionSyncPayload";
import Analytics from "@/helpers/AnalyticsHelper";

const { width, height } = Dimensions.get("window");

const Colors = {
  Background: "#FFF7ED",
  PrimaryColor: "#176535",
  PrimaryColorText: "#033126",
  White: "#FFFFFF",
};

interface TierGroup {
  tier_key: string;
  tier_name: string;
  options: Plan[];
}

const SubscriptionPlansScreen: FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [groupedTiers, setGroupedTiers] = useState<TierGroup[]>([]);
  const [billingPrefs, setBillingPrefs] = useState<Record<string, string>>({});
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [isSyncingSubscription, setIsSyncingSubscription] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const { t } = useTranslation();
  const { walletData, refreshPlanInfo } = useApp();

  const hasNavigated = useRef(false);
  const previousEntitlements = useRef<string | null>(null);
  const listenerRef = useRef<any>(null);
  const lastPurchaseData = useRef<PurchaseData | null>(null);

  const TIER_ORDER = ["freemium", "express", "standard", "premium"];

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

  useEffect(() => {
    let isMounted = true;

    const loadDataAndSetupStore = async () => {
      setIsLoading(true);
      try {
        const [revenueCatOffering, dailyPassPackages] = await Promise.all([
          getOfferingList(),
          getDailyPassOffering(),
        ]);
        const availablePackages = [
          ...(revenueCatOffering?.availablePackages || []),
          ...(dailyPassPackages || []),
        ];

        getSubscriptionPlans(
          (dataList: Plan[]) => {
            if (!isMounted) return;

            const isDailyPassActive = walletData?.freemium?.daily_pass_active;
            let processedPlans = isDailyPassActive
              ? dataList.filter((item) => item.tier !== "express")
              : dataList;

            const updatedPlans = processedPlans.map((plan) =>
              applyRevenueCatPriceToPlan(plan, availablePackages),
            );

            processData(updatedPlans);
            setIsLoading(false);
          },
          () => {
            if (isMounted) setIsLoading(false);
          },
        );

        // ✅ Setup listener only once, only for non-pro users
        const isPro = await isUserPro();
        if (isPro || !isMounted) return;

        // ✅ Snapshot current entitlements before purchase
        try {
          const loginUserData = await getUserData();
          const { customerInfo: currentInfo } = await Purchases.logIn(
            loginUserData?.id?.toString() ?? "",
          );
          setCustomerInfo(currentInfo);
          previousEntitlements.current = JSON.stringify(
            Object.keys(currentInfo.entitlements.active).sort(),
          );
        } catch (e) {
          console.log("Failed to snapshot entitlements", e);
        }

        // ✅ Remove any existing listener before adding new one
        if (listenerRef.current) {
          listenerRef.current.remove();
        }

        listenerRef.current = Purchases.addCustomerInfoUpdateListener(
          async (info: CustomerInfo) => {
            if (!isMounted || hasNavigated.current) return;

            // ✅ Only sync if entitlements actually changed
            const newEntitlements = JSON.stringify(
              Object.keys(info.entitlements.active).sort(),
            );
            if (newEntitlements === previousEntitlements.current) {
              console.log("No entitlement change — skipping sync");
              return;
            }

            try {
              setIsSyncingSubscription(true); // ✅ show syncing loader

              const loginUserData = await getUserData();
              const userId = loginUserData?.id?.toString() ?? "";
              const payload = buildSubscriptionSyncPayload(
                info,
                userId,
                lastPurchaseData.current,
              );
              lastPurchaseData.current = null;

              await new Promise((resolve, reject) => {
                syncSubscription(payload, resolve, reject);
              });

              if (!isMounted || hasNavigated.current) return;

              hasNavigated.current = true; // ✅ prevent double navigation

              router.replace("/(app)/(tabs)/settings");
            } catch (error) {
              console.error("Sync error:", error);
            } finally {
              if (isMounted) setIsSyncingSubscription(false);
            }
          },
        );
      } catch (error) {
        console.error("Initialization error:", error);
        if (isMounted) setIsLoading(false);
      }
    };

    loadDataAndSetupStore();

    return () => {
      isMounted = false;
      if (listenerRef.current) {
        listenerRef.current.remove();
        listenerRef.current = null;
      }
    };
  }, []);

  // ✅ Separate effect for walletData-dependent UI only
  useEffect(() => {
    if (!walletData) return;
    // re-filter plans if daily pass status changes — but don't re-register listener
    setIsLoading(true);
    getSubscriptionPlans(
      (dataList: Plan[]) => {
        const isDailyPassActive = walletData?.freemium?.daily_pass_active;
        const processedPlans = isDailyPassActive
          ? dataList.filter((item) => item.tier !== "express")
          : dataList;
        processData(processedPlans);
      },
      () => setIsLoading(false),
    );
  }, [walletData]);

  const handleSubscribe = async (plan: Plan) => {
    if (plan.tier === "freemium") return;

    let packageToPurchase: Awaited<
      ReturnType<typeof getRevenueCatPackage>
    > | null = null;

    try {
      Analytics.paywallViewed({
        planType: plan.billing_period,
      });
      setIsPurchasing(true); // Start Loader

      if (plan.tier === "express") {
        buyDailyPass(
          t,
          () => {
            refreshPlanInfo();
            setIsPurchasing(false); // ✅ reset in success callback
          },
          () => {
            setIsPurchasing(false); // ✅ reset in error callback
          },
        );
        // ✅ Don't fall through to finally — buyDailyPass is async callback-based
        return;
      }

      packageToPurchase = await getRevenueCatPackage(plan.id); // ✅ fixed
      if (!packageToPurchase) {
        Analytics.purchaseFailed({
          planType: plan.billing_period,
          price: plan.price_gbp,
          currency: plan.currencyCode,
          source: "subscription_plans",
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
        source: "subscription_plans",
      });

      const { transaction } =
        await Purchases.purchasePackage(packageToPurchase);

      lastPurchaseData.current = {
        price_paid: packageToPurchase.product.price,
        currency: packageToPurchase.product.currencyCode,
        transaction_id: transaction?.transactionIdentifier ?? "",
      };

      Analytics.planPurchased({
        planType: plan.billing_period,
        price: plan.price_gbp,
        currency: plan.currencyCode,
        productId: packageToPurchase.product.identifier,
        packageId: packageToPurchase.identifier,
        transactionId: transaction?.transactionIdentifier,
        source: "subscription_plans",
      });

      Analytics.subscriptionStarted({
        planType: plan.billing_period,
        price: plan.price_gbp,
        currency: plan.currencyCode,
      });
    } catch (e: any) {
      Analytics.purchaseFailed({
        planType: plan.billing_period,
        price: plan.price_gbp,
        currency: plan.currencyCode,
        productId: packageToPurchase?.product.identifier,
        packageId: packageToPurchase?.identifier,
        source: "subscription_plans",
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
      setIsPurchasing(false);
    }
  };

  if (isLoading)
    return (
      <View style={styles.center}>
        {" "}
        {/* ✅ fixed */}
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
          {t("subscription.plans_pricing_title")}
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
          onSnapToItem={(index) => {
            // ✅ Analytics moved here — fires only when user swipes to a card
            const tier = groupedTiers[index];
            if (tier) {
              const selectedPeriod = billingPrefs[tier.tier_key];
              const activeOption =
                tier.options.find((o) => o.billing_period === selectedPeriod) ||
                tier.options[0];
              Analytics.planViewed({
                planType: activeOption.billing_period,
              }); // ✅ fixed
            }
          }}
          renderItem={({ item: tierGroup }) => {
            const selectedPeriod = billingPrefs[tierGroup.tier_key];
            const activeOption =
              tierGroup.options.find(
                (o) => o.billing_period === selectedPeriod,
              ) || tierGroup.options[0];

            const isActive = customerInfo?.activeSubscriptions?.some(
              (sub: string) =>
                sub.toLowerCase().includes(activeOption.id.toLowerCase()), // ✅ fixed
            );

            return (
              <View style={styles.cardContainer}>
                <PlanCard
                  plan={activeOption}
                  isShowDiscount={true}
                  isSelected={true}
                  isActive={isActive}
                  onSubscribe={() => handleSubscribe(activeOption)}
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
    backgroundColor: "rgba(0,0,0,0.4)",
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

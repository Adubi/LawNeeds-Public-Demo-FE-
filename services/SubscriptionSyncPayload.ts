import { CustomerInfo } from "react-native-purchases";

export type SubscriptionSyncPayload = {
  user_id: string;
  app_user_id: string;
  plan: "freemium" | "standard" | "premium";
  entitlement_id: string | null;
  package_id: string | null;
  is_active: boolean;
  expires_at: string | null;
  will_renew: boolean;
  last_event:
    | "purchase"
    | "renewal"
    | "expiration"
    | "cancellation"
    | "unknown";
  updated_at: string;
  price_paid: number | null;
  currency: string | null;
  transaction_id: string | null;
};

export type PurchaseData = {
  price_paid: number;
  currency: string;
  transaction_id: string;
};

function deriveLastEvent(
  info: CustomerInfo,
  activeEntitlement: any,
): SubscriptionSyncPayload["last_event"] {
  if (!activeEntitlement) return "expiration";

  if (activeEntitlement.periodType === "INTRO") return "purchase";

  if (activeEntitlement.isActive && activeEntitlement.willRenew) {
    return "renewal";
  }

  if (activeEntitlement.isActive && !activeEntitlement.willRenew) {
    return "cancellation";
  }

  return "unknown";
}

export function buildSubscriptionSyncPayload(
  info: CustomerInfo,
  userId: string,
  purchaseData?: PurchaseData | null,
): SubscriptionSyncPayload {
  const base = {
    user_id: userId,
    app_user_id: userId,
    updated_at: info.requestDate,
    price_paid: purchaseData?.price_paid ?? null,
    currency: purchaseData?.currency ?? null,
    transaction_id: purchaseData?.transaction_id ?? null,
  };

  // Only consider paid subscription entitlements
  const paidEntitlement =
    info.entitlements.active["premium_access"] ||
    info.entitlements.active["standard_access"];

  if (!paidEntitlement) {
    return {
      ...base,
      plan: "freemium",
      entitlement_id: null,
      package_id: null,
      is_active: false,
      expires_at: null,
      will_renew: false,
      last_event: "expiration",
    };
  }
  const activePackage = info.activeSubscriptions?.[0] ?? null;

  return {
    ...base,
    plan: paidEntitlement.productIdentifier as "standard" | "premium",
    entitlement_id: paidEntitlement.identifier,
    package_id: activePackage,
    is_active: paidEntitlement.isActive,
    expires_at: paidEntitlement.expirationDate,
    will_renew: paidEntitlement.willRenew,
    last_event: deriveLastEvent(info, paidEntitlement),
  };
}

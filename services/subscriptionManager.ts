import Purchases from 'react-native-purchases';
import {getUserData, isUserPro, saveLastSyncedSubscription} from "@/constants/Utility";
import {buildSubscriptionSyncPayload} from "@/services/SubscriptionSyncPayload";
import {syncSubscriptionFirstTime} from "@/services/subscriptionHelper";


export const handleSubscriptionSync = async (
    options?: {
        forceSync?: boolean;
        onSuccess?: () => void;
        onError?: (error: any) => void;
    }
) => {
    try {
        const {forceSync = false, onSuccess, onError} = options || {};

        const loginUserData = await getUserData();
        const isProUser = await isUserPro();
        if (isProUser) {
            return true;
        }
        const userId = loginUserData?.id;

        if (!userId) {
            console.warn("No userId found. Skipping subscription sync.");
            return;
        }

        const appUserId = userId.toString();

        let customerInfo = await Purchases.getCustomerInfo();

        // ✅ Ensure correct RevenueCat user
        if (customerInfo.originalAppUserId !== appUserId) {
            const loginResult = await Purchases.logIn(appUserId);

            // 🔥 IMPORTANT: use updated info
            customerInfo = loginResult.customerInfo;

            // (optional but recommended)
            await Purchases.restorePurchases();
        }

        const payload = buildSubscriptionSyncPayload(customerInfo, appUserId);

        try {
            await syncSubscriptionFirstTime(payload);

            await saveLastSyncedSubscription(payload);

            if (onSuccess) onSuccess();

        } catch (error) {
            console.error("Sync failed", error);

            if (onError) onError(error);
        }

    } catch (error) {
        console.error("Subscription sync failed:", error);
        if (options?.onError) options.onError(error);
    }
};
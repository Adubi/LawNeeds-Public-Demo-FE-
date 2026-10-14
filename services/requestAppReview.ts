import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";

const REVIEW_LAST_REQUESTED_AT_KEY = "app_review_last_requested_at";
const REVIEW_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 120;

export const requestAppReviewIfEligible = async () => {
    try {
        const lastRequestedAt = Number(
            await AsyncStorage.getItem(REVIEW_LAST_REQUESTED_AT_KEY)
        );

        if (lastRequestedAt && Date.now() - lastRequestedAt < REVIEW_COOLDOWN_MS) {
            return;
        }

        const isAvailable = await StoreReview.isAvailableAsync();
        const hasAction = await StoreReview.hasAction();

        if (!isAvailable || !hasAction) return;

        await AsyncStorage.setItem(REVIEW_LAST_REQUESTED_AT_KEY, String(Date.now()));
        await StoreReview.requestReview();
    } catch {
        // Store review prompts are opportunistic and should never block the app flow.
    }
};

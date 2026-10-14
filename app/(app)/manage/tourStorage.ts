// tourStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export type TourKey = "INBOX" | "SEARCH" | "HOME" | "PROFILE" | "SETTINGS" | "Wallet"| "Request"
    | "MANAGE" | "ChatBot" | "CurrentPlan"; // extend as needed

const storageKey = (key: TourKey) => `${key}_TOUR_DONE`;

export const isTourCompleted = async (key: TourKey) =>
    (await AsyncStorage.getItem(storageKey(key))) === "true";

export const completeTour = async (key: TourKey) =>
    AsyncStorage.setItem(storageKey(key), "true");

export const resetTour = async (key: TourKey) =>
    AsyncStorage.removeItem(storageKey(key));
import remoteConfig from "@react-native-firebase/remote-config";
import Constants from "expo-constants";
import {Platform} from "react-native";

type PlatformUpdatePolicy = {
    latest_build: number;
    minimum_build: number;
    force_after?: string | null;
    store_url: string;
};

type AppUpdatePolicy = {
    ios: PlatformUpdatePolicy;
    android: PlatformUpdatePolicy;
    message?: string;
};

export type AppUpdateDecision = {
    type: "soft" | "hard";
    currentBuild: number;
    latestBuild: number;
    minimumBuild: number;
    message: string;
    storeUrl: string;
};

const DEFAULT_MESSAGE = "Please update LawNeeds to continue using the latest secure version.";
const ENABLE_DEV_UPDATE_GATE = process.env.EXPO_PUBLIC_ENABLE_UPDATE_GATE_IN_DEV === "true";

const iosStoreUrl = () => {
    const appId = process.env.EXPO_PUBLIC_IOS_APP_ID;
    return appId ? `https://apps.apple.com/app/id${appId}` : "";
};

const getCurrentBuild = () => {
    const nativeBuild = Constants.nativeBuildVersion;
    if (nativeBuild) {
        const parsedNativeBuild = Number(nativeBuild);
        if (Number.isFinite(parsedNativeBuild) && parsedNativeBuild > 0) {
            return parsedNativeBuild;
        }
    }

    if (Platform.OS === "ios") {
        return Number(Constants.expoConfig?.ios?.buildNumber) || 1;
    }

    return Number(Constants.expoConfig?.android?.versionCode) || 1;
};

const currentPlatformPolicy = (): PlatformUpdatePolicy => {
    const currentBuild = getCurrentBuild();
    return {
        latest_build: currentBuild,
        minimum_build: 1,
        force_after: null,
        store_url: Platform.OS === "ios"
            ? iosStoreUrl()
            : "https://play.google.com/store/apps/details?id=com.steve.LawNeeds",
    };
};

const defaultPolicy = (): AppUpdatePolicy => {
    const platformPolicy = currentPlatformPolicy();
    return {
        ios: platformPolicy,
        android: platformPolicy,
        message: DEFAULT_MESSAGE,
    };
};

const parsePolicy = (raw: string): AppUpdatePolicy => {
    try {
        const parsed = JSON.parse(raw);
        return {
            ...defaultPolicy(),
            ...parsed,
            ios: {
                ...defaultPolicy().ios,
                ...(parsed?.ios || {}),
            },
            android: {
                ...defaultPolicy().android,
                ...(parsed?.android || {}),
            },
        };
    } catch {
        return defaultPolicy();
    }
};

export const checkAppUpdatePolicy = async (): Promise<AppUpdateDecision | null> => {
    if (__DEV__ && !ENABLE_DEV_UPDATE_GATE) {
        return null;
    }

    const defaults = defaultPolicy();

    await remoteConfig().setDefaults({
        app_update_policy: JSON.stringify(defaults),
    });

    await remoteConfig().setConfigSettings({
        minimumFetchIntervalMillis: __DEV__ ? 0 : 1000 * 60 * 60,
    });

    await remoteConfig().fetchAndActivate();

    const rawPolicy = remoteConfig().getValue("app_update_policy").asString();
    const policy = parsePolicy(rawPolicy);
    const platformPolicy = Platform.OS === "ios" ? policy.ios : policy.android;
    const currentBuild = getCurrentBuild();
    const latestBuild = Number(platformPolicy.latest_build) || currentBuild;
    const minimumBuild = Number(platformPolicy.minimum_build) || 1;

    const belowMinimum = currentBuild < minimumBuild;
    const belowLatest = currentBuild < latestBuild;
    const forceDatePassed = platformPolicy.force_after
        ? Date.now() >= new Date(platformPolicy.force_after).getTime()
        : false;

    if (belowMinimum || (belowLatest && forceDatePassed)) {
        return {
            type: "hard",
            currentBuild,
            latestBuild,
            minimumBuild,
            message: policy.message || DEFAULT_MESSAGE,
            storeUrl: platformPolicy.store_url,
        };
    }

    if (belowLatest) {
        return {
            type: "soft",
            currentBuild,
            latestBuild,
            minimumBuild,
            message: policy.message || DEFAULT_MESSAGE,
            storeUrl: platformPolicy.store_url,
        };
    }

    return null;
};

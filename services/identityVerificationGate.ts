import {Alert} from "react-native";
import {router} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import IdentityVerificationService from "@/services/IdentityVerificationService";

export type IdentityVerificationStatus = {
    enabled?: boolean;
    configured?: boolean;
    eligible?: boolean;
    required: boolean;
    approved: boolean;
    blocking: boolean;
    enforcement_mode?: string;
    account_type?: "user" | "lawyer" | "law_firm" | "a2j_partner" | "sme" | null;
    status: string;
    inquiry_id?: string | null;
    provider_status?: string | null;
    session_token?: string | null;
};

type StatusRequestOptions = {
    force?: boolean;
};

const STATUS_CACHE_TTL_MS = 2 * 60 * 1000;

let cachedStatus: IdentityVerificationStatus | null = null;
let cachedAt = 0;
let cachedUserKey: string | null = null;
let inFlightStatus: Promise<IdentityVerificationStatus> | null = null;
let inFlightUserKey: string | null = null;

const PROTECTED_PATH_PREFIXES = [
    "/chats",
    "/inbox",
    "/manageSubscription",
    "/message",
    "/requestFlow",
    "/search",
];

const normalizePath = (path: string) => {
    const normalized = path
        .replace(/\/\(app\)/g, "")
        .replace(/\/\(tabs\)/g, "");

    return normalized || "/";
};

export const isIdentityProtectedPath = (path: string) => {
    const normalized = normalizePath(path.split("?")[0]);

    return normalized === "/" || normalized === "/index" ||
        PROTECTED_PATH_PREFIXES.some((prefix) =>
            normalized === prefix || normalized.startsWith(`${prefix}/`)
        );
};

export const getCachedIdentityVerificationStatus = () => cachedStatus;

export const clearIdentityVerificationStatusCache = () => {
    cachedStatus = null;
    cachedAt = 0;
    cachedUserKey = null;
    inFlightStatus = null;
    inFlightUserKey = null;
};

const currentIdentityCacheKey = async () => {
    const storedUser = await AsyncStorage.getItem("auth_user");
    if (storedUser) {
        try {
            const parsed = JSON.parse(storedUser);
            if (parsed?.id) return String(parsed.id);
        } catch {
            return storedUser;
        }
    }

    return await AsyncStorage.getItem("auth_token");
};

const cacheIdentityVerificationStatus = (status: IdentityVerificationStatus, userKey: string | null) => {
    cachedStatus = status;
    cachedAt = Date.now();
    cachedUserKey = userKey;
    return status;
};

export const getIdentityVerificationStatus = async (
    options: StatusRequestOptions = {}
): Promise<IdentityVerificationStatus> => {
    const now = Date.now();
    const userKey = await currentIdentityCacheKey();
    const cacheFresh =
        cachedStatus &&
        cachedUserKey === userKey &&
        now - cachedAt < STATUS_CACHE_TTL_MS;

    if (!options.force && cachedStatus && cacheFresh) {
        return cachedStatus;
    }

    if (!options.force && inFlightStatus && inFlightUserKey === userKey) {
        return inFlightStatus;
    }

    inFlightUserKey = userKey;
    inFlightStatus = IdentityVerificationService.status()
        .then((status: IdentityVerificationStatus) => cacheIdentityVerificationStatus(status, userKey))
        .finally(() => {
            inFlightStatus = null;
            inFlightUserKey = null;
        });

    return inFlightStatus;
};

export const syncIdentityVerificationStatus = async (): Promise<IdentityVerificationStatus> => {
    const userKey = await currentIdentityCacheKey();
    const status = await IdentityVerificationService.sync();
    return cacheIdentityVerificationStatus(status, userKey);
};

export const startIdentityVerification = async (): Promise<IdentityVerificationStatus> => {
    const userKey = await currentIdentityCacheKey();
    const status = await IdentityVerificationService.start();
    return cacheIdentityVerificationStatus(status, userKey);
};

export const identityVerificationIsRequired = (status?: IdentityVerificationStatus | null) =>
    Boolean(status?.required && !status?.approved);

export const requireIdentityVerification = async (): Promise<boolean> => {
    try {
        const status = await getIdentityVerificationStatus();
        if (!identityVerificationIsRequired(status)) {
            return true;
        }

        Alert.alert(
            "Identity verification required",
            "Verify your identity to use chat, inbox, search, and subscription features.",
            [
                {text: "Not now", style: "cancel"},
                {
                    text: status.status === "in_progress" ? "Resume verification" : "Verify now",
                    onPress: () => router.push("/(app)/identity-verification"),
                },
            ],
        );
        return false;
    } catch (error) {
        console.warn("Unable to check identity verification status:", error);
        Alert.alert(
            "Unable to verify account",
            "We could not confirm your verification status. Please try again.",
        );
        return false;
    }
};

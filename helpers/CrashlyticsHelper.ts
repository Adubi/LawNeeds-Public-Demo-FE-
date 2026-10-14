import crashlytics from "@react-native-firebase/crashlytics";
import Constants from "expo-constants";
import {Platform} from "react-native";

type Attributes = Record<string, string | number | boolean | null | undefined>;

const APP_VERSION = Constants.expoConfig?.version ?? "unknown";

const normalizeAttributes = (attributes: Attributes): Record<string, string> => {
    const normalized: Record<string, string> = {};

    for (const [key, value] of Object.entries(attributes)) {
        if (value !== undefined && value !== null) {
            normalized[key] = String(value);
        }
    }

    return normalized;
};

const safeEndpoint = (url?: string): string => {
    if (!url) return "unknown";
    return url.split("?")[0] || url;
};

async function setUserContext(user: any): Promise<void> {
    try {
        const userId = user?.id ? String(user.id) : "";

        await crashlytics().setUserId(userId);
        await crashlytics().setAttributes(normalizeAttributes({
            user_id: userId,
            app_role: user?.professional_type || user?.role || user?.user_type || "client",
            subscription_plan: user?.plan || user?.subscription_plan || "unknown",
            platform_area: "mobile",
            app_version: APP_VERSION,
            platform: Platform.OS,
        }));
    } catch (error) {
        console.warn("[Crashlytics] setUserContext failed", error);
    }
}

async function clearUserContext(): Promise<void> {
    try {
        await crashlytics().setUserId("");
        await crashlytics().setAttributes({
            user_id: "",
            app_role: "signed_out",
            subscription_plan: "unknown",
        });
    } catch (error) {
        console.warn("[Crashlytics] clearUserContext failed", error);
    }
}

async function setAttributes(attributes: Attributes): Promise<void> {
    try {
        await crashlytics().setAttributes(normalizeAttributes(attributes));
    } catch (error) {
        console.warn("[Crashlytics] setAttributes failed", error);
    }
}

function log(message: string): void {
    try {
        crashlytics().log(message);
    } catch (error) {
        console.warn("[Crashlytics] log failed", error);
    }
}

async function setRequestContext(params: {
    requestId: string;
    endpoint?: string;
    statusCode?: number;
    failed?: boolean;
}): Promise<void> {
    const endpoint = safeEndpoint(params.endpoint);

    await setAttributes({
        last_request_id: params.requestId,
        last_endpoint: endpoint,
        last_status_code: params.statusCode,
        failed_request_id: params.failed ? params.requestId : undefined,
        failed_endpoint: params.failed ? endpoint : undefined,
        failed_status_code: params.failed && params.statusCode ? params.statusCode : undefined,
    });
}

async function recordError(error: unknown, attributes: Attributes = {}): Promise<void> {
    try {
        await setAttributes(attributes);
        const normalizedError = error instanceof Error
            ? error
            : new Error(typeof error === "string" ? error : "Unknown frontend error");

        await crashlytics().recordError(normalizedError);
    } catch (recordErrorFailure) {
        console.warn("[Crashlytics] recordError failed", recordErrorFailure);
    }
}

export default {
    clearUserContext,
    log,
    recordError,
    setAttributes,
    setRequestContext,
    setUserContext,
};

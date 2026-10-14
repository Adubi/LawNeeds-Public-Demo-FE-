import {usePathname, useSegments} from "expo-router";
import {useEffect, useMemo, useRef} from "react";
import Analytics from "@/helpers/AnalyticsHelper";

const SCREEN_NAME_OVERRIDES: Record<string, string> = {
    index: "splash",
    welcome: "welcome",
    "(app)/login": "login",
    "(app)/(tabs)/index": "home",
    "(app)/(tabs)/inbox/index": "inbox",
    "(app)/(tabs)/profile/index": "profile",
    "(app)/(tabs)/search/index": "search",
    "(app)/(tabs)/settings/index": "settings",
    "(app)/manageSubscription/subscription-plans-screen": "subscription_plans",
    "(app)/manageSubscription/upgrade-plans-screen": "upgrade_plans",
    "(app)/manageSubscription/current-plan-screen": "current_plan",
    "(app)/manageSubscription/WalletScreen": "wallet",
    "(app)/manageSubscription/UsageHistoryScreen": "usage_history",
    "(app)/manageSubscription/RestoreSubscriptionScreen": "restore_subscription",
    "(app)/chats/chat-screen": "chat",
    "(app)/chats/NotificationsScreen": "notifications",
    "(app)/requestFlow/pricing-screen": "consultation_pricing",
    "(app)/requestFlow/ConsultationScreen": "consultation",
    "(app)/requestFlow/RequestDetails": "request_details",
};

function cleanSegment(segment: string): string {
    return segment
        .replace(/^\((.*)\)$/, "$1")
        .replace(/^\[(.*)\]$/, "$1")
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[-\s]+/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .toLowerCase();
}

function routeToScreenName(segments: string[], pathname: string | null): string | null {
    const routeKey = segments.join("/");
    if (SCREEN_NAME_OVERRIDES[routeKey]) return SCREEN_NAME_OVERRIDES[routeKey];

    const cleanedSegments = segments
        .filter(segment => !segment.startsWith("("))
        .map(cleanSegment)
        .filter(Boolean);

    if (cleanedSegments.length > 0) {
        const joined = cleanedSegments.join("_");
        return joined === "index" ? "home" : joined;
    }

    if (!pathname) return null;

    const fallback = pathname
        .split("/")
        .map(cleanSegment)
        .filter(Boolean)
        .join("_");

    return fallback || "home";
}

export function useScreenTracking() {
    const pathname = usePathname();
    const segments = useSegments();
    const previousScreenName = useRef<string | null>(null);
    const screenName = useMemo(
        () => routeToScreenName(segments as string[], pathname),
        [segments, pathname]
    );

    useEffect(() => {
        if (!screenName || previousScreenName.current === screenName) return;

        previousScreenName.current = screenName;
        Analytics.logScreen(screenName);
    }, [screenName]);
}

/**
 * LawNeeds — AppsFlyer Attribution Helper
 * Handles install conversion data, UTM params, and deep link routing.
 *
 * Works alongside analyticsHelper.ts — that file handles event mirroring.
 * This file handles attribution data retrieval and deep link routing logic.
 *
 * Usage:
 *   1. Call AppsFlyerHelper.init() once at app root (before navigation is ready)
 *   2. Call AppsFlyerHelper.getAttribution() after init to read install source
 *   3. Use AppsFlyerHelper.registerDeepLinkHandler(navigate) to route campaign deep links
 */

import appsFlyer from 'react-native-appsflyer';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AFAttribution {
    mediaSource: string;       // e.g. 'google_ads', 'meta_ads', 'tiktok_ads', 'apple_search_ads'
    campaign: string;          // e.g. 'immigration_uk_q2', 'employment_retargeting'
    campaignId?: string;
    adSet?: string;
    adId?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
    isOrganic: boolean;
    installTime?: string;
    clickTime?: string;
}

export interface AFDeepLink {
    campaign: string;
    deepLinkValue?: string;    // e.g. 'immigration', 'employment'
    incomingMediaSource?: string;
    rawData: Record<string, unknown>;
}

// Campaign → app screen mapping (matches GTM flows)
export type LawNeedsCampaignFlow =
    | 'immigration'
    | 'employment'
    | 'housing'
    | 'family'
    | 'general'
    | 'paywall';

// ─── Internal state ───────────────────────────────────────────────────────────

let _attribution: AFAttribution | null = null;
let _initPromise: Promise<void> | null = null;

// ─── Init ─────────────────────────────────────────────────────────────────────

export interface AFInitOptions {
    devKey: string;
    appId: string;             // iOS App Store ID (numeric string)
    isDebug?: boolean;
    attTimeout?: number;       // seconds to wait for ATT on iOS (default 10)
}

/**
 * Initialise AppsFlyer SDK. Safe to call multiple times — returns same promise.
 */
function init(options: AFInitOptions): Promise<void> {
    if (_initPromise) return _initPromise;

    _initPromise = new Promise((resolve, reject) => {
        appsFlyer.initSdk(
            {
                devKey: options.devKey,
                isDebug: options.isDebug ?? false,
                appId: options.appId,
                onInstallConversionDataListener: true,
                onDeepLinkListener: true,
                timeToWaitForATTUserAuthorization: options.attTimeout ?? 10,
            },
            (result: any) => {
                console.debug('[AppsFlyer] init success', result);
                resolve();
            },
            (error: any) => {
                console.warn('[AppsFlyer] init error', error);
                reject(error);
            },
        );
    });

    return _initPromise;
}

// ─── Install Conversion Data (UTMs + attribution) ─────────────────────────────

/**
 * Fetch install conversion data — contains UTMs, media source, campaign ID etc.
 * Call after init(). The Result is cached so safe to call multiple times.
 *
 * Returns null for organic installations or if attribution is unavailable.
 */
function getAttribution(): Promise<AFAttribution | null> {
    return new Promise((resolve) => {
        if (_attribution) {
            resolve(_attribution);
            return;
        }

        appsFlyer.onInstallConversionData((data: any) => {
            try {
                const d = data?.data ?? {};
                const isOrganic = d['af_status'] === 'Organic';

                _attribution = {
                    mediaSource:   String(d['media_source']   ?? ''),
                    campaign:      String(d['campaign']        ?? ''),
                    campaignId:    d['campaign_id']   ? String(d['campaign_id'])   : undefined,
                    adSet:         d['adset']         ? String(d['adset'])         : undefined,
                    adId:          d['adid']          ? String(d['adid'])          : undefined,
                    utmSource:     d['utm_source']    ? String(d['utm_source'])    : undefined,
                    utmMedium:     d['utm_medium']    ? String(d['utm_medium'])    : undefined,
                    utmCampaign:   d['utm_campaign']  ? String(d['utm_campaign'])  : undefined,
                    utmContent:    d['utm_content']   ? String(d['utm_content'])   : undefined,
                    utmTerm:       d['utm_term']      ? String(d['utm_term'])      : undefined,
                    isOrganic,
                    installTime:   d['install_time']  ? String(d['install_time'])  : undefined,
                    clickTime:     d['click_time']    ? String(d['click_time'])    : undefined,
                };

                console.debug('[AppsFlyer] attribution', _attribution);
                resolve(_attribution);
            } catch (e) {
                console.warn('[AppsFlyer] getAttribution parse error', e);
                resolve(null);
            }
        });
    });
}

/**
 * Returns the cached attribution synchronously after getAttribution() has resolved.
 * Returns null if getAttribution() hasn't been called yet.
 */
function getCachedAttribution(): AFAttribution | null {
    return _attribution;
}

// ─── Deep Link Routing ────────────────────────────────────────────────────────

/**
 * Map AppsFlyer campaign name / deep_link_value to an app flow.
 * Extend this as new campaigns are added.
 */
function resolveCampaignFlow(deepLink: AFDeepLink): LawNeedsCampaignFlow {
    const value = (deepLink.deepLinkValue ?? deepLink.campaign ?? '').toLowerCase();

    if (value.includes('immigration')) return 'immigration';
    if (value.includes('employment'))  return 'employment';
    if (value.includes('housing'))     return 'housing';
    if (value.includes('family'))      return 'family';
    if (value.includes('paywall') || value.includes('subscribe')) return 'paywall';

    return 'general';
}

/**
 * Register a deep link handler. Pass your navigation function.
 * Call once after NavigationContainer is ready.
 *
 * Example:
 *   AppsFlyerHelper.registerDeepLinkHandler((flow) => {
 *     if (flow === 'immigration') navigation.navigate('ImmigrationFlow');
 *     if (flow === 'paywall')     navigation.navigate('Paywall');
 *   });
 */
function registerDeepLinkHandler(
    onFlow: (flow: LawNeedsCampaignFlow, deepLink: AFDeepLink) => void,
): void {
    appsFlyer.onDeepLink((res: any) => {
        if (res?.deepLinkStatus !== 'FOUND') return;

        const dl: AFDeepLink = {
            campaign:            String(res.data?.campaign            ?? ''),
            deepLinkValue:       res.data?.deep_link_value ? String(res.data.deep_link_value) : undefined,
            incomingMediaSource: res.data?.media_source    ? String(res.data.media_source)    : undefined,
            rawData:             res.data ?? {},
        };

        const flow = resolveCampaignFlow(dl);
        console.debug('[AppsFlyer] deep link →', flow, dl);
        onFlow(flow, dl);
    });
}

// ─── Manual UTM pass-through (web-to-app) ────────────────────────────────────

/**
 * If you're passing UTMs from a web landing page via a custom URL scheme,
 * parse them here and set as AppsFlyer custom data.
 *
 * Example URL: lawneeds://open?utm_source=google&utm_campaign=immigration_uk
 */
function setUtmData(params: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
}): void {
    const customData: Record<string, string> = {};

    if (params.utmSource)   customData['utm_source']   = params.utmSource;
    if (params.utmMedium)   customData['utm_medium']   = params.utmMedium;
    if (params.utmCampaign) customData['utm_campaign'] = params.utmCampaign;
    if (params.utmContent)  customData['utm_content']  = params.utmContent;
    if (params.utmTerm)     customData['utm_term']     = params.utmTerm;

    appsFlyer.setAdditionalData(customData, (res: any) => {
        console.debug('[AppsFlyer] setUtmData', res);
    });
}

// ─── Paid channel helpers ─────────────────────────────────────────────────────

/**
 * Returns true if the install came from a paid channel (Google, Meta, TikTok, ASA).
 * Useful for deciding whether to show certain onboarding flows.
 */
function isPaidInstall(): boolean {
    if (!_attribution || _attribution.isOrganic) return false;

    const paidSources = ['googleadwords_int', 'meta_ads', 'tiktok_int', 'Apple Search Ads'];
    return paidSources.some((src) =>
        _attribution!.mediaSource.toLowerCase().includes(src.toLowerCase()),
    );
}

/**
 * Returns the channel label for logging / display.
 * e.g. 'Google Ads', 'Meta', 'TikTok', 'Apple Search Ads', 'Organic'
 */
function getChannelLabel(): string {
    if (!_attribution || _attribution.isOrganic) return 'Organic';

    const src = _attribution.mediaSource.toLowerCase();
    if (src.includes('google'))  return 'Google Ads';
    if (src.includes('meta') || src.includes('facebook')) return 'Meta';
    if (src.includes('tiktok'))  return 'TikTok';
    if (src.includes('apple'))   return 'Apple Search Ads';

    return _attribution.mediaSource;
}

// ─── Export ───────────────────────────────────────────────────────────────────

const AppsFlyerHelper = {
    init,
    getAttribution,
    getCachedAttribution,
    registerDeepLinkHandler,
    setUtmData,
    isPaidInstall,
    getChannelLabel,
    resolveCampaignFlow,
};

export default AppsFlyerHelper;
/**
 * LawNeeds Analytics Helper
 * Wraps Firebase Analytics + AppsFlyer with all events from PRD.
 *
 * Dependencies:
 *   expo install @react-native-firebase/app @react-native-firebase/analytics
 *   npm install react-native-appsflyer
 *
 * Usage:
 *   await Analytics.init({ userId: 'hashed_id', userType: 'freemium', language: 'en', country: 'GB' });
 *   await Analytics.chatMessageSent({ messageLength: 120, language: 'en', sessionId: 'abc' });
 */

import analytics from '@react-native-firebase/analytics';
import appsFlyer from 'react-native-appsflyer';
import {Platform} from 'react-native';
import Constants from 'expo-constants';
import ProductAnalyticsService, {HomeAction} from '@/services/ProductAnalyticsService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserType = 'freemium' | 'premium' | 'Lawyer' | 'guest' | "Law Firm" | "SME" | "A2J Partners" | "User";
export type PlanType = 'weekly' | 'monthly' | 'annual' | 'daily' | 'topup' | null;
export type PurchaseSource = 'subscription_plans' | 'upgrade_plans' | 'daily_pass' | 'top_up';
export type SignupMethod = 'email' | 'google' | 'apple';

export type ConsultationMode = 'chat' | 'call';

interface GlobalProps {
    userId?: string;       // hashed — never raw
    sessionId?: string;
    userType?: UserType;
    language?: string;
    country?: string;
}

// ─── Internal state ───────────────────────────────────────────────────────────

let _globalProps: GlobalProps = {};
let _appsFlyerEnabled = false;
const APP_VERSION = Constants.expoConfig?.version ?? 'unknown';

// ─── Init ─────────────────────────────────────────────────────────────────────

function setAppsFlyerEnabled(enabled: boolean): void {
    _appsFlyerEnabled = enabled;
}

/**
 * Call once on app start (after consent is granted).
 * Sets user properties on both Firebase and AppsFlyer.
 */
async function init(props: GlobalProps): Promise<void> {
    _globalProps = {
        ..._globalProps,
        ...props,
    };

    if (_globalProps.userId) {
        await analytics().setUserId(_globalProps.userId);
        if (_appsFlyerEnabled) {
            appsFlyer.setCustomerUserId(_globalProps.userId, (res:any) => {
                console.debug('[AF] setCustomerUserId', res);
            });
        }
    }

    if (_globalProps.userType) {
        await analytics().setUserProperties({ user_type: _globalProps.userType });
    }

    if (_globalProps.language) {
        await analytics().setUserProperties({ language: _globalProps.language });
    }
}

/**
 * Call on logout / user opt-out to stop tracking.
 */
async function reset(): Promise<void> {
    _globalProps = {};
    await analytics().setUserId(null);
    await analytics().resetAnalyticsData();
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Merge event params with global props so every event carries the base fields. */
function buildParams(extra: Record<string, unknown> = {}): Record<string, string | number | boolean> {
    const base: Record<string, string | number | boolean> = {
        app_version: APP_VERSION,
        platform: Platform.OS,
    };

    if (_globalProps.userId)   base.user_id    = _globalProps.userId;
    if (_globalProps.sessionId) base.session_id = _globalProps.sessionId;
    if (_globalProps.userType) base.user_type  = _globalProps.userType;
    if (_globalProps.language) base.language   = _globalProps.language;
    if (_globalProps.country)  base.country    = _globalProps.country;

    // Flatten extra — Firebase only accepts string | number | boolean values
    for (const [k, v] of Object.entries(extra)) {
        if (v !== undefined && v !== null) {
            base[k] = v as string | number | boolean;
        }
    }

    return base;
}

/** Log to Firebase Analytics */
async function logEvent(name: string, params: Record<string, unknown> = {}): Promise<void> {
    try {
        await analytics().logEvent(name, buildParams(params));
    } catch (e) {
        console.warn(`[Analytics] logEvent failed: ${name}`, e);
    }
}

/** Log to AppsFlyer (mirrors Firebase event) */
function logAF(name: string, params: Record<string, unknown> = {}): void {
    if (!_appsFlyerEnabled) return;

    try {
        appsFlyer.logEvent(name, buildParams(params), () => {}, (err:any) => {
            console.warn(`[AppsFlyer] logEvent failed: ${name}`, err);
        });
    } catch (e) {
        console.warn(`[AppsFlyer] logEvent threw: ${name}`, e);
    }
}

/** Log to both Firebase + AppsFlyer */
async function log(name: string, params: Record<string, unknown> = {}): Promise<void> {
    await logEvent(name, params);
    logAF(name, params);
}

// ─── User Lifecycle ───────────────────────────────────────────────────────────

function normalizeSignupAccountType(accountType?: string): string {
    const normalized = accountType?.trim().toLowerCase();

    switch (normalized) {
        case 'lawyer':
            return 'lawyer';
        case 'law firm':
        case 'law-firm':
            return 'law-firm';
        case 'sme':
        case 'hr/legal (sme)':
        case 'hr-legal':
            return 'hr-legal';
        case 'a2j partners':
        case 'a2jpartner':
        case 'a2j-partner':
            return 'a2j-partner';
        default:
            return 'user';
    }
}

async function appOpen(): Promise<void> {
    await logEvent('app_open');
}

/**
 * Log signup intent before authentication or account creation starts. Firebase
 * retains its anonymous app-instance identifier, so funnels can include people
 * who never create a LawNeeds user record.
 */
async function signupStarted(params: {
    method: SignupMethod;
    accountType?: string;
}): Promise<void> {
    await logEvent('signup_started', {
        signup_method: params.method,
        account_type: normalizeSignupAccountType(params.accountType),
    });
}

/** Log only after the backend confirms that a new account was created. */
async function signupCompleted(params: {
    method: SignupMethod;
    accountType?: string;
}): Promise<void> {
    try {
        await analytics().logSignUp({method: params.method});
    } catch (e) {
        console.warn('[Analytics] Firebase sign_up event failed', e);
    }
    await logEvent('signup_completed', {
        signup_method: params.method,
        account_type: normalizeSignupAccountType(params.accountType),
    });
}

async function onboardingCompleted(): Promise<void> {
    await logEvent('onboarding_completed');
}

async function firstLegalQuery(): Promise<void> {
    await logEvent('first_legal_query');
}

async function firstAiInteraction(): Promise<void> {
    await log('first_ai_interaction');
}

async function homeActionSelected(params: {action: HomeAction}): Promise<void> {
    const destination = params.action === 'find_professional'
        ? 'search'
        : params.action === 'book_consultation'
            ? 'chatbot_referral'
            : 'chatbot';

    await Promise.all([
        logEvent('home_action_selected', {
            action: params.action,
            destination,
        }),
        ProductAnalyticsService.recordHomeAction(
            params.action,
            Platform.OS,
            APP_VERSION,
        ).catch((error: unknown) => {
            console.warn('[Analytics] Admin home-action tracking failed', error);
        }),
    ]);
    logAF('home_action_selected', {action: params.action, destination});
}

async function paywallViewed(params: { planType?: PlanType } = {}): Promise<void> {
    await log('paywall_viewed', { plan_type: params.planType ?? '' });
}

async function upgradeInfoAvailable(params: { planType?: PlanType } = {}): Promise<void> {
    await log('upgrade_option_available');
}

// ─── Chatbot ──────────────────────────────────────────────────────────────────

async function chatSessionStarted(params: {
    userType: UserType;
    sessionId?: string;
}): Promise<void> {
    await logEvent('chat_session_started', {
        user_type: params.userType,
        sessionId: params.sessionId ?? '',
    });
}

async function chatMessageSent(params: {
    messageLength: number;
    language: string;
    sessionId: string;
}): Promise<void> {
    await logEvent('chat_message_sent', {
        message_length: params.messageLength,
        language: params.language,
        session_id: params.sessionId,
    });
}

// ─── Uploads ──────────────────────────────────────────────────────────────────

async function voiceNoteUploaded(params: {
    duration: number;   // seconds
    language: string;
}): Promise<void> {
    await logEvent('voice_note_uploaded', {
        duration: params.duration,
        language: params.language,
    });
}

async function imageUploaded(params: { fileType: string }): Promise<void> {
    await logEvent('image_uploaded', { file_type: params.fileType });
}

async function documentUploaded(params: { fileType: string }): Promise<void> {
    await logEvent('document_uploaded', { file_type: params.fileType });
}

// ─── Lawyer Referral & Match ──────────────────────────────────────────────────

async function referralRequested(params: {
    areaOfLaw: string;
    urgency: string;
    budget?: string;
}): Promise<void> {
    await log('referral_requested', {
        area_of_law: params.areaOfLaw,
        urgency: params.urgency,
        budget: params.budget ?? '',
    });
}

async function referralInitiated(params: {
    areaOfLaw?: string;
}): Promise<void> {
    await log('referral_initiated', {
        area_of_law: params.areaOfLaw ?? '',
    });
}

async function lawyerMatched(params: {
    action: string;
    firm_id: number;   // seconds
}): Promise<void> {
    await logEvent('lawyer_matched', {
        firm_id: params.firm_id,
        action: params.action,
    });
}

async function lawyerHandoffInitiated(params: {
    firmId?: string;
    areaOfLaw?: string;
}): Promise<void> {
    await log('lawyer_handoff_initiated', {
        firm_id: params.firmId ?? '',
        area_of_law: params.areaOfLaw ?? '',
    });
}

// ─── Consultation ─────────────────────────────────────────────────────────────

async function consultationStarted(params: {
    mode: ConsultationMode;
    duration?: string;
}): Promise<void> {
    await logEvent('consultation_started', {
        mode: params.mode,
        duration: params.duration ?? 0,
    });
}

// ─── AI Document Generation ───────────────────────────────────────────────────

async function aiDocGenerated(params: { docType: string }): Promise<void> {
    await logEvent('ai_doc_generated', { doc_type: params.docType });
}

// ─── Subscription ─────────────────────────────────────────────────────────────

async function planViewed(params: { planType: PlanType }): Promise<void> {
    await logEvent('plan_viewed', { plan_type: params.planType });
}

async function setUserId(userId: string) : Promise<void> {
    _globalProps.userId = userId;
    await analytics().setUserId(userId);
    if (_appsFlyerEnabled) {
        appsFlyer.setCustomerUserId(userId, () => {});
    }
};

async function planPurchased(params: {
    planType: PlanType;
    price: number;
    currency?: string;
    productId?: string;
    packageId?: string;
    transactionId?: string;
    source?: PurchaseSource;
}): Promise<void> {
    const purchaseParams: Parameters<ReturnType<typeof analytics>['logPurchase']>[0] = {
        value: params.price,
        currency: params.currency ?? 'GBP',
        items: [{
            item_id: params.productId ?? params.packageId ?? params.planType ?? '',
            item_name: params.planType ?? '',
        }],
    };

    if (params.transactionId) {
        purchaseParams.transaction_id = params.transactionId;
    }

    // Firebase standard purchase event
    await analytics().logPurchase(purchaseParams);

    // Custom event for funnel tracking
    await log('plan_purchased', {
        plan_type: params.planType,
        price: params.price,
        currency: params.currency ?? 'GBP',
        product_id: params.productId,
        package_id: params.packageId,
        transaction_id: params.transactionId,
        source: params.source,
    });
}

async function purchaseAttempted(params: {
    planType: PlanType;
    price?: number;
    currency?: string;
    productId?: string;
    packageId?: string;
    source?: PurchaseSource;
}): Promise<void> {
    await log('purchase_attempted', {
        plan_type: params.planType,
        price: params.price ?? 0,
        currency: params.currency ?? 'GBP',
        product_id: params.productId,
        package_id: params.packageId,
        source: params.source,
    });
}

async function purchaseFailed(params: {
    planType: PlanType;
    price?: number;
    currency?: string;
    productId?: string;
    packageId?: string;
    source?: PurchaseSource;
    reason?: string;
    userCancelled?: boolean;
}): Promise<void> {
    await log('purchase_failed', {
        plan_type: params.planType,
        price: params.price ?? 0,
        currency: params.currency ?? 'GBP',
        product_id: params.productId,
        package_id: params.packageId,
        source: params.source,
        reason: params.reason,
        user_cancelled: params.userCancelled ?? false,
    });
}

async function subscriptionStarted(params: {
    planType: PlanType;
    price?: number;
    currency?: string;
}): Promise<void> {
    await log('subscription_started', {
        plan_type: params.planType,
        price: params.price ?? 0,
        currency: params.currency ?? 'GBP',
    });
}

// ─── Minutes ──────────────────────────────────────────────────────────────────

async function minutesUsed(params: { minutesUsed: number }): Promise<void> {
    await logEvent('minutes_used', { minutes_used: params.minutesUsed });
}

// ─── Screen tracking ──────────────────────────────────────────────────────────

/**
 * Call from your navigation listener.
 * e.g. onStateChange in NavigationContainer.
 */
async function logScreen(screenName: string, screenClass?: string): Promise<void> {
    try {
        await analytics().logScreenView({
            screen_name: screenName,
            screen_class: screenClass ?? screenName,
        });
    } catch (e) {
        console.warn(`[Analytics] logScreen failed: ${screenName}`, e);
    }
}

// ─── AppsFlyer deep link / attribution ───────────────────────────────────────

/**
 * Initialise AppsFlyer. Call once at app root before any events.
 * devKey and appId come from your AppsFlyer dashboard.
 */
function initAppsFlyer(params: {
    devKey: string;
    appId: string;         // iOS App Store ID
    isDebug?: boolean;
}): void {
    appsFlyer.initSdk(
        {
            devKey: params.devKey,
            isDebug: params.isDebug ?? false,
            appId: params.appId,
            onInstallConversionDataListener: true,
            onDeepLinkListener: true,
            timeToWaitForATTUserAuthorization: 10,
        },
        (result:any) => console.debug('[AF] init success', result),
        (error:any) => console.warn('[AF] init error', error),
    );
}

/**
 * Handle incoming deep links from campaigns.
 * Attach this to your Linking / AppsFlyer deep link listener.
 */
function handleDeepLink(callback: (campaign: string, data: Record<string, unknown>) => void): void {
    appsFlyer.onDeepLink((res:any) => {
        if (res?.deepLinkStatus === 'FOUND') {
            const campaign = res.data?.campaign ?? '';
            callback(campaign, res.data ?? {});
        }
    });
}

// ─── Export ───────────────────────────────────────────────────────────────────

const Analytics = {
    // Setup
    init,
    reset,
    setAppsFlyerEnabled,
    initAppsFlyer,
    handleDeepLink,
    logScreen,

    // Lifecycle
    appOpen,
    signupStarted,
    signupCompleted,
    onboardingCompleted,
    firstLegalQuery,
    firstAiInteraction,
    homeActionSelected,
    paywallViewed,

    // Chatbot
    chatSessionStarted,
    chatMessageSent,

    // Uploads
    voiceNoteUploaded,
    imageUploaded,
    documentUploaded,

    // Lawyer
    referralRequested,
    referralInitiated,
    lawyerMatched,
    lawyerHandoffInitiated,
    consultationStarted,

    // AI Docs
    aiDocGenerated,

    // Subscription
    planViewed,
    planPurchased,
    purchaseAttempted,
    purchaseFailed,
    upgradeInfoAvailable,
    subscriptionStarted,
    minutesUsed,

    setUserId
};

export default Analytics;

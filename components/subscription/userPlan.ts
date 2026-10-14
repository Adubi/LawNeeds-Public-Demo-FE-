// types/userPlan.ts

export interface UserSubscription {
    plan_id: string;
    plan_name: string;
    tier: string;
    billing_period: string | null;
    status: 'active' | 'expired' | 'canceled' | string;
    current_period_end: string;
    auto_renew: boolean;
    is_first_month: boolean;
}

export interface MinutesUsage {
    total: number;
    used: number;
    available: number;
    rollover: number;
    top_up: number;
    top_ups_this_month: number;
    usage_percent: number;
    alert_threshold_reached: boolean;
}

export interface MonthlyUsage {
    voice_notes: number;
    uploads: number;
    docgen: number;
    queries: number;
}

export interface AccountLimits {
    voice_notes_limit: number;
    uploads_limit: number;
    docgen_limit: number;
    max_image_size_mb: number;
    max_doc_pages: number;
}

export interface FeatureAccess {
    unlimited_ai_queries: boolean;
    rollover_enabled: boolean;
    priority_support: boolean;
}

export interface FreemiumDetails {
    queries_remaining: number;
    queries_limit?: number;
    base_query_limit?: number;
    queries_locked: boolean;
    unlock_at: string | null;
    window_ends: string;
    daily_pass_active: boolean;
    daily_pass_expires: string | null;
    trial_expired: boolean;
    trial_voice_notes_used: number;
    trial_uploads_used: number;
    trial_docgen_used: number;
}

export interface UserPlanData {
    subscription: UserSubscription;
    minutes: MinutesUsage;
    monthly_usage: MonthlyUsage;
    limits: AccountLimits;
    features: FeatureAccess;
    freemium: FreemiumDetails;
}

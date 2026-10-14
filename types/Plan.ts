export type BillingPeriod = 'weekly' | 'monthly' | 'annual' | null;
export type Tier = 'freemium' | 'standard' | 'premium';

export interface Plan {
    id: string;
    name: string;
    tier: Tier;
    billing_period: BillingPeriod;
    price_gbp: number;
    minutes_included: number;
    voice_notes_limit: number | null;
    uploads_limit: number;
    docgen_limit: number;
    max_image_size_mb: number;
    max_doc_pages: number;
    unlimited_ai_queries: boolean;
    rollover_enabled: boolean;
    priority_support: boolean;
    early_access: boolean;
    free_consultation_minutes: number | null;
}

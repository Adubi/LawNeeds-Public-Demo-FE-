export enum AnalyticsEvent {

    VOICE_NOTE_USED = 'voice_note_used',
    DOCUMENT_UPLOADED = 'document_uploaded',
    AI_DOC_GENERATED = 'ai_doc_generated',

    MINUTES_EXHAUSTED = 'minutes_exhausted',

    SUBSCRIPTION_STARTED = 'subscription_started',
    SUBSCRIPTION_RENEWED = 'subscription_renewed',
    SUBSCRIPTION_CANCELLED = 'subscription_cancelled',

    TOP_UP_PURCHASE = 'top_up_purchase',
    DAILY_QUERY_PASS_PURCHASE = 'daily_query_pass_purchase',

    FREEMIUM_TRIAL_EXHAUSTED = 'freemium_trial_exhausted',
    UPGRADE_PROMPT_SHOWN = 'upgrade_prompt_shown',

    LAWYER_CONSULTATION_BOOKED = 'lawyer_consultation_booked'
}
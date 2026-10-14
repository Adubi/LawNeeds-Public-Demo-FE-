export const NOTIFICATION_TYPES = {
  // REFERRALS
  NEW_REFERRAL: "new_referral",
  REFERRAL_ACCEPTED: "referral_accepted",
  REQUEST_CREATED: "request_created",
  REQUEST_CANCELLED: "case_cancelled_by_user",
  REFERRAL_REJECTED: "referral_rejected",
  REFERRAL_UNDER_REVIEW: "referral_under_review",
  REFERRAL_EXPIRED: "referral_expired",

  // MESSAGING
  NEW_MESSAGE: "new_message",

  // REVIEWS
  NEW_REVIEW: "new_review",

  // CONSULTATION / PAYMENT
  CONSULTATION_BOOKED: "consultation_booked",
  PRICE_PROPOSED: "price_proposed",
  PAYMENT_CONFIRMED: "payment_confirmed",
  ONE_MINUTE_WARNING: "one_minute_warning",
  SESSION_ENDED: "session_ended",
  CONSULTATION_END_REQUESTED: "consultation_end_requested",
  MISSED_CONSULTATION: "missed_consultation",

  // PAYOUTS
  PAYOUT_SENT: "payout_sent",
  PAYOUT_FAILED: "payout_failed",

  // SUBSCRIPTION
  USAGE_ALERT: "usage_alert",
  TOP_UP_SUGGESTION: "top_up_suggestion",
  SUBSCRIPTION_REMINDER: "subscription_reminder",
  SUBSCRIPTION_EXPIRES_TODAY: "subscription_expires_today",
  SUBSCRIPTION_EXPIRED: "subscription_expired",
  SUBSCRIPTION_RENEWED: "subscription_renewed",
  ANNUAL_BENEFITS_REMINDER: "annual_benefits_reminder",
  ANNUAL_CREDIT_REMINDER: "annual_credit_reminder",
  CONSULTATION_EXTENDED: "consultation_extended",
  EXTENSION_STARTED: "extension_started",
  EXTENSION_REQUESTED: "extension_requested",
  EXTENSION_APPROVED: "extension_approved",
  EXTENSION_PROPOSED: "extension_proposed",
  EXTENSION_DENIED: "extension_denied",
  EXTENSION_PAYMENT_CONFIRMED: "extension_payment_confirmed",
  EXTENSION_TIMED_OUT: "extension_timed_out",
  DAY_COMPLETED: "day_completed",

  // WEEKLY SUMMARY
  WEEKLY_SUMMARY: "weekly_summary",
  RESPONSE_RATE_WARNING: "response_rate_warning",

  // IDENTITY VERIFICATION
  VERIFICATION_COMPLETED: "verification_completed",
  VERIFICATION_RESUBMISSION_REQUIRED: "verification_resubmission_required",
  VERIFICATION_NOT_COMMENCED: "verification_not_commenced",
  VERIFICATION_ABANDONED: "verification_abandoned",

  // ONBOARDING / PROFILE
  WELCOME_BACK: "welcome_back",
  PROFILE_INCOMPLETE: "profile_incomplete",
  PROFILE_SURVEY_INCOMPLETE: "profile_survey_incomplete",

  // APP
  APP_UPDATE_AVAILABLE: "app_update_available",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

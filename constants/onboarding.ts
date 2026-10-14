export const PROFILE_COMPLETION_PROMPT_KEY = "profile_completion_prompt_pending";
export const PROFILE_COMPLETION_UPDATED_EVENT = "profile_completion_updated";
export const PROFILE_SURVEY_REQUEST_KEY = "profile_survey_open_requested";
export const PROFILE_SURVEY_REQUESTED_EVENT = "profile_survey_open_requested";

type DeferredProfile = {
    address?: string | null;
    town_city?: string | null;
    postcode?: string | null;
    immigration_status?: string | null;
    webinar?: boolean | null;
};

export const isDeferredProfileComplete = (profile?: DeferredProfile | null) => Boolean(
    profile?.address?.trim() &&
    profile?.town_city?.trim() &&
    profile?.postcode?.trim() &&
    profile?.immigration_status?.trim() &&
    typeof profile?.webinar === "boolean"
);

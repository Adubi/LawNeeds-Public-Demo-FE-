import requests from "./httpservice";

const ConsultationService = {
    // -----------------------------
    // REFERRAL STATUS (USER)
    // -----------------------------
    GetReferralUserStatus(conversationId) {
        return requests.get(`referral/user_status/${conversationId}`);
    },

    // -----------------------------
    // STRIPE (LAWYER)
    // -----------------------------
    StripeOnboard(data) {
        return requests.post(`consultation/lawyer/stripe/onboard`, data);
    },

    GetStripeStatus() {
        return requests.get(`consultation/lawyer/stripe/status`);
    },

    GetStripeDashboardLink() {
        return requests.post(`consultation/lawyer/stripe/dashboard-link`);
    },

    // -----------------------------
    // PRICING RULES (LAWYER)
    // -----------------------------
    GetPricingRules(sessionId) {
        return requests.get(`consultation/sessions/${sessionId}/pricing-rules`);
    },

    // -----------------------------
    // PROPOSE PRICE (LAWYER)
    // -----------------------------
    ProposePrice(sessionId, data) {
      //  console.log("ProposePrice", data);
      //  console.log("sessionId", sessionId);
        return requests.post(
            `consultation/sessions/${sessionId}/propose-price`,
            data
        );
    },

    // -----------------------------
    // PAYMENT (BOTH)
    // -----------------------------
    GetPayment(sessionId) {
        return requests.get(`consultation/sessions/${sessionId}/payment`);
    },

    GetPaymentSummary(sessionId) {
        return requests.get(
            `consultation/sessions/${sessionId}/payment/summary`
        );
    },

    ConfirmPayment(sessionId, data) {
        return requests.post(
            `consultation/sessions/${sessionId}/confirm-payment`,
            data
        );
    },

    // -----------------------------
    // TIMER (BOTH)
    // -----------------------------
    StartTimer(sessionId) {
        return requests.post(
            `consultation/sessions/${sessionId}/timer/start`
        );
    },

    EndTimer(sessionId) {
        return requests.post(
            `consultation/sessions/${sessionId}/timer/end`
        );
    },

    RequestEndConsultation(sessionId) {
        return requests.post(
            `consultation/sessions/${sessionId}/end-request`
        );
    },

    SubmitEndConsultationAnswers(sessionId, data) {
        return requests.post(
            `consultation/sessions/${sessionId}/end-request/answers`,
            data
        );
    },

    ConfirmEndConsultation(sessionId) {
        return requests.post(
            `consultation/sessions/${sessionId}/end-request/confirm`
        );
    },

    GetSurvey(sessionId) {
        return requests.get(`consultation/sessions/${sessionId}/survey`);
    },

    SubmitSurvey(sessionId, data) {
        return requests.post(`consultation/sessions/${sessionId}/survey`, data);
    },

    ExtendTimer(sessionId, data) {
        return requests.post(
            `consultation/sessions/${sessionId}/timer/extend`,
            data
        );
    },

    GetExtensionOptions(sessionId) {
        return requests.get(`consultation/sessions/${sessionId}/extensions/options`);
    },

    GetActiveExtension(sessionId) {
        return requests.get(`consultation/sessions/${sessionId}/extensions/active`);
    },

    PauseForExtension(sessionId) {
        return requests.post(`consultation/sessions/${sessionId}/extensions/pause`);
    },

    SubmitExtension(extensionId, minutes) {
        return requests.post(`consultation/extensions/${extensionId}/submit`, {
            extend_minutes: minutes,
        });
    },

    DecideExtension(extensionId, decision, proposedMinutes) {
        return requests.post(`consultation/extensions/${extensionId}/decision`, {
            decision,
            proposed_minutes: proposedMinutes,
        });
    },

    CancelExtension(extensionId) {
        return requests.post(`consultation/extensions/${extensionId}/cancel`);
    },

    CreateExtensionPayment(extensionId) {
        return requests.post(`consultation/extensions/${extensionId}/payment`);
    },

    ConfirmExtensionPayment(extensionId, data) {
        return requests.post(`consultation/extensions/${extensionId}/confirm-payment`, data);
    },
};

export default ConsultationService;

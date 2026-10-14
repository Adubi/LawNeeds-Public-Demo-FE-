import requests from "./httpservice";

const SubscriptionService = {
    GetUsageHistory() {
        return requests.get(`subscription/usage-history?limit=50`)
    },
    GetMyPlan() {
        return requests.get(`subscription/my-plan`)
    },
    GetUpgradeOptions() {
        return requests.get(`subscription/upgrade-options`)
    },
    GetSubscriptionPlans() {
        return requests.get(`subscription/plans`)
    },
    CancelSubscription(data) {
        return requests.post(`subscription/cancel`, data);
    },
    SubscriptionTopUp(data) {
        return requests.post(`subscription/top-up`, data);
    },
    SubscriptionDailyPass(data) {
        return requests.post(`subscription/daily-pass`, data);
    },
    SubscriptionAdWatched() {
        return requests.post(`subscription/ad-watched`);
    },
    SubscriptionSync(data) {
        return requests.post(`/subscription/sync`, data);
    },
    SubscriptionConsumableSync(data) {
        return requests.post(`/subscription/sync-consumables`, data);
    },

};

export default SubscriptionService;
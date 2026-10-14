import requests from "./httpservice";

export type HomeAction =
    | "ask_lawneeds_ai"
    | "find_professional"
    | "book_consultation";

const ProductAnalyticsService = {
    recordHomeAction(action: HomeAction, platform: string, appVersion: string) {
        return requests.post("analytics/home-actions", {
            action,
            platform,
            app_version: appVersion,
        });
    },
};

export default ProductAnalyticsService;

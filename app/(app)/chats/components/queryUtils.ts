export interface QueryRemainingResult {
    isQueryRemaining: boolean;
    queryRemainingCount: number;
}

export const getQueryRemainingStatus = (
    walletData: any
): QueryRemainingResult => {
    let isQueryRemaining = true;
    let queryRemainingCount = 6;

    if (!walletData?.subscription) {
        return { isQueryRemaining: true, queryRemainingCount: 0 };
    }

    const { subscription, freemium } = walletData;

    // If not freemium plan → unlimited
    if (subscription?.plan_id !== "freemium") {
        return { isQueryRemaining: true, queryRemainingCount: 6 };
        // -1 means unlimited (optional convention)
    }

    // If daily pass active → unlimited for today
    if (freemium?.daily_pass_active) {
        return { isQueryRemaining: true, queryRemainingCount: 6 };
    }

    const remaining = freemium?.queries_remaining ?? 0;

    return {
        isQueryRemaining: remaining > 0,
        queryRemainingCount: remaining,
    };
};
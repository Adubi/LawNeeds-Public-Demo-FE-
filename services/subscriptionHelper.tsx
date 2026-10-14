import SubscriptionService from "@/services/SubscriptionService";
import {Alert} from "react-native";
import {getDailyPassOffering, getUserData} from "@/constants/Utility";
import Purchases from "react-native-purchases";
import Analytics from "@/helpers/AnalyticsHelper";
import ConsultationService from "@/services/ConsultationService";


export const getSubscriptionUsageHistory = async (success: any, error: any) => {

    try {

        let result = await SubscriptionService.GetUsageHistory();

        if (result) {
            if (success) {
                success(result);
            }
        } else {
            if (error) {
                error(result)
            }
        }

    } catch (e) {
        if (error) {
            error(e)
        }
    }
}

export const getSubscriptionPlans = async (success: any, error: any) => {


    try {

        let result = await SubscriptionService.GetSubscriptionPlans();

        if (result) {
            if (success) {
                success(result);
            }
        } else {
            if (error) {
                error(result)
            }
        }

    } catch (e) {
        if (error) {
            error(e)
        }
    }


}

export const getUserPlan = async (success: any, error: any) => {

    try {

        let result = await SubscriptionService.GetMyPlan();

        if (result) {
            if (success) {
                success(result);
            }
        } else {
            if (error) {
                error(result)
            }
        }

    } catch (e) {

        if (error) {
            error(e)
        }
    }

}

export const getUpgradeOptions = async (success: any, error: any) => {

    try {

        let result = await SubscriptionService.GetUpgradeOptions();

        if (result) {
            if (success) {
                success(result);
            }
        } else {
            if (error) {
                error(result)
            }
        }

    } catch (e) {

        if (error) {
            error(e)
        }
    }

}

export const syncTopUpOrDailyPass = async (
    transaction: any,
    success: any, error: any) => {

    try {

        const loginUserData = await getUserData();
        const userId = loginUserData?.id ?? "";

        let data = {
            "user_id": userId,
            "transaction_id": transaction?.transactionIdentifier,
            "product_id": transaction?.productId,
            "purchase_date": transaction?.purchaseDate
        }

        const result = await SubscriptionService.SubscriptionConsumableSync(data);

        if (result) {
            if (success) {
                success(result);
            }
        } else {
            if (error) {
                error(result)
            }
        }

    } catch (e) {

        console.log("error", e);
        if (error) {
            error(e)
        }
    }

}

export const syncAdWatched = async () => {
    try {
        return await SubscriptionService.SubscriptionAdWatched();
    } catch (e) {
        throw e;
    }
}

export const syncSubscription = async (
    data: any,
    success: any,
    error: any
) => {

    try {

        let result = await SubscriptionService.SubscriptionSync(data);

        if (result) {
            if (success) {
                success(result);
            }
        } else {
            if (error) {
                error(result)
            }
        }

    } catch (e) {

        if (error) {
            error(e)
        }
    }

}

export const syncSubscriptionFirstTime = async (
    data: any
) => {

    try {
        return await SubscriptionService.SubscriptionSync(data);
    } catch (e) {
        return false;
    }

}

export const buyDailyPass = async (t: any, success: any, error: any) => {
    try {

        let dailyPassPackages = await getDailyPassOffering()
        if (dailyPassPackages) {
            let data = dailyPassPackages.filter(item => item.identifier === 'daily_pass')
            if (data.length > 0) {
                Analytics.purchaseAttempted({
                    planType: 'daily',
                    price: data[0].product.price,
                    currency: data[0].product.currencyCode,
                    productId: data[0].product.identifier,
                    packageId: data[0].identifier,
                    source: 'daily_pass',
                });

                const { transaction } = await Purchases.purchasePackage(data[0]);
                Alert.alert(t('success.success'), t('daily_pass_success'));

                Analytics.planPurchased({
                    planType: 'daily',
                    price: data[0].product.price,
                    currency: data[0].product.currencyCode,
                    productId: data[0].product.identifier,
                    packageId: data[0].identifier,
                    transactionId: transaction?.transactionIdentifier,
                    source: 'daily_pass',
                });

                if (transaction) {
                    syncTopUpOrDailyPass(transaction, async (result: any) => {
                        if (success) {
                            success()
                        }
                    }, async (syncError: any) => {
                        if (error) {
                            error(syncError)
                        }

                    })
                } else {
                    Analytics.purchaseFailed({
                        planType: 'daily',
                        price: data[0].product.price,
                        currency: data[0].product.currencyCode,
                        productId: data[0].product.identifier,
                        packageId: data[0].identifier,
                        source: 'daily_pass',
                        reason: 'missing_transaction',
                    });
                    if (error) {
                        error()
                    }
                }
            } else {
                Analytics.purchaseFailed({
                    planType: 'daily',
                    source: 'daily_pass',
                    reason: 'package_not_found',
                });
                if (error) {
                    error()
                }
            }
        } else {
            Analytics.purchaseFailed({
                planType: 'daily',
                source: 'daily_pass',
                reason: 'offering_not_found',
            });
            Alert.alert(t('error.title'), t('daily_pass_not_found'));
            if (error) {
                error()
            }
        }

    } catch (e: any) {
        Analytics.purchaseFailed({
            planType: 'daily',
            source: 'daily_pass',
            reason: e?.message ?? 'daily_pass_purchase_failed',
            userCancelled: e?.userCancelled ?? false,
        });
        if (!e.userCancelled) {
            Alert.alert(t('purchase_failed'), e.message);
        }
        if (error) {
            error(e)
        }
    }
};

export const checkStripeStatus = async () => {
    try {
        const res = await ConsultationService.GetStripeStatus();
        return res?.onboarded || false;
    } catch (error) {
        console.log("Stripe status error:", error);
        return false;
    }
};

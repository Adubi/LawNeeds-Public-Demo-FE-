import React from "react";
import {router} from "expo-router";
import FreemiumAdModal from "@/components/subscription/FreemiumAdModal";
import FreemiumLimitModal from "@/components/subscription/FreemiumLimitModal";
import TopUpModal from "@/components/subscription/TopUpModal";
import PremiumMinutesModal from "@/components/subscription/PremiumMinutesModal";

type Props = {
    walletData: any;

    isShowAdsView: boolean;
    setShowAdsView: (v: boolean) => void;
    showRewardedAd: () => void;
    clickBuyPass: (isClicked: boolean) => void;

    modalConfig: any;
    setModalConfig: (v: any) => void;

    isShowTopUpView: boolean;
    showTopUpView: (v: boolean) => void;

    isShowPremiumTopUpView: boolean;
    showPremiumTopUpView: (v: boolean) => void;

    isPurchasing: boolean;
};

export default function SubscriptionModals({
                                               walletData,
                                               isShowAdsView,
                                               setShowAdsView,
                                               showRewardedAd,
                                               clickBuyPass,
                                               modalConfig,
                                               setModalConfig,
                                               isShowTopUpView,
                                               showTopUpView,
                                               isShowPremiumTopUpView,
                                               showPremiumTopUpView,
                                               isPurchasing
                                           }: Props) {

    return (
        <>
            {/* Freemium Ad Modal */}
            <FreemiumAdModal
                visible={isShowAdsView}
                unlockAt={walletData?.freemium?.unlock_at}
                onStartAds={() => {
                    setShowAdsView(false);
                    setTimeout(showRewardedAd, 2500);
                }}
                onBuyPass={async () => {
                    clickBuyPass(true);
                }}
                onUpgrade={() => {
                    setShowAdsView(false);
                    setTimeout(() => {
                        router.push("/(app)/manageSubscription/subscription-plans-screen");
                    }, 2000);
                }}
                onClose={() => setShowAdsView(false)}
            />

            {/* Freemium Limit Modal */}
            <FreemiumLimitModal
                visible={modalConfig.visible}
                message={modalConfig.message}
                suggestions={modalConfig.suggestions}
                onUpgrade={() => {
                    setModalConfig({ ...modalConfig, visible: false });

                    setTimeout(() => {
                        if (walletData?.subscription?.plan_id === "freemium") {
                            router.push("/(app)/manageSubscription/subscription-plans-screen");
                        } else {
                            router.push("/(app)/manageSubscription/upgrade-plans-screen");
                        }
                    }, 1500);
                }}
                onClose={() =>
                    setModalConfig({ ...modalConfig, visible: false })
                }
            />

            {/* TopUp Modal */}
            <TopUpModal
                isVisible={isShowTopUpView}
                onClose={() => showTopUpView(false)}
                isPurchasing={isPurchasing}
                monthlyTopUpCount={walletData?.minutes?.top_ups_this_month ?? 0}
            />

            {/* Premium Minutes Modal */}
            <PremiumMinutesModal
                visible={isShowPremiumTopUpView}
                isFreemium={walletData?.subscription?.plan_id === "freemium"}
                onOpenTopup={() => {
                    showPremiumTopUpView(false);
                    setTimeout(() => showTopUpView(true), 1500);
                }}
                onUpgradePremium={() => {
                    showPremiumTopUpView(false);
                    setTimeout(() => {
                        if (walletData?.subscription?.plan_id === "freemium") {
                            router.push("/(app)/manageSubscription/subscription-plans-screen");
                        } else {
                            router.push("/(app)/manageSubscription/upgrade-plans-screen");
                        }
                    }, 1500);
                }}
                onClose={() => showPremiumTopUpView(false)}
            />

        </>
    );
}

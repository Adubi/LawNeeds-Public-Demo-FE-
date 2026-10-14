import React, {FC, useState} from 'react';
import {Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from "react-i18next";
import {cancellationPolicy} from "@/services/httpservice";

const Colors = {
    PrimaryGreen: '#176535',
    AccentOrange: '#DD8550',
    TextDark: '#033126',
    BorderGray: '#EFEFEF',
    White: '#FFFFFF',
};

export interface Plan {
    id: string;
    name: string; // "Basic", "Express", "Standard", "Premium"
    tier: 'freemium' | 'express' | 'standard' | 'premium';
    billing_period: 'daily' | 'weekly' | 'monthly' | 'annual' | null;
    price_gbp: number;
    minutes_included: number;
    unlimited_ai_queries: boolean;
    rollover_enabled: boolean;
    isDiscount?: boolean;
    currencyCode?: string;
    displayPrice?: string;
    // Limits
    voice_notes_limit: number | null; // Null usually means 'unlimited'
    uploads_limit: number;
    docgen_limit: number;
    max_image_size_mb: number;
    max_doc_pages: number;

    // New API Fields
    priority_support: boolean;
    early_access: boolean;
    free_consultation_minutes: number | null;
    first_month_price_gbp: number | null;
    first_month_display_price?: string | null;
    first_month_discount_percent: number | null;

    // Promotional & Basic Specifics
    /*  is_promotional?: boolean; // Toggles the 1st-month promo rows for Basic
      query_max?: string;      // e.g., "10 queries/6 hrs limit"

      // Promotional Basic Overrides
      promo_voice_notes?: number; // e.g., 2
      promo_uploads?: number;     // e.g., 2
      promo_doc_gen?: number;     // e.g., 2

      // Hard Constraints & Caps
      max_voice_duration?: number; // e.g., 5 (minutes)
      // UI Extras
      discount_badge?: string;     // e.g., "50% OFF"*/
}

interface PlanCardProps {
    plan: Plan;
    isSelected: boolean;
    isActive?: boolean;
    ctaLabel?: string;
    ctaDisabled?: boolean;
    onSubscribe: (plan: Plan) => void;
    allTierOptions?: Plan[];
    selectedPeriod?: string;
    onPeriodChange?: (period: string) => void;
    isShowDiscount: boolean
}

const FeatureRow = ({ label, value, isBold, isNote, last }: any) => {

    const {t} = useTranslation();

    const displayValue = React.useMemo(() => {
        if (value === null) return "Unlimited";
        if (value === 0 && !isBold) return "None"; // Optional: helps clarify for Express tier
        return value;
    }, [value, isBold]);

    return (
        <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
            <Text
                style={[
                    styles.rowLabel,
                    isNote && styles.noteText,
                    isBold && { fontWeight: '800' }
                ]}
            >
                {label}
            </Text>
            <Text
                style={[
                    styles.rowValue,
                    isBold && { color: Colors.AccentOrange, fontSize: 16 },
                    // Visual cue for Unlimited
                    displayValue === "Unlimited" && { color: Colors.PrimaryGreen }
                ]}
            >
                {displayValue === "Unlimited" ? t("subscription.plan_unlimited") : displayValue }
            </Text>
        </View>
    );
};
const PlanCard: FC<PlanCardProps> = ({
                                         plan,
                                         isSelected,
                                         onSubscribe,
                                         isActive,
                                         ctaLabel,
                                         ctaDisabled,
                                         allTierOptions,
                                         selectedPeriod,
                                         onPeriodChange,
                                         isShowDiscount

                                     }) => {
    // 1. Updated Tier Checks (using 'freemium' from API)
    const isFreemium = plan.tier === 'freemium';
    const isExpress = plan.tier === 'express';
    const isStandard = plan.tier === 'standard';
    const isPremium = plan.tier === 'premium';
    const {t} = useTranslation();
    const [subscriptionConsent, setSubscriptionConsent] = useState(isFreemium);


    let planName = plan.name.startsWith("Premium") ? t('subscription.plan_premium') :
        (plan.name.startsWith("Standard") ? t('subscription.plan_standard') : plan.name);

    function formatPrice(amount: number, currencyCode: string) {
        if(currencyCode) {
            return new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: currencyCode,
                minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
                maximumFractionDigits: 2,
            }).format(amount);
        } else {
            return "£" + amount
        }
    }

    const baseDisplayPrice = plan.displayPrice || formatPrice(plan.price_gbp, plan?.currencyCode || "");
    const introDisplayPrice = plan.first_month_display_price ||
        (plan.first_month_price_gbp ? formatPrice(plan.first_month_price_gbp, plan?.currencyCode || "") : null);
    const shouldDisableButton = isActive || ctaDisabled || !subscriptionConsent || (isFreemium && !ctaLabel);


    return (
        <View style={[styles.card, isSelected && styles.selectedShadow]}>
            {/* Header Logic */}
            <View style={styles.header}>
                <Text style={styles.planName}>{planName}</Text>
                <View style={styles.priceRow}>
                    {isShowDiscount && plan.isDiscount ? (
                        <>
                            <Text style={[styles.priceValue, styles.strikethrough]}>
                                {baseDisplayPrice}
                            </Text>

                            {introDisplayPrice && (
                                <Text style={styles.priceValue}>
                                    {introDisplayPrice}{!isFreemium ? "*" : ""}
                                </Text>
                            )}
                        </>
                    ) : (
                        <Text style={styles.priceValue}>
                            {baseDisplayPrice}{!isFreemium ? "*" : ""}
                        </Text>
                    )}

                    <Text style={styles.billingPeriod}>
                        {plan.billing_period ? `/${plan.billing_period}` : " " + t('plan_card.billing.always_free')}
                    </Text>
                </View>
                {(isShowDiscount && plan.isDiscount) && (
                    <Text style={styles.promoBadge}>
                        {t("plan_card.billing.discount_badge", {
                            discount: plan.first_month_discount_percent
                        })}
                    </Text>
                )}

            </View>

            {/* Standard/Premium Toggle Selector */}
            {(isStandard || isPremium) && allTierOptions && (
                <View style={styles.toggleContainer}>
                    {allTierOptions.map((opt) => (
                        <TouchableOpacity
                            key={opt.id}
                            onPress={() => opt.billing_period && onPeriodChange?.(opt.billing_period)}
                            style={[styles.toggleButton, selectedPeriod === opt.billing_period && styles.toggleActive]}
                        >
                            <Text
                                style={[styles.toggleText, selectedPeriod === opt.billing_period && styles.toggleTextActive]}>
                                {opt.billing_period
                                    ? t(`plan_card.toggle.${opt.billing_period}`)
                                    : ""}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <ScrollView contentContainerStyle={styles.content}>
                {/* Basic and Express upload allowances */}
                {(isFreemium || isExpress) && (
                    <>
                        <FeatureRow label={t('freemium.banner.usage_labels.voice_notes')} value={plan.voice_notes_limit}/>
                        <FeatureRow label={t('freemium.banner.usage_labels.uploads')} value={plan.uploads_limit}/>
                        {/*<FeatureRow label={t('freemium.banner.usage_labels.docs')} value={plan.docgen_limit}/>*/}
                    </>
                )}

                {/* Shared Minutes Pool (Standard/Premium) */}
                {(isStandard || isPremium) && (
                    <>
                        <FeatureRow label={t('minutes')} value= {t("plan_card.billing.per_mins", {
                            minutes: plan.minutes_included
                        })} isBold/>
                        <View style={styles.usageBox}>
                            <Text style={styles.usageText}>{t('plan_card.features.shared_pool')}</Text>

                            {plan.free_consultation_minutes && (
                                <Text style={styles.usageText}>{t("plan_card.features.free_consultation", {
                                    minutes: plan.free_consultation_minutes
                                })}</Text>
                            )}

                            {plan.priority_support && (
                                <Text style={styles.usageText}>{t('plan_card.features.priority_support')}</Text>
                            )}
                        </View>
                    </>
                )}

                {/* AI Text Queries */}
                <FeatureRow label={t('subscription.feature_ai_queries')} value={plan.unlimited_ai_queries ? t('plan_card.limits.unlimited') : t('plan_card.limits.limited')}/>
                {isFreemium && (
                    <View style={styles.limitDetailBox}>
                        <Text style={styles.orangeSubText}>{t('plan_card.notes.standard_limits')}</Text>
                    </View>
                )}
                {isExpress && <Text style={styles.orangeSubText}>{t('plan_card.notes.reset_time')}</Text>}

                {/* Roll-over */}
                {plan.rollover_enabled && (
                    <FeatureRow label={t('subscription.feature_rollover')} value={t('plan_card.limits.yes')}/>
                )}

                {/* File Size & Page Caps */}
                <Text style={styles.capTitle}>{t('plan_card.features.file_caps_title')}</Text>
                <FeatureRow label={t('subscription.feature_images_max')} value={`${plan.max_image_size_mb}`+ t('subscription.feature_mb')} isNote/>
                <FeatureRow label={t('subscription.feature_document_max')} value={`${plan.max_doc_pages} ` + t('subscription.feature_pages')} isNote last/>
            </ScrollView>

            <View style={styles.footer}>

                { (isExpress || isStandard || isPremium) && (
                <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setSubscriptionConsent(!subscriptionConsent)}
                    activeOpacity={0.8}
                >
                    <View
                        style={[
                            styles.checkbox,
                            subscriptionConsent && styles.checkboxChecked,
                        ]}
                    >
                        {subscriptionConsent && (
                            <Text style={styles.checkmark}>✓</Text>
                        )}
                    </View>


                    <Text style={styles.policyText}>
                        By clicking <Text style={styles.highlightText}>Pay</Text>, you request
                        that your {isExpress ? 'daily pass' : 'subscription'} starts immediately.
                        You can cancel your {isExpress ? 'daily pass' : 'subscription'} anytime
                        per our{' '}
                        <Text
                            style={styles.policyLink}
                            onPress={() => Linking.openURL(cancellationPolicy)}
                        >
                            Cancellation Policy
                        </Text>
                        . You acknowledge that once your {isExpress ? 'daily pass' : 'subscription'} has
                        started, your 14-day statutory right to cancel will no longer apply.
                    </Text>
                </TouchableOpacity>)}

                <TouchableOpacity
                    onPress={() => onSubscribe(plan)}
                    style={[
                        styles.button,
                        shouldDisableButton && { backgroundColor: '#B5B5B5' },
                    ]}
                    disabled={shouldDisableButton}
                >
                    <Text style={styles.buttonText}>
                        {ctaLabel || (isFreemium
                                ? t('subscription.label_default_plan')
                                : t('plan_card.cta.subscribe')
                        )}
                    </Text>
                </TouchableOpacity>

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    selectedShadow: {borderColor: Colors.PrimaryGreen, borderWidth: 2, elevation: 5},
    planName: {color: Colors.White, fontSize: 18, fontWeight: '900', marginBottom: 4},
    priceRow: {flexDirection: 'row', alignItems: 'baseline'},
    priceValue: {color: Colors.White, fontSize: 26, fontWeight: '900'},
    toggleContainer: {flexDirection: 'row', backgroundColor: '#F0F0F0', margin: 15, borderRadius: 10, padding: 4},
    toggleButton: {flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8},
    toggleActive: {backgroundColor: Colors.White, elevation: 2},
    toggleText: {fontSize: 12, fontWeight: '600', color: '#666'},
    toggleTextActive: {color: Colors.PrimaryGreen},
    content: {paddingHorizontal: 20, paddingBottom: 20},
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.BorderGray
    },
    rowLabel: {fontSize: 14, color: '#333', fontWeight: '600', flex: 1},
    rowValue: {fontSize: 14, color: Colors.TextDark, fontWeight: '800'},
    noteText: {fontSize: 12, color: '#7F8C8D', fontWeight: '500'},
    divider: {height: 1, backgroundColor: Colors.BorderGray, marginVertical: 8},
    sectionTitle: {fontSize: 11, fontWeight: '700', color: '#AAA', marginTop: 10, textTransform: 'uppercase'},
    promoLabel: {fontSize: 12, fontWeight: '700', color: Colors.TextDark, marginTop: 10, textAlign: 'center'},
    subNote: {fontSize: 11, color: Colors.AccentOrange, marginTop: -8, marginBottom: 8, fontWeight: '600'},
    subNoteCenter: {
        fontSize: 12,
        color: Colors.AccentOrange,
        textAlign: 'center',
        marginVertical: 4,
        fontWeight: '700'
    },
    basicLimitBox: {backgroundColor: '#FFF7ED', borderRadius: 8, padding: 4, marginBottom: 8},
    usageBox: {
        backgroundColor: '#FDF2F2',
        padding: 12,
        borderRadius: 8,
        marginVertical: 12,
        borderWidth: 1,
        borderColor: '#FEE2E2'
    },
    footer: {marginTop: 'auto', paddingHorizontal: 16},
    button: {margin: 20, paddingVertical: 14, borderRadius: 30, alignItems: 'center', backgroundColor: Colors.PrimaryGreen},
    buttonText: {color: Colors.White, fontSize: 16, fontWeight: '800'},
    orangeSubText: {
        fontSize: 12,
        color: Colors.AccentOrange,
        textAlign: 'center',
        fontWeight: '700',
        marginVertical: 4
    },
    limitDetailBox: {
        backgroundColor: '#FFF7ED',
        borderRadius: 8,
        padding: 4,
        marginTop: 5
    },
    capTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.TextDark,
        textAlign: 'center',
        marginVertical: 10
    },
    strikethrough: {
        textDecorationLine: 'line-through',
        fontSize: 18,
        color: 'rgba(255,255,255,0.6)',
        marginRight: 8,
    },

    // Added for the "50% OFF" badge
    promoBadge: {
        backgroundColor: Colors.White,
        color: Colors.PrimaryGreen,
        fontSize: 10,
        fontWeight: '900',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 8,
        overflow: 'hidden',
    },

    // Updated Card and Header for a cleaner look
    card: {
        backgroundColor: Colors.White,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.BorderGray,
        flex: 1,
        marginVertical: 10,
        overflow: 'hidden',
        // Support for shadows on iOS/Android
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },

    header: {
        backgroundColor: Colors.PrimaryGreen,
        padding: 20,
        minHeight: 100, // Ensures consistency if badges are missing
        justifyContent: 'center',
    },

    // Updated for the null billing period text
    billingPeriod: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '500',
    },

    // New style for the "Priority Support" and "Consultation" text in UsageBox
    usageText: {
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 18,
        marginBottom: 4,
        fontWeight: '600', // Slightly bolder for readability
    },

    // Style for the "Default Plan" or "Disabled" buttons
    buttonDisabled: {
        backgroundColor: '#B5B5B5',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 1.5,
        borderColor: '#C7C7CC',
        borderRadius: 4,
        marginRight: 10,
        marginTop: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    policyText: {
        fontSize: 11,
        flex:1,
        color: '#666',
        lineHeight: 16,
    },

    policyLink: {
        color: Colors.PrimaryGreen,
        textDecorationLine: 'underline',
        fontWeight: '700',
    },
    highlightText: {
        fontWeight: '700',
        color: Colors.PrimaryGreen, // or Colors.PrimaryGreen
    },
    checkboxChecked: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },

    checkmark: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },

    payButtonDisabled: {
        backgroundColor: '#D1D1D6',
    },

    payButtonTextDisabled: {
        color: '#8E8E93',
    },
});

export default PlanCard;

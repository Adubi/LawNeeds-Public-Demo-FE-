import React, {useEffect, useState} from "react";
import {ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {router, useLocalSearchParams} from "expo-router";
import {useTranslation} from "react-i18next";
import ConsultationService from "@/services/ConsultationService";
import {useApp} from "@/contexts/AppContext";
import {COLORS as c} from "@/constants/colors";
import Slider from "@react-native-community/slider";

export default function PricingScreen() {

    const {session_id} = useLocalSearchParams();
    const {t} = useTranslation();
    const {setReloadRequestDetails} = useApp();
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

    // 🎨 THEME COLORS
    const primary = c.PrimaryColor;
    const secondary = c.SecodaryColor;
    const backgroundColor = c.BackgroundColor;
    const textColor = c.PrimaryColorText;
    const inputBg = c.BackgroundColor;

    const [pricing, setPricing] = useState<any>(null);

   // console.log("pricing", pricing)
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPricing();
    }, []);

    const fetchPricing = async () => {
        try {
            const res = await ConsultationService.GetPricingRules(session_id);
            setPricing(res);

            // ✅ Fixed price auto-fill
            if (res?.pricing_mode === "platform_fixed") {
                setAmount(res.platform_price_gbp || "");
            } else {
                // ✅ Auto-fill min for better UX
                const min = res?.amount_hints_gbp?.amount_min_gbp;

                if (min) {
                    setSelectedAmount(min);
                }
            }

        } catch (e: any) {
            Alert.alert(t("common.error"), t("pricing.load_failed"));
        } finally {
            setLoading(false);
        }
    };

    const isCasework = pricing?.required_pricing_type === "casework";
    const budgetCasework = t("budget_casework_options", { returnObjects: true }) as any[];

    const minAmount = pricing?.amount_hints_gbp?.amount_min_gbp || pricing?.amount_hints_gbp?.amount_minimum_gbp || 0;
    const maxAmount = isCasework ? 10000 : pricing?.amount_hints_gbp?.amount_max_gbp || 0;

    const isFixedFlow =
        pricing?.pricing_mode === "platform_fixed" &&
        !pricing?.lawyer_must_propose_amount;

    const rangeLabel = isCasework
        ? budgetCasework[0].label
        : `£ ${minAmount} — £ ${maxAmount}`;

    const handleSubmit = async () => {

        const value = selectedAmount;

        if (!isFixedFlow) {
            if (!value) {
                Alert.alert(t("common.error"), t("pricing.invalid_amount"));
                return;
            }

            if (value < minAmount || value > maxAmount) {
                Alert.alert(
                    t("common.error"),
                    t("pricing.amount_range", {
                        min: minAmount,
                        max: maxAmount
                    })
                );
                return;
            }
        }

        try {
            setSubmitting(true);

            //if (!isFixedFlow) {
                await ConsultationService.ProposePrice(session_id, {
                    amount_gbp: isFixedFlow
                        ? Number(pricing?.platform_price_gbp)
                        : value,
                    pricing_type: pricing?.required_pricing_type
                });
           // }

            setReloadRequestDetails();

            Alert.alert(
                t("common.success"),
                isFixedFlow
                    ? t("pricing.price_confirmed")
                    : t("pricing.price_proposed")
            );

            router.back();

        } catch (e: any) {
            const errorDetail = e?.response?.data?.detail;

            let message = t("common.something_wrong")
            if (Array.isArray(errorDetail)) {
                message = errorDetail[0]?.msg ?? message;
            } else if (typeof errorDetail === "string") {
                message = errorDetail;
            }

            Alert.alert(t("common.error"), message);
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (minAmount && !selectedAmount) {
            setSelectedAmount(minAmount);
        }
    }, [minAmount]);

    if (loading) {
        return (
            <View style={[styles.loader, {backgroundColor}]}>
                <ActivityIndicator size="large" color={primary}/>
            </View>
        );
    }

    return (
        <View style={[styles.container, {backgroundColor}]}>

            {/* TITLE */}
            <Text style={[styles.title, {color: textColor}]}>
                {!isFixedFlow
                    ? t("pricing.confirm_price")
                    : t("pricing.propose_price")}
            </Text>

            {/* MESSAGE */}
            {isFixedFlow && pricing?.message && (
                <View style={styles.messageBox}>
                    <Text style={styles.messageText}>
                        {pricing.message}
                    </Text>
                </View>
            )}

            {/* CARD */}
            <View style={[styles.card, {backgroundColor: inputBg}]}>

                {isFixedFlow ? (
                    <Text style={[styles.price, {color: primary}]}>
                        £ {pricing?.platform_price_gbp}
                    </Text>
                ) : (
                    <>
                        {/* RANGE LABEL */}
                        <Text style={[styles.rangeText, {color: textColor}]}>
                            {rangeLabel}
                        </Text>

                        {/* SLIDER */}
                        <Slider
                            style={{width: "100%", height: 40}}
                            minimumValue={minAmount}
                            maximumValue={maxAmount}
                            step={50}
                            value={selectedAmount || minAmount}
                            minimumTrackTintColor={primary}
                            maximumTrackTintColor="#ccc"
                            thumbTintColor={secondary}
                            onValueChange={(val) => setSelectedAmount(val)}
                        />

                        {/* SELECTED VALUE */}
                        <Text style={[styles.selectedValue, {color: primary}]}>
                            £ {selectedAmount}
                        </Text>
                    </>
                )}
            </View>

            {/* BUTTON */}
            <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                style={[
                    styles.button,
                    {
                        backgroundColor: isFixedFlow ? primary : secondary,
                        opacity: submitting ? 0.7 : 1
                    }
                ]}
            >
                {submitting ? (
                    <ActivityIndicator color="#fff"/>
                ) : (
                    <Text style={styles.buttonText}>
                        {!isFixedFlow
                            ? t("pricing.confirm_price_btn")
                            : t("pricing.submit_price_btn")}
                    </Text>
                )}
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        padding: 20,
        justifyContent: "center"
    },

    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },

    title: {
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 20,
        textAlign: "center"
    },

    messageBox: {
        backgroundColor: "#FFF3CD",
        padding: 12,
        borderRadius: 10,
        marginBottom: 20
    },

    messageText: {
        color: "#856404",
        fontSize: 14
    },

    card: {
        padding: 20,
        borderRadius: 14,
        marginBottom: 30,
        elevation: 3
    },

    price: {
        fontSize: 36,
        fontWeight: "700",
        textAlign: "center"
    },

    rangeText: {
        marginBottom: 10,
        fontSize: 14
    },

    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        fontSize: 16
    },

    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        elevation: 3
    },

    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600"
    },
    dropdownContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },

    option: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    selectedValue: {
        textAlign: "center",
        fontSize: 18,
        fontWeight: "700",
        marginTop: 10
    },
});

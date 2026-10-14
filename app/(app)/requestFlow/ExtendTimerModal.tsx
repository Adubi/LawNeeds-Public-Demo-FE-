import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {useStripe} from "@stripe/stripe-react-native";
import ConsultationService from "@/services/ConsultationService";
import {COLORS} from "@/constants/colors";
import {BORDER_RADIUS, FONT_SIZES, SPACING} from "@/constants/theme";

type ExtensionOption = {
    minutes: number;
    item_amount_gbp: string;
    vat_amount_gbp: string;
    total_amount_gbp: string;
    vat_rate: number;
};

type ExtensionRequest = {
    id: string;
    session_id: string;
    status: string;
    requested_minutes?: number;
    proposed_minutes?: number;
    agreed_minutes?: number;
    expires_at?: string;
    price?: ExtensionOption;
};

type Props = {
    visible: boolean;
    onCancel: () => void;
    sessionId: string;
    isLawyer: boolean;
    onTimerChanged?: () => void;
};

const ACTIVE_STATUSES = new Set([
    "draft",
    "pending_lawyer",
    "accepted",
    "proposed",
    "payment_pending",
]);

export default function ExtendTimerModal({
    visible,
    onCancel,
    sessionId,
    isLawyer,
    onTimerChanged,
}: Props) {
    const {initPaymentSheet, presentPaymentSheet} = useStripe();
    const [extension, setExtension] = useState<ExtensionRequest | null>(null);
    const [options, setOptions] = useState<ExtensionOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [showProposalOptions, setShowProposalOptions] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
    const timerChangedRef = useRef(onTimerChanged);
    timerChangedRef.current = onTimerChanged;

    const loadState = useCallback(async () => {
        if (!sessionId) return;
        const [activeResponse, optionsResponse] = await Promise.all([
            ConsultationService.GetActiveExtension(sessionId),
            ConsultationService.GetExtensionOptions(sessionId),
        ]);
        if (activeResponse?.extension) {
            setExtension(activeResponse.extension);
        } else {
            setExtension(current => {
                if (current && ACTIVE_STATUSES.has(current.status)) {
                    Alert.alert("Request Timed Out", "The extension request timed out and the original timer has resumed.");
                    timerChangedRef.current?.();
                    return {...current, status: "expired"};
                }
                return current;
            });
        }
        setOptions(optionsResponse?.options || []);
    }, [sessionId]);

    useEffect(() => {
        if (!visible) return;
        loadState().catch(() => undefined);
    }, [visible, loadState]);

    useEffect(() => {
        if (!visible && extension && !ACTIVE_STATUSES.has(extension.status)) {
            setExtension(null);
        }
    }, [visible, extension?.status]);

    useEffect(() => {
        if (!visible || loading || !extension || !ACTIVE_STATUSES.has(extension.status)) return;
        const poll = setInterval(() => loadState().catch(() => undefined), 3000);
        return () => clearInterval(poll);
    }, [visible, loading, extension?.id, extension?.status, loadState]);

    useEffect(() => {
        if (!extension?.expires_at) {
            setSecondsLeft(null);
            return;
        }
        const update = () => setSecondsLeft(
            Math.max(0, Math.ceil((new Date(extension.expires_at!).getTime() - Date.now()) / 1000))
        );
        update();
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, [extension?.expires_at]);

    const countdown = useMemo(() => {
        if (secondsLeft === null) return null;
        return `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;
    }, [secondsLeft]);

    const beginExtension = async () => {
        setLoading(true);
        try {
            const response = await ConsultationService.PauseForExtension(sessionId);
            setExtension(response.extension);
            const optionResponse = await ConsultationService.GetExtensionOptions(sessionId);
            setOptions(optionResponse?.options || []);
            onTimerChanged?.();
        } catch (error: any) {
            Alert.alert("Unable to extend", error?.response?.data?.detail || "The session cannot be extended.");
        } finally {
            setLoading(false);
        }
    };

    const submitDuration = async (minutes: number) => {
        if (!extension) return;
        setLoading(true);
        try {
            const response = await ConsultationService.SubmitExtension(extension.id, minutes);
            setExtension(response.extension);
        } catch (error: any) {
            Alert.alert("Request failed", error?.response?.data?.detail || "Unable to submit the extension request.");
        } finally {
            setLoading(false);
        }
    };

    const decide = async (decision: "accept" | "deny" | "propose", minutes?: number) => {
        if (!extension) return;
        setLoading(true);
        try {
            const response = await ConsultationService.DecideExtension(
                extension.id,
                decision,
                minutes ?? null,
            );
            setExtension(response.extension);
            setShowProposalOptions(false);
            if (decision === "deny") {
                onTimerChanged?.();
                setTimeout(onCancel, 600);
            }
        } catch (error: any) {
            Alert.alert("Decision failed", error?.response?.data?.detail || "Unable to update the extension request.");
        } finally {
            setLoading(false);
        }
    };

    const cancelDraft = async () => {
        if (!extension) return onCancel();
        setLoading(true);
        try {
            await ConsultationService.CancelExtension(extension.id);
            onTimerChanged?.();
            setExtension(null);
            onCancel();
        } catch (error: any) {
            Alert.alert("Unable to cancel", error?.response?.data?.detail || "Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const pay = async () => {
        if (!extension) return;
        setLoading(true);
        try {
            const payment = await ConsultationService.CreateExtensionPayment(extension.id);
            if (!payment?.client_secret) throw new Error("Missing payment client secret");
            const {error: initError} = await initPaymentSheet({
                paymentIntentClientSecret: payment.client_secret,
                merchantDisplayName: "LawNeeds",
            });
            if (initError) throw initError;
            const {error: paymentError} = await presentPaymentSheet();
            if (paymentError) {
                if (paymentError.code !== "Canceled") throw paymentError;
                return;
            }
            await ConsultationService.ConfirmExtensionPayment(extension.id, {
                payment_intent_id: payment.stripe_payment_intent_id,
                payment_method_id: "",
            });
            Alert.alert("Extension confirmed", "Payment succeeded and the consultation timer has resumed.");
            onTimerChanged?.();
            setExtension(null);
            onCancel();
        } catch (error: any) {
            Alert.alert("Payment failed", error?.response?.data?.detail || error?.message || "Unable to complete payment.");
        } finally {
            setLoading(false);
        }
    };

    const renderOptions = (onSelect: (minutes: number) => void) => (
        <View style={styles.optionsList}>
            {options.map(option => (
                <TouchableOpacity
                    key={option.minutes}
                    style={styles.optionCard}
                    onPress={() => onSelect(option.minutes)}
                    disabled={loading}
                >
                    <View>
                        <Text style={styles.optionTitle}>{option.minutes} minutes</Text>
                        <Text style={styles.optionDetail}>
                            £{option.item_amount_gbp} + £{option.vat_amount_gbp} VAT
                        </Text>
                    </View>
                    <Text style={styles.optionTotal}>£{option.total_amount_gbp}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderContent = () => {
        if (!extension) {
            if (isLawyer) {
                return <>
                    <Text style={styles.title}>⏱ 1 Minute Remaining</Text>
                    <Text style={styles.subtitle}>The consultation will end in one minute.</Text>
                    <PrimaryButton label="OK" onPress={onCancel}/>
                </>;
            }
            return <>
                <Text style={styles.title}>⏱ 1 Minute Remaining</Text>
                <Text style={styles.subtitle}>You can request more time before the session ends.</Text>
                <PrimaryButton label="Extend Session" onPress={beginExtension}/>
                <SecondaryButton label="Not now" onPress={onCancel}/>
            </>;
        }

        if (extension.status === "draft") {
            if (isLawyer) return <>
                <Text style={styles.title}>Timer Paused</Text>
                <Text style={styles.subtitle}>Your client is choosing an extension duration.</Text>
                {countdown && <Text style={styles.countdown}>{countdown}</Text>}
                <SecondaryButton label="Close" onPress={onCancel}/>
            </>;
            return <>
                <Text style={styles.title}>Extend Session</Text>
                <Text style={styles.subtitle}>Choose a duration. All prices include a separate 20% VAT charge.</Text>
                {countdown && <Text style={styles.countdown}>Choose within {countdown}</Text>}
                {renderOptions(submitDuration)}
                <SecondaryButton label="Cancel extension" onPress={cancelDraft}/>
            </>;
        }

        if (extension.status === "pending_lawyer") {
            const price = extension.price;
            if (!isLawyer) return <>
                <Text style={styles.title}>Awaiting Lawyer Approval</Text>
                <Text style={styles.subtitle}>
                    Requested {extension.requested_minutes} minutes for £{price?.total_amount_gbp} including VAT.
                </Text>
                {countdown && <Text style={styles.countdown}>{countdown}</Text>}
                <SecondaryButton label="Close" onPress={onCancel}/>
            </>;
            if (showProposalOptions) return <>
                <Text style={styles.title}>Propose New Time</Text>
                <Text style={styles.subtitle}>Choose the duration you can offer.</Text>
                {renderOptions(minutes => decide("propose", minutes))}
                <SecondaryButton label="Back" onPress={() => setShowProposalOptions(false)}/>
            </>;
            return <>
                <Text style={styles.title}>Extension Request</Text>
                <Text style={styles.subtitle}>
                    Client requested {extension.requested_minutes} minutes. Total: £{price?.total_amount_gbp} including VAT.
                </Text>
                {countdown && <Text style={styles.countdown}>Respond within {countdown}</Text>}
                <PrimaryButton label="Accept" onPress={() => decide("accept")}/>
                <PrimaryButton label="Propose New Time" onPress={() => setShowProposalOptions(true)} outline/>
                <DangerButton label="Deny" onPress={() => decide("deny")}/>
            </>;
        }

        if (extension.status === "accepted" || extension.status === "proposed" || extension.status === "payment_pending") {
            const price = extension.price;
            if (isLawyer) return <>
                <Text style={styles.title}>Awaiting Client Payment</Text>
                <Text style={styles.subtitle}>
                    {extension.agreed_minutes} minutes agreed. The timer remains paused until payment succeeds.
                </Text>
                {countdown && <Text style={styles.countdown}>{countdown}</Text>}
                <SecondaryButton label="Close" onPress={onCancel}/>
            </>;
            return <>
                <Text style={styles.title}>{extension.status === "proposed" ? "New Time Proposed" : "Extension Approved"}</Text>
                <Text style={styles.subtitle}>{extension.agreed_minutes} additional minutes</Text>
                <View style={styles.priceBox}>
                    <PriceRow label="Extension" value={`£${price?.item_amount_gbp}`}/>
                    <PriceRow label={`VAT (${price?.vat_rate || 20}%)`} value={`£${price?.vat_amount_gbp}`}/>
                    <View style={styles.divider}/>
                    <PriceRow label="Total" value={`£${price?.total_amount_gbp}`} bold/>
                </View>
                {countdown && <Text style={styles.countdown}>Pay within {countdown}</Text>}
                <PrimaryButton label={`Pay £${price?.total_amount_gbp}`} onPress={pay}/>
                <SecondaryButton label="Close" onPress={onCancel}/>
            </>;
        }

        return <>
            <Text style={styles.title}>Extension {extension.status.replaceAll("_", " ")}</Text>
            <SecondaryButton label="Close" onPress={onCancel}/>
        </>;
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {renderContent()}
                        {loading && <ActivityIndicator color={COLORS.PrimaryColor} style={styles.loader}/>}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const PrimaryButton = ({label, onPress, outline = false}: any) => (
    <TouchableOpacity style={[styles.button, outline && styles.outlineButton]} onPress={onPress}>
        <Text style={[styles.buttonText, outline && styles.outlineButtonText]}>{label}</Text>
    </TouchableOpacity>
);
const SecondaryButton = ({label, onPress}: any) => (
    <TouchableOpacity style={styles.secondaryButton} onPress={onPress}>
        <Text style={styles.secondaryText}>{label}</Text>
    </TouchableOpacity>
);
const DangerButton = ({label, onPress}: any) => (
    <TouchableOpacity style={styles.dangerButton} onPress={onPress}>
        <Text style={styles.dangerText}>{label}</Text>
    </TouchableOpacity>
);
const PriceRow = ({label, value, bold = false}: any) => (
    <View style={styles.priceRow}>
        <Text style={[styles.priceLabel, bold && styles.bold]}>{label}</Text>
        <Text style={[styles.priceValue, bold && styles.bold]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    overlay: {flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", padding: SPACING.lg},
    container: {backgroundColor: COLORS.BackgroundColor, borderRadius: BORDER_RADIUS?.md ?? 12, padding: SPACING.lg, maxHeight: "85%"},
    title: {fontSize: FONT_SIZES.lg, fontFamily: "InstrumentSansSemiBold", color: COLORS.PrimaryColorText, textAlign: "center", marginBottom: SPACING.sm, textTransform: "capitalize"},
    subtitle: {fontSize: FONT_SIZES.sm, color: "#666", textAlign: "center", lineHeight: 20, marginBottom: SPACING.md},
    countdown: {fontSize: FONT_SIZES.md, color: COLORS.PrimaryColor, textAlign: "center", fontFamily: "InstrumentSansSemiBold", marginBottom: SPACING.md},
    optionsList: {gap: SPACING.sm, marginBottom: SPACING.md},
    optionCard: {borderWidth: 1, borderColor: COLORS.PrimaryColor, borderRadius: 10, padding: SPACING.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center"},
    optionTitle: {fontSize: FONT_SIZES.md, color: COLORS.PrimaryColorText, fontFamily: "InstrumentSansSemiBold"},
    optionDetail: {fontSize: FONT_SIZES.sm, color: "#777", marginTop: 3},
    optionTotal: {fontSize: FONT_SIZES.md, color: COLORS.PrimaryColor, fontFamily: "InstrumentSansSemiBold"},
    button: {backgroundColor: COLORS.PrimaryColor, borderRadius: 9, padding: SPACING.md, alignItems: "center", marginTop: SPACING.sm},
    buttonText: {color: "#fff", fontSize: FONT_SIZES.md, fontFamily: "InstrumentSansSemiBold"},
    outlineButton: {backgroundColor: "transparent", borderWidth: 1, borderColor: COLORS.PrimaryColor},
    outlineButtonText: {color: COLORS.PrimaryColor},
    secondaryButton: {padding: SPACING.md, alignItems: "center", marginTop: SPACING.xs},
    secondaryText: {color: "#777", fontSize: FONT_SIZES.md},
    dangerButton: {padding: SPACING.md, alignItems: "center", marginTop: SPACING.xs},
    dangerText: {color: "#d32f2f", fontSize: FONT_SIZES.md, fontFamily: "InstrumentSansSemiBold"},
    priceBox: {borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: SPACING.md, marginBottom: SPACING.sm},
    priceRow: {flexDirection: "row", justifyContent: "space-between", marginVertical: 5},
    priceLabel: {color: "#666"},
    priceValue: {color: COLORS.PrimaryColorText},
    bold: {fontFamily: "InstrumentSansSemiBold", color: COLORS.PrimaryColorText},
    divider: {height: 1, backgroundColor: "#ddd", marginVertical: 5},
    loader: {marginTop: SPACING.md},
});

import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useStripe} from '@stripe/stripe-react-native';
import {useLocalSearchParams, useNavigationContainerRef, useRouter} from 'expo-router';
import ConsultationService from "@/services/ConsultationService";
import {MaterialIcons} from '@expo/vector-icons';
import {COLORS as c} from "@/constants/colors";
import {useApp} from "@/contexts/AppContext";
import {useTranslation} from 'react-i18next';
import {RFValue} from "react-native-responsive-fontsize";
import {SafeAreaView} from "react-native-safe-area-context";

const primary = c.PrimaryColor;
const secondary = c.SecodaryColor;
const backgroundColor = c.BackgroundColor;
const textColor = c.PrimaryColorText;
const inputBg = c.BackgroundColor;

export default function Payment() {

    const {t} = useTranslation();

    const {sessionId, lawyer_profile, referralId} = useLocalSearchParams();
    const router = useRouter();

    const lawyerProfileParam = Array.isArray(lawyer_profile) ? lawyer_profile[0] : lawyer_profile;
    const parsedLawyer = lawyerProfileParam
        ? JSON.parse(lawyerProfileParam)
        : null;
    const existingIdsRef = useRef(new Set());

    const {setReloadRequestDetails} = useApp();
    const navRef = useNavigationContainerRef();

    const {initPaymentSheet, presentPaymentSheet} = useStripe();

    const [paymentData, setPaymentData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const itemAmount = paymentData?.item_amount_gbp ?? paymentData?.net_amount_gbp ?? paymentData?.total_amount_gbp ?? "0.00";
    const vatAmount = paymentData?.vat_amount_gbp ?? "0.00";
    const totalAmount = paymentData?.gross_amount_gbp ?? paymentData?.total_amount_gbp ?? "0.00";
    const vatRate = paymentData?.vat_rate ?? 20;

    const loadPaymentData = async () => {
        try {
            const res = await ConsultationService.GetPayment(sessionId);
            const data = res;

            if (!data?.client_secret) {
                throw new Error("Missing client secret");
            }

            setPaymentData(data);

            const {error} = await initPaymentSheet({
                paymentIntentClientSecret: data.client_secret,
                merchantDisplayName: "LawNeeds",
            });

            if (error) {
                Alert.alert(t('payment.alerts.error_title'), t('payment.alerts.init_failed'));
            }

        } catch (error) {
            Alert.alert(t('payment.alerts.error_title'), t('payment.alerts.unable_to_load'));
        } finally {
            setInitialLoading(false);
        }
    };

    useEffect(() => {
        loadPaymentData();
    }, []);

    const handlePayPress = async () => {
        setLoading(true);
        try {
            const {error} = await presentPaymentSheet();

            if (error) {
                if (error.code !== "Canceled") {
                    Alert.alert(
                        t('payment.alerts.payment_failed_title'),
                        error.message || t('payment.alerts.generic_error')
                    );
                }
                return;
            }

            await ConsultationService.ConfirmPayment(sessionId, {
                payment_intent_id: paymentData?.stripe_payment_intent_id,
                payment_method_id: "",
            });

            Alert.alert(t('payment.alerts.success_title'), t('payment.alerts.success_message'));
            setReloadRequestDetails();
            router.back();

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={primary}/>
                <Text style={styles.loadingText}>{t('payment.preparing_payment')}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView edges={['top', 'bottom']}
                      style={{
                          flex: 1,
                          backgroundColor: c.BackgroundColor,
                      }}
                      >
            <View style={[styles.container]}>


                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            onPress={async () => {
                                if (navRef.canGoBack()) {
                                    router.back();
                                } else {
                                    router.push("/");
                                }
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={t('change_email.go_back')}
                            style={styles.backButton}
                        >
                            <MaterialIcons name="arrow-back-ios" size={24} color="#333"/>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle} allowFontScaling={false}>
                            {t('payment.header_title')}
                        </Text>
                    </View>
                </View>

                <View style={styles.priceBox}>
                    <View style={styles.row}>
                        <Text style={styles.label}>{t('payment.item_amount')}</Text>
                        <Text style={styles.value}>£ {itemAmount}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>{t('payment.vat_amount', {rate: vatRate})}</Text>
                        <Text style={styles.value}>£ {vatAmount}</Text>
                    </View>

                    <View style={styles.divider}/>

                    <View style={styles.row}>
                        <Text style={styles.boldLabel}>{t('payment.total_amount')}</Text>
                        <Text style={styles.boldValue}>
                            £ {totalAmount}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.disabledButton]}
                    onPress={handlePayPress}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff"/>
                    ) : (
                        <Text style={styles.buttonText}>
                            {t('payment.pay_button', {amount: totalAmount})}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: backgroundColor,
        paddingHorizontal: 20,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: backgroundColor,
    },
    loadingText: {
        marginTop: 10,
        color: textColor,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: RFValue(18),
        fontWeight: '600',
        color: primary,
    },
    priceBox: {
        backgroundColor: inputBg,
        padding: 16,
        borderRadius: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: secondary,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    label: {
        fontSize: 14,
        color: textColor,
        opacity: 0.7,
    },
    value: {
        fontSize: 14,
        color: textColor,
    },
    boldLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: textColor,
    },
    boldValue: {
        fontSize: 16,
        fontWeight: '700',
        color: primary,
    },
    divider: {
        height: 1,
        backgroundColor: secondary,
        opacity: 0.3,
        marginVertical: 10,
    },
    button: {
        marginTop: 25,
        backgroundColor: primary,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: primary,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    disabledButton: {
        backgroundColor: secondary,
        opacity: 0.6,
    },
});

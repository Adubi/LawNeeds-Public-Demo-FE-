import {TouchableOpacity, View, StyleSheet, Text} from "react-native";
import {MaterialIcons} from "@expo/vector-icons";
import {COLORS as c} from "@/constants/colors";
import React from "react";
import {useTranslation} from "react-i18next";

type ActionButtonProps = {
    caseDetails: any;
    isUserPro: string;
    paymentData: any;
    onPayNow: () => void;
    sessionStatus: string;
    onStartConsultation: () => void;
};
type ButtonProps = {
    icon: React.ComponentProps<typeof MaterialIcons>["name"];
    label: string;
    onPress: () => void;
    disabled?: boolean;
};

export const ActionButton = ({
                                 caseDetails,
                                 isUserPro,
                                 paymentData,
                                 onPayNow,
                                 sessionStatus,
                                 onStartConsultation,
                             }: ActionButtonProps) => {

    if (!caseDetails) return null;
    const {t} = useTranslation();

    const isPaid = paymentData?.payment_status === "paid";
    const isPending = paymentData?.payment_status === "pending";
    const hasSession = !!(caseDetails?.session_id || paymentData?.session_id);

    const amount = paymentData?.total_amount_gbp || 0;

    const isSessionCompleted = sessionStatus === "completed";

    const Button = ({
                        icon,
                        label,
                        onPress,
                        disabled = false,
                    }: ButtonProps) => (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            style={[
                styles.buttonContainer,
                disabled && {opacity: 0.5}
            ]}
        >
            <MaterialIcons
                name={icon}
                size={18}
                color={disabled ? c.Disabled : c.SecodaryColor}
            />
            <Text style={[
                styles.buttonText,
                {color: disabled ? c.Disabled : c.SecodaryColor}
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    // =======================
    // 👤 USER FLOW
    // =======================
    if(isSessionCompleted) {
        return (
            <View style={styles.wrapper}>
                <Button
                    icon="play-circle-outline"
                    label={t('consultation_history')}
                    onPress={onStartConsultation}
                />
            </View>
        );
    } else {

        if (isUserPro !== 'true') {

            if (isPending) {
                return (
                    <View style={styles.wrapper}>
                        <Button
                            icon="payment"
                            label={`${t('pay')} £${amount}`}
                            onPress={onPayNow}
                        />
                    </View>
                );
            }

            if (isPaid && hasSession) {
                return (
                    <View style={styles.wrapper}>
                        <Button
                            icon="play-circle-outline"
                            label={t('start_consultation')}
                            onPress={onStartConsultation}
                        />
                    </View>
                );
            }

            if (isPaid && !hasSession) {
                return (
                    <View style={styles.wrapper}>
                        <Button
                            icon="schedule"
                            label={t('waiting_for_session')}
                            onPress={()=>{}}
                        />
                    </View>
                );
            }
        }


        // =======================
        // ⚖️ LAWYER FLOW
        // =======================
        if (isUserPro === 'true') {

            if (isPending) {
                return (
                    <View style={styles.wrapper}>
                        <Button
                            icon="hourglass-empty"
                            label={t('waiting_for_payment')}
                            onPress={()=>{}}
                        />
                    </View>
                );
            }

            if (isPaid && hasSession) {
                return (
                    <View style={styles.wrapper}>
                        <Button
                            icon="play-circle-outline"
                            label={t('start_consultation')}
                            onPress={onStartConsultation}
                        />
                    </View>
                );
            }

            if (isPaid && !hasSession) {
                return (
                    <View style={styles.wrapper}>
                        <Button
                            icon="schedule"
                            label={t('waiting_for_session')}
                            onPress={()=>{}}
                        />
                    </View>
                );
            }
        }
    }

    return null;
};

const styles = StyleSheet.create({

    // Wrapper to center + spacing
    wrapper: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 4,
    },

    // 🔘 Button (like your comment UI)
    buttonContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,

        borderRadius: 999,
        borderWidth: 1,
        borderColor: c.SecodaryColor,

        backgroundColor: c.BackgroundColor,
    },

    // 📝 Text
    buttonText: {
        marginHorizontal: 6,
        fontSize: 14,
        fontWeight: "500",
    },
});

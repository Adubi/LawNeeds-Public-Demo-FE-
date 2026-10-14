import React, {useState} from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {MaterialIcons} from "@expo/vector-icons";
import {COLORS as c} from "@/constants/colors";

type Props = {
    visible: boolean;
    onCancel: () => void;
    onProceed: () => void;
};

const disclaimerText =
    "By booking a consultation, you acknowledge that you are purchasing and reserving the selected consultation duration. You are responsible for selecting a duration appropriate to your needs. If you end the consultation before the booked duration has elapsed, the unused time will not be refundable, transferable or credited. This does not apply where the consultation is ended early by LawNeeds or by the Legal Professional. This does not affect any rights you may have under LawNeeds' Cancellation and Refund Policy or applicable law.";

export default function ConsultationPaymentDisclaimerModal({
    visible,
    onCancel,
    onProceed,
}: Props) {
    const [accepted, setAccepted] = useState(false);

    const close = () => {
        setAccepted(false);
        onCancel();
    };

    const proceed = () => {
        if (!accepted) return;
        setAccepted(false);
        onProceed();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Consultation Disclaimer</Text>
                        <Pressable onPress={close} style={styles.closeButton}>
                            <MaterialIcons name="close" size={22} color={c.PrimaryColorText}/>
                        </Pressable>
                    </View>

                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <Text style={styles.body}>{disclaimerText}</Text>

                        <Pressable
                            onPress={() => setAccepted(prev => !prev)}
                            style={styles.checkboxRow}
                            accessibilityRole="checkbox"
                            accessibilityState={{checked: accepted}}
                        >
                            <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
                                {accepted && <MaterialIcons name="check" size={18} color="#FFFFFF"/>}
                            </View>
                            <Text style={styles.checkboxText}>
                                I have read and agree to this consultation disclaimer.
                            </Text>
                        </Pressable>
                    </ScrollView>

                    <View style={styles.actions}>
                        <Pressable onPress={close} style={styles.secondaryButton}>
                            <Text style={styles.secondaryText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            onPress={proceed}
                            disabled={!accepted}
                            style={[styles.primaryButton, !accepted && styles.disabledButton]}
                        >
                            <Text style={styles.primaryText}>Proceed to pay</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
    },
    sheet: {
        width: "100%",
        maxHeight: "86%",
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 10,
    },
    title: {
        flex: 1,
        color: c.PrimaryColorText,
        fontSize: 20,
        fontFamily: "InstrumentSansSemiBold",
    },
    closeButton: {
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
    },
    scroll: {
        maxHeight: 360,
    },
    scrollContent: {
        paddingHorizontal: 18,
        paddingBottom: 12,
    },
    body: {
        color: c.PrimaryColorText,
        fontSize: 15,
        lineHeight: 22,
        fontFamily: "InstrumentSansRegular",
    },
    checkboxRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        marginTop: 18,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "#8A8A8A",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 1,
    },
    checkboxChecked: {
        backgroundColor: c.SecodaryColor,
        borderColor: c.SecodaryColor,
    },
    checkboxText: {
        flex: 1,
        color: c.PrimaryColorText,
        fontSize: 14,
        lineHeight: 20,
        fontFamily: "InstrumentSansMedium",
    },
    actions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
        padding: 18,
        borderTopWidth: 1,
        borderTopColor: "#EEEEEE",
    },
    secondaryButton: {
        minWidth: 88,
        height: 44,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#D0D0D0",
        paddingHorizontal: 14,
    },
    secondaryText: {
        color: c.PrimaryColorText,
        fontFamily: "InstrumentSansSemiBold",
    },
    primaryButton: {
        minWidth: 130,
        height: 44,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.SecodaryColor,
        paddingHorizontal: 14,
    },
    disabledButton: {
        backgroundColor: "#BDBDBD",
    },
    primaryText: {
        color: "#FFFFFF",
        fontFamily: "InstrumentSansSemiBold",
    },
});

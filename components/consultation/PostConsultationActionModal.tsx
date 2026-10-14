import React from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {MaterialIcons} from "@expo/vector-icons";
import {COLORS as c} from "@/constants/colors";

type Props = {
    visible: boolean;
    submitting?: boolean;
    onBookFollowUp: () => void;
    onChatWithAI: () => void;
    onSkip: () => void;
};

export default function PostConsultationActionModal({
    visible,
    submitting = false,
    onBookFollowUp,
    onChatWithAI,
    onSkip,
}: Props) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <Text style={styles.eyebrow}>Consultation ended</Text>
                    <Text style={styles.title}>What would you like to do next?</Text>

                    <Pressable style={styles.actionButton} onPress={onBookFollowUp} disabled={submitting}>
                        <MaterialIcons name="event-available" size={22} color={c.SecodaryColor}/>
                        <Text style={styles.actionText}>Book a follow up</Text>
                    </Pressable>

                    <Pressable style={styles.actionButton} onPress={onChatWithAI} disabled={submitting}>
                        <MaterialIcons name="chat-bubble-outline" size={22} color={c.SecodaryColor}/>
                        <Text style={styles.actionText}>Chat with AI</Text>
                    </Pressable>

                    <Pressable style={styles.skipButton} onPress={onSkip} disabled={submitting}>
                        {submitting ? (
                            <ActivityIndicator color={c.PrimaryColorText}/>
                        ) : (
                            <Text style={styles.skipText}>Skip</Text>
                        )}
                    </Pressable>
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
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        padding: 18,
    },
    title: {
        color: c.PrimaryColorText,
        fontSize: 20,
        fontFamily: "InstrumentSansSemiBold",
        marginBottom: 14,
    },
    eyebrow: {
        color: c.SecodaryColor,
        fontSize: 13,
        fontFamily: "InstrumentSansSemiBold",
        marginBottom: 4,
        textTransform: "uppercase",
    },
    actionButton: {
        minHeight: 52,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#D9D9D9",
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 14,
        marginBottom: 10,
    },
    actionText: {
        color: c.PrimaryColorText,
        fontSize: 16,
        fontFamily: "InstrumentSansSemiBold",
    },
    skipButton: {
        height: 44,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 4,
    },
    skipText: {
        color: c.PrimaryColorText,
        fontFamily: "InstrumentSansSemiBold",
    },
});

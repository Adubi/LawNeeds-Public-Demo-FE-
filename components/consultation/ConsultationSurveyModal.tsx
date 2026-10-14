import React, {useMemo, useState} from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import {MaterialIcons} from "@expo/vector-icons";
import {COLORS as c} from "@/constants/colors";

export type SurveyPayload = {
    overall_rating?: number;
    lawyer_rating?: number | null;
    platform_rating?: number | null;
    comment?: string;
    lawyer_comment?: string;
    issue_tags: string[];
    skipped?: boolean;
};

type Props = {
    visible: boolean;
    isLawyer: boolean;
    lawyerName?: string;
    submitting?: boolean;
    onSkip: () => void;
    onSubmit: (payload: SurveyPayload) => void;
};

const ratingHelp = "1 = Very poor · 5 = Excellent";

const StarRating = ({
    value,
    onChange,
}: {
    value: number;
    onChange: (value: number) => void;
}) => (
    <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((rating) => (
            <Pressable
                key={rating}
                onPress={() => onChange(rating)}
                style={styles.starButton}
                accessibilityRole="button"
                accessibilityLabel={`${rating} stars`}
            >
                <MaterialIcons
                    name={rating <= value ? "star" : "star-border"}
                    size={34}
                    color={rating <= value ? c.SecodaryColor : "#A6A6A6"}
                />
            </Pressable>
        ))}
    </View>
);

export default function ConsultationSurveyModal({
    visible,
    isLawyer,
    lawyerName,
    submitting = false,
    onSkip,
    onSubmit,
}: Props) {
    const [consultationRating, setConsultationRating] = useState(0);
    const [consultationComment, setConsultationComment] = useState("");
    const [lawyerRating, setLawyerRating] = useState(0);
    const [lawyerComment, setLawyerComment] = useState("");

    const canSubmit = useMemo(
        () => consultationRating > 0 && (isLawyer || lawyerRating > 0) && !submitting,
        [consultationRating, isLawyer, lawyerRating, submitting]
    );
    const serviceName = lawyerName?.trim() || "your lawyer";

    const submit = () => {
        if (!canSubmit) return;
        onSubmit({
            overall_rating: consultationRating,
            lawyer_rating: !isLawyer && lawyerRating > 0 ? lawyerRating : null,
            platform_rating: null,
            comment: consultationComment.trim(),
            lawyer_comment: lawyerComment.trim(),
            issue_tags: [],
        });
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.content}
                    >
                        <View style={styles.header}>
                            <Text style={styles.title}>Feedback</Text>
                            <Pressable onPress={onSkip} style={styles.closeButton}>
                                <MaterialIcons name="close" size={22} color="#202020"/>
                            </Pressable>
                        </View>

                        <Text style={styles.question}>How satisfied were you with the consultation?</Text>
                        <StarRating value={consultationRating} onChange={setConsultationRating}/>
                        <Text style={styles.helpText}>{ratingHelp}</Text>
                        <Text style={styles.label}>Tell us more about your experience (optional)</Text>
                        <TextInput
                            value={consultationComment}
                            onChangeText={setConsultationComment}
                            placeholder="Feedback text box"
                            placeholderTextColor="#8B8B8B"
                            multiline
                            maxLength={2000}
                            style={styles.comment}
                        />

                        {!isLawyer && (
                            <>
                                <Text style={styles.question}>
                                    How satisfied were you with the service provided by {serviceName}?
                                </Text>
                                <StarRating value={lawyerRating} onChange={setLawyerRating}/>
                                <Text style={styles.helpText}>{ratingHelp}</Text>
                                <Text style={styles.label}>Tell us more about your experience (optional)</Text>
                                <TextInput
                                    value={lawyerComment}
                                    onChangeText={setLawyerComment}
                                    placeholder="Feedback text box"
                                    placeholderTextColor="#8B8B8B"
                                    multiline
                                    maxLength={2000}
                                    style={styles.comment}
                                />
                            </>
                        )}

                        <View style={styles.actions}>
                            <Pressable onPress={onSkip} style={styles.secondaryButton} disabled={submitting}>
                                <Text style={styles.secondaryText}>Skip</Text>
                            </Pressable>
                            <Pressable
                                onPress={submit}
                                disabled={!canSubmit}
                                style={[styles.primaryButton, !canSubmit && styles.disabledButton]}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#FFFFFF"/>
                                ) : (
                                    <Text style={styles.primaryText}>Submit</Text>
                                )}
                            </Pressable>
                        </View>
                    </ScrollView>
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
        maxHeight: "88%",
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
    },
    content: {
        padding: 18,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
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
    question: {
        color: c.PrimaryColorText,
        fontSize: 16,
        fontFamily: "InstrumentSansSemiBold",
        marginTop: 18,
        marginBottom: 8,
    },
    stars: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    starButton: {
        paddingRight: 4,
        paddingVertical: 4,
    },
    helpText: {
        color: "#5F5F5F",
        fontSize: 13,
        marginBottom: 10,
    },
    label: {
        color: c.PrimaryColorText,
        fontSize: 14,
        fontFamily: "InstrumentSansMedium",
        marginBottom: 8,
    },
    comment: {
        minHeight: 92,
        borderWidth: 1,
        borderColor: "#D9D9D9",
        borderRadius: 8,
        padding: 12,
        color: c.PrimaryColorText,
        textAlignVertical: "top",
        fontFamily: "InstrumentSansRegular",
        fontSize: 14,
    },
    actions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 20,
    },
    secondaryButton: {
        minWidth: 92,
        height: 44,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#D0D0D0",
    },
    secondaryText: {
        color: c.PrimaryColorText,
        fontFamily: "InstrumentSansSemiBold",
    },
    primaryButton: {
        minWidth: 112,
        height: 44,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.SecodaryColor,
    },
    disabledButton: {
        opacity: 0.5,
    },
    primaryText: {
        color: "#FFFFFF",
        fontFamily: "InstrumentSansSemiBold",
    },
});

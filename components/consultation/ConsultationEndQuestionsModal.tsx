import React, {useMemo, useState} from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {MaterialIcons} from "@expo/vector-icons";
import {COLORS as c} from "@/constants/colors";

export type ConsultationEndAnswers = {
    questions_addressed: "yes_fully" | "partially" | "no";
    next_steps_understood?: "yes" | "not_sure" | "no_next_steps_required";
    final_clarification?: "happy_to_end" | "another_question";
};

type QuestionsProps = {
    visible: boolean;
    submitting?: boolean;
    onSubmit: (answers: ConsultationEndAnswers) => void;
};

type ConfirmationProps = {
    visible: boolean;
    submitting?: boolean;
    onBack: () => void;
    onConfirm: () => void;
};

const questionOne = [
    {label: "Yes, fully", value: "yes_fully"},
    {label: "Partially", value: "partially"},
    {label: "No", value: "no"},
] as const;

const questionTwo = [
    {label: "Yes", value: "yes"},
    {label: "I'm not sure", value: "not_sure"},
    {label: "No next steps were required", value: "no_next_steps_required"},
] as const;

const questionThree = [
    {label: "No, I'm happy to end the consultation", value: "happy_to_end"},
    {label: "Yes, I have another question", value: "another_question"},
] as const;

function OptionRow({
    label,
    selected,
    onPress,
}: {
    label: string;
    selected: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            accessibilityRole="radio"
            accessibilityState={{selected}}
            onPress={onPress}
            style={[styles.option, selected && styles.optionSelected]}
        >
            <MaterialIcons
                name={selected ? "radio-button-checked" : "radio-button-unchecked"}
                size={22}
                color={selected ? c.PrimaryColor : "#777777"}
            />
            <Text style={styles.optionText}>{label}</Text>
        </Pressable>
    );
}

export function ConsultationEndQuestionsModal({
    visible,
    submitting = false,
    onSubmit,
}: QuestionsProps) {
    const [questionsAddressed, setQuestionsAddressed] =
        useState<ConsultationEndAnswers["questions_addressed"] | null>(null);
    const [nextStepsUnderstood, setNextStepsUnderstood] =
        useState<ConsultationEndAnswers["next_steps_understood"] | null>(null);
    const [finalClarification, setFinalClarification] =
        useState<ConsultationEndAnswers["final_clarification"] | null>(null);

    const shouldAskFollowUps = questionsAddressed !== null && questionsAddressed !== "no";
    const canContinue = useMemo(() => {
        if (!questionsAddressed || submitting) return false;
        if (questionsAddressed === "no") return true;
        return Boolean(nextStepsUnderstood && finalClarification);
    }, [finalClarification, nextStepsUnderstood, questionsAddressed, submitting]);

    const submit = () => {
        if (!canContinue || !questionsAddressed) return;
        onSubmit({
            questions_addressed: questionsAddressed,
            next_steps_understood: questionsAddressed === "no" ? undefined : nextStepsUnderstood || undefined,
            final_clarification: questionsAddressed === "no" ? undefined : finalClarification || undefined,
        });
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.content}
                    >
                        <Text style={styles.eyebrow}>End consultation</Text>
                        <Text style={styles.title}>Before the consultation ends</Text>

                        <Text style={styles.question}>
                            Have your questions been addressed during this consultation?
                        </Text>
                        {questionOne.map((option) => (
                            <OptionRow
                                key={option.value}
                                label={option.label}
                                selected={questionsAddressed === option.value}
                                onPress={() => setQuestionsAddressed(option.value)}
                            />
                        ))}

                        {shouldAskFollowUps && (
                            <>
                                <Text style={styles.question}>
                                    Do you understand the next steps, if any, following your consultation?
                                </Text>
                                {questionTwo.map((option) => (
                                    <OptionRow
                                        key={option.value}
                                        label={option.label}
                                        selected={nextStepsUnderstood === option.value}
                                        onPress={() => setNextStepsUnderstood(option.value)}
                                    />
                                ))}

                                <Text style={styles.question}>
                                    Is there anything you would like to clarify with the professional before the consultation ends?
                                </Text>
                                {questionThree.map((option) => (
                                    <OptionRow
                                        key={option.value}
                                        label={option.label}
                                        selected={finalClarification === option.value}
                                        onPress={() => setFinalClarification(option.value)}
                                    />
                                ))}
                            </>
                        )}

                        <Pressable
                            onPress={submit}
                            disabled={!canContinue}
                            style={[styles.primaryButton, !canContinue && styles.disabledButton]}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FFFFFF"/>
                            ) : (
                                <Text style={styles.primaryText}>Continue</Text>
                            )}
                        </Pressable>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

export function ConsultationEndConfirmationModal({
    visible,
    submitting = false,
    onBack,
    onConfirm,
}: ConfirmationProps) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.content}>
                        <Text style={styles.eyebrow}>End consultation</Text>
                        <Text style={styles.title}>End consultation</Text>
                        <Text style={styles.bodyText}>
                            By continuing, you confirm that you are ready to end this consultation. Any unused consultation time will not be carried over or refunded in accordance with LawNeeds' applicable terms.
                        </Text>

                        <View style={styles.actions}>
                            <Pressable onPress={onBack} style={styles.secondaryButton} disabled={submitting}>
                                <Text style={styles.secondaryText}>Back</Text>
                            </Pressable>
                            <Pressable onPress={onConfirm} style={styles.confirmButton} disabled={submitting}>
                                {submitting ? (
                                    <ActivityIndicator color="#FFFFFF"/>
                                ) : (
                                    <Text style={styles.confirmText}>End consultation</Text>
                                )}
                            </Pressable>
                        </View>
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
        maxHeight: "90%",
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
    },
    content: {
        padding: 18,
    },
    eyebrow: {
        color: c.SecodaryColor,
        fontSize: 13,
        fontFamily: "InstrumentSansSemiBold",
        marginBottom: 4,
        textTransform: "uppercase",
    },
    title: {
        color: c.PrimaryColorText,
        fontSize: 20,
        fontFamily: "InstrumentSansSemiBold",
        marginBottom: 10,
    },
    question: {
        color: c.PrimaryColorText,
        fontSize: 16,
        fontFamily: "InstrumentSansSemiBold",
        marginTop: 18,
        marginBottom: 8,
    },
    option: {
        minHeight: 48,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#D9D9D9",
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 8,
    },
    optionSelected: {
        borderColor: c.PrimaryColor,
        backgroundColor: "#F2FAF4",
    },
    optionText: {
        flex: 1,
        color: c.PrimaryColorText,
        fontSize: 15,
        fontFamily: "InstrumentSansMedium",
        lineHeight: 20,
    },
    bodyText: {
        color: "#4B5563",
        fontSize: 15,
        lineHeight: 22,
        marginTop: 4,
    },
    primaryButton: {
        height: 46,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.SecodaryColor,
        marginTop: 18,
    },
    disabledButton: {
        opacity: 0.5,
    },
    primaryText: {
        color: "#FFFFFF",
        fontFamily: "InstrumentSansSemiBold",
        fontSize: 15,
    },
    actions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 20,
    },
    secondaryButton: {
        minWidth: 88,
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
    confirmButton: {
        minWidth: 150,
        height: 44,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#C62828",
    },
    confirmText: {
        color: "#FFFFFF",
        fontFamily: "InstrumentSansSemiBold",
    },
});

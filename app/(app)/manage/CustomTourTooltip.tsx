import React from "react";
import {StyleSheet, Text, TouchableOpacity, View} from "react-native";

type TooltipProps = {
    isFirstStep?: boolean;
    isLastStep?: boolean;
    handleNext?: () => void;
    handlePrev?: () => void;
    handleStop?: () => void;
    currentStep?: {
        text?: string;
        order?: number;
        position?: { x?: number; y?: number; width?: number; height?: number };
    };
    totalSteps?: number;
};

const COLORS = {
    primary: "#0A84FF",
    textPrimary: "#1A1A1A",
    textSecondary: "#7B7B7B",
    border: "#E4E6EB",
    background: "#FFFFFF",
};

function parseStepText(raw?: string): { title: string; description: string } {
    if (!raw) return {title: "", description: ""};
    try {
        const p = JSON.parse(raw);
        return {title: p.title ?? "", description: p.description ?? raw};
    } catch {
        return {title: "", description: raw};
    }
}

const CustomTourTooltip: React.FC<TooltipProps> = ({
                                                       isFirstStep = false,
                                                       isLastStep = false,
                                                       handleNext,
                                                       handlePrev,
                                                       handleStop,
                                                       currentStep,
                                                       totalSteps = 3,
                                                   }) => {
    const {title, description} = parseStepText(currentStep?.text);

    return (
        <TouchableOpacity style={styles.container} onPress={isLastStep ? handleStop : handleNext}>
            <View>


                {title ? <Text style={styles.title}>{title}</Text> : null}

                {description ? (
                    <Text style={[styles.description, !title && styles.descriptionOnly]}>
                        {description}
                    </Text>
                ) : null}

                <View style={styles.footer}>
                    <View style={styles.leftButtons}>
                        {(!isFirstStep && !isLastStep) && (
                            <TouchableOpacity onPress={handlePrev} style={styles.backButton}>
                                <Text style={styles.backText}>Back</Text>
                            </TouchableOpacity>
                        )}
                        {!isLastStep &&
                            <TouchableOpacity onPress={handleStop}>
                                <Text style={styles.skipText}>Skip</Text>
                            </TouchableOpacity>
                        }
                    </View>
                    <TouchableOpacity
                        onPress={isLastStep ? handleStop : handleNext}
                        style={styles.nextButton}
                    >
                        <Text style={styles.nextText}>
                            {isLastStep ? "Finish" : "Next"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default CustomTourTooltip;

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.background,
        borderRadius: 24,
        paddingHorizontal: 22,
        paddingVertical: 22,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: {width: 0, height: 6},
        elevation: 8,
    },
    stepWrapper: {
        alignSelf: "flex-start",
        backgroundColor: "#EEF6FF",
        borderRadius: 100,
        paddingHorizontal: 12,
        paddingVertical: 5,
        marginBottom: 16,
    },
    stepText: {color: COLORS.primary, fontSize: 12, fontWeight: "700"},
    title: {fontSize: 22, fontWeight: "700", color: COLORS.textPrimary, lineHeight: 30},
    description: {marginTop: 10, fontSize: 14, color: COLORS.textSecondary, lineHeight: 22},
    descriptionOnly: {fontSize: 22, fontWeight: "700", color: COLORS.textPrimary, lineHeight: 30, marginTop: 0},
    footer: {marginTop: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between"},
    leftButtons: {flexDirection: "row", alignItems: "center", gap: 16},
    backButton: {
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14
    },
    backText: {color: COLORS.textPrimary, fontWeight: "600"},
    skipText: {color: COLORS.textSecondary, fontSize: 14, fontWeight: "600"},
    nextButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 14,
        minWidth: 100,
        alignItems: "center"
    },
    nextText: {color: "#FFF", fontWeight: "700", fontSize: 15},
});
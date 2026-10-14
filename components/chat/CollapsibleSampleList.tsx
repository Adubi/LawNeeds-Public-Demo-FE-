import React, {useState} from "react";
import {LayoutAnimation, Text, TouchableOpacity, View,} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {COLORS as c} from "@/constants/colors";
import {useTranslation} from "react-i18next";


type CollapsibleSampleListProps = {
    sampleQuestions: string[];
    handleSend: (question: string, index: number) => void;
    setShowSamples: (visible: boolean) => void;
    SPACING: {
        xs: number;
        sm: number;
    };
};

const CollapsibleSampleList = ({ sampleQuestions, handleSend, setShowSamples, SPACING }: CollapsibleSampleListProps) => {
    const [showAll, setShowAll] = useState(false);

    const visibleQuestions = showAll ? sampleQuestions : sampleQuestions.slice(0, 3);
    const {t} = useTranslation();

    const toggleShow = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowAll(!showAll);
    };


    const secondary = c.SecodaryColor;
    const white = c.White;
    const textColor = c.PrimaryColorText;

    return (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs }}>
            {visibleQuestions.map((q: string, index: number) => (
                <TouchableOpacity
                    key={index}
                    onPress={() => {
                        setShowSamples(false);
                        handleSend(q, index);
                    }}
                    style={{
                        paddingVertical: 4,
                        paddingHorizontal: SPACING.xs,
                        borderRadius: 20,
                        marginBottom: 4,
                    }}
                >
                    <View style={{ flex: 1, alignItems: "center", flexDirection: "row" }}>
                        <Text style={{ fontSize: 16, width: "95%", color: textColor }}>
                            {"\u2022"} {q}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color={textColor} />
                    </View>
                </TouchableOpacity>
            ))}

            {sampleQuestions.length > 3 && (
                <TouchableOpacity
                    onPress={toggleShow}
                    style={{
                        flexDirection: "row", // for icon + text in a row
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 6,
                        paddingHorizontal: SPACING.sm,
                        backgroundColor: secondary,
                        borderRadius: 20,
                        marginTop: 4,
                    }}
                >
                    <Ionicons
                        name={showAll ? "chevron-up" : "chevron-down"} // icon changes based on state
                        size={16}
                        color={white}
                        style={{ marginRight: 6 }}
                    />
                    <Text style={{ color: white, fontWeight: "600" }}>
                        {showAll ? t('show_less') : t('show_more')}
                    </Text>
                </TouchableOpacity>

            )}
        </View>
    );
};

export default CollapsibleSampleList;

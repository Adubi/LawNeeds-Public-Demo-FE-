import React, {useState} from "react";
import {COLORS as c, COLORS} from "@/constants/colors";
import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {Button} from "@/components/Button";
import {useTranslation} from "react-i18next";

const sortByList = ["random", "alphabetical", "relevance", "experience"];

type AvailableFilters = {
    common_services?: string[];
    practice_areas?: string[];
    professional_types?: string[];
};

type FilterModalProps = {
    modalVisible?: boolean;
    applyFilter?: (sort: string, services: string, practiceArea: string, professionalType: string) => void;
    cancelFilter?: () => void;
    availableFilters?: AvailableFilters;
};

const FilterModal = ({ modalVisible = false, applyFilter, cancelFilter, availableFilters }: FilterModalProps) => {

    const { t } = useTranslation();

    const [selectedSort, setSelectedSort] = useState("random");
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [selectedPracticeArea, setSelectedPracticeArea] = useState("");
    const [selectedProfessionalType, setSelectedProfessionalType] = useState("");

    const toggleSelection = (value: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
        if (list.includes(value)) {
            setList(list.filter((item) => item !== value));
        } else {
            setList([...list, value]);
        }
    };

    const toggleSelectionValue = (value: string, list: string, setList: React.Dispatch<React.SetStateAction<string>>) => {
        if (list === value) {
            setList("");
        } else {
            setList(value);
        }
    };

    return (
        <View style={styles.container}>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t("filter.title")}</Text>
                <TouchableOpacity onPress={cancelFilter}>
                    <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
            </View>

            {/* Sort By */}
            <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                    {t("filter.sortBy")}
                </Text>

                {sortByList.map((option, idx) => (
                    <TouchableOpacity
                        key={idx}
                        style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}
                        onPress={() => setSelectedSort(option)}
                    >
                        <View style={{
                            height: 20,
                            width: 20,
                            borderRadius: 10,
                            borderWidth: 2,
                            borderColor: COLORS.SecodaryColor,
                            justifyContent: "center",
                            alignItems: "center",
                            marginRight: 10,
                        }}>
                            {selectedSort === option && (
                                <View style={{
                                    height: 10,
                                    width: 10,
                                    borderRadius: 5,
                                    backgroundColor: COLORS.SecodaryColor,
                                }}/>
                            )}
                        </View>

                        <Text style={[styles.textTitle, {
                            color: option === selectedSort
                                ? COLORS.PrimaryColorText
                                : "#000",
                        }]}>
                            {t(`filter.sortOptions.${option}`, {defaultValue: option === "random" ? "Random" : option})}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Common Services */}
            <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                    {t("filter.commonServices")}
                </Text>

                <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
                    {(availableFilters?.common_services || []).map((service, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 20,
                                borderWidth: 1,
                                borderColor: selectedServices.includes(service)
                                    ? COLORS.SecodaryColor
                                    : "#ccc",
                                margin: 4,
                            }}
                            onPress={() => toggleSelection(service, selectedServices, setSelectedServices)}
                        >
                            <Text style={{
                                color: selectedServices.includes(service)
                                    ? COLORS.PrimaryColorText
                                    : "#000",
                            }}>
                                {service} {/* dynamic, keep as is */}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Practice Areas */}
            <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                    {t("filter.practiceAreas")}
                </Text>

                <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
                    {(availableFilters?.practice_areas || []).map((area, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 20,
                                borderWidth: 1,
                                borderColor: selectedPracticeArea === area
                                    ? COLORS.SecodaryColor
                                    : "#ccc",
                                margin: 4,
                            }}
                            onPress={() => toggleSelectionValue(area, selectedPracticeArea, setSelectedPracticeArea)}
                        >
                            <Text style={{
                                color: selectedPracticeArea === area
                                    ? COLORS.PrimaryColorText
                                    : "#000",
                            }}>
                                {area}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Professional Types */}
            <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                    {t("filter.professionalTypes")}
                </Text>

                <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
                    {(availableFilters?.professional_types || []).map((type, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 20,
                                borderWidth: 1,
                                borderColor: selectedProfessionalType === type
                                    ? COLORS.SecodaryColor
                                    : "#ccc",
                                margin: 4,
                            }}
                            onPress={() =>
                                toggleSelectionValue(type, selectedProfessionalType, setSelectedProfessionalType)
                            }
                        >
                            <Text style={{
                                color: selectedProfessionalType === type
                                    ? COLORS.PrimaryColorText
                                    : "#000",
                            }}>
                                {type}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Buttons */}
            <Button
                title={t("common.apply")}
                onPress={() => {
                    applyFilter?.(
                        selectedSort,
                        selectedServices.toString(),
                        selectedPracticeArea,
                        selectedProfessionalType
                    );
                }}
                style={{ marginTop: 5, backgroundColor: COLORS.PrimaryColor }}
            />

            <Button
                title={t("common.cancel")}
                onPress={cancelFilter || (() => {})}
                variant="secondary"
                style={{ marginTop: 10, marginBottom: 20 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    textTitle: {fontSize: 14, textTransform: "capitalize"},
    container: {
        width: "100%",
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 16,
        backgroundColor: c.BackgroundColor,
    },
    closeBtn: {
        fontSize: 20,
        paddingLeft: 10,
        paddingRight: 10,
        color: c.SecodaryColor,
        fontWeight: "600",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 12,
        marginBottom: 12,
        backgroundColor: c.BackgroundColor,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: c.PrimaryColorText,
    },
})

export default FilterModal;

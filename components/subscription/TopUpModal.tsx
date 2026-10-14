import React, {FC, useEffect, useState} from "react";
import {Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View,} from "react-native";
import Slider from "@react-native-community/slider";
import {AntDesign, Feather} from "@expo/vector-icons";
import {useApp} from "@/contexts/AppContext";
import {useTranslation} from "react-i18next";

// --- Color Palette ---
const Colors = {
    Background: "#FFF7ED",
    PrimaryColor: "#176535",
    PrimaryColorText: "#033126",
    SecondaryColor: "#DD8550",
    White: "#FFFFFF",
    LightGray: "#EFEFEF",
    Warning: "#F39C12",
};

// --- Rules ---
const TOP_UP_MIN_AMOUNT = 5;
const TOP_UP_MAX_AMOUNT = 30;
const COST_PER_MINUTE = 1.0;
const TOP_UP_RECOMMENDATION_THRESHOLD = 2;

export interface TopUpModalProps {
    isVisible: boolean;
    onClose: () => void;
    monthlyTopUpCount: number;
    isPurchasing: boolean;
}

const topUpPassDataArray = [
    {minutes: 5, price: Platform.OS === "ios" ? 4.99 : 5, id: "topup_5_minutes"},
    {minutes: 10, price: Platform.OS === "ios" ? 9.99 : 10, id: "topup_10_minutes"},
    {minutes: 15, price: Platform.OS === "ios" ? 14.99 : 15, id: "topup_15_minutes"},
    {minutes: 20, price: Platform.OS === "ios" ? 19.99 : 20, id: "topup_20_minutes"},
    {minutes: 25, price: Platform.OS === "ios" ? 24.99 : 25, id: "topup_25_minutes"},
    {minutes: 30, price: Platform.OS === "ios" ? 29.99 : 30, id: "topup_30_minutes"},
];

const SLIDER_STEP = 5;
const TopUpModal: FC<TopUpModalProps> = ({
                                             isVisible,
                                             onClose,
                                             monthlyTopUpCount,
                                             isPurchasing,
                                         }) => {

    const {t} = useTranslation();

    const {purchaseTopUp} = useApp();

    const [minutesToBuy, setMinutesToBuy] = useState(TOP_UP_MIN_AMOUNT);
    const [sliderPosition, setSliderPosition] = useState(0);

    const [cost, setCost] = useState(TOP_UP_MIN_AMOUNT * COST_PER_MINUTE);

    const shouldRecommendUpgrade =
        monthlyTopUpCount >= TOP_UP_RECOMMENDATION_THRESHOLD;

    useEffect(() => {
        if(Platform.OS === "ios") {
            setCost(parseFloat((minutesToBuy * COST_PER_MINUTE).toFixed(2)) - 0.01);
        } else {
            setCost(parseFloat((minutesToBuy * COST_PER_MINUTE).toFixed(2)));
        }

    }, [minutesToBuy]);

    // ✅ PAY HANDLER
    const handleConfirm = () => {
        const productId = topUpPassDataArray[sliderPosition].id;
        purchaseTopUp(productId); // 🔥 RevenueCat call
        onClose();
    };

    // Slider logic
    const sliderStep = 5;
    const sliderValue = (minutesToBuy - TOP_UP_MIN_AMOUNT) / sliderStep;
    const sliderMax = (TOP_UP_MAX_AMOUNT - TOP_UP_MIN_AMOUNT) / sliderStep;

    return (
        <Modal visible={isVisible} animationType="slide" transparent>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <AntDesign
                            name="close"
                            size={24}
                            color={Colors.PrimaryColorText}
                        />
                    </TouchableOpacity>

                    <Text style={styles.header}>{t('topup.modal.title')}</Text>
                    <Text style={styles.subHeader}>
                        {t('topup.modal.subtitle')}
                    </Text>

                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        {shouldRecommendUpgrade && (
                            <View
                                style={[
                                    styles.alertBanner,
                                    {backgroundColor: Colors.Warning},
                                ]}
                            >
                                <Feather
                                    name="trending-up"
                                    size={20}
                                    color={Colors.White}
                                    style={{marginRight: 8}}
                                />
                                <Text style={styles.alertText}>
                                    You've topped up twice this month. A higher plan may suit you better.
                                </Text>
                            </View>
                        )}

                        {/* Slider */}
                        <View style={styles.sliderContainer}>
                            <Text style={styles.minutesLabel}>{t("topup.modal.slider.label")}</Text>

                            <Text style={styles.minutesValue}>
                                {minutesToBuy} minutes
                            </Text>

                            {/* Slider Track Wrapper */}
                            <View style={styles.sliderTrackWrapper}>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={sliderMax}
                                    step={1}
                                    value={sliderValue}
                                    onValueChange={(val) => {
                                        setMinutesToBuy(
                                            TOP_UP_MIN_AMOUNT + val * SLIDER_STEP
                                        )
                                        setSliderPosition(val)
                                    }}
                                    minimumTrackTintColor={Colors.PrimaryColor}
                                    maximumTrackTintColor="#E5E7EB"
                                    thumbTintColor={Colors.PrimaryColor}
                                    disabled={isPurchasing}
                                />
                            </View>

                            <View style={styles.sliderBounds}>
                                <Text style={styles.sliderBoundText}>
                                    {t("topup.modal.slider.min", {
                                       min:TOP_UP_MIN_AMOUNT
                                    })}
                                </Text>
                                <Text style={styles.sliderBoundText}>
                                    {t("topup.modal.slider.max", {
                                        max:TOP_UP_MAX_AMOUNT
                                    })}
                                </Text>
                            </View>
                        </View>


                        {/* Cost */}
                        <View style={styles.costBox}>
                            <Text style={styles.costLabel}>Total Cost:</Text>
                            <Text style={styles.costValue}>
                                £{cost.toFixed(2)}
                            </Text>
                        </View>
                    </ScrollView>

                    {/* PAY */}
                    <TouchableOpacity
                        style={[
                            styles.checkoutButton,
                            isPurchasing && styles.disabledButton,
                        ]}
                        onPress={handleConfirm}
                        disabled={isPurchasing}
                    >
                        <Text style={styles.checkoutButtonText}>
                            {t("common.pay", {
                                currency:'£',
                                amount: cost.toFixed(2)
                            })}
                        </Text>
                    </TouchableOpacity>

                </View>
            </View>
        </Modal>
    );
};

export default TopUpModal;

// --- Styles ---
const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalView: {
        width: "100%",
        backgroundColor: Colors.Background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 25,
        alignItems: "center",
        maxHeight: "85%",
    },
    closeButton: {
        position: "absolute",
        top: 15,
        right: 15,
        zIndex: 10,
    },
    header: {
        fontSize: 24,
        fontWeight: "800",
        color: Colors.PrimaryColorText,
        marginTop: 10,
    },
    subHeader: {
        fontSize: 14,
        color: "#7F8C8D",
        marginBottom: 20,
    },
    scrollView: {
        width: "100%",
    },
    scrollContent: {
        width: "100%",
    },
    alertBanner: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    alertText: {
        color: Colors.White,
        fontWeight: "600",
        flex: 1,
    },
    sliderContainer: {
        width: "100%",
        paddingVertical: 15,
        backgroundColor: Colors.White,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.LightGray,
    },
    minutesLabel: {
        fontSize: 16,
        color: Colors.PrimaryColorText,
        fontWeight: "600",
        marginBottom: 5,
    },
    minutesValue: {
        fontSize: 28,
        fontWeight: "900",
        color: Colors.SecondaryColor,
        textAlign: "center",
        marginBottom: 10,
    },

    costBox: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 15,
        borderRadius: 10,
        backgroundColor: Colors.LightGray,
        marginBottom: 20,
    },
    costLabel: {
        fontSize: 18,
        fontWeight: "600",
        color: Colors.PrimaryColorText,
    },
    costValue: {
        fontSize: 22,
        fontWeight: "900",
        color: Colors.PrimaryColor,
    },
    checkoutButton: {
        width: "100%",
        backgroundColor: Colors.PrimaryColor,
        padding: 16,
        borderRadius: 10,
        alignItems: "center",
    },
    disabledButton: {
        backgroundColor: "#BDC3C7",
    },
    checkoutButtonText: {
        color: Colors.White,
        fontSize: 18,
        fontWeight: "700",
    },
    sliderTrackWrapper: {
        borderRadius: 20,
        marginTop: 10,
        borderWidth: 0,
        borderColor: "#E5E7EB",
    },

    slider: {
        width: "100%",
        height: 48,
    },

    sliderBounds: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 6,
    },

    sliderBoundText: {
        fontSize: 12,
        color: "#9CA3AF",
    },

});

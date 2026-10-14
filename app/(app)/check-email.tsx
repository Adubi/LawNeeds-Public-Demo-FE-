import React, {useEffect, useRef, useState} from "react";
import {COLORS} from "@/constants/colors";
import {SPACING} from "@/constants/theme";
import {Feather, MaterialIcons} from "@expo/vector-icons";
import {router, useLocalSearchParams} from "expo-router";
import {Animated, Image, StyleSheet, Text, TextInput, TouchableOpacity, View,} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {RFValue} from "react-native-responsive-fontsize";
import {widthPercentageToDP as wp} from "react-native-responsive-screen";
import {Button} from "@/components/Button";
import AuthServices from "../../services/AuthServices"

import {useTranslation} from 'react-i18next';

export default function CheckEmail() {

    const {t} = useTranslation();

    const [otp, setOtp] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
    const snackbarOpacity = useRef(new Animated.Value(0)).current;
    const params = useLocalSearchParams();
    const {email} = params;

    useEffect(() => {
        if (error) {
            setShowErrorSnackbar(true);
            Animated.timing(snackbarOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();

            // Auto hide after 3 seconds
            const timer = setTimeout(() => {
                hideErrorSnackbar();
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [error]);

    const hideErrorSnackbar = () => {
        Animated.timing(snackbarOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setShowErrorSnackbar(false);
            setError(null);
        });
    };
    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel={t('change_email.go_back')}
            >
                <MaterialIcons name="arrow-back-ios" size={24}/>
            </TouchableOpacity>

            <View style={{justifyContent: "center", alignItems: "center"}}>
                <Image
                    source={require("@/assets/images/checkemail.png")}
                    style={{width: wp(40), height: wp(40)}}
                    resizeMode="contain"
                />
            </View>
            <Text style={styles.title} allowFontScaling={false}>
                {t('change_email.check_your_mail')}
            </Text>
            <Text style={styles.description} allowFontScaling={false}>
                {t('change_email.check_mail_for_reset_pass')}
            </Text>

            <View
                style={{

                    marginTop: SPACING.lg,
                    paddingHorizontal: SPACING.lg,
                    gap: 10,
                }}
            >

                <View style={[styles.formField, {position: "relative", justifyContent: "center"}]}>
                    {/*<Text style={styles.formLabel} allowFontScaling={false}>*/}
                    {/*    Enter Your Code*/}
                    {/*</Text>*/}
                    <TextInput
                        style={{
                            width: "100%",

                            fontFamily: "InstrumentSansSemiBold",
                            fontSize: RFValue(14),
                        }}
                        allowFontScaling={false}
                        value={otp}
                        onChangeText={setOtp}
                        placeholder={t('change_email.enter_verification_code')}
                    />
                </View>


                <Button title={t('next')} style={{marginTop: SPACING.sm}} onPress={async () => {

                    try {
                        let body = {
                            email: email,
                            otp: otp
                        }
                        let response = await AuthServices.VerifyOtp(body);

                        if (!response.valid) {
                            setError(response.message)
                        } else {
                            router.push({pathname: "/(app)/create-new-password", params: {email: email, otp: otp}});
                        }
                    } catch (error: any) {

                       const errorDetail = error?.response?.data?.detail;
                       let message = t('error.error_msg');

                        if (Array.isArray(errorDetail)) {
                            message = errorDetail[0]?.msg ?? message;
                        } else if (typeof errorDetail === "string") {
                            message = errorDetail;
                        }

                        setError(message);
                    }


                }} loading={isLoading}/>
                <TouchableOpacity onPress={() => {
                    if (router.canGoBack()) {
                        router.dismissAll();
                    }
                    router.replace('/(app)/login');  // Replace current screen

                }}>
                    <Text style={styles.text} allowFontScaling={false}>
                        {t('change_email.go_back_login')}
                    </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={{
                    width: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: "auto",
                    paddingHorizontal: SPACING.lg,
                }}
                onPress={() => router.back()}
            >
                <Text
                    style={[styles.text, {color: COLORS.PrimaryColor}]}
                    allowFontScaling={false}
                >
                    {t('change_email.not_recd_mail')}{" "}
                    <Text style={{color: COLORS.Black}}>{t('change_email.try_other_email')}</Text>
                </Text>
            </TouchableOpacity>


            {showErrorSnackbar && (
                <Animated.View style={[styles.snackbar, {opacity: snackbarOpacity}]}>
                    <Text style={styles.snackbarText}>{error}</Text>
                    <TouchableOpacity onPress={hideErrorSnackbar}>
                        <Feather name="x" size={20} color="#FFF"/>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: SPACING.md,
        backgroundColor: COLORS.BackgroundColor,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        marginBottom: SPACING.md,
    },
    title: {
        fontFamily: "InstrumentSansBold",
        fontSize: RFValue(20),
        color: COLORS.PrimaryColor,
        textAlign: "center",
    },
    description: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
        color: COLORS.Gray,
        textAlign: "center",
        paddingHorizontal: SPACING.lg,
    },
    formLabel: {
        marginTop: 10,

        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
        color: COLORS.PrimaryColor,
    },
    formField: {
        borderWidth: 1,

        borderRadius: wp(100),
        paddingHorizontal: "5%",
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
        height: wp(13),
        overflow: "hidden",
    },

    text: {
        fontFamily: "InstrumentSansBold",
        fontSize: RFValue(14),
        color: COLORS.PrimaryColor,
        textAlign: "center",
    },
    snackbar: {
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: COLORS.PrimaryColor,
        padding: SPACING.md,
        borderRadius: wp(3),
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 1000,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    snackbarText: {
        color: "#FFF",
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
        flex: 1,
        marginRight: SPACING.sm,
    },
});

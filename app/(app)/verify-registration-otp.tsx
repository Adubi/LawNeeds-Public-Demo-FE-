import React, {useEffect, useRef, useState} from "react";
import {COLORS} from "@/constants/colors";
import {SPACING} from "@/constants/theme";
import {Feather, MaterialIcons} from "@expo/vector-icons";
import {router, useLocalSearchParams} from "expo-router";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Alert,
    Image, Animated, KeyboardAvoidingView, ActivityIndicator,
} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {RFValue} from "react-native-responsive-fontsize";
import {widthPercentageToDP as wp} from "react-native-responsive-screen";
import {Button} from "@/components/Button";
import AuthServices from "../../services/AuthServices"
import AsyncStorage from "@react-native-async-storage/async-storage";
import UserServices from "@/services/UserServices";
import {useTranslation} from 'react-i18next';
import {saveAuthData} from "@/constants/Utility";
import Analytics from "@/helpers/AnalyticsHelper";
import {PROFILE_COMPLETION_PROMPT_KEY} from "@/constants/onboarding";

export default function VerifyRegistrationOtp() {

    const {t} = useTranslation();

    const [otp, setOtp] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
    const snackbarOpacity = useRef(new Animated.Value(0)).current;
    const params = useLocalSearchParams();
    const {email} = params;
    const {localUri, filename, type} = params;

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
    const handleResendCode = async () => {

        try {
            setIsLoading(true)
            let body = {
                email: email
            }
            let response = await AuthServices.ResendRegistrationCode(body);
            setIsLoading(false)
            if (!response.valid) {
                setError(response.message)
            } else {
                setError(t('success.success_sent_code'))
            }
        } catch (error: any) {
            setIsLoading(false)
            const errorDetail = error?.response?.data?.detail;
            let message = t('error.error_msg');

            if (Array.isArray(errorDetail)) {
                message = errorDetail[0]?.msg ?? message;
            } else if (typeof errorDetail === "string") {
                message = errorDetail;
            }

            setError(message);
        }
    }

    const handleUploadProfilePicture = async () => {
        if (localUri !== undefined && localUri !== null && localUri !== '') {

            // if (typeof localUri === "string") {
            //     const safeUri = decodeURIComponent(localUri);
            // }
            // if (typeof filename === "string") {
            //     const safeFilename = decodeURIComponent(filename);
            // }
            // if (typeof type === "string") {
            //     const safeType = decodeURIComponent(type);
            // }


            const formData = new FormData();
            formData.append("file", {uri: localUri, name: filename, type} as any);

            try {
                const response = await UserServices.UpdateProfilePic(formData)
            } catch (e) {
                console.log("createProfile error:", e);
            }
        }

    }

    return (
        <SafeAreaView style={styles.container}>
            {/*<TouchableOpacity*/}
            {/*  onPress={() => router.back()}*/}
            {/*  style={styles.backButton}*/}
            {/*  accessibilityRole="button"*/}
            {/*  accessibilityLabel="Go back"*/}
            {/*>*/}
            {/*  <MaterialIcons name="arrow-back-ios" size={24} />*/}
            {/*</TouchableOpacity>*/}

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
                {t('change_email.check_mail_for_verify_account')}
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
                        setIsLoading(true)
                        let body = {
                            email: email,
                            otp: otp
                        }

                        let response = await AuthServices.VerifyRegistrationCode(body);

                        if (response?.token !== undefined && response?.user !== undefined) {
                            const authToken = response.token;
                            const authUser = response.user;

                            await Analytics.signupCompleted({
                                method: 'email',
                                accountType: response.user_type || 'user',
                            });

                            await saveAuthData(authToken, authUser)

                            if (response.user_type !== undefined && response.user_type !== null) {
                                await AsyncStorage.setItem("user_type", response.user_type);
                            }

                            // router.replace("/(app)/(tabs)");
                            //Upload profile picture
                            await handleUploadProfilePicture()

                            await AsyncStorage.setItem(PROFILE_COMPLETION_PROMPT_KEY, "true");
                            setIsLoading(false)
                            router.replace("/(app)/(tabs)");

                        } else if (response?.message !== undefined) {
                            setIsLoading(false)
                            setError(response.message)
                        } else {
                            setIsLoading(false)
                            let message = t('error.error_msg');
                            setError(message);
                        }

                    } catch (error: any) {
                        setIsLoading(false)
                        console.error("Verification code error:", error);
                        const errorDetail = error?.response?.data?.detail;
                        let message = t('error.error_msg');

                        if (Array.isArray(errorDetail)) {
                            message = errorDetail[0]?.msg ?? message;
                        } else if (typeof errorDetail === "string") {
                            message = errorDetail;
                        }

                        setError(message);
                    }


                }}/>

            </View>

            <TouchableOpacity
                style={{
                    width: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: "auto",
                    paddingHorizontal: SPACING.lg,
                }}
                onPress={() => handleResendCode()}
            >
                <Text
                    style={[styles.text, {color: COLORS.PrimaryColor}]}
                    allowFontScaling={false}
                >
                    {t('change_email.not_recd_mail')}{" "}
                    <Text style={{color: COLORS.Black}}>{t('change_email.resend_code')}</Text>
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

            {isLoading && (
                <ActivityIndicator
                    size="large"
                    color={COLORS.PrimaryColorText}
                    style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0
                    }}
                />
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

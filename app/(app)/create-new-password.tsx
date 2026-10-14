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
    Alert, Animated,
} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {RFValue} from "react-native-responsive-fontsize";
import {widthPercentageToDP as wp} from "react-native-responsive-screen";
import {Button} from "@/components/Button";
import AuthServices from "../../services/AuthServices"
import {useTranslation} from "react-i18next";

export default function CreateNewPassword() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
    const snackbarOpacity = useRef(new Animated.Value(0)).current;
    const [showConfirmPassword, setConfirmShowPassword] =
        useState<boolean>(false);
    const params = useLocalSearchParams();
    const {email, otp} = params;

    const {t} = useTranslation();

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


    const handleResetPassword = async () => {

        if (password === "") {
            Alert.alert(t('error.title'), t('validation.enter_your_name'))
        } else if (password.length < 8 ||
            !/\d/.test(password)) {

            Alert.alert(t('error.title'), t('validation.valid_password'))
        } else if (confirmPassword === "") {
            Alert.alert(t('validation.enter_confirm_password'), "")
        } else if (confirmPassword.length < 8 ||
            !/\d/.test(confirmPassword)) {
            Alert.alert(t('error.title'), t('validation.valid_confirm_password'))
        } else if (confirmPassword !== password) {
            Alert.alert(t('error.title'), t('validation.password_not_match'))
        } else {
            try {

                let body = {
                    email: email,
                    otp: otp,
                    password: password,
                    password_confirm: confirmPassword
                }

                let response = await AuthServices.PasswordRest(body);

                if (response && response.message) {
                    Alert.alert("", response.message, [
                        {
                            text: t('ok'),
                            onPress: () => {
                                if (router.canGoBack()) {
                                    router.dismissAll();
                                }
                                router.replace('/(app)/login');  // Replace current screen
                            }, // Optional action on pressing OK
                        },
                    ],)
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
        }


        // router.push("/(app)/change-email")
    };

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
            {/*<Text style={styles.title} allowFontScaling={false}>*/}
            {/*  Create new password*/}
            {/*</Text>*/}
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <MaterialIcons name="arrow-back-ios" size={24} color={COLORS.PrimaryColor}/>
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false}>
                    {t('create_new_password')}
                </Text>
            </View>
            <Text style={styles.description} allowFontScaling={false}>
                {t('enter_new_password_below')}
            </Text>

            <View style={{gap: 5, marginVertical: SPACING.md}}>
                <Text style={styles.formLabel} allowFontScaling={false}>
                    {t('login.password')}
                </Text>
                <View style={[styles.formField, {position: "relative"}]}>
                    <TextInput
                        style={{
                            width: "100%",
                            height: "100%",
                            fontFamily: "InstrumentSansSemiBold",
                            fontSize: RFValue(14),
                        }}
                        allowFontScaling={false}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={{
                            position: "absolute",
                            right: 5,
                            top: 0,
                            bottom: 0,
                            justifyContent: "center",
                            alignItems: "center",
                            paddingHorizontal: 10, // add padding if needed
                        }}
                    >
                        <Feather
                            name={showPassword ? "eye" : "eye-off"}
                            size={wp(5)}
                            color={COLORS.Gray}
                        />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={{gap: 5, marginBottom: SPACING.md}}>
                <Text style={styles.formLabel} allowFontScaling={false}>
                    {t('confirm_password')}
                </Text>
                <View style={[styles.formField, {position: "relative"}]}>
                    <TextInput
                        style={{
                            width: "100%",
                            height: "100%",
                            fontFamily: "InstrumentSansSemiBold",
                            fontSize: RFValue(14),
                        }}
                        allowFontScaling={false}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                        onPress={() => setConfirmShowPassword(!showConfirmPassword)}
                        style={{
                            position: "absolute",
                            right: 5,
                            top: 0,
                            bottom: 0,
                            justifyContent: "center",
                            alignItems: "center",
                            paddingHorizontal: 10, // add padding if needed
                        }}
                    >
                        <Feather
                            name={showConfirmPassword ? "eye" : "eye-off"}
                            size={wp(5)}
                            color={COLORS.Gray}
                        />
                    </TouchableOpacity>
                </View>
            </View>
            <Button
                title={t('reset_password')}
                onPress={handleResetPassword}
                loading={isLoading}
            />

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
        position: "absolute",
        left: 0,
        padding: 0, // Ensure a good touchable area
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        height: 50, // Adjust height as needed
    },
    title: {
        fontFamily: "InstrumentSansBold",
        fontSize: RFValue(20),
        color: COLORS.PrimaryColor,
    },
    headerTitle: {
        color: COLORS.PrimaryColor,
        textAlign: "center",
        fontSize: RFValue(22),
        fontFamily: "InstrumentSansSemiBold",
    },
    description: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
        color: COLORS.PrimaryColor,
        marginTop: SPACING.md,
    },
    formLabel: {
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

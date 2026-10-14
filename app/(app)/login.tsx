import React, {useEffect, useRef, useState} from "react";
import {Animated, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import {COLORS} from "@/constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {RFValue} from "react-native-responsive-fontsize";
import {Link, router} from "expo-router";
import {resetAndNavigate} from "@/utils/Helpers";
import {FONT_SIZES, SPACING} from "@/constants/theme";
import {widthPercentageToDP as wp} from "react-native-responsive-screen";
import {Feather, MaterialIcons} from "@expo/vector-icons";
import {Checkbox} from "@/components/Checkbox";
import AuthServices from "@/services/AuthServices";
import {SafeAreaView} from "react-native-safe-area-context";
import {useTranslation} from 'react-i18next';
import Analytics from "@/helpers/AnalyticsHelper";
import {saveAuthData} from "@/constants/Utility";
import {identityVerificationDestination} from "@/services/identityVerificationNavigation";
import {getAuthToken} from "@/services/httpservice";


const Login = () => {

    const {t} = useTranslation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
    const snackbarOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let active = true;

        const redirectAuthenticatedUser = async () => {
            const token = await getAuthToken();
            if (!active || !token) return;
            router.replace(await identityVerificationDestination() as any);
        };

        redirectAuthenticatedUser();

        return () => {
            active = false;
        };
    }, []);

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

    const nextStepAfterLoginSuccess = async (response: any) => {

        await saveAuthData(response.token, response.user)

        if (response.user_type !== null) {
            await AsyncStorage.setItem("user_type", response.user_type);
        } else {
            await AsyncStorage.removeItem("user_type");
        }

        if(response?.user?.id) {
            await Analytics.setUserId(response?.user?.id);
        }

        // Navigate after successful login
        resetAndNavigate(await identityVerificationDestination())

    }

    const getErrorMessage = (error: any) => {
        // 1️⃣ Network error (no response from server)
        if (!error.response) {
            return t('error.network_error');
        }

        const status = error.response.status;
        const apiMessage = error.response?.data?.message;
        const apiDetailError = error.response?.data?.detail;
        if (apiDetailError) {
            return apiDetailError;
        }
        // 2️⃣ If backend sent a clean message, use it
        if (
            apiMessage &&
            typeof apiMessage === "string" &&
            !apiMessage.toLowerCase().includes("request failed") &&
            !apiMessage.toLowerCase().includes("status code")
        ) {
            return apiMessage;
        }

        // 3️⃣ Fallback based on status code
        switch (status) {
            case 401:
                return t('error.session_expired');
            case 403:
                return t('error.no_permission');
            case 404:
                return t('error.resource_not_found');
            case 422:
                return t('error.invalid_data');
            case 500:
                return t('error.server_error');
            default:
                return t('error.something_went_wrong');
        }
    };

    const handleEmailSignIn = async () => {
        Keyboard.dismiss();
        try {
            setError(null);
            if (!email || !password) {
                setError(t('error.fill_all_fields'));
                return;
            }

            let body = {
                email: email.toLowerCase(),
                password: password,
            };

            const response = await AuthServices.Login(body);

            if (response?.token) {
                nextStepAfterLoginSuccess(response)

            } else {
                setError(t('error.invalid_response_token_not_found'));
            }

        } catch (error) {
            const errorMessage = getErrorMessage(error);
            setError(errorMessage || t('error.error_msg'));
        }
    };


    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.headerContainer}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <MaterialIcons name="arrow-back-ios" size={24} color={COLORS.PrimaryColor}/>
                </TouchableOpacity>
                <Text style={styles.headerTitle} allowFontScaling={false}>
                    {t('login.login')}
                </Text>
            </View>

            <View style={{flex: 1, paddingTop: wp(30)}}>
                <View style={{gap: 30}}>
                    <View style={{gap: 5}}>
                        <Text style={styles.formLabel} allowFontScaling={false}>
                            {t('email')}
                        </Text>
                        <TextInput
                            style={styles.formField}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            allowFontScaling={false}
                        />
                    </View>
                    <View style={{gap: 5}}>
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

                    <View style={styles.rememberForgot}>
                        <Checkbox
                            label={t('login.remember_me')}
                            checked={rememberMe}
                            onCheck={setRememberMe}
                        />
                        <Link href="/reset-password" style={styles.forgotLink}>
                            {t('login.forgot_password')}
                        </Link>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles?.button,
                            {backgroundColor: COLORS.PrimaryColor, width: "100%"},
                        ]}
                        onPress={handleEmailSignIn}
                    >
                        <Text
                            style={[styles.buttonText, {color: COLORS.White}]}
                            allowFontScaling={false}
                        >
                            {t('login.login')}
                        </Text>
                    </TouchableOpacity>

                </View>

                <View
                    style={{
                        width: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                        marginTop: "auto",
                    }}
                >
                    <TouchableOpacity
                        onPress={async () => {
                            await Analytics.signupStarted({method: 'email', accountType: 'user'});
                            router.push("/signup");
                        }}
                    >
                        <Text
                            style={[styles.formLabel, {marginTop: 20, marginBottom: 10}]}
                            allowFontScaling={false}
                        >
                            {t('login.need_account')}{" "}
                            <Text style={{color: COLORS.SecodaryColor}}>{t('login.signup')}</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Error Snackbar */}
            {showErrorSnackbar && (
                <Animated.View
                    style={[
                        styles.snackbar,
                        {opacity: snackbarOpacity}
                    ]}
                >
                    <Text style={styles.snackbarText}>{error}</Text>
                    <TouchableOpacity onPress={hideErrorSnackbar}>
                        <Feather name="x" size={20} color="#FFF"/>
                    </TouchableOpacity>
                </Animated.View>
            )}
            {/* Form End */}
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        backgroundColor: COLORS.BackgroundColor,
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        height: 50, // Adjust height as needed
    },
    backButton: {
        position: "absolute",
        left: 0,
        padding: 0, // Ensure a good touchable area
    },
    headerTitle: {
        color: COLORS.PrimaryColor,
        textAlign: "center",
        fontSize: RFValue(22),
        fontFamily: "InstrumentSansSemiBold",
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
    rememberForgot: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    forgotLink: {
        color: COLORS.PrimaryColor,
        fontSize: RFValue(12),
        fontFamily: "InstrumentSansBold",
    },
    button: {
        padding: wp(3.5),
        width: "40%",
        borderRadius: wp(100),
        justifyContent: "center",
        alignItems: "center",
    },
    buttonText: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
    },

    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        width: wp(60),
        height: wp(60),
        backgroundColor: "#FFF",
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalText: {
        marginTop: 10,
        fontSize: RFValue(16),
        color: COLORS.PrimaryColor,
        fontFamily: "InstrumentSansBold",
    },
    snackbar: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: COLORS.PrimaryColor,
        padding: SPACING.md,
        borderRadius: wp(3),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    snackbarText: {
        color: '#FFF',
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
        flex: 1,
        marginRight: SPACING.sm,
    },
    textInput: {
        flex: 1,
        fontSize: FONT_SIZES.md,
        paddingVertical: SPACING.sm,
    },
});

export default Login;

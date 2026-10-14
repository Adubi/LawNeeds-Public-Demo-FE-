import React, {useEffect, useRef, useState} from "react";
import {Animated, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";

import {SafeAreaView} from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {widthPercentageToDP as wp,} from "react-native-responsive-screen";
import {COLORS} from "@/constants/colors";
import {RFValue} from "react-native-responsive-fontsize";
import {router} from "expo-router";
import Divider from "@/components/Divider";
import {SPACING} from "@/constants/theme";
import {Button} from "@/components/Button";
import {ProTypes} from "@/constants/protypes"
import Constants from 'expo-constants';

import {generateCodeChallenge, generateCodeVerifier} from "@/constants/pkce"
import {useTranslation} from 'react-i18next';
import {Feather, Ionicons} from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import AuthServices from "@/services/AuthServices";
import {resetAndNavigate} from "@/utils/Helpers";
import * as WebBrowser from 'expo-web-browser';
import {getAuthToken, mobile_app_terms, privacy_policy_url} from "@/services/httpservice";
import {makeRedirectUri} from "expo-auth-session";
import {saveAuthData} from "@/constants/Utility";
import {identityVerificationDestination} from "@/services/identityVerificationNavigation";
import Analytics from "@/helpers/AnalyticsHelper";
import {useApp} from "@/contexts/AppContext";
import {TermsAndConditions} from "@/components/TermsAndConditons";
import {PrivacyPolicy} from "@/components/PrivacyPolicy";
import UserService from "@/services/UserServices";
import CustomDatePicker from "@/components/DatePicker";
import CountryPicker from "@/components/CountryPicker";
import {PROFILE_COMPLETION_PROMPT_KEY} from "@/constants/onboarding";


WebBrowser.maybeCompleteAuthSession();

const Welcome = () => {


    const {
        hasAcceptedTerms,
        hasAcceptedPrivacyPolicy,
    } = useApp();

    const [error, setError] = useState<string | null>(null);
    const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
    const snackbarOpacity = useRef(new Animated.Value(0)).current;

    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [country, setCountry] = useState("");
    const [dateModalVisible, setDateModalVisible] = useState(false);
    const [countryModalVisible, setCountryModalVisible] = useState(false);

    const [pendingLoginResponse, setPendingLoginResponse] = useState<any>(null);



    const [modalVisible, setModalVisible] = React.useState(false);
    const [createAccountModalVisible, setCreateAccountModalVisible] = React.useState({
        visible: false,
        isLogin: false
    });
    const {t} = useTranslation();


    let redirectUri = makeRedirectUri({
        //path: 'oauth2redirect/google',
        scheme: Platform.OS === 'ios' ? 'com.steve.LawNeeds' : 'com.steve.lawneeds'
    });

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

    // Show error snackbar when error is set
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

    useEffect(() => {
        const checkAuthToken = async () => {
            try {
                const authToken = await getAuthToken();
                if (authToken) {
                    router.replace("/(app)/(tabs)");
                }
            } catch (error) {
                console.error("Error fetching auth token:", error);
            }
        };

        checkAuthToken();
    }, []);


    function hideShowLoginSignupPopup(isVisible: boolean, isLoggedIn: boolean) {
        setCreateAccountModalVisible({
            visible: isVisible,
            isLogin: isLoggedIn
        })
    }


    const updateProfileAfterSocialLogin = async () => {
        try {
            setProfileLoading(true);

            const payload = {
                email: email.trim().toLowerCase(),
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                date_of_birth: dateOfBirth,
                country: country.trim(),
                phone_number: "",
            };


            const response = await UserService.UpdateProfile(payload);
            if (response.profile) {
                if (pendingLoginResponse?.token) {
                    await saveAuthData(pendingLoginResponse.token, {
                        ...pendingLoginResponse.user,
                        ...response.profile,
                    });
                }
                await AsyncStorage.setItem(PROFILE_COMPLETION_PROMPT_KEY, "true");
                resetAndNavigate(await identityVerificationDestination());
            } else {
                console.log("Error updating profile:");
            }

        } catch (e: any) {
            setError(
                e?.response?.data?.detail ||
                t("profile_completion.update_profile_failed")
            );
        } finally {
            setProfileLoading(false);
        }
    };


    const completeLogin = async (response: any) => {
        await saveAuthData(response.token, response.user);

        if (response.user_type !== null) {
            await AsyncStorage.setItem(
                "user_type",
                response.user_type
            );
        } else {
            await AsyncStorage.removeItem("user_type");
        }

        resetAndNavigate(await identityVerificationDestination());
    };


    const nextStepAfterLoginSuccess = async (
        response: any,
        signupMethod?: 'google' | 'apple'
    ) => {

        const user = response?.user || {};

        if (response.is_new_user && signupMethod) {
            await Analytics.signupCompleted({
                method: signupMethod,
                accountType: 'user',
            });
        }

        const needsProfileCompletion =
            response?.requires_profile_completion === true ||
            !user?.email?.trim() ||
            !user?.first_name?.trim() ||
            !user?.last_name?.trim() ||
            !user?.date_of_birth;

        await saveAuthData(response.token, response.user);

        if (response.user_type !== null) {
            await AsyncStorage.setItem("user_type", response.user_type);
        } else {
            await AsyncStorage.removeItem("user_type");
        }

        if (needsProfileCompletion) {
            setPendingLoginResponse(response);
            setEmail(user?.email || "");
            setUsername(user?.user_name || "");
            setFirstName(user?.first_name || "");
            setLastName(user?.last_name || "");
            setDateOfBirth(user?.date_of_birth || "");
            setCountry(user?.country || "");
            setProfileModalVisible(true);
        } else {
            await completeLogin(response);
        }
    };

    const navigateSignUpPro = async (type: ProTypes) => {
        setModalVisible(false)
        switch (type) {
            case ProTypes.LAWYER:
                await Analytics.signupStarted({method: 'email', accountType: 'lawyer'})
                router.navigate("/(app)/signup-pro-lawyer");
                break;
            case ProTypes.LAW_FIRM:
                await Analytics.signupStarted({method: 'email', accountType: 'law-firm'})
                router.navigate("/(app)/signup-pro-law-firm");
                break;
            case ProTypes.HR_LEGAL:
                await Analytics.signupStarted({method: 'email', accountType: 'hr-legal'})
                router.navigate("/(app)/signup-pro-hr-legal");
                break
            case ProTypes.A2J_PARTNERS:
                await Analytics.signupStarted({method: 'email', accountType: 'a2j-partner'})
                router.navigate("/(app)/signup-pro-a2jpartner");
                break
            default:
                await Analytics.signupStarted({method: 'email', accountType: 'lawyer'})
                router.navigate("/(app)/signup-pro-lawyer");
        }
    }

    const exchangeCodeForToken = async (
        code: string,
        deviceType: string,
        signupIntent: boolean
    ) => {
        try {
            // Retrieve code verifier
            const codeVerifier = await AsyncStorage.getItem("oauth_code_verifier");

            if (!codeVerifier) {
                setError(t("auth.session_expired"));
            }

            let payload = {
                "code": code,
                "device": deviceType,
                "code_verifier": codeVerifier,
            }

            const response = await AuthServices.googleLoginCallBack(payload);

            if (!response.success) {
                setError(t("auth.login_failed"));
            } else {

                if (response?.token) {
                    await nextStepAfterLoginSuccess(
                        response,
                        signupIntent ? 'google' : undefined
                    )
                } else {
                    setError(t('auth.invalid_response'));
                }
            }

            await cleanup();

        } catch (error: any) {
            let errorMessage = `${error.response?.data?.detail || t('error.error_msg')}`;
            setError(errorMessage);
            throw errorMessage;
        }
    }

    const cleanup = async () => {
        await AsyncStorage.removeItem("oauth_code_verifier");
        //codeVerifier = null;
    }

    const extractCodeFromUrl = (url: string) => {
        const match = url.match(/[?&]code=([^&]+)/);
        return match ? decodeURIComponent(match[1]) : null;
    }


    const loginWithGoogle = async (deviceType: string, signupIntent: boolean) => {
        try {
            // Step 1: Generate PKCE parameters
            let codeVerifier = await generateCodeVerifier();
            const codeChallenge = await generateCodeChallenge(codeVerifier);

            // Step 2: Store code verifier securely
            await AsyncStorage.setItem("oauth_code_verifier", codeVerifier);

            let authUrlData = await AuthServices.googleLoginAuthorize(deviceType, codeChallenge);

            if (!authUrlData.success) {
                setError(t("auth.authorization_failed"));
            }

            // Step 4: Open browser for OAuth
            const result = await WebBrowser.openAuthSessionAsync(
                authUrlData.authorization_url,
                redirectUri
            );

            if (result.type !== "success") {
                setError(t("auth.login_failed"));
                return;
            }


            // Step 5: Extract authorization code from callback URL
            const url = result.url;

            if (!url) {
                setError(t("auth.invalid_redirect"));
                return;
            }

            const code = extractCodeFromUrl(url);

            if (!code) {
                setError(t("auth.login_failed"));
                return; // ✅ STOP execution
            }

            return await exchangeCodeForToken(code, deviceType, signupIntent);

        } catch (error: any) {
            let errorMessage = `${error.response?.data?.detail || t("auth.login_failed")}`;
            setError(errorMessage);
            await cleanup();
            throw error;
        }
    }


    const handleGoogleLogin = async (signupIntent: boolean) => {
        let deviceType = Platform.OS === 'android' ? "android" : 'ios'
        try {
            if (signupIntent) {
                await Analytics.signupStarted({method: 'google', accountType: 'user'});
            }
            await loginWithGoogle(deviceType, signupIntent);

        } catch (error) {
            /* alert("Login Failed",
                 error.message || "An error occurred during login",
                 [{text: "OK"}]
             );*/
        } finally {
            //  setLoading(false);
        }
    };


    // --- Apple Login (iOS only) ---
    const handleAppleLogin = async (signupIntent: boolean) => {
        if (Platform.OS !== "ios") return;
        try {
            if (signupIntent) {
                await Analytics.signupStarted({method: 'apple', accountType: 'user'});
            }
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                ],
            });


            if (!credential.identityToken) {
                setError(t("auth.apple_login_failed"));
                return;
            }

            if (!credential.authorizationCode) {
                setError(t("auth.apple_login_failed"));
                return;
            }

            const data = new URLSearchParams();
            data.append('code', credential.authorizationCode);          // code from an authorization step
            data.append('identity_token', credential.identityToken);
            data.append('user', JSON.stringify({
                name: {
                    firstName: credential.fullName?.givenName || "",
                    lastName: credential.fullName?.familyName || "",
                },
            }));

            try {
                const response = await AuthServices.appleLoginCallBack(data);

                if (response?.success && response?.token) {
                    await nextStepAfterLoginSuccess(
                        response,
                        signupIntent ? 'apple' : undefined
                    );
                } else {
                    setError(response?.message || t('auth.invalid_response'));
                }

            } catch (error: any) {
               // console.log("Apple backend error:", error);
                setError(error?.response?.data?.detail || t('error.error_msg'));
                await cleanup();
            }

            // Send identityToken or authorizationCode to backend

        } catch (e: any) {

            if (e.code === "ERR_CANCELED") {
                setError(t("auth.cancelled_login"));
            } else {
                setError(t("auth.login_failed"));
            }
        }
    };



    return (
        <SafeAreaView style={styles.container}>
            <View
                style={{
                    flex: 1 / 2,
                    justifyContent: "flex-end",
                    alignItems: "center",
                    width: "100%",
                }}
            >
                <Image
                    source={require("@/assets/images/welcomescreen.png")}
                    style={{width: wp(70), height: wp(70)}}
                    resizeMode="contain"
                />
                <View
                    style={{
                        width: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Text
                        style={{
                            color: COLORS.SecodaryColor,
                            fontFamily: "InstrumentSansBold",
                            fontSize: RFValue(22),
                            lineHeight: RFValue(28),
                            textAlign: "center",
                        }}
                        allowFontScaling={false}
                    >
                        {t('landing.welcome_to')}
                    </Text>
                    <Text
                        style={{
                            color: COLORS.PrimaryColor,
                            fontFamily: "InstrumentSansBold",
                            fontSize: RFValue(30),
                            lineHeight: RFValue(36),
                            textAlign: "center",
                        }}
                        allowFontScaling={false}
                    >
                        LawNeeds
                    </Text>

                    <Text
                        style={{
                            color: COLORS.PrimaryColor,
                            marginTop: SPACING.sm,
                            fontFamily: "InstrumentSansBold",
                            fontSize: RFValue(16),
                            lineHeight: RFValue(22),
                            textAlign: "center",
                        }}
                        allowFontScaling={false}
                    >
                        {t('landing.immigration')}
                    </Text>

                </View>
            </View>

            <View
                style={{
                    flex: 1 / 3,
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: 15,
                }}
            >

                <TouchableOpacity
                    style={[
                        styles?.button,
                        {backgroundColor: COLORS.SecodaryColor, width: wp(90)},
                    ]}
                    onPress={() => {
                        hideShowLoginSignupPopup(true, false);
                    }}
                >
                    <Text
                        style={[styles.buttonText, {color: COLORS.White}]}
                        allowFontScaling={false}
                    >
                        {t('landing.create_account')}
                    </Text>
                </TouchableOpacity>


                <TouchableOpacity
                    style={[
                        styles?.button,
                        {borderColor: COLORS.PrimaryColor, borderWidth: 2, width: wp(90)},
                    ]}
                    onPress={() => {
                        hideShowLoginSignupPopup(true, true);
                    }}
                >
                    <Text
                        style={[styles.buttonText, {color: COLORS.Black}]}
                        allowFontScaling={false}
                    >
                        {t('landing.log_in')}
                    </Text>
                </TouchableOpacity>

                <Divider/>

                <TouchableOpacity
                    style={[
                        styles?.button,
                        {backgroundColor: COLORS.PrimaryColor, width: wp(90)},
                    ]}
                    onPress={() => {
                        setModalVisible(true)
                    }}
                >
                    <Text
                        style={[styles.buttonText, {color: COLORS.White}]}
                        allowFontScaling={false}
                    >
                        {t('landing.create_pro')}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footerContainer}>

                {/* Divider */}
                <View style={[styles.bottomDivider, {marginTop: 20}]}/>

                {/* Clickable Terms Text */}
                <Text style={styles.info}>
                    {t("policy_text.review_message")}{" "}
                    <Text
                        style={styles.link}
                        onPress={() => router.push(`/(app)/terms-and-privacy?terms_endpoint=${privacy_policy_url}`)}
                    >
                        {t("policy_text.privacy_policy")}
                    </Text>
                    {" "}and{" "}
                    <Text
                        style={styles.link}
                        onPress={() => router.push(`/(app)/terms-and-privacy?terms_endpoint=${mobile_app_terms}`)}
                    >
                        {t("terms_n_conditions")}
                    </Text>
                    .
                </Text>

            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'flex-end',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    }}
                >
                    <View
                        style={{
                            backgroundColor: COLORS.BackgroundColor,
                            padding: 20,
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            width: '100%',
                            maxHeight: '80%',
                        }}
                    >

                        <Text style={styles.title}>{t('landing.select_pro')}</Text>
                        <View style={styles.bottomDivider}/>

                        <TouchableOpacity
                            style={{paddingVertical: 10}}
                            onPress={() => {
                                navigateSignUpPro(ProTypes.LAWYER)
                            }}
                        >
                            <Text style={[styles.buttonText, {textAlign: 'center'}]}>{t('landing.lawyer')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{paddingVertical: 10}}
                            onPress={() => {
                                navigateSignUpPro(ProTypes.LAW_FIRM)
                            }}
                        >
                            <Text style={[styles.buttonText, {textAlign: 'center'}]}>{t('landing.law_firm')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{paddingVertical: 10}}
                            onPress={() => {
                                navigateSignUpPro(ProTypes.HR_LEGAL)
                            }}
                        >
                            <Text style={[styles.buttonText, {textAlign: 'center'}]}>{t('landing.hr_legal')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{paddingVertical: 10}}
                            onPress={() => {
                                navigateSignUpPro(ProTypes.A2J_PARTNERS)
                            }}
                        >
                            <Text style={[styles.buttonText, {textAlign: 'center'}]}>{t('landing.a2j_partners')}</Text>
                        </TouchableOpacity>

                        <Button
                            title={t('cancel')}
                            onPress={() => setModalVisible(false)}
                            variant="secondary"
                            style={{marginTop: 25}}
                        />
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={createAccountModalVisible.visible}
                onRequestClose={() => hideShowLoginSignupPopup(false, false)}
            >
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'flex-end',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    }}
                >
                    <View
                        style={{
                            backgroundColor: COLORS.BackgroundColor,
                            padding: 20,
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            width: '100%',
                            maxHeight: '80%',
                        }}
                    >
                        <Text style={styles.title}>{
                            createAccountModalVisible.isLogin ?
                                t('login_with') :
                                t('create_account_with')
                        }</Text>

                        <View style={styles.bottomDivider}/>


                        <TouchableOpacity
                            style={[
                                styles.socialButtonView,
                                {
                                    borderColor: COLORS.PrimaryColor,
                                    borderWidth: 1,
                                    width: "100%",
                                    marginTop: 20
                                },
                            ]}
                            onPress={async () => {
                                if (createAccountModalVisible.isLogin) {
                                    router.navigate("/(app)/login");
                                } else {
                                    await Analytics.signupStarted({method: 'email', accountType: 'user'})
                                    router.navigate("/(app)/signup");
                                }
                                hideShowLoginSignupPopup(false, false)
                            }}
                        >

                            <Ionicons name="mail" size={28} color={COLORS.PrimaryColor}/>

                            <Text style={[styles.buttonTitle, {color: COLORS.PrimaryColor}]}>
                                {t('create_account_email_password')}
                            </Text>
                        </TouchableOpacity>


                        {Platform.OS === 'ios' && <TouchableOpacity
                            style={[
                                styles.socialButtonView,
                                {
                                    backgroundColor: "#000",
                                    width: "100%",
                                    marginTop: 20
                                },
                            ]}
                            onPress={() => {
                                handleAppleLogin(!createAccountModalVisible.isLogin)
                                hideShowLoginSignupPopup(false, false)
                            }}
                        >
                            <Ionicons name="logo-apple" size={28} color="white"/>
                            <Text style={[styles.buttonTitle, {color: "white"}]}>
                                {t("sign_in_with_apple")}
                            </Text>
                        </TouchableOpacity>}

                        <TouchableOpacity
                            style={[
                                styles.socialButtonView,
                                {
                                    backgroundColor: "#fff",
                                    width: "100%",
                                    borderWidth: 1,
                                    borderColor: "#ddd",
                                    marginTop: 20
                                },
                            ]}
                            onPress={() => {
                                handleGoogleLogin(!createAccountModalVisible.isLogin);
                                hideShowLoginSignupPopup(false, false)
                            }}
                        >
                            <Image
                                source={require("@/assets/images/google-icon.png")}
                                style={styles.socialButton}
                            />

                            <Text style={[styles.buttonTitle, {color: "#333"}]}>
                                {t("sign_in_with_google")}
                            </Text>
                        </TouchableOpacity>

                        <Button
                            title={t('cancel')}
                            onPress={() => {
                                hideShowLoginSignupPopup(false, false)
                            }}
                            variant="secondary"
                            style={{marginTop: 20}}
                        />


                    </View>
                </View>
            </Modal>

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

            <Modal
                visible={profileModalVisible}
                transparent
                animationType="fade"
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        padding: 20,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: COLORS.White,
                            borderRadius: 16,
                            padding: 20,
                            maxHeight: "90%",
                        }}
                    >
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                        <Text
                            style={{
                                fontFamily: "InstrumentSansBold",
                                fontSize: RFValue(18),
                                marginBottom: 8,
                                textAlign: "center",
                            }}
                        >
                            {t("profile_completion.title")}
                        </Text>

                        <Text
                            style={{
                                textAlign: "center",
                                marginBottom: 20,
                                color: "#666",
                            }}
                        >
                            {t("profile_completion.description")}
                        </Text>

                        <Text style={styles.profileLabel}>
                            {t('email')}
                        </Text>

                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            textContentType="emailAddress"
                            autoComplete="email"
                            style={styles.profileInput}
                        />

                        <Text style={styles.profileLabel}>
                            {t("profile_completion.first_name")}
                        </Text>

                        <TextInput
                            value={firstName}
                            onChangeText={setFirstName}
                            style={styles.profileInput}
                        />

                        <Text style={styles.profileLabel}>
                            {t("profile_completion.last_name")}
                        </Text>

                        <TextInput
                            value={lastName}
                            onChangeText={setLastName}
                            style={styles.profileInput}
                        />

                        <Text style={styles.profileLabel}>
                            {t('create_account.date_of_birth')}
                        </Text>

                        <TouchableOpacity
                            accessibilityRole="button"
                            onPress={() => setDateModalVisible(true)}
                            style={styles.profileInput}
                        >
                            <Text>{dateOfBirth || t('select_date')}</Text>
                        </TouchableOpacity>

                        <CustomDatePicker
                            minAgeLimit={18}
                            onDateSelected={setDateOfBirth}
                            setModalVisible={setDateModalVisible}
                            isModalVisible={dateModalVisible}
                        />

                        <Text style={styles.profileLabel}>
                            {t('create_account.country')} ({t('optional', {defaultValue: 'Optional'})})
                        </Text>

                        <TouchableOpacity
                            accessibilityRole="button"
                            onPress={() => setCountryModalVisible(true)}
                            style={styles.profileInput}
                        >
                            <Text>{country || t('create_account.select_country')}</Text>
                        </TouchableOpacity>

                        <CountryPicker
                            isVisible={countryModalVisible}
                            onClose={() => setCountryModalVisible(false)}
                            onSelectCountry={setCountry}
                        />

                        <Button
                            title={
                                profileLoading
                                    ? t("profile_completion.saving")
                                    : t("profile_completion.save_continue")
                            }
                            disabled={
                                profileLoading ||
                                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
                                !firstName.trim() ||
                                !lastName.trim() ||
                                !dateOfBirth
                            }
                            onPress={updateProfileAfterSocialLogin}
                            style={{ marginTop: 20 }}
                        />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>


            {!hasAcceptedTerms ? (
                <TermsAndConditions />
            ) : !hasAcceptedPrivacyPolicy ? (
                <PrivacyPolicy />
            ) : null}

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        backgroundColor: COLORS.BackgroundColor,
    },
    button: {
        padding: wp(3.5),
        paddingHorizontal: wp(5),
        minHeight: 48,
        width: "40%",
        borderRadius: wp(100),
        marginHorizontal: wp(3.5),
        justifyContent: "center",
        alignItems: "center",
    },
    buttonText: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
        lineHeight: RFValue(19),
        textAlign: "center",
        flexShrink: 1,
        includeFontPadding: true,
    },
    secondaryButton: {
        width: "40%",
        padding: wp(3.5),
        borderRadius: wp(100),
        marginHorizontal: wp(3.5),
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.Gray,
    },
    secondaryButtonText: {
        color: COLORS.Gray,
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
        lineHeight: RFValue(19),
        textAlign: "center",
        includeFontPadding: true,
    },
    reviewButton_two: {
        flex: 1,
        borderColor: COLORS.PrimaryColor,
        shadowColor: COLORS.PrimaryColor,
        borderWidth: 2,
    },
    title: {
        fontSize: RFValue(14),
        fontFamily: "InstrumentSansBold",
        lineHeight: RFValue(20),
        marginBottom: 5,
        textAlign: 'center'
    },
    bottomDivider: {
        width: "100%",
        height: 1,
        backgroundColor: "#C0C0C0",
        marginVertical: 10,
    },
    closeButton: {
        position: "absolute",
        top: 10,
        right: 10,
        padding: 10,
        justifyContent: "center",
    },
    closeButtonImage: {
        width: 24,
        height: 24,
    },
    footerContainer: {
        alignItems: 'center',
        paddingVertical: 10,
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
    },
    socialButtonView: {
        padding: wp(3.5),
        paddingHorizontal: wp(5),
        minHeight: 52,
        flexDirection: "row",
        borderRadius: wp(100),
        justifyContent: "center",
        alignItems: "center",
    },
    buttonTitle: {
        marginStart: 8,
        textAlign: "center",
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
        lineHeight: RFValue(19),
        flexShrink: 1,
        includeFontPadding: true,
    },
    socialButton: {
        width: 28,
        height: 28,
        resizeMode: "contain",
    },
    link: {
        color: '#1559b7',
        textDecorationLine: 'underline',
        fontWeight: 'bold',
        marginLeft: 4,
        lineHeight: RFValue(16),
    },
    privacyTitle: {
        fontSize: 28,
        marginBottom: 16,
    },
    info: {
        width: "92%",
        color: COLORS.Gray,
        fontSize: RFValue(11),
        lineHeight: RFValue(16),
        textAlign: "center",
        marginBottom: 8,
        includeFontPadding: true,
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
    profileLabel: {
        fontFamily: "InstrumentSansSemiBold",
        marginBottom: 6,
        marginTop: 10,
    },

    profileInput: {
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },

    disabledInput: {
        backgroundColor: "#F5F5F5",
        color: "#666",
    },
});

export default Welcome;

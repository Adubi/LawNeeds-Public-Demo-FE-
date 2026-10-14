import React, {useEffect, useRef, useState} from "react";
import {
    Animated,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {router} from "expo-router";
import {Feather, MaterialIcons} from "@expo/vector-icons";
import {SPACING} from "@/constants/theme";
import {Button} from "@/components/Button";
import {COLORS} from "@/constants/colors";
import {RFValue} from "react-native-responsive-fontsize";
import {widthPercentageToDP as wp} from "react-native-responsive-screen";
import {GooglePlacesAutocomplete} from "react-native-google-places-autocomplete";
import "react-native-get-random-values";
import CustomDatePicker from "@/components/DatePicker";
import CountryPicker from "@/components/CountryPicker";
import AuthServices from "@/services/AuthServices";
import {SafeAreaView} from "react-native-safe-area-context";
import {privacy_policy_url, standard_user_terms} from "@/services/httpservice";
import {useTranslation} from 'react-i18next';

interface PersonalInfo {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    country: string;
}

type SignupStep = "personal" | "address" | "account" | "success";

interface AddressInfo {
    postcode: string;
    address: string;
    city: string;
}

interface AccountInfo {
    username: string;
    email: string;
    password: string;
}

export default function Signup() {

    const {t} = useTranslation();

    const [currentStep] = useState<SignupStep>("personal");
    const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        country: "",
    });
    const [accountInfo, setAccountInfo] = useState<AccountInfo>({
        username: "",
        email: "",
        password: "",
    });
    const [addressInfo, setAddressInfo] = useState<AddressInfo>({
        postcode: "",
        city: "",
        address: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const successScale = useRef(new Animated.Value(0)).current;

    const [isModalVisible, setModalVisible] = useState<boolean>(false);
    const [isCountryModalVisible, setCountryModalVisible] = useState(false);

    // Add error handling state
    const [error, setError] = useState<string | null>(null);
    const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
    const snackbarOpacity = useRef(new Animated.Value(0)).current;

    const [termsModalVisible, setTermsModalVisible] = React.useState(false);
    const townRef = useRef<TextInput>(null);
    const postCodeRef = useRef<TextInput>(null);
    const addRef = useRef<TextInput>(null);

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

    // Hide the error snackbar
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

    // Clear error message function
    const clearErrorMessage = () => {
        setError(null);
        setShowErrorSnackbar(false);
    };

    const handleNext = () => {
        setError(null);

        if (!personalInfo.firstName.trim() || personalInfo.firstName.trim().length < 2) {
            setError(t('validation.valid_first_name'));
            return;
        }
        if (!personalInfo.lastName.trim() || personalInfo.lastName.trim().length < 2) {
            setError(t('validation.valid_last_name'));
            return;
        }
        if (!accountInfo.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountInfo.email)) {
            setError(t('validation.valid_email'));
            return;
        }
        if (!personalInfo.dateOfBirth) {
            setError(t('validation.select_dob'));
            return;
        }
        if (!accountInfo.password || accountInfo.password.length < 8 || !/\d/.test(accountInfo.password)) {
            setError(t('validation.valid_password'));
            return;
        }

        setTermsModalVisible(true);
    };

    const handleBack = () => router.back();

    const handleSignUp = async () => {
        try {
            if (isSubmitting) return;
            setIsSubmitting(true);
            // Clear any previous errors
            setError(null);

            if (!personalInfo.firstName || personalInfo.firstName.length < 2) {
                setError(t('validation.valid_first_name'));
                return;
            }
            if (!personalInfo.lastName || personalInfo.lastName.length < 2) {
                setError(t('validation.valid_last_name'));
                return;
            }
            if (!personalInfo.dateOfBirth) {
                setError(t('validation.select_dob'));
                return;
            }
            if (
                !accountInfo.email ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountInfo.email)
            ) {
                setError(t('validation.valid_email'));
                return;
            }
            if (
                !accountInfo.password ||
                accountInfo.password.length < 8 ||
                !/\d/.test(accountInfo.password)
            ) {
                setError(
                    t('validation.valid_password')
                );
                return;
            }

            const formData = new FormData();
            const [year, month, day] = personalInfo.dateOfBirth.split("-");
            formData.append("first_name", personalInfo.firstName.trim());
            formData.append("last_name", personalInfo.lastName.trim());
            formData.append("email", accountInfo.email.toLowerCase());
            formData.append("password", accountInfo.password);
            formData.append("day_of_birth", day);
            formData.append("month_of_birth", month);
            formData.append("year_of_birth", year);
            if (personalInfo.country) {
                formData.append("country", personalInfo.country);
            }

            // console.log("formData", formData)
            // **✅ If all validations pass, proceed with signup**
            const response: any = await AuthServices.Signup(formData);

            if (response?.email !== undefined && response?.message !== undefined) {
                setError(response?.message);
                router.push(`/(app)/verify-registration-otp?email=${response.email}`);
            }

        } catch (error: any) {
            setError(`Signup failed: ${error?.response?.data?.detail || t('error.error_msg')}`);
        } finally {
            setTermsModalVisible(false);
            setIsSubmitting(false);
        }
    };

    const handleDateChange = (date: string) => {
        // setSelectedDate(date);

        setPersonalInfo({...personalInfo, dateOfBirth: date});
    };

    const renderPersonalInfo = () => (
        <View style={styles.form}>
            <View style={{gap: 5}}>
                <Text style={styles.formLabel} allowFontScaling={false}>
                    {t('create_account.first_name')}
                </Text>
                <TextInput
                    style={styles.formField}
                    value={personalInfo.firstName}
                    onChangeText={(text: string) =>
                        setPersonalInfo({...personalInfo, firstName: text})
                    }
                    allowFontScaling={false}
                />
            </View>

            <View style={{gap: 5}}>
                <Text style={styles.formLabel} allowFontScaling={false}>
                    {t('create_account.last_name')}
                </Text>
                <TextInput
                    style={styles.formField}
                    value={personalInfo.lastName}
                    onChangeText={(text: string) =>
                        setPersonalInfo({...personalInfo, lastName: text})
                    }
                    allowFontScaling={false}
                />
            </View>

            <View style={{gap: 5}}>
                <Text style={styles.formLabel} allowFontScaling={false}>
                    {t('email')}
                </Text>
                <TextInput
                    style={styles.formField}
                    value={accountInfo.email}
                    onChangeText={(text: string) =>
                        setAccountInfo({...accountInfo, email: text})
                    }
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="emailAddress"
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
                        style={styles.passwordInput}
                        value={accountInfo.password}
                        onChangeText={(text: string) =>
                            setAccountInfo({...accountInfo, password: text})
                        }
                        secureTextEntry={!showPassword}
                        textContentType="newPassword"
                        autoComplete="new-password"
                        allowFontScaling={false}
                    />
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.passwordToggle}
                    >
                        <Feather
                            name={showPassword ? "eye" : "eye-off"}
                            size={wp(5)}
                            color={COLORS.Gray}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.row}>
                <View style={styles.halfWidth}>
                    <View style={{gap: 5}}>
                        <Text style={styles.formLabel} allowFontScaling={false}>
                            {t('create_account.date_of_birth')}
                        </Text>

                        <TouchableOpacity onPress={() => setModalVisible(true)}>
                            <View style={styles.formField}>
                                <Text style={styles.dateOfBirth}>
                                    {personalInfo.dateOfBirth || t('select_date')}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <CustomDatePicker
                            minAgeLimit={18}
                            onDateSelected={handleDateChange}
                            setModalVisible={setModalVisible}
                            isModalVisible={isModalVisible}
                        />
                    </View>
                </View>
                <View style={styles.halfWidth}>
                    <View style={{gap: 5}}>
                        <Text style={styles.formLabel} allowFontScaling={false}>
                            {t('create_account.country')} ({t('optional', {defaultValue: 'Optional'})})
                        </Text>
                        <TouchableOpacity onPress={() => setCountryModalVisible(true)}>
                            <View style={styles.formField}>
                                <Text style={styles.dateOfBirth}>
                                    {personalInfo.country || t('create_account.select_country')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                        <CountryPicker
                            isVisible={isCountryModalVisible}
                            onClose={() => setCountryModalVisible(false)}
                            onSelectCountry={(selectedCountry) =>
                                setPersonalInfo({...personalInfo, country: selectedCountry})
                            }
                        />
                    </View>
                </View>
            </View>
        </View>
    );

    const renderTermsModel = () => {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={termsModalVisible}
                onRequestClose={() => {
                    setTermsModalVisible(false);
                }}
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
                        {/* Title */}
                        <Text style={styles.termsTitle}>{t('create_account.please_agree_text')}</Text>

                        {/* Close Button */}
                        <TouchableOpacity
                            style={[styles.row, {position: 'absolute', top: 20, end: 20}]}
                            onPress={() => {
                                setTermsModalVisible(false);
                            }}
                        >
                            <Image source={require("../../assets/images/close.png")}/>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={[styles.bottomDivider, {marginTop: 20}]}/>

                        {/* Clickable Terms Text */}
                        <Text style={[styles.termsText, {textAlign: 'center', marginTop: 20}]}>
                            {t('create_account.signup_agreement_text')}{' '}
                            <Text
                                style={styles.linkText}
                                onPress={() => {
                                    setTermsModalVisible(false);
                                    // router.navigate("/(app)/terms-and-privacy")
                                    router.push(`/(app)/terms-and-privacy?terms_endpoint=${standard_user_terms}`);
                                }}
                            >
                                {t('create_account.terms_of_service')}
                            </Text>{' '}
                            {t('create_account.and_text')}{' '}
                            <Text
                                style={styles.linkText}
                                onPress={() => {
                                    setTermsModalVisible(false);
                                    // router.navigate("/(app)/terms-and-privacy")
                                    router.push(`/(app)/terms-and-privacy?terms_endpoint=${privacy_policy_url}`);
                                }
                                }
                            >
                                {t('privacy_policy')}
                            </Text>.
                        </Text>

                        {/* Agree Button */}
                        <Button
                            title={t('create_account.agree_proceed_button')}
                            disabled={isSubmitting}
                            loading={isSubmitting}
                            onPress={handleSignUp}
                            variant="primary"
                            style={{marginTop: 40, marginBottom: 50}}
                        />
                    </View>
                </View>
            </Modal>
        );
    };


    const renderAddressInfo = () => (
        <View style={styles.form}>
            {/*Google auto search address*/}
            <View style={{gap: 5, zIndex: 10, elevation: 10}}>

                <Text style={styles.formLabel} allowFontScaling={false}>
                    {t('create_account.searchAddress')}
                </Text>

                <View style={styles.googlePlacesContainer}>
                    <GooglePlacesAutocomplete
                        placeholder={t('create_account.searchAddress')}
                        fetchDetails={true}
                        onPress={(data, details = null) => {
                            const addressComponents = details?.address_components || [];
                            let city = '';
                            let country = '';
                            let postalCode = '';

                            addressComponents.forEach(component => {
                                if (component.types.includes('locality')) {
                                    city = component.long_name;
                                } else if (component.types.includes('administrative_area_level_2') && !city) {
                                    city = component.long_name;
                                } else if (component.types.includes('postal_town') && !city) {
                                    city = component.long_name;
                                }

                                if (component.types.includes('country')) {
                                    country = component.long_name;
                                }

                                if (component.types.includes('postal_code')) {
                                    postalCode = component.long_name;
                                }
                            });
                            const formatted = details?.formatted_address || data.description;
                            setAddressInfo({...addressInfo, address: formatted, city: city, postcode: postalCode});
                        }}
                        query={{
                            key: "REPLACE_WITH_GOOGLE_API_KEY",
                            language: "en",
                        }}
                        debounce={300}
                        enablePoweredByContainer={false}
                        styles={{
                            container: {
                                flex: 0,
                                position: "relative",
                                zIndex: 9999,
                                overflow: "visible",
                            },
                            textInput: {
                                borderWidth: 1,
                                borderRadius: wp(100),
                                paddingHorizontal: "5%",
                                backgroundColor: COLORS.BackgroundColor,
                                fontFamily: "InstrumentSansSemiBold",
                                fontSize: RFValue(14),
                                height: wp(13),
                                overflow: "hidden",
                            },
                            listView: {
                                position: "absolute",
                                top: 50,
                                left: 0,
                                right: 0,
                                zIndex: 9999,
                                elevation: 10,
                                backgroundColor: "#000000",
                            },
                            row: {
                                backgroundColor: COLORS.BackgroundColor,
                            },
                            description: {
                                color: COLORS.Black,
                                fontFamily: "InstrumentSansRegular",
                            },
                            separator: {
                                height: 1,
                                backgroundColor: "#e0e0e0",
                            },
                            predefinedPlacesDescription: {
                                color: COLORS.PrimaryColor,
                            },
                        }}
                    />
                </View>
            </View>

            {/*Separate address field*/}
            <View style={{gap: 5}}>
                <Text style={styles.formLabel} allowFontScaling={false}>
                    {t('create_account.town')}
                </Text>
                <TextInput
                    ref={townRef}
                    style={styles.formField}
                    value={addressInfo.city}
                    returnKeyType="next"
                    onSubmitEditing={() => postCodeRef.current?.focus()}
                    onChangeText={(text: string) =>
                        setAddressInfo({...addressInfo, city: text})
                    }
                    allowFontScaling={false}
                />
            </View>
            <View style={{gap: 5}}>
                <Text style={styles.formLabel} allowFontScaling={false}>
                    {t('create_account.postcode')}
                </Text>
                <TextInput
                    ref={postCodeRef}
                    style={styles.formField}
                    maxLength={8}
                    value={addressInfo.postcode}
                    returnKeyType="next"
                    onSubmitEditing={() => addRef.current?.focus()}
                    onChangeText={(text: string) =>
                        setAddressInfo({...addressInfo, postcode: text})
                    }
                    allowFontScaling={false}
                />
            </View>
            <View style={{gap: 5}}>
                <Text style={styles.formLabel} allowFontScaling={false}>
                    {t('create_account.address')}
                </Text>
                <TextInput
                    ref={addRef}
                    style={styles.formField}
                    value={addressInfo.address}
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                    onChangeText={(text: string) =>
                        setAddressInfo({...addressInfo, address: text})
                    }
                    allowFontScaling={false}
                />
            </View>
        </View>
    );

    const renderAccountInfo = () => (
        <View style={styles.form}>
            <View style={{gap: 5}}>
                <Text style={styles.formLabel} allowFontScaling={false}>
                    {t('user_name')}
                </Text>
                <TextInput
                    style={styles.formField}
                    value={accountInfo.username}
                    onChangeText={(text: string) =>
                        setAccountInfo({...accountInfo, username: text})
                    }
                    allowFontScaling={false}
                />
            </View>
            <View style={{gap: 5}}>
                <Text style={styles.formLabel} allowFontScaling={false}>
                    {t('email')}
                </Text>
                <TextInput
                    style={styles.formField}
                    value={accountInfo.email}
                    onChangeText={(text: string) =>
                        setAccountInfo({...accountInfo, email: text})
                    }
                    allowFontScaling={false}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
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
                        value={accountInfo.password}
                        onChangeText={(text: string) =>
                            setAccountInfo({...accountInfo, password: text})
                        }
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
                            paddingHorizontal: 10,
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
        </View>
    );

    const renderSuccess = () => (
        <View style={styles.successContainer}>
            <Animated.View
                style={[styles.successIcon, {transform: [{scale: successScale}]}]}
            >
                <Feather name="check" size={40} color={COLORS.PrimaryColor}/>
            </Animated.View>
            <Text style={styles.successTitle} allowFontScaling={false}>
                {t('create_account.account_creat_success')}
            </Text>
            <Text style={styles.successText} allowFontScaling={false}>
                {t('create_account.access_detail_msg_legal_assistance')}
            </Text>
            <Button
                title={t('chat.get_started')}
                onPress={() => {

                    router.replace("/(app)/login")
                }}
                style={styles.getStartedButton}
            />
        </View>
    );

    return (
        <SafeAreaView
            style={[styles.container, {backgroundColor: COLORS.BackgroundColor}]}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{flex: 1}}
                keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
                    keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.headerContainer}>
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <MaterialIcons name="arrow-back-ios" size={24} color={COLORS.PrimaryColor}/>
                        </TouchableOpacity>

                        <Text style={styles.title} allowFontScaling={false}>
                            {t('create_account.create_account')}
                        </Text>
                    </View>

                    <View style={{marginTop: SPACING.xxxl}}>
                        {renderPersonalInfo()}
                    </View>

                    <View>
                        <Button
                            title={t('create_account.create_account')}
                            disabled={isSubmitting}
                            onPress={handleNext}
                            style={styles.nextButton}
                            variant="secondary"
                        />
                    </View>
                </ScrollView>

                {/* Error Snackbar - Moved outside ScrollView to stay above keyboard */}
                {showErrorSnackbar && (
                    <Animated.View style={[styles.snackbar, {opacity: snackbarOpacity}]}>
                        <Text style={styles.snackbarText}>{error}</Text>
                        <TouchableOpacity onPress={hideErrorSnackbar}>
                            <Feather name="x" size={20} color="#FFF"/>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </KeyboardAvoidingView>

            {renderTermsModel()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        backgroundColor: COLORS.BackgroundColor,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: SPACING.xxxl,
    },
    dateOfBirth: {
        padding: 15,
        fontSize: RFValue(12),
        fontFamily: "InstrumentSansSemiBold",
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
    title: {
        color: COLORS.PrimaryColor,
        textAlign: "center",
        fontSize: RFValue(22),
        fontFamily: "InstrumentSansSemiBold",
    },
    termsTitle: {
        color: COLORS.PrimaryColor,
        textAlign: "center",
        fontSize: RFValue(16),
        fontFamily: "InstrumentSansSemiBold",
    },
    termsText: {
        fontFamily: "InstrumentSansRegular",
        fontSize: RFValue(14),
    },
    linkText: {
        textDecorationLine: 'underline',
        color: COLORS.PrimaryColor, // or any link color you want
    },
    bottomDivider: {
        width: "100%",
        height: 1,
        backgroundColor: "#C0C0C0",
        marginBottom: 5
    },
    form: {
        gap: SPACING.lg,
    },
    passwordInput: {
        width: "100%",
        height: "100%",
        paddingRight: 48,
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
    },
    passwordToggle: {
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        minWidth: 48,
        justifyContent: "center",
        alignItems: "center",
    },
    row: {
        flexDirection: "row",
        gap: SPACING.md,
    },
    halfWidth: {
        flex: 1,
    },
    nextButton: {
        marginTop: SPACING.xl,
    },
    socialContainer: {
        marginTop: "auto",
        justifyContent: "center",
        alignItems: "center",
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: SPACING.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.Gray,
    },
    dividerText: {
        marginHorizontal: SPACING.md,
        color: COLORS.PrimaryColor,
        fontFamily: "InstrumentSansRegular",
    },
    socialButtons: {
        flexDirection: "row",
        justifyContent: "center",
        gap: SPACING.xl,
    },
    socialButton: {
        width: wp(8),
        height: wp(8),
        resizeMode: "contain",
    },
    loginPrompt: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: SPACING.lg,
    },
    loginText: {
        color: COLORS.PrimaryColor,
        fontFamily: "InstrumentSansRegular",
    },
    loginLink: {
        color: COLORS.PrimaryColor,
        fontFamily: "InstrumentSansSemiBold",
    },
    successContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.PrimaryColor,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: SPACING.xl,
    },
    successTitle: {
        fontSize: 24,
        fontFamily: "InstrumentSansSemiBold",
        color: COLORS.PrimaryColor,
        marginBottom: SPACING.md,
        textAlign: "center",
    },
    successText: {
        fontSize: 16,
        fontFamily: "InstrumentSansRegular",
        color: COLORS.PrimaryColor,
        textAlign: "center",
        marginBottom: SPACING.xl,
    },
    getStartedButton: {
        width: "100%",
        paddingHorizontal: "4%",
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
    formLabel: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
        color: COLORS.PrimaryColor,
    },
    googlePlacesContainer: {
        position: 'relative',
        zIndex: 1000, // Higher than the fields below it
        elevation: 1000,
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

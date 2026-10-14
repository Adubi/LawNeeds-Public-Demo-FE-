import {
    ActivityIndicator,
    Animated,
    FlatList,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import React, {useEffect, useRef, useState} from "react";
import {RFValue} from "react-native-responsive-fontsize";
import {COLORS} from "@/constants/colors";
import {SPACING} from "@/constants/theme";
import {Feather, MaterialIcons} from "@expo/vector-icons";
import {Button} from "@/components/Button";
import {widthPercentageToDP as wp} from "react-native-responsive-screen";

import {router} from "expo-router";
import {SafeAreaView} from "react-native-safe-area-context";
import CustomDatePicker from "@/components/DatePicker";
import {Checkbox} from "@/components/Checkbox";
import CountryPicker from "@/components/CountryPicker";
import * as ImagePicker from "expo-image-picker";
import AuthServices from "@/services/AuthServices";
import {GooglePlacesAutocomplete} from "react-native-google-places-autocomplete";
import {a2j_partner_terms, privacy_policy_url} from "@/services/httpservice";
import {useTranslation} from 'react-i18next';

type SignupStep =
    | "personal"
    | "terms"
    | "address"
    | "expertise"
    | "account"
    | "profile"
    | "success";

interface PersonalInfo {
    organisationName: string;
    dob: string;
    country: string;
}

interface AddressInfo {
    postcode: string;
    address: string;
    town: string;
    option: "Legal Aid Organisation" | "Law Centre" | "Pro-Bono Clinic";
}

interface AreaOption {
    id: number;
    key: string;
    label: string;
}

interface ExpertiseInfo {
    areaOfLegalFocus: AreaOption[];
    contactPerson: string;
    registrationNumber: string;
}

interface AccountInfo {
    username: string;
    email: string;
    password: string;
}

interface DocumentInfo {
    uri: string;
    name: string | null | undefined;
    type: string;
}

export default function SignupProA2jPartner() {

    const {t} = useTranslation();


    const [step, setStep] = useState<SignupStep>("personal");
    const [showPassword, setShowPassword] = useState(false);
    const [isCountryModalVisible, setCountryModalVisible] = useState(false);
    const [termsModalVisible, setTermsModalVisible] = React.useState(false);

    // Separate state for each step
    const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
        organisationName: "",
        dob: "",
        country: "",
    });

    const [addressInfo, setAddressInfo] = useState<AddressInfo>({
        town: "",
        postcode: "",
        address: "",
        option: "Legal Aid Organisation",
    });

    const [expertiseInfo, setExpertiseInfo] = useState<ExpertiseInfo>({
        areaOfLegalFocus: [],
        contactPerson: "",
        registrationNumber: "",
    });

    const [accountInfo, setAccountInfo] = useState<AccountInfo>({
        username: "",
        email: "",
        password: "",
    });

    const [profilePhoto, setProfilePhoto] = useState<DocumentInfo>(
        {
            type: "",
            name: "",
            uri: "",
        }
    );
    const [nextDisable, setNextDisable] = useState(false)
    const [isModalVisible, setModalVisible] = useState<boolean>(false);
    const [areaModalVisible, setAreaModalVisible] = useState(false);
    const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false);

    const orgNameRef = useRef<TextInput>(null);
    const dobRef = useRef<TextInput>(null);
    const townRef = useRef<TextInput>(null);
    const postCodeRef = useRef<TextInput>(null);
    const addRef = useRef<TextInput>(null);
    const contactRef = useRef<TextInput>(null);
    const registrationNoRef = useRef<TextInput>(null);
    const userNameRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const snackbarOpacity = useRef(new Animated.Value(0)).current;

    const areaOptions: AreaOption[] = t('expertiseOptions', {returnObjects: true}) as any[];

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

    useEffect(() => {
        const isEmpty = (val: string) => val.trim() === "";

        let flag = false;
        switch (step) {
            case "personal":
                flag = [
                    personalInfo.organisationName,
                    personalInfo.dob,
                    personalInfo.country,
                ].some(isEmpty);
                break;

            case "address":
                flag = [
                    addressInfo.town,
                    addressInfo.postcode,
                    addressInfo.address,

                ].some(isEmpty);
                break;

            case "expertise":
                flag = (
                    expertiseInfo.areaOfLegalFocus.length === 0 ||
                    isEmpty(expertiseInfo.contactPerson) ||
                    isEmpty(expertiseInfo.registrationNumber)
                );
                break;

            case "account":
                flag = [
                    accountInfo.username,
                    accountInfo.email,
                    accountInfo.password,
                ].some(isEmpty);
                break;

            case "profile":
                flag = isEmpty(profilePhoto.uri) ||
                    isEmpty(profilePhoto.type)
                break;
        }

        setNextDisable(flag);
    }, [personalInfo, addressInfo, expertiseInfo, accountInfo, profilePhoto, step]);

    // Function to move to the next step
    const nextStep = () => {
        const steps: SignupStep[] = [
            "personal",
            "terms",
            "address",
            "expertise",
            "account",
            "profile",
            "success",
        ];

        const currentIndex = steps.indexOf(step);
        if (step === 'personal') {

            setError(null);
            if (!personalInfo.organisationName || personalInfo.organisationName.length < 2) {
                setError(t('validation.valid_organisation'));
                return;
            }

            if (!personalInfo.dob) {
                setError(t('validation.select_dob'));
                return;
            }
            if (!personalInfo.country) {
                setError(t('validation.select_country'));
                return;
            }


            // setCurrentStep("address");
        }else if(step === 'address'){


        // Clear any previous errors
        setError(null);

        if (!addressInfo.town) {
            setError(t('validation.valid_town'));
            return;
        }
        if (!addressInfo.postcode) {
            setError(t('validation.enter_postcode'));
            return;
        }
        if (!addressInfo.address) {
            setError(t('validation.enter_address'));
            return;
        }


        } else if(step === "account") {
            // Clear any previous errors
            setError(null);

            if (!accountInfo.username || accountInfo.username.length < 3) {
                setError(t('validation.valid_user_name'));
                return;
            }
            if (
                !accountInfo.email ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountInfo.email)
            ) {
                setError(t('validation.enter_your_email'));
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


        }
        if (currentIndex === 0) {
            setTermsModalVisible(true)
        } else {
            setTermsModalVisible(false)
        }

        if (currentIndex < steps.length - 1) {
            setStep(steps[currentIndex + 1]);
        }
    };

    // Function to move to the previous step
    const prevStep = () => {
        const steps: SignupStep[] = [
            "personal",
            "terms",
            "address",
            "expertise",
            "account",
            "profile",
            "success",
        ];
        const currentIndex = steps.indexOf(step);

        if (currentIndex > 0) {
            // if (step === 'address') {
            //     setStep(steps[currentIndex - 2]);
            // }else {
            //
            // }
            setStep(steps[currentIndex - 1]);

        }
    };

    const handleDateChange = (date: string) => {
        setPersonalInfo({...personalInfo, dob: date});
    };

    const toggleArea = (area: AreaOption) => {
        const current = expertiseInfo.areaOfLegalFocus;
        const exists = current.some(a => a.key === area.key);

        const updated = exists
            ? current.filter(a => a.key !== area.key)
            : current.length < 2
                ? [...current, area]
                : current;

        setExpertiseInfo({...expertiseInfo, areaOfLegalFocus: updated});
    };


    const pickProfile = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            alert(t('per.camera_roll'));
            return;
        }

        const {assets, canceled} = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!canceled && assets && assets.length > 0) {
            const obj = assets[0]
            setProfilePhoto({
                uri: obj.uri,
                name: obj.fileName,
                type: obj.type || ""
            })
        }
    };

    const handleCreateAccount = async () => {
        try {
            setIsLoading(true)
            const formattedDate = personalInfo.dob.split("-");

            const formData = new FormData();
            formData.append("professional_type", "A2J Partners");
            formData.append("organisation_name", personalInfo.organisationName);
            formData.append("country", personalInfo.country);
            formData.append("day_of_establishment", formattedDate[2] || "");
            formData.append("month_of_establishment", formattedDate[1] || "");
            formData.append("year_of_establishment", formattedDate[0] || "");
            formData.append("town_city", addressInfo.town);
            formData.append("address", addressInfo.address);
            formData.append("postcode", addressInfo.postcode);
            formData.append("organisation_type", addressInfo.option);

            const legalExpertiseValues = expertiseInfo.areaOfLegalFocus.map(option => option.label).join(',');
            const legalExpertiseIdsValues = expertiseInfo.areaOfLegalFocus.map(option => option.id).join(',');
            formData.append("areas_of_legal_focus", legalExpertiseValues);
            formData.append("areas_of_legal_focus_ids", legalExpertiseIdsValues);

            formData.append("registration_charity_number", expertiseInfo.registrationNumber);
            formData.append("contact_person", expertiseInfo.contactPerson);
            formData.append("user_name", accountInfo.username);
            formData.append("email", accountInfo.email.toLowerCase());
            formData.append("password", accountInfo.password);

            const response = await AuthServices.SignupPro(formData); // Axios call

          //  console.log("Create account response:", response)
            if (response?.email !== undefined && response?.message !== undefined) {
                setIsLoading(false);
                //Registration completed, open verify otp screen
                await handleSuccessSignUp(response?.email)
            }else {
                setIsLoading(false);
                setError(t('error.invalid_response_token_not_found'));
            }

        } catch (e: any) {
          //  console.log("A2J create create error:", e);
            const errorDetail = e?.response?.data?.detail;
            let message = t('error.error_msg');

            if (Array.isArray(errorDetail)) {
                message = errorDetail[0]?.msg ?? message;
            } else if (typeof errorDetail === "string") {
                message = errorDetail;
            }
           // console.log("A2J create error message:", message);

            setError(message);
            setIsLoading(false)
        }
    };

    const handleSuccessSignUp = async (email: any) => {
        try {
            const localUri = profilePhoto.uri;
            const filename = localUri.split("/").pop();
            const match = /\.(\w+)$/.exec(filename || "");
            const type = match ? `image/${match[1]}` : "image";

            // const formData = new FormData();
            // formData.append("file", {uri: localUri, name: filename, type} as any);

            // console.log("Profile payload passed success:", localUri);
            router.push(`/(app)/verify-registration-otp?email=${email}&localUri=${localUri}&filename=${filename}&type=${type}`);

        } catch (e: any) {
            console.log("createProfile error:", e);
        }
    }

   /* const createProfile = async () => {
        try {
            const localUri = profilePhoto.uri;
            const filename = localUri.split("/").pop();
            const match = /\.(\w+)$/.exec(filename || "");
            const type = match ? `image/${match[1]}` : "image";

            const formData = new FormData();
            formData.append("file", {uri: localUri, name: filename, type} as any);

            const response = await UserServices.UpdateProfilePic(formData)
            console.log("createProfile response:", JSON.stringify(response));
        } catch (e) {
            console.log("createProfile error:", e?.response?.data?.detail);
        }
    }*/

    const renderPersonalInfo = () => (
        <View style={styles.form}>

            <View style={{gap: 5}}>
                <Text style={styles.formLabel} allowFontScaling={false}>
                    {t('create_account.organisation_name')}
                </Text>
                <TextInput
                    ref={orgNameRef}
                    style={styles.formField}
                    value={personalInfo.organisationName}
                    returnKeyType='done'
                    onSubmitEditing={() => Keyboard.dismiss()}
                    onChangeText={(text: string) =>
                        setPersonalInfo({...personalInfo, organisationName: text})
                    }
                    allowFontScaling={false}
                />
            </View>


            <View style={{gap: 5}}>
                <Text style={styles.formLabel} allowFontScaling={false}>
                    {t('create_account.date_of_establishment')}
                </Text>
                <Pressable
                    onPress={() => {
                      //  console.log("Date field pressed");
                        setModalVisible(true);
                    }}
                >
                    <TextInput
                        ref={dobRef}
                        style={[styles.formField, {paddingHorizontal: 16}]}
                        value={personalInfo.dob || t('select_date')}
                        editable={false}
                        pointerEvents="none" // This prevents the TextInput from intercepting touches
                    />
                </Pressable>

                <CustomDatePicker
                    minAgeLimit={18}
                    onDateSelected={
                        (date) => {
                            handleDateChange(date)
                        }
                    }
                    setModalVisible={setModalVisible}
                    isModalVisible={isModalVisible}
                />
            </View>
            <View style={{gap: 5}}>
                <Text style={styles.formLabel} allowFontScaling={false}>
                    {t('create_account.country')}
                </Text>
                <TouchableOpacity onPress={() => setCountryModalVisible(true)}>
                    <View style={[styles.formField, {justifyContent: 'center', paddingHorizontal: 16}]}>
                        <Text style={styles.countyInput}>
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
    )

    const renderTermsModel = () => {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={termsModalVisible}
                onRequestClose={() => {
                    prevStep();
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
                            style={[styles.row, { position: 'absolute', top: 20, end: 20 }]}
                            onPress={() => {
                                prevStep();
                                setTermsModalVisible(false);
                            }}
                        >
                            <Image source={require("../../assets/images/close.png")} />
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={[styles.bottomDivider, { marginTop: 20 }]} />

                        {/* Clickable Terms Text */}
                        <Text style={[styles.termsText, { textAlign: 'center', marginTop: 20 }]}>
                            {t('create_account.signup_agreement_text')}{' '}
                            <Text
                                style={styles.linkText}
                                onPress={() => {
                                    setTermsModalVisible(false);
                                    // router.navigate("/(app)/terms-and-privacy")
                                    router.push(`/(app)/terms-and-privacy?terms_endpoint=${a2j_partner_terms}`);
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
                            onPress={() => nextStep()}
                            variant="primary"
                            style={{ marginTop: 40, marginBottom: 50 }}
                        />
                    </View>
                </View>
            </Modal>
        );
    };

    const renderAddressInfo = () => {
        return (
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
                             //   console.log(city, country, postalCode);
                                const formatted = details?.formatted_address || data.description;
                                setAddressInfo({ ...addressInfo, address: formatted, town: city, postcode: postalCode });
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
                        value={addressInfo.town}
                        returnKeyType='next'
                        onSubmitEditing={() => postCodeRef.current?.focus()}
                        onChangeText={(text: string) =>
                            setAddressInfo({...addressInfo, town: text})
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
                        value={addressInfo.postcode}
                        returnKeyType='next'
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
                        returnKeyType='done'
                        onSubmitEditing={() => Keyboard.dismiss()}
                        onChangeText={(text: string) =>
                            setAddressInfo({...addressInfo, address: text})
                        }
                        allowFontScaling={false}
                    />
                </View>
                <Text allowFontScaling={false}>{t('create_account.please_select')}</Text>
                <View style={{gap: 5}}>
                    <TouchableOpacity
                        onPress={() => setAddressInfo((prev) => ({...prev, option: "Legal Aid Organisation"}))}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginRight: 20,
                        }}
                    >
                        <View
                            style={{
                                width: wp(5.5),
                                height: wp(5.5),
                                borderRadius: wp(100),
                                borderWidth: 2,
                                borderColor: COLORS.PrimaryColor,
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 5,
                            }}
                        >
                            {addressInfo.option === "Legal Aid Organisation" && (
                                <View
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: 6,
                                        backgroundColor: COLORS.PrimaryColor,
                                    }}
                                />
                            )}
                        </View>
                        <Text
                            allowFontScaling={false}
                            style={{
                                fontFamily: "InstrumentSansBold",
                                fontSize: RFValue(12),
                                color: COLORS.PrimaryColor,
                            }}
                        >
                            {t('legal_aid_organisation')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setAddressInfo((prev) => ({...prev, option: "Law Centre"}))}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        <View
                            style={{
                                width: wp(5.5),
                                height: wp(5.5),
                                borderRadius: wp(100),
                                borderWidth: 2,
                                borderColor: COLORS.PrimaryColor,
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 5,
                            }}
                        >
                            {addressInfo.option === "Law Centre" && (
                                <View
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: 6,
                                        backgroundColor: COLORS.PrimaryColor,
                                    }}
                                />
                            )}
                        </View>
                        <Text
                            allowFontScaling={false}
                            style={{
                                fontFamily: "InstrumentSansBold",
                                fontSize: RFValue(12),
                                color: COLORS.PrimaryColor,
                            }}
                        >
                            {t('law_centre')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setAddressInfo((prev) => ({...prev, option: "Pro-Bono Clinic"}))}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        <View
                            style={{
                                width: wp(5.5),
                                height: wp(5.5),
                                borderRadius: wp(100),
                                borderWidth: 2,
                                borderColor: COLORS.PrimaryColor,
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 5,
                            }}
                        >
                            {addressInfo.option === "Pro-Bono Clinic" && (
                                <View
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: 6,
                                        backgroundColor: COLORS.PrimaryColor,
                                    }}
                                />
                            )}
                        </View>
                        <Text
                            allowFontScaling={false}
                            style={{
                                fontFamily: "InstrumentSansBold",
                                fontSize: RFValue(12),
                                color: COLORS.PrimaryColor,
                            }}
                        >
                            {t('create_account.proBonoClinic')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    };

    const renderExpertiseInfo = () => (
        <View style={styles.form}>
            <View style={{gap: 5}}>
                <Text style={styles.formLabel} allowFontScaling={false}>
                    Areas of legal focus
                </Text>
                <TouchableOpacity
                    style={[styles.formField, {justifyContent: 'center'}]}
                    onPress={() => {
                        setAreaModalVisible(true)
                    }}
                >
                    <Text style={{
                        fontFamily: "InstrumentSansSemiBold",
                        fontSize: RFValue(14),
                    }}>
                        {expertiseInfo.areaOfLegalFocus.map(option => option.label).join(', ') || t('create_account.selectAreasOfLegalFocus')}
                    </Text>
                </TouchableOpacity>

                <Text style={styles.limitText}>{t('profile.max_of_two')}</Text>

                {renderAreaModal()}
            </View>
            <View style={{gap: 5}}>
                <Text style={styles.formLabel} allowFontScaling={false}>
                    {t('create_account.contactPerson')}
                </Text>
                <TextInput
                    ref={contactRef}
                    style={styles.formField}
                    value={expertiseInfo.contactPerson}
                    returnKeyType='next'
                    onSubmitEditing={() => registrationNoRef.current?.focus()}
                    onChangeText={(text: string) =>
                        setExpertiseInfo({...expertiseInfo, contactPerson: text})
                    }
                    allowFontScaling={false}
                />
            </View>

            <View style={{gap: 5}}>
                <Text style={styles.formLabel} allowFontScaling={false}>
                    {t('create_account.registrationCharityNumber')}
                </Text>
                <TextInput
                    ref={registrationNoRef}
                    style={styles.formField}
                    value={expertiseInfo.registrationNumber}
                    returnKeyType='done'
                    onSubmitEditing={() => Keyboard.dismiss()}
                    onChangeText={(text: string) =>
                        setExpertiseInfo({...expertiseInfo, registrationNumber: text})
                    }
                    allowFontScaling={false}
                />
            </View>
        </View>
    );

    const renderProfileImageUpload = () => (
        <View style={styles.form}>
            <View style={{justifyContent: "center", alignItems: "center"}}>
                <Image
                    source={profilePhoto.uri !== "" ? {uri: profilePhoto.uri} : require("@/assets/images/imapgeUpload.png")}
                    style={{
                        width: wp(37),
                        height: wp(37),
                        borderRadius: wp(37) / 2,
                        overflow: "hidden",
                    }}
                    resizeMode="contain"
                />
                <View
                    style={{
                        padding: SPACING.sm,
                        justifyContent: "center",
                        alignItems: "center",
                        width: "100%",
                    }}
                >
                    <Text
                        allowFontScaling={false}
                        style={{
                            fontFamily: "InstrumentSansSemiBold",
                            fontSize: RFValue(14),
                            color: COLORS.PrimaryColor,
                        }}
                    >
                        {t('create_account.profile_photo')}
                    </Text>
                    <Text
                        allowFontScaling={false}
                        style={{
                            fontFamily: "InstrumentSansSemiBold",
                            fontSize: RFValue(12),
                            color: COLORS.Gray,
                            textAlign: "center",
                            width: "100%",
                        }}
                    >
                        {t('create_account.profile_photo_required')}
                    </Text>
                </View>
                <TouchableOpacity
                    style={{borderWidth: 1, padding: SPACING.sm, borderRadius: wp(3)}}
                    onPress={pickProfile}
                >
                    <Text
                        allowFontScaling={false}
                        style={{
                            fontFamily: "InstrumentSansSemiBold",
                            fontSize: RFValue(12),
                            color: COLORS.Gray,
                            textAlign: "center",
                            width: "100%",
                        }}
                    >
                        {t('create_account.upload')}
                    </Text>
                </TouchableOpacity>
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
                    ref={userNameRef}
                    style={styles.formField}
                    value={accountInfo.username}
                    returnKeyType='next'
                    onSubmitEditing={() => emailRef.current?.focus()}
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
                    ref={emailRef}
                    style={styles.formField}
                    value={accountInfo.email}
                    returnKeyType='next'
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    onChangeText={(text: string) =>
                        setAccountInfo({...accountInfo, email: text})
                    }
                    allowFontScaling={false}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>
            <View style={{gap: 5}}>
                <Text style={styles.formLabel} allowFontScaling={false}>
                    {t('login.password')}
                </Text>
                <View style={[styles.formField, {position: "relative"}]}>
                    <TextInput
                        ref={passwordRef}
                        style={{
                            width: "100%",
                            height: "100%",
                            fontFamily: "InstrumentSansSemiBold",
                            fontSize: RFValue(14),
                        }}
                        returnKeyType='done'
                        onSubmitEditing={() => Keyboard.dismiss()}
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
        </View>
    );

    const renderAreaModal = () => (
        <Modal visible={areaModalVisible} transparent animationType="slide">
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>{t('profile.areas_of_legal_focus')}</Text>
                    {/*<View style={styles.bottomDivider}/>*/}
                    <FlatList
                        data={areaOptions}
                        keyExtractor={(item) => item.key}
                        renderItem={({item}) => (
                            <View style={{padding: 10}}>
                                <Checkbox
                                    checked={expertiseInfo.areaOfLegalFocus.some(a => a.key === item.key)}
                                    onCheck={() => {
                                        toggleArea(item);
                                    }}
                                    label={item.label}
                                />
                            </View>
                        )}
                    />

                    <Button
                        title={t('done')}
                        onPress={() => setAreaModalVisible(false)}
                        style={{marginTop: 5}}
                    />
                </View>
            </View>
        </Modal>
    )

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{flex: 1}}
            >

                <View style={styles.headerContainer}>
                    {step !== "success" && (
                        <TouchableOpacity
                            onPress={() => {
                                if (step === "personal") {
                                    router.back();
                                } else {
                                    prevStep();
                                }
                            }}
                            style={styles.backButton}
                        >
                            <MaterialIcons name="arrow-back-ios" size={24} color={COLORS.PrimaryColor}/>
                        </TouchableOpacity>
                    )}

                    {step !== "success" && (
                        <Text style={styles.title} allowFontScaling={false}>
                            {t('create_account.a2j_partners_account')}
                        </Text>
                    )}
                </View>

                <ScrollView
                    contentContainerStyle={{flexGrow: 1}}
                    keyboardDismissMode="interactive"
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={{marginTop: SPACING.xxxl}}>
                        {(step === "personal" || step === "terms") && renderPersonalInfo()}
                        {step === "address" && renderAddressInfo()}
                        {step === "expertise" && renderExpertiseInfo()}
                        {step === "account" && renderAccountInfo()}
                        {step === "profile" && renderProfileImageUpload()}
                        {/*{step === "success" && renderSuccess()}*/}
                    </View>

                    {step !== "success" && (
                        <>
                            <Button
                                title={step === "profile" ? t('create_account.create_pro_account') : t('create_account.next')}
                                disabled={nextDisable}
                                onPress={step === "profile" ? handleCreateAccount : nextStep}
                                style={styles.nextButton}
                            />
                            {/*{renderSocialButtons()}*/}
                        </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

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

            {renderTermsModel()}
        </SafeAreaView>
    );
}

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        backgroundColor: COLORS.BackgroundColor,
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
    },
    title: {
        color: COLORS.PrimaryColor,
        textAlign: "center",
        flex:1,
        fontSize: RFValue(18),
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
    form: {
        gap: SPACING.lg,
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
    countyInput: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
    },
    googlePlacesContainer: {
        position: 'relative',
        zIndex: 1000,
    },
    formLabel: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
        color: COLORS.PrimaryColor,
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: COLORS.Gray,
        borderRadius: 8,
        overflow: "hidden",
    },
    picker: {
        width: "100%",
        height: Platform.OS === "ios" ? 200 : 40,
        color: COLORS.PrimaryColorText,
        backgroundColor: COLORS.BackgroundColor,
    },

    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        maxHeight: '70%',
        marginHorizontal: SPACING.md,
    },
    modalTitle: {
        padding: 5,
        fontSize: 16,
        fontFamily: "InstrumentSansSemiBold",
        marginBottom: 12,
        textAlign: 'center'
    },
    bottomDivider: {
        width: "100%",
        height: 1,
        backgroundColor: "#C0C0C0",
        marginBottom: 5
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
    limitText: {
        justifyContent: 'flex-end',
        alignSelf: 'flex-end',
        fontFamily: "InstrumentSansMedium",
        fontSize: 14,
        color: COLORS.Black,
    },
});

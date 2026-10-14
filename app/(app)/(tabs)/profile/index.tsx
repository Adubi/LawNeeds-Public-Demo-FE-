import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    DeviceEventEmitter,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View
} from "react-native";
import React, {useCallback, useEffect, useState} from "react";
import {SafeAreaView} from "react-native-safe-area-context";
import {COLORS} from "@/constants/colors";
import * as ImagePicker from "expo-image-picker";
import {Picker} from "@react-native-picker/picker";

import {widthPercentageToDP as wp} from "react-native-responsive-screen";
import {SPACING} from "@/constants/theme";
import {RFValue} from "react-native-responsive-fontsize";
import {FontAwesome6, MaterialIcons} from "@expo/vector-icons";
import {router, useFocusEffect} from "expo-router";
import UserService from "@/services/UserServices";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {useTranslation} from 'react-i18next';
import {getAuthToken} from "@/services/httpservice";
import {setCurrentRoute} from "@/utils/navigationState";
import {IdentityVerificationBadge} from "@/components/IdentityVerificationBadge";
import {CachedAvatar} from "@/components/CachedAvatar";
import {IMMIGRATION_STATUS_OPTIONS} from "@/constants/immigrationStatus";
import CustomDatePicker from "@/components/DatePicker";
import CountryPicker from "@/components/CountryPicker";
import {
    PROFILE_COMPLETION_UPDATED_EVENT,
} from "@/constants/onboarding";


interface UserData {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    user_name: string;
    phone_number?: string;
    date_of_birth?: string | null;
    address?: string | null;
    town_city?: string | null;
    country?: string | null;
    postcode?: string | null;
    oauth_provider?: string | null;
    immigration_status?: string | null;
    webinar?: boolean | null;
    profile_picture_path?: string | null;
    created_at?: string | null;
}

type ProfilePreferences = {
    immigration_status: string;
    webinar: boolean | null;
};

const formatJoinedDate = (dateValue?: string | null) => {
    if (!dateValue) return "";
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return "";
    const formatted = new Intl.DateTimeFormat("en-GB", {
        month: "long",
        year: "numeric",
    }).format(parsed);
    return `Joined ${formatted}`;
};

const Profile = () => {

    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const preferenceText = useCallback(
        (key: string, defaultValue: string) => t(`profile_preferences.${key}`, {defaultValue}),
        [t]
    );

    const [user, setUser] = useState<UserData | null>(null);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [editedProfile, setEditedProfile] = useState({
        first_name: "",
        last_name: "",
        phone_number: "",
        user_name: "",
        address: "",
        town_city: "",
        country: "",
        postcode: "",
        date_of_birth: "",
    });
    const [profilePreferences, setProfilePreferences] = useState<ProfilePreferences>({
        immigration_status: "",
        webinar: null,
    });
    const [preferencesDirty, setPreferencesDirty] = useState(false);
    const [preferencesSaving, setPreferencesSaving] = useState(false);
    const [editMode, setEditMode] = useState({
        first_name: false,
        last_name: false,
        phone_number: false,
        user_name: false,
        address: false,
        town_city: false,
        postcode: false,
    });
    const [dateModalVisible, setDateModalVisible] = useState(false);
    const [countryModalVisible, setCountryModalVisible] = useState(false);

    const notifyProfileUpdated = (profile: UserData) => {
        DeviceEventEmitter.emit(PROFILE_COMPLETION_UPDATED_EVENT, profile);
    };

    useFocusEffect(
        useCallback(() => {
            setCurrentRoute("Profile", {
                session_id: "",
                referral_id: "",
            });
        }, [])
    );

    const fetchProfile = async () => {
        UserService.GetProfile()
            .then((res) => {
                if (res.profile) {

                    setUser({
                        id: res.profile.id,
                        email: res?.profile?.email,
                        first_name: res?.profile?.first_name,
                        last_name: res?.profile?.last_name,
                        user_name: res?.profile?.user_name,
                        phone_number: res?.profile?.phone_number,
                        date_of_birth: res?.profile?.date_of_birth,
                        address: res?.profile?.address,
                        town_city: res?.profile?.town_city,
                        country: res?.profile?.country,
                        postcode: res?.profile?.postcode,
                        oauth_provider: res?.profile?.oauth_provider,
                        immigration_status: res?.profile?.immigration_status,
                        webinar: typeof res?.profile?.webinar === "boolean" ? res.profile.webinar : null,
                        profile_picture_path: res?.profile?.profile_picture_path,
                        created_at: res?.profile?.created_at,
                    });
                    setEditedProfile({
                        first_name: res?.profile?.first_name || "",
                        last_name: res?.profile?.last_name || "",
                        phone_number: res?.profile?.phone_number || "",
                        user_name: res?.profile?.user_name || "",
                        address: res?.profile?.address || "",
                        town_city: res?.profile?.town_city || "",
                        country: res?.profile?.country || "",
                        postcode: res?.profile?.postcode || "",
                        date_of_birth: res?.profile?.date_of_birth || "",
                    });
                    setProfilePreferences({
                        immigration_status: res?.profile?.immigration_status || "",
                        webinar: typeof res?.profile?.webinar === "boolean" ? res.profile.webinar : null,
                    });
                    setPreferencesDirty(false);
                }
            })
            .catch((err) => {
                console.log("Err on get profile: ", err);
            });
    };


    useEffect(() => {
        fetchProfile();
    }, []);

    if (!user) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color={COLORS.PrimaryColor}/>
            </View>
        );
    }


    const handleChangeProfileImage = async () => {
        setIsLoading(true);

        try {
            const authToken = await getAuthToken();

            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                alert(t('per.camera_roll'));
                setIsLoading(false);
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

          //  console.log("Image selection result:", result);

            if (!result.canceled) {
                const localUri = result.assets[0].uri;
                const filename = localUri.split("/").pop();
                const match = /\.(\w+)$/.exec(filename || "");
                const type = match ? `image/${match[1]}` : "image";

             //   console.log("Image details - URI:", localUri, "Filename:", filename, "Type:", type);

                const formData = new FormData();
                formData.append("file", {uri: localUri, name: filename, type} as any);

               // console.log("FormData prepared, sending request...");

                const response = await UserService.UpdateProfilePic(formData);

                const profileUrl = response?.file_info?.url ?? null;
               // console.log("API Response:", profileUrl);

                if (profileUrl) {
                    setUser((prev) => prev ? {...prev, profile_picture_path: profileUrl} : null);
                  //  console.log("Updated user profile picture path:", profileUrl);
                }
            } else {
                console.log("Image selection was canceled.");
            }
        } catch (error: any) {
            console.error("Error updating profile picture:", error.response ? error.response.data : error.message);
        }

        setIsLoading(false);
       // console.log("Profile image change process completed.");
        fetchProfile();
    };


    const handleDeleteProfileImage = async () => {
        try {
            const res = await UserService.DeleteProfilePic().then((res) => {
                setUser((prev) => prev ? {...prev, profile_picture_path: null} : null);
            }).catch((err) => {
                console.log(err);
            });
        } catch (err) {
            console.log("Error deleting profile image", err);
        }
    };

    const handleSaveField = async (field: keyof typeof editMode) => {
        try {
            const payload = {
                first_name: editedProfile.first_name,
                last_name: editedProfile.last_name,
                phone_number: editedProfile.phone_number,
                user_name: editedProfile.user_name,
                address: editedProfile.address,
                town_city: editedProfile.town_city,
                country: editedProfile.country,
                postcode: editedProfile.postcode,
                date_of_birth: editedProfile.date_of_birth,
            };

            const res = await UserService.UpdateProfile(payload);
            if (res.profile) {
                setUser((prev) => prev ? {
                    ...prev,
                    first_name: res.profile.first_name,
                    last_name: res.profile.last_name,
                    phone_number: res.profile.phone_number,
                    user_name: res.profile.user_name,
                    address: res.profile.address,
                    town_city: res.profile.town_city,
                    country: res.profile.country,
                    postcode: res.profile.postcode,
                    date_of_birth: res.profile.date_of_birth,
                } : null);
                setEditedProfile({
                    first_name: res.profile.first_name || "",
                    last_name: res.profile.last_name || "",
                    phone_number: res.profile.phone_number || "",
                    user_name: res.profile.user_name || "",
                    address: res.profile.address || "",
                    town_city: res.profile.town_city || "",
                    country: res.profile.country || "",
                    postcode: res.profile.postcode || "",
                    date_of_birth: res.profile.date_of_birth || "",
                });
                notifyProfileUpdated(res.profile);
            }
        } catch (err) {
            console.log("Error updating profile:", err);
        }

        setEditMode((prev) => ({...prev, [field]: false}));
    };

    const handleDateOfBirthChange = async (date: string) => {
        setEditedProfile((prev) => ({...prev, date_of_birth: date}));
        try {
            const res = await UserService.UpdateProfile({date_of_birth: date});
            if (res.profile) {
                setUser((prev) => prev ? {...prev, date_of_birth: res.profile.date_of_birth} : null);
            }
        } catch (err) {
            Alert.alert("", t('error.error_msg'));
        }
    };

    const handleCountryChange = async (country: string) => {
        setEditedProfile((prev) => ({...prev, country}));
        try {
            const res = await UserService.UpdateProfile({country});
            if (res.profile) {
                setUser((prev) => prev ? {...prev, country: res.profile.country} : null);
            }
        } catch (err) {
            Alert.alert("", t('error.error_msg'));
        }
    };

    const renderEditableProfileField = (
        field: "address" | "town_city" | "postcode",
        label: string,
    ) => (
        <View style={{marginVertical: SPACING.sm}}>
            <Text style={styles.formLabel} allowFontScaling={false}>{label}</Text>
            <View style={[styles.formField, {position: "relative"}]}>
                <TextInput
                    style={styles.profileFieldInput}
                    allowFontScaling={false}
                    value={editedProfile[field]}
                    onChangeText={(text) =>
                        setEditedProfile((prev) => ({...prev, [field]: text}))
                    }
                    editable={editMode[field]}
                />
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`${editMode[field] ? "Save" : "Edit"} ${label}`}
                    onPress={() => {
                        if (editMode[field]) {
                            handleSaveField(field);
                        } else {
                            setEditMode((prev) => ({...prev, [field]: true}));
                        }
                    }}
                    style={styles.fieldAction}
                >
                    <FontAwesome6
                        name={editMode[field] ? "check" : "pencil"}
                        size={wp(5)}
                        color={COLORS.Gray}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );

    const updateProfilePreference = (field: "immigration_status" | "webinar", value: string | boolean | null) => {
        setProfilePreferences((prev) => ({
            ...prev,
            [field]: value,
        }));
        setPreferencesDirty(true);
    };

    const handleSavePreferences = async () => {
        if (!profilePreferences.immigration_status) {
            Alert.alert("", preferenceText("select_status_required", "Please select your current UK immigration status."));
            return;
        }

        if (profilePreferences.webinar === null) {
            Alert.alert("", preferenceText("select_webinar_required", "Please choose whether you want to receive webinar invitations."));
            return;
        }

        setPreferencesSaving(true);
        try {
            const res = await UserService.UpdateProfile(profilePreferences);
            if (res.profile) {
                setUser((prev) => prev ? {
                    ...prev,
                    immigration_status: res.profile.immigration_status,
                    webinar: typeof res.profile.webinar === "boolean" ? res.profile.webinar : null,
                } : null);
                setProfilePreferences({
                    immigration_status: res.profile.immigration_status || "",
                    webinar: typeof res.profile.webinar === "boolean" ? res.profile.webinar : null,
                });
                setPreferencesDirty(false);
                notifyProfileUpdated(res.profile);
            }
        } catch (err) {
            console.log("Error updating profile preferences:", err);
            Alert.alert("", preferenceText("update_failed", "Unable to update your preferences. Please try again."));
        } finally {
            setPreferencesSaving(false);
        }
    };

    const fullName = `${user.first_name} ${user.last_name}`.trim();
    const joinedDateText = formatJoinedDate(user.created_at);
    const joinedDateColor = colorScheme === "dark" ? COLORS.White : COLORS.PrimaryColorText;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{flex: 1,}}
        >
            <GestureHandlerRootView style={{flex: 1,}}>
                    <View style={{flex: 1, backgroundColor: COLORS.BackgroundColor,    }}>
                        <ScrollView
                            keyboardDismissMode="interactive"
                            keyboardShouldPersistTaps="handled"
                            nestedScrollEnabled={true}
                            contentContainerStyle={{paddingBottom: 100}}
                        >
                            <SafeAreaView style={styles.container}>
                                <View
                                    style={{
                                        padding: SPACING.md,

                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <TouchableOpacity
                                        onPress={() => router.push("/(app)/(tabs)")}
                                        style={styles.backButton}
                                        accessibilityRole="button"
                                        accessibilityLabel={t('change_email.go_back')}
                                    >
                                        <MaterialIcons name="arrow-back-ios" size={24}/>
                                    </TouchableOpacity>
                                    <View style={{justifyContent: "center", alignItems: "center"}}>
                                        <View style={{position: "relative", width: wp(40), height: wp(40)}}>
                                            <View
                                                style={{
                                                    width: wp(40),
                                                    height: wp(40),
                                                    borderRadius: wp(100),
                                                    overflow: "hidden",
                                                }}
                                            >
                                                {user.profile_picture_path ? (
                                                    <CachedAvatar
                                                        uri={user.profile_picture_path}
                                                        style={{
                                                            width: wp(40),
                                                            height: wp(40),
                                                            backgroundColor: COLORS.Gray
                                                        }}
                                                    />
                                                ) : (
                                                    <View style={{
                                                        width: wp(40),
                                                        height: wp(40),
                                                        backgroundColor: COLORS.Gray,
                                                        justifyContent: "center",
                                                        alignItems: "center"
                                                    }}>
                                                        <FontAwesome6
                                                            name="user"
                                                            size={wp(20)}
                                                            color={COLORS.White}
                                                        />
                                                    </View>
                                                )}
                                                {isLoading && (
                                                    <ActivityIndicator
                                                        size="small"
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
                                            </View>
                                            <TouchableOpacity
                                                onPress={handleChangeProfileImage}
                                                style={{
                                                    position: "absolute",
                                                    bottom: 5,
                                                    left: 5,
                                                    backgroundColor: "rgba(0,0,0,0.5)",
                                                    borderRadius: wp(4),
                                                    padding: 5,
                                                    elevation: 5,
                                                    shadowColor: "#000",
                                                    shadowOffset: {width: 0, height: 2},
                                                    shadowOpacity: 0.25,
                                                    shadowRadius: 3.84,
                                                    zIndex: 2,
                                                }}
                                            >
                                                <FontAwesome6 name="camera" size={wp(5)} color="#fff"/>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={handleDeleteProfileImage}
                                                style={{
                                                    position: "absolute",
                                                    bottom: 5,
                                                    right: 5,
                                                    backgroundColor: "rgba(0,0,0,0.5)",
                                                    borderRadius: wp(4),
                                                    padding: 5,
                                                    elevation: 5,
                                                    shadowColor: "#000",
                                                    shadowOffset: {width: 0, height: 2},
                                                    shadowOpacity: 0.25,
                                                    shadowRadius: 3.84,
                                                    zIndex: 2,
                                                }}
                                            >
                                                <FontAwesome6 name="trash" size={wp(5)} color="#fff"/>
                                            </TouchableOpacity>
                                        </View>
                                        <Text
                                            style={{
                                                fontFamily: "InstrumentSansSemiBold",
                                                fontSize: RFValue(16),
                                                color: COLORS.PrimaryColorText,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            {fullName || t('profile.no_name')}
                                        </Text>
                                        <IdentityVerificationBadge/>
                                        <View
                                            style={{flexDirection: "row", alignItems: "center", gap: 5}}
                                        >
                                            <Image
                                                source={require("@/assets/images/icon-ne.png")}
                                                style={{resizeMode: "contain", width: wp(5), height: wp(5)}}
                                            />
                                            <Text
                                                style={{
                                                    fontFamily: "InstrumentSansSemiBold",
                                                    fontSize: RFValue(16),
                                                    color: COLORS.Gray,
                                                }}
                                                    allowFontScaling={false}
                                                >
                                                    {`@${user.user_name ?? ""}`}
                                                </Text>
                                            </View>
                                            {joinedDateText ? (
                                                <Text
                                                    style={[styles.joinedDate, {color: joinedDateColor}]}
                                                    numberOfLines={1}
                                                    allowFontScaling={false}
                                                >
                                                    {joinedDateText}
                                                </Text>
                                            ) : null}
                                        </View>
                                        <View style={{width: wp(10), height: wp(10),}}/>
                                    </View>

                                <View style={styles.details}>
                                    <View style={{marginVertical: SPACING.sm}}>
                                        <Text style={styles.formLabel} allowFontScaling={false}>
                                            {t('user_name')}
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
                                                value={editedProfile.user_name}
                                                onChangeText={(text) =>
                                                    setEditedProfile((prev) => ({...prev, user_name: text}))
                                                }
                                                autoCapitalize="none"
                                                editable={editMode.user_name}
                                            />
                                            <TouchableOpacity
                                                accessibilityRole="button"
                                                accessibilityLabel={editMode.user_name ? "Save username" : "Edit username"}
                                                onPress={() => {
                                                    if (editMode.user_name) {
                                                        if (editedProfile.user_name.trim().length < 3) {
                                                            Alert.alert("", t('validation.valid_user_name'));
                                                        } else {
                                                            handleSaveField("user_name");
                                                        }
                                                    } else {
                                                        setEditMode((prev) => ({...prev, user_name: true}));
                                                    }
                                                }}
                                                style={styles.fieldAction}
                                            >
                                                <FontAwesome6
                                                    name={editMode.user_name ? "check" : "pencil"}
                                                    size={wp(5)}
                                                    color={COLORS.Gray}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={{marginVertical: SPACING.sm}}>
                                        <Text style={styles.formLabel} allowFontScaling={false}>
                                            {t('create_account.first_name')}
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
                                                value={editedProfile.first_name}
                                                onChangeText={(text) =>
                                                    setEditedProfile((prev) => ({...prev, first_name: text}))
                                                }
                                                editable={editMode.first_name}
                                            />
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (editMode.first_name) {

                                                        if (!editedProfile.first_name ){
                                                            Alert.alert("", t('validation.enter_first_name'));

                                                        }else{
                                                            handleSaveField("first_name");
                                                        }

                                                    } else {
                                                        setEditMode((prev) => ({...prev, first_name: true}));
                                                    }
                                                }}
                                                style={{
                                                    position: "absolute",
                                                    right: 5,
                                                    top: 0,
                                                    bottom: 0,
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    paddingHorizontal: 10,
                                                    opacity: editMode.first_name ? 1 : 0.5,
                                                }}
                                            >
                                                <FontAwesome6
                                                    name={editMode.first_name ? "check" : "pencil"}
                                                    size={wp(5)}
                                                    color={COLORS.Gray}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={{marginVertical: SPACING.sm}}>
                                        <Text style={styles.formLabel} allowFontScaling={false}>
                                            {t('create_account.last_name')}
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
                                                value={editedProfile.last_name}
                                                onChangeText={(text) =>
                                                    setEditedProfile((prev) => ({...prev, last_name: text}))
                                                }
                                                editable={editMode.last_name}
                                            />
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (editMode.last_name) {
                                                        if (!editedProfile.last_name ){
                                                            Alert.alert("",  t('validation.enter_last_name'));

                                                        }else{
                                                            handleSaveField("last_name");
                                                        }

                                                    } else {
                                                        setEditMode((prev) => ({...prev, last_name: true}));
                                                    }
                                                }}
                                                style={{
                                                    position: "absolute",
                                                    right: 5,
                                                    top: 0,
                                                    bottom: 0,
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    paddingHorizontal: 10,
                                                    opacity: editMode.last_name ? 1 : 0.5,
                                                }}
                                            >
                                                <FontAwesome6
                                                    name={editMode.last_name ? "check" : "pencil"}
                                                    size={wp(5)}
                                                    color={COLORS.Gray}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={{marginVertical: SPACING.sm}}>
                                        <Text style={styles.formLabel} allowFontScaling={false}>
                                            {t('email')}
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
                                                value={user.email}
                                                editable={false}
                                            />
                                        </View>
                                    </View>

                                    <View style={{marginVertical: SPACING.sm}}>
                                        <Text style={styles.formLabel} allowFontScaling={false}>
                                            {t('phone_number')}
                                        </Text>
                                        <View style={[styles.formField, {position: "relative"}]}>
                                            <TextInput
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    fontFamily: "InstrumentSansSemiBold",
                                                    fontSize: RFValue(14),
                                                }}
                                                keyboardType={"number-pad"}
                                                allowFontScaling={false}
                                                value={editedProfile.phone_number}
                                                onChangeText={(text) =>
                                                    setEditedProfile((prev) => ({...prev, phone_number: text}))
                                                }
                                                editable={editMode.phone_number}
                                            />

                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (editMode.phone_number) {
                                                        if (!editedProfile.phone_number ){
                                                            Alert.alert("", t('validation.enter_your_phone'));

                                                        }else{
                                                            handleSaveField("phone_number");
                                                        }

                                                    } else {
                                                        setEditMode((prev) => ({...prev, phone_number: true}));
                                                    }
                                                }}
                                                style={{
                                                    position: "absolute",
                                                    right: 5,
                                                    top: 0,
                                                    bottom: 0,
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    paddingHorizontal: 10,
                                                    opacity: editMode.phone_number ? 1 : 0.5,
                                                }}
                                            >
                                                <FontAwesome6
                                                    name={editMode.phone_number ? "check" : "pencil"}
                                                    size={wp(5)}
                                                    color={COLORS.Gray}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={{marginVertical: SPACING.sm}}>
                                        <Text style={styles.formLabel} allowFontScaling={false}>
                                            {t('create_account.date_of_birth')}
                                        </Text>
                                        <TouchableOpacity
                                            accessibilityRole="button"
                                            accessibilityLabel="Edit date of birth"
                                            onPress={() => setDateModalVisible(true)}
                                            style={styles.formField}
                                        >
                                            <Text style={styles.profilePickerText}>
                                                {editedProfile.date_of_birth || t('select_date')}
                                            </Text>
                                        </TouchableOpacity>
                                        <CustomDatePicker
                                            minAgeLimit={18}
                                            onDateSelected={handleDateOfBirthChange}
                                            setModalVisible={setDateModalVisible}
                                            isModalVisible={dateModalVisible}
                                        />
                                    </View>

                                    {renderEditableProfileField('address', t('create_account.address'))}
                                    {renderEditableProfileField('town_city', t('create_account.town'))}
                                    {renderEditableProfileField('postcode', t('create_account.postcode'))}

                                    <View style={{marginVertical: SPACING.sm}}>
                                        <Text style={styles.formLabel} allowFontScaling={false}>
                                            {t('create_account.country')}
                                        </Text>
                                        <TouchableOpacity
                                            accessibilityRole="button"
                                            accessibilityLabel="Edit country"
                                            onPress={() => setCountryModalVisible(true)}
                                            style={styles.formField}
                                        >
                                            <Text style={styles.profilePickerText}>
                                                {editedProfile.country || t('create_account.select_country')}
                                            </Text>
                                        </TouchableOpacity>
                                        <CountryPicker
                                            isVisible={countryModalVisible}
                                            onClose={() => setCountryModalVisible(false)}
                                            onSelectCountry={handleCountryChange}
                                        />
                                    </View>

                                    <View style={styles.preferenceSection}>
                                        <Text style={styles.preferenceTitle} allowFontScaling={false}>
                                            {preferenceText("title", "Tell us a little about you")}
                                        </Text>
                                        <Text style={styles.preferenceDescription}>
                                            {preferenceText("description", "Help us personalise the information and updates you receive from LawNeeds.")}
                                        </Text>

                                        <View style={{marginVertical: SPACING.sm}}>
                                            <Text style={styles.preferenceLabel} allowFontScaling={false}>
                                                {preferenceText("current_status", "Current UK immigration status")}
                                            </Text>
                                            <View style={styles.pickerField}>
                                                <Picker
                                                    selectedValue={profilePreferences.immigration_status}
                                                    onValueChange={(value) => updateProfilePreference("immigration_status", String(value))}
                                                    style={styles.picker}
                                                    itemStyle={styles.pickerItem}
                                                >
                                                    <Picker.Item label={preferenceText("select_status", "Select status")} value="" />
                                                    {IMMIGRATION_STATUS_OPTIONS.map((option) => (
                                                        <Picker.Item key={option} label={option} value={option} />
                                                    ))}
                                                </Picker>
                                            </View>
                                        </View>

                                        <View style={{marginVertical: SPACING.sm}}>
                                            <Text style={styles.preferenceLabel} allowFontScaling={false}>
                                                {preferenceText("webinar_title", "Stay informed about LawNeeds webinars")}
                                            </Text>
                                            <Text style={styles.preferenceDescription}>
                                                {preferenceText("webinar_description", "Receive invitations to upcoming webinars, legal information sessions and Q&As relevant to you.")}
                                            </Text>
                                            <View style={styles.webinarOptions}>
                                                <TouchableOpacity
                                                    activeOpacity={0.8}
                                                    style={[
                                                        styles.webinarOption,
                                                        profilePreferences.webinar === true && styles.webinarOptionSelected,
                                                    ]}
                                                    onPress={() => updateProfilePreference("webinar", true)}
                                                >
                                                    <MaterialIcons
                                                        name={profilePreferences.webinar === true ? "radio-button-checked" : "radio-button-unchecked"}
                                                        size={20}
                                                        color={profilePreferences.webinar === true ? COLORS.PrimaryColor : COLORS.Gray}
                                                    />
                                                    <Text style={styles.webinarOptionText}>{preferenceText("yes", "Yes")}</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    activeOpacity={0.8}
                                                    style={[
                                                        styles.webinarOption,
                                                        profilePreferences.webinar === false && styles.webinarOptionSelected,
                                                    ]}
                                                    onPress={() => updateProfilePreference("webinar", false)}
                                                >
                                                    <MaterialIcons
                                                        name={profilePreferences.webinar === false ? "radio-button-checked" : "radio-button-unchecked"}
                                                        size={20}
                                                        color={profilePreferences.webinar === false ? COLORS.PrimaryColor : COLORS.Gray}
                                                    />
                                                    <Text style={styles.webinarOptionText}>{preferenceText("no", "No")}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            style={[
                                                styles.savePreferenceButton,
                                                (!preferencesDirty || preferencesSaving) && styles.savePreferenceButtonDisabled,
                                            ]}
                                            disabled={!preferencesDirty || preferencesSaving}
                                            onPress={handleSavePreferences}
                                        >
                                            {preferencesSaving ? (
                                                <ActivityIndicator size="small" color={COLORS.White}/>
                                            ) : (
                                                <Text style={styles.savePreferenceButtonText}>{preferenceText("save_preferences", "Save preferences")}</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>

                                    {/*=======Disable update address===========*/}

                                    {/*<View style={{marginVertical: SPACING.sm, marginBottom: SPACING.lg, zIndex: 9999}}>*/}
                                    {/*    <Text style={styles.formLabel} allowFontScaling={false}>*/}
                                    {/*        Address*/}
                                    {/*    </Text>*/}

                                    {/*    <View style={[styles.formField, {position: "relative", overflow: "visible"}]}>*/}
                                    {/*        {editMode.address ? (*/}
                                    {/*            <>*/}
                                    {/*                <GooglePlacesAutocomplete*/}
                                    {/*                    placeholder="Enter address"*/}
                                    {/*                    fetchDetails={true}*/}
                                    {/*                    onPress={(data, details = null) => {*/}
                                    {/*                        const formatted = details?.formatted_address || data.description;*/}
                                    {/*                        console.log("ali gazanfar:", formatted);*/}
                                    {/*                        setEditedProfile((prev) => ({...prev, address: formatted}));*/}
                                    {/*                    }}*/}
                                    {/*                    query={{*/}
                                    {/*                        key: "REPLACE_WITH_GOOGLE_API_KEY",*/}
                                    {/*                        language: "en",*/}
                                    {/*                    }}*/}
                                    {/*                    debounce={300}*/}
                                    {/*                    enablePoweredByContainer={false}*/}
                                    {/*                    styles={{*/}
                                    {/*                        container: {*/}
                                    {/*                            flex: 1,*/}
                                    {/*                            zIndex: 9999,*/}
                                    {/*                            position: "relative",*/}
                                    {/*                        },*/}
                                    {/*                        textInput: {*/}
                                    {/*                            borderRadius: wp(100),*/}
                                    {/*                            backgroundColor: "#E7E7E7",*/}
                                    {/*                            fontFamily: "InstrumentSansSemiBold",*/}
                                    {/*                            fontSize: RFValue(14),*/}
                                    {/*                            height: wp(13),*/}
                                    {/*                            paddingHorizontal: "5%",*/}
                                    {/*                            paddingRight: wp(10),*/}
                                    {/*                        },*/}
                                    {/*                        listView: {*/}
                                    {/*                            position: "absolute",*/}
                                    {/*                            top: wp(13),*/}
                                    {/*                            left: 0,*/}
                                    {/*                            right: 0,*/}
                                    {/*                            zIndex: 9999,*/}
                                    {/*                            elevation: 10,*/}
                                    {/*                            backgroundColor: "#fff",*/}
                                    {/*                        },*/}
                                    {/*                        row: {*/}
                                    {/*                            backgroundColor: "#fff",*/}
                                    {/*                        },*/}
                                    {/*                        description: {*/}
                                    {/*                            fontFamily: "InstrumentSansRegular",*/}
                                    {/*                            color: "#000",*/}
                                    {/*                        },*/}
                                    {/*                    }}*/}
                                    {/*                />*/}

                                    {/*                <TouchableOpacity*/}

                                    {/*                    onPress={(data, details = null) => {*/}
                                    {/*                        const formatted = details?.formatted_address || data.description;*/}
                                    {/*                        console.log("ali gazanfar:", formatted)*/}
                                    {/*                        setEditedProfile((prev) => ({...prev, address: formatted}));*/}
                                    {/*                        handleSaveField("address");*/}
                                    {/*                    }}*/}
                                    {/*                    style={{*/}
                                    {/*                        position: "absolute",*/}
                                    {/*                        right: wp(5),*/}
                                    {/*                        top: 0,*/}
                                    {/*                        bottom: 0,*/}
                                    {/*                        justifyContent: "center",*/}
                                    {/*                        alignItems: "center",*/}
                                    {/*                        paddingHorizontal: wp(3),*/}
                                    {/*                        zIndex: 100000,*/}
                                    {/*                    }}*/}
                                    {/*                >*/}
                                    {/*                    <FontAwesome6 name="check" size={wp(5)} color={COLORS.Gray}/>*/}
                                    {/*                </TouchableOpacity>*/}
                                    {/*            </>*/}
                                    {/*        ) : (*/}
                                    {/*            <>*/}
                                    {/*                <TextInput*/}
                                    {/*                    style={{*/}
                                    {/*                        width: "100%",*/}
                                    {/*                        height: "100%",*/}
                                    {/*                        fontFamily: "InstrumentSansSemiBold",*/}
                                    {/*                        fontSize: RFValue(14),*/}
                                    {/*                        paddingRight: wp(10),*/}
                                    {/*                    }}*/}
                                    {/*                    allowFontScaling={false}*/}
                                    {/*                    value={editedProfile.address}*/}
                                    {/*                    editable={false}*/}
                                    {/*                />*/}
                                    {/*                <TouchableOpacity*/}
                                    {/*                    onPress={() => setEditMode((prev) => ({*/}
                                    {/*                        ...prev,*/}
                                    {/*                        address: true*/}
                                    {/*                    }))}*/}
                                    {/*                    style={{*/}
                                    {/*                        position: "absolute",*/}
                                    {/*                        right: wp(5),*/}
                                    {/*                        top: 0,*/}
                                    {/*                        bottom: 0,*/}
                                    {/*                        justifyContent: "center",*/}
                                    {/*                        alignItems: "center",*/}
                                    {/*                        paddingHorizontal: wp(3),*/}
                                    {/*                        opacity: 0.5,*/}
                                    {/*                    }}*/}
                                    {/*                >*/}
                                    {/*                    <FontAwesome6 name="pencil" size={wp(5)} color={COLORS.Gray}/>*/}
                                    {/*                </TouchableOpacity>*/}
                                    {/*            </>*/}
                                    {/*        )}*/}
                                    {/*    </View>*/}
                                    {/*</View>*/}
                                    </View>
                                </SafeAreaView>
                        </ScrollView>
                    </View>
            </GestureHandlerRootView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BackgroundColor,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        marginBottom: SPACING.md,
    },
    hamburger: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "flex-end",
        marginBottom: SPACING.md,
        visibility: "hidden",
    },
    details: {
        backgroundColor: COLORS.White,
        // flex: 1,
        padding: SPACING.lg,
        borderTopLeftRadius: wp(10),
        borderTopRightRadius: wp(10),
        minHeight: "85%",
        marginBottom: SPACING.xl,

    },
    title: {
        fontFamily: "InstrumentSansBold",
        fontSize: RFValue(14),
        color: COLORS.PrimaryColorText,
    },
    formLabel: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(12),
        color: "#B9B9B9",
    },
    loaderContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        // backgroundColor: "rgba(255, 255, 255, 0.5)",
        zIndex: 999,
    },
    formField: {
        borderRadius: wp(100),
        marginTop: SPACING.sm,
        paddingHorizontal: "5%",
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
        height: wp(13),
        overflow: "hidden",
        backgroundColor: "#E7E7E7",
        },
        profileFieldInput: {
            width: "100%",
            height: "100%",
            paddingRight: wp(10),
            fontFamily: "InstrumentSansSemiBold",
            fontSize: RFValue(14),
        },
        profilePickerText: {
            paddingVertical: SPACING.md,
            fontFamily: "InstrumentSansSemiBold",
            fontSize: RFValue(14),
        },
        fieldAction: {
            position: "absolute",
            right: 5,
            top: 0,
            bottom: 0,
            minWidth: 44,
            justifyContent: "center",
            alignItems: "center",
            opacity: 0.65,
        },
        preferenceSection: {
            marginTop: SPACING.lg,
            paddingTop: SPACING.md,
            borderTopWidth: 1,
            borderTopColor: COLORS.GrayLight,
        },
        preferenceTitle: {
            color: COLORS.PrimaryColorText,
            fontFamily: "InstrumentSansBold",
            fontSize: RFValue(15),
            marginBottom: SPACING.xs,
        },
        preferenceDescription: {
            color: COLORS.Gray,
            fontFamily: "InstrumentSansRegular",
            fontSize: RFValue(12),
            lineHeight: RFValue(17),
            marginTop: SPACING.xs,
        },
        preferenceLabel: {
            color: COLORS.Black,
            fontFamily: "InstrumentSansBold",
            fontSize: RFValue(12),
        },
        pickerField: {
            marginTop: SPACING.sm,
            borderRadius: 8,
            backgroundColor: "#E7E7E7",
            borderWidth: 1,
            borderColor: COLORS.GrayLight,
            overflow: "hidden",
        },
        picker: {
            width: "100%",
            minHeight: Platform.OS === "ios" ? 150 : wp(13),
        },
        pickerItem: {
            fontFamily: "InstrumentSansRegular",
            fontSize: RFValue(13),
        },
        webinarOptions: {
            flexDirection: "row",
            gap: SPACING.sm,
            marginTop: SPACING.sm,
        },
        webinarOption: {
            flex: 1,
            minHeight: 46,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: COLORS.GrayLight,
            backgroundColor: "#F7F7F7",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: SPACING.xs,
        },
        webinarOptionSelected: {
            borderColor: COLORS.PrimaryColor,
            backgroundColor: "#EEF8F1",
        },
        webinarOptionText: {
            color: COLORS.PrimaryColorText,
            fontFamily: "InstrumentSansSemiBold",
            fontSize: RFValue(13),
        },
        savePreferenceButton: {
            minHeight: 48,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: COLORS.PrimaryColor,
            marginTop: SPACING.md,
        },
        savePreferenceButtonDisabled: {
            backgroundColor: COLORS.Disabled,
        },
        savePreferenceButtonText: {
            color: COLORS.White,
            fontFamily: "InstrumentSansSemiBold",
            fontSize: RFValue(13),
        },
        joinedDate: {
            marginTop: SPACING.xs,
            textAlign: "center",
            fontFamily: "InstrumentSansSemiBold",
            fontSize: RFValue(12),
        },
});

export default Profile;

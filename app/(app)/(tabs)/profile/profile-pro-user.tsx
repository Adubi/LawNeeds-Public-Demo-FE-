import {
    ActivityIndicator,
    Animated,
    Image,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";
import React, {useCallback, useRef, useState} from "react";
import {COLORS} from "@/constants/colors";
import {BORDER_RADIUS, SPACING} from "@/constants/theme";
import {SafeAreaView, useSafeAreaInsets} from "react-native-safe-area-context";
import {router, useFocusEffect} from "expo-router";
import {Entypo, FontAwesome6, MaterialIcons} from "@expo/vector-icons";
import {heightPercentageToDP as hp, widthPercentageToDP as wp,} from "react-native-responsive-screen";
import {RFValue} from "react-native-responsive-fontsize";
import UserService from "@/services/UserServices";
import {ProTypes} from "@/constants/protypes";
import * as ImagePicker from "expo-image-picker";
import {useTranslation} from 'react-i18next';
import {IdentityVerificationBadge} from "@/components/IdentityVerificationBadge";
import {CachedAvatar} from "@/components/CachedAvatar";
import {getMyAvailability} from "@/services/apiHelper";

type CustomInputProps = {
    top?: number;
    label: string;
    value: string;
};

interface EmployerSection {
    id: string;
    company_name: string;
    achievement: string;
    start_date: string;
    end_date: string;
    created_at: string;
    updated_at: string;
}

interface ExpertiseSection {
    label: string;
    value: any[]
}

interface UserInfo {
    firstName: string;
    lastName: string;
    description?: string;
    expertise?: string[];
    employer?: EmployerSection[]
    about?: string;
    email: string;
    phoneNumber?: string;
    userName: string;
    password?: string;
    skills?: string[];
    services?: string[];
    hourly_rate?: number;
    createdAt?: string | null;
}

interface AchievementsInfo {
    satisfied: string;
    casesHelped: string;
    license: string
}

interface TypeSection {
    label: string;
    value: string
}

type AvailabilityRuleSummary = {
    weekday: number;
    start_minute: number;
    end_minute: number;
    consultation_types?: string[];
    is_active?: boolean;
};

type AvailabilityExceptionSummary = {
    start_at: string;
    end_at: string;
    is_available: boolean;
};

type AvailabilitySummary = {
    weeklyWindows: string[];
    oneOffAvailableCount: number;
    oneOffUnavailableCount: number;
};

type AvailabilityResponse = {
    rules?: AvailabilityRuleSummary[];
    exceptions?: AvailabilityExceptionSummary[];
    availability?: {
        rules?: AvailabilityRuleSummary[];
        exceptions?: AvailabilityExceptionSummary[];
    };
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const minuteToTime = (minute: number) => {
    const hour = Math.floor(minute / 60).toString().padStart(2, "0");
    const min = (minute % 60).toString().padStart(2, "0");
    return `${hour}:${min}`;
};

const buildAvailabilitySummary = (
    rules: AvailabilityRuleSummary[] = [],
    exceptions: AvailabilityExceptionSummary[] = []
): AvailabilitySummary => {
    const weeklyWindows = rules
        .filter((rule) => rule.is_active !== false)
        .sort((a, b) => a.weekday - b.weekday || a.start_minute - b.start_minute)
        .map((rule) => {
            const day = WEEKDAY_LABELS[rule.weekday] || "Day";
            const typeCount = rule.consultation_types?.length || 0;
            return `${day} ${minuteToTime(rule.start_minute)}-${minuteToTime(rule.end_minute)}${typeCount ? ` (${typeCount} types)` : ""}`;
        });

    return {
        weeklyWindows,
        oneOffAvailableCount: exceptions.filter((item) => item.is_available).length,
        oneOffUnavailableCount: exceptions.filter((item) => !item.is_available).length,
    };
};

const normalizeAvailabilityResponse = (response: AvailabilityResponse | null | undefined) => {
    const availability = response?.availability || response;
    return {
        rules: availability?.rules || [],
        exceptions: availability?.exceptions || [],
    };
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

const ProfileProUser = () => {

    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const scrollY = useRef(new Animated.Value(0)).current;

    const insets = useSafeAreaInsets();
    const [isLoading, setIsLoading] = useState(true);
    const [isProfileLoading, setProfileLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [profilePic, setProfilePic] = useState<string | null>(null)
    const [profileDisplayName, setProfileDisplayName] = useState<string>("")
    const [selectedTypeSection, setSelectedTypeSection] = useState<TypeSection | null>(null)
    const [employerSection, setEmployerSection] = useState<EmployerSection[] | null>(null)
    const [expertiseSection, setExpertiseSection] = useState<ExpertiseSection | null>(null)
    const [skillInfo, setSkillInfo] = useState<any[] | null>(null)
    const [serviceInfo, setServiceInfo] = useState<any[]>([])
    const [userType, setUserType] = useState(null)
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
    const [availabilitySummary, setAvailabilitySummary] = useState<AvailabilitySummary | null>(null);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [availabilityNavigationPending, setAvailabilityNavigationPending] = useState(false);
    const availabilityNavigationPendingRef = useRef(false);
    const joinedDateText = formatJoinedDate(userInfo?.createdAt);
    const joinedDateColor = colorScheme === "dark" ? COLORS.White : COLORS.PrimaryColorText;


    const fetchProfile = async () => {
        setIsLoading(true);

        UserService.GetProfile()
            .then((res) => {

                if (res.profile) {
                    setResponse(res.profile);
                    setUserType(res.profile.professional_type)
                    setUserInfo({
                        firstName: res.profile.first_name,
                        lastName: res.profile.last_name,
                        email: res.profile.email,
                        about: res.profile.about,
                        userName: res.profile.user_name,
                        phoneNumber: res.profile.phone_number,
                        hourly_rate: res.profile?.hourly_rate || 0,
                        createdAt: res.profile.created_at,
                    })
                    setProfilePic(res.profile.profile_picture_path)
                    handleProfileDisplay(res.profile)
                    if (
                        res.profile.professional_type === ProTypes.LAWYER ||
                        res.profile.professional_type === ProTypes.LAW_FIRM
                    ) {
                        loadAvailabilitySummary();
                    }
                }

                setIsLoading(false)
            })
            .catch((err) => {
                console.log("Err on get profile: ", err);
                setIsLoading(false)
            });
    };

    const loadAvailabilitySummary = () => {
        setAvailabilityLoading(true);
        getMyAvailability(
            (response: any) => {
                const availability = normalizeAvailabilityResponse(response);
                setAvailabilitySummary(
                    buildAvailabilitySummary(availability.rules, availability.exceptions)
                );
                setAvailabilityLoading(false);
            },
            () => {
                setAvailabilitySummary(null);
                setAvailabilityLoading(false);
            }
        );
    };

    useFocusEffect(
        useCallback(() => {
            availabilityNavigationPendingRef.current = false;
            setAvailabilityNavigationPending(false);
            fetchProfile();
        }, [])
    );

    const handleManageAvailabilityPress = () => {
        if (availabilityNavigationPendingRef.current) return;
        availabilityNavigationPendingRef.current = true;
        setAvailabilityNavigationPending(true);
        router.push("/(app)/manage/availability" as any);
    };

    const handleProfileDisplay = (profile: any) => {
        // setProfileDisplayName
        switch (profile.professional_type) {
            case ProTypes.LAWYER: {
                setProfileDisplayName(`${profile.first_name ?? ""}  ${profile.last_name ?? ""}`)
                setExpertiseSection({
                    label: t('profile.area_of_legal_expertise'),
                    value: profile.legal_expertise
                })
                setEmployerSection(
                    profile.work_experiences
                )
                setSkillInfo(profile.skills)
                setServiceInfo(profile.services)
                setSelectedTypeSection(
                    {
                        label: t("account.licence"),
                        value: profile.sra_bsb ?? ""
                    }
                )
                break;
            }
            case ProTypes.LAW_FIRM: {
                setProfileDisplayName(`${profile.firm_name ?? ""}`)
                setExpertiseSection({
                    label: t('account.practice_areas'),
                    value: profile.practice_areas
                })
                setEmployerSection(null)
                setSkillInfo(profile.skills)
                setServiceInfo(profile.services)
                setSelectedTypeSection(
                    {
                        label: t("account.licence"),
                        value: profile.sra_bsb ?? ""
                    }
                )
                break;
            }
            case ProTypes.HR_LEGAL: {
                setProfileDisplayName(`${profile.first_name ?? ""}  ${profile.last_name ?? ""}`)
                setExpertiseSection(null)
                setEmployerSection(null)
                setSkillInfo(profile.skills)
                setServiceInfo(profile.services)
                setSelectedTypeSection(
                    {
                        label: t("account.licence"),
                        value: profile.hr_legal_type ?? ""
                    }
                )
                break;
            }
            case ProTypes.A2J_PARTNERS: {
                setProfileDisplayName(`${profile.organisation_name ?? ""}`)
                setExpertiseSection({
                    label: t('profile.areas_of_legal_focus'),
                    value: profile.areas_of_legal_focus
                })
                setEmployerSection(null)
                setSkillInfo(profile.skills)
                setServiceInfo(profile.services)
                setSelectedTypeSection(
                    {
                        label: t('account.org_type'),
                        value: profile.organisation_type ?? ""
                    }
                )
                break;
            }
        }
    }


    const handleChangeProfile = async () => {
        setProfileLoading(true);

        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                alert(t('per.camera_roll'));
                setProfileLoading(false);
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled) {
                const localUri = result.assets[0].uri;
                const filename = localUri.split("/").pop();
                const match = /\.(\w+)$/.exec(filename || "");
                const type = match ? `image/${match[1]}` : "image";

                const formData = new FormData();
                formData.append("file", {uri: localUri, name: filename, type} as any);

                const response = await UserService.UpdateProfilePic(formData);
                //console.log("Change Profile Response:", response)
                const profileUrl = response?.file_info?.url ?? null;

                if (profileUrl) {
                    setProfilePic(profileUrl);
                }
            } else {
                console.log("Image selection was canceled.");
            }
        } catch (error: any) {
            console.log("Error updating profile picture:", error.response ? error.response.data : error.message);
        }

        setProfileLoading(false);
    };

    const Header = () => (
        <View style={[styles.header]}>
            {/*<TouchableOpacity*/}
            {/*    onPress={() => router.replace("/(app)/(tabs)")}*/}
            {/*    style={styles.backButton}*/}
            {/*    accessibilityRole="button"*/}
            {/*    accessibilityLabel="Go back to home"*/}
            {/*>*/}
            {/*    <MaterialIcons name="arrow-back-ios" size={24}/>*/}
            {/*</TouchableOpacity>*/}

            {/*/!*<TouchableOpacity*/}
            {/*    onPress={() => router.navigate("/(app)/(tabs)/profile/profile-pro")}*/}
            {/*    style={styles.hamburger}*/}
            {/*>*/}
            {/*    <Image*/}
            {/*        source={require("@/assets/images/hamburger-icon.png")}*/}
            {/*        style={{*/}
            {/*            width: wp(5),*/}
            {/*            height: wp(5),*/}
            {/*        }}*/}
            {/*    />*/}
            {/*</TouchableOpacity>*!/*/}

            {/*<TouchableOpacity*/}
            {/*    style={[styles.hamburger, {zIndex: 999}]}*/}
            {/*    onPress={() => {*/}
            {/*        const responseString = encodeURIComponent(JSON.stringify(response));*/}
            {/*        router.push(`/(app)/(tabs)/profile/profile-edit?details=${responseString}`);*/}
            {/*    }}>*/}
            {/*    <EditIcon/>*/}
            {/*</TouchableOpacity>*/}
        </View>
    )

    const UserProfile = () => (
        <View style={[styles.imageContainer]}>
            <TouchableOpacity
                onPress={() => router.replace("/(app)/(tabs)")}
                style={[styles.backButton, {position: 'absolute', top: 16, left: 28}]}
                accessibilityRole="button"
                accessibilityLabel={t('account.go_back_home')}
            >
                <MaterialIcons name="arrow-back-ios" size={24}/>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.hamburger, {position: 'absolute', top: 16, right: 28}]}
                onPress={() => {
                    const responseString = encodeURIComponent(JSON.stringify(response));
                    router.push(`/(app)/(tabs)/profile/profile-edit?details=${responseString}`);
                }}>
                <EditIcon/>
            </TouchableOpacity>
            <View>


                <TouchableOpacity
                    style={styles.imageWrapper}
                    onPress={handleChangeProfile}
                >
                    {
                        profilePic == null ?
                            <View style={[styles.image, {
                                backgroundColor: COLORS.Gray,
                                justifyContent: "center",
                                alignItems: "center"
                            }]}>
                                <FontAwesome6
                                    name="user"
                                    size={wp(20)}
                                    color={COLORS.White}
                                />
                            </View>
                            :

                            <CachedAvatar
                                uri={profilePic}
                                style={styles.image}
                            />
                    }
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        position: 'absolute',
                        bottom: 0,

                        right: wp(5)
                    }}
                    onPress={handleChangeProfile}
                >
                    <Image
                        source={require("@/assets/images/ic_edit.png")}
                        style={{
                            height: 32,
                            width: 32,
                        }}
                    />
                </TouchableOpacity>
            </View>
            {isProfileLoading && (
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
    )

    const EditIcon = () => (
        <Image
            style={styles.editIcon}
            source={require("@/assets/images/ic_pencil.png")}/>
    )

        const UserNameDesc = () => (
            <View style={{
                flex: 1
            }}>
                <View style={styles.infoSection}>
                    <Text style={styles.userName}>{profileDisplayName}</Text>
                </View>
                <IdentityVerificationBadge/>
                <JoinedDate/>

                <Text style={styles.userNameDesc}>
                    {userInfo?.description || ""}
                </Text>

            {/*<EditIcon/>*/}
        </View>
    )

    const Achievements = () => (
        selectedTypeSection !== undefined && selectedTypeSection !== null &&
        <View>
            <View style={styles.achievementsContainer}>
                {/*<View style={styles.achievement}>
                <Text style={styles.achievementText1}>{achievementsInfo.satisfied}</Text>
                <Text style={styles.achievementText2}>Satisfied</Text>
            </View>
            <View style={styles.achievement}>
                <Text style={styles.achievementText1}>{achievementsInfo.casesHelped}</Text>
                <Text style={styles.achievementText2}>Cases Helped</Text>
            </View>*/}
                <View style={styles.achievement}>
                    <View style={{flexDirection: "row", alignItems: "center", gap: 5}}>
                        <MaterialIcons
                            name="verified"
                            size={20}
                            color={COLORS.PrimaryColor}
                        />
                        <Text style={styles.achievementText1}>{selectedTypeSection.value}</Text>
                    </View>
                    <Text style={styles.achievementText2}>{selectedTypeSection.label}</Text>
                </View>
            </View>
            <Divider top={16}/>
        </View>
    )

    const ReviewBtn = () => (
        <TouchableOpacity
            onPress={() => {
            }}
            style={{
                marginTop: 40,
                width: "100%",
                borderColor: COLORS.PrimaryColor,
                borderWidth: 2,
                borderRadius: BORDER_RADIUS.full,
                height: 48,
                justifyContent: 'center',
                alignItems: 'center',
            }}>
            <Text style={{
                fontFamily: 'InstrumentSansSemiBold',
                fontSize: 18,
                color: COLORS.PrimaryColor
            }}>
                {t('reviews')}
            </Text>
        </TouchableOpacity>
    )

    const Divider = ({top}: {top: number}) => (
        <View style={{
            height: 0.5,
            marginTop: top,
            backgroundColor: COLORS.Gray_2
        }}/>
    )

    const AboutContainer = () => (
        userInfo?.about !== undefined && userInfo?.about !== null && userInfo?.about !== "" &&
        <View>
            <View style={styles.section}>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        width: "100%",
                        paddingBottom: SPACING.sm,
                    }}
                >
                    <Text style={styles.sectionTitle}>{t('setting.about')}</Text>
                    {/*<EditIcon/>*/}
                </View>
                <Text style={styles.sectionText}>
                    {userInfo?.about || ""}
                </Text>
            </View>
            <Divider top={0}/>
        </View>
    )

    const ExpertiseContainer = () => {
        return(
            expertiseSection !== undefined && expertiseSection !== null && expertiseSection.value.length > 0 && (
                <View>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{expertiseSection.label ?? ""}</Text>
                        <View style={{marginTop: 16}}>
                            {
                                expertiseSection && expertiseSection?.value?.map((item, index) => (
                                    <View
                                        style={{flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 5}}
                                        key={index}
                                    >
                                        <MaterialIcons
                                            name="verified"
                                            size={20}
                                            color={COLORS.PrimaryColor}
                                        />
                                        <Text style={styles.sectionText}>{item?.label || item}</Text>
                                    </View>
                                ))
                            }
                        </View>
                    </View>
                    <Divider top={0}/>
                </View>
            )
        )
    }

    const ProfessionalContainer = () => (
        employerSection !== undefined && employerSection !== null && employerSection.length > 0 && (
            <View>
                <View style={styles.section}>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            width: "100%",
                        }}
                    >
                        <Text style={styles.sectionTitle}>{t('profile.professional_employer')}</Text>
                        {/*<EditIcon/>*/}
                    </View>
                    <View style={{flexDirection: "column", marginTop: 16}}>
                        {employerSection?.map((item, index) => (
                            <View key={index}
                                  style={{flexDirection: 'row', marginTop: index !== 0 ? 35 : 0}}>
                                <Image
                                    source={require("@/assets/images/lawicon.png")}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        resizeMode: "contain",
                                    }}
                                />
                                <View style={{
                                    marginStart: 8,
                                    flex: 1,
                                }}>
                                    <Text style={styles.professionalItemTitle} allowFontScaling={false}>
                                        {item.company_name}
                                    </Text>
                                    <Text style={styles.professionalItemDuration } allowFontScaling={false}>
                                        {`${item.start_date} to ${item.end_date}`}
                                    </Text>
                                    <Text
                                        style={[styles.professionalItemDesc]}
                                        allowFontScaling={false}
                                    >
                                        {item.achievement}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
                <Divider top={0}/>
            </View>
        )
    )

    const ServiceContainer = () => (
        serviceInfo !== undefined && serviceInfo !== null && serviceInfo.length > 0 && (
            <View>
                <View style={styles.section}>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            width: "100%",
                        }}
                    >
                        <Text style={styles.sectionTitle}>{t('profile.services')}</Text>
                        {/* <EditIcon/>*/}
                    </View>
                    <View style={{flexDirection: "column", marginTop: 16}}>
                        {
                            serviceInfo?.map((item, index) => (
                                <View
                                    key={index}
                                    style={{flexDirection: "row", alignItems: "center"}}>
                                    <Entypo name="dot-single" size={24} color={COLORS.Black}/>
                                    <Text style={styles.serviceText}>
                                        {item?.label || item}
                                    </Text>
                                </View>
                            ))
                        }
                    </View>
                </View>
                <Divider top={0}/>
            </View>
        )
    )

    const SkillContainer = () => (
        skillInfo !== undefined && skillInfo !== null && skillInfo.length > 0 &&
        (
            <View>
                <View style={styles.section}>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            width: "100%",
                        }}
                    >
                        <Text style={styles.sectionTitle}>{t('profile.skills')}</Text>
                        {/*<EditIcon/>*/}
                    </View>

                    <View style={{marginTop: 16}}>
                        {
                            skillInfo?.map((item, index) => (
                                <View
                                    key={index}
                                    style={[styles.skill, {marginTop: index !== 0 ? 10 : 0}]}>
                                    <Text style={styles.skillText} allowFontScaling={false}>
                                        {item?.label || item}
                                    </Text>
                                </View>
                            ))
                        }
                    </View>
                </View>
                <Divider top={0}/>
            </View>
        )
    )

    const DetailContainer = () => (
        <View style={[styles.section]}>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    width: "100%",
                }}
            >
                <Text style={styles.sectionTitle}>{t('account.details')}</Text>
            </View>

            <CustomInput
                label={t('email')}
                value={userInfo?.email || ""}
                top={16}
            />
            <CustomInput
                label={t('phone_number')}
                value={userInfo?.phoneNumber || ""}
                top={24}
            />
            <CustomInput
                label={t('user_name')}
                value={userInfo?.userName || ""}
                top={24}
            />

            {(userInfo?.hourly_rate && userInfo.hourly_rate > 0) &&
                <CustomInput
                    label={t('rate_of_hour')}
                    value={userInfo?.hourly_rate.toString() || ""}
                    top={24}
                />
            }
        </View>
    )

    const JoinedDate = () => (
        joinedDateText ? (
            <Text
                style={[styles.joinedDate, {color: joinedDateColor}]}
                numberOfLines={1}
                allowFontScaling={false}
            >
                {joinedDateText}
            </Text>
        ) : null
    )

    const ProfessionalAccountContainer = () => {
        const canManageAvailability = userType === ProTypes.LAWYER || userType === ProTypes.LAW_FIRM;
        if (!canManageAvailability) return null;

        return (
            <View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Professional Account</Text>
                    <TouchableOpacity
                        style={styles.accountAction}
                        onPress={handleManageAvailabilityPress}
                        disabled={availabilityNavigationPending}
                    >
                        <View style={styles.accountActionIcon}>
                            <MaterialIcons name="event-available" size={22} color={COLORS.SecodaryColor}/>
                        </View>
                        <View style={styles.accountActionText}>
                            <Text style={styles.accountActionTitle}>Manage Availability</Text>
                            <Text style={styles.accountActionDescription}>
                                Set weekly hours, one-off dates, and live status.
                            </Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={22} color={COLORS.Gray_2}/>
                    </TouchableOpacity>
                    <View style={styles.availabilitySummaryCard}>
                        <Text style={styles.availabilitySummaryTitle}>Your availability</Text>
                        {availabilityLoading ? (
                            <ActivityIndicator size="small" color={COLORS.SecodaryColor} style={{alignSelf: "flex-start", marginTop: 8}}/>
                        ) : availabilitySummary && (
                            availabilitySummary.weeklyWindows.length > 0 ||
                            availabilitySummary.oneOffAvailableCount > 0 ||
                            availabilitySummary.oneOffUnavailableCount > 0
                        ) ? (
                            <>
                                {availabilitySummary.weeklyWindows.slice(0, 3).map((windowText, index) => (
                                    <Text key={`${windowText}-${index}`} style={styles.availabilitySummaryText}>
                                        {windowText}
                                    </Text>
                                ))}
                                {availabilitySummary.weeklyWindows.length > 3 && (
                                    <Text style={styles.availabilitySummaryMeta}>
                                        +{availabilitySummary.weeklyWindows.length - 3} more weekly window{availabilitySummary.weeklyWindows.length - 3 === 1 ? "" : "s"}
                                    </Text>
                                )}
                                {(availabilitySummary.oneOffAvailableCount > 0 || availabilitySummary.oneOffUnavailableCount > 0) && (
                                    <Text style={styles.availabilitySummaryMeta}>
                                        {availabilitySummary.oneOffAvailableCount} one-off available, {availabilitySummary.oneOffUnavailableCount} unavailable
                                    </Text>
                                )}
                            </>
                        ) : (
                            <Text style={styles.availabilitySummaryMeta}>
                                No availability set yet.
                            </Text>
                        )}
                    </View>
                </View>
                <Divider top={0}/>
            </View>
        );
    }

    const CustomInput = ({top, label, value}: CustomInputProps) => (
        <View style={{
            marginTop: top
        }}>
            <Text style={styles.formLabel} allowFontScaling={false}>
                {label}
            </Text>
            <View style={[styles.formField, {flex: 1, flexDirection: 'row', justifyContent: 'center'}]}>
                <TextInput
                    style={{
                        flex: 1,
                        fontFamily: "InstrumentSansRegular",
                        fontSize: 18,
                    }}
                    allowFontScaling={false}
                    value={value}
                    editable={false}
                    onChangeText={() => {
                    }}
                />

                {/* <TouchableOpacity
                    style={{alignItems: 'center', justifyContent: 'center'}}>
                    <EditIcon/>
                </TouchableOpacity>*/}
            </View>
        </View>
    )

    const AccountSecurityContainer = () => (
        <View style={[styles.section, {paddingBottom: 20}]}>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    width: "100%",
                }}
            >
                <Text style={styles.sectionTitle}>{t('profile.account_security')}</Text>
            </View>

            <CustomInput
                label={"Password"}
                value={userInfo?.password || ""}
                top={16}
            />
        </View>
    )

    const SaveBtn = () => (
        <TouchableOpacity
            onPress={() => {

            }}
            style={{
                marginVertical: 40,
                width: "100%",
                backgroundColor: COLORS.SecodaryColor,
                borderRadius: BORDER_RADIUS.full,
                height: 48,
                justifyContent: 'center',
                alignItems: 'center',
            }}>

            <Text style={styles.saveBtnText}>
                {t('save')}
            </Text>
        </TouchableOpacity>
    )

    return (
        <SafeAreaView
            style={[styles.container, {paddingBottom: Platform.OS === 'android' ? insets.bottom + 80 : insets.bottom + 40}]}>
            <Animated.ScrollView
                style={styles.scrollContainer}
                // contentContainerStyle={{ paddingTop: hp(12) }}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{nativeEvent: {contentOffset: {y: scrollY}}}],
                    {useNativeDriver: false}
                )}
            >
                <Header/>
                <UserProfile/>
                <View style={styles.content}>
                    <UserNameDesc/>
                    <Achievements/>
                        <ProfessionalAccountContainer/>
                        <AboutContainer/>
                        <ExpertiseContainer/>
                        <ProfessionalContainer/>
                        <ServiceContainer/>
                        <SkillContainer/>
                        <DetailContainer/>
                        {/* <AccountSecurityContainer/>
                    <SaveBtn/>*/}
                </View>
            </Animated.ScrollView>

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
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.White,
    },
    header: {
        width: "100%",
        backgroundColor: COLORS.BackgroundColor,
        height: hp(12),
        paddingHorizontal: 28,
        flexDirection: "row",
        alignItems: "center",
    },
    backButton: {
        width: 40,
        height: 40,
    },
    imageContainer: {
        width: "100%",
        alignItems: "center",
        position: "absolute",
        top: 10,
        zIndex: 1,
        height: hp(20),
    },
    imageWrapper: {
        width: wp(40),
        height: wp(40),
        borderRadius: wp(100),
        overflow: "hidden",
        borderColor: COLORS.White,
        borderWidth: 5,
        justifyContent: "center",
        alignItems: "center",
    },
    image: {
        width: wp(40),
        height: wp(40),
    },
    scrollContainer: {
        flex: 1,

        backgroundColor: COLORS.White,
    },
    content: {
        paddingHorizontal: SPACING.lg,
        backgroundColor: COLORS.White,
        marginTop: wp(20),
    },
    infoSection: {
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        gap: 5,
    },
    userName: {
        fontFamily: "InstrumentSansBold",
        fontSize: 18,
        color: COLORS.Black,
    },
    userNameDesc: {
        textAlign: "center",
        fontFamily: "InstrumentSansRegular",
        fontSize: 16,
        color: COLORS.Black,
    },
    editIcon: {
        height: 20,
        width: 20,
        position: 'absolute',
        top: 0,
        right: 0
    },
    achievementsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        // paddingHorizontal: 30,
        paddingTop: 28,
    },
    achievement: {
        justifyContent: "center",
    },
    achievementText1: {
        fontFamily: "InstrumentSansBold",
        fontSize: 16,
        color: COLORS.Black,
    },
    achievementText2: {
        fontFamily: "InstrumentSansRegular",
        fontSize: 13,
        marginTop:5,
        marginStart:5,
        color: COLORS.Black,
    },
    section: {
        marginVertical: 16,
    },
    sectionTitle: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: 18,
        color: COLORS.PrimaryColorText,
    },
    sectionText: {
        fontFamily: "InstrumentSansRegular",
        fontSize: 16,
        color: COLORS.Black,
    },
    accountAction: {
        minHeight: 68,
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: "#F7F7F7",
    },
    accountActionIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFF0E7",
        marginRight: 12,
    },
    accountActionText: {
        flex: 1,
    },
    accountActionTitle: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: 15,
        color: COLORS.PrimaryColorText,
    },
    accountActionDescription: {
        fontFamily: "InstrumentSansRegular",
        fontSize: 12,
        color: COLORS.Gray,
        marginTop: 3,
        lineHeight: 16,
    },
    availabilitySummaryCard: {
        marginTop: 10,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E6E6E6",
        backgroundColor: COLORS.White,
    },
    availabilitySummaryTitle: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: 13,
        color: COLORS.PrimaryColorText,
        marginBottom: 6,
    },
    availabilitySummaryText: {
        fontFamily: "InstrumentSansRegular",
        fontSize: 13,
        color: COLORS.Black,
        marginTop: 3,
    },
    availabilitySummaryMeta: {
        fontFamily: "InstrumentSansRegular",
        fontSize: 12,
        color: COLORS.Gray,
        marginTop: 5,
        lineHeight: 16,
    },
    sectionDescription: {
        fontFamily: "InstrumentSansRegular",
        fontSize: RFValue(12),
        color: COLORS.PrimaryColorText,
    },
    professionalItemTitle: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: 14,
        color: COLORS.Black,
        width: "100%",
    },
    professionalItemDuration: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: 14,
        color: COLORS.PrimaryColor,
        width: "100%",
        marginTop: 5,
    },
    professionalItemDesc: {
        marginTop: 5,
        fontFamily: "InstrumentSansRegular",
        fontSize: 14,
        color: COLORS.Black,
    },
    serviceText: {
        fontFamily: "InstrumentSansRegular",
        fontSize: 16,
        color: COLORS.Black,
    },
    skill: {
        borderWidth: 1,
        borderRadius: 49,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        alignSelf: 'flex-start',
    },
    skillText: {
        fontFamily: "InstrumentSansMedium",
        fontSize: 16,
        color: COLORS.Black,
    },
    formLabel: {
        fontFamily: "InstrumentSansMedium",
        fontSize: 14,
        color: COLORS.Gray_2,
    },
    formField: {
        marginTop: 5,
        borderRadius: 104,
        paddingHorizontal: 20,
        height: 48,
        overflow: "hidden",
        backgroundColor: "#E7E7E7",
    },
    hamburger: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "flex-end",
        marginLeft: "auto",
    },
    saveBtnText: {
        fontFamily: 'InstrumentSansSemiBold',
        fontSize: 18,
        color: COLORS.White
        },
        joinedDate: {
            marginTop: SPACING.xs,
            marginBottom: SPACING.sm,
            textAlign: "center",
            fontFamily: "InstrumentSansSemiBold",
            fontSize: RFValue(12),
        }
});

export default ProfileProUser;

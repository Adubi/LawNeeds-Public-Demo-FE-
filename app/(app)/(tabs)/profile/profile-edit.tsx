import React, {useEffect, useState} from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    type KeyboardTypeOptions,
} from "react-native";
import {router, useLocalSearchParams} from "expo-router";
import {MaterialIcons} from "@expo/vector-icons";
import {COLORS} from "@/constants/colors";
import {BORDER_RADIUS, SPACING} from "@/constants/theme";
import {SafeAreaView, useSafeAreaInsets} from "react-native-safe-area-context";
import {ProTypes} from "@/constants/protypes";
import {Checkbox} from "@/components/Checkbox";
import {Button} from "@/components/Button";
import CustomDatePicker from "@/components/DatePicker";
import UserService from "@/services/UserServices";
import {useTranslation} from 'react-i18next';
import {CachedAvatar} from "@/components/CachedAvatar";

type ChooseOptionType =
    'expertise' |
    'skill' |
    'services'

interface Service {
    id: string;
    name: string;
}

interface Skill {
    id: string;
    name: string;
}

type CustomInputProps = {
    top?: number;
    lines?: number;
    label: string;
    labelChars?: string;
    placeHolder?: string;
    value: string;
    type?: KeyboardTypeOptions;
    disable?:boolean;
    onValueChange: (value: string) => void;
};

type OptionType = {
    id?: string | number;
    key: string;
    label: string;
};

interface ExpertiseSection {
    label: string;
    key: string;
    id?: number;
    value: OptionType[]
}

interface EmployerSection {
    label: string;
    key: string;
    value: EmployerObj[]
}

interface SkillSection {
    label: string;
    key: string;
    id?: number;
    value: OptionType[]
}

interface ServiceSection {
    label: string;
    key: string;
    id?: number;
    value: OptionType[]
}

interface DetailSection {
    label: string;
    key: string;
    value: string;
    type?: KeyboardTypeOptions;
    disable?: boolean;
}

interface EmployerObj {
    id: string;
    company_name: string;
    achievement: string;
    start_date: string;
    end_date: string;
    created_at: string;
    updated_at: string;
}

interface ProfileDisplay {
    label: string,
    key: string,
    value: string;
}

const CustomInput = ({top, label, placeHolder, value, disable, type ,onValueChange}: CustomInputProps) => (
    <View
        style={{
            marginTop: top
        }}>
        <Text style={styles.formLabel} allowFontScaling={false}>
            {label}
        </Text>
        <View style={[styles.formField]}>
            <TextInput
                style={{
                    flex: 1,
                    fontFamily: "InstrumentSansRegular",
                    fontSize: 16,
                }}
                keyboardType={type}
                placeholder={placeHolder}
                allowFontScaling={false}
                value={value}
                editable={ disable ? !disable :true}
                onChangeText={onValueChange}
            />
        </View>
    </View>
)

const CustomInputMultiLine = ({top, label, labelChars, value, onValueChange}: CustomInputProps) => (
    <View
        style={{
            marginTop: top
        }}>
        <Text style={styles.formLabel} allowFontScaling={false}>
            {label}
        </Text>
        <View style={[styles.formFieldMultliLine, {flex: 1, flexDirection: 'row'}]}>
            <TextInput
                style={{
                    flex: 1,
                    fontFamily: "InstrumentSansRegular",
                    fontSize: 16,
                    textAlignVertical: "top",
                }}
                multiline
                maxLength={500}
                numberOfLines={8}
                allowFontScaling={false}
                value={value}
                editable={true}
                onChangeText={onValueChange}
            />
        </View>
        <Text style={styles.limitText}>{value.length}/500 {labelChars}</Text>
    </View>
)

type ChooseOptionModalProps = {
    visible: boolean;
    section: ExpertiseSection | SkillSection | ServiceSection | null;
    options: OptionType[];
    toggle: (item: OptionType) => void;
    doneLabel: string;
    onClose: () => void;
    t: (key: string) => string;
};

const ChooseOptionModal = ({
                               visible,
                               section,
                               options,
                               toggle,
                               doneLabel,
                               onClose,
                               t
                           }: ChooseOptionModalProps) => {

   return (
        section !== undefined && section !== null &&
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>
                        {t('search.select') + ` ${section.label}`}
                    </Text>
                    <FlatList
                        data={options}
                        keyExtractor={(item) => item.key}
                        renderItem={({item}) => {
                            return(
                                <View style={{padding: 10}}>
                                    <Checkbox
                                        checked={section.value.some((selected: OptionType) => selected.id === item.id)}
                                        onCheck={() => {
                                            toggle(item);
                                        }}
                                        label={item.label}
                                    />
                                </View>
                            )
                        }}
                    />
                    <Button
                        title={doneLabel}
                        onPress={onClose}
                        style={{marginTop: 5}}
                        variant={'primary'}
                    />
                </View>
            </View>
        </Modal>
    )
};

export interface UserInfo {
    firstName: string;
    lastName: string;
    description: string;
    about: string;
    email: string;
    profilePic: string | File | null; // Flexible for null or data
    phoneNumber: string;
    userName: string;
    password: string;
    hourly_rate?: number | null | undefined;
}

const EditProfile = () => {

    const {t} = useTranslation();

    const insets = useSafeAreaInsets();
    const {details} = useLocalSearchParams();

    const [profileDisplaySection, setProfileDisplaySection] = useState<ProfileDisplay[] | null>(null)
    const [detailsSection, setDetailsSection] = useState<DetailSection[] | null>(null)
    const [expertiseSection, setExpertiseSection] = useState<ExpertiseSection | null>(null)
    const [employerSection, setEmployerSection] = useState<EmployerSection | null>(null)

    const [userType, setUserType] = useState<string | null>(null)
    const [userInfo, setUserInfo] = useState<UserInfo>({
        hourly_rate: 0,
        firstName: '',
        lastName: '',
        description: '',
        about: '',
        email: '',
        profilePic: null,
        phoneNumber: '',
        userName: '',
        password: ''
    });


    const [services, setServiceInfo] = useState<ServiceSection | null>(null);
    const [skills, setSkillInfo] = useState<SkillSection | null>(null);

    const allLicenceTypes = ["SRA", "BSB", "IAA"];
    const allHRSectorTypes = ["HR", "Legal", "Both"];
    const allOrganisationType = ["Legal Aid Organisation", "Law Centre", "Pro-Bono Clinic"];


    const [typesOptions, setTypesOptions] = useState<string[]>([])
    const [selectedTypesOption, setSelectedTypesOption] = useState<string>("")

    const [chooseOptionModelVisible, setChooseOptionModelVisible] = useState(false)
    const [chooseOptionModelType, setChooseOptionModelType] = useState<ChooseOptionType>('expertise')

    const [activeStartDateIndex, setActiveStartDateIndex] = useState<number | null>(null);
    const [activeEndDateIndex, setActiveEndDateIndex] = useState<number | null>(null);
    const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
    const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
    const [isAddAnotherDisabled, setAddAnotherDisabled] = useState(false);

    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        if (details) {
            try {

                const rawDetails = Array.isArray(details) ? details[0] : details;
                const parsed = JSON.parse(decodeURIComponent(rawDetails));
                setUserType(parsed.professional_type)

                setUserInfo({
                    firstName: parsed.first_name,
                    lastName: parsed.last_name,
                    email: parsed.email,
                    userName: parsed.user_name,
                    profilePic: parsed.profile_picture_path,
                    about: "",
                    description: "",
                    password: "",
                    phoneNumber: "",
                    hourly_rate: parsed.hourly_rate ? parsed.hourly_rate : (parsed.firm_hourly_rate ? parsed.firm_hourly_rate : 0)
                });

                handleProfileDisplay(parsed)
                setIsLoading(false)
            } catch (e) {
                console.error("Failed to parse details:", e);
                setIsLoading(false)
            }
        }
    }, [details]);

    // useEffect(() => {
    //     const isAnyEmployerInvalid = employerSection?.value?.some((employer) =>
    //         Object.values(employer).some((value) => value === "")
    //     ) ?? false; // fallback to false if employerSection is null or value is undefined
    //     console.log("employer: ", employerSection)
    //     setAddAnotherDisabled(isAnyEmployerInvalid);
    // }, [employerSection]);
    useEffect(() => {
        const isAnyEmployerInvalid =
            employerSection?.value?.some((employer) => {
                return (
                    !employer.achievement ||
                    !employer.company_name ||
                    !employer.start_date ||
                    !employer.end_date
                );
            }) ?? false;

        // console.log("employer: ", employerSection);
        setAddAnotherDisabled(isAnyEmployerInvalid);
    }, [employerSection]);


    const handleProfileDisplay = (profile: any) => {
        /**
         * HELPER: This replaces the repetitive .toLowerCase().replace().map()
         * logic found in every case of your original switch.
         */
        const mapToLocalizedSection = (rawItems: any[] = [], translationKey: string) => {
            const allOptions = t(translationKey, { returnObjects: true }) as any[];

            return (rawItems ?? []).map(item => {

                // ✅ NEW API (id based)
                if (typeof item === 'object' && item !== null && item.id) {
                    const match = allOptions.find((opt: any) => opt.id === item.id);
                    return match || {
                        id: item.id,
                        key: item.key || '',
                        label: item.label || ''
                    };
                }

                // ✅ OLD API fallback
                const labelValue = (typeof item === 'object' && item !== null)
                    ? item.label
                    : item;

                if (!labelValue) return { id: -1, key: '', label: '' };

                const key = labelValue
                    .toLowerCase()
                    .replace(/[^\w\s]/g, '')
                    .replace(/\s+/g, '_');

                const match = allOptions.find((opt: any) => opt.key === key);

                return match || { id: -1, key, label: labelValue };
            });
        };

        // --- Set Common Details (Shared by all types) ---
        setDetailsSection([
            {
                label: t('phone_number'),
                key: "phone_number",
                type: "number-pad",
                value: profile.phone_number ?? ""
            }, {
                label: t('user_name'),
                key: "user_name",
                disable: true,
                value: profile.user_name ?? ""
            }
        ]);

        // --- Type Specific Logic ---
        switch (profile.professional_type) {
            case ProTypes.LAWYER: {
                setProfileDisplaySection([
                    { label: t('profile.first_name'), key: "first_name", value: profile.first_name },
                    { label: t('profile.last_name'), key: "last_name", value: profile.last_name },
                    { label: t('profile.about'), key: "about", value: profile.about ?? "" },
                    { label: t('rate_of_hour'), key: "hourly_rate", value: profile.hourly_rate ? profile.hourly_rate.toString() : "0" }
                ]);

                setExpertiseSection({
                    label: t('profile.area_of_legal_expertise'),
                    key: "legal_expertise",
                    value: mapToLocalizedSection(profile.legal_expertise, 'expertiseOptions')
                });

                setEmployerSection({
                    label: t('profile.professional_employer'),
                    key: "work_experiences",
                    value: profile.work_experiences
                });

                setSkillInfo({
                    label: t('profile.skills'),
                    key: "skills",
                    value: mapToLocalizedSection(profile.skills, 'skillsOptions')
                });

                setServiceInfo({
                    label: t('profile.services'),
                    key: "services",
                    value: mapToLocalizedSection(profile.services, 'servicesOptions')
                });

                setTypesOptions(allLicenceTypes);
                setSelectedTypesOption(profile.sra_bsb || "");
                break;
            }

            case ProTypes.LAW_FIRM: {
                setProfileDisplaySection([
                    { label: t('profile.firm_name'), key: "firm_name", value: profile.firm_name },
                    { label: t('profile.about'), key: "about", value: profile.about ?? "" },
                    { label: t('profile.rate_of_hour'), key: "firm_hourly_rate", value: profile.firm_hourly_rate ? profile.firm_hourly_rate.toString() : "0" }
                ]);

                setExpertiseSection({
                    label: t('profile.practice_areas_label'),
                    key: 'practice_areas',
                    value: mapToLocalizedSection(profile.practice_areas, 'expertiseOptions')
                });

                setEmployerSection(null);
                setSkillInfo(null);

                setServiceInfo({
                    label: t('profile.services'),
                    key: "services",
                    value: mapToLocalizedSection(profile.services, 'servicesOptions')
                });

                setTypesOptions(allLicenceTypes);
                setSelectedTypesOption(profile.sra_bsb || "");
                break;
            }

            case ProTypes.HR_LEGAL: {
                setProfileDisplaySection([
                    { label: t('profile.first_name'), key: "first_name", value: profile.first_name },
                    { label: t('profile.last_name'), key: "last_name", value: profile.last_name },
                    { label: t('profile.about'), key: "about", value: profile.about ?? "" },
                    { label: t('profile.rate_of_hour'), key: "hourly_rate", value: profile.hourly_rate ? profile.hourly_rate.toString() : "0" }
                ]);

                setExpertiseSection(null);
                setEmployerSection(null);

                setSkillInfo({
                    label: t('profile.skills'),
                    key: "skills",
                    value: mapToLocalizedSection(profile.skills, 'skillsOptions')
                });

                setServiceInfo({
                    label: t('profile.services'),
                    key: "services",
                    value: mapToLocalizedSection(profile.services, 'servicesOptions')
                });

                setTypesOptions(allHRSectorTypes);
                setSelectedTypesOption(profile.hr_legal_type || "");
                break;
            }

            case ProTypes.A2J_PARTNERS: {
                setProfileDisplaySection([
                    { label: t('profile.organisation_name'), key: "organisation_name", value: profile.organisation_name },
                    { label: t('profile.about'), key: "about", value: profile.about ?? "" },
                    { label: t('profile.rate_of_hour'), key: "hourly_rate", value: profile.hourly_rate ? profile.hourly_rate.toString() : "0" }
                ]);

                setExpertiseSection({
                    label: t('profile.areas_of_legal_focus'),
                    key: "areas_of_legal_focus",
                    value: mapToLocalizedSection(profile.areas_of_legal_focus, 'skillsOptions') // Keeps your original 'skillsOptions' link
                });

                setEmployerSection(null);

                setSkillInfo({
                    label: t('profile.skills'),
                    key: "skills",
                    value: mapToLocalizedSection(profile.skills, 'skillsOptions')
                });

                setServiceInfo({
                    label: t('profile.services'),
                    key: "services",
                    value: mapToLocalizedSection(profile.services, 'servicesOptions')
                });

                setTypesOptions(allOrganisationType);
                setSelectedTypesOption(profile.organisation_type || "");
                break;
            }
        }
    };

    const addEmployerSection = () => {
        if (employerSection !== undefined && employerSection !== null && employerSection?.value?.length < 4) {
            setEmployerSection((prev) => {
                const current = prev?.value ?? []
                const updatedValue = [
                    ...current,
                    {
                        id: "",
                        company_name: "",
                        achievement: "",
                        start_date: "",
                        end_date: "",
                        created_at: "",
                        updated_at: "",
                    }
                ];
                return {
                    ...prev!,
                    value: updatedValue,
                };
            })
        }
    };

    const getChooseOptions = (): OptionType[] => {
        switch (chooseOptionModelType) {
            case "expertise":
                return t('expertiseOptions', {returnObjects: true}) as OptionType[];
            case "services":
                return t('servicesOptions', {returnObjects: true}) as OptionType[];
            case "skill":
                return t('skillsOptions', {returnObjects: true}) as OptionType[];
        }
    }

    const getChooseSections = () => {
        switch (chooseOptionModelType) {
            case "expertise":
                return expertiseSection
            case "services":
                return services
            case "skill":
                return skills
        }
    }

    const toggleChooseOptions = (selectedOption: OptionType) => {
        const limits: Record<string, number> = {
            expertise: 2,
            skill: 4,
            services: 4,
            practice_areas: 4,
        };

        const updateSection = <
            T extends { value: OptionType[] }
        >(
            prev: T | null,
            maxLimit: number
        ): T => {
            const current = prev?.value ?? [];

            // ✅ check using ID
            const exists = current.some(item => item.id === selectedOption.id);

            const updatedValue = exists
                ? current.filter(item => item.id !== selectedOption.id)
                : current.length < maxLimit
                    ? [...current, selectedOption]
                    : current;

            return {
                ...prev!,
                value: updatedValue,
            };
        };

        const limit = limits[chooseOptionModelType] ?? 2;

        switch (chooseOptionModelType) {
            case "expertise":
                setExpertiseSection(prev => updateSection(prev, limit));
                break;
            case "skill":
                setSkillInfo(prev => updateSection(prev, limit));
                break;
            case "services":
                setServiceInfo(prev => updateSection(prev, limit));
                break;

        }
    };

    const handleProfileSectionChange = (str: string, index: number) => {
        setProfileDisplaySection((prev) => {
            if (!prev) return prev;
            const updated = [...prev];
            updated[index].value = str
            return updated;
        });
    };

    const handleDetailsSectionChange = (str: string, index: number) => {
        setDetailsSection((prev) => {
            if (!prev) return prev;
            const updated = [...prev];
            updated[index].value = str
            return updated;
        });
    };

    const handleEmployerChange = (str: string, index: number | null, type: "company_name" | "achievement" | "start_date" | "end_date") => {
        // console.log("handleEmployerChange", str, index, type)
        if (index === null) {
            return
        }

        setEmployerSection((prev) => {
            const current = prev?.value ?? []
            const updated = [...current];
            updated[index] = {
                ...updated[index],
                [type]: str,
            };
            return {
                ...prev!,
                value: updated
            }
        })
    };

    useEffect(() => {
        // console.log("employerSection", employerSection)
    }, [employerSection]);

    const updateInfo = async () => {
        try {
            setIsLoading(true)

            const profilePayload = profileDisplaySection?.reduce((acc, item) => {

                acc[item.key] = item.value;
                return acc;
            }, {} as Record<string, string>);


            const detailsPayload = detailsSection?.reduce((acc, item) => {
                acc[item.key] = item.value;
                return acc;
            }, {} as Record<string, string>);

            const expertiseData = expertiseSection
                ? {[expertiseSection.key]: expertiseSection.value}
                : {};

            const labels = expertiseSection?.value.map((item) => item.label) || [];
            const expertiseIds = expertiseSection?.value.map((item) => item.id) || [];
            const expertisePayload = expertiseSection
                ? {[expertiseSection.key]: labels}
                : {};
            const expertisePayloadIds = expertiseSection
                ? { "legal_expertise_ids" : expertiseIds}
                : {};

            const hRSectorPayload = userType === ProTypes.HR_LEGAL ?
                {["hr_legal_type"]: selectedTypesOption}
                : {};

            const licenceTypePayload = userType === ProTypes.LAWYER || userType === ProTypes.LAW_FIRM ?
                {["sra_bsb"]: selectedTypesOption}
                : {};

            const organisationTypePayload = userType === ProTypes.A2J_PARTNERS ?
                {["organisation_type"]: selectedTypesOption}
                : {};


            const servicesData = services
                ? {[services.key]: services.value}
                : {};
            const labelsServices = services?.value.map((item) => item.label) || [];
            const serviceIds = services?.value.map((item) => item.id) || [];
            const servicesPayload = services
                ? {[services.key]: labelsServices}
                : {};
            const servicesPayloadIds = services
                ? {"service_ids": serviceIds}
                : {};

            const skillsData = skills
                ? {[skills.key]: skills.value}
                : {};

            const labelSkills = skills?.value.map((item) => item.label) || [];
            const skillsIds = skills?.value.map((item) => item.id) || [];

            const skillsPayload = skills
                ? {[skills.key]: labelSkills}
                : {};

            const skillsPayloadIds = skills
                ? {"skill_ids": skillsIds}
                : {};


            const payload = {
                ...profilePayload,
                ...detailsPayload,
                ...expertisePayload,
                ...expertisePayloadIds,
                ...hRSectorPayload,
                ...licenceTypePayload,
                ...organisationTypePayload,
                ...(employerSection ? {[employerSection.key]: employerSection.value} : {}),
                ...servicesPayload,
                ...servicesPayloadIds,
                ...skillsPayload,
                ...skillsPayloadIds
            }

      //      console.log("payload", payload);

            const response = await UserService.UpdateProfile(payload);
          //  console.log("updatePro Info response:", response)

            if (response) {
                AppDialog(t('success.success'), t('profile.profile_updated_success'))
            } else {
                AppDialog(t('error.title'), t('error.error_msg'))
            }
        } catch (e: any) {

            const errorDetail = e?.response?.data?.detail;
            let message = t('error.error_msg');

            if (Array.isArray(errorDetail)) {
                message = errorDetail[0]?.msg ?? message;
            } else if (typeof errorDetail === "string") {
                message = errorDetail;
            }

           // console.log("updatePro Info response error:", errorDetail);
            AppDialog(t('error.title'), message);
        }
    }

    const AppDialog = (title: string, message: string) => {
        setIsLoading(false)
        Alert.alert(
            title,
            message,
            [
                {
                    text: t('ok'),
                    onPress: () => {
                        if(title !== "Error"){
                            router.back();
                        }

                    },
                },
            ],
            {cancelable: true}
        );
    }

    const Header = () => (
        <View style={[styles.header]}>
            <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
            >
                <MaterialIcons name="arrow-back-ios" size={24}/>
            </TouchableOpacity>
            <View style={{
                marginHorizontal: 20,
                flex: 1,
                flexDirection: 'column',
            }}>
                <Text style={styles.headerTitle}>{t('profile.edit_details')}</Text>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 3}}>
                    <Text style={styles.userNameText}>{userInfo.userName}</Text>
                    <Image
                        style={{
                            height: 18,
                            width: 18
                        }}
                        source={require("@/assets/images/ic_verified.png")}
                    />
                </View>
            </View>
            {userInfo.profilePic === null ? (
                <Image
                    source={require("@/assets/images/user-image.png")}
                    style={styles.avatar}
                />
            ) : (
                <CachedAvatar uri={String(userInfo.profilePic)} style={styles.avatar}/>
            )}
        </View>
    )

    const Divider = ({top}: {top: number}) => (
        <View style={{
            height: 1,
            marginTop: top,
            backgroundColor: COLORS.Black
        }}/>
    )

    const ExpertiseInfo = () => (
        expertiseSection !== undefined && expertiseSection !== null &&
        (
            <View style={{marginHorizontal: 25, marginTop: 58}}>
                <Text style={styles.formLabel}>{expertiseSection.label}</Text>
                <TouchableOpacity
                    style={styles.chipContainer}
                    onPress={() => {
                        setChooseOptionModelType('expertise')
                        setChooseOptionModelVisible(true)
                    }}
                >
                    {/*{*/}
                    {/*    expertiseSection.value.length > 0 ?*/}
                    {/*        expertiseSection.value.map((item, index) => (*/}
                    {/*            <View key={index} style={styles.chip}>*/}
                    {/*                <Text style={styles.chipText}>{item}</Text>*/}
                    {/*            </View>*/}
                    {/*        ))*/}
                    {/*        :*/}
                    {/*        <View style={styles.chipNoData}/>*/}
                    {/*}*/}
                    {
                        expertiseSection.value.length > 0 ? (
                            expertiseSection.value.map(item => (
                                <View key={item.key} style={styles.chip}>
                                    <Text style={styles.chipText}>{item.label}</Text>
                                </View>
                            ))
                        ) : (
                            <View style={styles.chipNoData}>
                                <Text>{t('common.no_data_available')}</Text>
                            </View>
                        )
                    }
                </TouchableOpacity>

                <Divider top={9}/>
                <Text style={styles.limitText}>{t('profile.max_of_two')}</Text>
            </View>
        )
    )

    const EmployerInfo = () => (
        employerSection !== undefined && employerSection !== null &&
        (
            <View style={{marginHorizontal: 25, marginTop: 30}}>
                <Text style={styles.formLabel}>{t('profile.professional_employer')}</Text>
                {
                    employerSection.value.length > 0 &&
                    <FlatList
                        data={employerSection.value}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({item, index}) => (
                            <View>
                                <CustomInput
                                    label={t('profile.company_name')}
                                    placeHolder={t('profile.enter_your_company_name')}
                                    value={item.company_name}
                                    top={19}
                                    onValueChange={(str) => handleEmployerChange(str, index, 'company_name')}
                                />
                                <CustomInput
                                    label={t('profile.achievements')}
                                    placeHolder={t('profile.enter_your_achievements')}
                                    value={item.achievement}
                                    top={34}
                                    onValueChange={(str) => handleEmployerChange(str, index, 'achievement')}
                                />
                                <View style={{marginTop: 31}}>
                                    <Text style={styles.formLabel}>{t('profile.timeline')}</Text>
                                    <View style={styles.dateContainer}>
                                        {/* Start Date */}
                                        <View style={styles.dateInput}>
                                            <TouchableOpacity
                                                style={styles.dateButton}
                                                onPress={() => {
                                                    setActiveStartDateIndex(index);
                                                    setStartDatePickerVisible(true);
                                                }}
                                            >
                                                <Text
                                                    style={item.start_date === "" ? styles.dateButtonTextPlaceHolder : styles.dateButtonText}>
                                                    {item.start_date === "" ? t('profile.start_date') : item.start_date}
                                                </Text>
                                                <Image
                                                    style={{height: 15, width: 15}}
                                                    source={require("@/assets/images/ic_arrow_down.png")}
                                                />
                                            </TouchableOpacity>

                                            <CustomDatePicker
                                                showDay={false}
                                                showPresent={false}
                                                onDateSelected={(date) => handleEmployerChange(date, activeStartDateIndex, 'start_date')}
                                                setModalVisible={setStartDatePickerVisible}
                                                isModalVisible={isStartDatePickerVisible}
                                            />
                                        </View>

                                        {/* End Date */}
                                        <View style={styles.dateInput}>
                                            <TouchableOpacity
                                                style={styles.dateButton}
                                                onPress={() => {
                                                    setEndDatePickerVisible(true);
                                                    setActiveEndDateIndex(index);
                                                }}
                                            >
                                                <Text
                                                    style={item.end_date === "" ? styles.dateButtonTextPlaceHolder : styles.dateButtonText}>
                                                    {item.end_date === "" ? t('profile.end_date') : item.end_date}
                                                </Text>
                                                <Image
                                                    style={{height: 15, width: 15}}
                                                    source={require("@/assets/images/ic_arrow_down.png")}
                                                />
                                            </TouchableOpacity>
                                            <CustomDatePicker
                                                showDay={false}
                                                showPresent={false}
                                                onDateSelected={(date) => handleEmployerChange(date, activeEndDateIndex, 'end_date')}
                                                onPresentSelected={(present) => handleEmployerChange(present, activeEndDateIndex, 'end_date')}
                                                setModalVisible={setEndDatePickerVisible}
                                                isModalVisible={isEndDatePickerVisible}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )
                        }/>
                }
                <TouchableOpacity
                    style={[styles.chipContainer, {marginTop: 22}]}
                    onPress={addEmployerSection}
                    disabled={isAddAnotherDisabled}
                >
                    <View style={[styles.chip]}>
                        <Text
                            style={styles.chipText}>{employerSection.value.length > 0 ? t('profile.add_another_section') : t('profile.add_section')}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        )
    );

    const ServicesInfo = () => (
        services !== undefined && services !== null &&
        <View style={{marginHorizontal: 25, marginTop: 72}}>
            <Text style={styles.formLabel}>{services.label}</Text>
            <TouchableOpacity
                style={styles.chipContainer}
                onPress={() => {
                    setChooseOptionModelType('services')
                    setChooseOptionModelVisible(true)
                }}
            >
                {services.value.length > 0
                    ? services.value.map((item) => (
                        <View key={item.id} style={styles.chip}>
                            <Text style={styles.chipText}>{item.label}</Text>
                        </View>
                    ))
                    : <View style={styles.chipNoData} />}
            </TouchableOpacity>

            <Divider top={9}/>
            <Text style={styles.limitText}>{t('profile.max_of_four')}</Text>
        </View>
    )

    const SkillsInfo = () => (
        skills !== undefined && skills !== null &&
        <View style={{marginHorizontal: 25, marginTop: 25}}>
            <Text style={styles.formLabel}>{skills.label}</Text>
            <TouchableOpacity
                style={[styles.chipContainer]}
                onPress={() => {
                    setChooseOptionModelType('skill')
                    setChooseOptionModelVisible(true)
                }}
            >
                {skills.value.length > 0
                    ? skills.value.map((item, index) => (
                        <View key={item.key} style={styles.chip}>
                            <Text style={styles.chipText}>{item.label}</Text>
                        </View>
                    ))
                    : <View style={styles.chipNoData}/>
                }
            </TouchableOpacity>

            <Divider top={9}/>
            <Text style={styles.limitText}>{t('profile.max_of_four')}</Text>
        </View>
    )

    const LicenceInfo = () => (
        <View style={{marginHorizontal: 25, marginTop: 30}}>
            <Text style={styles.formLabel}>{t('profile.please_select')}</Text>
            <View style={styles.radioGroup}>
                {
                    typesOptions.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.radioButton}
                            onPress={() => setSelectedTypesOption(item)}
                        >
                            <View style={styles.radio}>
                                {selectedTypesOption === item && <View style={styles.radioSelected}/>}
                            </View>
                            <Text style={styles.radioText}>{item}</Text>
                        </TouchableOpacity>
                    ))
                }
            </View>
        </View>
    )

    const SaveBtn = () => (
        <TouchableOpacity
            onPress={updateInfo}
            style={{
                marginHorizontal: 25,
                marginVertical: 24,
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

    const UserInfo = () => (
        <View style={{marginHorizontal: 25, marginTop: 58}}>
            {
                profileDisplaySection !== undefined && profileDisplaySection !== null &&
                profileDisplaySection.map((item, index) => (
                    <View key={index}>
                        {item.key === 'about' ?
                            <CustomInputMultiLine
                                top={47}
                                label={t('profile.about')}
                                labelChars={t('profile.characters')}
                                value={item.value}
                                onValueChange={(str) => handleProfileSectionChange(str, index)}
                            />
                            : (item.key === 'hourly_rate' ||  item.key === 'firm_hourly_rate') ?
                            <CustomInput
                                top={index == 0 ? 0 : 47}
                                label={item.label}
                                value={item.value}
                                type={'number-pad'}
                                onValueChange={(str) => handleProfileSectionChange(str, index)}
                            />: <CustomInput
                                    top={index == 0 ? 0 : 47}
                                    label={item.label}
                                    value={item.value}
                                    onValueChange={(str) => handleProfileSectionChange(str, index)}
                                />}
                    </View>
                ))
            }
        </View>
    );


    const DetailsInfo = () => (
        <View style={{marginHorizontal: 25, marginTop: 58}}>
            <Text style={styles.formLabel}>{t('profile.details')}</Text>
            {
                detailsSection?.map((item, index) => (
                    <View key={index}>
                        <CustomInput
                            top={index === 0 ? 12 : 47}
                            label={item.label}
                            value={item.value}
                            disable={item.disable ?? false}
                            type={item.type ?? "default"}
                            onValueChange={(str) => handleDetailsSectionChange(str, index)}
                        />
                    </View>
                ))
            }
        </View>
    );

    return (
        <SafeAreaView
            style={[styles.container, {paddingBottom: Platform.OS === 'android' ? insets.bottom + 80 : insets.bottom +20}]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{flex: 1}}
            >
                <ScrollView
                    style={[styles.container, {backgroundColor: COLORS.BackgroundColor}]}
                    keyboardDismissMode="interactive"
                    keyboardShouldPersistTaps="handled"
                >
                    <Header/>
                    {UserInfo()}
                    <ExpertiseInfo/>
                    {EmployerInfo()}
                    <ServicesInfo/>
                    <SkillsInfo/>
                    {
                        userType != null &&
                        <LicenceInfo/>
                    }
                    {DetailsInfo()}
                    <SaveBtn/>
                </ScrollView>
            </KeyboardAvoidingView>

            <ChooseOptionModal
                visible={chooseOptionModelVisible}
                section={getChooseSections()}
                options={getChooseOptions()}
                toggle={toggleChooseOptions}
                doneLabel={t('done')}
                onClose={() => setChooseOptionModelVisible(false)}
                t={t}
            />

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
        backgroundColor: COLORS.BackgroundColor,
    },
    header: {
        flexDirection: "row",
        paddingVertical: 16,
        paddingHorizontal: 28,
    },
    backButton: {
        paddingTop: 5,
        flexDirection: "row",
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: "InstrumentSansSemiBold",
        color: COLORS.Black,
    },
    userNameText: {
        fontSize: 18,
        fontFamily: "InstrumentSansSemiBold",
        color: COLORS.Gray_3,
    },
    avatar: {
        width: 51,
        height: 51,
        borderRadius: 26,
        alignSelf: 'center'
    },
    formLabel: {
        fontSize: 18,
        fontFamily: "InstrumentSansSemiBold",
        color: COLORS.PrimaryColorText,
    },
    formField: {
        height: 40,
        overflow: "hidden",
        borderBottomWidth: 1,
        borderColor: COLORS.Black,
    },
    formFieldMultliLine: {
        minHeight: 160,
        overflow: "hidden",
        borderBottomWidth: 1,
        borderColor: COLORS.Black,
    },
    limitText: {
        marginTop: 6,
        justifyContent: 'flex-end',
        alignSelf: 'flex-end',
        fontFamily: "InstrumentSansMedium",
        fontSize: 14,
        color: COLORS.Black,
    },
    chipContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 9,
        marginTop: 12
    },
    chipNoData: {
        paddingVertical: 8,
        paddingHorizontal: 20,
    },
    chip: {
        borderRadius: BORDER_RADIUS.full,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: COLORS.Black,
    },
    chipText: {
        fontSize: 16,
        fontFamily: "InstrumentSansMedium",
        color: COLORS.Black,
    },
    dateContainer: {
        flexDirection: "row",
        marginTop: 10,
        gap: 5
    },
    dateInput: {
        flex: 1,
    },
    dateButton: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 10,
        borderBottomWidth: 1,
        borderColor: COLORS.Black,
    },
    dateButtonTextPlaceHolder: {
        fontSize: 14,
        fontFamily: "InstrumentSansSemiBold",
        color: COLORS.Gray,
    },
    dateButtonText: {
        fontSize: 14,
        fontFamily: "InstrumentSansRegular",
        color: COLORS.Black,
    },
    addButton: {
        width: "50%",
        marginTop: 22,
    },
    radioGroup: {
        marginTop: 15,
        flexDirection: "column",
        gap: 18,
    },
    radioButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: SPACING.sm,
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.Gray_2,
        alignItems: "center",
        justifyContent: "center",
    },
    radioSelected: {
        width: 16,
        height: 16,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.PrimaryColor,
    },
    radioText: {
        fontSize: 16,
        fontFamily: "InstrumentSansSemiBold",
        color: COLORS.PrimaryColorText,
    },
    saveBtnText: {
        fontFamily: 'InstrumentSansSemiBold',
        fontSize: 18,
        color: COLORS.White
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
});

export default EditProfile

import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Linking,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

import {Button} from "@/components/Button";
import {COLORS as c, COLORS} from "@/constants/colors";
import {BORDER_RADIUS, SPACING} from "@/constants/theme";
import {Feather, Ionicons, MaterialIcons} from "@expo/vector-icons";
import {router, useLocalSearchParams, useNavigationContainerRef} from "expo-router";
import React, {useEffect, useRef, useState} from "react";
import {RFValue} from "react-native-responsive-fontsize";
import {heightPercentageToDP as hp, widthPercentageToDP as wp} from "react-native-responsive-screen";
import {SafeAreaView} from "react-native-safe-area-context";
import useAudioPlayer from "@/components/Inbox/useAudioPlayer";

import AttachmentSheet from "@/components/chat/AttachmentSheet";
import {CachedAvatar} from "@/components/CachedAvatar";
import {getAppSelectedLanguage, languageDataList} from "@/components/i18n";
import {getSanitizedFileName, handleOpenFile, pickMultipleDocument, pickMultipleImage} from "@/constants/Utility";
import {useApp} from "@/contexts/AppContext";
import {getServiceBudget, professionalBookingSlots, requestService} from "@/services/apiHelper";
import {Calendar, toDateId} from "@marceloterreiro/flash-calendar";
import Constants, {ExecutionEnvironment} from "expo-constants";
import {DocumentPickerAsset} from "expo-document-picker";
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from "expo-image-picker";
import {useTranslation} from 'react-i18next';
import {KeyboardAwareScrollView} from "react-native-keyboard-controller";
import PremiumMinutesModal from "@/components/subscription/PremiumMinutesModal";
import TopUpModal from "@/components/subscription/TopUpModal";
import {manageVoiceRecorder} from "@/components/chat/manageVoiceRecorder";
import {cancellationPolicy} from "@/services/httpservice";
import {useTour} from "@/app/(app)/manage/useTour";
import TourHighlight from '@/app/(app)/manage/TourHighlight';
import PageTourProvider from "@/app/(app)/manage/PageTourProvider";

type FeatherIconName = keyof typeof Feather.glyphMap;


type CustomInputProps = {
    top?: number;
    label: string | null;
    value: string;
    onValueChange: (value: string) => void;
    onFocus?: () => void;
};

interface DocumentMetaData {
    mimeType: string;
    name: string;
    uri: string;
}

type BookingSlot = {
    start_at: string;
    end_at: string;
    timezone: string;
};

const CustomInput: React.FC<CustomInputProps> = React.memo(
    ({label, value, onValueChange, top = 0}) => (
        <View
            style={{
                marginTop: top
            }}>
            {label ? (
                <Text style={styles.formLabel} allowFontScaling={false}>
                    {label}
                </Text>
            ) : null}
            <View style={[styles.formFieldMultiLine, {flex: 1, flexDirection: 'row'}]}>
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
                    onFocus={() => {

                    }}
                />

            </View>

        </View>
    )
);

interface CustomModalProps {
    label: { key: string; name: string } | null;
    visible: boolean;
    issues: { key: string; label: string }[];
    selected: string[];
    onToggle: (item: { key: string }) => void;
    onClose: () => void;
}

const CustomModal: React.FC<CustomModalProps> = ({
                                                     label,
                                                     visible,
                                                     issues,
                                                     selected,
                                                     onToggle,
                                                     onClose,
                                                 }) => {

    const {t} = useTranslation();

    return (
        <Modal
            visible={visible}
            onDismiss={onClose}
            onRequestClose={onClose}
            transparent
            animationType="slide"
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalBackground}>

                    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation?.()}>

                        <View style={styles.modalContainer}>
                            <Text style={styles.modalTitle}>{label?.name ?? t('search.select')}</Text>
                            <FlatList
                                data={issues}
                                keyExtractor={(item) => item.key.toString()}
                                renderItem={({item}) => {

                                    const isSelected = selected.includes(item.key);
                                    return (
                                        <TouchableOpacity
                                            style={styles.optionContainer}
                                            onPress={() => onToggle(item)}
                                        >
                                            <Ionicons
                                                name={isSelected ? "radio-button-on" : "radio-button-off"}
                                                size={24}
                                                color={COLORS.PrimaryColor}
                                            />
                                            <Text style={styles.optionLabel}>{item?.label || t("no_data")}</Text>
                                        </TouchableOpacity>
                                    )
                                }}

                            />
                            <Button title={t('done')} onPress={onClose} style={{marginTop: 5}}/>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    )
};

const getSelectedItem = (
    selectedKey: string,
    itemList: { key: string; label: string }[],
    t: any
): string => {
    return itemList.find((item) => selectedKey === item.key)?.label ?? t("no_data")
};


interface SelectionListProps {
    title: string;
    openModal: () => void;
    selected: string[];
    defaultText: string;
    itemList: { key: string; label: string }[];
    t: any
}

const SelectionList: React.FC<SelectionListProps> = ({
                                                         title,
                                                         openModal,
                                                         selected,
                                                         defaultText,
                                                         itemList,
                                                         t
                                                     }) => (
    <View style={{
        padding: 10,
        marginStart: 16,
        marginEnd: 16,
    }}>
        <Text style={styles.label}>{title}</Text>
        <TouchableOpacity style={styles.chipWrapper} onPress={openModal}>
            {selected.length ? (
                selected.map((item, i) => (
                    <View key={i} style={styles.chip}>
                        <Text>{getSelectedItem(item, itemList, t)}</Text>
                    </View>
                ))
            ) : (
                <View style={{width: '100%'}}>
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingVertical: 8,
                        }}
                    >
                        <Text style={styles.limitText} numberOfLines={1}>
                            {defaultText}
                        </Text>
                        <MaterialIcons name="arrow-drop-down" size={24}/>
                    </View>
                </View>
            )}
        </TouchableOpacity>
        <View style={{
            height: 1,
            marginTop: 9,
            backgroundColor: COLORS.Black
        }}/>
    </View>
);


interface SpeechRecognitionHooksProps {
    isSpeakingRef: React.MutableRefObject<boolean>;
    transcript: string;
    oldTranscript: string;
    setTranscript: (v: string) => void;
    setIsSpeaking: (v: boolean) => void;
    setOldTranscript: (v: string) => void;
}

function SpeechRecognitionHooks({
                                    isSpeakingRef,
                                    transcript,
                                    oldTranscript,
                                    setTranscript,
                                    setIsSpeaking,
                                    setOldTranscript,
                                }: SpeechRecognitionHooksProps) {

    const {useSpeechRecognitionEvent} = require("expo-speech-recognition");


    useSpeechRecognitionEvent("start", () => {
        isSpeakingRef.current = true;
        setIsSpeaking(true);
    });

    useSpeechRecognitionEvent("end", () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        setOldTranscript(transcript);
    });

    useSpeechRecognitionEvent("result", (event: any) => {
        if (isSpeakingRef.current) {
            const updated =
                oldTranscript +
                " " +
                (event.results?.[0]?.transcript ?? "");

            setTranscript(updated.trim());
        }
    });

    useSpeechRecognitionEvent("error", (event: any) => {
        console.warn("Speech error:", event.error, event.message);
    });

    return null;
}

const MessageScreen = () => {

    const {t} = useTranslation();

    const [tourReady, setTourReady] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setTourReady(true);
        }, 800);

        return () => clearTimeout(timer);
    }, []);
    useTour("Request", tourReady);

    const {
        isRecording,
        readyToRecord,
        recordedUri,
        recordingDuration,
        handleVoiceRecording,
        startRecording,
        stopRecording,
        deleteRecording,
    } = manageVoiceRecorder(async (uri: string, referralState: any): Promise<void> => {
        processAudio(uri)
    }, t);

    const {playPauseSound, isPlaying} = useAudioPlayer();
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

    const scrollViewRef = useRef<any>(null);
    const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const isSpeakingRef = useRef(false);

    const params = useLocalSearchParams();
    const {profilePicture, lawyerId, lawyerName} = params;

    const {
        setRefreshReloadCaseList,
        walletData,
        showPremiumTopUpView,
        isShowPremiumTopUpView,
        isShowTopUpView,
        showTopUpView,
        refreshPlanInfo
    } = useApp();

    const navRef = useNavigationContainerRef();
    const hasContentRef = useRef(false);

    const [loading, setLoading] = useState<boolean>(false);
    const [saveEnabled, setSaveEnabled] = useState<boolean>(true);
    const [isTermsAccepted, setIsTermsAccepted] = useState(false);

    // UI & modal states
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState<any>(null);
    const [selectedList, setSelectedList] = useState<any[]>([]);
    const [selected, setSelected] = useState<string[]>([]);

    // Selected values
    const [selectedLegalIssues, setSelectedLegalIssues] = useState<string[]>([]);
    const [selectedConsultationList, setSelectedConsultationList] = useState<string[]>([]);
    const [selectedUrgencyLevel, setSelectedUrgencyLevel] = useState<string[]>([]);
    const [selectedTimeList, setSelectedTimeList] = useState<string[]>([]);
    const [selectedBudget, setSelectedBudget] = useState<string[]>([]);
    const [bookingSlots, setBookingSlots] = useState<BookingSlot[]>([]);
    const [selectedBookingSlot, setSelectedBookingSlot] = useState<BookingSlot | null>(null);
    const [selectedBookingDateId, setSelectedBookingDateId] = useState(toDateId(new Date()));
    const [slotsLoading, setSlotsLoading] = useState(false);

    const [budgetListData, setBudgetListData] = useState<any[]>([]);

    // Attachments
    const [documents, setDocuments] = useState<DocumentMetaData[]>([]);
    const [isShowAttachmentSheet, setShowAttachmentSheet] = useState(false);
    const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

    // Speech
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speakingDuration, setSpeakingDuration] = useState(0);
    const [transcript, setTranscript] = useState("");
    const [oldTranscript, setOldTranscript] = useState("");
    const hasAdditionalNotes = transcript.trim().length > 0;

    // Language
    const [languageCode, setLanguageCode] = useState("en");
    const [consultationTimesData, setConsultationTimesData] = useState<any[]>([]);

    const requiresBookingSlot =
        selectedConsultationList[0] === "single_consultation" ||
        selectedConsultationList[0] === "ongoing_support";

    const slotDateIds = React.useMemo(() => {
        return bookingSlots.reduce<Record<string, BookingSlot[]>>((acc, slot) => {
            const key = toDateId(new Date(slot.start_at));
            acc[key] = [...(acc[key] || []), slot];
            return acc;
        }, {});
    }, [bookingSlots]);

    const todayDate = React.useMemo(() => new Date(), []);
    const maxBookingDate = React.useMemo(() => {
        const value = new Date(todayDate);
        value.setDate(value.getDate() + 14);
        return value;
    }, [todayDate]);

    const disabledBookingDateIds = React.useMemo(() => {
        const available = new Set(Object.keys(slotDateIds));
        const ids: string[] = [];
        const cursor = new Date(todayDate);
        cursor.setHours(0, 0, 0, 0);
        while (cursor <= maxBookingDate) {
            const id = toDateId(cursor);
            if (!available.has(id)) ids.push(id);
            cursor.setDate(cursor.getDate() + 1);
        }
        return ids;
    }, [maxBookingDate, slotDateIds, todayDate]);

    const formatSlotTime = (slot: BookingSlot) => {
        const start = new Date(slot.start_at);
        const end = new Date(slot.end_at);
        return `${start.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})} - ${end.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}`;
    };

    useEffect(() => {
        if (!requiresBookingSlot || selectedTimeList.length === 0 || !lawyerId) {
            setBookingSlots([]);
            setSelectedBookingSlot(null);
            return;
        }

        setSlotsLoading(true);
        setSelectedBookingSlot(null);
        const from = new Date();
        const to = new Date();
        to.setDate(to.getDate() + 14);
        professionalBookingSlots(
            String(lawyerId),
            from.toISOString(),
            to.toISOString(),
            selectedTimeList[0],
            (response: any) => {
                const slots = response?.slots || [];
                setBookingSlots(slots);
                if (slots.length > 0) {
                    setSelectedBookingDateId(toDateId(new Date(slots[0].start_at)));
                }
                setSlotsLoading(false);
            },
            () => {
                setBookingSlots([]);
                setSlotsLoading(false);
            }
        )
    }, [lawyerId, requiresBookingSlot, selectedTimeList]);

    const [selectedCaseworkService, setSelectedCaseworkService] = useState<string[]>([]);
    const [selectedCaseworkServiceData, setSelectedCaseworkServiceData] = useState<any>(null);

    const secondary = c.SecodaryColor;


    // Data lists
    const issueList = t("request_expertise_options", {
        returnObjects: true,
    }) as any[];

    const issues = issueList.slice(0, 1);


    const urgencyLevels = t("request_urgency_levels", {returnObjects: true}) as any[];
    const dialogTypes = t("dialog_types", {returnObjects: true}) as any[];
    const consultationItems = t("consultationItems", {returnObjects: true}) as any[];

    const budget3Days = t("budget_3_day_options", {returnObjects: true}) as any[];
    const budget5Days = t("budget_5_day_options", {returnObjects: true}) as any[];
    const budgetCasework = t("budget_casework_options", {returnObjects: true}) as any[];
    const caseworkServiceList = t("casework_service_options", {returnObjects: true}) as any[];

    const handleFilePress = (item: DocumentMetaData) => {
        const mime = item.mimeType?.toLowerCase() || '';
        if (mime.startsWith('image/')) {
            setPreviewImageUri(item.uri);
        } else if (mime.includes('pdf')) {
            handleOpenFile(item.uri, '', 'application/pdf');
        } else if (mime.includes('msword') || mime.includes('wordprocessingml')) {
            handleOpenFile(
                item.uri,
                '',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            );
        } else {
            handleOpenFile(item.uri, '', item.mimeType);
        }
    };

    useEffect(() => {
        if (issues && issues.length > 0) {
            setSelectedLegalIssues([issues[0].key]); // ✅ auto-selects first item
        }
    }, []);

    useEffect(() => {

        const getSelectedLanguage = async () => {

            const code = await getAppSelectedLanguage();
            const selectedLang = languageDataList.find((item) => item.code === code);
            if (selectedLang?.fullCode) {
                setLanguageCode(selectedLang.fullCode);
            }
        };

        getSelectedLanguage();
    }, [])

    useEffect(() => {
        return () => {
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        setSaveEnabled(!loading && !isRecording && !isSpeaking && !recordedUri);
    }, [loading, isRecording, isSpeaking, recordedUri]);


    const addDocuments = (files: DocumentPickerAsset[] | undefined) => {

        if (!files || files.length === 0) return;

        const newDocs: DocumentMetaData[] = files
            .filter(file => {
                const isDuplicate = documents.some(
                    (existingDoc) =>
                        existingDoc.name.toLowerCase() === file.name.toLowerCase()
                );
                return file.mimeType !== undefined && !isDuplicate;
            })
            .map(file => ({
                name: file.name,
                mimeType: file.mimeType!,
                uri: file.uri
            }));

        if (newDocs.length > 0) {
            setDocuments(prev => [...prev, ...newDocs]);
        }
    };

    const openModal = (label: any, list: any[], selectedItems: string[]) => {
        setSelectedLabel(label);
        setSelectedList(list);
        setSelected(selectedItems);
        setModalVisible(true);
    };

    const removeDocument = (doc: DocumentMetaData) => {
        setDocuments(prev => prev.filter((item) => item.name !== doc.name))
    }


    const canAttachItems = (isAudio: boolean, count: number = 1) => {
        const {minutes, subscription, monthly_usage, limits} = walletData || {};
        if (!limits || !monthly_usage) return false;

        const isPaidPlan =
            subscription?.plan_id !== "freemium" &&
            subscription?.plan_id !== "basic";

        // ✅ Minutes check (for paid users)
        if (isPaidPlan && minutes && minutes.available <= 0) {
            setShowAttachmentSheet(false);
            showPremiumTopUpView(true);
            return false;
        }

        if (isAudio) {
            const localAudioCount = documents.filter((doc) =>
                doc.mimeType?.toLowerCase().startsWith("audio/")
            ).length;

            if (limits.voice_notes_limit == null) return true;

            const remaining = limits.voice_notes_limit - (monthly_usage.voice_notes + localAudioCount);
            if (remaining <= 0 || count > remaining) {
                setShowAttachmentSheet(false);
                showPremiumTopUpView(true);
                return false;
            }

        } else {
            const localDocsCount = documents.filter((doc) => {
                const type = doc.mimeType?.toLowerCase() || "";
                return (
                    type.includes("pdf") ||
                    type.includes("msword") || // .doc
                    type.startsWith("image/") // .docx
                );
            }).length;

            const remaining = limits.uploads_limit - (monthly_usage.uploads + localDocsCount);
            if (remaining <= 0 || count > remaining) {
                setShowAttachmentSheet(false);
                showPremiumTopUpView(true);
                return false;
            }
        }

        return true;
    };


    const processAudio = async (uri: string) => {

        if (!canAttachItems(true, 1)) return;

        setLoading(true);

        const timestamp = new Date()
            .toISOString()
            .replace(/[-:.]/g, "")
            .split("T")
            .join("_")
            .slice(0, 15);
        const permanentUri = `${FileSystem.documentDirectory}recording_${timestamp}.wav`;

        try {
            await FileSystem.moveAsync({from: uri, to: permanentUri});
            const recordingAsset: DocumentPickerAsset = {
                name: `recording_${timestamp}.wav`,
                mimeType: "audio/wav",
                uri: permanentUri,
                lastModified: Date.now(),
            };
            addDocuments([recordingAsset]);

        } catch (error) {
            console.error("Error moving file:", error);
        } finally {
            setLoading(false);
        }
    };


    const handleSpeechRecognitionStart = async () => {
        if (isExpoGo) return;

        const {ExpoSpeechRecognitionModule} = await import("expo-speech-recognition");

        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
        }

        const res = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!res.granted) {
            console.warn("Permissions not granted", res);
            return;
        }

        ExpoSpeechRecognitionModule.start({
            lang: languageCode,
            interimResults: true,
            maxAlternatives: 1,
            continuous: false,
        });

        isSpeakingRef.current = true;
        setIsSpeaking(true);
        setSpeakingDuration(0);
        recordingIntervalRef.current = setInterval(() => {
            setSpeakingDuration((prev) => prev + 1);
        }, 1000);
    };

    const handleSpeechRecognitionStop = async () => {
        if (isExpoGo) return;

        const {ExpoSpeechRecognitionModule} = await import("expo-speech-recognition");
        ExpoSpeechRecognitionModule.stop();
        isSpeakingRef.current = false;
        setIsSpeaking(false);

        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
        }
        setSpeakingDuration(0);
    }

    const toggleIssue = (item: { key: string }) => {
        setSelected([item.key]);
    };


    const generateBudgetOptions = (min: number, max: number) => {

        // Determine step size based on min value magnitude
        let step: number;
        if (min >= 2200 && max <= 3000) {
            step = 200;
        } else if (min >= 1200 && max <= 2200) {
            if (min === 1300) {
                step = 100
            } else {
                step = 200;
            }
        } else if (min >= 2000) {
            if (max === 8000) {
                step = 1000;
            } else {
                step = 500;
            }
        } else if (min >= 1000) {
            step = 100;
        } else {
            step = 50;
        }

        const options: { key: string; label: string }[] = [];

        // Start from min, round up to a nearest step
        let current = Math.ceil(min / step) * step;

        // If rounded start skips min, add min explicitly
        if (current > min) {
            options.push({
                key: String(min),
                label: `£${min.toLocaleString('en-GB')}`,
            });
        }

        while (current <= max) {
            options.push({
                key: String(current),
                label: `£${current.toLocaleString('en-GB')}`,
            });
            current += step;
        }

        return options;
    };


    const onCloseModal = async () => {
        if (!selectedLabel?.key) {
            setModalVisible(false);
            return;
        }

        switch (selectedLabel.key) {
            case "issue_type":
                setSelectedLegalIssues(selected);
                break;
            case "urgency":
                setSelectedUrgencyLevel(selected);
                break;
            case "consultation":
                setSelectedConsultationList(selected);
                setSelectedTimeList([]);
                setSelectedCaseworkService([]);
                setSelectedCaseworkServiceData(null);
                setSelectedBudget([]);
                break;
            case "select_time": {
                const isOngoingSupport = selectedConsultationList?.[0] === "ongoing_support";
                setSelectedBudget([]);

                if (isOngoingSupport) {
                    setBudgetListData( // ✅ was budgetListData = ...
                        selected[0] === "ongoing_3_day" ? budget3Days : budget5Days
                    );
                } else if (selectedConsultationList?.[0] === "casework") {
                    setBudgetListData(budgetCasework);
                }
                setSelectedTimeList(selected);
                break;
            }

            case "casework-service": {

                setSelectedCaseworkService(selected);
                const selectedService = caseworkServiceList.find(
                    (item: any) => item.key === selected[0]
                );
                setSelectedCaseworkServiceData(selectedService || null);

                let response = await getServiceBudget(selected[0]);
                if (response.casework_budget && response.casework_budget.length > 0) {
                    setBudgetListData(
                        response.casework_budget
                    );
                    setSelectedBudget([]); // reset previous budget selection
                } else {

                    if (selectedService?.min_budget_gbp && selectedService?.max_budget_gbp) {
                        setBudgetListData(
                            generateBudgetOptions(
                                selectedService.min_budget_gbp,
                                selectedService.max_budget_gbp
                            )
                        );
                    } else {
                        setBudgetListData([]); // no budget range defined
                    }
                    setSelectedBudget([]); // reset previous budget selection
                }
                break;
            }
            case "select-budget":
                setSelectedBudget(selected);
                break;
            default:
                break;
        }

        setModalVisible(false);
    };


    useEffect(() => {
        if (!selectedConsultationList.length) return;
        const sel = selectedConsultationList[0];

        setSelectedTimeList([]);
        setSelectedBudget([]);
        setSelectedCaseworkService([]);
        setSelectedCaseworkServiceData(null);
        setBudgetListData([]); // ✅ always reset budget on type change

        if (sel === "casework") {
            setConsultationTimesData([]);
            return; // ✅ don't set budget here, wait for service selection
        }

        const key = sel === "ongoing_support"
            ? "ongoing_support_times"
            : "consultation_times";

        const times: any[] = t(key, {returnObjects: true}) as any[];
        setConsultationTimesData(times);

    }, [selectedConsultationList]);

    useEffect(() => {
        if (recordedUri) {
            const uri = recordedUri;
            deleteRecording();
            processAudio(uri);
        }
    }, [recordedUri]);


    const handleSubmit = async (submitLabel: string, okLabel: string, successMsg: string) => {
        if (loading) return;


        // FIX #12: Validation used alert() (global, works on web but inconsistent on RN).
        //          Replaced with Alert.alert for consistent native behaviour on iOS/Android.
        if (selectedLegalIssues.length === 0) {
            Alert.alert("", t("service_issue_type"));
            return;
        }
        if (selectedConsultationList.length === 0) {
            Alert.alert("", t("consultation_type"));
            return;
        }
        if (selectedUrgencyLevel.length === 0) {
            Alert.alert("", t("urgency_level"));
            return;
        }
        const needsBudget =
            selectedConsultationList[0] === "ongoing_support" ||
            selectedConsultationList[0] === "casework";
        if (needsBudget && selectedBudget.length === 0) {
            Alert.alert("", t("budget_input"));
            return;
        }
        if (requiresBookingSlot && !selectedBookingSlot) {
            Alert.alert("", "Select an available consultation time.");
            return;
        }
        if (!hasAdditionalNotes) {
            Alert.alert("", t("additional_notes_required", {
                defaultValue: "Please enter additional notes before submitting.",
            }));
            return;
        }

        setLoading(true);

        if (isSpeaking) {
            await handleSpeechRecognitionStop();
        }

        const formData = new FormData();

        documents.forEach((doc) => {
            formData.append("attachment", {
                uri: doc.uri,
                name: getSanitizedFileName(doc.name),
                type: doc.mimeType,
            } as any);
        });

        formData.append("service", selectedLegalIssues.toString());
        formData.append("consultation_category", selectedConsultationList.toString());
        formData.append("urgency_level", selectedUrgencyLevel.toString());

        if (selectedConsultationList[0] === "casework") {
            if (selectedBudget.length > 0) {
                formData.append("casework_budget_gbp", selectedBudget.toString());
                formData.append("casework_service_type", selectedCaseworkService.toString());
            }
        } else {
            if (selectedBudget.length > 0) {
                formData.append("budget_range", selectedBudget.toString());
            }
        }

        formData.append("additional_notes", transcript);
        formData.append(
            "consultation_type",
            selectedTimeList.length > 0 ? selectedTimeList.toString() : ""
        );

        if (!lawyerId) {
            return;
        }

        if (selectedBookingSlot) {
            formData.append("booking_start_at", selectedBookingSlot.start_at);
            formData.append("booking_timezone", Intl.DateTimeFormat().resolvedOptions().timeZone || selectedBookingSlot.timezone);
        }

        requestService(
            String(lawyerId),
            formData,
            async (_response: any) => {
                setLoading(false);
                Alert.alert("", successMsg, [
                    {
                        text: okLabel,
                        onPress: async () => {
                            setRefreshReloadCaseList();
                            if (router.canGoBack()) {
                                router.dismissAll();
                            }
                            router.push("/(app)/(tabs)/inbox");
                        },
                    },
                ]);
                await refreshPlanInfo();
            },
            (e: any) => {
                setLoading(false);
                const errorDetail = e?.response?.data?.detail;
                let message = t("error.error_msg");

                if (Array.isArray(errorDetail)) {
                    message = errorDetail[0]?.msg ?? message;
                } else if (typeof errorDetail === "string") {
                    message = errorDetail;
                } else if (typeof errorDetail === "object" && errorDetail !== null) {
                    if (errorDetail?.error === "duplicate_file") {
                        const filename = errorDetail.filename ?? "";
                        const existingLabel = errorDetail.existing_label ?? "";

                        message = existingLabel
                            ? t("duplicate_file_attached_as", {
                                filename,
                                existingLabel,
                            })
                            : errorDetail.message ??
                            t("duplicate_file_attached", {
                                filename,
                            });

                    } else if (errorDetail?.message) {
                        message = errorDetail.message;
                    }
                }

                // FIX #12: consistent Alert.alert instead of alert()
                Alert.alert("", message || t("error.failed_to_process_request"));
            }
        );
    };

    const getFileIcon = (fileName: string): { name: FeatherIconName; color: string } => {
        const extension = fileName?.split(".")?.pop()?.toLowerCase() ?? "";
        switch (extension) {
            case "pdf":
                return {name: "file-text", color: "#FF3B30"};
            case "jpg":
            case "jpeg":
            case "png":
            case "heic":
                return {name: "image", color: "#34C759"};
            case "doc":
            case "docx":
                return {name: "edit-3", color: "#007AFF"};
            case "csv":
            case "xlsx":
                return {name: "grid", color: "#1D7444"};
            default:
                return {name: "file", color: "#8E8E93"};
        }
    };

    const openAttachmentSheet = () => setShowAttachmentSheet(true);

    const startVoiceNoteFromAttachmentSheet = async () => {
        setShowAttachmentSheet(false);
        if (!canAttachItems(true, 1)) return;

        const isReady = await handleVoiceRecording();
        if (isReady) {
            await startRecording();
        }
    };

    const AttachBtn = () => (
        <View style={{justifyContent: "center"}}>
            <TouchableOpacity onPress={openAttachmentSheet} style={styles.AttachButton}>
                <Feather name="plus" size={20} color="#fff"/>
            </TouchableOpacity>
        </View>
    );

    // @ts-ignore
    return (
        <SafeAreaView
            style={[styles.container]}>

            {!isExpoGo && (
                <SpeechRecognitionHooks
                    isSpeakingRef={isSpeakingRef}
                    setOldTranscript={setOldTranscript}
                    transcript={transcript}
                    oldTranscript={oldTranscript}
                    setTranscript={setTranscript}
                    setIsSpeaking={setIsSpeaking}
                />
            )}

            <KeyboardAwareScrollView
                ref={scrollViewRef}
                style={{flex: 1}}
                keyboardDismissMode="interactive"
                keyboardShouldPersistTaps="handled"
                bottomOffset={60}
                extraKeyboardSpace={60}
                contentContainerStyle={{
                    paddingBottom: 0,
                    flexGrow: 1,
                }}
                showsVerticalScrollIndicator={false}
            >

                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            onPress={async () => {
                                if (navRef.canGoBack()) {
                                    router.back();
                                } else {
                                    router.push("/"); // fallback to home or default screen
                                }
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={t('change_email.go_back')}
                            style={styles.headerIcon}>
                            <MaterialIcons name="arrow-back-ios" size={24}/>
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.headerTitle} allowFontScaling={false}>
                                {t('search.request_service')}
                            </Text>
                            {lawyerName && <Text style={styles.headerSubtitle} allowFontScaling={false}>
                                {lawyerName}
                            </Text>}
                        </View>
                    </View>
                    <View style={styles.profileImageContainer}>
                        <CachedAvatar uri={String(profilePicture)} style={styles.profileImage}/>
                    </View>
                </View>


                <View style={styles.formContainer}>

                    <TourHighlight
                        zone={1}
                        title={t('tour_request_form_title')}
                        text={t('tour_request_form_desc')}
                        style={{alignSelf:'stretch'}}
                    >

                        <View>

                            <SelectionList
                                title={t('search.service')}
                                openModal={() => {
                                    openModal(dialogTypes[0], issues, selectedLegalIssues)
                                }}
                                selected={selectedLegalIssues}
                                defaultText={t('search.select_service')}
                                itemList={issues}
                                t={t}
                            />

                            <SelectionList
                                title={t('search.consultation')}
                                openModal={() => {
                                    openModal(dialogTypes[2], consultationItems, selectedConsultationList)
                                }}
                                selected={selectedConsultationList}
                                defaultText={t('search.select_consultation')}
                                itemList={consultationItems}
                                t={t}
                            />

                            {consultationTimesData && consultationTimesData.length > 0 && (
                                <SelectionList
                                    title={t('search.time_n_rate')}
                                    openModal={() => {
                                        openModal(dialogTypes[3], consultationTimesData, selectedTimeList)
                                    }}
                                    selected={selectedTimeList}
                                    defaultText={t('select_consultation_time')}
                                    itemList={consultationTimesData}
                                    t={t}
                                />)}

                            {requiresBookingSlot && selectedTimeList.length > 0 && (
                                <View style={styles.bookingContainer}>
                                    <Text style={styles.formLabel} allowFontScaling={false}>
                                        Consultation time
                                    </Text>
                                    {slotsLoading ? (
                                        <ActivityIndicator size="small" color={c.SecodaryColor} style={{marginVertical: 12}}/>
                                    ) : (
                                        <>
                                            <Calendar
                                                calendarInstanceId="request-service-booking"
                                                calendarMonthId={selectedBookingDateId}
                                                calendarMinDateId={toDateId(todayDate)}
                                                calendarMaxDateId={toDateId(maxBookingDate)}
                                                calendarDisabledDateIds={disabledBookingDateIds}
                                                calendarActiveDateRanges={[{startId: selectedBookingDateId, endId: selectedBookingDateId}]}
                                                calendarFirstDayOfWeek="monday"
                                                calendarDayHeight={36}
                                                calendarRowHorizontalSpacing={4}
                                                calendarRowVerticalSpacing={6}
                                                onCalendarDayPress={(dateId) => {
                                                    setSelectedBookingDateId(dateId);
                                                    setSelectedBookingSlot(null);
                                                }}
                                            />
                                            <View style={styles.bookingChipGrid}>
                                                {(slotDateIds[selectedBookingDateId] || []).length > 0 ? (
                                                    (slotDateIds[selectedBookingDateId] || []).map((slot) => {
                                                        const selectedSlot = selectedBookingSlot?.start_at === slot.start_at;
                                                        return (
                                                            <TouchableOpacity
                                                                key={slot.start_at}
                                                                style={[styles.bookingChip, selectedSlot && styles.bookingChipSelected]}
                                                                onPress={() => setSelectedBookingSlot(slot)}
                                                            >
                                                                <Text style={[styles.bookingChipText, selectedSlot && styles.bookingChipTextSelected]}>
                                                                    {formatSlotTime(slot)}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })
                                                ) : (
                                                    <Text style={styles.bookingEmptyText}>
                                                        No slots available for this day.
                                                    </Text>
                                                )}
                                            </View>
                                        </>
                                    )}
                                </View>
                            )}

                            {selectedConsultationList[0] === "casework" && (
                                <SelectionList
                                    title={t("search.service")}
                                    openModal={() => openModal(
                                        {key: "casework-service", name: t("search.select_service")},
                                        caseworkServiceList,
                                        selectedCaseworkService
                                    )}
                                    selected={selectedCaseworkService}
                                    defaultText={t("search.select_service")}
                                    itemList={caseworkServiceList}
                                    t={t}
                                />
                            )}

                            {selectedConsultationList[0] === "casework" &&
                                selectedCaseworkService.length > 0 &&
                                budgetListData.length > 0 && (
                                    <SelectionList
                                        title={t('search.budget')}
                                        openModal={() => openModal(dialogTypes[4], budgetListData, selectedBudget)}
                                        selected={selectedBudget}
                                        defaultText={t('search.select')}
                                        itemList={budgetListData}
                                        t={t}
                                    />
                                )}

                            {selectedConsultationList[0] === "ongoing_support" &&
                                selectedTimeList.length > 0 &&
                                budgetListData.length > 0 && (
                                    <SelectionList
                                        title={t('search.budget')}
                                        openModal={() => openModal(dialogTypes[4], budgetListData, selectedBudget)}
                                        selected={selectedBudget}
                                        defaultText={t('search.select')}
                                        itemList={budgetListData}
                                        t={t}
                                    />
                                )}


                            <SelectionList
                                title={t('search.urgency')}
                                openModal={() => {
                                    openModal(dialogTypes[1], urgencyLevels, selectedUrgencyLevel)
                                }}
                                selected={selectedUrgencyLevel}
                                defaultText={t('search.select')}
                                itemList={urgencyLevels}
                                t={t}
                            />


                            <View
                                style={{
                                    padding: 10,
                                    marginStart: 16,
                                    marginEnd: 16,
                                }}
                            >
                                {/* Title + Right Controls */}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginTop: 10,
                                    }}
                                >
                                    <Text>
                                        {t('search.additional_notes')}{" "}
                                        <Text style={styles.requiredIndicator}>*</Text>
                                    </Text>

                                    {/* Right side controls */}
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>

                                        {isSpeaking ? (
                                            <View
                                                style={{
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    marginRight: 8,
                                                }}
                                            >
                                                <Text style={{color: 'red', textAlign: 'center', fontSize: 18}}>
                                                    {speakingDuration}
                                                </Text>
                                            </View>
                                        ) : null}

                                        <TouchableOpacity
                                            onPress={() => {
                                                if (isSpeaking) {
                                                    handleSpeechRecognitionStop();
                                                } else {
                                                    handleSpeechRecognitionStart();
                                                }
                                            }}
                                        >
                                            <MaterialIcons
                                                name={isSpeaking ? "stop" : "mic"}
                                                size={24}
                                                color={isSpeaking ? "red" : "black"}
                                            />

                                        </TouchableOpacity>

                                    </View>
                                </View>

                                <CustomInput
                                    top={6}
                                    label={null}
                                    value={transcript}
                                    onFocus={() => {
                                        setTimeout(() => {
                                            scrollViewRef.current?.scrollToEnd({animated: true});
                                        }, 300);
                                    }}
                                    onValueChange={(value) => {
                                        setTranscript(value);
                                        setOldTranscript(value);
                                    }}
                                />
                            </View>

                            {/* ── Attachment cards ─────────────────────────────────────── */}

                            {/* ── Voice note recorded preview row ─────────────────────── */}
                            {/* Voice note preview — shown for audio files already in documents */}
                            {documents.map((item, index) => {
                                const isAudio = item.mimeType?.startsWith('audio/');

                                // ── Audio files → voice preview card ─────────────────
                                if (isAudio) {
                                    return (
                                        <View key={index} style={styles.voicePreviewCard}>
                                            <Feather name="mic" size={18} color={secondary}/>
                                            <Text style={styles.voicePreviewLabel} numberOfLines={1}>
                                                {getSanitizedFileName(item.name)}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => playPauseSound(item.uri)}
                                                style={styles.voiceActionBtn}
                                            >
                                                <MaterialIcons
                                                    name={isPlaying(item.uri) ? "pause-circle-filled" : "play-circle-fill"}
                                                    size={28}
                                                    color={secondary}
                                                />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => removeDocument(item)}
                                                style={styles.voiceActionBtn}
                                                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                                            >
                                                <Feather name="trash-2" size={22} color="#FF3B30"/>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                }

                                // ── All other files → standard attachment card ────────
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.attachmentCard}
                                        onPress={() => handleFilePress(item)}
                                        activeOpacity={0.75}
                                    >
                                        <View style={styles.eyeBadge}>
                                            <Feather name="eye" size={10} color="#fff"/>
                                        </View>
                                        {item.mimeType?.startsWith('image/') ? (
                                            <Image
                                                source={{uri: item.uri}}
                                                style={styles.attachmentThumb}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={styles.attachmentIconBox}>
                                                <Feather
                                                    name={getFileIcon(item.name).name}
                                                    size={20}
                                                    color={getFileIcon(item.name).color}
                                                />
                                            </View>
                                        )}
                                        <View style={styles.attachmentInfo}>
                                            <Text style={styles.attachmentText} numberOfLines={1}>
                                                {getSanitizedFileName(item.name)}
                                            </Text>
                                            <Text style={styles.attachmentTapHint}>
                                                {t('chat.tap_to_preview') || 'Tap to preview'}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => removeDocument(item)}
                                            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                                        >
                                            <Feather name="trash-2" size={20} color="#FF3B30"/>
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                );
                            })}

                        </View>

                    </TourHighlight>


                    <View style={styles.consentContainer}>
                        <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => setIsTermsAccepted(!isTermsAccepted)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={
                                    isTermsAccepted
                                        ? "checkbox-outline"
                                        : "square-outline"
                                }
                                size={22}
                                color={COLORS.PrimaryColor}
                            />

                            <Text style={styles.consentText}>
                                {t("consultation_consent_prefix")}{" "}
                                <Text style={styles.highlightText}>
                                    {t("submit")}
                                </Text>
                                {" "}{t("consultation_consent_middle")}{" "}
                                <Text
                                    style={styles.policyLink}
                                    onPress={() => Linking.openURL(cancellationPolicy)}
                                >
                                    {t("cancellation_policy")}
                                </Text>
                                {"."}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* readyToRecord / isRecording states remain unchanged */}

                    {/* ── Bottom row: attach + recording state + submit ────────── */}
                    <>
                        <View style={{flexDirection: "row", marginTop: 8, paddingHorizontal: 16}}>

                            {/* Left button — fixed width so SaveBtn doesn't shift */}
                            <View style={{flexDirection: "row", flex: 1}}>
                                <View style={{width: 48, justifyContent: 'center', alignItems: 'center'}}>
                                    {readyToRecord ? (
                                        <TouchableOpacity
                                            onPress={startRecording}
                                            style={[styles.AttachButton]}
                                        >
                                            <Feather name="mic" size={20} color="#fff"/>
                                        </TouchableOpacity>
                                    ) : isRecording ? (
                                        <TouchableOpacity
                                            onPress={async () => {
                                                await stopRecording();
                                            }}
                                            style={[styles.AttachButton, {backgroundColor: secondary}]}
                                        >
                                            <Feather name="square" size={24} color="#fff"/>
                                        </TouchableOpacity>
                                    ) : (
                                        <AttachBtn/>
                                    )}
                                </View>

                                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                    {isRecording && (
                                        <View style={{justifyContent: 'center', alignItems: 'center'}}>
                                            <Feather name="mic" size={20} color="red"/>
                                            <Text style={{color: "red", textAlign: "center"}}>
                                                {recordingDuration}s
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            <View
                                style={{justifyContent: "center", width: 200, alignItems: "flex-end"}}
                            >
                                {loading ? (
                                    <View style={{marginTop: 16}}>
                                        <ActivityIndicator size="large" color={secondary}/>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        disabled={!saveEnabled || !isTermsAccepted || !hasAdditionalNotes}
                                        accessibilityState={{
                                            disabled: !saveEnabled || !isTermsAccepted || !hasAdditionalNotes,
                                        }}
                                        // FIX #16: inline async in onPress removed — extracted to handleSubmit
                                        onPress={() =>
                                            handleSubmit(
                                                t("submit"),
                                                t("ok"),
                                                t("search.service_request_success")
                                            )
                                        }
                                        style={{
                                            width: "50%",
                                            marginVertical: 24,
                                            backgroundColor: COLORS.SecodaryColor,
                                            borderRadius: BORDER_RADIUS.full,
                                            height: 48,
                                            justifyContent: "center",
                                            alignItems: "center",
                                            // FIX #17: disabled state has no visual feedback — added opacity
                                            opacity: (saveEnabled && isTermsAccepted && hasAdditionalNotes) ? 1 : 0.5,
                                        }}
                                    >
                                        <Text style={styles.saveBtnText}>{t("submit")}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                        </View>


                    </>

                    {/* ── Image fullscreen preview modal ───────────────────────── */}
                    {previewImageUri && (
                        <Modal animationType="fade" transparent visible>
                            <View style={styles.imageOverlay}>
                                <Image
                                    source={{uri: previewImageUri}}
                                    style={styles.fullPreviewImage}
                                    resizeMode="contain"
                                />
                                <TouchableOpacity
                                    style={styles.imageCloseBtn}
                                    onPress={() => setPreviewImageUri(null)}
                                >
                                    <MaterialIcons name="close" size={30} color="#fff"/>
                                </TouchableOpacity>
                            </View>
                        </Modal>
                    )}


                </View>

                <CustomModal
                    label={selectedLabel}
                    visible={modalVisible}
                    issues={selectedList}
                    selected={selected}
                    onToggle={toggleIssue}
                    onClose={onCloseModal}
                />

            </KeyboardAwareScrollView>


            <AttachmentSheet
                onClose={() => {
                    setShowAttachmentSheet(false)
                }}
                isShowAttachmentSheet={isShowAttachmentSheet}
                onRecordingStarted={startVoiceNoteFromAttachmentSheet}
                onAttachment={async () => {
                    try {
                        // const flag = canAttachItems(false);
                        // if (!flag) {
                        //     setLoading(false);
                        //     return;
                        // }
                        setShowAttachmentSheet(false)

                        setTimeout(async () => {
                            const files = await pickMultipleDocument();

                            if (!canAttachItems(false, files?.length || 0)) {
                                setLoading(false);
                                return;
                            }

                            addDocuments(files);
                        }, 2000)

                    } catch (error: any) {
                        console.error("Error pick documents:", error.response ? error.response.data : error.message);
                    } finally {
                        setLoading(false);
                    }
                }}
                onImageAttachment={async () => {
                    try {
                        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (!permissionResult.granted) {
                            alert(t("per.camera_roll"));
                            return;
                        }
                        setLoading(true);
                        const images = await pickMultipleImage(t);

                        if (!canAttachItems(false, images?.length || 0)) {
                            setLoading(false);
                            return;
                        }

                        addDocuments(images);
                    } catch (error: any) {
                        console.error("Error pick images:", error.response ? error.response.data : error.message);
                    } finally {
                        setLoading(false);
                    }
                }}
            />

            <TopUpModal
                isVisible={isShowTopUpView}
                onClose={() => showTopUpView(false)}
                isPurchasing={false}
                monthlyTopUpCount={walletData?.minutes?.top_ups_this_month ?? 0}
            />

            <PremiumMinutesModal
                visible={isShowPremiumTopUpView}
                isFreemium={walletData?.subscription?.plan_id === "freemium"}
                onOpenTopup={() => {
                    showPremiumTopUpView(false);
                    setTimeout(() => showTopUpView(true), 1500);
                }}
                onUpgradePremium={() => {
                    showPremiumTopUpView(false);
                    setTimeout(() => {
                        if (walletData?.subscription?.plan_id === "freemium") {
                            router.push("/(app)/manageSubscription/subscription-plans-screen");
                        } else {
                            router.push("/(app)/manageSubscription/upgrade-plans-screen");
                        }
                    }, 1500);
                }}
                onClose={() => showPremiumTopUpView(false)}
            />
        </SafeAreaView>
    );
};


export default function Message() {
    return (
        <PageTourProvider>
            <MessageScreen/>
        </PageTourProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BackgroundColor,
        paddingHorizontal: SPACING.md,
    },
    header: {
        width: "100%",
        height: hp(12),
        flexDirection: "row",
        alignItems: "center",
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerIcon: {
        width: 40,
        height: 40,
        justifyContent: "center",
    },
    headerTitle: {
        fontFamily: "InstrumentSansBold",
        fontSize: RFValue(18),
    },
    headerSubtitle: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(12),
    },
    profileImageContainer: {
        marginLeft: "auto",
    },
    profileImage: {
        width: wp(20),
        height: wp(20),
        borderRadius: wp(100),
    },
    description: {
        fontFamily: "InstrumentSansMedium",
        fontSize: RFValue(17),
        color: COLORS.Black,
    },
    chipWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12
    },
    chip: {
        borderRadius: BORDER_RADIUS.full,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: COLORS.Black,

    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        padding: 20,
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',

    },
    modalItem: {
        paddingVertical: 10,
        borderBottomColor: '#ccc',
        borderBottomWidth: 1,
    },
    doneButton: {
        marginTop: 10,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
    },
    doneText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    chipText: {
        fontSize: 16,
        fontFamily: "InstrumentSansMedium",
        color: COLORS.Black,
    },
    chipNoData: {
        paddingVertical: 8,
        paddingHorizontal: 20,
    },
    formLabel: {
        fontSize: 18,
        fontFamily: "InstrumentSansSemiBold",
        color: COLORS.PrimaryColorText,
    },
    requiredIndicator: {
        color: "#D32F2F",
        fontFamily: "InstrumentSansBold",
    },
    formField: {
        height: 40,
        overflow: "hidden",
        borderBottomWidth: 1,
        borderColor: COLORS.Black,
    },
    formFieldMultiLine: {
        minHeight: 120,
        overflow: "hidden",
        borderBottomWidth: 1,
        borderColor: COLORS.Black,
    },
    formFieldBudgetMultiLine: {
        minHeight: 50,
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
    budgetValue: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: COLORS.Black,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    minMax: {
        fontSize: 14,
        color: '#666',
    },
    saveBtnText: {
        fontFamily: 'InstrumentSansSemiBold',
        fontSize: 18,
        color: COLORS.White
    },
    googlePlacesContainer: {
        position: 'relative',
        zIndex: 1000,
    },
    form: {
        // gap: SPACING.lg,
    },
    label: {
        fontSize: 18,
        fontFamily: "InstrumentSansSemiBold",
        color: COLORS.PrimaryColorText,
    },
    optionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    optionLabel: {
        marginLeft: 10,
        fontSize: 16,
    },
    AttachButton: {
        width: 38,
        height: 38,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.SecodaryColor,
        alignItems: "center",
        justifyContent: "center",
        marginRight: SPACING.sm,
    },
    loaderContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        top: "40%",
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
    },
    formContainer: {
        paddingBottom: 20,    // Space at the bottom before footer
    },
    attachmentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f0f7ff',
        padding: 12,
        marginHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d0e3ff',
        marginTop: 10,
    },
    attachmentText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#333',
    },
    eyeBadge: {
        position: 'absolute',
        top: 6,
        left: 6,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 4,
        padding: 3,
        zIndex: 1,
    },
    attachmentThumb: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#ddd',
        marginRight: 10,
    },
    attachmentIconBox: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#E8F0FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    attachmentTapHint: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    voicePreviewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5EC',
        padding: 10,
        marginHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FFD9B0',
        marginTop: 10,
        gap: 8,
    },
    voicePreviewLabel: {
        flex: 1,
        fontSize: 13,
        fontWeight: '500',
        color: '#333',
    },
    voiceActionBtn: {
        padding: 2,
    },
    imageOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fullPreviewImage: {
        width: '100%',
        height: '85%',
    },
    imageCloseBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 56 : 32,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 6,
    },
    attachmentInfo: {
        flexDirection: 'column', // ← fix, was 'row'
        flex: 1,
        marginEnd: 8,
        marginStart: 4,
    },
    bookingContainer: {
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 8,
    },
    bookingChipGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 12,
        minHeight: 44,
    },
    bookingChip: {
        minHeight: 36,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: c.GrayLight,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
        marginBottom: 8,
        backgroundColor: c.White,
    },
    bookingChipSelected: {
        backgroundColor: c.SecodaryColor,
        borderColor: c.SecodaryColor,
    },
    bookingChipText: {
        fontSize: 12,
        color: c.PrimaryColorText,
        fontWeight: "600",
    },
    bookingChipTextSelected: {
        color: c.White,
    },
    bookingEmptyText: {
        color: c.GrayDark,
        fontSize: 13,
        marginTop: 4,
    },
    consultationPolicyText: {
        fontSize: 11,
        color: c.GrayDark,
        textAlign: 'center',
        lineHeight: 16,
        marginTop: -10,
        marginBottom: 12,
    },
    consentContainer: {
        marginHorizontal: 16,
        marginTop: 20,
    },

    checkboxRow: {
        flexDirection: "row",
        alignItems: "flex-start",
    },

    consentText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 11,
        color: c.GrayDark,
        lineHeight: 16,
    },

    highlightText: {
        fontWeight: "700",
        color: COLORS.PrimaryColor,
    },

    policyLink: {
        color: COLORS.PrimaryColor,
        textDecorationLine: "underline",
        fontWeight: "600",
    },
});

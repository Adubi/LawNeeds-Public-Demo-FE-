import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    AppState,
    Dimensions,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {Entypo, Feather, Ionicons, MaterialIcons} from '@expo/vector-icons';
import {COLORS as c} from "@/constants/colors";
import {BORDER_RADIUS, COLORS, FONT_SIZES, SPACING} from "@/constants/theme";

import {useTranslation} from "react-i18next";
import UserService from "@/services/UserServices";
import {
    getAudioToTextApi,
    getLawyerCaseDetails,
    getLawyerTextMessageList,
    getUserCaseDetails,
    getUserTextMessageList,
    sentFileMessage,
    sentLawyerTextMessage,
    sentUserTextMessage
} from "@/services/apiHelper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    clearConsultationSession,
    formatToLocalDateTime,
    getSanitizedFileName,
    handleOpenFile,
    pickDocument,
    pickImage
} from "@/constants/Utility";

import {getAppSelectedLanguage} from "@/components/i18n";
import {router, useFocusEffect, useLocalSearchParams, useNavigationContainerRef} from "expo-router";
import {KeyboardAwareScrollView, KeyboardStickyView} from "react-native-keyboard-controller";
import {ThemedText} from "@/components/ThemedText";
import {ResizeMode, Video} from "expo-av";
import AttachmentSheet from '@/components/chat/AttachmentSheet';
import {SafeAreaView, useSafeAreaInsets} from "react-native-safe-area-context";
import {useApp} from "@/contexts/AppContext";
import {RFValue} from "react-native-responsive-fontsize";
import {useConsultationTimer} from "@/services/useConsultationTimer";
import ConsultationService from "@/services/ConsultationService";
import {setCurrentRoute} from "@/utils/navigationState";
import {manageVoiceRecorder} from "@/components/chat/manageVoiceRecorder";
import PreviewDialog from "@/components/chat/PreviewDialog";
import Analytics from "@/helpers/AnalyticsHelper";
import ExtendTimerModal from "@/app/(app)/requestFlow/ExtendTimerModal";
import ConsultationSurveyModal, {SurveyPayload} from "@/components/consultation/ConsultationSurveyModal";
import PostConsultationActionModal from "@/components/consultation/PostConsultationActionModal";
import {
    ConsultationEndAnswers,
    ConsultationEndConfirmationModal,
    ConsultationEndQuestionsModal
} from "@/components/consultation/ConsultationEndQuestionsModal";
import {NOTIFICATION_TYPES} from "@/constants/NOTIFICATION_TYPES";
import messaging from "@react-native-firebase/messaging";
import { DocumentPickerAsset } from 'expo-document-picker';
import type {ViewStyle} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {requestAppReviewIfEligible} from "@/services/requestAppReview";
import {containsContactDetails} from "@/utils/contactDetails";

interface UserData {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    user_name: string;
    phone_number?: string;
    profile_picture_path?: string | null;
}

const {width} = Dimensions.get("window");

interface Comment {
    message_id: string | number;
    sender_name: string;
    message_content: string;
    created_at: string; // ISO date string
    sender_type: "lawyer" | "user" | string;
    sender_id?: string | number;
    message_type?: string;
    file_type?: string;
    file_url?: string;
    "file_size"?: number | undefined,
    is_read?: boolean,
    "file_name"?: string | undefined,
    "reply_to_message_id"?: string | undefined
}

const escapePdfHtml = (value: string): string => value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
}[character] || character));

const isExportableConversationMessage = (comment: Comment): boolean => {
    const messageType = (comment.message_type || "").toLowerCase();
    const fileType = (comment.file_type || "").toLowerCase();
    const isVoiceOrAttachment = ["voice", "audio", "attachment", "file", "image", "video"]
        .some(type => messageType.includes(type) || fileType.includes(type));

    return Boolean(comment.message_content?.trim()) && !comment.file_url && !isVoiceOrAttachment;
};

const buildConversationTranscriptHtml = (messages: Comment[], participantName: string): string => {
    const messageMarkup = messages.map(message => {
        const sender = escapePdfHtml(message.sender_name || "Consultation participant");
        const timestamp = escapePdfHtml(formatToLocalDateTime(message.created_at));
        const content = escapePdfHtml(message.message_content.trim()).replace(/\n/g, "<br />");

        return `
            <article class="message">
                <p class="meta"><strong>${sender}</strong><span>${timestamp}</span></p>
                <p class="content">${content}</p>
            </article>`;
    }).join("");

    return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8" />
                <style>
                    @page { margin: 22mm 16mm; }
                    * { box-sizing: border-box; }
                    body { color: #033126; font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; }
                    header { border-bottom: 2px solid #DD8550; margin-bottom: 20px; padding-bottom: 12px; }
                    h1 { font-size: 21pt; margin: 0 0 4px; }
                    .subtitle { color: #666666; margin: 0; }
                    .generated { color: #666666; font-size: 9pt; margin: 8px 0 0; }
                    .message { border-bottom: 1px solid #E0E0E0; break-inside: avoid; padding: 12px 0; }
                    .meta { color: #666666; font-size: 9.5pt; margin: 0 0 4px; }
                    .meta strong { color: #033126; margin-right: 8px; }
                    .meta span { color: #666666; }
                    .content { margin: 0; white-space: normal; }
                </style>
            </head>
            <body>
                <header>
                    <h1>Consultation conversation</h1>
                    <p class="subtitle">LawNeeds consultation with ${escapePdfHtml(participantName)}</p>
                    <p class="generated">Exported ${escapePdfHtml(new Date().toLocaleString())}</p>
                </header>
                ${messageMarkup}
            </body>
        </html>`;
};

export default function ConsultationScreen() {

    const {t} = useTranslation();
    const isInitialLoadRef = useRef(true); // ← add this ref

    const [attachment, setAttachment] = useState<DocumentPickerAsset | null>(null);

    const params = useLocalSearchParams();
    const [refreshing, setRefreshing] = useState(false);
    const isUserAtBottom = useRef(true);

    const {
        consultationTimerRefreshKey,
        extendTimerData,
        showExtendTimer,
        refreshConsultationTimer,
        hideExtendTimer,
        setConsultationActive,
    } = useApp();

    useEffect(() => {
        setConsultationActive(true);
        return () => setConsultationActive(false);
    }, []);

    const hasScrolledToBottom = useRef(false);

    const requestDetails = React.useMemo(() =>
            params.data ? JSON.parse(params.data as string) : {},
        [params.data]
    );

    const referral_id = useMemo(() => {
        return params.referral_id || requestDetails.referral_id;
    }, [params.referral_id, requestDetails.referral_id]);


    const isProUser = params.isUserPro === 'true';
    const isHistoryMode = params.historyMode === "true";

    const [caseDetails, setCaseDetails] = useState<any>(null);

    const finalDetails = requestDetails?.referral_id
        ? requestDetails
        : caseDetails;

    const {setCommentsReload} = useApp();
    const navRef = useNavigationContainerRef();

    const [sessionEnded, setSessionEnded] = useState(false);
    const [surveyVisible, setSurveyVisible] = useState(false);
    const [postConsultationActionVisible, setPostConsultationActionVisible] = useState(false);
    const [isExportingConversation, setIsExportingConversation] = useState(false);
    const [surveySubmitting, setSurveySubmitting] = useState(false);
    const [surveySubmitted, setSurveySubmitted] = useState(false);
    const [endFlowSubmitting, setEndFlowSubmitting] = useState(false);
    const [endQuestionsVisible, setEndQuestionsVisible] = useState(false);
    const [endConfirmationVisible, setEndConfirmationVisible] = useState(false);
    const surveyPromptInFlightRef = useRef(false);

    const [selectedLanguageCode, setSelectedLanguageCode] = useState('en');
    const [reloadComments, setReloadComments] = useState(false);
    const [openingMessageId, setOpeningMessageId] = useState<string | number | null>(null);

    const [isShowAttachmentSheet, setShowAttachmentSheet] = useState(false);
    const [loading, setLoading] = useState(false);

    const normalizeSessionId = (value: unknown) => {
        const raw = Array.isArray(value) ? value[0] : value;
        if (!raw || raw === "undefined" || raw === "null") return "";
        return String(raw);
    };

    const session_id =
        normalizeSessionId(params.session_id) ||
        normalizeSessionId(finalDetails?.session_id);

    const surveyStorageKey = useMemo(
        () => session_id ? `consultation_survey_dismissed:${session_id}` : "",
        [session_id]
    );
    const postConsultationActionStorageKey = useMemo(
        () => session_id ? `post_consultation_action:${session_id}` : "",
        [session_id]
    );

    const lawyerProfile = finalDetails?.lawyer_profile || null;
    const lawyerId = lawyerProfile?.lawyer_id || finalDetails?.lawyer_id || finalDetails?.matched_lawyer_id || "";
    const lawyerName = lawyerProfile?.name || finalDetails?.lawyer_name || "your lawyer";
    const lawyerProfilePicture = lawyerProfile?.profile_picture || lawyerProfile?.profile_picture_path || "";

    const {isCaseListReload} = useApp();
    const [stableSessionId, setStableSessionId] = useState<string | null>(null);

    const {timerState, connected, sendSync} = useConsultationTimer(stableSessionId);
    /*  const {
          messages,
          connected: chatConnected,
      } = useConsultationChat(requestDetails?.referral_id);*/

    const isSessionCompleted =
        isHistoryMode ||
        ["completed", "cancelled", "expired"].includes(
            timerState?.session_status || finalDetails?.session_status
        );

    const endConsultationStatus = timerState?.end_consultation?.status || "";
    const consultationEndInProgress = [
        "pending_user_answers",
        "awaiting_final_confirmation",
    ].includes(endConsultationStatus);

    const shouldAllowExtensionPrompt =
        !sessionEnded &&
        !isSessionCompleted &&
        !consultationEndInProgress &&
        timerState?.session_status === "active";

    useEffect(() => {
        if (!session_id || !shouldAllowExtensionPrompt) return;

        ConsultationService.GetActiveExtension(String(session_id))
            .then(response => {
                if (response?.extension && shouldAllowExtensionPrompt) {
                    showExtendTimer(String(referral_id || ""), String(session_id));
                }
            })
            .catch(() => undefined);
    }, [session_id, referral_id, shouldAllowExtensionPrompt, showExtendTimer]);

    useEffect(() => {
        if (!shouldAllowExtensionPrompt) {
            hideExtendTimer();
            return;
        }

        if (["one_minute_warning", "extension_requested", "extension_approved", "extension_proposed", "timer_paused"].includes(timerState?.type || "")) {
            showExtendTimer(String(referral_id || ""), String(session_id || ""));
        }
    }, [hideExtendTimer, referral_id, session_id, shouldAllowExtensionPrompt, showExtendTimer, timerState?.type, timerState?.extension?.id]);



    const {
        recording,
        isRecording,
        readyToRecord,
        waveformBars,
        recordedUri,
        isPaused,
        isPlayingPreview,
        playPauseLivePreview,
        recordingDuration,
        handleVoiceRecording,
        pauseRecording,
        resumeRecording,
        startRecording,
        stopRecording,
        stopAndSendRecording,
        playPreview,
        sendRecording,
        deleteRecording,
    } = manageVoiceRecorder(async (uri: string, referralState: any): Promise<void> => {
        processAudio(uri)
    }, t);

    const [playbackProgress, setPlaybackProgress] = useState(0);


    const scrollViewRef = useRef<ScrollView>(null);
    const [drawerVisible, setDrawerVisible] = useState(false);

    const [loginUser, setUser] = useState<UserData | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);

    const [highlightedIds, setHighlightedIds] = useState<Set<string | number>>(new Set());
    const previousIdsRef = useRef<Set<string | number>>(new Set());

    const [newComment, setNewComment] = useState("");
    const hasStartedTimerRef = useRef(false);

    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [videoModalVisible, setVideoModalVisible] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState('');
    const [selectedVideoUri, setSelectedVideoUri] = useState('');


    const isUnlimitedSession =
        !isSessionCompleted &&
        timerState?.session_status === "active" &&
        !timerState?.total_duration_seconds &&
        !timerState?.session_end_date;


    const [timeLeft, setTimeLeft] = useState<number | null>(0);
    const hasEndedRef = useRef(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const primary = c.PrimaryColor;
    const secondary = c.SecodaryColor;
    const backgroundColor = c.BackgroundColor;
    const textColor = c.PrimaryColorText;
    const inputBg = c.BackgroundColor;
    const disabledColor = c.Disabled;
    const contentHeightRef = useRef(0);

    const customStyles = useMemo(() => createStyles({
        primary,
        secondary,
        inputBackground: inputBg,
        backgroundColor,
        textColor,
        disabledColor
    }), [primary, secondary, backgroundColor, textColor, disabledColor, inputBg]);


    const openAttachmentSheet = () => {
        Keyboard.dismiss(); // Close keyboard
        setTimeout(() => setShowAttachmentSheet(true), 250);
    }

    const timerStateRef = useRef(timerState);

    useEffect(() => {
        timerStateRef.current = timerState;
    }, [timerState]);

    const getRemainingSeconds = useCallback(() => {
        const state = timerStateRef.current; // ✅ always latest
        if (!state) return null;

        if (state.timer_paused) {
            return Math.max(0, state.remaining_seconds ?? 0);
        }

        if (state.session_end_date) {
            const end = new Date(state.session_end_date).getTime();
            return Math.max(0, Math.floor((end - Date.now()) / 1000));
        }

        if (state.timer_started_at && state.total_duration_seconds) {
            const start = new Date(state.timer_started_at).getTime();
            const totalMs = state.total_duration_seconds * 1000;
            return Math.max(0, Math.floor((start + totalMs - Date.now()) / 1000));
        }

        return null;
    }, []);

    const scrollToBottom = useCallback((animated = false) => {
        scrollViewRef.current?.scrollToEnd({animated});
        // ✅ Fallback for KeyboardAwareScrollView
        scrollViewRef.current?.scrollTo({
            y: contentHeightRef.current + 9999,
            animated,
        });
    }, []);

    const promptConsultationSurvey = useCallback(async () => {
        if (!session_id || surveyVisible || surveySubmitted || surveyPromptInFlightRef.current) return;

        surveyPromptInFlightRef.current = true;
        try {
            if (surveyStorageKey) {
                const localState = await AsyncStorage.getItem(surveyStorageKey);
                if (localState === "submitted" || localState === "skipped") {
                    setSurveySubmitted(true);
                    return;
                }
            }

            const response = await ConsultationService.GetSurvey(String(session_id));
            if (response?.submitted || response?.skipped) {
                setSurveySubmitted(true);
                return;
            }

            if (response?.can_submit) {
                setSurveyVisible(true);
            }
        } catch (e) {
            // Survey prompting should never block consultation completion.
        } finally {
            surveyPromptInFlightRef.current = false;
        }
    }, [session_id, surveyStorageKey, surveySubmitted, surveyVisible]);

    const dismissConsultationSurvey = useCallback(async () => {
        if (!session_id) {
            setSurveyVisible(false);
            return;
        }

        try {
            setSurveySubmitting(true);
            await ConsultationService.SubmitSurvey(String(session_id), {
                skipped: true,
                issue_tags: ["skipped"],
            });
            if (surveyStorageKey) {
                await AsyncStorage.setItem(surveyStorageKey, "skipped");
            }
            setSurveySubmitted(true);
            setSurveyVisible(false);
        } catch (e) {
            if (surveyStorageKey) {
                await AsyncStorage.setItem(surveyStorageKey, "skipped");
            }
            setSurveySubmitted(true);
            setSurveyVisible(false);
        } finally {
            setSurveySubmitting(false);
        }
    }, [session_id, surveyStorageKey]);

    const submitConsultationSurvey = useCallback(async (payload: SurveyPayload) => {
        if (!session_id) return;

        try {
            setSurveySubmitting(true);
            await ConsultationService.SubmitSurvey(String(session_id), payload);
            if (surveyStorageKey) {
                await AsyncStorage.setItem(surveyStorageKey, "submitted");
            }
            setSurveySubmitted(true);
            setSurveyVisible(false);
            Alert.alert(
                "Thank you",
                "Your feedback has been submitted.",
                [{
                    text: "OK",
                    onPress: () => {
                        void requestAppReviewIfEligible();
                    },
                }]
            );
        } catch (e: any) {
            const message = e?.detail || e?.message || "Could not submit your feedback. Please try again.";
            Alert.alert("Feedback", message);
        } finally {
            setSurveySubmitting(false);
        }
    }, [session_id, surveyStorageKey]);

    const promptPostConsultationFlow = useCallback(async () => {
        if (isProUser) {
            await promptConsultationSurvey();
            return;
        }

        if (!postConsultationActionStorageKey || postConsultationActionVisible) return;

        const handled = await AsyncStorage.getItem(postConsultationActionStorageKey);
        if (handled) {
            await promptConsultationSurvey();
            return;
        }

        setPostConsultationActionVisible(true);
    }, [
        isProUser,
        postConsultationActionStorageKey,
        postConsultationActionVisible,
        promptConsultationSurvey,
    ]);

    const completePostConsultationAction = useCallback(async (value: string) => {
        if (postConsultationActionStorageKey) {
            await AsyncStorage.setItem(postConsultationActionStorageKey, value);
        }
        setPostConsultationActionVisible(false);
    }, [postConsultationActionStorageKey]);

    const handlePostConsultationSkip = useCallback(async () => {
        await completePostConsultationAction("skipped");
        await promptConsultationSurvey();
    }, [completePostConsultationAction, promptConsultationSurvey]);

    const handleBookFollowUp = useCallback(async () => {
        await completePostConsultationAction("book_follow_up");
        router.push({
            pathname: "/(app)/message",
            params: {
                profilePicture: lawyerProfilePicture,
                lawyerId: String(lawyerId),
                lawyerName,
            },
        });
    }, [completePostConsultationAction, lawyerId, lawyerName, lawyerProfilePicture]);

    const handleChatWithAI = useCallback(async () => {
        await completePostConsultationAction("chat_with_ai");
        await AsyncStorage.removeItem("conversation_id");
        router.push({
            pathname: "/(app)/chats/chat-screen",
            params: {
                initialPrompt: "I hope the consultation was useful. Are there any next steps I can help you with?",
            },
        });
    }, [completePostConsultationAction]);

    const handleExportConversation = useCallback(async () => {
        const transcriptMessages = comments
            .filter(isExportableConversationMessage)
            .sort((first, second) => new Date(first.created_at).getTime() - new Date(second.created_at).getTime());

        if (transcriptMessages.length === 0) {
            Alert.alert("Export conversation", "There are no text messages to export from this consultation.");
            return;
        }

        try {
            const canShare = await Sharing.isAvailableAsync();
            if (!canShare) {
                Alert.alert("Export conversation", "Sharing is not available on this device.");
                return;
            }

            setIsExportingConversation(true);
            const participantName = isProUser
                ? finalDetails?.client_profile?.client_name || "your client"
                : lawyerName;
            const pdf = await Print.printToFileAsync({
                html: buildConversationTranscriptHtml(transcriptMessages, participantName),
            });

            const directory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
            const safeSessionId = String(session_id || Date.now()).replace(/[^a-zA-Z0-9_-]/g, "_");
            const exportUri = directory
                ? `${directory}lawneeds-consultation-${safeSessionId}-${Date.now()}.pdf`
                : pdf.uri;

            if (exportUri !== pdf.uri) {
                await FileSystem.copyAsync({from: pdf.uri, to: exportUri});
            }

            await Sharing.shareAsync(exportUri, {
                dialogTitle: "Export consultation conversation",
                mimeType: "application/pdf",
                UTI: "com.adobe.pdf",
            });
        } catch (error) {
            console.error("Unable to export consultation conversation", error);
            Alert.alert("Export conversation", "We could not create the conversation PDF. Please try again.");
        } finally {
            setIsExportingConversation(false);
        }
    }, [comments, finalDetails?.client_profile?.client_name, isProUser, lawyerName, session_id]);

    useEffect(() => {
        if (isProUser || isSessionCompleted) {
            setEndQuestionsVisible(false);
            setEndConfirmationVisible(false);
            return;
        }

        if (endConsultationStatus === "pending_user_answers") {
            setEndQuestionsVisible(true);
            setEndConfirmationVisible(false);
        } else if (endConsultationStatus === "awaiting_final_confirmation") {
            setEndQuestionsVisible(false);
            setEndConfirmationVisible(true);
        } else {
            setEndQuestionsVisible(false);
            setEndConfirmationVisible(false);
        }
    }, [endConsultationStatus, isProUser, isSessionCompleted]);

    const handleRequestEndConsultation = useCallback(async () => {
        if (!session_id || !isProUser || isSessionCompleted) return;

        try {
            setEndFlowSubmitting(true);
            hideExtendTimer();
            await ConsultationService.RequestEndConsultation(String(session_id));
            if (connected) sendSync();
            Alert.alert(
                "End consultation requested",
                "The client has been asked to answer a few questions before the consultation ends."
            );
        } catch (e: any) {
            const message = e?.response?.data?.detail || e?.detail || e?.message || "Could not request consultation end.";
            Alert.alert("End consultation", message);
        } finally {
            setEndFlowSubmitting(false);
        }
    }, [connected, hideExtendTimer, isProUser, isSessionCompleted, sendSync, session_id]);

    const handleSubmitEndAnswers = useCallback(async (answers: ConsultationEndAnswers) => {
        if (!session_id) return;

        try {
            setEndFlowSubmitting(true);
            const response = await ConsultationService.SubmitEndConsultationAnswers(String(session_id), answers);
            if (connected) sendSync();

            if (response?.action === "return_to_chat") {
                setEndQuestionsVisible(false);
                setEndConfirmationVisible(false);
                return;
            }

            if (response?.action === "book_follow_up") {
                setEndQuestionsVisible(false);
                setEndConfirmationVisible(false);
                try {
                    await ConsultationService.EndTimer(String(session_id));
                } catch {
                    // The timer may already be ending after the server released the zero-time pause.
                }
                await handleBookFollowUp();
                return;
            }

            if (response?.action === "confirm_end") {
                setEndQuestionsVisible(false);
                setEndConfirmationVisible(true);
            }
        } catch (e: any) {
            const message = e?.response?.data?.detail || e?.detail || e?.message || "Could not submit your answers.";
            Alert.alert("End consultation", message);
        } finally {
            setEndFlowSubmitting(false);
        }
    }, [connected, handleBookFollowUp, sendSync, session_id]);

    const handleConfirmEndConsultation = useCallback(async () => {
        if (!session_id) return;

        try {
            setEndFlowSubmitting(true);
            hideExtendTimer();
            await ConsultationService.ConfirmEndConsultation(String(session_id));
            setEndConfirmationVisible(false);
            setSessionEnded(true);
            clearConsultationSession();
            if (connected) sendSync();
            await promptPostConsultationFlow();
        } catch (e: any) {
            const message = e?.response?.data?.detail || e?.detail || e?.message || "Could not end the consultation.";
            Alert.alert("End consultation", message);
        } finally {
            setEndFlowSubmitting(false);
        }
    }, [connected, hideExtendTimer, promptPostConsultationFlow, sendSync, session_id]);

    const isActive = useMemo(() => {
        if (isSessionCompleted) return false;
        if (timerState?.session_status !== "active") return false;
        const remaining = getRemainingSeconds();
        return remaining === null || remaining > 0;
    }, [isSessionCompleted, timerState?.session_status, getRemainingSeconds]);


    // ✅ Listen for one_minute_warning directly on this screen
    useEffect(() => {
        const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
            const data = remoteMessage?.data;
            const isCurrentSessionNotification =
                !data?.session_id || !session_id || String(data.session_id) === String(session_id);
            const canShowExtensionEvent = shouldAllowExtensionPrompt && isCurrentSessionNotification;

            if (data?.type === NOTIFICATION_TYPES.ONE_MINUTE_WARNING) {
                if (!canShowExtensionEvent) return;
                // Show extend dialog directly
                showExtendTimer(
                    data.referral_id ?? "",
                    data.session_id ?? ""
                );
            } else if ([
                NOTIFICATION_TYPES.EXTENSION_STARTED,
                NOTIFICATION_TYPES.EXTENSION_REQUESTED,
                NOTIFICATION_TYPES.EXTENSION_APPROVED,
                NOTIFICATION_TYPES.EXTENSION_PROPOSED,
            ].includes(data?.type)) {
                if (!canShowExtensionEvent) return;
                showExtendTimer(data.referral_id ?? "", data.session_id ?? "");
                refreshConsultationTimer();
            } else if (data?.type === NOTIFICATION_TYPES.EXTENSION_DENIED) {
                if (!isCurrentSessionNotification) return;
                Alert.alert("Extension Denied", remoteMessage?.notification?.body || "The original timer has resumed.");
                refreshConsultationTimer();
            } else if (data?.type === NOTIFICATION_TYPES.EXTENSION_TIMED_OUT) {
                if (!isCurrentSessionNotification) return;
                Alert.alert("Request Timed Out", "The extension request timed out and the original timer has resumed.");
                hideExtendTimer();
                refreshConsultationTimer();
            } else if (data?.type === NOTIFICATION_TYPES.EXTENSION_PAYMENT_CONFIRMED) {
                if (!isCurrentSessionNotification) return;
                refreshConsultationTimer();
            } else if (data?.type === NOTIFICATION_TYPES.CONSULTATION_END_REQUESTED) {
                if (!isCurrentSessionNotification) return;
                refreshConsultationTimer();
                if (connected) sendSync();
            }
        });
        return () => unsubscribe();
    }, [connected, hideExtendTimer, refreshConsultationTimer, sendSync, session_id, shouldAllowExtensionPrompt, showExtendTimer]);


    /*    useEffect(() => {
            if (!messages.length) return;

            console.log(messages);

          /!*  setComments(prev => [
                ...prev,
                ...messages
            ]);*!/
        }, [messages]);*/


    useEffect(() => {
        if (consultationTimerRefreshKey === 0) return; // skip initial render

        if (connected) {
            sendSync(); // ✅ re-fetches latest timerState from WS
        }
    }, [consultationTimerRefreshKey]);


    const handleEndConsultation = useCallback(async () => {
        if (hasEndedRef.current) return;

        hasEndedRef.current = true;
        setSessionEnded(true)
        hideExtendTimer();

        try {

            if (finalDetails?.session_status !== "completed" &&
                finalDetails.consultation_type !== "Ongoing Support" &&
                !isProUser
            ) {
                try {
                    await ConsultationService.EndTimer(session_id);
                } catch (e) {
                    // The post-consultation flow should still appear if the server has already ended the session.
                }
            }

            clearConsultationSession()
            promptPostConsultationFlow();

        } catch (e) {
            hasEndedRef.current = false;
            setSessionEnded(false);
        }
    }, [finalDetails, hideExtendTimer, isProUser, session_id, promptPostConsultationFlow]);

    useEffect(() => {
        const status = timerState?.session_status || finalDetails?.session_status;
        if (status === "completed") {
            promptPostConsultationFlow();
        }
    }, [timerState?.session_status, finalDetails?.session_status, promptPostConsultationFlow]);


    useEffect(() => {
        if (!timerState) return;

        const remaining = getRemainingSeconds();

        if (!timerState.timer_paused && remaining !== null && remaining <= 0) {
            handleEndConsultation();
        }
    }, [timerState]);

    const formatTime = (seconds = 0) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };


    const fetchData = async () => {
        setLoading(true);

        const onSuccess = async (response: any) => {
            if (!response) return;

            setCaseDetails(response);
        };
        const onError = (err: any) => console.error(err);
        const onFinally = () => setLoading(false);

        if (isProUser) {
            await getLawyerCaseDetails(referral_id, onSuccess, onError, onFinally);
        } else {
            await getUserCaseDetails(referral_id, onSuccess, onError, onFinally);
        }
    };

    useEffect(() => {
        if (session_id && !stableSessionId) {
            setStableSessionId(session_id);
        }
    }, [session_id]);

    useEffect(() => {
        if (!referral_id) return;

        // ✅ skip API if already have data
        if (requestDetails?.referral_id) return;

        fetchData();
    }, [referral_id]);


    const startTimer = useCallback(() => {
        if (isUnlimitedSession) return; // 🚀 skip timer

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        intervalRef.current = setInterval(() => {
            const remaining = getRemainingSeconds();

            if (remaining !== null) {
                setTimeLeft(remaining);

                if (remaining <= 0) {
                    clearInterval(intervalRef.current!);
                    handleEndConsultation();
                }
            }
        }, 1000);
    }, [getRemainingSeconds, isUnlimitedSession, handleEndConsultation]);

    useEffect(() => {
        if (isSessionCompleted) return;
        if (!session_id) return;
        if (!timerState) return;

        if (isUnlimitedSession) {
            setTimeLeft(null);
            return;
        }

        const remaining = getRemainingSeconds();
        setTimeLeft(remaining ?? 0);

        if (timerState && timerState.session_status === "active") {
            startTimer();
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [timerState, isSessionCompleted]);

    useEffect(() => {
        if (isSessionCompleted) return;
        if (isUnlimitedSession) return;

        const driftInterval = setInterval(() => {

            const correctTime = getRemainingSeconds();

            if (correctTime === null) return;

            setTimeLeft(prev => {
                if (prev && Math.abs(prev - correctTime) > 2) {
                    return correctTime;
                }
                return prev;
            });
        }, 10000);

        return () => clearInterval(driftInterval);
    }, [timerState, isSessionCompleted]);


    const appState = useRef(AppState.currentState);


    useEffect(() => {

        if (isSessionCompleted) return;
        const subscription = AppState.addEventListener("change", (nextState) => {


            if (
                appState.current.match(/inactive|background/) &&
                nextState === "active"
            ) {
                setReloadComments(prev => !prev);

                // ✅ existing timer logic
                if (!isUnlimitedSession) {
                    const remaining = getRemainingSeconds();
                    if (remaining !== null) {
                        setTimeLeft(remaining);
                    }
                }
                startTimer();
            } else if (nextState === "background") {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            }

            appState.current = nextState;

        });

        return () => subscription.remove();
    }, [timerState, isSessionCompleted]);

    useEffect(() => {

        if (isSessionCompleted) return;

        if (!timerState) return;

        if (timerState.session_status === "completed") {
            handleEndConsultation();
        }

    }, [timerState?.session_status, isSessionCompleted]);


    const blinkAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {

        if (isSessionCompleted) return;
        if (isActive) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(blinkAnim, {toValue: 0.3, duration: 500, useNativeDriver: true}),
                    Animated.timing(blinkAnim, {toValue: 1, duration: 500, useNativeDriver: true}),
                ])
            ).start();
        }
    }, [isActive, isSessionCompleted]);


    const onRefresh = async () => {
        try {
            setRefreshing(true);
            fetchMessages();

        } catch (e) {
            // console.log("Refresh failed");
        } finally {
            setRefreshing(false);
        }
    };

    const fetchMessages = useCallback(() => {

        const apiCall = isProUser
            ? getLawyerTextMessageList
            : getUserTextMessageList;

        apiCall(referral_id, (response: any) => {
            const updatedResponse = response.map((item: any) => ({
                ...item,
                file_url: item.file_url?.includes("|url:")
                    ? item.file_url.split("|url:")[1]
                    : item.file_url
            }));

            const newIds = new Set<string | number>(
                updatedResponse.map((m: any) => m.message_id as string | number)
            );

            if (isInitialLoadRef.current) {
                isInitialLoadRef.current = false;
                setComments(updatedResponse);
                previousIdsRef.current = newIds;
                setTimeout(() => scrollToBottom(false), 100);
                setTimeout(() => scrollToBottom(false), 300);
                setTimeout(() => scrollToBottom(false), 600);
                return;
            }

            // ✅ Subsequent loads — only highlight truly new messages
            const prevIds = previousIdsRef.current;
            const newlyAdded = updatedResponse
                .filter((m: any) => {
                    if (!prevIds.has(m.message_id)) {
                        if (isProUser) {
                            return m.sender_type === 'user';
                        } else {
                            return m.sender_type === 'lawyer';
                        }
                    }
                    return false;
                })
                .map((m: any) => m.message_id);

            if (newlyAdded.length > 0) {
                setHighlightedIds(prev => {
                    const updated = new Set(prev);
                    newlyAdded.forEach((id: any) => updated.add(id));
                    return updated;
                });
                setTimeout(() => {
                    setHighlightedIds(prev => {
                        const updated = new Set(prev);
                        newlyAdded.forEach((id: any) => updated.delete(id));
                        return updated;
                    });
                }, 2500);
            }
            previousIdsRef.current = newIds;
            setComments(updatedResponse);
        }, (err: any) => {
            // console.log("Fetch error:", err?.response?.status, err?.response?.data);
        });

    }, [isProUser, referral_id, isCaseListReload]);


    useFocusEffect(
        useCallback(() => {
            if (!referral_id) return;
            fetchMessages();
        }, [fetchMessages, referral_id, reloadComments])
    );

    const sentNewMessage = (content: string, replyMessageId: string) => {

        if (!finalDetails?.referral_id) return;

        const data = {
            message_content: content,
            message_type: "text",
            reply_to_message_id: isProUser ? replyMessageId : ""
        };

        const sendFunction = isProUser ? sentLawyerTextMessage : sentUserTextMessage;

        sendFunction(
            finalDetails.referral_id,
            data,
            async (response: any) => {
                setCommentsReload();
            },
            (error: any) => {
                console.error(`Error sending message (${isProUser ? 'Pro' : 'User'}):`, error);
            }
        );

    }

    const sendFile = (fileUri: any, type = "", name = "") => {

        if (!finalDetails?.referral_id) return;

        let trimmedMessage =
            type.startsWith("image")
                ? t('file.uploading_image')
                : type.startsWith("video")
                    ? t('file.uploading_video')
                    : t('file.uploading_file');

        const commentID = Date.now().toString();

        setComments(prev => [
            ...prev,
            {
                message_id: commentID,
                sender_name: loginUser ? loginUser.full_name : t('user_label'),
                sender_id: loginUser ? loginUser.id : 0,
                message_content: trimmedMessage,
                file_type: "text",
                message_type: "text",
                file_url: "",
                created_at: new Date().toISOString(),
                sender_type: isProUser ? "lawyer" : "user",
            },
        ]);

        setLoading(true);

        sentFileMessage(finalDetails.referral_id, fileUri, isProUser, (response: any) => {
            setLoading(false);
            // Use functional update to target the specific temp ID
            setComments(prev => prev.map(c =>
                c.message_id === commentID ? {
                    ...c,
                    message_content: "",
                    file_type: type || "image/",
                    file_url: fileUri,
                    file_name: getSanitizedFileName(name)
                } : c
            ));
            setCommentsReload(); // Sync with global context
            setReloadComments(!reloadComments);

        }, (error: any) => {
            setLoading(false);
            const errorDetail = error?.response?.data?.detail;
            let message = t('file.upload_failed_message');

            if (Array.isArray(errorDetail)) {
                message = errorDetail[0]?.msg ?? message;
            } else if (typeof errorDetail === "string") {
                message = errorDetail;
            }
            Alert.alert(t('file.upload_failed'), message);
        }, () => {
        }, type, getSanitizedFileName(name));
    };


    useEffect(() => {

        const getLanguageData = async () => {
            const code = await getAppSelectedLanguage();
            setSelectedLanguageCode(code)
        };

        getLanguageData();

    }, [])

    useEffect(() => {

        const fetchProfile = async () => {
            try {
                const res = await UserService.GetProfile();
                if (res.profile) {

                    let userData = res.profile;

                    let fullName: string;
                    if (userData.professional_type === "Law Firm") {
                        fullName = userData.firm_name
                    } else if (userData.professional_type === "A2J Partners") {
                        fullName = userData?.organisation_name
                    } else {
                        fullName = userData?.first_name + " " + userData?.last_name
                    }
                    setUser({
                        id: res.profile.id,
                        email: userData?.email,
                        first_name: userData?.first_name,
                        last_name: userData?.last_name,
                        full_name: fullName,
                        user_name: userData?.user_name,
                        phone_number: userData?.phone_number,
                        profile_picture_path: userData?.profile_picture_path || "",
                    });

                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchProfile()

    }, [])

    useEffect(() => {
        if (isSessionCompleted) return;
        if (!session_id) return;
        if (hasStartedTimerRef.current) return;

        const isBillableMessage = (comment: Comment) => {
            const messageType = comment.message_type || "";
            const content = comment.message_content || "";
            return (
                !["chat_history", "service_request_manuscript"].includes(messageType) &&
                !content.toUpperCase().includes("NEW SERVICE REQUEST")
            );
        };
        const hasUserMessage = comments.some(c => c.sender_type === "user" && isBillableMessage(c));
        const hasLawyerMessage = comments.some(c => c.sender_type === "lawyer" && isBillableMessage(c));
        const isTimerInactive = !timerState?.timer_started_at;
        if (hasUserMessage &&
            hasLawyerMessage &&
            isTimerInactive
        ) {
            hasStartedTimerRef.current = true;

            ConsultationService.StartTimer(session_id)
                .then(() => {
                    Analytics.consultationStarted({
                        mode: "chat",
                        duration: timerState?.timer_started_at
                    })
                })
                .catch((e) => {
                    hasStartedTimerRef.current = false;
                });
        }
    }, [comments, isSessionCompleted, session_id]);


    const handleSendComment = (text = "") => {

        let trimmedMessage = text !== "" ? text : newComment.trim()

        if (trimmedMessage) {
            if (containsContactDetails(trimmedMessage)) {
                Alert.alert(
                    t('contact_details_blocked_title', {defaultValue: 'Contact details not allowed'}),
                    t('contact_details_blocked_message', {
                        defaultValue: 'Phone numbers and email addresses cannot be shared in consultation messages. Please keep communication within LawNeeds.'
                    })
                );
                return;
            }
            const tempId = Date.now().toString();
            const optimisticComment = {
                message_id: tempId,
                sender_name: loginUser ? loginUser.full_name : t('user_label'),
                message_content: trimmedMessage,
                created_at: new Date().toISOString(),
                sender_type: isProUser ? "lawyer" : "user",
            };

            sentNewMessage(trimmedMessage, "");
            setComments(prev => [...prev, optimisticComment]);
            setNewComment("");

            isUserAtBottom.current = true;
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({animated: true});
            }, 100);
        }
    };


    const processAudio = async (uri: string) => {

        setLoading(true);

        const authToken = await AsyncStorage.getItem("auth_token");
        if (!authToken) {
            setLoading(false);
            Alert.alert(t('error'), t('error.token_missing'));
            return;
        }

        await getAudioToTextApi(uri, selectedLanguageCode, async (text: any) => {
            await handleSendComment(text);
        }, (error: any) => {
            const errorDetail = error?.response?.data?.detail;

            let message = t('error.error_process_audio');

            if (Array.isArray(errorDetail)) {
                message = errorDetail[0]?.msg ?? errorDetail[0]?.message ?? message;

            } else if (typeof errorDetail === "string") {
                message = errorDetail;

            } else if (typeof errorDetail === "object" && errorDetail !== null) {
                message = errorDetail.message ?? errorDetail.error ?? message;
            }

            Alert.alert(t('error.title'), message);
        }, () => {
            setLoading(false);
        });
    };

    const slideAnim = useRef(new Animated.Value(width)).current;

    const toggleDrawer = () => {
        if (drawerVisible) {
            Animated.timing(slideAnim, {
                toValue: width,
                duration: 300,
                useNativeDriver: false,
            }).start(() => setDrawerVisible(!drawerVisible));
        } else {
            setDrawerVisible(!drawerVisible);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
    };

    const handleImagePress = (uri: any) => {
        setSelectedImageUri(uri);
        setImageModalVisible(true);
    };

    const handleVideoPress = (uri: any) => {
        setSelectedVideoUri(uri);
        setVideoModalVisible(true);
    };

    const refreshMessageAttachment = useCallback(
        (comment: Comment): Promise<Comment> =>
            new Promise((resolve, reject) => {
                if (!referral_id) {
                    reject(new Error("Missing referral id"));
                    return;
                }

                const apiCall = isProUser
                    ? getLawyerTextMessageList
                    : getUserTextMessageList;

                apiCall(referral_id, (response: Comment[]) => {
                    const refreshedMessages = response.map((item: Comment) => ({
                        ...item,
                        file_url: item.file_url?.includes("|url:")
                            ? item.file_url.split("|url:")[1]
                            : item.file_url,
                    }));
                    const refreshedMessage = refreshedMessages.find(
                        item => String(item.message_id) === String(comment.message_id)
                    );

                    if (!refreshedMessage?.file_url) {
                        reject(new Error("The refreshed attachment URL is unavailable"));
                        return;
                    }

                    setComments(refreshedMessages);
                    resolve(refreshedMessage);
                }, reject);
            }),
        [isProUser, referral_id]
    );

    const openMessageAttachment = useCallback(async (
        comment: Comment,
        open: (freshComment: Comment) => void | Promise<void>,
    ) => {
        if (openingMessageId !== null) return;

        setOpeningMessageId(comment.message_id);
        try {
            const refreshedMessage = await refreshMessageAttachment(comment);
            await open(refreshedMessage);
        } catch (error) {
            console.error("Unable to refresh message attachment", error);
            Alert.alert(
                t("error.title"),
                "We could not refresh this attachment. Please check your connection and try again."
            );
        } finally {
            setOpeningMessageId(null);
        }
    }, [openingMessageId, refreshMessageAttachment, t]);

    const handleBackPress = async () => {
        if (navRef.canGoBack()) {
            if (recording) await recording.stopAndUnloadAsync();
            router.back();
        } else {
            if (recording) await recording.stopAndUnloadAsync();
            router.push("/");
        }
    };

    const handleEndChat = () => {
        toggleDrawer();
        handleRequestEndConsultation();
    };

    const handleHelp = () => {
        setDrawerVisible(false);
        slideAnim.setValue(width);
        router.push("/(app)/manage/support");
    };

    useEffect(() => {
        setCurrentRoute("ConsultationScreen", {
            session_id: session_id,
            referral_id: params.referral_id,
        });
    }, []);


    const edgesData = ['top', 'left', 'right', 'bottom'] as const;
    const insets = useSafeAreaInsets(); // ← never referenced

    return (
        <SafeAreaView edges={edgesData}
                      style={{flex: 1, backgroundColor: backgroundColor}}>

            <View style={{flex: 1, backgroundColor: backgroundColor}}>

                <View style={styles.modalContent}>

                    <View style={styles.modalHeader}>

                        <TouchableOpacity
                            onPress={handleBackPress}
                            accessibilityRole="button"
                            accessibilityLabel={t('change_email.go_back')}
                            style={styles.backButton}
                        >
                            <MaterialIcons name="arrow-back-ios" size={24} color="#333"/>
                        </TouchableOpacity>


                        <View style={{alignItems: "center", flex: 1}}>
                            <Text style={{
                                fontSize: RFValue(16),
                                fontWeight: '600',
                                color: c.PrimaryColorText
                            }}>
                                {isProUser
                                    ? finalDetails?.client_profile?.client_name || "Loading..."
                                    : finalDetails?.lawyer_profile?.name || "Loading..."}
                            </Text>

                            {/* 🔥 LIVE TIMER */}
                            <View style={{flexDirection: "row", alignItems: "center", marginTop: 2}}>

                                <Animated.View style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: isSessionCompleted
                                        ? "red"
                                        : isActive
                                            ? "green"
                                            : "#999",
                                    marginRight: 6,
                                    opacity: isActive ? blinkAnim : 1
                                }}/>

                                <Text style={{
                                    fontSize: 12,
                                    color: isSessionCompleted ? "red" : isActive ? "green" : "#999",
                                    fontWeight: "500"
                                }}>
                                    {isSessionCompleted
                                        ? t('consultation.completed')
                                        : isActive
                                            ? isUnlimitedSession
                                                ? t('consultation.active')
                                                : timerState?.timer_paused
                                                    ? "Paused"
                                                    : formatTime(timeLeft || 0)
                                            : (timerState?.timer_started_at && timerState?.session_status !== "completed")
                                                ? formatTime(timeLeft || 0)
                                                : t('consultation.pending')}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity onPress={toggleDrawer} style={styles.headerIcon}>
                            <MaterialIcons name="menu" size={24} color={textColor}/>
                        </TouchableOpacity>
                    </View>


                    {/* Drawer overlaying page */}
                    {drawerVisible && <Animated.View style={[styles.drawer, {
                        transform: [{translateX: slideAnim}],
                        backgroundColor: backgroundColor
                    }]}>
                        <TouchableOpacity
                            style={styles.drawerItem}
                            onPress={handleHelp}
                        >
                            <Text style={styles.drawerText}>{t('chat.help')}</Text>
                        </TouchableOpacity>

                        {(isSessionCompleted || sessionEnded) && (
                            <>
                                <View style={styles.separator}/>
                                <TouchableOpacity
                                    accessibilityRole="button"
                                    accessibilityLabel="Export conversation as PDF"
                                    accessibilityHint="Creates a text-only PDF and opens the device share sheet"
                                    disabled={isExportingConversation}
                                    style={styles.drawerItem}
                                    onPress={handleExportConversation}
                                >
                                    <View style={{flexDirection: "row", alignItems: "center", gap: 8}}>
                                        <MaterialIcons name="picture-as-pdf" size={20} color={c.SecodaryColor}/>
                                        <Text style={[styles.drawerText, isExportingConversation && {opacity: 0.5}]}>Export conversation (PDF)</Text>
                                    </View>
                                </TouchableOpacity>
                            </>
                        )}

                        {isProUser && !isSessionCompleted && (
                            <View style={styles.separator}/>)}

                        {isProUser && !isSessionCompleted && (<TouchableOpacity
                            style={styles.drawerItem}
                            onPress={handleEndChat}
                            disabled={endFlowSubmitting || consultationEndInProgress}
                        >
                            <Text style={[
                                styles.drawerText,
                                {color: "red"},
                                (endFlowSubmitting || consultationEndInProgress) && {opacity: 0.5}
                            ]}>
                                End Consultation
                            </Text>
                        </TouchableOpacity>)}
                    </Animated.View>
                    }


                    {/* Comment List */}
                    <KeyboardAwareScrollView style={styles.commentList}
                                             ref={scrollViewRef}
                                             keyboardDismissMode="interactive"
                                             keyboardShouldPersistTaps="handled"
                                             scrollEventThrottle={16}
                                             onLayout={() => {
                                                 // ✅ Fires when scroll view first renders
                                                 if (!hasScrolledToBottom.current) {
                                                     scrollToBottom(false);
                                                 }
                                             }}
                                             onScroll={(event) => {
                                                 const {
                                                     layoutMeasurement,
                                                     contentOffset,
                                                     contentSize
                                                 } = event.nativeEvent;

                                                 isUserAtBottom.current = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
                                             }}

                                             refreshControl={
                                                 <RefreshControl
                                                     refreshing={refreshing}
                                                     onRefresh={onRefresh}
                                                     tintColor={c.SecodaryColor}
                                                 />
                                             }

                                             onContentSizeChange={(_, height) => {

                                                 contentHeightRef.current = height;

                                                 if (!hasScrolledToBottom.current) {
                                                     hasScrolledToBottom.current = true;
                                                     scrollToBottom(false);
                                                     return;
                                                 }
                                                 if (isUserAtBottom.current) {
                                                     scrollToBottom(true);
                                                 }

                                             }}>
                        {comments.map((comment) => {

                            let isUser;
                            if (isProUser) {
                                isUser = comment.sender_type === 'lawyer'; // Customize as per logic
                            } else {
                                isUser = comment.sender_type === 'user'; // Customize as per logic
                            }

                            return (
                                <View
                                    key={comment.message_id}
                                    style={[
                                        styles.commentItem,
                                        isUser ? styles.bubbleRight : styles.bubbleLeft,

                                        // 🔥 Highlight style
                                        highlightedIds.has(comment.message_id) && {
                                            backgroundColor: "#FFF3CD", // soft yellow
                                            borderRadius: 8,
                                        }
                                    ]}
                                >
                                    <Text style={styles.commentUser}>{comment.sender_name}</Text>
                                    <View style={comment.file_url ? customStyles.fileBubble(isUser) :
                                        customStyles.messageBubble(isUser)}>

                                        {comment.file_url ? (
                                            <>
                                                {/* 🖼️ If Image */}
                                                {comment.file_type?.startsWith("image/") && (
                                                    <TouchableOpacity
                                                        style={{width: 200, height: 200, borderRadius: 10}}
                                                        disabled={openingMessageId !== null}
                                                        onPress={() => openMessageAttachment(comment, freshComment => {
                                                            handleImagePress(freshComment.file_url);
                                                        })}
                                                    >
                                                        <Image
                                                            source={{uri: comment.file_url}}
                                                            style={{width: 200, height: 200, borderRadius: 10}}
                                                            resizeMode="cover"
                                                        />
                                                        {openingMessageId === comment.message_id && (
                                                            <View style={styles.attachmentLoadingOverlay}>
                                                                <ActivityIndicator size="small" color="#fff"/>
                                                            </View>
                                                        )}
                                                    </TouchableOpacity>
                                                )}

                                                {/* 🎥 If Video */}
                                                {comment.file_type?.startsWith("video/") && (

                                                    <TouchableOpacity
                                                        style={{
                                                            width: 200, height: 200, borderRadius: 10,
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                        disabled={openingMessageId !== null}
                                                        onPress={() => openMessageAttachment(comment, freshComment => {
                                                            handleVideoPress(freshComment.file_url);
                                                        })}
                                                    >
                                                        <Video
                                                            source={{uri: comment.file_url}}
                                                            style={{width: 200, height: 200, borderRadius: 10}}
                                                            useNativeControls
                                                            resizeMode={ResizeMode.CONTAIN}
                                                        />


                                                        <View style={styles.playIconOverlay}>
                                                            {openingMessageId === comment.message_id
                                                                ? <ActivityIndicator size="small" color="#fff"/>
                                                                : <MaterialIcons name="play-circle-fill" size={36}
                                                                                 color="white"/>
                                                            }
                                                        </View>

                                                    </TouchableOpacity>
                                                )}

                                                {/* 📄 If PDF or Other File */}
                                                {comment.file_url && comment.file_type?.startsWith("application/") ? (
                                                    <TouchableOpacity
                                                        disabled={openingMessageId !== null}
                                                        onPress={() => openMessageAttachment(comment, freshComment =>
                                                            handleOpenFile(
                                                                freshComment.file_url || "",
                                                                freshComment.file_name || "",
                                                                freshComment.file_type || ""
                                                            )
                                                        )}
                                                        style={{
                                                            padding: 10,
                                                            flexDirection: "row",
                                                            borderRadius: BORDER_RADIUS.lg,
                                                            backgroundColor: isUser ? "#D9CAA8" : "#666666",
                                                            ...(isUser
                                                                ? {borderBottomRightRadius: 0}
                                                                : {borderBottomLeftRadius: 0}),
                                                            alignItems: "center",
                                                        }}
                                                    >
                                                        {openingMessageId === comment.message_id ? (
                                                            <ActivityIndicator size="small" color={isUser ? c.PrimaryColor : "#fff"}/>
                                                        ) : (
                                                            <Text style={customStyles.messageText(isUser)}>
                                                                📄 {comment.file_type === "application/pdf"
                                                                ? comment.file_name ? comment.file_name : t('file.open_pdf')
                                                                : comment.file_name ? comment.file_name : t('file.open_doc')}
                                                            </Text>
                                                        )}
                                                    </TouchableOpacity>
                                                ) : null}
                                            </>
                                        ) : (
                                            <Text
                                                style={customStyles.messageText(isUser)}>{comment.message_content}</Text>
                                        )}
                                    </View>
                                    <Text
                                        style={styles.commentTime}>{formatToLocalDateTime(comment.created_at)}</Text>
                                </View>
                            );
                        })}
                    </KeyboardAwareScrollView>

                    {/* Comment Input */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={{
                            backgroundColor: backgroundColor,
                            justifyContent: 'flex-end',
                        }}
                        //keyboardVerticalOffset={Platform.OS === "ios" ? (useSafeAreaInsets().bottom + 44) : 16}
                    >
                        <AttachmentSheet
                            isShowAttachmentSheet={isShowAttachmentSheet}
                            onClose={() => {
                                setShowAttachmentSheet(false)
                            }}
                            onRecordingStarted={() => {
                                handleVoiceRecording().then(() => {

                                })
                            }}
                            onAttachment={() => {
                                setShowAttachmentSheet(false);

                                setTimeout(() => {
                                    setLoading(false)
                                    pickDocument(false).then((file) => setAttachment(file ?? null))
                                }, 1000)

                            }}
                            onImageAttachment={() => {

                                pickImage((file: any) => setAttachment(file), (errorMessage: string) => {
                                    // console.log("errorMessage", errorMessage)
                                }, t)

                            }}
                        />

                        <Modal animationType="slide"
                               visible={videoModalVisible} transparent={true}>
                            <View style={styles.attachmentOverlay}>

                                <Video
                                    source={{uri: selectedVideoUri}}
                                    rate={1.0}
                                    volume={1.0}
                                    isMuted={false}
                                    resizeMode={ResizeMode.CONTAIN}
                                    shouldPlay
                                    useNativeControls
                                    style={styles.videoPlayer}
                                />

                                <Pressable style={styles.attachmentCloseButton}
                                           onPress={() => setVideoModalVisible(false)}>
                                    <MaterialIcons name="close" size={30} color="white"/>
                                </Pressable>

                            </View>
                        </Modal>

                        <Modal animationType="slide"
                               visible={imageModalVisible} transparent={true}>
                            <View style={styles.attachmentOverlay}>

                                <Image
                                    source={{uri: selectedImageUri}}
                                    style={styles.fullImage}
                                    resizeMode="contain"
                                />

                                <Pressable style={styles.attachmentCloseButton}
                                           onPress={() => setImageModalVisible(false)}>
                                    <MaterialIcons name="close" size={30} color="white"/>
                                </Pressable>

                            </View>
                        </Modal>
                    </KeyboardAvoidingView>

                </View>


                <View style={styles.inputContainer}>

                    <KeyboardStickyView style={{
                        flexDirection: 'row',
                        width: "100%",
                        alignItems: 'center',
                        backgroundColor: backgroundColor,
                        paddingVertical: SPACING.sm,
                        paddingTop: Platform.OS === "ios" ? 8 : SPACING.sm,
                        marginBottom: Platform.OS === "ios" ? -insets.bottom : 0,
                        paddingBottom: Platform.OS === "ios" ? insets.bottom : SPACING.sm,
                        paddingHorizontal: SPACING.md,
                    }}
                    >

                        {(isRecording || isPaused || recordedUri) ? (
                            <TouchableOpacity
                                onPress={deleteRecording}
                                style={[styles.attachButton, {
                                    backgroundColor: 'transparent',
                                    borderWidth: 0,
                                }]}
                            >
                                <MaterialIcons name="delete-outline" size={26} color={textColor}/>
                            </TouchableOpacity>
                        ) : readyToRecord ? (
                            // Cancel "ready to record"
                            <TouchableOpacity
                                onPress={() => handleVoiceRecording()}
                                style={[styles.attachButton, {backgroundColor: '#808080'}]}
                            >
                                <MaterialIcons name="close" size={24} color="#fff"/>
                            </TouchableOpacity>
                        ) : (
                            // Normal "+" button
                            <TouchableOpacity
                                onPress={openAttachmentSheet}
                                disabled={loading || isRecording || sessionEnded || isSessionCompleted || consultationEndInProgress}
                                style={[
                                    styles.attachButton,
                                    (loading || isRecording || sessionEnded || isSessionCompleted || consultationEndInProgress) && {backgroundColor: '#808080'},
                                ]}
                            >
                                <Feather name="plus" size={24} color="#fff"/>
                            </TouchableOpacity>
                        )}

                        {isRecording ? (
                            <View style={[styles.recordingViewArea, {
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 12,
                                gap: 8,
                            }]}>
                                <ThemedText style={{
                                    color: textColor,
                                    fontSize: 13,
                                    fontVariant: ['tabular-nums'],
                                    minWidth: 36,
                                }}>
                                    {`0:${recordingDuration < 10 ? `0${recordingDuration}` : recordingDuration}`}
                                </ThemedText>

                                <View style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 2,
                                    overflow: 'hidden',
                                }}>
                                    {waveformBars.map((barHeight, i) => (
                                        <View
                                            key={i}
                                            style={{
                                                width: 3,
                                                borderRadius: 2,
                                                backgroundColor: textColor,
                                                height: barHeight,
                                                opacity: 0.85,
                                            }}
                                        />
                                    ))}
                                </View>
                            </View>
                        ) : isPaused ? (
                            <View style={[styles.recordingViewArea, {
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 8,
                                gap: 6,
                            }]}>
                                <TouchableOpacity
                                    onPress={() => playPauseLivePreview(setPlaybackProgress)}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        marginEnd: 4,
                                        borderRadius: 16,
                                        backgroundColor: secondary,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Ionicons
                                        name={isPlayingPreview ? "pause" : "play"}
                                        size={16}
                                        color="#fff"
                                    />
                                </TouchableOpacity>

                                <View style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 2,
                                    overflow: 'hidden',
                                }}>
                                    {waveformBars.map((barHeight, i) => {
                                        const barProgress = i / waveformBars.length;
                                        const isActive =
                                            isPlayingPreview &&
                                            barProgress <= playbackProgress;

                                        return (
                                            <View
                                                key={i}
                                                style={{
                                                    width: 3,
                                                    borderRadius: 2,
                                                    backgroundColor: isActive ? secondary : '#ccc',
                                                    height: isActive
                                                        ? barHeight * 1.15
                                                        : barHeight,
                                                    opacity: isActive ? 1 : 0.5,
                                                }}
                                            />
                                        );
                                    })}
                                </View>

                                <ThemedText style={{
                                    color: textColor,
                                    fontSize: 12,
                                    fontVariant: ['tabular-nums'],
                                }}>
                                    {`0:${recordingDuration < 10 ? `0${recordingDuration}` : recordingDuration}`}
                                </ThemedText>
                            </View>
                        ) : recordedUri ? (
                            <View style={[styles.inputArea, {
                                flexDirection: 'row',
                                alignItems: 'center',
                                alignSelf: 'center',
                                paddingHorizontal: 12,
                                justifyContent: 'space-between',
                            }]}>
                                <Entypo name="sound" size={18} color={textColor}/>

                                <ThemedText style={{
                                    marginHorizontal: 8,
                                    color: textColor,
                                    fontSize: 13,
                                }}>
                                    {t('chat.voice_note_ready')}
                                </ThemedText>

                                <TouchableOpacity
                                    onPress={playPreview}
                                    style={{padding: 4}}
                                >
                                    <MaterialIcons
                                        name={
                                            isPlayingPreview
                                                ? "pause-circle-filled"
                                                : "play-circle-fill"
                                        }
                                        size={28}
                                        color={secondary}
                                    />
                                </TouchableOpacity>
                            </View>
                        ) : readyToRecord ? (
                            <View style={[styles.inputArea, {
                                justifyContent: 'center',
                                paddingHorizontal: 12,
                            }]}>
                                <ThemedText style={{
                                    color: '#FF3B30',
                                    fontSize: 13,
                                }}>
                                    {t('chat.tap_to_record')}
                                </ThemedText>
                            </View>
                        ) : (
                            // Normal text input
                            <View style={styles.inputArea}>
                                <TextInput
                                    value={newComment}
                                    editable={!sessionEnded && !isSessionCompleted && !consultationEndInProgress}
                                    onChangeText={setNewComment}
                                    placeholder={t('chat.chat_place_holder')}
                                    placeholderTextColor="#999999"
                                    autoCorrect={true}
                                    spellCheck={true}
                                    autoCapitalize="sentences"
                                    autoComplete="off"
                                    importantForAutofill="no"
                                    multiline={true}
                                    submitBehavior="submit"
                                    style={[styles.textInput, {color: textColor}]}
                                />
                            </View>
                        )}

                        {isRecording ? (
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8
                            }}>
                                <TouchableOpacity
                                    onPress={pauseRecording}
                                    disabled={loading}
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 22,
                                        borderWidth: 2,
                                        borderColor: textColor,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <MaterialIcons
                                        name="pause"
                                        size={22}
                                        color={textColor}
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={async () => {
                                        stopAndSendRecording();
                                    }}
                                    disabled={loading}
                                    style={[
                                        styles.sendButton,
                                        {backgroundColor: '#25D366'}
                                    ]}
                                >
                                    <Ionicons
                                        name="send"
                                        size={22}
                                        color="#fff"
                                    />
                                </TouchableOpacity>
                            </View>
                        ) : isPaused ? (
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8
                            }}>
                                <TouchableOpacity
                                    onPress={resumeRecording}
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 22,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Feather
                                        name="mic"
                                        size={26}
                                        color="#FF3B30"
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={async () => {
                                        stopAndSendRecording();
                                    }}
                                    style={[
                                        styles.sendButton,
                                        {backgroundColor: '#25D366'}
                                    ]}
                                >
                                    <Ionicons
                                        name="send"
                                        size={22}
                                        color="#fff"
                                    />
                                </TouchableOpacity>
                            </View>
                        ) : readyToRecord ? (
                            // 🔴 Red mic — user taps to actually begin recording
                            <TouchableOpacity
                                onPress={startRecording}
                                disabled={loading || sessionEnded || isSessionCompleted || consultationEndInProgress}
                                style={[
                                    styles.sendButton,
                                    (loading) && {backgroundColor: '#808080'}
                                ]}
                            >
                                <Feather name="mic" size={24} color="#fff"/>
                            </TouchableOpacity>
                        ) : recordedUri ? (
                            // 🟠 Orange send — send the voice note
                            <TouchableOpacity
                                onPress={sendRecording}
                                disabled={loading || sessionEnded || isSessionCompleted || consultationEndInProgress}
                                style={[
                                    styles.sendButton,
                                    {backgroundColor: secondary},
                                    (loading || sessionEnded || isSessionCompleted || consultationEndInProgress) && {backgroundColor: '#808080'}
                                ]}
                            >
                                <Ionicons name="send" size={24} color="#fff"/>
                            </TouchableOpacity>
                        ) : (
                            newComment?.trim()?.length > 0 ? (
                                // Send button when a text exists
                                <TouchableOpacity
                                    onPress={() => handleSendComment()}
                                    disabled={loading || sessionEnded || isSessionCompleted || consultationEndInProgress}
                                    style={[
                                        styles.sendButton,
                                        (loading || sessionEnded || isSessionCompleted || consultationEndInProgress) && {backgroundColor: '#808080'}
                                    ]}
                                >
                                    <Ionicons name="send" size={24} color="#fff"/>
                                </TouchableOpacity>
                            ) : (
                                // Mic button when input empties
                                <TouchableOpacity
                                    onPress={() => {
                                        handleVoiceRecording().then(() => {
                                            startRecording();
                                        })
                                    }}
                                    disabled={loading || sessionEnded || isSessionCompleted || consultationEndInProgress}
                                    style={[
                                        styles.sendButton,
                                        (loading || sessionEnded || isSessionCompleted || consultationEndInProgress) && {backgroundColor: '#808080'}
                                    ]}
                                >
                                    <Feather name="mic" size={22} color="#fff"/>
                                </TouchableOpacity>
                            )
                        )}


                    </KeyboardStickyView>

                </View>

                <PreviewDialog
                    visible={attachment != null}
                    file={attachment}
                    onClose={() => setAttachment(null)}
                    onSend={(caption: string) => {
                        if (attachment) {
                            setLoading(true);
                            sendFile(attachment?.uri, attachment?.mimeType, attachment?.name)
                        }
                        setAttachment(null);
                    }}
                    mode="consultation"
                />

                <ConsultationSurveyModal
                    visible={surveyVisible}
                    isLawyer={isProUser}
                    lawyerName={lawyerName}
                    submitting={surveySubmitting}
                    onSkip={dismissConsultationSurvey}
                    onSubmit={submitConsultationSurvey}
                />

                <ConsultationEndQuestionsModal
                    visible={endQuestionsVisible}
                    submitting={endFlowSubmitting}
                    onSubmit={handleSubmitEndAnswers}
                />

                <ConsultationEndConfirmationModal
                    visible={endConfirmationVisible}
                    submitting={endFlowSubmitting}
                    onBack={() => {
                        setEndConfirmationVisible(false);
                        setEndQuestionsVisible(true);
                    }}
                    onConfirm={handleConfirmEndConsultation}
                />

                <PostConsultationActionModal
                    visible={postConsultationActionVisible}
                    onBookFollowUp={handleBookFollowUp}
                    onChatWithAI={handleChatWithAI}
                    onSkip={handlePostConsultationSkip}
                />

                <ExtendTimerModal
                    visible={
                        Boolean(extendTimerData?.visible) &&
                        shouldAllowExtensionPrompt &&
                        String(extendTimerData?.session_id || "") === String(session_id || "")
                    }
                    onCancel={hideExtendTimer}
                    sessionId={String(extendTimerData?.session_id || session_id || "")}
                    isLawyer={isProUser}
                    onTimerChanged={() => {
                        refreshConsultationTimer();
                        if (connected) sendSync();
                    }}
                />


            </View>
        </SafeAreaView>

    );
}

const styles = StyleSheet.create({
    commentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderTopWidth: 1,
        marginBottom: 8,
        borderTopColor: '#eee',
        backgroundColor: c.BackgroundColor,
    },
    commentButtonText: {
        marginHorizontal: 8,
        color: '#0275d8',
        fontWeight: '500',
    },
    saveBtnText: {
        fontFamily: 'InstrumentSansSemiBold',
        fontSize: 18,
        color: c.White
    },
    actionButtons: {
        flexDirection: 'row',
        marginStart: 16,
        marginEnd: 16,
        gap: 8,
    },
    attachmentOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,40,0,0.9)',
        justifyContent: 'center',
    },
    attachmentCloseButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,       // adjust for safe area
        right: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,    // ensure it's on top
    },
    modalContent: {
        flex: 1,
        backgroundColor: c.BackgroundColor
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomColor: '#ddd',
        borderBottomWidth: 1,
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: 'center',
    },
    // Scroll view list
    commentList: {
        flex: 1,
        paddingStart: SPACING.md,
        paddingEnd: SPACING.md,
        backgroundColor: c.BackgroundColor,
    },

    // Speech bubble container
    commentItem: {
        marginVertical: 6,
        maxWidth: '100%',
    },
    bubbleLeft: {
        alignSelf: 'flex-start',
    },
    bubbleRight: {
        alignSelf: 'flex-end',
    },
    bubble: {
        backgroundColor: '#e1ffc7',
        padding: 10,
        borderRadius: 15,
        borderTopLeftRadius: 0,
    },
    commentUser: {
        fontSize: 12,
        color: "#000",
        marginBottom: 4,
    },
    commentTime: {
        fontSize: 10,
        color: '#999',
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    commentInput: {
        flex: 1,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 16,
        paddingVertical: 8,
        fontSize: 16,
        maxHeight: 100,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        backgroundColor: c.BackgroundColor,
    },
    inputArea: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        minHeight: 48,
        maxHeight: 100,
        paddingHorizontal: SPACING.md,
        borderWidth: 3,
        borderColor: COLORS.light.pink,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: c.BackgroundColor,
    },
    recordingViewArea: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        minHeight: 48,
        maxHeight: 100,
        paddingHorizontal: SPACING.md,
        borderWidth: 0,
        backgroundColor: c.BackgroundColor,
    },
    textInput: {
        flex: 1,
        fontSize: FONT_SIZES.md,
        paddingVertical: SPACING.sm,
    },
    sendButton: {
        width: 45,
        height: 45,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: c.SecodaryColor,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: SPACING.sm,
    },
    headerIcon: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.3)",
        zIndex: 10,
    },
    drawer: {
        position: "absolute",
        top: 60,
        right: 20,
        paddingStart: 20,
        paddingEnd: 20,
        borderTopLeftRadius: 5,
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 5,
        backgroundColor: c.BackgroundColor,
        paddingHorizontal: 20,
        elevation: 8,
        zIndex: 15,
    },
    drawerTitle: {
        fontSize: 20,
        marginBottom: 20,
        fontWeight: "bold",
    },
    drawerItem: {
        paddingVertical: 15,
    },
    drawerText: {
        fontSize: 18,
    },
    videoPlayer: {
        width: '100%',
        height: 300
    },
    fullImage: {
        width: '100%',
        height: '100%'
    },
    playIconOverlay: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    attachmentLoadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    separator: {
        height: 1,
        width: '100%',
        backgroundColor: '#e0e0e0'
    },
    attachButton: {
        width: 45,
        height: 45,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: c.SecodaryColor,
        alignItems: "center",
        justifyContent: "center",
        marginRight: SPACING.sm,
    },
});

const createStyles = (colors: {
    primary: string;
    secondary: string;
    inputBackground: string;
    backgroundColor: string;
    textColor: string;
    disabledColor: string;
}) => ({
    messageBubble: (sender: true | false): ViewStyle => ({
        maxWidth: "90%",
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: sender ? "#D9CAA8" : "#666666",
        ...(sender
            ? {borderBottomRightRadius: 0}
            : {borderBottomLeftRadius: 0}),
    }),
    fileBubble: (sender: true | false): ViewStyle => ({
        maxWidth: "90%",
        padding: SPACING.md,
    }),
    messageText: (sender: true | false) => ({
        color: sender ? "#000" : "#FFF",
        // fontSize: FONT_SIZES.sm,
    })
});

"use client";

import {router, useLocalSearchParams} from "expo-router";
import React, {useEffect, useMemo, useRef, useState} from "react";
import {
    Alert,
    Clipboard,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextStyle,
    TextInput,
    TouchableOpacity,
    View,
    ViewStyle
} from "react-native";

import ChatDrawer from "@/app/(app)/chats/components/chat-drawer";
import AttachmentSheet from "@/components/chat/AttachmentSheet";
import FeedbackModal from "@/components/FeedbackModal";
import {getAppSelectedLanguage} from "@/components/i18n";
import {ThemedText} from "@/components/ThemedText";
import {ThemedView} from "@/components/ThemedView";
import {COLORS, COLORS as c} from "@/constants/colors";
import {BORDER_RADIUS, SPACING} from "@/constants/theme";
import {
    deleteChatFeedbackApi,
    fetchChatHistoryData,
    getAudioToTextApi,
    getActiveReferralFlow,
    getChatSingleMessageData,
    getFeedbackReasonsDataList,
    postChatMessageWithFile,
    professionalUserDetails,
    referralUploadFile,
    referralUploadVoice,
    refreshLawyerRecommendations,
    selectLawyer,
    startReferralFlow,
    submitFeedbackCall
} from "@/services/apiHelper";
import {Entypo, Feather, Ionicons, MaterialIcons} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LZString from "lz-string";
import {useTranslation} from 'react-i18next';
import {Edges, SafeAreaView, useSafeAreaInsets} from "react-native-safe-area-context";
import FeedBackUi from "../../../components/chat/FeedBackUi";

import ProfessionalDetails from "@/app/(app)/(tabs)/search/ProfessionalDetails";
import {createChatStyles} from "@/app/(app)/chats/chat.styles";
import {
    type Message,
    parseResponseNewChatStreamData,
    showDisclaimer,
    showIntroMessageLikeStream
} from "@/app/(app)/chats/components/ChatHelper";
import LimitBadge from "@/app/(app)/chats/components/LimitBadge";
import {getQueryRemainingStatus} from "@/app/(app)/chats/components/queryUtils";
import SubscriptionModals from "@/app/(app)/chats/components/SubscriptionModals";
import CollapsibleSampleList from "@/components/chat/CollapsibleSampleList";
import ConsultationView from "@/components/chat/ConsultationView";
import PreviewDialog from "@/components/chat/PreviewDialog";
import {TypingIndicator} from "@/components/chat/TypingIndicator";
import {ThemedTextNew} from "@/components/ThemedTextNew";
import {WavingHand} from "@/components/WavingHand";
import {
    getMarkdownStyles,
    getUserData,
    handleError,
    handleOpenFile,
    isUserPro,
    pickDocument,
    pickImage,
    pickMultipleDocument,
    pickMultipleImage
} from "@/constants/Utility";
import {useApp} from "@/contexts/AppContext";
import Analytics from "@/helpers/AnalyticsHelper";
import {getAuthToken} from "@/services/httpservice";
import {buyDailyPass, syncAdWatched} from "@/services/subscriptionHelper";
import {handleSubscriptionSync} from "@/services/subscriptionManager";
import BottomSheet, {BottomSheetScrollView} from "@gorhom/bottom-sheet";
import {RewardedAd, RewardedAdEventType, TestIds} from "react-native-google-mobile-ads";
import {KeyboardAwareScrollView, KeyboardStickyView} from "react-native-keyboard-controller";
import Markdown from "react-native-markdown-display";
import useAudioPlayer from "@/components/Inbox/useAudioPlayer";
import {manageVoiceRecorder} from "@/components/chat/manageVoiceRecorder";
import ReferralFilePreviewSheet from "@/components/chat/ReferralFilePreviewSheet";
import PageTourProvider from "@/app/(app)/manage/PageTourProvider";
import {useTour} from "@/app/(app)/manage/useTour";
import TourHighlight from "@/app/(app)/manage/TourHighlight";
import * as Crypto from "expo-crypto";

interface FileMetadata {
    original_filename: string;
    file_type: string;
    content_type: string;
    file_size: number;
    url?: string;
}

type AttachmentFile = {
    uri: string;
    mimeType?: string;
    name?: string;
    size?: number;
} | null;

interface UploadedFile {
    file_url?: string;
    file_metadata?: FileMetadata;
}

interface OptionData {
    next_step: string;
    value?: string;
    label?: string;
}

type ReferralActionData = {
    index: number;
    type: string;
    subType: string;
    label: string;
    referralData: any | null;
    isBack: boolean;
};

const POST_CONSULTATION_AI_PROMPT_KEY = "post_consultation_ai_prompt";
const POST_CONSULTATION_FOLLOW_UP_ID = "post-consultation-follow-up";
const postConsultationPromptStorageKey = (conversationId: string) =>
    `post_consultation_ai_prompt:${conversationId}`;

function ChatContent() {

    const {t} = useTranslation();
    const params = useLocalSearchParams();
    const {isPrevious, initialPrompt, startReferral} = params;

    const {
        walletData,
        isShowTopUpView,
        isShowPremiumTopUpView,
        showPremiumTopUpView,
        showTopUpView,
        getOfferingList,
        refreshPlanInfo,
        isProUser
    } = useApp();

    useTour("ChatBot", true);


    const {isQueryRemaining, queryRemainingCount} = getQueryRemainingStatus(walletData);
    const [showSamples, setShowSamples] = useState(false);
    const [isShowAdsView, setShowAdsView] = useState(false);
    const [attachment, setAttachment] = useState<AttachmentFile>(null);

    const conversationIdRef = useRef<string | null>(null);

    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);

    const [conversationId, setConversationId] = useState<string | null>(null);
    const initialPromptSentRef = useRef(false);
    const directReferralStartedRef = useRef(false);
    const postConsultationPromptRef = useRef<string | null>(null);

    const [drawerVisible, setDrawerVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const sendInProgressRef = useRef(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const [isShowAttachmentSheet, setShowAttachmentSheet] = useState(false);
    const [isShowInputView, setShowInputView] = useState(true);
    const [loginUserData, setLoginUserData] = useState<any | null>(null);

    const [userDetails, setUserDetails] = useState(null);
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['1%', '85%'], []);

    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState('');
    const isHistoryRef = useRef(false);

    const [pendingReferralFiles, setPendingReferralFiles] = useState<{
        files: any[];
        optionData: any;
        type: 'doc' | 'pdf' | 'image';
        responseText: string;
    } | null>(null);

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
        processAudio(uri, referralState)
    }, t);

    const [playbackProgress, setPlaybackProgress] = useState(0);
    const [isHistoryDisplay, setHistoryDisplay] = useState(false);
    //  const [showMenuScript, setShowMenuScript] = useState(false);

    const [selectedLanguageCode, setSelectedLanguageCode] = useState('en');
    const [referralActionData, setReferralActionData] =
        useState<ReferralActionData>({
            index: -1,
            type: "",
            subType: "",
            label: "",
            referralData: null,
            isBack: false,
        });


    const [showActionView, setActionView] = useState({
        display: false,
        index: 0
    });

    const rewardedRef = useRef<RewardedAd | null>(null);

    /** Referral category controls whether booking is mandatory; selected type controls slot duration/filtering. */
    const referralConsultationCategoryRef = useRef<string | null>(null);
    const referralBookingConsultationTypeRef = useRef<string | null>(null);

    const [modalConfig, setModalConfig] = useState({
        visible: false,
        message: '',
        suggestions: [],
    });

    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [selectedMessageIndex, setSelectedMessageIndex] = useState<number | null>(null);
    const [selectedMessageContent, setSelectedMessageContent] = useState<Message | null>(null);
    const [feedbackReasons, setFeedbackReasons] = useState([])
    const [isPurchasing, setIsPurchasing] = useState(false);

    const {playPauseSound, isPlaying} = useAudioPlayer();
    const shouldShowAd = useRef(false);

    const insets = useSafeAreaInsets();
    const primary = c.PrimaryColor;
    const secondary = c.SecodaryColor;
    const backgroundColor = c.BackgroundColor;
    const textColor = c.PrimaryColorText;
    const inputBackground = c.BackgroundColor;

    const styles = useMemo(() => createChatStyles({
        primary, secondary, inputBackground, backgroundColor, textColor
    }), [primary, secondary]);

    const innerStyles = useMemo(() => createStyles({
        primary,
        secondary,
        inputBackground: inputBackground,
        backgroundColor,
        textColor
    }), [primary, secondary]);


    const toggleDrawer = () => {
        setDrawerVisible(!drawerVisible);
    };

    const reloadPlanInfo = () => {
        if (!isProUser) {
            refreshPlanInfo()
        }
    }

    useEffect(() => {

        handleSubscriptionSync({
            forceSync: false,
            onSuccess: () => {
                reloadPlanInfo()
            },
            onError: (error) => {
                console.log("Subscription sync error:", error);
            },
        });

    }, []);


    useEffect(() => {
        if (isPrevious === "true") {
            const fetchLastConversation = async () => {
                try {
                    const conversation_id = await AsyncStorage.getItem("last_conversation_id");
                    setConversationId(conversation_id);
                } catch (error) {
                    console.error("Error fetching conversations:", error);
                }
            };
            fetchLastConversation();
        }
    }, [isPrevious])


    const handleSubmitFeedback =
        async (type: any, msg: any, index: number, reason = "", otherReason = "",
               conversationId: string | null
        ) => {
            let selectedIndex = isHistoryDisplay ? 0 : index - 2;
            const oldMessages = [...messages];
            const newMessages = [...messages];

            submitFeedbackCall(conversationId, msg, type, reason, otherReason, selectedIndex,
                (id: string) => {
                    newMessages[index] = {
                        ...newMessages[index],
                        feedbackType: type,
                        feedbackId: id,
                    };
                    setMessages(newMessages);
                }, (result: any) => {
                    setMessages(oldMessages);
                }).then(() => {
            });
        };


    useEffect(() => {
        if (isQueryRemaining) return;

        const rewarded = RewardedAd.createForAdRequest(TestIds.REWARDED, {
            requestNonPersonalizedAdsOnly: true,
        });

        rewardedRef.current = rewarded;

        const unsubscribeLoaded = rewarded.addAdEventListener(
            RewardedAdEventType.LOADED,
            () => {
                console.log('Rewarded ad loaded');
                if (shouldShowAd.current) {
                    rewarded.show();
                    shouldShowAd.current = false;
                }
            }
        );

        const unsubscribeEarned = rewarded.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            async (reward) => {
                console.log("reward credited")
                try {
                    const res = await syncAdWatched();
                    if (res) {
                        reloadPlanInfo();
                    }
                } catch (error: any) {
                    console.log("syncAdWatched error:", error);
                    alert(error)
                }
            }
        );

        rewarded.load();

        return () => {
            unsubscribeLoaded();
            unsubscribeEarned();
            rewardedRef.current = null;
        };
    }, [isShowAdsView]);

    useEffect(() => {
        if (!isShowAdsView) {
            Keyboard.dismiss();
            setTimeout(() => Keyboard.dismiss(), 50);
        }
    }, [isShowAdsView]);


    const showRewardedAd = () => {
        const rewarded = rewardedRef.current;
        if (!rewarded) return;
        if (rewarded.loaded) {
            rewarded.show().catch(error => {
                console.log('Show failed, loading again...', error);
                rewarded.load();
            });
        } else {
            console.log('Rewarded not ready, will show when loaded...');
            shouldShowAd.current = true;
            rewarded.load();
        }
    };

    const deleteChatFeedback = async (index: any, feedbackId: any) => {
        const oldMessages = [...messages];
        const newMessages = [...messages];
        newMessages[index] = {
            ...newMessages[index],
            feedbackType: "",
            feedbackId: ""
        };
        setMessages(newMessages);
        deleteChatFeedbackApi(feedbackId,
            () => {
            },
            (result: any) => {
                setMessages(oldMessages);
            }).then(() => {
        });
    };

    const getUserDetailsData = (referral_id: string, lawyer_id: string) => {
        setLoading(true);
        try {
            professionalUserDetails(lawyer_id, (result: any) => {
                let updatedData = {
                    referral_id: referral_id,
                    ...result
                }
                setUserDetails(updatedData);
                setTimeout(() => {
                    bottomSheetRef?.current?.expand();
                }, 500);
            }, () => {
                console.log("setError");
            })
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        const getAppUserData = async () => {
            const userData = await getUserData();
            if (userData) {
                setLoginUserData(userData);
            }
        }
        const checkPro = async () => {
            const result = await isUserPro();
            if (!result) getOfferingList();
        };

        getAppUserData();
        checkPro();

    }, [])


    useEffect(() => {
        if (Platform.OS === 'android') {
            const timer = setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({animated: true});
            }, 30);
            return () => clearTimeout(timer);
        }
    }, [messages]);


    const sampleQuestions = t("sample_questions", {
        returnObjects: true,
    }) as string[];


    const handleImagePress = (uri: any) => {
        setSelectedImageUri(uri);
        setImageModalVisible(true);
    };

    // ─── Shared file/media renderer used in BOTH general chat and referral flow ────
    const renderAttachmentPreview = (msg: Message) => {
        const hasAttachment =
            msg?.image_url || msg?.metadata?.file_url || msg?.audio_url;

        if (!hasAttachment) return null;

        return (
            <View style={{marginBottom: (msg.content && msg.content.length > 0) ? 8 : 0}}>

                {/* 🖼️ IMAGE */}
                {msg?.source_type === "image" && msg?.image_url && (
                    <TouchableOpacity onPress={() => handleImagePress(msg?.image_url)}>
                        <Image
                            source={{uri: msg.image_url}}
                            style={{
                                width: 200,
                                height: 200,
                                borderRadius: 10,
                                backgroundColor: "#f0f0f0"
                            }}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                )}

                {/* 📄 PDF / DOCUMENT */}
                {(msg?.source_type === "pdf" || msg?.metadata?.file_type === "pdf" ||
                    msg?.source_type === 'docx' || msg?.metadata?.file_type === "docx"
                ) && (
                    <TouchableOpacity
                        onPress={() =>
                            handleOpenFile(
                                msg?.image_url ?? msg?.metadata?.file_url ?? "",
                                "",
                                msg?.metadata?.file_type?.includes("/")
                                    ? msg.metadata.file_type
                                    : msg?.source_type === "pdf"
                                        ? "application/pdf"
                                        : msg?.source_type === "docx"
                                            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                            : msg?.source_type === "doc"
                                                ? "application/msword"
                                                : "application/octet-stream"
                            )
                        }
                        activeOpacity={0.7}
                        style={{
                            padding: 12,
                            backgroundColor: msg.role === "user" ? "#D9CAA8" : "#666",
                            borderRadius: 12,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderWidth: 1,
                            borderColor: msg.role === "user" ? "#cbb890" : "#888",
                        }}
                    >
                        <View style={{flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1}}>
                            <Text style={{fontSize: 16}}>📄</Text>
                            <Text
                                style={{
                                    color: msg.role === "user" ? "#000" : "#fff",
                                    fontWeight: "500",
                                    flexShrink: 1,
                                    flexWrap: "wrap",
                                }}
                            >
                                {msg?.image_analysis_type
                                    ? msg.image_analysis_type
                                    : (msg.source_name ? msg.source_name : t('chat.open_pdf'))
                                }
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}

                {/* 🔊 AUDIO */}
                {(msg?.source_type === "audio" && msg?.audio_url) && (
                    <View
                        style={{
                            padding: 10,
                            backgroundColor: msg.role === "user" ? "#D9CAA8" : "#666",
                            borderRadius: 12,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderWidth: 1,
                            borderColor: msg.role === "user" ? "#cbb890" : "#888",
                        }}
                    >
                        <Entypo name="sound" size={20}/>
                        <Text
                            style={{
                                width: '60%',
                                color: msg.role === "user" ? "#000" : "#fff",
                                fontWeight: "500",
                            }}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            {msg?.source_name || 'voice_note.wav'}
                        </Text>
                        <TouchableOpacity
                            style={{padding: 10}}
                            onPress={() => {
                                if (msg.audio_url) {
                                    playPauseSound(msg.audio_url);
                                }
                            }}
                        >
                            <MaterialIcons
                                name={isPlaying(msg.audio_url) ? "pause-circle-filled" : "play-circle-fill"}
                                size={24}
                            />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const CustomTextViewWithAnim = ({msg}: {
        msg: Message;
    }) => {
        let message = msg.content;

        const isIntroMessage = ["1", "2", "3"].includes(msg.id);

        if (isIntroMessage && message.includes('👋')) {
            const parts = message.split('👋');
            const secondPart = parts[1].split('@');
            return (
                <View style={styles.rowWrap}>
                    <ThemedTextNew style={[innerStyles.messageTextIntro(msg.role), {flexShrink: 1}]}>
                        {parts[0]}
                    </ThemedTextNew>
                    <WavingHand/>
                    {secondPart.map((item, index) => (
                        <ThemedTextNew
                            key={index.toString()}
                            id={index.toString()}
                            style={[innerStyles.messageTextIntro(msg.role), {marginLeft: 2, flexShrink: 1}]}
                        >
                            {item}
                        </ThemedTextNew>
                    ))}
                </View>
            );
        } else {
            if (msg.role === "user") {
                return (
                    <>
                        {/* ✅ Shared renderer — works for general chat AND referral flow */}
                        {renderAttachmentPreview(msg)}

                        {msg?.content
                            ? <ThemedTextNew
                                messageId={msg.id}
                                style={innerStyles.messageText(msg.role)}
                            >
                                {msg.content}
                            </ThemedTextNew>
                            : null
                        }
                    </>
                );
            } else {
                if ((msg.id === "1" || msg.id === "2" || msg.id === "3")) {
                    return (
                        <ThemedTextNew
                            messageId={msg.id}
                            style={innerStyles.messageTextIntro(msg.role)}
                        >
                            {msg.content}
                        </ThemedTextNew>
                    );
                } else {

                    if (referralActionData.referralData !== null) {
                        // let description = wrapWithFencedCode(msg.content)
                        return (
                            <View>
                                {msg.content ? (
                                    <Markdown style={getMarkdownStyles(msg.role)}>
                                        {msg.content}
                                    </Markdown>
                                ) : null}
                            </View>
                        );
                    } else {
                        return (
                            <Markdown style={getMarkdownStyles(msg.role)}>{msg.content}</Markdown>
                        );
                    }
                }
            }
        }
    };

    const uploadReferralDocument = async (
        documents: File[],
        optionData: OptionData,
        type: 'doc' | 'pdf' | 'image',
        responseText: string
    ) => {
        if (!conversationId) {
            console.log("uploadReferralDocument conversation id not found")
            return;
        }

        const tempMessages: Message[] = documents.map((doc: any) => ({
            id: `${Date.now()}-${doc.name}`,
            fileName: doc.name,
            content: `Uploading ${doc.name}...`,
            sender: "user",
            role: "user",
            timestamp: new Date().toISOString(),
        }));

        setMessages((prev) => [...prev, ...tempMessages]);
        setLoading(true);

        try {
            const referralResponse = await referralUploadFile(conversationId, documents);

            if (referralResponse) {
                const uploadedMap = new Map<string, UploadedFile>(
                    referralResponse.files.map((f: UploadedFile) => [
                        f.file_metadata?.original_filename,
                        f,
                    ])
                );

                setMessages((prev) =>
                    prev.map((msg) => {
                        if (!msg.fileName) return msg;
                        const file = uploadedMap.get(msg.fileName);
                        if (!file) return msg;

                        return {
                            ...msg,
                            content: '',
                            source_type: file.file_metadata?.file_type,
                            source_name: file.file_metadata?.original_filename,
                            image_url: file.file_url || file.file_metadata?.url,
                            metadata: {
                                file_url: file.file_metadata?.url,
                                file_type: file.file_metadata?.content_type,
                                file_name: file.file_metadata?.original_filename,
                                file_size: file.file_metadata?.file_size,
                            },
                        };
                    })
                );

                reloadPlanInfo();
                manageReferralFlow("upload", "skip", false);
            }
        } catch (error: any) {
            console.log("uploadReferralDocument error:", error);
            reloadPlanInfo();

            setReferralActionData({
                index: -1,
                type: optionData.next_step,
                subType: optionData?.value ?? "",
                label: optionData?.label ?? "",
                referralData: null,
                isBack: true
            })

            if (error?.error === "monthly_cap_exceeded") {
                setModalConfig({
                    visible: true,
                    message: error.message,
                    suggestions: error.suggestions
                });
            } else if (error?.error === "duplicate_file") {
                const filename = error.filename ?? "";
                const existingLabel = error.existing_label ?? "";
                const detail = existingLabel
                    ? `"${filename}" has already been attached as "${existingLabel}".`
                    : `"${filename}" has already been attached.`;
                Alert.alert(t('error'), detail);
            } else {
                handleError(t, error);
            }
        } finally {
            setLoading(false);
        }
    }

    const processAudio = async (uri: string, referralUpdatedData: any) => {
        setLoading(true);

        const authToken = await getAuthToken();

        if (!authToken) {
            setLoading(false);
            Alert.alert(t('error'), t('error.token_missing'));
            return;
        }

        if (referralUpdatedData) {
            const trimmedMessage = t('chat.uploading_voice_note');
            let messageId = Date.now().toString();

            if (trimmedMessage) {
                const userMessage: Message = {
                    id: messageId,
                    content: trimmedMessage,
                    sender: "user",
                    role: "user",
                    timestamp: new Date().toISOString(),
                };

                if (Platform.OS === "android") {
                    Keyboard.dismiss();
                }

                setMessages((prev) => [...prev, userMessage]);
            }

            try {
                if (!conversationId) {
                    setLoading(false)
                    return;
                }
                const response = await referralUploadVoice(conversationId, uri, selectedLanguageCode);

                if (response) {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === messageId
                                ? {
                                    ...msg,
                                    content: '',
                                    source_type: 'audio',
                                    source_name: 'Voice note.wav',
                                    audio_url: response.file_url
                                }
                                : msg
                        )
                    );
                }

                reloadPlanInfo();
                await manageReferralFlow("upload", "skip", false);
                setLoading(false);

            } catch (e: any) {
                setLoading(false);
                const apiError = e.response?.data;

                console.log("monthly_cap_exceeded", apiError)

                if (apiError?.error === "monthly_cap_exceeded") {
                    setModalConfig({
                        visible: true,
                        message: apiError.message,
                        suggestions: apiError.suggestions
                    });
                } else {
                    handleError(t, apiError);
                }
            }
        } else {
            await getAudioToTextApi(uri, selectedLanguageCode, async (text: any) => {
                await handleSend(text);
            }, (error: any) => {
                handleError(t, error);
            }, () => {
                setLoading(false);
            });
        }
    };

    const manageReferralFlow = async (step: String, responseText: string, isBack: boolean) => {
        if (!conversationId) return;

        try {
            setLoading(true);
            const response = await startReferralFlow(
                conversationId,
                step,
                responseText,
                isBack,
                referralBookingConsultationTypeRef.current
            );

            if (!response) {
                handleError(t, {message: t("chat.failed_to_load_chat")});
                return;
            }

            if (response.next_step && response.next_step == "notes") {
                setShowInputView(false);
            }

            const hasExtraData =
                response?.description?.trim() &&
                response?.verification?.trim();

            if (response?.question) {
                const assistantMessage: Message = {
                    id: Date.now().toString(),
                    content: hasExtraData
                        ? [
                            response?.question || "",
                            `\`\`\`\n${response?.description || ""}\n\`\`\``,
                            response?.verification || ""
                        ].join("\n")
                        : (response?.question || ""),
                    sender: "assistant",
                    role: "assistant",
                    timestamp: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, assistantMessage]);
            }

            if (step === "upload") {
                if (responseText === "voice_note") {
                    let optionData = {
                        ...response.options?.[0],
                        next_step: response.next_step,
                    }
                    await handleVoiceRecording(optionData);
                } else if (responseText === "docx") {
                    let optionData = {
                        ...response.options?.[1],
                        next_step: response.next_step,
                    }
                    const documents = await pickMultipleDocument('doc');
                    if (documents && documents.length > 0) {
                        setPendingReferralFiles({
                            files: documents,
                            optionData,
                            type: 'doc',
                            responseText
                        });
                    }

                } else if (responseText === "image") {
                    let optionData = {
                        ...response.options?.[1],
                        next_step: response.next_step,
                    }
                    const images = await pickMultipleImage(t);
                    if (images && images.length > 0) {
                        setPendingReferralFiles({
                            files: images,
                            optionData,
                            type: 'image',
                            responseText
                        });
                    }

                } else if (responseText === "pdf") {
                    let optionData = {
                        ...response.options?.[1],
                        next_step: response.next_step,
                    }
                    const documents = await pickMultipleDocument('pdf');
                    if (documents && documents.length > 0) {
                        setPendingReferralFiles({
                            files: documents,
                            optionData,
                            type: 'pdf',
                            responseText
                        });
                    }
                }
            }

            setTimeout(() => {
                if (response.next_step === null && response?.completed === true) {
                    setReferralActionData({
                        index: -1,
                        type: '',
                        subType: '',
                        label: '',
                        isBack: false,
                        referralData: null
                    });
                } else {
                    setReferralActionData({
                        ...referralActionData,
                        referralData: response
                    })
                }
            }, 500);
        } catch (e: any) {
            console.log("manage referral flow error:", e);
        } finally {
            setLoading(false);
        }
    }

    const refreshReferralLawyers = async (referralId: string, currentLawyerIds: string[]) => {
        try {
            setLoading(true);
            const response = await refreshLawyerRecommendations(referralId, currentLawyerIds);

            if (!response) {
                handleError(t, {message: t("chat.failed_to_load_chat")});
                return null;
            }

            setReferralActionData((prev) => ({
                ...prev,
                referralData: response,
            }));

            return response;
        } catch (e: any) {
            handleError(t, e);
            return null;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const getFeedbackReasonsList = async () => {
            let responseList = await getFeedbackReasonsDataList();
            setFeedbackReasons(responseList);
        }
        getFeedbackReasonsList();
    }, []);

    useEffect(() => {

        if (referralActionData.type) {
            if (referralActionData.type === "select_lawyer_hide") return;
            manageReferralFlow(referralActionData.type, referralActionData.subType || "", referralActionData.isBack)
        }
        if (referralActionData.type === "start") {
            reloadPlanInfo()
        }
    }, [referralActionData.type]);

    const openAttachmentSheet = () => {
        Keyboard.dismiss();
        setTimeout(() => setShowAttachmentSheet(true), 250);
    }

    const checkMinutesBeforeAction = (isAudio: boolean, action: () => void) => {
        const {minutes, subscription} = walletData || {};
        const isPaidPlan =
            subscription?.plan_id !== "freemium" && subscription?.plan_id !== "basic";

        if (isPaidPlan && minutes && minutes.available <= 0) {
            setShowAttachmentSheet(false);
            showPremiumTopUpView(true);
            return;
        } else {
            const {monthly_usage, limits} = walletData ?? {};

            if (limits && monthly_usage) {
                if (isAudio && limits.voice_notes_limit == null) {
                    action();
                    return;
                }
                if (isAudio && monthly_usage.voice_notes >= limits.voice_notes_limit) {
                    setShowAttachmentSheet(false);
                    showPremiumTopUpView(true);
                    return;
                }
                if (!isAudio && monthly_usage.uploads >= limits.uploads_limit) {
                    setShowAttachmentSheet(false);
                    showPremiumTopUpView(true);
                    return;
                }
            }
        }
        action();
    };

    const resetReferralActionData = () => {
        setReferralActionData({
            index: -1,
            type: "",
            subType: "",
            label: "",
            referralData: null,
            isBack: false,
        });
    };

    const referralAssistantContent = (response: any) => {
        const hasExtraData =
            response?.description?.trim() &&
            response?.verification?.trim();

        if (hasExtraData) {
            return [
                response?.question || "",
                `\`\`\`\n${response?.description || ""}\n\`\`\``,
                response?.verification || "",
            ].join("\n");
        }

        return response?.question || "";
    };

    const resumeActiveReferralFlow = async (id: string) => {
        const response = await getActiveReferralFlow(id);

        if (!response || response.completed || !response.next_step) {
            resetReferralActionData();
            setShowInputView(true);
            return;
        }

        referralConsultationCategoryRef.current = response.consultation_category ?? null;
        referralBookingConsultationTypeRef.current = response.consultation_type ?? null;
        setShowInputView(response.next_step !== "notes");

        const resumeMessageId = `referral-resume-${id}-${response.next_step}-${response.referral_id || "draft"}`;
        const assistantMessage: Message = {
            id: resumeMessageId,
            content: referralAssistantContent(response),
            sender: "assistant",
            role: "assistant",
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => {
            const withoutPreviousResume = prev.filter((msg) => !String(msg.id).startsWith(`referral-resume-${id}-`));
            return [...withoutPreviousResume, assistantMessage];
        });

        setReferralActionData({
            index: -1,
            type: "",
            subType: "",
            label: "",
            referralData: response,
            isBack: false,
        });
    };

    const loadChat = async (id: string) => {
        if (!id) return;
        try {
            setLoading(true);
            isHistoryRef.current = true;
            setHistoryDisplay(true);
            setShowSamples(false);
            setDrawerVisible(false);
            referralConsultationCategoryRef.current = null;
            referralBookingConsultationTypeRef.current = null;
            setConversationId(id);
            await AsyncStorage.setItem("conversation_id", id);
            setMessages([]);
            await loadChatHistoryData(id);
            await resumeActiveReferralFlow(id);
        } catch (error) {
            console.error("❌ Error loading chat history:", error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        const fetchChatHistory = async () => {
            if (!conversationId) return;
            if (messages.length === 0) {
                setLoading(true);
                setMessages([]);
                try {
                    await loadChatHistoryData(conversationId);
                    await resumeActiveReferralFlow(conversationId);
                } catch (error) {
                    console.error("❌ Error fetching chat history:", error);
                    Alert.alert(t('error.title'), t('chat.failed_to_load_chat'));
                } finally {
                    setLoading(false);
                }
            }
        };
        if (isPrevious === "true") fetchChatHistory();
    }, [conversationId]);


    const loadChatHistoryData = async (id: any) => {
        const authToken = await getAuthToken();
        if (!authToken) {
            Alert.alert(t("error"), t('error.no_use_session'));
            setLoading(false);
            return;
        }
        await fetchChatHistoryData(id, async (formattedMessages: any) => {
            const prompt = await AsyncStorage.getItem(postConsultationPromptStorageKey(String(id)));
            const hasPrompt = formattedMessages.some((msg: Message) =>
                msg.id === POST_CONSULTATION_FOLLOW_UP_ID ||
                (msg.sender === "assistant" && msg.content === prompt)
            );

            setMessages(prompt && !hasPrompt
                ? [
                    {
                        id: POST_CONSULTATION_FOLLOW_UP_ID,
                        content: prompt,
                        sender: "assistant",
                        role: "assistant",
                        timestamp: new Date().toISOString(),
                    },
                    ...formattedMessages,
                ]
                : formattedMessages
            );
        }, (e: any) => {
            console.log("error", e.toString());
        });
    }

    const rememberPostConsultationPromptForConversation = async (id: string) => {
        const prompt =
            postConsultationPromptRef.current ||
            await AsyncStorage.getItem(POST_CONSULTATION_AI_PROMPT_KEY);

        if (!prompt) return;

        postConsultationPromptRef.current = prompt;
        await AsyncStorage.setItem(postConsultationPromptStorageKey(id), prompt);
        await AsyncStorage.removeItem(POST_CONSULTATION_AI_PROMPT_KEY);
    };

    useEffect(() => {
        const getLanguageData = async () => {
            const code = await getAppSelectedLanguage();
            setSelectedLanguageCode(code)
        };
        getLanguageData().then(() => {
        });
    }, [])

    const displayActionView = (isDisplay: boolean, index = -1) => {
        setActionView({display: isDisplay, index: index})
    }

    const handleLongPress = (index: number) => {
        displayActionView(true, index);
    };

    const handleCopy = () => {
        Clipboard.setString(message);
        displayActionView(false);
    };

    const handleEdit = (msg: any) => {
        if (isQueryRemaining) setMessage(msg?.content);
        displayActionView(false);
    };

    const handleCancel = () => {
        displayActionView(false);
    };

    useEffect(() => {
        if (isPrevious !== "false") return;
        if (startReferral === "true") return;
        if (isHistoryDisplay) return;
        if (messages.length !== 0) return;

        let isCancelled = false;

        const showIntroMessages = async () => {
            const dataObjects = [
                {
                    id: "1",
                    content: t("chat.support_msg_1", {returnObjects: true}),
                    sender: "assistant",
                    role: "assistant",
                    timestamp: new Date().toISOString(),
                },
                {
                    id: "2",
                    content: t("chat.support_msg_2", {returnObjects: true}),
                    sender: "assistant",
                    role: "assistant",
                    timestamp: new Date().toISOString(),
                },
                {
                    id: "3",
                    content: t("chat.support_msg_3", {returnObjects: true}),
                    sender: "assistant",
                    role: "assistant",
                    timestamp: new Date().toISOString(),
                }
            ];

            for (let i = 0; i < dataObjects.length; i++) {
                if (isCancelled || isHistoryRef.current) return;
                await new Promise(res => setTimeout(res, 500));
                if (isCancelled || isHistoryRef.current) return;
                setMessages(prev => [
                    ...prev,
                    {
                        id: `typing-${i}`,
                        content: "",
                        sender: "assistant",
                        role: "assistant",
                        timestamp: new Date().toISOString(),
                    },
                ]);
                await showIntroMessageLikeStream(true, dataObjects[i], setMessages);
            }

            if (!isCancelled && !isHistoryRef.current && !isProUser) {
                setShowSamples(true);
            }
        };

        showIntroMessages();

        return () => {
            isCancelled = true;
        };
    }, [isHistoryDisplay, startReferral]);

    useEffect(() => {
        isHistoryRef.current = isHistoryDisplay;
    }, [isHistoryDisplay]);

    useEffect(() => {
        if (isHistoryDisplay) setShowSamples(false);
    }, [isHistoryDisplay]);

    useEffect(() => {
        conversationIdRef.current = conversationId;
    }, [conversationId]);

    useEffect(() => {
        const fetchConversationId = async () => {
            if (startReferral === "true") return;
            const storedConversationId = await AsyncStorage.getItem("conversation_id");
            if (storedConversationId) {
                setConversationId(storedConversationId);
            }
        };
        fetchConversationId();
    }, [startReferral]);

    useEffect(() => {
        if (startReferral !== "true" || directReferralStartedRef.current) return;
        directReferralStartedRef.current = true;

        const beginReferral = async () => {
            const referralConversationId = Crypto.randomUUID();
            conversationIdRef.current = referralConversationId;
            setConversationId(referralConversationId);
            await AsyncStorage.setItem("conversation_id", referralConversationId);
            setReferralActionData({
                index: 0,
                type: "start",
                subType: "",
                label: "",
                isBack: false,
                referralData: null,
            });
            void Analytics.referralInitiated({areaOfLaw: "Immigration"});
        };

        beginReferral().catch((error) => {
            directReferralStartedRef.current = false;
            console.warn("Unable to start consultation referral flow:", error);
        });
    }, [startReferral]);

    useEffect(() => {
        return () => {
            AsyncStorage.removeItem("conversation_id")
                .then(() => console.log("✅ conversation_id removed"))
                .catch((error) => console.error("❌ Error removing conversation_id:", error));
        };
    }, []);

    useEffect(() => {
        const manageTopUpView = () => {
            isUserPro().then((result) => {
                if (!result) {
                    if (walletData) {
                        const {subscription} = walletData;
                        if (subscription?.plan_id === "freemium" || subscription?.plan_id === "basic") {
                            if (!isQueryRemaining) setShowAdsView(true);
                        }
                    }
                }
            })
        }
        setTimeout(manageTopUpView, 5000);
    }, [walletData]);


    const handleSend = async (audioMessage = "", attachmentFile: AttachmentFile = null) => {
        if (sendInProgressRef.current || loading || isStreaming) return;

        const trimmedMessage = audioMessage !== "" ? audioMessage : message.trim();
        if (!trimmedMessage && attachmentFile == null) return;

        sendInProgressRef.current = true;
        setLoading(true);
        setIsStreaming(true);

        const userMessage: Message = {
            id: Date.now().toString(),
            content: trimmedMessage,
            sender: "user",
            role: "user",
            timestamp: new Date().toISOString(),
            source_type: attachmentFile?.mimeType?.startsWith("image")
                ? "image"
                : attachmentFile?.mimeType?.includes("pdf")
                    ? "pdf"
                    : undefined,
            source_name: attachmentFile?.mimeType?.startsWith("image")
                ? attachmentFile.name
                : attachmentFile?.mimeType?.includes("pdf")
                    ? attachmentFile.name
                    : undefined,
            image_url: attachmentFile?.uri || null,
            metadata: attachmentFile ? {
                file_url: attachmentFile.uri,
                file_type: attachmentFile.mimeType,
                file_name: attachmentFile?.name || "document",
                file_size: attachmentFile?.size || 0
            } : undefined
        };

        setShowSamples(false);
        setMessages((prev) => [...prev, userMessage]);
        setMessage("");

        try {
            const authToken = await getAuthToken();
            if (!authToken) return;

            setMessages((prev) => [
                ...prev,
                {
                    id: "typing-indicator",
                    content: "",
                    sender: "assistant",
                    role: "assistant",
                    timestamp: new Date().toISOString(),
                },
            ]);

            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({animated: true});
            }, 100);

            const storedConversationId =
                conversationIdRef.current || conversationId || "";

            const chatHistory = [...messages, userMessage]
                .filter((msg, index, source) => {
                    if (msg.id === "typing-indicator") return false;
                    if (index === source.length - 1) return true;
                    return Boolean(msg.content?.trim());
                })
                .map((msg) => {
                    const role = msg.sender === "user" || msg.role === "user" ? "user" : "assistant";
                    return {
                        id: msg.id,
                        content: msg.content,
                        sender: role,
                        role,
                        timestamp: msg.timestamp,
                    };
                });

            const compressedChats = LZString.compressToEncodedURIComponent(
                JSON.stringify(chatHistory)
            );

            if (attachmentFile) {
                await postChatMessageWithFile(compressedChats, storedConversationId, selectedLanguageCode,
                    attachmentFile.uri, attachmentFile.mimeType, attachmentFile.name, async (response: any) => {
                        await parseResponseNewChatStreamData(response, true, setMessages, (id: string) => {
                            rememberPostConsultationPromptForConversation(id);
                            Analytics.chatMessageSent({
                                messageLength: trimmedMessage.length,
                                language: selectedLanguageCode,
                                sessionId: id,
                            });
                            setConversationId(id);
                            reloadPlanInfo();
                        }, () => {
                            Analytics.referralInitiated({
                                areaOfLaw: "Immigration"
                            });
                            reloadPlanInfo();

                            setReferralActionData({
                                index: messages.length,
                                type: 'start',
                                subType: '',
                                label: '',
                                isBack: false,
                                referralData: null
                            })
                        });
                    }, (status: any, errorDetail: any) => {
                        reloadPlanInfo();
                        handleError(t, errorDetail);
                    })
            } else {
                await getChatSingleMessageData(compressedChats, storedConversationId, selectedLanguageCode, async (response: any) => {
                    await parseResponseNewChatStreamData(response, true, setMessages, (id: string) => {
                        rememberPostConsultationPromptForConversation(id);
                        Analytics.chatMessageSent({
                            messageLength: trimmedMessage.length,
                            language: selectedLanguageCode,
                            sessionId: id,
                        });
                        setConversationId(id);
                        reloadPlanInfo();
                    }, () => {
                        Analytics.referralInitiated({
                            areaOfLaw: "Immigration"
                        });
                        reloadPlanInfo();

                        setReferralActionData({
                            index: messages.length,
                            type: 'start',
                            subType: '',
                            label: '',
                            isBack: false,
                            referralData: null
                        })
                    });
                }, (status: any, errorDetail: any) => {
                    reloadPlanInfo();
                    throw new Error(t('error.api_error', {status, errorDetail}));
                })
            }

        } catch (error) {
            setMessages((prev) => {
                const filteredMessages = prev.filter(msg => msg.id !== "typing-indicator");
                return [
                    ...filteredMessages,
                    {
                        id: Date.now().toString(),
                        content: t('error.try_again'),
                        sender: "assistant",
                        role: "assistant",
                        timestamp: new Date().toISOString(),
                    },
                ];
            });
            reloadPlanInfo();
        } finally {
            sendInProgressRef.current = false;
            setIsStreaming(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        const prompt = Array.isArray(initialPrompt) ? initialPrompt[0] : initialPrompt;
        if (!prompt || initialPromptSentRef.current) return;

        initialPromptSentRef.current = true;
        postConsultationPromptRef.current = String(prompt);
        AsyncStorage.setItem(POST_CONSULTATION_AI_PROMPT_KEY, String(prompt));
        setShowSamples(false);
        setMessages((prev) => {
            if (prev.some((msg) => msg.id === POST_CONSULTATION_FOLLOW_UP_ID)) {
                return prev;
            }

            return [
                ...prev,
                {
                    id: POST_CONSULTATION_FOLLOW_UP_ID,
                    content: String(prompt),
                    sender: "assistant",
                    role: "assistant",
                    timestamp: new Date().toISOString(),
                },
            ];
        });
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({animated: true});
        }, 100);
    }, [initialPrompt]);

    const edgesData = (
        isShowInputView
            ? ['top', 'left', 'right']
            : ['top', 'left', 'right', 'bottom']
    ) as Edges;

    return (
        <SafeAreaView edges={edgesData}
                      style={{flex: 1, backgroundColor: backgroundColor}}>

            <View style={{flex: 1, backgroundColor: backgroundColor}}>
                <View style={styles.header}>

                    <View style={{flexDirection: "row", justifyContent: 'flex-start'}}>
                        <TouchableOpacity
                            onPress={async () => {
                                if (recording) await recording.stopAndUnloadAsync();
                                router.replace("/(app)/(tabs)")
                            }}
                            style={[styles.headerIcon, {
                                paddingStart: Platform.OS === "android" ? SPACING.md : 0
                            }]}
                        >
                            <MaterialIcons name="arrow-back-ios" size={24} color={textColor}/>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => showDisclaimer(t)} style={[styles.headerIcon, {
                            paddingStart: Platform.OS === "android" ? SPACING.md : 0
                        }]}>
                            <MaterialIcons name="info-outline" size={24} color={textColor}/>
                        </TouchableOpacity>
                    </View>

                    <View style={{flex: 1}}>
                        <ThemedText style={{fontSize: 24, color: textColor, alignSelf: 'center'}}>
                            {t('chat.title')}
                        </ThemedText>

                        {!isProUser && walletData?.subscription?.plan_id === "freemium" && (
                            <TouchableOpacity onPress={() => {
                                router.push("/(app)/manageSubscription/current-plan-screen");
                            }}>
                                <View style={{
                                    alignSelf: "center",
                                    backgroundColor: walletData?.freemium?.daily_pass_active
                                        ? "#111827"
                                        : queryRemainingCount <= 2
                                            ? "#FFF0F0"
                                            : c.SecodaryColor,
                                    paddingHorizontal: 12,
                                    paddingVertical: 2,
                                    borderRadius: 999,
                                    marginTop: 4,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    borderWidth: walletData?.freemium?.daily_pass_active ? 0 : 1,
                                    borderColor: queryRemainingCount <= 2 ? "#FFC1C1" : c.SecodaryColor,
                                }}>
                                    <View style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: walletData?.freemium?.daily_pass_active
                                            ? c.SecodaryColor
                                            : queryRemainingCount <= 2 ? "#FF4D4D" : c.White,
                                        marginRight: 6,
                                    }}/>
                                    <ThemedText style={{
                                        fontSize: 10,
                                        fontWeight: "600",
                                        color: walletData?.freemium?.daily_pass_active
                                            ? "#FFFFFF"
                                            : queryRemainingCount <= 2 ? "#D32F2F" : c.White,
                                    }}>
                                        {walletData?.freemium?.daily_pass_active
                                            ? t('freemium.banner.daily_pass_active')
                                            : `${queryRemainingCount} ${t("queries_left")}`}
                                    </ThemedText>
                                </View>
                            </TouchableOpacity>
                        )}

                        {!isProUser && (
                            <TouchableOpacity onPress={() => {
                                router.push("/(app)/manageSubscription/current-plan-screen");
                            }}>
                                <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    gap: 8,
                                    marginTop: 2,
                                    flexWrap: 'wrap'
                                }}>
                                    <LimitBadge
                                        icon="🎙️"
                                        remaining={walletData?.monthly_usage?.voice_notes ?? 0}
                                        count={walletData?.limits?.voice_notes_limit ?? null}
                                        label={t('voice_notes_limit')}
                                    />
                                    <LimitBadge
                                        icon="📁"
                                        remaining={walletData?.monthly_usage?.uploads ?? 0}
                                        count={walletData?.limits?.uploads_limit ?? null}
                                        label={t('uploads_limit')}
                                    />
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={{flexDirection: "row", justifyContent: 'flex-end', alignItems: "center"}}>
                        {/* {showMenuScript && (
                            <TouchableOpacity onPress={async () => {
                                await downloadManuscript(messages, (fileUri: string) => {
                                    router.push({
                                        pathname: "/(app)/chats/ManuScriptViewer",
                                        params: {file: fileUri}
                                    });
                                })
                            }} style={styles.headerIcon}>
                                <MaterialIcons name="save-alt" size={24} color={textColor}/>
                            </TouchableOpacity>
                        )}*/}

                        <TouchableOpacity
                            onPress={() => {
                                router.push({
                                    pathname: "/(app)/manage/selectLanguage",
                                    params: {from: "/(app)/chats/chat-screen"}
                                });
                            }}
                            style={styles.headerIcon}
                            accessibilityRole="button"
                            accessibilityLabel={t('setting.select_language')}
                        >
                            <Ionicons name="language-outline" size={24} color={COLORS.PrimaryColorText}/>
                        </TouchableOpacity>

                        <TourHighlight
                            zone={1}
                            title={t('tour_chat_history_title')}
                            text={t('tour_chat_history_desc')}
                        >

                            <TouchableOpacity onPress={toggleDrawer} style={styles.headerIcon}>
                                <MaterialIcons name="menu" size={24} color={textColor}/>
                            </TouchableOpacity>

                        </TourHighlight>
                    </View>
                </View>

                {drawerVisible && (
                    <ChatDrawer
                        isVisible={drawerVisible}
                        loadChat={loadChat}
                        onClose={() => setDrawerVisible(false)}
                    />
                )}

                <KeyboardAwareScrollView
                    ref={scrollViewRef}
                    style={styles.chatContent}
                    keyboardDismissMode="interactive"
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({animated: true})}
                >
                    {messages.map((msg, index) => (
                        <View key={`${msg.id}-${index}`}>
                            {(msg.content || msg.image_url || msg.metadata?.file_url || msg?.audio_url || msg.id === "typing-indicator") &&
                                <>
                                    <ThemedView
                                        style={[
                                            innerStyles.messageRow(msg.role),
                                            (msg.id === "1" || msg.id === "2" || msg.id === "3")
                                                ? {marginVertical: SPACING.xs}
                                                : {marginVertical: SPACING.md}
                                        ]}
                                    >
                                        <ThemedView style={[
                                            ["1", "2", "3"].includes(msg.id)
                                                ? innerStyles.messageBubbleBG(msg.role)
                                                : innerStyles.messageBubble(msg.role),
                                            {paddingTop: SPACING.md}
                                        ]}>
                                            {msg.id === "typing-indicator" ? (
                                                <TypingIndicator color={primary}/>
                                            ) : (
                                                <Pressable onLongPress={() => handleLongPress(index)}>
                                                    <CustomTextViewWithAnim msg={msg}/>
                                                </Pressable>
                                            )}
                                        </ThemedView>
                                        <View style={{height: 4}}/>
                                    </ThemedView>

                                    {(msg.sender === "assistant" && msg.canReceiveFeedback) ? (
                                        <FeedBackUi
                                            messageData={msg}
                                            selectedIndex={index}
                                            deleteFeedback={(selectedItemIndex, feedbackId) => {
                                                deleteChatFeedback(selectedItemIndex, feedbackId);
                                            }}
                                            selectThumbsUp={(msgData, selectedItemIndex) => {
                                                handleSubmitFeedback('thumbs_up', msgData, selectedItemIndex, "", "", conversationId);
                                            }}
                                            selectThumbsDown={(msgData, selectedItemIndex) => {
                                                setSelectedMessageIndex(selectedItemIndex);
                                                setSelectedMessageContent(msgData);
                                                setFeedbackModalVisible(true);
                                            }}
                                        />
                                    ) : <View/>}

                                    {showActionView.display
                                        && showActionView.index === index
                                        && msg.sender === "user" && (
                                            <View style={styles.actionBar}>
                                                <TouchableOpacity onPress={() => handleEdit(msg)}
                                                                  style={styles.actionButton}>
                                                    <Text style={styles.actionText}>{t('edit')}</Text>
                                                    <Ionicons name="create-outline" size={18} color="#222"
                                                              style={styles.icon}/>
                                                </TouchableOpacity>
                                                <View style={styles.divider}/>
                                                <TouchableOpacity onPress={handleCopy} style={styles.actionButton}>
                                                    <Text style={styles.actionText}>{t('copy')}</Text>
                                                    <Ionicons name="copy-outline" size={18} color="#222"
                                                              style={styles.icon}/>
                                                </TouchableOpacity>
                                                <View style={styles.divider}/>
                                                <TouchableOpacity onPress={() => handleCancel()}
                                                                  style={styles.actionButton}>
                                                    <Text style={styles.actionText}>{t('cancel')}</Text>
                                                    <Ionicons name="close-circle-outline" size={18} color="#222"
                                                              style={styles.icon}/>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                </>
                            }

                            {msg.sender === "assistant" && msg.isReferralSuccess && (
                                <ThemedTextNew style={styles.referralSuccessView}>{msg.referralSuccess}</ThemedTextNew>
                            )}

                            {(msg.sender === "assistant" && referralActionData.referralData !== null && (messages.length - 1 === index)) && (
                                <ConsultationView
                                    optionData={referralActionData.referralData}
                                    onSelectLawyer={async (referral_id: string, lawyerData: any) => {
                                        getUserDetailsData(referral_id, lawyerData.lawyer_id);
                                    }}
                                    onRefreshLawyers={refreshReferralLawyers}
                                    onSelect={(option: any, nextStep: string, isBack: boolean = false) => {
                                        if (nextStep === "consultation_type" && !isBack && option?.value) {
                                            referralConsultationCategoryRef.current = String(option.value);
                                            referralBookingConsultationTypeRef.current = null;
                                        }

                                        if ((nextStep === "duration" || nextStep === "ongoing_duration") && !isBack && option?.value) {
                                            referralBookingConsultationTypeRef.current = String(option.value);
                                        }

                                        if (nextStep === "casework_service" && !isBack) {
                                            referralBookingConsultationTypeRef.current = null;
                                        }

                                        if (nextStep === "upload") {
                                            setReferralActionData({
                                                index: -1,
                                                type: nextStep.toString(),
                                                subType: option ? option.value : "",
                                                label: option ? option.label : "",
                                                referralData: null,
                                                isBack: isBack
                                            });
                                        } else {
                                            if (nextStep.toString() === "notes") {
                                                setShowInputView(true);
                                            }
                                            setReferralActionData({
                                                index: -1,
                                                type: nextStep.toString(),
                                                subType: option ? option.value : "",
                                                label: option ? option.label : "",
                                                referralData: null,
                                                isBack: isBack
                                            });
                                        }

                                        let referralDesc: string;
                                        const isEmptyLabel = !option?.label || option.label.trim() === "";

                                        if (isEmptyLabel) {
                                            if (nextStep?.toString() === "notes") {
                                                referralDesc = "Skip - Additional notes";
                                            } else {
                                                referralDesc = "";
                                            }
                                        } else {
                                            referralDesc = option.label;
                                        }

                                        if (referralDesc && !isBack) {
                                            const userMessage: Message = {
                                                id: Date.now().toString(),
                                                content: referralDesc,
                                                sender: "user",
                                                role: "user",
                                                timestamp: new Date().toISOString(),
                                            };
                                            if (Platform.OS === "android") Keyboard.dismiss();
                                            setMessages((prev) => [...prev, userMessage]);
                                        }
                                    }}
                                    updateFocus={(_status: boolean) => {
                                        // no-op — focus management isn't needed here
                                    }}
                                />
                            )}

                            {isQueryRemaining && (messages.length - 1 === index) && showSamples && (
                                <View style={{
                                    flex: 1,
                                    paddingStart: showSamples ? SPACING.md : 0,
                                    paddingTop: showSamples ? SPACING.md : 0
                                }}>
                                    <View style={{
                                        backgroundColor: "#D9CAA8",
                                        padding: SPACING.md,
                                        borderRadius: BORDER_RADIUS.lg,
                                        marginBottom: SPACING.xs,
                                    }}>
                                        <Text style={{fontWeight: "bold", fontSize: 16, marginBottom: SPACING.md}}>
                                            {t('chat.sample_questions_title')}
                                        </Text>
                                        <CollapsibleSampleList
                                            sampleQuestions={sampleQuestions}
                                            handleSend={(question: string, index: number) => handleSend(question)}
                                            setShowSamples={setShowSamples}
                                            SPACING={SPACING}
                                        />
                                    </View>
                                </View>
                            )}

                            {(messages.length - 1) === index && (<View style={{height: 20}}/>)}
                        </View>
                    ))}
                </KeyboardAwareScrollView>

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={{backgroundColor: backgroundColor, justifyContent: 'flex-end'}}
                >
                    {isShowAttachmentSheet && (
                        <AttachmentSheet
                            isShowAttachmentSheet={isShowAttachmentSheet}
                            onClose={() => setShowAttachmentSheet(false)}
                            onRecordingStarted={() => {
                                if (isProUser) {
                                    setShowAttachmentSheet(false);
                                    handleVoiceRecording().then(() => {
                                    });
                                } else {
                                    checkMinutesBeforeAction(true, () => {
                                        // Close sheet then set "readyToRecord" — does NOT start recording yet
                                        setShowAttachmentSheet(false);
                                        handleVoiceRecording().then(() => {
                                        });
                                    });
                                }
                            }}
                            onAttachment={() => {
                                if (isProUser) {
                                    setLoading(true)
                                    setTimeout(() => {
                                        setLoading(false)
                                        pickDocument(false).then((file) => setAttachment(file ?? null))
                                    }, 1000)
                                } else {
                                    checkMinutesBeforeAction(false, () => {
                                        setLoading(true)
                                        setTimeout(() => {
                                            setLoading(false)
                                            pickDocument(false).then((file) => setAttachment(file ?? null))
                                        }, 1000)
                                    });
                                }
                            }}
                            onImageAttachment={() => {
                                if (isProUser) {
                                    setLoading(true)
                                    setTimeout(() => {
                                        setLoading(false)
                                        pickImage((file: any) => setAttachment(file), (errorMessage: string) => {
                                            console.log("errorMessage", errorMessage)
                                        }, t)
                                    }, 1000)
                                } else {
                                    checkMinutesBeforeAction(false, () => {
                                        setLoading(true)
                                        setTimeout(() => {
                                            setLoading(false)
                                            pickImage((file: any) => setAttachment(file), (errorMessage: string) => {
                                                console.log("errorMessage", errorMessage)
                                            }, t)
                                        }, 1000)
                                    });
                                }
                            }}
                        />
                    )}

                    {feedbackModalVisible && (
                        <FeedbackModal
                            visible={feedbackModalVisible}
                            onClose={() => setFeedbackModalVisible(false)}
                            onSubmit={(reason: any, otherReason: string) => {
                                if (selectedMessageIndex != null) {
                                    handleSubmitFeedback('thumbs_down', selectedMessageContent,
                                        selectedMessageIndex, reason, otherReason, conversationId);
                                }
                                setFeedbackModalVisible(false)
                            }}
                            feedbackReasons={feedbackReasons}
                        />
                    )}
                </KeyboardAvoidingView>

                {userDetails && (
                    <BottomSheet ref={bottomSheetRef} snapPoints={snapPoints}>
                        <BottomSheetScrollView style={{marginBottom: 48}}>
                            {userDetails && (
                                <ProfessionalDetails
                                    professional={userDetails}
                                    loginUserData={loginUserData}
                                    consultationType={referralBookingConsultationTypeRef.current || "single_30_min"}
                                    requireBookingSlot={
                                        ["single_consultation", "ongoing_support"].includes(referralConsultationCategoryRef.current || "")
                                    }
                                    onClose={() => {
                                        setUserDetails(null);
                                        bottomSheetRef?.current?.close()
                                    }}
                                    onSelectLawyer={async (_id: string, booking: any) => {
                                        const selectedDetails: any = userDetails;
                                        let name = selectedDetails.firm_name ? selectedDetails.firm_name : selectedDetails.first_name
                                        const trimmedMessage = t('chat.you_selected', {name});

                                        setReferralActionData({
                                            index: -1,
                                            type: "select_lawyer_hide",
                                            subType: "",
                                            label: t('chat.you_selected', {name}),
                                            referralData: null,
                                            isBack: false,
                                        })

                                        if (trimmedMessage) {
                                            const userMessage: Message = {
                                                id: Date.now().toString(),
                                                content: trimmedMessage,
                                                sender: "user",
                                                role: "user",
                                                timestamp: new Date().toISOString(),
                                            };
                                            if (Platform.OS === "android") Keyboard.dismiss();
                                            setMessages((prev) => [...prev, userMessage]);
                                        }

                                        bottomSheetRef?.current?.close()

                                        await selectLawyer({
                                            ...selectedDetails,
                                            booking_start_at: booking?.start_at,
                                            booking_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || booking?.timezone,
                                        }, async (response: any) => {
                                            const assistantMessage: Message = {
                                                id: Date.now().toString(),
                                                content: "",
                                                sender: "assistant",
                                                role: "assistant",
                                                isReferralSuccess: true,
                                                referralSuccess: response.message,
                                                timestamp: new Date().toISOString()
                                            };

                                            Analytics.referralRequested({
                                                areaOfLaw: "immigration",
                                                urgency: "",
                                                budget: response.message
                                            })

                                            setMessages((prev) => [...prev, assistantMessage]);

                                            setTimeout(() => {
                                                setReferralActionData({
                                                    index: -1,
                                                    type: "select_lawyer",
                                                    subType: "",
                                                    label: "You selected: " + name,
                                                    referralData: null,
                                                    isBack: false,
                                                })
                                            }, 2000)

                                        }, (error: any) => {
                                        }, () => {
                                            setLoading(false);
                                        });
                                    }}
                                />
                            )}
                        </BottomSheetScrollView>
                    </BottomSheet>
                )}

                {isShowInputView && (
                    <View style={styles.inputContainer}>
                        <KeyboardStickyView style={{
                            width: "100%",
                            backgroundColor: backgroundColor,
                            paddingTop: Platform.OS === "ios" ? 8 : SPACING.sm,
                            paddingBottom: Platform.OS === "ios" ? insets.bottom : SPACING.md,
                            paddingHorizontal: SPACING.md,
                        }}>
                            <View style={styles.inputRow}>

                            {/* ── LEFT BUTTON ── */}
                            {(isRecording || isPaused || recordedUri) ? (
                                // Always show trash when recording/paused/recorded
                                <TouchableOpacity
                                    onPress={() => {
                                        deleteRecording();
                                    }}
                                    style={[styles.attachButton, {
                                        backgroundColor: 'transparent',
                                        borderWidth: 0,
                                    }]}
                                >
                                    <MaterialIcons name="delete-outline" size={26} color={textColor}/>
                                </TouchableOpacity>
                            ) : readyToRecord ? (
                                <TouchableOpacity
                                    onPress={() => handleVoiceRecording()}
                                    style={[styles.attachButton, {backgroundColor: '#808080'}]}
                                >
                                    <MaterialIcons name="close" size={24} color="#fff"/>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={openAttachmentSheet}
                                    disabled={loading || !isQueryRemaining || isRecording}
                                    style={[
                                        styles.attachButton,
                                        (loading || !isQueryRemaining || isRecording) && {backgroundColor: '#808080'},
                                    ]}
                                >
                                    <Feather name="plus" size={24} color="#fff"/>
                                </TouchableOpacity>
                            )}

                            {/* ── MIDDLE AREA ── */}
                            {isRecording ? (
                                // 🔴 RECORDING — timer + live waveform
                                <View style={[(isRecording || isPaused) ? styles.recordingViewArea : styles.inputArea, {
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
                                // ⏸ PAUSED — play button + green dot + waveform + timer
                                <View style={[(isRecording || isPaused) ? styles.recordingViewArea : styles.inputArea, {
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingHorizontal: 8,
                                    gap: 6,
                                }]}>
                                    {/* Play button */}
                                    <TouchableOpacity
                                        onPress={() => playPauseLivePreview(setPlaybackProgress)}  // ✅ pass setter
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
                                        <Ionicons name={isPlayingPreview ? "pause" : "play"} size={16} color="#fff"/>
                                    </TouchableOpacity>

                                    {/* Static waveform */}
                                    <View style={{
                                        flex: 1,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 2,
                                        overflow: 'hidden',
                                    }}>
                                        {waveformBars.map((barHeight, i) => {
                                            const barProgress = i / waveformBars.length;
                                            const isActive = isPlayingPreview && barProgress <= playbackProgress;

                                            return (
                                                <View
                                                    key={i}
                                                    style={{
                                                        width: 3,
                                                        borderRadius: 2,
                                                        backgroundColor: isActive ? secondary : '#ccc',
                                                        height: isActive ? barHeight * 1.15 : barHeight,  // ✅ grow active bars
                                                        opacity: isActive ? 1 : 0.5,
                                                    }}
                                                />
                                            );
                                        })}
                                    </View>
                                    {/* Duration */}
                                    <ThemedText style={{
                                        color: textColor,
                                        fontSize: 12,
                                        fontVariant: ['tabular-nums'],
                                    }}>
                                        {`0:${recordingDuration < 10 ? `0${recordingDuration}` : recordingDuration}`}
                                    </ThemedText>
                                </View>
                            ) : recordedUri ? (
                                // ✅ RECORDED — preview bar
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
                                        textAlignVertical: 'center',
                                        includeFontPadding: false,
                                        fontSize: 13,
                                    }}>
                                        {t('chat.voice_note_ready') || 'Voice note ready'}
                                    </ThemedText>
                                    <TouchableOpacity onPress={playPreview} style={{padding: 4}}>
                                        <MaterialIcons
                                            name={isPlayingPreview ? "pause-circle-filled" : "play-circle-fill"}
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
                                    <ThemedText style={{color: '#FF3B30', fontSize: 13}}>
                                        {t('chat.tap_to_record') || 'Tap 🔴 to start recording'}
                                    </ThemedText>
                                </View>
                            ) : (
                                // Normal text input
                                <View style={styles.inputArea}>
                                    <TextInput
                                        value={message}
                                        editable={isQueryRemaining && !loading && !isStreaming}
                                        onChangeText={setMessage}
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

                            {/* ── RIGHT BUTTON ── */}
                            {isRecording ? (
                                // Recording → pause (outlined) + green send
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
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
                                        <MaterialIcons name="pause" size={22} color={textColor}/>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={async () => {
                                            stopAndSendRecording();
                                        }}
                                        disabled={loading}
                                        style={[
                                            styles.sendButton,
                                            {backgroundColor: '#25D366'},
                                            loading && {backgroundColor: '#808080'}
                                        ]}
                                    >
                                        <Ionicons name="send" size={22} color="#fff"/>
                                    </TouchableOpacity>
                                </View>
                            ) : isPaused ? (
                                // Paused → red mic (resume) + green send
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                                    <TouchableOpacity
                                        onPress={resumeRecording}
                                        disabled={loading || !isQueryRemaining}
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 22,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Feather name="mic" size={26} color="#FF3B30"/>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={async () => {
                                            stopAndSendRecording();
                                        }}
                                        disabled={loading || !isQueryRemaining}
                                        style={[
                                            styles.sendButton,
                                            {backgroundColor: '#25D366'},
                                            (loading || !isQueryRemaining) && {backgroundColor: '#808080'}
                                        ]}
                                    >
                                        <Ionicons name="send" size={22} color="#fff"/>
                                    </TouchableOpacity>
                                </View>
                            ) : readyToRecord ? (
                                <TouchableOpacity
                                    onPress={startRecording}
                                    disabled={loading || !isQueryRemaining}
                                    style={[
                                        styles.sendButton,
                                        (loading || !isQueryRemaining) && {backgroundColor: '#808080'}
                                    ]}
                                >
                                    <Feather name="mic" size={24} color="#fff"/>
                                </TouchableOpacity>
                            ) : recordedUri ? (
                                <TouchableOpacity
                                    onPress={sendRecording}
                                    disabled={loading || !isQueryRemaining}
                                    style={[
                                        styles.sendButton,
                                        {backgroundColor: secondary},
                                        (loading || !isQueryRemaining) && {backgroundColor: '#808080'}
                                    ]}
                                >
                                    <Ionicons name="send" size={24} color="#fff"/>
                                </TouchableOpacity>
                            ) : (
                                message?.trim()?.length > 0 ? (
                                    <TouchableOpacity
                                        onPress={() => handleSend()}
                                        disabled={loading || !isQueryRemaining}
                                        style={[
                                            styles.sendButton,
                                            (loading || !isQueryRemaining) && {backgroundColor: '#808080'}
                                        ]}
                                    >
                                        <Ionicons name="send" size={24} color="#fff"/>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        onPress={() => {
                                            handleVoiceRecording().then(() => {
                                                startRecording();
                                            })
                                        }}
                                        disabled={loading || !isQueryRemaining}
                                        style={[
                                            styles.sendButton,
                                            (loading || !isQueryRemaining) && {backgroundColor: '#808080'}
                                        ]}
                                    >
                                        <Feather name="mic" size={22} color="#fff"/>
                                    </TouchableOpacity>
                                )
                            )}
                            </View>

                            <View style={styles.assistantDisclaimerRow}>
                                <Ionicons name="warning-outline" size={12} color="#999999"/>
                                <Text
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.76}
                                    numberOfLines={1}
                                    style={styles.assistantDisclaimerText}
                                >
                                    LawNeeds Support Assistant can make mistakes. Check important info.
                                </Text>
                            </View>

                        </KeyboardStickyView>
                    </View>
                )}

            </View>

            <SubscriptionModals
                walletData={walletData}
                isShowAdsView={isShowAdsView}
                setShowAdsView={setShowAdsView}
                showRewardedAd={showRewardedAd}
                clickBuyPass={() => {
                    setIsPurchasing(true);
                    buyDailyPass(t, () => {
                        reloadPlanInfo();
                        setShowAdsView(false)
                        setIsPurchasing(false);
                    }, () => {
                        setIsPurchasing(false);
                    })
                }}
                modalConfig={modalConfig}
                setModalConfig={setModalConfig}
                isShowTopUpView={isShowTopUpView}
                showTopUpView={showTopUpView}
                isShowPremiumTopUpView={isShowPremiumTopUpView}
                showPremiumTopUpView={showPremiumTopUpView}
                isPurchasing={isPurchasing}
            />

            <PreviewDialog
                visible={attachment != null}
                file={attachment}
                onClose={() => setAttachment(null)}
                onSend={(caption: string) => {
                    handleSend(caption, attachment)
                    setAttachment(null);
                }}
                mode="chat"
            />

            <Modal animationType="slide" visible={imageModalVisible} transparent={true}>
                <View style={styles.attachmentOverlay}>
                    <Image
                        source={{uri: selectedImageUri}}
                        style={styles.fullImage}
                        resizeMode="contain"
                    />
                    <Pressable
                        style={styles.attachmentCloseButton}
                        onPress={() => setImageModalVisible(false)}
                    >
                        <MaterialIcons name="close" size={30} color="white"/>
                    </Pressable>
                </View>
            </Modal>

            {/* ── Referral File Preview Modal ─────────────────────────────── */}
            {pendingReferralFiles && (
                <ReferralFilePreviewSheet
                    files={pendingReferralFiles.files}
                    type={pendingReferralFiles.type}
                    onDeleteFile={(index) => {
                        const updated = pendingReferralFiles.files.filter((_, i) => i !== index);
                        if (updated.length === 0) {
                            setPendingReferralFiles(null);
                        } else {
                            setPendingReferralFiles({...pendingReferralFiles, files: updated});
                        }
                    }}
                    onCancel={() => setPendingReferralFiles(null)}
                    onUpload={() => {
                        const {files, optionData, type, responseText} = pendingReferralFiles;
                        setPendingReferralFiles(null);
                        uploadReferralDocument(files, optionData, type, responseText);
                    }}
                />
            )}

        </SafeAreaView>
    );
}

export default React.memo(function Chat() {
    return (
        <PageTourProvider>
            <ChatContent/>
        </PageTourProvider>
    );
});

const createStyles = (colors: {
    primary: string;
    secondary: string;
    inputBackground: string;
    backgroundColor: string;
    textColor: string;
}) => ({
    messageRow: (sender: "user" | "assistant"): ViewStyle => ({
        flexDirection: sender === "user" ? "row-reverse" : "row",
        backgroundColor: colors.backgroundColor,
        alignItems: "flex-end",
    }),
    messageBubble: (sender: "user" | "assistant"): ViewStyle => ({
        maxWidth: "100%",
        paddingLeft: SPACING.md,
        paddingRight: sender === "user" ? SPACING.md : 0,
        paddingTop: SPACING.md,
        paddingBottom: sender === "user" ? SPACING.md : 0,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: sender !== "user" ? colors.backgroundColor : "#D9CAA8",
        ...(sender !== "user"
            ? {borderBottomLeftRadius: 0}
            : {borderBottomRightRadius: 0}),
    }),
    messageBubbleBG: (sender: "user" | "assistant"): ViewStyle => ({
        maxWidth: "100%",
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: sender !== "user" ? "#666666" : "#D9CAA8",
        ...(sender !== "user"
            ? {borderBottomLeftRadius: 0}
            : {borderBottomRightRadius: 0}),
    }),
    messageText: (sender: "user" | "assistant"): TextStyle => ({
        color: sender === "user" ? "#000" : "#000",
    }),
    messageTextIntro: (sender: "user" | "assistant"): TextStyle => ({
        color: sender === "user" ? "#000" : "#FFF",
    })
});

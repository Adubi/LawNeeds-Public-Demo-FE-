import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    StyleSheet,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {Entypo, FontAwesome5, MaterialIcons} from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {COLORS as c} from "@/constants/colors";
import {BORDER_RADIUS} from "@/constants/theme";
import {SafeAreaView, useSafeAreaInsets} from "react-native-safe-area-context";
import {router, useFocusEffect, useLocalSearchParams, useNavigationContainerRef} from "expo-router";
import {useTranslation} from "react-i18next";
import {heightPercentageToDP as hp} from "react-native-responsive-screen";
import useAudioPlayer from "@/components/Inbox/useAudioPlayer";
import {RFValue} from "react-native-responsive-fontsize";
import {getLawyerCaseDetails, getUserCaseDetails, professionalUserDetails} from "@/services/apiHelper";
import {LawyersDetailsItem} from "@/components/chat/LawyersDetailsItem";
import {UserDetailsItem} from "@/components/chat/UserDetailsItem";
import BottomSheet, {BottomSheetScrollView} from "@gorhom/bottom-sheet";
import ProfessionalDetails from "@/app/(app)/(tabs)/search/ProfessionalDetails";
import {SuccessAnimation} from "@/components/Inbox/SuccessAnimation";
import {useApp} from "@/contexts/AppContext";
import {
    getConsultationSession,
    getUserData,
    handleOpenFile,
    saveConsultationSession,
    showAlertView
} from "@/constants/Utility";
import ConsultationService from "@/services/ConsultationService";
import {ActionButton} from "@/components/Inbox/ActionButton";
import ConsultationSockets from "@/services/ConsultationSockets";
import {setCurrentRoute} from "@/utils/navigationState";
import Analytics from "@/helpers/AnalyticsHelper";
import ConsultationPaymentDisclaimerModal from "@/components/consultation/ConsultationPaymentDisclaimerModal";


type SaveBtnProps = {
    submitLabel: string;
    onPress: () => void;
};

type RejectBtnProps = {
    submitLabel: string;
    type: string;
    onPress: () => void;
};

type Attachment = {
    type: "pdf" | "voice_note" | "image" | "video" | string;
    url: string;
    name: string;
    metadata: any
};

const getAttachmentMimeType = (attachment: Attachment): string | undefined => {
    const type = attachment.type.toLowerCase();
    if (type.includes("pdf")) return "application/pdf";
    if (type.includes("image")) return "image/*";
    if (type.includes("video")) return "video/*";
    if (type.includes("voice") || type.includes("audio")) return "audio/*";
    return undefined;
};

const getExportFileName = (attachment: Attachment, index: number): string => {
    const extension = attachment.url.split("?")[0].split(".").pop();
    const baseName = (attachment.name || `attachment-${index + 1}`)
        .replace(/[^a-zA-Z0-9._-]/g, "_");

    return baseName.includes(".") || !extension
        ? baseName
        : `${baseName}.${extension}`;
};

const getAttachmentKey = (attachment: Attachment, index: number): string =>
    attachment.metadata?.s3_key || `${attachment.type}:${attachment.name}:${index}`;

export interface LawyerProfile {
    lawyer_id: string;
    name: string;
    firm: string;
    expertise: string[];
    about: string;
    profile_picture: string;
    tagline: string | null;
    professional_employer: string;
}

export interface RequestDetailsResponse {
    referral_id: string;
    client_profile: any;
    lawyer_profile: LawyerProfile | null;
    selected_service: string;
    consultation_type: string;
    consultation_duration: string;
    booking?: {
        id: string;
        status: string;
        start_at: string;
        end_at: string;
        timezone?: string;
        consultation_type?: string;
        consultation_category?: string;
    } | null;
    casework_service_label?: string;
    casework_price_range?: string;
    urgency_level: string;
    budget_range: string;
    user_location: string | null;
    issue_summary: string;
    additional_notes: string | null;
    confirmation_summary: string | null;
    voice_note_url: string | null;
    pdf_attachment_url: string | null;
    attachments: Attachment[];
    voice_note: string | null;
    can_access_messages?: boolean | null;
    session_id: string | null;
    status: string;
    created_at: string;
    conversation_id?: string;
    session_status?: string;
    timer_started_at?: string;
    can_start_consultation?: boolean | null;
}

const SaveBtn: React.FC<SaveBtnProps> = ({submitLabel, onPress}) => (
    <View style={{justifyContent: 'center', flex: 1}}>
        <TouchableOpacity
            onPress={onPress}
            style={{
                width: "100%",
                marginVertical: 24,
                backgroundColor: c.SecodaryColor,
                borderRadius: BORDER_RADIUS.md,
                height: 48,
                justifyContent: 'center',
                alignItems: 'center',
            }}>
            <Text style={saveBtnTextStyle}>{submitLabel}</Text>
        </TouchableOpacity>
    </View>
);

const RejectBtn: React.FC<RejectBtnProps> = ({submitLabel, type, onPress}) => (
    <View style={{width: "100%", flex: 1}}>
        <TouchableOpacity
            onPress={onPress}
            style={{
                width: "100%",
                marginVertical: 24,
                backgroundColor:
                    type === "delete" ? "red" :
                        type === "withdraw" ? "#FF9500" :
                            c.Gray,
                borderRadius: BORDER_RADIUS.md,
                height: 48,
                justifyContent: 'center',
                alignItems: 'center',
            }}>
            <Text style={saveBtnTextStyle}>{submitLabel}</Text>
        </TouchableOpacity>
    </View>
);

const saveBtnTextStyle = {
    fontFamily: 'InstrumentSansSemiBold',
    fontSize: 18,
    color: c.White,
} as const;

const formatBookingSlot = (booking?: RequestDetailsResponse["booking"]) => {
    if (!booking?.start_at || !booking?.end_at) return "";

    const start = new Date(booking.start_at);
    const end = new Date(booking.end_at);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";

    const timeZone = booking.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
        const dateText = new Intl.DateTimeFormat("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone,
        }).format(start);
        const startTime = new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone,
        }).format(start);
        const endTime = new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone,
        }).format(end);
        return `${dateText}, ${startTime}-${endTime}`;
    } catch (_) {
        return `${start.toLocaleDateString()} ${start.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}-${end.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}`;
    }
};


const RequestDetails = () => {

    const {playPauseSound, isPlaying} = useAudioPlayer();
    const insets = useSafeAreaInsets();
    const {t} = useTranslation();
    const navRef = useNavigationContainerRef();
    const params = useLocalSearchParams();
    const {referral_id, isUserPro, session_id} = params;

    const asString = (val: string | string[] | undefined): string => {
        const value = Array.isArray(val) ? val[0] : val ?? "";
        return value === "undefined" || value === "null" ? "" : value;
    };

    const referralId = asString(referral_id);
    const sessionIdStr = asString(session_id);
    const isProUser = isUserPro === 'true';

    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const {setRefreshReloadCaseList, isReloadRequestDetails, isCaseListReload} = useApp();

    const [paymentData, setPaymentData] = useState<any>(null);
    const [sessionId, setSessionId] = useState(sessionIdStr);

    const [caseDetails, setCaseDetails] = useState<RequestDetailsResponse>();
    const [loginUserData, setLoginUserData] = useState<any>(null);
    const [userDetails, setUserDetails] = useState<any>(null);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState('');
    const [isRefreshUI, setRefreshUI] = useState(false);
    const [paymentDisclaimerVisible, setPaymentDisclaimerVisible] = useState(false);
    const [caseFolderExportVisible, setCaseFolderExportVisible] = useState(false);
    const [exportingAttachmentKey, setExportingAttachmentKey] = useState<string | null>(null);
    const [openingAttachmentKey, setOpeningAttachmentKey] = useState<string | null>(null);

    const isAcceptClickedRef = useRef(false);

    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['1%', '85%'], []);

    const lastSessionRef = useRef<string | null>(null);

    const isMatched = caseDetails?.status === "matched";
    const paymentStatus = paymentData?.payment_status;

    console.log("caseDetails", JSON.stringify(caseDetails))

    // FIX: added explicit parentheses to make precedence unambiguous
    const isSessionInactive =
        caseDetails?.status === "active" &&
        (
            (!caseDetails.can_start_consultation && caseDetails.session_status === "pending") ||
            (caseDetails.timer_started_at === null && !caseDetails.can_start_consultation)
        );

    const refreshCaseFolderAttachment = useCallback(
        (attachment: Attachment, index: number): Promise<Attachment> =>
            new Promise((resolve, reject) => {
                if (!referralId) {
                    reject(new Error("Missing referral id"));
                    return;
                }

                const onSuccess = (response: RequestDetailsResponse) => {
                    setCaseDetails(response);
                    const s3Key = attachment.metadata?.s3_key;
                    const refreshedAttachment = response.attachments?.find((candidate) =>
                        s3Key
                            ? candidate.metadata?.s3_key === s3Key
                            : candidate.name === attachment.name && candidate.type === attachment.type
                    ) ?? response.attachments?.[index];

                    if (!refreshedAttachment?.url) {
                        reject(new Error("The refreshed attachment URL is unavailable"));
                        return;
                    }
                    resolve(refreshedAttachment);
                };

                const onError = (error: unknown) => reject(error);
                const apiCall = isProUser ? getLawyerCaseDetails : getUserCaseDetails;
                void apiCall(referralId, onSuccess, onError, undefined);
            }),
        [isProUser, referralId]
    );

    const openCaseFolderAttachment = useCallback(async (attachment: Attachment, index: number) => {
        if (!attachment.url || openingAttachmentKey) return;

        const attachmentKey = getAttachmentKey(attachment, index);
        setOpeningAttachmentKey(attachmentKey);
        try {
            const refreshedAttachment = await refreshCaseFolderAttachment(attachment, index);
            const {type, url, name} = refreshedAttachment;

            if (type === "image") {
                setSelectedImageUri(url);
                setImageModalVisible(true);
            } else if (type === "voice_note") {
                await playPauseSound(url);
            } else {
                await handleOpenFile(url, name, type);
            }
        } catch (error) {
            console.error("Unable to refresh case folder attachment", error);
            Alert.alert("Open attachment", "We could not refresh this attachment. Please check your connection and try again.");
        } finally {
            setOpeningAttachmentKey(null);
        }
    }, [openingAttachmentKey, playPauseSound, refreshCaseFolderAttachment]);

    const shareCaseFolderAttachment = useCallback(async (attachment: Attachment, index: number) => {
        if (!attachment.url || exportingAttachmentKey) return;

        const attachmentKey = getAttachmentKey(attachment, index);

        try {
            const canShare = await Sharing.isAvailableAsync();
            if (!canShare) {
                Alert.alert("Export attachment", "Sharing is not available on this device.");
                return;
            }

            setExportingAttachmentKey(attachmentKey);
            const refreshedAttachment = await refreshCaseFolderAttachment(attachment, index);
            const directory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
            if (!directory) {
                throw new Error("No temporary export directory is available.");
            }

            const localUri = refreshedAttachment.url.startsWith("file://") || refreshedAttachment.url.startsWith("content://")
                ? refreshedAttachment.url
                : (await FileSystem.downloadAsync(
                    refreshedAttachment.url,
                    `${directory}lawneeds-${Date.now()}-${getExportFileName(refreshedAttachment, index)}`,
                )).uri;

            await Sharing.shareAsync(localUri, {
                dialogTitle: `Export ${refreshedAttachment.name || "attachment"}`,
                mimeType: getAttachmentMimeType(refreshedAttachment),
            });
        } catch (error) {
            console.error("Unable to export case folder attachment", error);
            Alert.alert("Export attachment", "We could not export this attachment. Please try again.");
        } finally {
            setExportingAttachmentKey(null);
        }
    }, [exportingAttachmentKey, refreshCaseFolderAttachment]);

    // FIX: memoize filtered sections so the map doesn't run on every render
    const visibleDetailSections = useMemo(() => {
        const selectedSlot = formatBookingSlot(caseDetails?.booking);
        const sections = [
            {label: t('consultation_type'), value: caseDetails?.consultation_type},
            {label: t('consultation_time'), value: caseDetails?.consultation_duration},
            {label: "Selected slot", value: selectedSlot},
            {label: t('casework_service'), value: caseDetails?.casework_service_label},
            {label: t('casework_price_range'), value: caseDetails?.casework_price_range},
            {label: t('search.urgency'), value: caseDetails?.urgency_level},
            {label: t('search.additional_notes'), value: caseDetails?.additional_notes},
            {label: t('issue_summary'), value: caseDetails?.issue_summary},
            {label: t('search.budget'), value: caseDetails?.budget_range},
        ];
        return sections.filter(
            item =>
                item.value &&
                item.value.trim().length > 0 &&
                item.value.toLowerCase() !== "not specified"
        );
    }, [caseDetails, t]);

    // ── Handlers ───────────────────────────────────────────────────────────

    const handlePricingCheck = useCallback(async (sid: string, showAlertIfNotSet = false) => {
        try {
            const res = await ConsultationService.GetPricingRules(sid);
            const isPriceProposed = res?.proposed_price_status?.price_proposed === true;

            if (!isPriceProposed) {
                if (showAlertIfNotSet) {
                    Alert.alert(
                        t("pricing.title"),
                        t("pricing.not_proposed_message"),
                        [
                            {text: t("cancel"), style: "cancel"},
                            {
                                text: t("ok"),
                                onPress: () => {
                                    router.push({
                                        pathname: "/requestFlow/pricing-screen",
                                        params: {session_id: sid},
                                    });
                                },
                            },
                        ]
                    );
                } else {
                    router.push({
                        pathname: "/requestFlow/pricing-screen",
                        params: {session_id: sid},
                    });
                }
            }
        } catch (e) {
            console.log("Pricing check error", e);
            if (showAlertIfNotSet) {
                Alert.alert(t("error.title"), t("pricing.load_failed"));
            }
        }
    }, [t]);

    const handleAfterAccept = useCallback(async (sid: string) => {
        await handlePricingCheck(sid, false);
    }, [handlePricingCheck]);

    const fetchPricing = useCallback(async (sid: string) => {
        if (isAcceptClickedRef.current) return;
        setLoading(true);
        await handlePricingCheck(sid, true);
        setLoading(false);
    }, [handlePricingCheck]);

    const handleAcceptPress = useCallback(() => {
        showAlertView(
            t,
            "accept",
            t('accept_request_message'),
            caseDetails,
            async (response: any) => {
                isAcceptClickedRef.current = true;
                setLoading(false);
                if (response?.session_id) {
                    await handleAfterAccept(response.session_id);
                    setSessionId(response.session_id);
                    Analytics.lawyerMatched({
                        action: "accept",
                        firm_id: loginUserData?.id || ""
                    });
                }
                setRefreshReloadCaseList();
            },
            (isShow: boolean) => {
                setLoading(isShow);
            }
        );
    }, [t, caseDetails, handleAfterAccept, loginUserData, setRefreshReloadCaseList]);

    const handleRejectPress = useCallback((type: string) => {
        let message = t("delete_request_message");
        if (type === "reject") {
            message = t("reject_request_message");
        } else if (type === "withdraw") {
            message = t("withdraw_request_message");
        }

        showAlertView(
            t,
            type,
            message,
            caseDetails,
            (msg: string) => {
                setRefreshReloadCaseList();
                Alert.alert(
                    "",
                    msg,
                    [
                        {
                            text: t('ok'),
                            onPress: () => {
                                if (router.canGoBack()) {
                                    router.dismissAll();
                                }
                                router.push("/(app)/(tabs)/inbox");
                            }
                        }
                    ],
                    {cancelable: false}
                );
            }
        );
    }, [t, caseDetails, setRefreshReloadCaseList]);

    const handleGoBack = useCallback(async () => {
        if (navRef.canGoBack()) {
            setRefreshReloadCaseList();
            router.back();
        } else {
            router.push("/");
        }
    }, [navRef, setRefreshReloadCaseList]);

    const handleSuccessClose = useCallback(() => {
        setShowSuccess(false);
        if (router.canGoBack()) {
            router.dismissAll();
        }
        router.push("/(app)/(tabs)/inbox");
    }, []);

    const openPaymentPage = useCallback(() => {
        setPaymentDisclaimerVisible(false);
        router.push({
            pathname: "/requestFlow/payment/[sessionId]",
            params: {
                sessionId: String(sessionId),
                lawyer_profile: JSON.stringify(caseDetails?.lawyer_profile),
                referralId: referralId
            }
        });
    }, [sessionId, caseDetails?.lawyer_profile, referralId]);

    const handlePayNow = useCallback(() => {
        setPaymentDisclaimerVisible(true);
    }, []);

    const handleStartConsultation = useCallback(() => {
        const targetReferralId = referralId || caseDetails?.referral_id;
        const targetSessionId = sessionId || caseDetails?.session_id || paymentData?.session_id;
        const isCompletedHistory = caseDetails?.session_status === "completed";

        if (!targetReferralId || (!targetSessionId && !isCompletedHistory)) {
            Alert.alert("", "Consultation history is not available for this request yet.");
            return;
        }

        router.push({
            pathname: "/(app)/requestFlow/ConsultationScreen",
            params: {
                data: JSON.stringify(caseDetails),
                isUserPro: isUserPro,
                referral_id: targetReferralId,
                session_id: targetSessionId || "",
                historyMode: String(isCompletedHistory)
            },
        });
    }, [caseDetails, isUserPro, paymentData?.session_id, referralId, sessionId]);

    // ── Effects ────────────────────────────────────────────────────────────

    useEffect(() => {
        if (isProUser) return;

        const conversationId = caseDetails?.conversation_id;
        if (!conversationId) return;

        let ws: WebSocket | null = null;
        let isMounted = true;

        const handleMessage = (data: any) => {
            if (!isMounted || !data) return;

            const type = data?.type || data?.notification?.type;
            switch (type) {
                case "referral_accepted":
                    console.log("✅ Referral accepted");
                    setRefreshUI((prev) => !prev);
                    break;
                case "referral_rejected":
                    console.log("❌ Referral rejected");
                    setRefreshUI((prev) => !prev);
                    break;
                default:
                    break;
            }
        };

        const initSocket = async () => {
            try {
                ws = await ConsultationSockets.createReferralSocket(conversationId, handleMessage);
            } catch (error) {
                console.error("❌ Socket init failed:", error);
            }
        };

        initSocket();

        return () => {
            isMounted = false;
            // FIX: guard against closing an already-closed socket
            try {
                if (ws && ws.readyState !== WebSocket.CLOSED) {
                    ws.close();
                }
            } catch (_) {}
            ws = null;
        };
    }, [caseDetails?.conversation_id, isProUser]);

    useFocusEffect(
        useCallback(() => {
            setCurrentRoute("RequestDetails", {
                session_id: sessionId,
                referral_id: referralId,
            });
        }, [sessionId, referralId])
    );

    useEffect(() => {
        const loadUser = async () => {
            const userData = await getUserData();
            if (userData) setLoginUserData(userData);
        };
        loadUser();
    }, []);

    useEffect(() => {
        if (!referralId) return;

        const fetchData = async () => {
            setLoading(true);

            const onSuccess = async (response: RequestDetailsResponse) => {
                if (!response) return;
                setCaseDetails(response);

                if (isProUser) {
                    if (response.session_id) {
                        setSessionId(response.session_id);
                    }
                } else {
                    if (!sessionId) {
                        if (response?.session_id) {
                            setSessionId(response.session_id);
                        } else {
                            const consultationData = await getConsultationSession();
                            if (
                                consultationData &&
                                response.referral_id === consultationData.referral_id &&
                                consultationData.session_id
                            ) {
                                setSessionId(consultationData.session_id);
                            }
                        }
                    }
                }
            };

            const onError = (err: any) => console.error(err);
            const onFinally = () => setLoading(false);

            if (isProUser) {
                await getLawyerCaseDetails(referralId, onSuccess, onError, onFinally);
            } else {
                await getUserCaseDetails(referralId, onSuccess, onError, onFinally);
            }
        };

        fetchData();
    }, [referral_id, isProUser, isCaseListReload, isReloadRequestDetails, isRefreshUI]);

    useEffect(() => {
        if (!isProUser && sessionId) {
            saveConsultationSession(sessionId, referralId);
        }
    }, [sessionId, referralId]);

    useEffect(() => {
        if (!sessionId || !isProUser || !caseDetails) return;
        if (isAcceptClickedRef.current) return;
        if (caseDetails.status !== "active") return;
        if (lastSessionRef.current === sessionId) return;

        lastSessionRef.current = sessionId;
        fetchPricing(sessionId);
    }, [sessionId, caseDetails?.status, isProUser, fetchPricing]);

    useEffect(() => {
        if (!sessionId) return;

        const paymentSummary = async () => {
            try {
                const res = await ConsultationService.GetPaymentSummary(sessionId);
                setPaymentData(res);
            } catch (e) {
                console.log("No paymentSummary");
            }
        };

        paymentSummary();
    }, [sessionId, isCaseListReload, isReloadRequestDetails]);

    // ── Renderers ──────────────────────────────────────────────────────────

    const renderAttachmentItem = useCallback((item: Attachment, index: number) => {
        const {type, url, name} = item;
        const attachmentKey = getAttachmentKey(item, index);
        const isOpening = openingAttachmentKey === attachmentKey;

        if (type === "image") {
            return (
                <TouchableOpacity
                    key={index}
                    disabled={Boolean(openingAttachmentKey)}
                    onPress={() => openCaseFolderAttachment(item, index)}
                >
                    <View style={styles.attachmentItem}>
                        <FontAwesome5 name="image" size={20} color="#d9534f"/>
                        <Text style={styles.attachmentText} numberOfLines={1}>{name}</Text>
                        {isOpening
                            ? <ActivityIndicator size="small" color={c.SecodaryColor}/>
                            : <MaterialIcons name="chevron-right" size={20}/>
                        }
                    </View>
                </TouchableOpacity>
            );
        }

        if (type === "voice_note") {
            return (
                <TouchableOpacity
                    key={index}
                    style={styles.voiceNoteItem}
                    disabled={Boolean(openingAttachmentKey)}
                    onPress={() => openCaseFolderAttachment(item, index)}
                >
                    <Entypo name="sound" size={20}/>
                    <Text style={styles.attachmentText} numberOfLines={1}>{name}</Text>
                    {isOpening
                        ? <ActivityIndicator size="small" color={c.SecodaryColor}/>
                        : <MaterialIcons
                            name={isPlaying(url) ? "pause-circle-filled" : "play-circle-fill"}
                            size={24}
                        />
                    }
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                key={index}
                disabled={Boolean(openingAttachmentKey)}
                onPress={() => openCaseFolderAttachment(item, index)}
            >
                <View style={styles.attachmentItem}>
                    <FontAwesome5 name="file-pdf" size={20}/>
                    <Text style={styles.attachmentText} numberOfLines={1}>{name}</Text>
                    {isOpening
                        ? <ActivityIndicator size="small" color={c.SecodaryColor}/>
                        : <MaterialIcons name="chevron-right" size={20}/>
                    }
                </View>
            </TouchableOpacity>
        );
    }, [isPlaying, openCaseFolderAttachment, openingAttachmentKey]);

    // FIX: memoized so it's not re-evaluated on every render
    const renderContent = useMemo(() => {
        if (isProUser) {
            if (caseDetails && isMatched) {
                return (
                    <>
                        <RejectBtn
                            submitLabel={t("reject")}
                            type="reject"
                            onPress={() => handleRejectPress("reject")}
                        />
                        <SaveBtn
                            submitLabel={t("accept")}
                            onPress={handleAcceptPress}
                        />
                    </>
                );
            }
            return <View style={{height: Platform.OS === "android" ? 20 : 0}}/>;
        }

        if (isMatched) {
            return (
                <RejectBtn
                    submitLabel={t("delete")}
                    type="delete"
                    onPress={() => handleRejectPress("delete")}
                />
            );
        }

        if (isSessionInactive) {
            return (
                <RejectBtn
                    submitLabel={t("withdraw")}
                    type="withdraw"
                    onPress={() => handleRejectPress("withdraw")}
                />
            );
        }

        return <View style={{height: Platform.OS === "android" ? 20 : 0}}/>;
    }, [isProUser, caseDetails, isMatched, isSessionInactive, t, handleAcceptPress, handleRejectPress]);

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
            <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{paddingBottom: insets.bottom + 40, paddingHorizontal: 16}}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            onPress={handleGoBack}
                            accessibilityRole="button"
                            accessibilityLabel={t('change_email.go_back')}
                            style={styles.backButton}
                        >
                            <MaterialIcons name="arrow-back-ios" size={24} color="#333"/>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle} allowFontScaling={false}>
                            {t('request_details')}
                        </Text>
                    </View>
                </View>

                {/* User / Lawyer Profile Card */}
                {caseDetails && (
                    isProUser
                        ? <UserDetailsItem requestDetails={caseDetails}/>
                        : <LawyersDetailsItem
                            requestDetails={caseDetails}
                            showUserDetails={(id: string) => {
                                professionalUserDetails(id, (res: any) => {
                                    setUserDetails(res);
                                    bottomSheetRef.current?.expand();
                                }, () => {});
                            }}
                        />
                )}

                {/* Detail Sections — filtered in useMemo above */}
                {visibleDetailSections.map((item, idx) => (
                    <View key={idx} style={styles.section}>
                        <Text style={styles.sectionTitle}>{item.label}</Text>
                        <Text style={styles.descriptionText}>{item.value}</Text>
                    </View>
                ))}

                {/* Payment Status */}
                {!isMatched && paymentData && caseDetails && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('status.title')}</Text>
                        <Text style={styles.descriptionText}>
                            {(caseDetails.session_status === "completed" || paymentStatus === "paid")
                                ? t('status.paid')
                                : t('status.unpaid')}
                        </Text>
                    </View>
                )}

                {/* Attachments */}
                {caseDetails?.attachments && caseDetails.attachments.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.caseFolderHeader}>
                            <Text style={styles.sectionTitle}>{t('case_folder')}</Text>
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Export case folder attachments"
                                accessibilityHint="Choose an attachment to share using your device, including by email"
                                onPress={() => setCaseFolderExportVisible(true)}
                                style={styles.exportCaseButton}
                            >
                                <MaterialIcons name="ios-share" size={20} color={c.PrimaryColorText}/>
                                <Text style={styles.exportCaseButtonText}>Export</Text>
                            </TouchableOpacity>
                        </View>
                        {caseDetails.attachments.map(renderAttachmentItem)}
                    </View>
                )}
            </ScrollView>

            {/* Action Button (pay / start consultation) */}
            {caseDetails && caseDetails?.status !== "matched" && caseDetails?.session_status !== "cancelled" && (
                <ActionButton
                    caseDetails={caseDetails}
                    isUserPro={String(isProUser)}
                    paymentData={paymentData}
                    sessionStatus={caseDetails.session_status || ""}
                    onPayNow={handlePayNow}
                    onStartConsultation={handleStartConsultation}
                />
            )}

            {/* Accept / Reject / Withdraw Buttons */}
            <View style={styles.actionButtons}>
                {renderContent}
            </View>

            <SuccessAnimation visible={showSuccess} onClose={handleSuccessClose}/>

            {loading && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={c.SecodaryColor}/>
                </View>
            )}

            <ConsultationPaymentDisclaimerModal
                visible={paymentDisclaimerVisible}
                onCancel={() => setPaymentDisclaimerVisible(false)}
                onProceed={openPaymentPage}
            />

            {/* FIX: added index={-1} so BottomSheet starts closed without warnings */}
            <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose>
                <BottomSheetScrollView>
                    {userDetails && (
                        <ProfessionalDetails
                            professional={userDetails}
                            loginUserData={loginUserData}
                            onClose={() => bottomSheetRef.current?.close()}
                        />
                    )}
                </BottomSheetScrollView>
            </BottomSheet>

            <Modal animationType="slide" visible={imageModalVisible} transparent={true}>
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.closeButton} onPress={() => setImageModalVisible(false)}>
                        <MaterialIcons name="close" size={30} color="white"/>
                    </Pressable>
                    <Image
                        source={{uri: selectedImageUri}}
                        style={styles.fullImage}
                        resizeMode="contain"
                    />
                </View>
            </Modal>

            <Modal
                animationType="slide"
                visible={caseFolderExportVisible}
                transparent
                onRequestClose={() => setCaseFolderExportVisible(false)}
            >
                <View style={styles.exportModalOverlay}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Close attachment export"
                        style={StyleSheet.absoluteFill}
                        onPress={() => setCaseFolderExportVisible(false)}
                    />
                    <View style={styles.exportModalSheet}>
                        <View style={styles.exportModalHeader}>
                            <View>
                                <Text style={styles.exportModalTitle}>Export Case Folder</Text>
                                <Text style={styles.exportModalSubtitle}>Choose an attachment to share by email or another app.</Text>
                            </View>
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Close attachment export"
                                onPress={() => setCaseFolderExportVisible(false)}
                                style={styles.exportCloseButton}
                            >
                                <MaterialIcons name="close" size={22} color={c.PrimaryColorText}/>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {caseDetails?.attachments.map((attachment, index) => {
                                const isExporting = exportingAttachmentKey === getAttachmentKey(attachment, index);
                                return (
                                    <TouchableOpacity
                                        key={`${attachment.url}-${index}`}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Export ${attachment.name || `attachment ${index + 1}`}`}
                                        accessibilityHint="Opens the device share sheet"
                                        disabled={Boolean(exportingAttachmentKey)}
                                        onPress={() => shareCaseFolderAttachment(attachment, index)}
                                        style={[styles.exportAttachmentRow, Boolean(exportingAttachmentKey) && !isExporting && styles.exportAttachmentRowDisabled]}
                                    >
                                        <MaterialIcons name="insert-drive-file" size={22} color={c.PrimaryColorText}/>
                                        <Text numberOfLines={1} style={styles.exportAttachmentName}>
                                            {attachment.name || `Attachment ${index + 1}`}
                                        </Text>
                                        {isExporting ? (
                                            <ActivityIndicator size="small" color={c.SecodaryColor}/>
                                        ) : (
                                            <MaterialIcons name="ios-share" size={22} color={c.PrimaryColorText}/>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default RequestDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: c.BackgroundColor,
    },
    avatarColumn: {
        alignItems: 'center',
        width: 66,
    },
    header: {
        width: "100%",
        height: hp(10),
        flexDirection: "row",
        alignItems: "center",
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: RFValue(18),
        fontWeight: '600',
        color: c.PrimaryColor,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    userInfo: {
        flex: 1,
        marginLeft: 16,
        marginRight: 16
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginRight: 8,
        flexShrink: 1,
    },
    urgentBadge: {
        backgroundColor: '#ff3b30',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    urgentText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailsButton: {
        padding: 4,
        justifyContent: 'center'
    },
    detailText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    descriptionText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    voiceNoteItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    voiceNoteLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    voiceNoteText: {
        fontSize: 14,
        color: '#333',
        marginLeft: 12,
    },
    voiceNoteDuration: {
        fontSize: 14,
        color: '#666',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rejectButton: {
        backgroundColor: '#f8f8f8',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    approveButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    section: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 8,
        marginTop: 8,
        elevation: 3
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12
    },
    caseFolderHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    exportCaseButton: {
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    exportCaseButtonText: {
        color: c.PrimaryColorText,
        fontFamily: "InstrumentSansSemiBold",
        fontSize: 14,
    },
    exportModalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    exportModalSheet: {
        maxHeight: "70%",
        backgroundColor: c.BackgroundColor,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    exportModalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 16,
    },
    exportModalTitle: {
        color: c.PrimaryColorText,
        fontFamily: "InstrumentSansSemiBold",
        fontSize: 20,
    },
    exportModalSubtitle: {
        color: c.GrayDark,
        fontSize: 14,
        lineHeight: 20,
        marginTop: 4,
        maxWidth: 290,
    },
    exportCloseButton: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    exportAttachmentRow: {
        minHeight: 56,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: c.GrayLight,
        paddingVertical: 10,
    },
    exportAttachmentRowDisabled: {
        opacity: 0.45,
    },
    exportAttachmentName: {
        flex: 1,
        color: c.PrimaryColorText,
        fontSize: 15,
    },
    attachmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10
    },
    attachmentText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16
    },
    downloadIcon: {
        marginLeft: 10
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 2
    },
    fullImage: {
        width: '90%',
        height: '80%'
    },
    divider: {
        height: 1,
        backgroundColor: '#ddd',
        marginHorizontal: 12,
    },
    loaderContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
    },
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
    actionButtons: {
        flexDirection: 'row',
        marginStart: 16,
        marginEnd: 16,
        gap: 8,
    }
});

import React, {useEffect, useState} from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {WebView} from "react-native-webview";
import {useTranslation} from "react-i18next";
import {Ionicons, MaterialCommunityIcons} from "@expo/vector-icons";
import {BORDER_RADIUS, COLORS} from "@/constants/theme";
import {COLORS as c} from "@/constants/colors";
import {SafeAreaView} from "react-native-safe-area-context";

type PreviewFile = {
    mimeType?: string;
    name?: string;
    uri: string;
};

type PreviewDialogProps = {
    visible: boolean;
    file?: PreviewFile | null;
    onClose: () => void;
    onSend: (caption: string) => void;
    mode?: "chat" | "consultation";
};

export default function PreviewDialog({
                                          visible,
                                          file,
                                          onClose,
                                          onSend,
                                          mode = "chat", // default to chat behavior
                                      }: PreviewDialogProps) {
    const {t} = useTranslation();
    const [caption, setCaption] = useState("");
    const [webViewLoading, setWebViewLoading] = useState(true);
    const [webViewError, setWebViewError] = useState(false);

    const isImage = file?.mimeType?.includes("image");
    const isPdf = file?.mimeType?.includes("pdf");
    const isDoc =
        file?.mimeType?.includes("word") ||
        file?.mimeType?.includes("doc") ||
        file?.name?.endsWith(".doc") ||
        file?.name?.endsWith(".docx");

    const isSupported = isImage || isPdf || isDoc;


    useEffect(() => {
      /*  if (visible && mode === "consultation" && file && isSupported) {
            onSend("");
        }*/
    }, [visible, mode, file]);

    const handleSend = () => {
        if (!isSupported) {
            alert("Only images, PDFs, and Word documents are supported.");
            return;
        }
        onSend(caption);
        setCaption("");
    };

    const handleClose = () => {
        setCaption("");
        setWebViewLoading(true);
        setWebViewError(false);
        onClose();
    };

    // For remote PDFs on iOS, use Google Docs viewer as a reliable fallback
    const getPdfViewerUri = (uri: string) => {
        if (Platform.OS === "ios" && !uri.startsWith("file://")) {
            return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(uri)}`;
        }
        return uri;
    };

    const getFileIcon = () => {
        if (isPdf) return {icon: "file-pdf-box", color: "#E53935"};
        if (isDoc) return {icon: "file-word-box", color: "#1565C0"};
        return {icon: "file-outline", color: "#666"};
    };

    const FileCard = () => {
        const {icon, color} = getFileIcon();
        return (
            <View style={styles.fileCard}>
                <MaterialCommunityIcons name={icon as any} size={72} color={color}/>
                <Text style={styles.fileName} numberOfLines={3}>
                    {file?.name}
                </Text>
                <Text style={styles.fileMime}>{file?.mimeType}</Text>
            </View>
        );
    };

    const renderPreview = () => {
        if (!file?.uri) {
            return <Text style={styles.errorText}>No file selected</Text>;
        }

        if (isImage) {
            return (
                <Image
                    style={styles.media}
                    source={{uri: file.uri}}
                    resizeMode="contain"
                />
            );
        }

        if (isPdf) {
            if (Platform.OS === "android") {
                // Android: show file card (WebView with PDF doesn't work well without plugins)
                return <FileCard/>;
            }
            // iOS: try WebView with Google Docs viewer for remote, or direct for local
            return (
                <View style={styles.media}>
                    {webViewLoading && (
                        <View style={styles.loaderOverlay}>
                            <ActivityIndicator size="large" color={c.SecodaryColor}/>
                            <Text style={styles.loaderText}>Loading preview…</Text>
                        </View>
                    )}
                    {webViewError ? (
                        <FileCard/>
                    ) : (
                        <WebView
                            originWhitelist={["*"]}
                            source={{uri: getPdfViewerUri(file.uri)}}
                            style={styles.media}
                            scalesPageToFit={true}
                            allowFileAccess={true}
                            allowFileAccessFromFileURLs={true}
                            allowUniversalAccessFromFileURLs={true}
                            startInLoadingState={false}
                            onLoadEnd={() => setWebViewLoading(false)}
                            onError={() => {
                                setWebViewLoading(false);
                                setWebViewError(true);
                            }}
                        />
                    )}
                </View>
            );
        }

        if (isDoc) {
            // Word docs: WebView rarely renders them reliably — show rich file card
            return <FileCard/>;
        }

        return (
            <View style={styles.fileCard}>
                <MaterialCommunityIcons name="file-question-outline" size={64} color="#999"/>
                <Text style={styles.errorText}>Preview not supported</Text>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={handleClose}
        >
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    style={{flex: 1}}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
                >
                    {/* Top Bar */}
                    <View style={styles.topBar}>
                        <TouchableOpacity
                            onPress={handleClose}
                            hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
                            style={styles.closeBtn}
                        >
                            <Ionicons name="close" size={22} color={c.Black}/>
                        </TouchableOpacity>

                        <Text style={styles.headerTitle} numberOfLines={1}>
                            {file?.name ?? "Preview"}
                        </Text>

                        <TouchableOpacity
                            onPress={handleSend}
                            hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
                            style={[
                                styles.topSendBtn,
                                !isSupported && styles.topSendBtnDisabled,
                            ]}
                        >
                            <Text style={styles.topSendText}>Send</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Preview Area */}
                    <View style={styles.previewContainer}>{renderPreview()}</View>

                    {/* Caption Input */}
                    {mode === "chat" && (<View style={styles.bottomBar}>
                            <View style={styles.inputArea}>
                                <TextInput
                                    placeholder={t("chat.chat_place_holder")}
                                    placeholderTextColor="#9E9E9E"
                                    value={caption}
                                    onChangeText={setCaption}
                                    multiline={true}
                                    blurOnSubmit={false}
                                    style={styles.input}
                                    returnKeyType="default"
                                />
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.sendBtn,
                                    !isSupported && styles.sendBtnDisabled,
                                ]}
                                onPress={handleSend}
                                disabled={!isSupported}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="send" size={20} color="#fff"/>
                            </TouchableOpacity>
                        </View>
                    )}
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: c.BackgroundColor,
    },

    // ── Top bar ──────────────────────────────────────────────
    topBar: {
        height: 52,
        paddingHorizontal: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(0,0,0,0.1)",
        backgroundColor: c.BackgroundColor,
    },
    closeBtn: {
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 18,
        backgroundColor: "rgba(0,0,0,0.06)",
    },
    headerTitle: {
        flex: 1,
        fontWeight: "600",
        fontSize: 15,
        textAlign: "center",
        marginHorizontal: 12,
        color: c.Black,
    },
    topSendBtn: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: c.SecodaryColor,
    },
    topSendBtnDisabled: {
        opacity: 0.4,
    },
    topSendText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },

    // ── Preview area ─────────────────────────────────────────
    previewContainer: {
        flex: 1,
        backgroundColor: c.BackgroundColor,
    },
    media: {
        flex: 1,
        width: "100%",
    },
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        gap: 12,
        backgroundColor: c.BackgroundColor,
    },
    loaderText: {
        fontSize: 14,
        color: "#888",
    },
    fileCard: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        paddingHorizontal: 32,
    },
    fileName: {
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
        color: c.Black,
        lineHeight: 22,
    },
    fileMime: {
        fontSize: 13,
        color: "#888",
        textAlign: "center",
    },
    errorText: {
        color: "#999",
        textAlign: "center",
        fontSize: 14,
        marginTop: 12,
    },

    // ── Bottom bar ────────────────────────────────────────────
    bottomBar: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
        backgroundColor: c.BackgroundColor,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "rgba(0,0,0,0.08)",
    },
    inputArea: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        minHeight: 44,
        maxHeight: 110,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderWidth: 1.5,
        borderColor: COLORS.light.pink,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: c.BackgroundColor,
    },
    input: {
        flex: 1,
        color: c.Black,
        fontSize: 15,
        lineHeight: 20,
        paddingTop: Platform.OS === "ios" ? 4 : 2,
        paddingBottom: Platform.OS === "ios" ? 4 : 2,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: c.SecodaryColor,
        alignItems: "center",
        justifyContent: "center",
    },
    sendBtnDisabled: {
        opacity: 0.4,
    },
});

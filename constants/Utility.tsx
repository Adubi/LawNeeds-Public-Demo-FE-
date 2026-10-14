import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {Alert, Linking, Platform, StyleSheet} from "react-native";
import {showTwoButtonAlert} from "@/components/Search/showTwoButtonAlert";
import {acceptRejectCase, userCancelRequest} from "@/services/apiHelper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {ProTypes} from "@/constants/protypes";
import Purchases from "react-native-purchases";
import {clearAuthToken, setAuthToken} from "@/services/httpservice";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import FileViewer from "react-native-file-viewer";
import CrashlyticsHelper from "@/helpers/CrashlyticsHelper";

const SUBSCRIPTION_SYNC_KEY = "LAST_SYNCED_SUBSCRIPTION";

export const saveLastSyncedSubscription = async (
    payload: any
): Promise<void> => {
    try {
        await AsyncStorage.setItem(
            SUBSCRIPTION_SYNC_KEY,
            JSON.stringify(payload)
        );
    } catch (error) {
        console.error("Failed to save last synced subscription:", error);
    }
};

export const getLastSyncedSubscription = async (): Promise<any | null> => {
    try {
        const data = await AsyncStorage.getItem(SUBSCRIPTION_SYNC_KEY);

        if (!data) return null;

        return JSON.parse(data);
    } catch (error) {
        console.error("Failed to get last synced subscription:", error);
        return null;
    }
};

export const formatToLocalDateTime = (
    dateString: string,
    locale: string = "en-IN",
    timeZone?: string
): string => {
    if (!dateString) return "";

    let normalized = dateString.trim();

    // ✅ Detect if timezone exists (Z or ±HH:mm)
    const hasTimeZone = /([zZ]|[+-]\d{2}:\d{2})$/.test(normalized);

    // ✅ Trim microseconds to milliseconds (max 3 digits)
    normalized = normalized.replace(
        /\.(\d{3})\d+/,
        ".$1"
    );

    // ✅ If no timezone → treat as UTC (append Z)
    if (!hasTimeZone) {
        normalized += "Z";
    }

    const date = new Date(normalized);

    // ✅ Handle invalid date
    if (isNaN(date.getTime())) {
        console.warn("Invalid date:", dateString);
        return dateString;
    }

    return date.toLocaleString(locale, {
        timeZone:
            timeZone ||
            Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
};

export const getFileTypeFromMime =
    (mimeType: string): "text" | "image" | "doc" | "docx" | "pdf" | "audio" | "other" => {
        if (!mimeType) return "other";

        if (mimeType.startsWith("image/")) return "image";
        // if (mimeType.startsWith("video/")) return "video";
        if (mimeType.startsWith("audio/")) return "audio";
        if (mimeType === "application/msword") return "docx";
        if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
        if (mimeType === "application/pdf") return "pdf";
        if (mimeType.startsWith("text/")) return "text";

        return "other";
    };

export const getMimeTypesByName = (name: string): string[] => {
    const mimeMap: Record<string, string[]> = {
        pdf: ["application/pdf"],
        doc: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        files: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        image: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/bmp",
            "image/svg+xml",
            "image/tiff",
        ],
        audio: [
            "audio/mpeg",
            "audio/wav",
            "audio/mp4",
            "audio/ogg",
            "audio/aac",
        ],
        txt: ["text/plain"],
    };

    return mimeMap[name.toLowerCase()] || ["*/*"];
};

export const pickMultipleImage = async (t: any) => {
    try {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            alert(t("per.camera_roll"));
            return null
        }

        const { assets, canceled } = await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: true,
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!canceled && assets && assets.length > 0) {

            let finalImages: any = [];

            assets.forEach(element => {
                const fileData = element;

                // 2. Prepare File Metadata
                const localUri = fileData.uri;
                const filename = fileData.fileName || localUri.split("/").pop() || "image.jpg";

                // Determine MIME type
                let type = fileData.mimeType;
                if (!type) {
                    const match = /\.(\w+)$/.exec(filename);
                    type = match ? `image/${match[1]}` : "image/jpeg";
                }

                // 3. File Type Validation (Optional: restrict to specific formats)
                const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/heic"];
                if (!allowedTypes.includes(type.toLowerCase())) {
                    const typeError = "Invalid image format. Please use JPG or PNG.";
                    alert(typeError);
                    return null;
                }

                finalImages.push({
                    uri: localUri,
                    name: filename,
                    mimeType: type,
                    size: fileData.fileSize
                })
            })

            return finalImages
        }

        return null
    } catch (error: any) {
        return null
    }
}

export const pickImage = async (onSuccess: any, onError: any, t: any) => {

    try {

        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            alert(t("per.camera_roll"));
            return;
        }

        const { assets, canceled } = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!canceled && assets && assets.length > 0) {

            const fileData = assets[0];

            // 1. File Size Validation (5MB Limit)
            /* const MAX_FILE_SIZE = 25 * 1024 * 1024;
             if (fileData.fileSize && fileData.fileSize > MAX_FILE_SIZE) {
                 const errorMsg = "Image is too large. Please select an image under 5MB.";
                 alert(errorMsg);
                 onError(errorMsg);
                 return;
             }*/

            // 2. Prepare File Metadata
            const localUri = fileData.uri;
            const filename = fileData.fileName || localUri.split("/").pop() || "image.jpg";

            // Determine MIME type
            let type = fileData.mimeType;
            if (!type) {
                const match = /\.(\w+)$/.exec(filename);
                type = match ? `image/${match[1]}` : "image/jpeg";
            }

            // 3. File Type Validation (Optional: restrict to specific formats)
            const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/heic"];
            if (!allowedTypes.includes(type.toLowerCase())) {
                const typeError = "Invalid image format. Please use JPG or PNG.";
                alert(typeError);
                onError(typeError);
                return;
            }

            if (onSuccess) {
                onSuccess({
                    uri: localUri,
                    name: filename,
                    mimeType: type,
                    size: fileData.fileSize // Passing size back to UI for the label we created
                });
            }

        } else {

            onError("Image selection was canceled.")
            //console.log("Image selection was canceled.");
        }
    } catch (error: any) {
        const errorMsg = error.response ? error.response.data : error.message;
        onError(error.response ? error.response.data : error.message)
        console.error("Error picking image:", errorMsg);
    }
}

export const isUserPro = async (): Promise<boolean> => {
    const userType = await AsyncStorage.getItem("user_type");

    if (!userType) return false;

    const proTypes = [
        ProTypes.LAWYER,
        ProTypes.LAW_FIRM,
        ProTypes.HR_LEGAL,
        ProTypes.A2J_PARTNERS,
    ];

    return proTypes.includes(userType as ProTypes);
};

export const pickMultipleDocument = async (type?: 'pdf' | 'doc') => {
    const pdfTypes = ["application/pdf"];
    const docTypes = [
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-word"
    ];

    let selectedTypes: string[];

    if (type === 'pdf') {
        selectedTypes = pdfTypes;
    } else if (type === 'doc') {
        selectedTypes = docTypes;
    } else {
        // Fallback: Combine both if no specific type is requested
        selectedTypes = [...pdfTypes, ...docTypes];
    }

    const { assets, canceled } = await DocumentPicker.getDocumentAsync({
        type: selectedTypes,
        copyToCacheDirectory: true,
        multiple: true
    });

    if (canceled || !assets || assets.length === 0) return;

    let finalFiles: any = [];
    assets.forEach(element => {
        const { name, mimeType } = element;

        // 2. File Type Validation
        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];

        let isValid = mimeType ? allowedTypes.includes(mimeType) : false;

        // Fallback: check file extension if mimeType is missing
        if (!isValid && name) {
            const ext = name.split(".").pop()?.toLowerCase();
            isValid = ["pdf", "doc", "docx"].includes(ext ?? "");
        }

        if (isValid) {
            finalFiles.push(element);
        }
    });

    if (finalFiles.length === 0) {
        Alert.alert(
            "Invalid File Type",
            "Please select a PDF or Word document (.pdf, .doc, .docx)"
        );
        return null;
    }

    return finalFiles;
};

export const pickDocument = async (isAlsoPickDoc: boolean = true) => {

    const pdfTypes = ["application/pdf"];
    const docTypes = [
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-word"
    ];

    let selectedTypes: string[];

    if (isAlsoPickDoc) {
        selectedTypes = [...pdfTypes, ...docTypes];
    } else {
        selectedTypes = pdfTypes;
    }

    const { assets, canceled } = await DocumentPicker.getDocumentAsync({
        type: selectedTypes,
        copyToCacheDirectory: true
    });

    if (canceled || !assets || assets.length === 0) return;

    const file = assets[0];
    const { name, mimeType } = file;

    //  const max_doc_pages = maxFileSizeMB * 1024 * 1024; // 5MB in bytes
    /* if (size && size > maxFileSizeBytes) {
         Alert.alert(
             "File Too Large",
             "The selected file exceeds the 5MB limit. Please choose a smaller file."
         );
         return;
     }
     */

    let isValid = mimeType ? selectedTypes.includes(mimeType) : false;

    // Fallback: check file extension if mimeType is missing
    if (!isValid && name) {
        const ext = name.split(".").pop()?.toLowerCase();
        isValid = ["pdf", "doc", "docx"].includes(ext ?? "");
    }

    if (!isValid) {
        Alert.alert(
            "Invalid File Type",
            "Please select a PDF or Word document (.pdf, .doc, .docx)"
        );
        return;
    }

    return file;
};

interface CategoryColor {
    primary: string;
    secondary: string;
}

export function getCategoryColors(categoryData: any): CategoryColor {
    let categoryId: number | null = null;
    let categoryKey: string = "";
    let categoryLabel: string = "";

    // Extract values
    if (typeof categoryData === "object" && categoryData !== null) {
        categoryId = categoryData?.id ?? null;
        categoryKey = categoryData?.key || "";
        categoryLabel = categoryData?.label || categoryData?.lable || "";
    } else if (typeof categoryData === "string") {
        categoryLabel = categoryData;
    }

    // 🎨 Define the fixed palette to pull from
    const palette: CategoryColor[] = [
        { primary: "#00695C", secondary: "#9CAF88" }, // Immigration
        { primary: "#4169E1", secondary: "#000080" }, // Employment
        { primary: "#FFBF00", secondary: "#FF5722" }, // Road Traffic
        { primary: "#800020", secondary: "#8B0000" }, // Family
    ];

    // ✅ 1. ID आधारित mapping (highest priority)
    const idMapping: Record<number, CategoryColor> = {
        1: palette[0],
        2: palette[1],
        3: palette[2],
        4: palette[3],
    };

    if (categoryId && idMapping[categoryId]) {
        return idMapping[categoryId];
    }

    // ✅ 2. KEY आधारित mapping
    const normalizeKey = (key: string) =>
        key.toLowerCase().replace(/_law|_offences/g, "");

    const keyMapping: Record<string, CategoryColor> = {
        immigration: palette[0],
        employment: palette[1],
        road_traffic: palette[2],
        family: palette[3],
    };

    const normalizedKey = normalizeKey(categoryKey);
    if (normalizedKey && keyMapping[normalizedKey]) {
        return keyMapping[normalizedKey];
    }

    // ✅ 3. LABEL fallback
    const labelMapping: Record<string, CategoryColor> = {
        "immigration law": palette[0],
        "employment law": palette[1],
        "family law": palette[3],
        "road traffic offences": palette[2],
    };

    const matchedLabelKey = Object.keys(labelMapping).find(
        k => k.toLowerCase() === categoryLabel.toLowerCase()
    );

    if (matchedLabelKey) {
        return labelMapping[matchedLabelKey];
    }

    // ✅ 4. RANDOM pick from the palette if no name/ID matched
    const randomIndex = Math.floor(Math.random() * palette.length);
    return palette[randomIndex];
}


export function getCategoryColorsOld(categoryData: any): CategoryColor {
    let categoryId: number | null = null;
    let categoryKey: string = "";
    let categoryLabel: string = "";

    // Extract values
    if (typeof categoryData === "object" && categoryData !== null) {
        categoryId = categoryData?.id ?? null;
        categoryKey = categoryData?.key || "";
        categoryLabel = categoryData?.label || categoryData?.lable || "";
    } else if (typeof categoryData === "string") {
        categoryLabel = categoryData;
    }

    // ✅ 1. ID आधारित mapping (highest priority)
    const idMapping: Record<number, CategoryColor> = {
        1: { primary: "#00695C", secondary: "#9CAF88" }, // Immigration
        2: { primary: "#4169E1", secondary: "#000080" }, // Employment
        3: { primary: "#FFBF00", secondary: "#FF5722" }, // Road Traffic
        4: { primary: "#800020", secondary: "#8B0000" }, // Family
    };

    if (categoryId && idMapping[categoryId]) {
        return idMapping[categoryId];
    }

    // ✅ 2. KEY आधारित mapping (handle both formats)
    const normalizeKey = (key: string) =>
        key.toLowerCase().replace(/_law|_offences/g, "");

    const keyMapping: Record<string, CategoryColor> = {
        immigration: { primary: "#00695C", secondary: "#9CAF88" },
        employment: { primary: "#4169E1", secondary: "#000080" },
        road_traffic: { primary: "#FFBF00", secondary: "#FF5722" },
        family: { primary: "#800020", secondary: "#8B0000" },
    };

    const normalizedKey = normalizeKey(categoryKey);

    if (normalizedKey && keyMapping[normalizedKey]) {
        return keyMapping[normalizedKey];
    }

    // ✅ 3. LABEL fallback (last option)
    const labelMapping: Record<string, CategoryColor> = {
        "immigration law": { primary: "#00695C", secondary: "#9CAF88" },
        "employment law": { primary: "#4169E1", secondary: "#000080" },
        "family law": { primary: "#800020", secondary: "#8B0000" },
        "road traffic offences": { primary: "#FFBF00", secondary: "#FF5722" },
    };

    const key = Object.keys(labelMapping).find(
        k => k.toLowerCase() === categoryLabel.toLowerCase()
    );

    return key
        ? labelMapping[key]
        : { primary: "#808080", secondary: "#A9A9A9" }; // default
}

export const showAlertView = (
    t: any,
    type: string,
    message: string = "",
    caseDetails: any,
    success: any,
    loader: any = null) => {

    let title, buttonLabel, buttonCancel;
    if (type === "accept") {
        title = t('accept');
        buttonLabel = t('accept');
        buttonCancel = t('cancel');

    } else if (type === "reject") {
        title = t('reject');
        buttonLabel = t('reject');
        buttonCancel = t('cancel');

    } else if (type === "delete") {
        title = "";
        buttonLabel = t('yes');
        buttonCancel = t('no');
    } else {
        title = "";
        buttonLabel = t('yes');
        buttonCancel = t('no');
    }

    showTwoButtonAlert({
        title: title,
        message: message,
        okLabel: buttonLabel,
        cancelLabel: buttonCancel,
        onOkPress: async () => {
            try {
                let response;
                const isAcceptReject = ["accept", "reject"].includes(type);

                if(type == "accept") {
                    loader(true);
                }
                // 🔥 API CALL
                if (isAcceptReject) {
                    response = await acceptRejectCase(
                        caseDetails.referral_id,
                        type === "accept"
                    );
                } else {
                    response = await userCancelRequest(
                        caseDetails.referral_id,
                        type
                    );
                }

                if (response) {
                    if (type === "accept") {
                        success?.(response);
                    } else {
                        success?.(response.message);
                    }
                }

            } catch (error: any) {

                if(type == "accept") {
                    loader(false);
                }

                const errorDetail = error?.response?.data?.detail;
                if (errorDetail) {
                    Alert.alert(
                        t("error.title"),
                        errorDetail || t("error.case_not_found") // localization
                    );

                } else {
                    Alert.alert(
                        t("common.error"),
                        t("common.something_wrong")
                    );
                }

            }


        },
        onCancelPress: () => {
            console.log("User cancelled");
        },
    }
    );

}

/*export const sendPushNotificationMessage = (title: string,
    message: string,
    type: string,
    pushToken: string,
    loginUserData: any,
    session_id = "") => {
    sendPushNotification(
        title,
        message,
        type,
        pushToken,
        "",
        loginUserData.id,
        loginUserData.first_name + " " + loginUserData.last_name,
        "",
        session_id
    )
}*/

export const getUserData = async () => {
    const userData = await AsyncStorage.getItem("auth_user");
    if (userData) {
        return JSON.parse(userData);
    } else {
        return null;
    }
}


export const getDailyPassOffering = async () => {
    try {
        const offerings = await Purchases.getOfferings();
        const offering = offerings.all["freemium_upsell"];

        if (offering) {
            return offering.availablePackages;
        }
    } catch (e) {
        console.error("Failed to load offerings", e);
    }
};


export const getOfferingList = async () => {
    const offerings = await Purchases.getOfferings();
    return offerings.all["default"];
}

export const getMarkdownStyles = (sender: string) => StyleSheet.create({
    body: {
        color: sender === "user" ? "#111" : "#2d2d2d",
        fontSize: 16,
        lineHeight: 26,
        //  marginBottom: 8,
    },

    heading1: { fontSize: 22, fontWeight: "700", marginTop: 12, marginBottom: 8 },
    heading2: { fontSize: 18, fontWeight: "600", marginTop: 10, marginBottom: 6 },
    heading3: { fontSize: 16, fontWeight: "600", marginTop: 8, marginBottom: 4 },

    bullet_list: { paddingLeft: 0, marginBottom: 6 },
    bullet_list_icon: { fontWeight: "bold", marginRight: 8, fontSize: 16 },
    bullet_list_nesting: { paddingLeft: 20 },

    // 🔥 Bold numbers in ordered lists
    ordered_list_icon: { fontWeight: "700", marginRight: 8, fontSize: 16 },

    list_item: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },

    code_inline: {
        backgroundColor: "#f6f6f6",
        borderWidth: 1,
        borderColor: "#e0e0e0",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontFamily: "monospace",
        fontSize: 14,
    },
    fence: {
        backgroundColor: "#E8F4FF", // light blue tint
        borderWidth: 1,
        borderColor: "#69AFFF",     // light blue border
        padding: 12,
        borderRadius: 12,
        marginVertical: 8,
    },

    code_block: {
        color: "#1A1A1A",
        fontSize: 15,
        lineHeight: 22,
    },
});

export const handleError = async (t: any, error: any) => {
    const errorData = error?.response?.data;

    let message = t('error.error_process_file');

    const errorDetail =
        errorData?.detail ??
        error?.detail ??
        errorData?.errors ??   // sometimes APIs use "errors"
        error?.message ??
        errorData;

    if (
        typeof errorDetail === "object" &&
        errorDetail !== null &&
        errorDetail?.type === "voice_limit_exceeded"
    ) {
        message = errorDetail?.message || message;
    }

    else if (
        typeof errorDetail === "object" &&
        errorDetail !== null &&
        errorDetail?.message
    ) {
        message = errorDetail.message;
    }

    else if (Array.isArray(errorDetail)) {
        message = errorDetail
            .map((err: any) => err?.msg || err?.message || JSON.stringify(err))
            .join('\n');
    } else if (typeof errorDetail === "string") {
        message = errorDetail;
    } else if (errorData?.message) {
        message = errorData.message;
    } else if (error?.message) {
        message = error.message;
    }

    Alert.alert(t('error.title'), message);
};


export const saveAuthData = async (token: any, userData: any) => {
    await AsyncStorage.setItem("auth_token", token);
    await AsyncStorage.setItem("auth_user", JSON.stringify(userData));
    setAuthToken(token)
    await CrashlyticsHelper.setUserContext(userData);
}

export const removeTokenData = async () => {
    await AsyncStorage.removeItem("auth_token");
    clearAuthToken();
    await CrashlyticsHelper.clearUserContext();
}

// export const handleOpenFile = async (fileUrl, fileName, fileType) => {

//     try {
//         let uri = fileUrl;


//         const getFileName = () => {
//             if (fileName) {
//                 return fileName.replace(/[^a-zA-Z0-9.]/g, "_");
//             }

//             // fallback → extract from URL
//             const urlParts = fileUrl.split("/");
//             const lastPart = urlParts[urlParts.length - 1];

//             if (lastPart.includes(".")) {
//                 return lastPart;
//             }

//             return `file_${Date.now()}.pdf`;
//         };

//         if (!fileUrl.startsWith("file://")) {
//             const safeFileName = getFileName();
//             const localPath = `${FileSystem.documentDirectory}${safeFileName}`;

//             const { uri: downloadedUri } = await FileSystem.downloadAsync(fileUrl, localPath);

//             uri = downloadedUri;
//         }


//         if (Platform.OS === "android") {
//             const contentUri = await FileSystem.getContentUriAsync(uri);

//             await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
//                 data: contentUri,
//                 type: "application/pdf",
//                 flags: 1,
//             });
//         } else {
//             // ✅ iOS fix
//             await FileViewer.open(uri, {
//                 showOpenWithDialog: true,
//             });
//         }

//     } catch (error) {
//         Linking.openURL(fileUrl);
//     }
// };

export const handleOpenFile = async (fileUrl: string, fileName: string, fileType: string) => {
    try {
        let uri = fileUrl;

        const getExtensionFromMime = (mime: string): string => {
            if (!mime) return "";
            if (mime.includes("pdf")) return ".pdf";
            if (mime.includes("wordprocessingml") || mime.includes("docx")) return ".docx";
            if (mime.includes("msword")) return ".doc";
            if (mime.includes("png")) return ".png";
            if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
            if (mime.includes("gif")) return ".gif";
            if (mime.includes("mp4")) return ".mp4";
            if (mime.includes("mp3")) return ".mp3";
            return "";
        };

        const getFileName = (): string => {
            // 1. Try extracting from URL — check if it has a valid extension
            const urlParts = fileUrl.split("/");
            const lastPart = decodeURIComponent(urlParts[urlParts.length - 1]).split("?")[0]; // strip query params

            if (fileName) {
                const safeName = fileName
                    .replace(/[\\/:*?"<>|#%{}^~[\]`]/g, "_")
                    .trim();
                // Ensure it has an extension
                if (safeName.includes(".")) return safeName;
                return `${safeName}${getExtensionFromMime(fileType)}`;
            }

            if (lastPart.includes(".")) return lastPart;

            // fallback — use mime type to assign extension
            const ext = getExtensionFromMime(fileType);
            return `file_${Date.now()}${ext}`;
        };

        // Always download remote files afresh. Presigned URLs can point to a
        // refreshed file with the same filename, so reusing a persistent local
        // filename can open an earlier failed/expired download instead.
        if (!fileUrl.startsWith("file://") && !fileUrl.startsWith("content://")) {
            const cacheDirectory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
            if (!cacheDirectory) {
                throw new Error("No temporary directory is available for this document");
            }

            const safeFileName = getFileName();
            const uniqueFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeFileName}`;
            const localPath = `${cacheDirectory}${uniqueFileName}`;
            const download = await FileSystem.downloadAsync(fileUrl, localPath);

            if (download.status < 200 || download.status >= 300) {
                await FileSystem.deleteAsync(download.uri, {idempotent: true});
                throw new Error(`Document download failed with status ${download.status}`);
            }

            uri = download.uri;
        }

        if (Platform.OS === "android") {
            const contentUri = await FileSystem.getContentUriAsync(uri);
            await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
                data: contentUri,
                type: fileType || "application/octet-stream",
                flags: 1,
            });
        } else {
            // ✅ iOS — pass displayName and mimeType hint
            await FileViewer.open(uri, {
                showOpenWithDialog: true,
                displayName: getFileName(),  // helps iOS pick the right app
            });
        }
    } catch (error) {
        console.error("handleOpenFile error:", error);
        // fallback → open in browser
        Linking.openURL(fileUrl);
    }
};

export const isProUser = async (): Promise<boolean> => {
    const userType = await AsyncStorage.getItem("user_type");

    if (!userType) return false;

    const proTypes = [
        ProTypes.LAWYER,
        ProTypes.LAW_FIRM,
        ProTypes.HR_LEGAL,
        ProTypes.A2J_PARTNERS,
    ];

    return proTypes.includes(userType as ProTypes);
};

export const saveConsultationSession = async (session_id: string, referral_id: string) => {
    try {
        const data = {
            session_id,
            referral_id,
        };

        await AsyncStorage.setItem("ACTIVE_CONSULTATION", JSON.stringify(data));
        console.log("✅ Session saved");

    } catch (e) {
        console.log("Save session error", e);
    }
};

export const getConsultationSession = async () => {
    try {
        const data = await AsyncStorage.getItem("ACTIVE_CONSULTATION");

        if (!data) return null;

        return JSON.parse(data);

    } catch (e) {
        console.log("Get session error", e);
        return null;
    }
};

export const clearConsultationSession = async () => {
    try {
        await AsyncStorage.removeItem("ACTIVE_CONSULTATION");
        console.log("🗑 Session cleared");
    } catch (e) {
        console.log("Clear session error", e);
    }
};

export const getSanitizedFileName = (fileName = "file") => {
    // Split name and extension
    const lastDotIndex = fileName.lastIndexOf(".");

    let name = fileName;
    let extension = "";

    if (lastDotIndex !== -1) {
        name = fileName.substring(0, lastDotIndex);
        extension = fileName.substring(lastDotIndex);
    }

    // Clean file name
    const cleanedName = name
        .trim()
        .replace(/\s+/g, "_")           // spaces → _
        .replace(/["']/g, "")           // remove quotes
        .replace(/[^a-zA-Z0-9_-]/g, ""); // remove special chars

    return `${cleanedName || "file"}${extension}`;
};

import MessageService from "./MessageServices";
import * as FileSystem from "expo-file-system/legacy";
import InboxServices from "@/services/InboxServices";
import { getFileTypeFromMime } from "@/constants/Utility";
import NotificationService from "@/services/NotificationService";
import { Platform } from "react-native";
import * as Device from "expo-device";
import Analytics from "@/helpers/AnalyticsHelper";
import ConsultationService from "@/services/ConsultationService";
import Constants from "expo-constants";

export const fetchChatHistoryData = async (id: any, success: any, error: any) => {

    try {

        const response = await MessageService.GetChatHistory(id)

        if (response.messages !== undefined) {
            const formattedMessages: any = response.messages.map((msg: any) => {

                let finalSender: "user" | "assistant" = "assistant";
                if (msg.role === "user") {
                    finalSender = "user";
                }

                let can_receive_feedback = false;
                if (msg.metadata) {
                    can_receive_feedback = msg?.metadata?.can_receive_feedback || false
                }

                const feedbackItem = msg?.feedback || null;

                return {
                    id: msg.id,
                    content: msg.content,
                    sender: finalSender,
                    role: msg.role,
                    timestamp: msg.timestamp,
                    canReceiveFeedback: can_receive_feedback,
                    feedbackType: feedbackItem ? feedbackItem.feedback_type : "",
                    feedbackId: feedbackItem ? feedbackItem.feedback_id : "",
                    messageIndex: msg.message_index,
                    image_url: msg?.image_url,
                    image_analysis_type: msg?.image_analysis_type,
                    source_type: msg?.source_type
                };
            });

            if (success) {
                await success(formattedMessages)
            }
        } else {
            if (error) {
                error("No chat history data received")
            }
        }

    } catch (e) {

        if (error) {
            error(e)
        }
    }

}

export const submitFeedbackCall = async (
  id: any,
  msg: any,
  type: any,
  reason = "",
  otherReason = "",
  selectedIndex = 0,
  success: any,
  error: any,
) => {
  try {
    let feedbackData: any = {
      conversation_id: id,
      message_index: msg?.messageIndex ?? selectedIndex,
      feedback_type: type,
      response_content: msg.content,
      user_question: "",
    };

    if (reason !== "") {
      feedbackData = {
        ...feedbackData,
        thumbs_down_reason: reason,
        user_question: otherReason ? otherReason : "",
      };
    }

    let result = await MessageService.sendChatFeedback(
      JSON.stringify(feedbackData),
    );

    if (result.message) {
      if (success) {
        success(result?.id || "");
      }
    } else {
      if (error) {
        error(result);
      }
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  }
};

export const getChatHistory = async (success: any, error: any) => {
  try {
    let result = await MessageService.GetChatAllHistory();

    if (result.conversations) {
      if (success) {
        success(result.conversations || []);
      }
    } else {
      if (error) {
        error(result);
      }
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  }
};

export const deleteChatFeedbackApi = async (
  id: any,
  success: any,
  error: any,
) => {
  try {
    let result = await MessageService.deleteChatFeedback(id);

    if (result.message) {
      if (success) {
        success();
      }
    } else {
      if (error) {
        error(result);
      }
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  }
};

export const getFeedbackReasonsDataList = async () => {
  try {
    const response = await MessageService.getFeedbackReasons();

    return response?.reasons || [];
  } catch {
    return [];
  }
};

export const getChatSingleMessageData = async (
  compressedChats: any,
  id: any,
  detected_language = "en",
  success: any,
  error: any,
) => {
  try {
    const response = await MessageService.GetChatStream(
      compressedChats,
      id,
      detected_language,
    );

    if (!response.ok) {
      let errorDetail;
      try {
        const errorData = await response.json();
        errorDetail = errorData?.toString() || JSON.stringify(errorData);
      } catch (parseError) {
        errorDetail = await response.text();
      }
      if (error) {
        await error(response.status, errorDetail);
      }
      return;
    }

    if (success) {
      await success(response);
    }
  } catch (e) {
    if (error) {
      await error("Error", e?.toString());
    }
  }
};

export const postChatMessageWithFile = async (
  compressedChats: any,
  id: any,
  detected_language = "en",
  fileUri: any,
  mimeType = "",
  docName = "",
  success: any,
  error: any,
) => {
  try {
    const formData = new FormData();
    formData.append("chats", compressedChats);
    formData.append("conversation_id", id);
    formData.append("detected_language", detected_language);
    formData.append("source_type", docName.split(".").pop() || "pdf");

    if (mimeType !== "") {
      formData.append("file", {
        uri: fileUri,
        name: docName,
        type: mimeType,
      } as any);
    } else {
      const localUri = fileUri;
      const filename = localUri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename || "");
      const type = match ? `image/${match[1]}` : "image";

      formData.append("file", { uri: localUri, name: filename, type } as any);
    }

    const response = await MessageService.postChatStreamWithFile(formData);

    if (!response.ok) {
      let errorDetail;
      try {
        const errorData = await response.json();
        errorDetail = errorData?.toString() || JSON.stringify(errorData);
      } catch (parseError) {
        errorDetail = await response.text();
      }
      if (error) {
        await error(response.status, errorDetail);
      }
      return;
    }

    if (success) {
      await success(response);
    }
  } catch (e: any) {
    const errorDetail = e?.response?.data?.detail;
    let message = "";

    if (Array.isArray(errorDetail)) {
      message = errorDetail[0]?.msg ?? message;
    } else if (typeof errorDetail === "string") {
      message = errorDetail;
    }

    if (error) {
      await error("Error", message);
    }
  }
};

export const getAudioToTextApi = async (
  uri: any,
  languageCode: any,
  success: any,
  error: any,
  next: any,
) => {
  try {
    let base64Audio = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (base64Audio.startsWith("data:")) {
      base64Audio = base64Audio.split(",")[1];
    }

    const requestBody = {
      audio_data: base64Audio,
      language: languageCode,
    };

    const response = await MessageService.SendAudioMessage(
      JSON.stringify(requestBody),
    );

    if (response.text) {
      if (success) {
        success(response.text);
      }
    } else {
      if (error) {
        error();
      }
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  } finally {
    if (next) {
      next();
    }
  }
};

export const startReferralFlow = async (
  conversationId: String,
  stepText: String,
  responseText: String,
  isBack: boolean = false,
  consultationType?: string | null,
) => {
  try {
    const requestBody: Record<string, unknown> = {
      conversation_id: conversationId,
      step: stepText,
      response: responseText,
      back: isBack,
    };

    if (responseText !== "") {
      requestBody.response = responseText;
    }

    if (consultationType) {
      requestBody.consultation_type = consultationType;
    }

    const response = await MessageService.startFlow(
      JSON.stringify(requestBody),
    );
    if (response == null) {
      console.warn(
        "[startReferralFlow] Empty response from referral/start_flow",
        {
          conversationId,
          step: stepText,
          response: responseText,
          back: isBack,
          consultationType: consultationType ?? null,
        },
      );
    }
    return response;
  } catch (e: any) {
    // Interceptor usually rejects with response.data only; empty 500 bodies yield the full AxiosError
    return null;
  }
};

export const getActiveReferralFlow = async (conversationId: string) => {
  try {
    if (!conversationId) return null;
    return await MessageService.getActiveReferralFlow(conversationId);
  } catch (e: any) {
    return null;
  }
};

export const selectLawyer = async (
  userDetails: any,
  success: any,
  error: any,
  next: any,
) => {
  try {
    let requestBody = {
      selected_lawyer_id: userDetails.id,
      referral_id: userDetails.referral_id,
      booking_start_at: userDetails.booking_start_at,
      booking_timezone: userDetails.booking_timezone,
    };

    const response = await MessageService.selectLawyer(
      JSON.stringify(requestBody),
    );

    if (response) {
      if (success) {
        success(response);
      }
    } else {
      if (error) {
        error();
      }
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  } finally {
    if (next) {
      next();
    }
  }
};

export const referralUploadVoice = async (
  id: string,
  uri: string,
  languageCode: string,
) => {
  try {
    let base64Audio = await FileSystem.readAsStringAsync(uri, {
      encoding: "base64",
    });

    if (base64Audio.startsWith("data:")) {
      base64Audio = base64Audio.split(",")[1];
    }

    const fileInfo = await FileSystem.getInfoAsync(uri);

    let fileSizeMB = 0;
    if (fileInfo.exists) {
      const fileSizeBytes = fileInfo.size || 0;
      //  const fileSizeKB = fileSizeBytes / 1024;
      fileSizeMB = fileSizeBytes / (1024 * 1024);
    }

    const requestBody = {
      conversation_id: id,
      audio_data: base64Audio,
      language: languageCode,
    };

    const response = await MessageService.recordVoice(
      JSON.stringify(requestBody),
    );

    Analytics.voiceNoteUploaded({
      duration: fileSizeMB,
      language: languageCode,
    });

    return response;
  } catch (e) {
    throw e;

    // if (e.response) {
    //     // The server responded with a status code outside the 2xx range (like your 400)
    //     const apiError = e.response.data; // This is where your 'monthly_cap_exceeded' lives

    //     //    console.log("Detailed API Error:", apiError);

    //     if (error) {
    //         error(apiError); // Pass the JSON body (error, message, suggestions) to the callback
    //     }
    // } else if (e.request) {
    //     // The request was made but no response was received
    //     if (error) error({ message: "No response from server" });
    // } else {
    //     // Something happened in setting up the request
    //     if (error) error(e);
    // }
  }
  // finally {

  //     if (next) {
  //         next();
  //     }

  // }
};

export const referralUploadFile = async (id: string, documents: any) => {
  try {
    const formData = new FormData();
    formData.append("conversation_id", id);
    // formData.append("file_type", fileType);
    // formData.append("file_name", name || filename || "test.pdf");

    documents.forEach((element: any) => {
      const name = element.name;
      const mimeType = element.mimeType;
      const uri = element.uri;

      let fileType = getFileTypeFromMime(mimeType);

      const localUri = uri;
      const filename = name || localUri.split("/").pop();
      let dataType;

      if (mimeType !== "") {
        dataType = mimeType;
      } else {
        const match = /\.(\w+)$/.exec(filename || "");
        dataType = match ? `image/${match[1]}` : "image/*";
      }

      if (fileType === "image") {
        Analytics.imageUploaded({
          fileType: fileType,
        });
      } else {
        Analytics.documentUploaded({
          fileType: fileType,
        });
      }

      const cleanUri =
        Platform.OS === "android" && !localUri.startsWith("file://")
          ? `file://${localUri}`
          : localUri;

      formData.append("file", {
        uri: cleanUri,
        name: filename,
        type: dataType,
      } as any);
    });

    return await MessageService.uploadFile(formData);
  } catch (e: any) {
    let errorData;
    if (e.response) {
      // The server responded with a status (400, 401, 500, etc.)
      // We throw the specific data (e.g., { error: 'monthly_cap_exceeded', ... })
      errorData = e.response.data;
    } else if (e.request) {
      // The request was made but no response was received (Network issue)
      errorData = {
        message: "No response from server. Please check your connection.",
      };
    } else {
      // Something went wrong setting up the request
      errorData = { message: e.message || "An unexpected error occurred" };
    }

    // Throw the error so the calling function can catch it
    throw errorData;
  }
};

export const refreshLawyerRecommendations = async (
  referralId: string,
  currentLawyerIds: string[] = [],
) => {
  try {
    const requestBody = {
      referral_id: referralId,
      current_lawyer_ids: currentLawyerIds,
    };

    return await MessageService.refreshLawyers(JSON.stringify(requestBody));
  } catch (e: any) {
    return null;
  }
};

export const getUserCaseList = async (success: any, error: any, next: any) => {
  try {
    const response = await InboxServices.getUserCaseList();

    if (response) {
      if (success) {
        success(response);
      }
    } else {
      if (error) {
        error();
      }
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  } finally {
    if (next) {
      next();
    }
  }
};

export const getLawyerCaseList = async (
  isActive: boolean,
  success: any,
  error: any,
  next: any,
) => {
  try {
    let response: null;

    if (isActive) {
      response = await InboxServices.getLawyerActiveCaseList();
    } else {
      response = await InboxServices.getLawyerPendingCaseList();
    }

    if (response) {
      if (success) {
        success(response);
      }
    } else {
      if (error) {
        error();
      }
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  } finally {
    if (next) {
      next();
    }
  }
};

export const getLawyerCaseDetails = async (
  referral_id: string,
  success: any,
  error: any,
  next: any,
) => {
  try {
    const response = await InboxServices.getLawyerCaseDetails(referral_id);

    if (response) {
      if (success) {
        success(response);
      }
    } else {
      if (error) {
        error();
      }
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  } finally {
    if (next) {
      next();
    }
  }
};

export const getUserCaseDetails = async (
  referral_id: string,
  success: any,
  error: any,
  next: any,
) => {
  try {
    const response = await InboxServices.getUserCaseDetails(referral_id);
    if (response) {
      if (success) {
        success(response);
      }
    } else {
      if (error) {
        error();
      }
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  } finally {
    if (next) {
      next();
    }
  }
};

export const getUserTextMessageList = async (
  referral_id: string,
  success: any,
  error: any,
) => {
  try {
    const response = await InboxServices.getUserTextMessage(referral_id);

    if (response) {
      if (success) {
        success(response);
      }
    } else {
      if (error) {
        error();
      }
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  }
};

export const sentUserTextMessage = async (
  referral_id: string,
  data: any,
  success: any,
  error: any,
) => {
  try {
    const response = await InboxServices.sendUserTextMessage(referral_id, data);
    if (response) {
      if (success) {
        success(response);
      }
    } else {
      if (error) {
        error();
      }
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  }
};

export const getLawyerTextMessageList = async (
  referral_id: string,
  success: any,
  error: any,
) => {
  try {
    const response = await InboxServices.getLawyerTextMessage(referral_id);
    if (response) {
      if (success) {
        success(response);
      }
    } else {
      if (error) {
        error();
      }
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  }
};

export const sentLawyerTextMessage = async (
  referral_id: string,
  data: any,
  success: any,
  error: any,
) => {
  try {
    const response = await InboxServices.sendLawyerTextMessage(
      referral_id,
      data,
    );
    if (response) {
      if (success) {
        success(response);
      }
    } else {
      if (error) {
        error();
      }
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  }
};

export const acceptRejectCase = async (referral_id: string, accepted: boolean) => {
  try {
    const requestBody = {
      referral_id,
      action: accepted ? "accept" : "reject",
    };

    return await InboxServices.acceptRejectRequest(requestBody);
  } catch (e) {
    throw e;
  }
};

export const userCancelRequest = async (referral_id: string, type: string) => {
  try {
    if (type === "delete") {
      return await InboxServices.userDeleteRequest(referral_id);
    }

    const requestBody = {
      cancellation_reason: type === "withdraw" ? "Withdrawn by user" : "Cancelled by user",
    };

    return await InboxServices.userCancelRequest(referral_id, requestBody);
  } catch (e) {
    throw e;
  }
};

export const sentFileMessage = async (
  referral_id: string,
  fileUri: any,
  isProUser: boolean,
  success: any,
  error: any,
  next: any,
  mimeType = "",
  docName = "",
) => {
  const formData = new FormData();

  if (mimeType !== "") {
    formData.append("file", {
      uri: fileUri,
      name: docName,
      type: mimeType,
    } as any);
  } else {
    const localUri = fileUri;
    const filename = localUri.split("/").pop();
    const match = /\.(\w+)$/.exec(filename || "");
    const type = match ? `image/${match[1]}` : "image";

    formData.append("file", { uri: localUri, name: filename, type } as any);
  }

  try {
    let response;

    if (isProUser) {
      response = await InboxServices.sendLawyerMessage(referral_id, formData);
    } else {
      response = await InboxServices.sendUserMessage(referral_id, formData);
    }

    if (response) {
      if (success) {
        success(response);
      }
    } else {
      if (error) {
        error();
      }
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  } finally {
    if (next) {
      next();
    }
  }
};

export const searchProfessionalList = async (
  userType: string,
  services: string,
  area: string,
  sort: string,
  page: number,
  limit: number,
  success: any,
  error: any,
  randomSeed?: string,
) => {
  try {
    const response = await MessageService.searchProfessionalListData(
      userType,
      services,
      area,
      sort || "random",
      page,
      limit,
      randomSeed,
    );
    if (response !== undefined) {
      if (success) {
        success(response);
      }
    } else {
      if (error) {
        error("No professional list data available");
      }
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  }
};

export const professionalUserDetails = async (
  id: string,
  success: any,
  error: any,
) => {
  try {
    const response = await MessageService.professionalUserDetails(id);
    if (response !== undefined) {
      if (success && response.professional) {
        success(response.professional);
      } else {
        if (error) {
          error("No professional list data available");
        }
      }
    } else {
      if (error) {
        error("No professional list data available");
      }
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  }
};

export const professionalBookingSlots = async (
  id: string,
  fromAt: string,
  toAt: string,
  consultationType: string,
  success: any,
  error: any,
) => {
  try {
    const response = await MessageService.professionalBookingSlots(
      id,
      fromAt,
      toAt,
      consultationType,
    );
    if (response !== undefined) {
      if (success) {
        success(response);
      }
    } else if (error) {
      error("No booking slots available");
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  }
};

export const getMyAvailability = async (success: any, error: any) => {
  try {
    const response = await MessageService.getMyAvailability();
    if (response !== undefined) {
      success?.(response);
    } else {
      error?.("No availability data available");
    }
  } catch (e) {
    error?.(e);
  }
};

export const updateMyAvailability = async (
  payload: any,
  success: any,
  error: any,
) => {
  try {
    const response = await MessageService.updateMyAvailability(payload);
    if (response !== undefined) {
      success?.(response);
    } else {
      error?.();
    }
  } catch (e) {
    error?.(e);
  }
};

export const updateMyPresence = async (
  payload: any,
  success: any,
  error: any,
) => {
  try {
    const response = await MessageService.updateMyPresence(payload);
    if (response !== undefined) {
      success?.(response);
    } else {
      error?.();
    }
  } catch (e) {
    error?.(e);
  }
};

export const requestService = async (
  lawyerId: string,
  formData: any,
  success: any,
  error: any,
) => {
  try {
    const response = await MessageService.requestService(lawyerId, formData);

    if (response) {
      if (success) {
        success(response);
      }
    } else {
      if (error) {
        error();
      }
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  }
};

export const deleteReview = async (
  reviewId: string,
  success: any,
  error: any,
) => {
  try {
    const response = await MessageService.deleteReviews(reviewId);

    if (response) {
      if (success) {
        success(response);
      }
    } else {
      if (error) {
        error();
      }
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  }
};

export const postReview = async (
  lawyerId: string,
  reviewText: string,
  reviewer_name: string,
  rating: number,
  success: any,
  error: any,
) => {
  try {
    let body = {
      review_text: reviewText,
      reviewer_name: reviewer_name,
      rating: rating,
    };

    const response = await MessageService.postReviews(lawyerId, body);

    if (response) {
      if (success) {
        success(response);
      }
    } else {
      if (error) {
        error();
      }
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  }
};

export const getMyReviews = async (success: any, error: any) => {
  try {
    const response = await MessageService.getMyReviews();

    if (response) {
      if (success) {
        success(response);
      }
    } else {
      if (error) {
        error();
      }
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  }
};

export const registerDevice = async (
  device_token: string,
  success: any,
  error: any,
) => {
  let payload = {
    device_token: device_token,
    device_type: Platform.OS,
    device_name: Device.deviceName,
    app_version: Constants.expoConfig?.version,
  };

  try {
    let result = await NotificationService.registerDevice(payload);

    if (result) {
      if (success) {
        success(result);
      }
    } else {
      if (error) {
        error(result);
      }
    }
  } catch (e) {
    if (error) {
      error(e);
    }
  }
};

type SuccessCallback<T = any> = (result: T) => void;
type ErrorCallback = (error: unknown) => void;

export const unRegisterDevice = async (
  device_token: string,
  onSuccess?: SuccessCallback,
  onError?: ErrorCallback,
): Promise<void> => {
  if (!device_token) {
    console.warn("unRegisterDevice: device_token is empty, skipping");
    return;
  }

  const payload = { device_token };

  try {
    const result = await NotificationService.unRegisterDevice(payload);
    if (result) {
      onSuccess?.(result);
    } else {
      console.warn("unRegisterDevice: empty response");
      onError?.(new Error("Empty response from unRegisterDevice"));
    }
  } catch (e) {
    console.error("unRegisterDevice failed:", e);
    onError?.(e);
  }
};

export const deleteDevice = async (
  onSuccess?: SuccessCallback,
  onError?: ErrorCallback,
): Promise<void> => {
  const deviceName = Device.deviceName;

  if (!deviceName) {
    console.warn("deleteDevice: deviceName is null, skipping");
    return;
  }

  try {
    const result = await NotificationService.deleteDevice(deviceName);
    if (result) {
      onSuccess?.(result);
    } else {
      console.warn("deleteDevice: empty response");
      onError?.(new Error("Empty response from deleteDevice"));
    }
  } catch (e) {
    console.error("deleteDevice failed:", e);
    onError?.(e);
  }
};

export const getNotificationsList = async (unreadOnly = false) => {
  try {
    let response = await NotificationService.getNotificationsList(unreadOnly);

    if (response) {
      return response;
    }
  } catch (error) {
    console.error("Error fetching notifications list:", error);
    throw error;
  }
};

export const markNotificationsRead = async (body: {
  notification_ids: string[];
}) => {
  try {
    const response = await NotificationService.markNotificationsRead(body);
    if (response) {
      return response;
    }
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    throw error;
  }
};

export const extendTimerAPI = async (sessionId: string, minutes: number) => {
  try {
    const payload = { extend_minutes: minutes };
    const response = await ConsultationService.ExtendTimer(sessionId, payload);

    if (response) {
      return response;
    }
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    throw error;
  }
};

export const getServiceBudget = async (service_id: string) => {
  try {
    const response = await MessageService.getCaseworkServiceBudget(service_id);

    if (response) {
      return response;
    } else {
      return [];
    }
  } catch (e) {
    return [];
  }
};

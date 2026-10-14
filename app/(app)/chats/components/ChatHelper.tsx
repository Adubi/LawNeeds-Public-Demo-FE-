import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import {Alert} from "react-native";
import {marked} from "marked";
import * as FileSystem from "expo-file-system/legacy";
import {getUserData} from "@/constants/Utility";
import Analytics from "@/helpers/AnalyticsHelper";

export type Message = {
    id: string;
    content: string;
    sender: "user" | "assistant";
    role: "user" | "assistant";
    timestamp: string;
    canReceiveFeedback?: boolean;
    feedbackType?: string;
    feedbackId?: string;
    messageIndex?: number;
    isReferralSuccess?: boolean
    referralSuccess?: string
    image_url?: string | null;
    image_analysis_type?: string;
    source_type?: string;
    description?: string;
    verification?: string;
    audio_url?: string;
    source_name?: string;
    fileName?: string;
    metadata?: {
        file_url?: string;
        file_type?: string;
        file_name?: string;
        file_size?: number;
    };
};

export const showIntroMessageLikeStream = async (
    isDisplayTyping = false,
    dataObj: any,
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
) => {

    if (isDisplayTyping) {
        setMessages((prev) => prev.filter(msg => msg.id !== "typing-indicator"));
    }

    const tokens = [];

    for (const parsedData of dataObj.content) {
        try {
            if (parsedData.type === "token" && parsedData.content) {
                tokens.push(parsedData.content);
            }
        } catch (err) {
            console.error("❌ Error parsing line:", parsedData, err);
        }
    }


    let currentContent = "";
    let messageId = dataObj.id;

    for (let i = 0; i < tokens.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 30ms per token

        const token = tokens[i];
        currentContent += token;

        // Update the current or new message
        setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.sender === "assistant") {
                return [
                    ...prev.slice(0, -1),
                    {
                        ...lastMsg,
                        content: currentContent,
                        sender: "assistant",
                        timestamp: new Date().toISOString(),
                        id: messageId,
                    },
                ];
            } else {
                return [
                    ...prev,
                    {
                        id: messageId,
                        content: currentContent,
                        sender: "assistant",
                        role: "assistant",
                        timestamp: new Date().toISOString(),
                    },
                ];
            }
        });
    }

}

export const parseResponseNewChatStreamData = async (
    response: any,
    isDisplayTyping = false,
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    endConversationCallBack: any,
    referralDetectionCallBack: any
) => {

    if (!response?.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";
    let referralDetected = null;
    let endData = null;

    // Real-time message assembly
    let currentContent = "";
    const messageId = Date.now().toString();

    let lastUpdate = Date.now();
    const UPDATE_INTERVAL = 50; // ms
    let typingIndicatorRemoved = false;

    const updateMessage = () => {

        if (isDisplayTyping && !typingIndicatorRemoved && currentContent.length > 0) {
            setMessages(prev => prev.filter(msg => msg.id !== "typing-indicator"));
            typingIndicatorRemoved = true;
        }

        setMessages(prev => {
            if (!currentContent.trim())
                return prev;
            const last = prev[prev.length - 1];
            if (last?.sender === "assistant") {
                return [...prev.slice(0, -1),
                    {...last, content: currentContent}
                ];
            }
            return [...prev, {
                id: messageId,
                sender: "assistant",
                role: "assistant",
                content: currentContent,
                timestamp: new Date().toISOString(),
            }];
        });
    };

    const applyFeedbackFromEnd = (data: any) => {
        if (!data?.can_receive_feedback) {
            return;
        }

        updateMessage();
        setMessages(prev => {
            const last = prev[prev.length - 1];

            if (last?.sender === "assistant") {
                return [
                    ...prev.slice(0, -1),
                    {
                        ...last,
                        content: currentContent,
                        canReceiveFeedback: true,
                        feedbackType: last.feedbackType || "",
                        feedbackId: last.feedbackId || "",
                        messageIndex: data.message_index || 0,
                    }
                ];
            }

            return prev;
        });
    };

    try {
        while (true) {
            const {value, done} = await reader.read();
            if (done) break;

            const chunkText = decoder.decode(value, {stream: true});
            buffer += chunkText;
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() ?? "";

            for (const rawLine of lines) {
                const line = rawLine.trim();
                if (!line || !line.startsWith("data:")) continue;
                const jsonString = line.replace("data:", "").trim();
                let parsed: any;
                try {
                    parsed = JSON.parse(jsonString);
                } catch {
                    continue;
                }

                switch (parsed.type) {
                    case "status":
                        // Optional: can show loading text if needed
                        break;

                    case "token":
                        if (parsed.content !== undefined) {
                            currentContent += parsed.content;

                            if (Date.now() - lastUpdate > UPDATE_INTERVAL) {
                                updateMessage(); lastUpdate = Date.now();
                            }
                        }
                        break;

                    case "referral_detected":
                        referralDetected = parsed;
                        break;

                    case "end":
                        endData = parsed;
                        applyFeedbackFromEnd(parsed);
                        break;

                    default:
                        break;
                }
            }
        }

        if (buffer) {
            const line = buffer.trim();
            if (line.startsWith("data:")) {
                try {
                    const jsonString = line.replace("data:", "").trim();
                    const parsed = JSON.parse(jsonString);

                    if (parsed.type === "token" && parsed.content) {
                        currentContent += parsed.content;
                    } else if (parsed.type === "end") {
                        endData = parsed;
                        applyFeedbackFromEnd(parsed);
                    } else if (parsed.type === "referral_detected") {
                        referralDetected = parsed;
                    }
                } catch (e) {
                    console.warn("Final buffer parse error:", e);
                }
            }
        }

        // Final UI update
        updateMessage();

    } catch {
        // silent fail-safe – do not break UI
    }

    // Handle referral callback
    if (referralDetected && referralDetectionCallBack) {
        referralDetectionCallBack();
    }

    // Handle conversation end
    if (endData?.conversation_id) {

        applyFeedbackFromEnd(endData);

        const conversationId = endData.conversation_id;
        endConversationCallBack?.(conversationId);
        let oldId = await AsyncStorage.getItem("conversation_id");
        if (oldId !== conversationId) {
            chatSessionDetailIndo(conversationId);
        }

        await AsyncStorage.setItem("conversation_id", conversationId);
        await AsyncStorage.setItem("last_conversation_id", conversationId);
    }
};

const chatSessionDetailIndo = async (sessionId: string) => {
    let userData = await getUserData();
    let userType = userData.professional_type ? userData.professional_type : "user";
    Analytics.chatSessionStarted({
        userType:userType,
        sessionId: sessionId})
}

export const parseResponseStreamData = async (
    response: any,
    isDisplayTyping = false,
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    endConversation: any) => {

    if (!response?.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";
    let endData = null;

    // Real-time message assembly
    let currentContent = "";
    const messageId = Date.now().toString();

    // Remove typing indicator
    if (isDisplayTyping) {
        setMessages(prev =>
            prev.filter(msg => msg.id !== "typing-indicator")
        );
    }

    const applyFeedbackFromEnd = (data: any) => {
        if (!data?.can_receive_feedback) {
            return;
        }

        setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.sender === "assistant") {
                return [
                    ...prev.slice(0, -1),
                    {
                        ...lastMsg,
                        content: currentContent,
                        canReceiveFeedback: true,
                        feedbackType: lastMsg.feedbackType || "",
                        feedbackId: lastMsg.feedbackId || "",
                        messageIndex: data.message_index || 0,
                    },
                ];
            }
            return prev;
        });
    };

    try {
        while (true) {
            const {value, done} = await reader.read();
            if (done) break;

            const chunkText = decoder.decode(value, {stream: true});
            buffer += chunkText;

            const lines = buffer.split("\n");
            buffer = lines.pop() ?? ""; // Keep partial line for next chunk

            for (const rawLine of lines) {
                const line = rawLine.trim();
                if (!line || !line.startsWith("data:")) continue;

                const jsonString = line.replace("data:", "").trim();
                let parsed: any = null;

                try {
                    parsed = JSON.parse(jsonString);
                } catch {
                    continue; // skip invalid JSON lines
                }

                switch (parsed.type) {
                    case "status":
                        // Optional: can show loading text if needed
                        break;

                    case "token":
                        if (parsed.content !== undefined) {
                            currentContent += parsed.content;

                            setMessages(prev => {
                                const last = prev[prev.length - 1];

                                if (last?.sender === "assistant") {
                                    return [
                                        ...prev.slice(0, -1),
                                        {...last, content: currentContent}
                                    ];
                                }

                                return [
                                    ...prev,
                                    {
                                        id: messageId,
                                        sender: "assistant",
                                        role: "assistant",
                                        content: currentContent,
                                        timestamp: new Date().toISOString(),
                                    }
                                ];
                            });
                        }
                        break;

                    case "end":
                        endData = parsed;
                        applyFeedbackFromEnd(parsed);
                        break;

                    default:
                        break;
                }
            }
        }
    } catch {
        // silent fail-safe – do not break UI
    }

    // --- End block handling ---
    if (endData?.conversation_id) {

        applyFeedbackFromEnd(endData);

        const conversationId = endData.conversation_id;

        if (endConversation) {
            endConversation(conversationId);
        }

        await AsyncStorage.setItem("conversation_id", conversationId);
        await AsyncStorage.setItem("last_conversation_id", conversationId);

        /*const conversationTitle = (chatHistory?.[0]?.content || "").slice(0, 30) + "...";
        await saveConversation(conversationId, conversationTitle);*/

    }

    const calculateVoiceDeduction = (seconds: number) => {
        const minutes = Math.ceil(seconds / 60);
        return Math.min(minutes, 5);
    }

    const validateUpload = (file: any, pageCount: number, isPremium = false) => {
        const maxSizeMB = isPremium ? 50 : 25;
        const maxPages = isPremium ? 25 : 8;
        const fileSizeMB = file.size / (1024 * 1024);

        if (fileSizeMB > maxSizeMB) {
            return {valid: false, error: `File exceeds ${maxSizeMB}MB limit.`};
        }
        if (pageCount > maxPages) {
            return {
                valid: false,
                error: "This document exceeds our page limit. Please split it into smaller parts and upload separately. Each upload deducts 1 minute." // [cite: 24]
            };
        }
        return {valid: true, deduction: 1}; // [cite: 19]
    }

    const getAIDocDeduction = (pages: number) => {
        if (pages <= 2) return 2;
        if (pages <= 5) return 4;
        if (pages <= 10) return 6;
        return 6; // Cap or handled by validation
    }

    const shouldShowUpgradePrompt = (used: number, total: number) => {
        return (used / total) >= 0.85;
    }
    const checkTopUpFatigue = (topUpCount: number) => {
        if (topUpCount >= 2) {
            return "You've topped up twice this month. A different plan may better suit your needs.";
        }
        return null;
    }
};

export const showDisclaimer = (t: any) => {
    Alert.alert(
        t('disclaimer'),
        t('disclaimer_message'),
        [{text: t('disclaimer_button'), style: "cancel"}]
    );
};


const generateHtml = (messages: Message[]) => {

    const body = messages
        .map((item: Message) => `<p><strong>${item.sender}:</strong> ${marked(item.content)}</p>`)
        .join("");

    return `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; padding: 20px; line-height: 1.5; }
          p { margin-bottom: 12px; }
          strong { color: #333; }
        </style>
      </head>
      <body>${body}</body>
    </html>
  `;
};

export const downloadManuscript = async (messages: Message[], success: any) => {
    try {
        const html = generateHtml(messages);

        const fileUri = FileSystem.documentDirectory + "manuscript.html";

        await FileSystem.writeAsStringAsync(fileUri, html, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        if (success) {
            success(fileUri);
        }
        // Navigate to viewer screen


    } catch (e) {
        console.log(e);
    }
};

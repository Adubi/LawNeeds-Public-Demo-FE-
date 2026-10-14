import React, {useEffect, useState} from "react";
import {Image, ScrollView, StyleSheet, TouchableOpacity, View} from "react-native";
import {ThemedText} from "@/components/ThemedText";
import {getChatHistory} from "@/services/apiHelper";
import {useTranslation} from "react-i18next";

type DrawerProps = {
    isVisible: boolean;
    onClose: () => void;
    loadChat: (id: string) => void;
};

type Conversation = {
    id: string;
    first_message?: string;
    conversationTitle?: string;
    last_activity?: string;
    timestamp?: string;
};

const Drawer: React.FC<DrawerProps> = ({isVisible, onClose, loadChat}) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);

    const {t} = useTranslation();


    useEffect(() => {
        const fetchConversations = async () => {

            await getChatHistory((response: any) => {
                setConversations(response);
            }, () => {

            })

        };

        if (isVisible) {
            fetchConversations();
        }

    }, [isVisible]);

    const categorizeConversations = () => {
        const today: Conversation[] = [];
        const lastWeek: Conversation[] = [];
        const lastMonth: Conversation[] = [];

        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        const oneWeek = 7 * oneDay;
        const oneMonth = 30 * oneDay;

        conversations.forEach((conv) => {
            if(conv && conv.last_activity) {
                const convDate = new Date(conv.last_activity);
                const diff = now.getTime() - convDate.getTime();

                if (diff < oneDay) {
                    today.push(conv);
                } else if (diff < oneWeek) {
                    lastWeek.push(conv);
                } else if (diff < oneMonth) {
                    lastMonth.push(conv);
                }
            }
        });

        return {today, lastWeek, lastMonth};
    };

    const {today, lastWeek, lastMonth} = categorizeConversations();

    const renderConversation = (item: Conversation) => {
        const title = item.first_message || item.conversationTitle || t("chat.previous_chat");

        return (
            <TouchableOpacity
                key={item.id}
                onPress={() => loadChat(item.id)}
                style={styles.chatBubble}
                activeOpacity={0.78}
                hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
            >
                <View style={styles.bubbleAccent}/>
                <ThemedText
                    style={styles.itemText}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                >
                    {title}
                </ThemedText>
            </TouchableOpacity>
        );
    };

    const renderSection = (title: string, items: Conversation[]) => {
        if (items.length === 0) return null;

        return (
            <View style={styles.section}>
                <ThemedText style={styles.sectionHeader}>{title}</ThemedText>
                {items.map(renderConversation)}
            </View>
        );
    };

    if (!isVisible) return null;

    return (
        <View style={styles.drawer}>
            {/* <TouchableOpacity  style={styles.editButton}>
        <Image
          source={require("@/assets/images/edit.png")}
          style={styles.editButtonImage}
        />
      </TouchableOpacity>*/}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Image
                    source={require("@/assets/images/close.png")}
                    style={styles.closeButtonImage}
                />
            </TouchableOpacity>
            <View style={styles.content}>
                <ThemedText style={styles.drawerTitle}>{t('tour_chat_history_title')}</ThemedText>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {renderSection(t('chat.today'), today)}
                    {renderSection(t('chat.last_week'), lastWeek)}
                    {renderSection(t('chat.last_month'), lastMonth)}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    drawer: {
        position: "absolute",
        zIndex: 1000,
        right: 12,
        top: 12,
        bottom: 16,
        width: "82%",
        maxWidth: 340,
        backgroundColor: "#FFF7ED",
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 12,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: {width: 0, height: 6},
        elevation: 8,
    },
    content: {
        flex: 1,
        paddingTop: 34,
    },
    drawerTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#033126",
        marginBottom: 8,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    editButton: {
        position: "absolute",
        top: 10,
        left: 10,
        padding: 10,
        justifyContent: "center",
    },
    editButtonImage: {
        width: 24,
        height: 24,
    },
    closeButton: {
        position: "absolute",
        top: 12,
        right: 12,
        padding: 10,
        justifyContent: "center",
        borderRadius: 999,
        backgroundColor: "#FFFFFF",
    },
    closeButtonImage: {
        width: 18,
        height: 18,
    },
    section: {
        marginTop: 12,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: "800",
        marginBottom: 8,
        color: "#176535",
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    chatBubble: {
        minHeight: 58,
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        marginBottom: 10,
        paddingVertical: 13,
        paddingLeft: 16,
        paddingRight: 14,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#F3E2D3",
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: {width: 0, height: 3},
        elevation: 2,
    },
    bubbleAccent: {
        width: 4,
        height: 28,
        borderRadius: 999,
        backgroundColor: "#DD8550",
        marginRight: 12,
    },
    itemText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "700",
        color: "#033126",
    },
});

export default Drawer;

// styles/chat.styles.ts

import {Platform, StyleSheet} from "react-native";
import { SPACING, BORDER_RADIUS, FONT_SIZES, COLORS } from "@/constants/theme";
import { COLORS as c } from "@/constants/colors";

export const createChatStyles = (colors: {
    primary: string;
    secondary: string;
    inputBackground: string;
    backgroundColor: string;
    textColor: string;
}) =>
    StyleSheet.create({
        header: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(0,0,0,0.1)",
            backgroundColor: colors.backgroundColor,
            padding: SPACING.sm,
        },

        chatContent: {
            flex: 1,
            padding: SPACING.md,
            backgroundColor: colors.backgroundColor,
        },

        inputContainer: {
            width: "100%",
            backgroundColor: colors.backgroundColor,
        },

        inputRow: {
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
        },

        assistantDisclaimerRow: {
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            columnGap: 4,
            marginTop: 5,
            paddingHorizontal: 4,
            overflow: "hidden",
        },

        assistantDisclaimerText: {
            flexShrink: 1,
            textAlign: "center",
            fontSize: 11,
            lineHeight: 14,
            fontWeight: "600",
            color: "#999999",
            includeFontPadding: false,
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
            backgroundColor: colors.inputBackground,
        },

        recordingViewArea: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            minHeight: 48,
            maxHeight: 100,
            paddingHorizontal: SPACING.md,
            borderWidth: 0,
            backgroundColor: colors.inputBackground,
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
            backgroundColor: colors.secondary,
            alignItems: "center",
            justifyContent: "center",
            marginLeft: SPACING.sm,
        },
        icon: {
            marginRight: 16,
        },
        logo: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.secondary,
            alignItems: "center",
            justifyContent: "center",
        },
        attachButton: {
            width: 45,
            height: 45,
            borderRadius: BORDER_RADIUS.full,
            backgroundColor: colors.secondary,
            alignItems: "center",
            justifyContent: "center",
            marginRight: SPACING.sm,
        },

        headerIcon: {
            width: 40,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
        },

        actionBar: {
            position: 'absolute',          // so it floats over content
            right: 0,                      // align to right
            top: 70,                      // adjust vertically if needed
            borderColor: colors.backgroundColor,
            backgroundColor: colors.backgroundColor,
            borderWidth: 1,
            borderRadius: 8,
            flexDirection: 'column',
            alignItems: 'flex-start',     // align text left inside
            alignSelf: 'center',        // keep it to the right within parent
            zIndex: 10,                   // ensure it's on top
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.25,
            shadowRadius: 4,
        },

        actionButton: {
            flexDirection: "row",
            alignItems: "center",
            padding: 12,
        },

        actionText: {
            color: colors.textColor,
            fontSize: 18,
            marginHorizontal: 16,
        },

        divider: {
            height: 1,
            width: "100%",
            backgroundColor: "#e0e0e0",
        },

        referralSuccessView: {
            borderRadius: 8,
            marginStart: 24,
            borderColor: c.PrimaryColor,
            borderWidth: 1,
            color: c.PrimaryColor,
            padding: 8,
        },
        rowWrap: {
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
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
        fullImage: {
            width: '100%',
            height: '100%'
        },
    });

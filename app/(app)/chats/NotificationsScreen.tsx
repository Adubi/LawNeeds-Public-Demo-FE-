import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { BORDER_RADIUS, FONT_SIZES, SPACING } from "@/constants/theme";
import { COLORS as c, COLORS } from "@/constants/colors";
import { useTranslation } from "react-i18next";
import { useApp } from "@/contexts/AppContext";
import {
  getNotificationsList,
  markNotificationsRead,
} from "@/services/apiHelper";
import { SafeAreaView } from "react-native-safe-area-context";
import { NotificationItem } from "@/components/chat/NotificationItem";
import { NOTIFICATION_TYPES } from "@/constants/NOTIFICATION_TYPES";
import { isProUser } from "@/constants/Utility";
import {
  PROFILE_SURVEY_REQUEST_KEY,
  PROFILE_SURVEY_REQUESTED_EVENT,
} from "@/constants/onboarding";

// ── Types ────────────────────────────────────────────────────────────────────

interface NotificationData {
  referral_id?: string;
  session_id?: string;
  sender_id?: string;
  sender_type?: string;
  screen?: string;
  extension_request_id?: string;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  data: NotificationData;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { clearNotifications } = useApp();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUserPro, setUserPro] = useState<boolean>(false);

  const primary = c.PrimaryColor;
  const secondary = c.SecodaryColor;
  const backgroundColor = c.BackgroundColor;
  const textColor = c.PrimaryColorText;
  const inputBg = c.BackgroundColor;

  // ✅ Memoize so a style object is stable across re-renders
  const styles = useMemo(
    () =>
      createChatStyles({
        primary,
        secondary,
        inputBackground: inputBg,
        backgroundColor,
        textColor,
      }),
    [primary, secondary, inputBg, backgroundColor, textColor],
  );

  const handleNotificationPress = useCallback(
    async (item: Notification) => {
      // Remove immediately to keep this screen focused on notifications that
      // still need attention. Restore it if the server update fails.
      setNotifications((prev) => prev.filter((notification) => notification.id !== item.id));

      try {
        await markNotificationsRead({ notification_ids: [item.id] });
      } catch (err) {
        console.error("Failed to dismiss notification:", err);
        setNotifications((prev) => {
          if (prev.some((notification) => notification.id === item.id)) return prev;
          return [...prev, item].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          );
        });
      }

      const data = item?.data || {};

      switch (item.notification_type) {
        case NOTIFICATION_TYPES.NEW_REFERRAL:
        case NOTIFICATION_TYPES.REFERRAL_ACCEPTED:
        case NOTIFICATION_TYPES.REQUEST_CREATED:
          if (!data.referral_id) return;

          router.push({
            pathname: "/(app)/requestFlow/RequestDetails",
            params: {
              referral_id: String(data.referral_id),
              isUserPro: String(isUserPro),
              session_id: String(data.session_id || ""),
            },
          });

          break;

        case NOTIFICATION_TYPES.REFERRAL_REJECTED:
        case NOTIFICATION_TYPES.REFERRAL_UNDER_REVIEW:
        case NOTIFICATION_TYPES.REFERRAL_EXPIRED:
        case "new_request":
          router.push("/(app)/(tabs)/inbox");

          break;

        case NOTIFICATION_TYPES.NEW_MESSAGE:
        case "message":
        case NOTIFICATION_TYPES.PAYMENT_CONFIRMED:
        case NOTIFICATION_TYPES.ONE_MINUTE_WARNING:
        case NOTIFICATION_TYPES.CONSULTATION_EXTENDED:
        case NOTIFICATION_TYPES.EXTENSION_STARTED:
        case NOTIFICATION_TYPES.EXTENSION_REQUESTED:
        case NOTIFICATION_TYPES.EXTENSION_APPROVED:
        case NOTIFICATION_TYPES.EXTENSION_PROPOSED:
        case NOTIFICATION_TYPES.EXTENSION_DENIED:
        case NOTIFICATION_TYPES.EXTENSION_PAYMENT_CONFIRMED:
        case NOTIFICATION_TYPES.EXTENSION_TIMED_OUT:
        case NOTIFICATION_TYPES.DAY_COMPLETED:
          if (!data.referral_id) return;

          router.push({
            pathname: "/requestFlow/ConsultationScreen",
            params: {
              referral_id: String(data.referral_id),
              isUserPro: String(isUserPro),
              session_id: String(data.session_id || ""),
            },
          });

          break;

        case "first_message":
        case NOTIFICATION_TYPES.SESSION_ENDED:
          if (!data.referral_id) return;

          router.push({
            pathname: "/(app)/requestFlow/RequestDetails",
            params: {
              referral_id: String(data.referral_id),
              isUserPro: String(isUserPro),
              session_id: String(data.session_id || ""),
            },
          });

          break;

        case NOTIFICATION_TYPES.VERIFICATION_COMPLETED:
        case NOTIFICATION_TYPES.VERIFICATION_RESUBMISSION_REQUIRED:
        case NOTIFICATION_TYPES.VERIFICATION_NOT_COMMENCED:
        case NOTIFICATION_TYPES.VERIFICATION_ABANDONED:
          router.push("/(app)/identity-verification");

          break;

        case NOTIFICATION_TYPES.WELCOME_BACK:
          router.push("/(app)/(tabs)");

          break;

        case NOTIFICATION_TYPES.PROFILE_INCOMPLETE:
          router.push("/(app)/(tabs)/profile");

          break;

        case NOTIFICATION_TYPES.PROFILE_SURVEY_INCOMPLETE:
          await AsyncStorage.setItem(PROFILE_SURVEY_REQUEST_KEY, "true");
          router.push("/(app)/(tabs)");
          DeviceEventEmitter.emit(PROFILE_SURVEY_REQUESTED_EVENT);

          break;

        default:
          console.log(
            "⚠️ No navigation mapped for type:",
            item.notification_type,
          );
      }
    },
    [isUserPro],
  );

  // ── Fetch ──────────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);

      const response = await getNotificationsList(true);

      if (response?.notifications) {
        setNotifications(
          response.notifications.filter((item: Notification) => !item.is_read),
        );
      } else {
        setNotifications([]);
      }
    } catch (err) {
      setError("Failed to load notifications. Please try again.");
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const getUserData = async () => {
      const isUser = await isProUser();
      setUserPro(isUser);
    };

    getUserData();
    fetchNotifications();
    clearNotifications();
  }, []);

  // ── Mark as read ───────────────────────────────────────────────────────

  const markAllAsRead = async () => {
    const unreadIds: string[] = notifications
      .filter((n) => !n.is_read)
      .map((n) => n.id);

    if (!unreadIds.length) return;

    // Optimistically clear the inbox; a failed request restores server state.
    setNotifications([]);

    try {
      await markNotificationsRead({ notification_ids: unreadIds });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      // Revert by re-fetching fresh state
      await fetchNotifications();
    }
  };

  // ── Render item ────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationItem
        item={item}
        styles={styles}
        textColor={textColor}
        onPress={() => handleNotificationPress(item)}
      />
    ),
    [handleNotificationPress, styles, textColor],
  );

  // ── Render states ──────────────────────────────────────────────────────

  const unreadCount = notifications.length;
  const Separator = () => <View style={styles.separator} />;
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.replace("/(app)/(tabs)")}
          style={[
            styles.headerIcon,
            {
              paddingStart: Platform.OS === "android" ? SPACING.md : 0,
            },
          ]}
        >
          <MaterialIcons name="arrow-back-ios" size={24} color={textColor} />
        </TouchableOpacity>

        <ThemedText
          style={{ fontSize: 24, color: textColor, alignSelf: "center" }}
        >
          {t("activity")}
          {unreadCount > 0 ? ` (${unreadCount})` : ""}
        </ThemedText>

        {/* Mark all read button */}
        {unreadCount > 0 ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Clear all notifications"
            accessibilityHint="Marks every notification as read and removes it from this list"
            onPress={markAllAsRead}
            style={styles.headerIcon}
          >
            <Feather
              name="check-circle"
              size={20}
              color={COLORS.PrimaryColor}
            />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </ThemedView>

      {/* Body */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.PrimaryColor} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Feather name="alert-circle" size={40} color="#999" />
          <ThemedText style={styles.empty}>{error}</ThemedText>
          <TouchableOpacity
            onPress={() => fetchNotifications()}
            style={styles.retryBtn}
          >
            <ThemedText style={{ color: COLORS.PrimaryColor }}>
              Retry
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          removeClippedSubviews={false}
          contentContainerStyle={{
            padding: SPACING.md,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchNotifications(true)}
              tintColor={COLORS.PrimaryColor}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Feather name="bell-off" size={40} color="#999" />
              <ThemedText style={styles.empty}>
                {t("no_notifications")}
              </ThemedText>
            </View>
          }
          ItemSeparatorComponent={Separator}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

export const createChatStyles = (colors: {
  primary: string;
  secondary: string;
  inputBackground: string;
  backgroundColor: string;
  textColor: string;
}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.BackgroundColor,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: "rgba(0,0,0,0.1)",
      backgroundColor: colors.backgroundColor,
      padding: SPACING.sm,
    },
    headerTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: "InstrumentSansSemiBold",
    },
    headerIcon: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      flex: 1,
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 2,
    },

    empty: {
      textAlign: "center",
      marginTop: SPACING.md,
      color: "#999",
    },
    separator: {
      height: 1,
      backgroundColor: "rgba(0,0,0,0.08)",
      marginVertical: SPACING.xs,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: SPACING.xl,
    },
    retryBtn: {
      marginTop: SPACING.md,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      borderWidth: 1,
      borderColor: COLORS.PrimaryColor,
      borderRadius: BORDER_RADIUS?.sm ?? 8,
    },
    card: {
      backgroundColor: colors.inputBackground || "#FFFFFF", // ✅ fallback color
      padding: SPACING.md,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: BORDER_RADIUS?.sm ?? 8,
      minHeight: 72, // ✅ prevents collapsing to zero height
    },
    unreadCard: {
      borderLeftWidth: 3,
      borderLeftColor: COLORS.PrimaryColor,
    },
    iconWrapper: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(0,0,0,0.05)",
      justifyContent: "center",
      alignItems: "center",
      marginRight: SPACING.sm,
      flexShrink: 0,
    },
    textContainer: {
      flex: 1,
      flexShrink: 1,
      overflow: "hidden",
      marginRight: SPACING.sm,
    },
    title: {
      fontFamily: "InstrumentSansSemiBold",
      fontSize: FONT_SIZES.md,
      marginBottom: 2,
    },
    unreadTitle: {
      color: colors.textColor,
    },
    description: {
      fontSize: FONT_SIZES.sm,
      color: "#666",
    },
    rightMeta: {
      flexShrink: 0,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      minWidth: 52,
    },
    timestamp: {
      fontSize: FONT_SIZES.xs ?? 11,
      color: "#999",
      textAlign: "center",
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: COLORS.PrimaryColor,
    },
    dotPlaceholder: {
      width: 8,
      height: 8,
    },
  });

import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "@/constants/colors";

const getIconForType = (type: string): keyof typeof Feather.glyphMap => {
  switch (type) {
    case "new_message":
      return "message-circle";
    case "payment_confirmed":
      return "credit-card";
    case "session_ended":
      return "clock";
    case "extension_requested":
      return "clock";
    case "extension_approved":
      return "check-circle";
    case "extension_denied":
      return "x-circle";
    case "extension_timed_out":
      return "alert-circle";
    case "case_deleted":
      return "trash-2";
    case "welcome_back":
      return "smile";
    case "profile_incomplete":
    case "profile_survey_incomplete":
      return "user";
    default:
      return "bell";
  }
};

const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

export const NotificationItem = React.memo(
  ({ item, styles, textColor, onPress }: any) => {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. ${item.body}`}
        accessibilityHint="Opens this notification and removes it from the activity list"
        style={[styles.card, !item.is_read && styles.unreadCard]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.iconWrapper}>
          <Feather
            name={getIconForType(item.notification_type)}
            size={18}
            color={item.is_read ? "#999" : COLORS.PrimaryColor}
          />
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[styles.title, { color: item.is_read ? "#888" : textColor }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>

          <Text style={styles.description} numberOfLines={2}>
            {item.body}
          </Text>
        </View>

        <View style={styles.rightMeta}>
          <Text style={styles.timestamp}>{formatDate(item.created_at)}</Text>

          {!item.is_read ? (
            <View style={styles.dot} />
          ) : (
            <View style={styles.dotPlaceholder} />
          )}
        </View>
      </TouchableOpacity>
    );
  },
);

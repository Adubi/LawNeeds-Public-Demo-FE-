import React, {useEffect, useState} from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {Picker} from "@react-native-picker/picker";
import {Feather, MaterialIcons} from "@expo/vector-icons";
import {RFValue} from "react-native-responsive-fontsize";
import {useTranslation} from "react-i18next";

import {COLORS} from "@/constants/colors";
import {IMMIGRATION_STATUS_OPTIONS} from "@/constants/immigrationStatus";
import {SPACING} from "@/constants/theme";

type WebinarPreference = boolean | null;

interface ImmigrationProfileSurveyModalProps {
  visible: boolean;
  initialImmigrationStatus?: string | null;
  initialWebinar?: boolean | null;
  saving?: boolean;
  allowSkip?: boolean;
  onSubmit: (payload: {immigration_status: string; webinar: boolean}) => void | Promise<void>;
  onSkip?: () => void;
}

export default function ImmigrationProfileSurveyModal({
  visible,
  initialImmigrationStatus,
  initialWebinar,
  saving = false,
  allowSkip = true,
  onSubmit,
  onSkip,
}: ImmigrationProfileSurveyModalProps) {
  const {t} = useTranslation();
  const preferenceText = (key: string, defaultValue: string) =>
    t(`profile_preferences.${key}`, {defaultValue});
  const [immigrationStatus, setImmigrationStatus] = useState(initialImmigrationStatus ?? "");
  const [webinar, setWebinar] = useState<WebinarPreference>(
    typeof initialWebinar === "boolean" ? initialWebinar : null
  );

  useEffect(() => {
    if (!visible) return;
    setImmigrationStatus(initialImmigrationStatus ?? "");
    setWebinar(typeof initialWebinar === "boolean" ? initialWebinar : null);
  }, [initialImmigrationStatus, initialWebinar, visible]);

  const canSubmit = Boolean(immigrationStatus) && webinar !== null && !saving;

  const handleRequestClose = () => {
    if (saving) return;
    if (allowSkip) {
      onSkip?.();
    }
  };

  const renderPreference = (label: string, value: boolean) => {
    const selected = webinar === value;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.preferenceButton, selected && styles.preferenceButtonSelected]}
        onPress={() => setWebinar(value)}
      >
        <MaterialIcons
          name={selected ? "radio-button-checked" : "radio-button-unchecked"}
          size={20}
          color={selected ? COLORS.PrimaryColor : COLORS.Gray}
        />
        <Text style={[styles.preferenceText, selected && styles.preferenceTextSelected]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleRequestClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>{preferenceText("title", "Tell us a little about you")}</Text>
            <Text style={styles.subtitle}>
              {preferenceText("description", "Help us personalise the information and updates you receive from LawNeeds.")}
            </Text>

            <View style={styles.section}>
              <Text style={styles.question}>{preferenceText("status_question", "What is your current UK immigration status?")}</Text>
              <Text style={styles.helper}>{preferenceText("status_helper", "Select the option that best describes your current situation.")}</Text>
              <View style={styles.pickerShell}>
                <Picker
                  selectedValue={immigrationStatus}
                  onValueChange={(value) => setImmigrationStatus(String(value))}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label={preferenceText("select_status", "Select status")} value="" />
                  {IMMIGRATION_STATUS_OPTIONS.map((option) => (
                    <Picker.Item key={option} label={option} value={option} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.question}>{preferenceText("webinar_title", "Stay informed about LawNeeds webinars")}</Text>
              <Text style={styles.helper}>
                {preferenceText("webinar_description", "Receive invitations to upcoming webinars, legal information sessions and Q&As relevant to you.")}
              </Text>
              <View style={styles.preferenceRow}>
                {renderPreference(preferenceText("yes", "Yes"), true)}
                {renderPreference(preferenceText("no", "No"), false)}
              </View>
            </View>

            <View style={styles.actions}>
              {allowSkip ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.skipButton}
                  disabled={saving}
                  onPress={onSkip}
                >
                  <Text style={styles.skipText}>{preferenceText("skip_for_now", "Skip for now")}</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
                disabled={!canSubmit}
                onPress={() => onSubmit({immigration_status: immigrationStatus, webinar: Boolean(webinar)})}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.White} />
                ) : (
                  <>
                    <Feather name="check" size={18} color={COLORS.White} />
                    <Text style={styles.submitText}>{t("save")}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: SPACING.lg,
  },
  modal: {
    maxHeight: "88%",
    borderRadius: 8,
    backgroundColor: COLORS.White,
    overflow: "hidden",
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    color: COLORS.PrimaryColorText,
    fontFamily: "InstrumentSansBold",
    fontSize: RFValue(20),
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.Gray,
    fontFamily: "InstrumentSansRegular",
    fontSize: RFValue(13),
    lineHeight: RFValue(19),
    marginBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  question: {
    color: COLORS.PrimaryColorText,
    fontFamily: "InstrumentSansSemiBold",
    fontSize: RFValue(14),
    marginBottom: SPACING.xs,
  },
  helper: {
    color: COLORS.Gray,
    fontFamily: "InstrumentSansRegular",
    fontSize: RFValue(12),
    lineHeight: RFValue(18),
    marginBottom: SPACING.sm,
  },
  pickerShell: {
    borderWidth: 1,
    borderColor: COLORS.GrayLight,
    borderRadius: 8,
    backgroundColor: "#F7F7F7",
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    minHeight: Platform.OS === "ios" ? 160 : 52,
  },
  pickerItem: {
    fontFamily: "InstrumentSansRegular",
    fontSize: RFValue(13),
  },
  preferenceRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  preferenceButton: {
    minHeight: 48,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.GrayLight,
    borderRadius: 8,
    backgroundColor: "#F7F7F7",
  },
  preferenceButtonSelected: {
    borderColor: COLORS.PrimaryColor,
    backgroundColor: "#EEF8F1",
  },
  preferenceText: {
    color: COLORS.Gray,
    fontFamily: "InstrumentSansSemiBold",
    fontSize: RFValue(13),
  },
  preferenceTextSelected: {
    color: COLORS.PrimaryColor,
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  skipButton: {
    minHeight: 48,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.GrayLight,
  },
  skipText: {
    color: COLORS.PrimaryColorText,
    fontFamily: "InstrumentSansSemiBold",
    fontSize: RFValue(13),
  },
  submitButton: {
    minHeight: 48,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    borderRadius: 8,
    backgroundColor: COLORS.PrimaryColor,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.Disabled,
  },
  submitText: {
    color: COLORS.White,
    fontFamily: "InstrumentSansSemiBold",
    fontSize: RFValue(13),
  },
});

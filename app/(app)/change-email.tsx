import React from "react";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/theme";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { Button } from "@/components/Button";
import {useTranslation} from 'react-i18next';

export default function ChangeEmail() {

  const {t} = useTranslation();

  const [email, setEmail] = useState<string>("");
  const [changeEmail, setChangeEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleResetPassword = async () => {
   router.push("/(app)/verify-email")
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel={t('change_email.go_back')}
      >
        <MaterialIcons name="arrow-back-ios" size={24} />
      </TouchableOpacity>
      <Text style={styles.title} allowFontScaling={false}>
        {t('change_email.create_new_pass')}
      </Text>
      <Text style={styles.description} allowFontScaling={false}>
        {t('change_email.enter_current_email')}
      </Text>

      <View style={{ gap: 5, marginVertical: SPACING.md }}>
        <Text style={styles.formLabel} allowFontScaling={false}>
          {t('change_email.new_email')}
        </Text>
        <TextInput
          style={styles.formField}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          allowFontScaling={false}
        />
      </View>
      <View style={{ gap: 5, marginBottom: SPACING.md }}>
        <Text style={styles.formLabel} allowFontScaling={false}>
          {t('change_email.new_email')}
        </Text>
        <TextInput
          style={styles.formField}
          value={changeEmail}
          onChangeText={setChangeEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          allowFontScaling={false}
        />
      </View>

      <Button
        title={t('change_email.send_instruction')}
        onPress={handleResetPassword}
        loading={isLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.BackgroundColor,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  title: {
    fontFamily: "InstrumentSansBold",
    fontSize: RFValue(20),
    color: COLORS.PrimaryColor,
  },
  description: {
    fontFamily: "InstrumentSansSemiBold",
    fontSize: RFValue(14),
    color: COLORS.PrimaryColor,
  },
  formLabel: {
    fontFamily: "InstrumentSansSemiBold",
    fontSize: RFValue(14),
    color: COLORS.PrimaryColor,
  },
  formField: {
    borderWidth: 1,
    borderRadius: wp(100),
    paddingHorizontal: "5%",
    fontFamily: "InstrumentSansSemiBold",
    fontSize: RFValue(14),
    height: wp(13),
    overflow: "hidden",
  },
});

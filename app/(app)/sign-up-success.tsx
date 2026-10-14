import React from "react";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { Button } from "@/components/Button";
import AuthServices from "@/services/AuthServices";
import {useTranslation} from 'react-i18next';
import {identityVerificationDestination} from "@/services/identityVerificationNavigation";

export default function SignUpSuccess() {
  const {t} = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.form}>
        <View style={{justifyContent: "center", alignItems: "center"}}>
          <Image
              source={require("@/assets/images/success.png")}
              style={{width: wp(40), height: wp(40)}}
              resizeMode="contain"
          />

          <Text style={styles.successTitle} allowFontScaling={false}>
            {t('create_account.account_creat_success')}
          </Text>
          <Text style={styles.successText} allowFontScaling={false}>
            {t('create_account.access_detail_msg_legal_assistance')}
          </Text>
        </View>

        <Button
            title={t('chat.get_started')}
            onPress={async () => router.replace(await identityVerificationDestination() as any)}
            style={styles.getStartedButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.BackgroundColor,
  },
  form: {
    gap: SPACING.lg,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: "InstrumentSansSemiBold",
    color: COLORS.PrimaryColor,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  getStartedButton: {
    width: "100%",
  },
  successText: {
    fontSize: 16,
    fontFamily: "InstrumentSansRegular",
    color: COLORS.PrimaryColor,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
});

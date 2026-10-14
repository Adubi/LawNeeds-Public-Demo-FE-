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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { Button } from "@/components/Button";
import AuthServices from "@/services/AuthServices";
import {useTranslation} from "react-i18next";

export default function ResetPassword() {
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const {t} = useTranslation();
  const handleSendInstructions = async () => {
    if (!email) {
      Alert.alert(t('error.title'), t('validation.enter_your_email'));
      return;
    }

    try {
      setIsLoading(true);

      let body = {
        email: email
      };

      let response = await AuthServices.ForgotPassword(body);

      // await sendPasswordResetEmail(auth, email);
      // router.push("/check-mail");
      router.push({pathname:"/check-email", params: {email: email}});
      setEmailSent(true);
    } catch (error: unknown) {
      Alert.alert(t('error.title'), (error as Error).message);
    } finally {
      setIsLoading(false);
      setEmailSent(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/*<TouchableOpacity*/}
      {/*  onPress={() => router.back()}*/}
      {/*  style={styles.backButton}*/}
      {/*  accessibilityRole="button"*/}
      {/*  accessibilityLabel="Go back"*/}
      {/*>*/}
      {/*  <MaterialIcons name="arrow-back-ios" size={24} />*/}
      {/*</TouchableOpacity>*/}
      {/*<Text style={styles.title} allowFontScaling={false}>*/}
      {/*  Reset Password*/}
      {/*</Text>*/}
      <View style={styles.headerContainer}>
        <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
        >
          <MaterialIcons name="arrow-back-ios" size={24}  color={COLORS.PrimaryColor}/>
        </TouchableOpacity>
        <Text style={styles.headerTitle} allowFontScaling={false}>
          {t('reset_password')}
        </Text>
      </View>

      <Text style={styles.description} allowFontScaling={false}>
        {t('reset_password_info')}
      </Text>

      <View style={{ gap: 5, marginVertical: SPACING.md }}>
        <Text style={styles.formLabel} allowFontScaling={false}>
          {t('email')}
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

      <Button
        title={t("change_email.send_instruction")}
        onPress={handleSendInstructions}
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
    position: "absolute",
    left: 0,
    padding: 0, // Ensure a good touchable area
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    height: 50, // Adjust height as needed
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
  headerTitle: {
    color: COLORS.PrimaryColor,
    textAlign: "center",
    fontSize: RFValue(22),
    fontFamily: "InstrumentSansSemiBold",
  },
});

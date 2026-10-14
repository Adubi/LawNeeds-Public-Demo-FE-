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
  Alert,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { Button } from "@/components/Button";
import {useTranslation} from 'react-i18next';

export default function VerifyEmail() {

    const {t} = useTranslation();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

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

      <View style={{ justifyContent: "center", alignItems: "center" }}>
        <Image
          source={require("@/assets/images/checkemail.png")}
          style={{ width: wp(40), height: wp(40) }}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title} allowFontScaling={false}>
          {t('change_email.verify_mail')}
      </Text>
      <Text style={styles.description} allowFontScaling={false}>
          {t('change_email.click_link_to_verify_mail')}
      </Text>
      <View
        style={{
          marginTop: SPACING.md,
          paddingHorizontal: SPACING.lg,
          gap: 10,
        }}
      >
        <Button title={t('open_email_app')} onPress={() => {setModalVisible(true)}} loading={isLoading} />
        <TouchableOpacity onPress={() => {}}>
          <Text style={styles.text} allowFontScaling={false}>
              {t('change_email.skip_confirm_later')}
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={{
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "auto",
          paddingHorizontal: SPACING.lg,
        }}
      >
        <Text
          style={[styles.text, { color: COLORS.PrimaryColor }]}
          allowFontScaling={false}
        >
            {t('change_email.not_recd_mail')}{" "}
          <Text style={{ color: COLORS.Black }}>{t('resend_email.try_other_email')}</Text>
        </Text>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            {/* Check Icon */}
            <Feather name="check-circle" size={wp(30)} color="#D97706" />
            {/* Text */}
            <Text style={styles.modalText} allowFontScaling={false}>{t('change_email.email_updated')}</Text>
          </View>
        </View>
      </Modal>
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
    textAlign: "center",
  },
  description: {
    fontFamily: "InstrumentSansSemiBold",
    fontSize: RFValue(14),
    color: COLORS.Gray,
    textAlign: "center",
    paddingHorizontal: SPACING.lg,
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
  text: {
    fontFamily: "InstrumentSansBold",
    fontSize: RFValue(14),
    color: COLORS.PrimaryColor,
    textAlign: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: wp(60),
    height: wp(60),
    backgroundColor: "#FFF",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalText: {
    marginTop: 10,
    fontSize: RFValue(16),
    color: COLORS.PrimaryColor,
    fontFamily: "InstrumentSansBold",
  },
});

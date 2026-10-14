import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { SPACING } from "@/constants/theme";
import { COLORS } from "@/constants/colors";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import {useTranslation} from 'react-i18next';

const Philosophy = () => {

  const {t} = useTranslation();


  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={('change_email.go_back')}
        >
          <MaterialIcons name="arrow-back-ios" size={24} />
        </TouchableOpacity>
        <Text style={styles.title} allowFontScaling={false}>
          {t('setting.our_philosophy')}
        </Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SPACING.xxxl }}
      >
        <View style={{ justifyContent: "center", alignItems: "center" }}>
          <Image
            source={require("@/assets/images/Philosophy.png")}
            style={{ width: wp(50), height: wp(50), resizeMode: "contain" }}
          />
        </View>
        <View style={{ flex: 1, gap: 20 }}>
          <View>
            <Text style={styles.text} allowFontScaling={false}>
              {t('our_philosophy.our_vision_header')}
            </Text>
            <Text style={styles.description} allowFontScaling={false}>
              {t('our_philosophy.our_vision_desc')}
            </Text>
          </View>
          <View>
            <Text style={styles.text} allowFontScaling={false}>
              {t('our_philosophy.our_services_header')}
            </Text>
            <Text style={styles.description} allowFontScaling={false}>
              {t('our_philosophy.our_services_desc')}
            </Text>
          </View>
          <View>
            <Text style={styles.text} allowFontScaling={false}>
              {t('our_philosophy.innovation_header')}
            </Text>
            <Text style={styles.description} allowFontScaling={false}>
              {t('our_philosophy.innovation_desc')}
            </Text>
          </View>
          <View>
            <Text style={styles.text} allowFontScaling={false}>
              {t('our_philosophy.community_header')}
            </Text>
            <Text style={styles.description} allowFontScaling={false}>
              {t('our_philosophy.community_desc')}
            </Text>
          </View>
          <View>
            <Text style={styles.text} allowFontScaling={false}>
              {t('our_philosophy.commitment_header')}
            </Text>
            <Text style={styles.description} allowFontScaling={false}>
              {t('our_philosophy.commitment_desc')}
            </Text>
          </View>

          <View>
            <Text style={styles.text} allowFontScaling={false}>
              {t('our_philosophy.join_us_header')}
            </Text>
            <Text style={[styles.description, { marginBottom: SPACING.lg }]} allowFontScaling={false}>
              {t('our_philosophy.join_us_desc')}
            </Text>
            {/* <Text style={[styles.description, { marginTop: SPACING.md }]} allowFontScaling={false}>
              Thank you for choosing LawNeeds—where legal assistance is just a click away. Together, let's redefine the future of legal services.
            </Text> */}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BackgroundColor,
    padding: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  title: {
    fontFamily: "InstrumentSansSemiBold",
    fontSize: RFValue(18),
    color: COLORS.PrimaryColorText,
  },
  text: {
    fontFamily: "InstrumentSansSemiBold",
    fontSize: RFValue(14),
    color: COLORS.PrimaryColorText,
  },
  description: {
    fontFamily: "InstrumentSansRegular",
    fontSize: RFValue(14),
    color: COLORS.PrimaryColorText,
  },
});

export default Philosophy;

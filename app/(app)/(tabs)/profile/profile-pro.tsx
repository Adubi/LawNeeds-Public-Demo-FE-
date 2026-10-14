import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useRef, useState } from "react";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Entypo,
  FontAwesome6,
  MaterialIcons,
  Octicons,
} from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { RFValue } from "react-native-responsive-fontsize";
import { Button } from "@/components/Button";
import { TextInput } from "react-native";
import {useTranslation} from 'react-i18next';

const HEADER_HEIGHT = 80; // Adjust as needed

const ProfilePro = () => {

  const { t } = useTranslation();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [email, setEmail] = useState("ayomideoyeanusi@gmail.com");
  const [phoneNumber, setPhoneNumber] = useState("+235 903 869 5767");
  const [userName, setUserName] = useState("@Ayomide69");
  const [password, setPassword] = useState("ayomideoyeanusi");

  // Interpolate white section position
  const whiteSectionTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT / 1.5],
    outputRange: [0, -HEADER_HEIGHT / 2], // Moves up as user scrolls
    extrapolate: "clamp",
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollContainer}
        // contentContainerStyle={{ paddingTop: hp(12) }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={t('account.go_back_home')}
          >
            <MaterialIcons name="arrow-back-ios" size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.navigate("/(app)/(tabs)/profile/profile-pro")}
            style={styles.hamburger}
          >
            <Image
              source={require("@/assets/images/hamburger-icon.png")}
              style={{
                width: wp(5),
                height: wp(5),
              }}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper}>
            <Image
              source={require("@/assets/images/user-image.png")}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        </View>
        <Animated.View
          style={[
            styles.content,
            { transform: [{ translateY: whiteSectionTranslateY }] },
          ]}
        >
          <View style={styles.infoSection}>
            <Text style={styles.title}>Ayomide Oyeanusi</Text>
            <Octicons name="shield-check" size={20} color={COLORS.Black} />
          </View>

          <Text style={styles.description}>
            Results-driven and dedicated real estate professional with 7 years
            of experience.
          </Text>

          <View style={styles.achievementsContainer}>
            <View style={styles.achievement}>
              <Text style={styles.achievementText1}>95%</Text>
              <Text style={styles.achievementText2}>Satisfied</Text>
            </View>
            <View style={styles.achievement}>
              <Text style={styles.achievementText1}>250+</Text>
              <Text style={styles.achievementText2}>Cases Helped</Text>
            </View>
            <View style={styles.achievement}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialIcons
                  name="verified"
                  size={20}
                  color={COLORS.PrimaryColor}
                />
                <Text style={styles.achievementText1}>LPC</Text>
              </View>
              <Text style={styles.achievementText2}>License</Text>
            </View>
          </View>

          <Button
            title="Reviews"
            onPress={() => {}}
            variant="outline"
            style={styles.reviewButton}
          />

          <View style={styles.section}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                // justifyContent: "space-between",
                width: "100%",
                paddingBottom: SPACING.sm,
              }}
            >
              <Text style={styles.sectionTitle}>About</Text>
              <TouchableOpacity style={{ marginLeft: "auto" }}>
                <FontAwesome6 name="pencil" size={wp(5)} color={COLORS.Gray} />
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionText}>
              I excel at making homeownership dreams a reality, with 10 years of
              experience as a results-driven and dedicated real estate
              professional. With expertise in residential sales/purchases,
              market trends/analysis, and negotiation/closing strategies, I de
              liver exceptional customer service to clients seeking their ideal
              properties.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Area of Expertise</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons
                name="verified"
                size={20}
                color={COLORS.PrimaryColor}
              />
              <Text style={styles.headingtwo}> Real estate</Text>
            </View>
          </View>

          <View style={[styles.section, { gap: 20 }]}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                width: "100%",
                paddingBottom: SPACING.sm,
              }}
            >
              <Text style={styles.sectionTitle}>Professional Employer</Text>
              <TouchableOpacity style={{ marginLeft: "auto" }}>
                <FontAwesome6 name="pencil" size={wp(5)} color={COLORS.Gray} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Image
                source={require("@/assets/images/lawicon.png")}
                style={{
                  width: wp(12),
                  height: wp(12),
                  resizeMode: "contain",
                }}
              />
              <View>
                <Text style={styles.headingtwo} allowFontScaling={false}>
                  Johnson and Clarks Chambers{" "}
                </Text>
                <Text style={styles.headingthree} allowFontScaling={false}>
                  March 2023 to Present
                </Text>
                <Text
                  style={[styles.sectionDescription, { paddingRight: wp(20) }]}
                  allowFontScaling={false}
                >
                  Closed over $1 Billion in Real Estate Transactions:
                  Successfully navigated complex deals, ensuring seamless
                  closings for clients.
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Image
                source={require("@/assets/images/lawicon.png")}
                style={{
                  width: wp(12),
                  height: wp(12),
                  resizeMode: "contain",
                }}
              />
              <View>
                <Text style={styles.headingtwo} allowFontScaling={false}>
                  Johnson and Clarks Chambers{" "}
                </Text>
                <Text style={styles.headingthree} allowFontScaling={false}>
                  March 2023 to Present
                </Text>
                <Text
                  style={[styles.sectionDescription, { paddingRight: wp(20) }]}
                  allowFontScaling={false}
                >
                  Closed over $1 Billion in Real Estate Transactions:
                  Successfully navigated complex deals, ensuring seamless
                  closings for clients.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                width: "100%",
                paddingBottom: SPACING.sm,
              }}
            >
              <Text style={styles.sectionTitle}>Services</Text>
              <TouchableOpacity style={{ marginLeft: "auto" }}>
                <FontAwesome6 name="pencil" size={wp(5)} color={COLORS.Gray} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Entypo name="dot-single" size={24} color={COLORS.Black} />
              <Text style={styles.headingtwo}>
                Real Estate Transaction Services
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Entypo name="dot-single" size={24} color={COLORS.Black} />
              <Text style={styles.headingtwo}>
                Real Estate Law Consultation
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Entypo name="dot-single" size={24} color={COLORS.Black} />
              <Text style={styles.headingtwo}>Due Diligence and Research</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Entypo name="dot-single" size={24} color={COLORS.Black} />
              <Text style={styles.headingtwo}>
                Closing and Settlement Services
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                width: "100%",
                paddingBottom: SPACING.sm,
              }}
            >
              <Text style={styles.sectionTitle}>{t('profile.skills')}</Text>
              <TouchableOpacity style={{ marginLeft: "auto" }}>
                <FontAwesome6 name="pencil" size={wp(5)} color={COLORS.Gray} />
              </TouchableOpacity>
            </View>
            <View style={styles.skillsContainer}>
              <View style={styles.skill}>
                <Text style={styles.skillText} allowFontScaling={false}>
                  Contract Drafting and Renew
                </Text>
              </View>
              <View style={styles.skill}>
                <Text style={styles.skillText} allowFontScaling={false}>
                  Transaction Management
                </Text>
              </View>
              <View style={styles.skill}>
                <Text style={styles.skillText} allowFontScaling={false}>
                  Contract Drafting and Renew
                </Text>
              </View>
            </View>
          </View>
          <View style={{ marginTop: SPACING.md, paddingBottom: SPACING.md }}>
            <Text style={styles.title} allowFontScaling={false}>
              {t('profile.details')}
            </Text>

            <View style={{ marginVertical: SPACING.sm }}>
              <Text style={styles.formLabel} allowFontScaling={false}>
                {t('profile.email')}
              </Text>
              <View style={[styles.formField, { position: "relative" }]}>
                <TextInput
                  style={{
                    width: "100%",
                    height: "100%",
                    fontFamily: "InstrumentSansSemiBold",
                    fontSize: RFValue(14),
                  }}
                  allowFontScaling={false}
                  value={email}
                  editable={false}
                  onChangeText={setEmail}
                />
                <TouchableOpacity
                  onPress={() => {}}
                  style={{
                    position: "absolute",
                    right: 5,
                    top: 0,
                    bottom: 0,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 10, // add padding if needed
                  }}
                >
                  <FontAwesome6
                    name="pencil"
                    size={wp(5)}
                    color={COLORS.Gray}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ marginVertical: SPACING.sm }}>
              <Text style={styles.formLabel} allowFontScaling={false}>
                Phone Number
              </Text>
              <View style={[styles.formField, { position: "relative" }]}>
                <TextInput
                  style={{
                    width: "100%",
                    height: "100%",
                    fontFamily: "InstrumentSansSemiBold",
                    fontSize: RFValue(14),
                  }}
                  allowFontScaling={false}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  editable={false}
                />
                <TouchableOpacity
                  onPress={() => {}}
                  style={{
                    position: "absolute",
                    right: 5,
                    top: 0,
                    bottom: 0,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 10, // add padding if needed
                  }}
                >
                  <FontAwesome6
                    name="pencil"
                    size={wp(5)}
                    color={COLORS.Gray}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ marginVertical: SPACING.sm }}>
              <Text style={styles.formLabel} allowFontScaling={false}>
                {t('user_name')}
              </Text>
              <View style={[styles.formField, { position: "relative" }]}>
                <TextInput
                  style={{
                    width: "100%",
                    height: "100%",
                    fontFamily: "InstrumentSansSemiBold",
                    fontSize: RFValue(14),
                  }}
                  allowFontScaling={false}
                  value={userName}
                  onChangeText={setUserName}
                  editable={false}
                />
                <TouchableOpacity
                  onPress={() => {}}
                  style={{
                    position: "absolute",
                    right: 5,
                    top: 0,
                    bottom: 0,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 10, // add padding if needed
                  }}
                >
                  <FontAwesome6
                    name="pencil"
                    size={wp(5)}
                    color={COLORS.Gray}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.title} allowFontScaling={false}>
              {t('profile.account_security')}
            </Text>
            <View style={{ marginVertical: SPACING.sm }}>
              <Text style={styles.formLabel} allowFontScaling={false}>
                {t('login.password')}
              </Text>
              <View style={[styles.formField, { position: "relative" }]}>
                <TextInput
                  style={{
                    width: "100%",
                    height: "100%",
                    fontFamily: "InstrumentSansSemiBold",
                    fontSize: RFValue(14),
                  }}
                  allowFontScaling={false}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={true}
                  editable={false}
                />
                <TouchableOpacity
                  onPress={() => {}}
                  style={{
                    position: "absolute",
                    right: 5,
                    top: 0,
                    bottom: 0,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 10, // add padding if needed
                  }}
                >
                  <FontAwesome6
                    name="pencil"
                    size={wp(5)}
                    color={COLORS.Gray}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <Button title={t('save')} onPress={() => {}} variant="secondary" />
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.White,
  },
  header: {
    width: "100%",
    backgroundColor: COLORS.BackgroundColor,
    height: hp(12),
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
  },
  imageContainer: {
    width: "100%",
    alignItems: "center",
    position: "absolute",
    top: 10,
    zIndex: 1,
    height: hp(20),
  },
  imageWrapper: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(100),
    overflow: "hidden",
    borderColor: COLORS.White,
    borderWidth: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: wp(40),
    height: wp(40),
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.White,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.White,
    marginTop: wp(20),
  },
  infoSection: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  title: {
    fontFamily: "InstrumentSansSemiBold",
    fontSize: RFValue(18),
    color: COLORS.PrimaryColorText,
  },
  description: {
    textAlign: "center",
    fontFamily: "InstrumentSansRegular",
    fontSize: RFValue(17),
    color: COLORS.PrimaryColorText,
    paddingHorizontal: SPACING.lg,
  },
  achievementsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg * 2,
    paddingVertical: SPACING.lg,
  },
  achievement: {
    justifyContent: "center",
    alignItems: "center",
  },
  achievementText1: {
    fontFamily: "InstrumentSansSemiBold",
    fontSize: RFValue(12),
    color: COLORS.PrimaryColorText,
  },
  achievementText2: {
    fontFamily: "InstrumentSansSemiBold",
    fontSize: RFValue(12),
    color: COLORS.PrimaryColorText,
  },
  reviewButton: {
    width: "100%",
    borderColor: COLORS.PrimaryColor,
    shadowColor: COLORS.PrimaryColor,
    borderWidth: 2,
  },
  reviewButton_two: {
    width: "45%",
    borderColor: COLORS.PrimaryColor,
    shadowColor: COLORS.PrimaryColor,
    borderWidth: 2,
  },
  section: {
    marginTop: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontFamily: "InstrumentSansSemiBold",
    fontSize: RFValue(14),
    color: COLORS.PrimaryColorText,
  },
  sectionText: {
    fontFamily: "InstrumentSansRegular",
    fontSize: RFValue(12),
    color: COLORS.PrimaryColorText,
  },
  sectionDescription: {
    fontFamily: "InstrumentSansRegular",
    fontSize: RFValue(12),
    color: COLORS.PrimaryColorText,
  },
  headingtwo: {
    fontFamily: "InstrumentSansSemiBold",
    fontSize: RFValue(12),
    color: COLORS.Black,
    width: "100%",
  },
  headingthree: {
    fontFamily: "InstrumentSansSemiBold",
    fontSize: RFValue(12),
    color: COLORS.Black,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skill: {
    borderWidth: 1,
    borderRadius: wp(100),
    padding: SPACING.sm,
  },
  skillText: {
    fontFamily: "InstrumentSansSemiBold",
    fontSize: RFValue(12),
    color: COLORS.Black,
  },
  formLabel: {
    fontFamily: "InstrumentSansSemiBold",
    fontSize: RFValue(12),
    color: COLORS.Gray,
  },
  formField: {
    borderRadius: wp(100),
    paddingHorizontal: "5%",
    fontFamily: "InstrumentSansSemiBold",
    fontSize: RFValue(14),
    height: wp(13),
    overflow: "hidden",
    backgroundColor: "#E7E7E7",
  },

  hamburger: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: SPACING.md,
    marginLeft: "auto",
  },
});

export default ProfilePro;

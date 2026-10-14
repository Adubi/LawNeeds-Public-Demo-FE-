import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { SPACING } from "@/constants/theme";
import { COLORS } from "@/constants/colors";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { RFValue } from "react-native-responsive-fontsize";

import { Linking } from "react-native";
const IOS_LINK = "https://testflight.apple.com/join/zfxfbVN8";
const ANDROID_LINK = "https://play.google.com/store/apps/details?id=com.steve.LawNeeds";

const BetaInstructions = () => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <MaterialIcons name="arrow-back-ios" size={24} />
                </TouchableOpacity>
                <Text style={styles.title} allowFontScaling={false}>
                    Beta 2.0
                </Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: SPACING.xxxl }}
            >
                <View style={{ flex: 1, gap: 20, marginTop: SPACING.lg }}>

                    {/* Intro */}
                    <View>
                        <Text style={styles.heading} allowFontScaling={false}>
                            LawNeeds Beta 2.0 Is Now Live! 🚀
                        </Text>
                        <Text style={styles.description} allowFontScaling={false}>
                            We’re excited to officially announce that LawNeeds Beta 2.0 is now live!{"\n\n"}
                            Thank you for being part of our waitlist. You are among the first to experience the platform as we enter our final testing phase ahead of public launch.
                        </Text>
                    </View>

                    {/* Beta Period */}
                    <View>
                        <Text style={styles.text}>🚀 Beta Period: April 20th – May 8th</Text>
                        <Text style={styles.description}>
                            Over the next 3 weeks, you’ll have full access to explore, test, and shape LawNeeds before it goes live. Your feedback will directly influence the final product.
                        </Text>
                    </View>

                    {/* Access App */}
                    <View>
                        <Text style={styles.text}>📲 Access the App</Text>

                        <Text style={[styles.description, { marginTop: 6 }]}>
                            iOS (TestFlight):
                        </Text>

                        <TouchableOpacity onPress={() => Linking.openURL(IOS_LINK)}>
                            <Text style={[styles.description, { color: COLORS.PrimaryColor, textDecorationLine: "underline" }]}>
                                Open TestFlight Link
                            </Text>
                        </TouchableOpacity>

                        <Text style={styles.description}>
                            {"• Download the TestFlight app from the App Store\n"}
                            {"• Open the link above on your iPhone\n"}
                            {"• Tap Accept, then Install\n"}
                            {"• Follow the iOS Access Guide"}
                        </Text>

                        <Text style={[styles.description, { marginTop: 10 }]}>
                            Android (Google Play):
                        </Text>

                        <TouchableOpacity onPress={() => Linking.openURL(ANDROID_LINK)}>
                            <Text style={[styles.description, { color: COLORS.PrimaryColor, textDecorationLine: "underline" }]}>
                                Open Google Play Link
                            </Text>
                        </TouchableOpacity>

                        <Text style={styles.description}>
                            {"• Open the link above on your Android device\n"}
                            {"• Tap Install to download the app\n"}
                            {"• Or search 'LawNeeds' on Google Play\n"}
                            {"• Follow the Android Access Guide"}
                        </Text>
                    </View>

                    {/* What to do */}
                    <View>
                        <Text style={styles.text}>🛠 What to Do During Beta</Text>
                        <Text style={styles.description}>
                            {"• AI-powered legal guidance (Immigration-focused)\n"}
                            {"• AI-to-lawyer referral workflow\n"}
                            {"• In-app consultations & case management\n"}
                            {"• Multilingual voice notes (50+ languages)\n"}
                            {"• Multilingual text input\n"}
                            {"• Image & document uploads\n"}
                            {"• Overall usability testing\n\n"}
                            Even 15–20 minutes per week makes a big difference.
                        </Text>
                    </View>

                    {/* Free Consultation */}
                    <View>
                        <Text style={styles.text}>⚖ Free Lawyer Consultations</Text>
                        <Text style={styles.description}>
                            {"• April 22 (1–2pm)\n"}
                            {"• April 29\n"}
                            {"• May 6\n\n"}
                            Reply "Yes" to the invite email to register.{"\n\n"}
                            {"• Limited slots\n"}
                            {"• First come, first served\n"}
                            {"• Schedule shared after registration"}
                        </Text>
                    </View>

                    {/* Feedback */}
                    <View>
                        <Text style={styles.text}>💬 Share Feedback</Text>
                        <Text style={styles.description}>
                            {"• Thumbs up / down on AI responses\n"}
                            {"• Settings → Submit Feedback"}
                        </Text>
                    </View>

                    {/* Attachments */}
                    <View>
                        <Text style={styles.text}>📎 Guides Available</Text>
                        <Text style={styles.description}>
                            {"• Beta Participation Guide\n"}
                            {"• iOS Access Guide\n"}
                            {"• Android Access Guide"}
                        </Text>
                    </View>

                    {/* Payment */}
                    <View>
                        <Text style={styles.text}>💳 Test Payment (Beta Only)</Text>
                        <Text style={styles.description}>
                            All payments are simulated (no real charges).{"\n\n"}
                            {"Card: 4242 4242 4242 4242\n"}
                            {"Expiry: 09/29\n"}
                            {"CVV: 123"}
                        </Text>
                    </View>

                    {/* Disclaimer */}
                    <View>
                        <Text style={styles.text}>⚠ Consultation Disclaimer</Text>
                        <Text style={styles.description}>
                            These consultations are for testing and informational purposes only and do not constitute legal advice.{"\n\n"}
                            Feedback may be requested on:
                            {"\n• Referral flow\n• Speed & responsiveness\n• Overall experience\n• Technical issues"}
                        </Text>
                    </View>

                    {/* Closing */}
                    <View style={{ marginBottom: SPACING.lg }}>
                        <Text style={styles.text}>Welcome to Beta 2.0! 🚀</Text>
                        <Text style={styles.description}>
                            We’re excited to have you onboard. Thank you for helping us build a platform that makes legal support more accessible and simple.{"\n\n"}
                            Contact: info@lawneeds.co.uk
                        </Text>
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
    heading: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(16),
        color: COLORS.PrimaryColorText,
        marginBottom: SPACING.sm,
    },
    text: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
        color: COLORS.PrimaryColorText,
        marginBottom: SPACING.sm,
    },
    description: {
        fontFamily: "InstrumentSansRegular",
        fontSize: RFValue(14),
        color: COLORS.PrimaryColorText,
        lineHeight: 22,
    },
});

export default BetaInstructions;

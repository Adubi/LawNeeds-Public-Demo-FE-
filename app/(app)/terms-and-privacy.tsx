import React, {useEffect} from "react";
import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {WebView} from "react-native-webview";
import {MaterialIcons} from "@expo/vector-icons";
import {COLORS} from "@/constants/colors";
import {router, useLocalSearchParams} from "expo-router";
import {SPACING} from "@/constants/theme";
import {cancellationPolicy, faqs, privacy_policy_url} from "@/services/httpservice";

import {useTranslation} from 'react-i18next';
import {RFValue} from "react-native-responsive-fontsize";

export default function TermsPrivacy() {

    const {t} = useTranslation();

    const params = useLocalSearchParams();
    const terms_endpoint = Array.isArray(params.terms_endpoint) ? params.terms_endpoint[0] : params.terms_endpoint;
    const isFaq = Array.isArray(params.isFaq) ? params.isFaq[0] : params.isFaq;

    let title = t('terms_n_conditions')
    if (isFaq) {
        title = t('faqs')
    }
    const [pageTitle, setPageTitle] = React.useState(title);

    useEffect(() => {

        if (terms_endpoint === privacy_policy_url) {
            setPageTitle(t('privacy_policy'));
        } else if (terms_endpoint === faqs) {
            setPageTitle(t('faqs'));
        } else if (terms_endpoint === cancellationPolicy) {
            setPageTitle(t('cancellation_policy'));
        } else {
            setPageTitle(t('terms_n_conditions'));
        }

    }, [terms_endpoint, t]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={{flex: 1}}>

                {/*<View style={styles.headerContainer}>*/}

                {/*        /!*<TouchableOpacity*!/*/}
                {/*        /!*    onPress={() => {*!/*/}
                {/*        /!*        router.back();*!/*/}
                {/*        /!*    }}*!/*/}
                {/*        /!*    style={styles.backButton}*!/*/}
                {/*        /!*>*!/*/}
                {/*        /!*    <MaterialIcons name="arrow-back-ios" size={24}  color={COLORS.PrimaryColor}/>*!/*/}
                {/*        /!*</TouchableOpacity>*!/*/}

                {/*        /!*<Text style={styles.title} allowFontScaling={false}>*!/*/}
                {/*        /!*    {pageTitle}*!/*/}
                {/*        /!*</Text>*!/*/}
                {/*    <TouchableOpacity*/}
                {/*        onPress={() =>  router.back()}*/}
                {/*        style={styles.backButton}*/}
                {/*        accessibilityRole="button"*/}
                {/*        accessibilityLabel={t('change_email.go_back')}*/}
                {/*    >*/}
                {/*        <MaterialIcons name="arrow-back-ios" size={24}/>*/}
                {/*    </TouchableOpacity>*/}
                {/*    <Text style={styles.title} allowFontScaling={false}>*/}
                {/*        {pageTitle}*/}
                {/*    </Text>*/}

                {/*</View>*/}
                <View style={{flexDirection: "row", alignItems: "center", padding: SPACING.md,}}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                        accessibilityRole="button"
                        accessibilityLabel={t('change_email.go_back')}
                    >
                        <MaterialIcons name="arrow-back-ios" size={24}/>
                    </TouchableOpacity>
                    <Text style={styles.title} allowFontScaling={false}>
                        {pageTitle}
                    </Text>


                </View>

                {/* WebView */}
                <WebView
                    source={{uri: terms_endpoint || ""}}
                    style={styles.webView}
                    javaScriptEnabled
                    domStorageEnabled
                />
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BackgroundColor,
    },
    webView: {
        flex: 1,
    },
    closeButton: {
        position: "absolute",
        top: 20,
        right: 20,
        zIndex: 10,
        backgroundColor: "#fff",
        padding: 6,
        borderRadius: 20,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
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
});

import React, {useState} from 'react';
import {WebView} from 'react-native-webview';
import {useRoute} from '@react-navigation/native';
import {useNavigationContainerRef, useRouter} from "expo-router";
import {MaterialIcons} from "@expo/vector-icons";

import {useTranslation} from "react-i18next";
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {heightPercentageToDP as hp} from "react-native-responsive-screen";
import {COLORS} from "@/constants/colors";
import {SafeAreaView} from "react-native-safe-area-context";
import {RFValue} from "react-native-responsive-fontsize";

export default function DocumentViewer() {

    const {t} = useTranslation();

    const route = useRoute();
    const {documentUrl} = (route.params || {}) as {documentUrl?: string};
    const navRef = useNavigationContainerRef();
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const encodedUrl = encodeURIComponent(documentUrl || "");

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <View style={styles.container}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            onPress={async () => {
                                if (navRef.canGoBack()) {
                                    router.back();
                                } else {
                                    router.push("/");
                                }
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={t('change_email.go_back')}
                            style={styles.backButton}
                        >
                            <MaterialIcons name="arrow-back-ios" size={24} color="#333"/>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle} allowFontScaling={false}>
                            {t('document_view')}
                        </Text>
                    </View>
                </View>


                {/* WebView */}
                <View style={styles.webviewContainer}>
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.loadingText}>{t('loading_document') || 'Loading document...'}</Text>
                        </View>
                    )}
                    <WebView
                        source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodedUrl}` }}
                        style={{ flex: 1, margin: 0, padding: 0 }}
                        scalesPageToFit={true}
                        onLoadEnd={() => setLoading(false)}
                        startInLoadingState={true}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.BackgroundColor,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.BackgroundColor,
    },
    header: {
        paddingHorizontal: 16,
        width: "100%",
        height: hp(8),
        flexDirection: "row",
        alignItems: "center",
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: RFValue(18),
        fontWeight: '600',
        color: COLORS.PrimaryColorText,
    },
    webviewContainer: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    webview: {
        flex: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffffcc',
    },
    loadingText: {
        marginTop: 10,
        color: '#555',
        fontSize: 14,
    },
});

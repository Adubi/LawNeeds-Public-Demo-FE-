import 'react-native-gesture-handler';
import {Stack, useRouter} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {useFonts} from "expo-font";
import 'react-native-get-random-values';
import {StatusBar} from "expo-status-bar";
import React, {useEffect, useState} from "react";
import "react-native-reanimated";
import {AppProvider} from "@/contexts/AppContext";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {I18nextProvider} from 'react-i18next';
import i18n, {initI18n} from '../components/i18n';
import {KeyboardProvider} from "react-native-keyboard-controller";
import NotificationHandler from "@/app/(app)/NotificationHandler";
import Purchases from 'react-native-purchases';
import {Platform} from "react-native";
import mobileAds from 'react-native-google-mobile-ads';
import AppsFlyerHelper from "@/helpers/AppsFlyerHelper"; // deep link + attribution
import Analytics from "@/helpers/AnalyticsHelper"; // Firebase + AF event helper
import analytics from "@react-native-firebase/analytics";
import crashlytics from "@react-native-firebase/crashlytics";
import {requestTrackingPermissionsAsync} from 'expo-tracking-transparency';
import {DefaultTheme, ThemeProvider} from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import {StripeProvider} from "@stripe/stripe-react-native";
import TopBanner from "@/components/TopBanner";
import {useScreenTracking} from "@/app/(app)/useScreenTracking";
import AppUpdateGate from "@/components/AppUpdateGate";

const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const appsFlayerKey = process.env.EXPO_PUBLIC_APPS_FLAYER_KEY;
const iosAppId = process.env.EXPO_PUBLIC_IOS_APP_ID;
const publishableKey = process.env.EXPO_PUBLIC_PUBLISHABLE_KEY;

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

    useScreenTracking();   // ← add this line

    const [ready, setReady] = useState(false);
    const [fontsLoaded] = useFonts({
        InstrumentSansBold: require("@/assets/fonts/InstrumentSans-Bold.ttf"),
        InstrumentSansMedium: require("@/assets/fonts/InstrumentSans-Medium.ttf"),
        InstrumentSansRegular: require("@/assets/fonts/InstrumentSans-Regular.ttf"),
        InstrumentSansSemiBold: require("@/assets/fonts/InstrumentSans-SemiBold.ttf"),
    });

    // ─── i18n init ────────────────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                await initI18n();
            } catch (e) {
                console.error("Initialization failed:", e);
            } finally {
                setReady(true);
            }
        })();
    }, []);

    // ─── App-level init ───────────────────────────────────────────────────────
    useEffect(() => {
        // RevenueCat
        if (
            (Platform.OS === 'android' && !androidKey) ||
            (Platform.OS === 'ios' && !iosKey)
        ) {
            console.warn("RevenueCat key missing");
        } else {
            Purchases.configure({
                apiKey: Platform.OS === 'android' ? androidKey! : iosKey!,
            });
        }

        const initializePrivacySensitiveServices = async () => {
            try {
                await crashlytics().setCrashlyticsCollectionEnabled(true);
                await analytics().setAnalyticsCollectionEnabled(true);

                let trackingAllowed = Platform.OS !== "ios";

                if (Platform.OS === "ios") {
                    const {status} = await requestTrackingPermissionsAsync();
                    trackingAllowed = status === "granted";
                }

                Analytics.setAppsFlyerEnabled(trackingAllowed);

                await mobileAds().initialize();

                if (trackingAllowed) {
                    const isIOS = Platform.OS === "ios";
                    if (appsFlayerKey && (isIOS ? iosAppId : true)) {
                        await AppsFlyerHelper.init({
                            devKey: appsFlayerKey,
                            appId: isIOS ? iosAppId! : "",
                            isDebug: __DEV__,
                        });

                        setTimeout(async () => {
                            const attribution = await AppsFlyerHelper.getAttribution();
                            if (attribution) {
                                console.debug("[Attribution]", attribution);
                            }

                            await Analytics.init({
                                language: i18n.language ?? 'en',
                            });
                        }, 2000);
                    }
                }

                await Analytics.appOpen();
            } catch (e) {
                console.warn("Privacy-sensitive service init failed:", e);
            }
        };

        initializePrivacySensitiveServices();

        // Android notification channel
        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('high_importance_channel', {
                name: 'High Importance Notifications',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#DD8550',
                sound: 'default',
            });
        }
    }, []);

    // ─── Deep link handler (runs after navigation is mounted) ─────────────────
    // useEffect(() => {
    //     AppsFlyerHelper.registerDeepLinkHandler((flow, deepLink) => {
    //         console.debug("[DeepLink] flow:", flow, deepLink);
    //         switch (flow) {
    //             case 'immigration': router.push('/immigration'); break;
    //             case 'employment':  router.push('/employment');  break;
    //             case 'housing':     router.push('/housing');     break;
    //             case 'family':      router.push('/family');      break;
    //             case 'paywall':     router.push('/paywall');     break;
    //             default:            router.push('/');            break;
    //         }
    //     });
    // }, []);

    // ─── Splash hide ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (ready && fontsLoaded) SplashScreen.hideAsync();
    }, [ready, fontsLoaded]);

    if (!ready || !fontsLoaded) return null;

    return (
        <GestureHandlerRootView style={{flex: 1}}>

            <ThemeProvider value={DefaultTheme}>
                <StripeProvider publishableKey={publishableKey ?? ""}>
                    <I18nextProvider i18n={i18n}>
                        <KeyboardProvider>
                            <AppProvider>
                                <NotificationHandler/>
                                <TopBanner/>
                                <AppUpdateGate/>
                                <Stack
                                    screenOptions={{
                                        headerShown: false,
                                        navigationBarHidden: true,
                                    }}
                                >
                                    <Stack.Screen name="index"/>
                                    <Stack.Screen
                                        name="welcome"
                                        options={{gestureEnabled: false}}
                                    />
                                    <Stack.Screen
                                        name="(app)"
                                        options={{gestureEnabled: false}}
                                    />
                                    <Stack.Screen name="+not-found"/>
                                </Stack>
                                <StatusBar style="auto"/>

                            </AppProvider>
                        </KeyboardProvider>
                    </I18nextProvider>
                </StripeProvider>
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}

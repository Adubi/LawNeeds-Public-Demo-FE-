import {Tabs, usePathname, useRouter} from "expo-router";
import React, {useEffect, useRef, useState} from "react";
import {AccessibilityInfo, Animated, DeviceEventEmitter, Image, Platform, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {BlurView} from "expo-blur";
import {useSafeAreaInsets} from "react-native-safe-area-context";

import {HapticTab} from "@/components/HapticTab";
import {COLORS} from "@/constants/colors";
import {SPACING} from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useTranslation} from 'react-i18next';
import {ProTypes} from "@/constants/protypes";
import {registerDevice} from "@/services/apiHelper";
import Purchases from "react-native-purchases";
import {useApp} from "@/contexts/AppContext";
import {buildSubscriptionSyncPayload} from "@/services/SubscriptionSyncPayload";
import {syncSubscriptionFirstTime} from "@/services/subscriptionHelper";
import {getUserData, isProUser, saveLastSyncedSubscription} from "@/constants/Utility";
import Analytics, {UserType as AnalyticsUserType} from "@/helpers/AnalyticsHelper";
import i18n from "@/components/i18n";
import {
    getIdentityVerificationStatus,
    identityVerificationIsRequired,
    isIdentityProtectedPath,
    requireIdentityVerification,
} from "@/services/identityVerificationGate";
import ImmigrationProfileGate from "@/components/Profile/ImmigrationProfileGate";
import {
    isDeferredProfileComplete,
    PROFILE_COMPLETION_PROMPT_KEY,
    PROFILE_COMPLETION_UPDATED_EVENT,
} from "@/constants/onboarding";
import UserService from "@/services/UserServices";

const TAB_BAR_HEIGHT = 78;

function GlassTabBarBackground() {
    return (
        <View pointerEvents="none" style={styles.glassBackground}>
            <BlurView
                tint="light"
                intensity={75}
                experimentalBlurMethod={Platform.OS === "android" ? "dimezisBlurView" : "none"}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassCreamTint}/>
            <View style={styles.glassInnerEdge}/>
        </View>
    );
}

function TabLabel({focused, children, isSearch = false}: {focused: boolean; children: React.ReactNode; isSearch?: boolean}) {
    return (
        <Text style={[styles.tabLabel, focused && styles.tabLabelFocused, isSearch && styles.searchTabLabel]}>
            {children}
        </Text>
    );
}

export default function TabLayout() {

    const lastPressTimeRef = useRef(0);
    const [updatePath, setUpdatePath] = useState(false)
    const [isShowSearch, setShowSearch] = useState(false)
    const [showProfilePrompt, setShowProfilePrompt] = useState(false);
    const [profilePromptChecked, setProfilePromptChecked] = useState(false);
    const profilePromptOpacity = useRef(new Animated.Value(0)).current;
    const profilePromptTranslateY = useRef(new Animated.Value(8)).current;

    const router = useRouter();
    const currentPath = usePathname();
    const {t} = useTranslation();
    const {setUserStatus, refreshPlanInfo} = useApp();
    const insets = useSafeAreaInsets();
    const tabBarBottom = Math.max(insets.bottom, SPACING.sm);

    const checkProStatus = async (): Promise<boolean> => {
        const userType = await AsyncStorage.getItem("user_type");

        if (!userType) return false;

        const proTypes = [
            ProTypes.LAWYER,
            ProTypes.LAW_FIRM,
            ProTypes.HR_LEGAL,
            ProTypes.A2J_PARTNERS,
        ];

        return proTypes.includes(userType as ProTypes);
    };

    const loadUserInfo = async () => {
        try {

            const loginUserData = await getUserData();
            const userId = loginUserData?.id;
            const userType = await AsyncStorage.getItem("user_type");


            if (!userId) {
                console.warn("No userId found. Skipping subscription sync.");
                return;
            }
            const appUserId = userId.toString();
            const { customerInfo } = await Purchases.logIn(appUserId);
           // await Purchases.restorePurchases()
            const payload = buildSubscriptionSyncPayload(customerInfo, appUserId);

            try {
                await syncSubscriptionFirstTime(payload);
                await saveLastSyncedSubscription(payload);
                refreshPlanInfo();
            } catch (error) {
                console.error("Sync failed", error);
                refreshPlanInfo();
            }

            await Analytics.init({
                 userId:   userId,
                 userType: userType ? userType as AnalyticsUserType : undefined,
                language: i18n.language ?? 'en',
                // country: 'GB',           ← from device locale or user profile
            });

        } catch (e) {
            console.log("Failed to fetch customer info", e);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const initialize = async () => {
            // Register Device
            const push_token = await AsyncStorage.getItem("push_token");
            if (push_token) {
                registerDevice(push_token, () => {}, () => {});
            }

            // Check Pro Status
            const result = await checkProStatus();
            if (isMounted) {
                setShowSearch(!result); // Search is usually for clients, not Pros
                setUserStatus(result);
                if (!result) {
                    try {
                        const verificationStatus = await getIdentityVerificationStatus();
                        if (!identityVerificationIsRequired(verificationStatus)) {
                            loadUserInfo();
                        }
                    } catch (error) {
                        console.warn("Skipping subscription sync because identity status is unavailable:", error);
                    }
                }
            }
        };

        initialize();
        return () => { isMounted = false; }; // Cleanup to prevent state updates on unmounted component
    }, []);

    useEffect(() => {
        let active = true;

        const hideProfilePrompt = async () => {
            await AsyncStorage.removeItem(PROFILE_COMPLETION_PROMPT_KEY);
            Animated.timing(profilePromptOpacity, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            }).start(() => {
                if (active) setShowProfilePrompt(false);
            });
        };

        const completionSubscription = DeviceEventEmitter.addListener(
            PROFILE_COMPLETION_UPDATED_EVENT,
            (profile) => {
                if (isDeferredProfileComplete(profile)) {
                    hideProfilePrompt().catch((error) => {
                        console.warn("Unable to hide profile completion prompt:", error);
                    });
                }
            },
        );

        const showPendingProfilePrompt = async () => {
            const pending = await AsyncStorage.getItem(PROFILE_COMPLETION_PROMPT_KEY);
            if (!active) return;

            if (await checkProStatus()) {
                await AsyncStorage.removeItem(PROFILE_COMPLETION_PROMPT_KEY);
                setProfilePromptChecked(true);
                return;
            }

            try {
                const response = await UserService.GetProfile();
                if (isDeferredProfileComplete(response?.profile)) {
                    await AsyncStorage.removeItem(PROFILE_COMPLETION_PROMPT_KEY);
                    setProfilePromptChecked(true);
                    return;
                }

                await AsyncStorage.setItem(PROFILE_COMPLETION_PROMPT_KEY, "true");
            } catch (error) {
                console.warn("Unable to confirm profile completion:", error);
                if (pending !== "true") {
                    setProfilePromptChecked(true);
                    return;
                }
            }

            setShowProfilePrompt(true);
            setProfilePromptChecked(true);
            const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();

            if (reduceMotion) {
                profilePromptOpacity.setValue(1);
                profilePromptTranslateY.setValue(0);
            } else {
                Animated.parallel([
                    Animated.timing(profilePromptOpacity, {
                        toValue: 1,
                        duration: 250,
                        useNativeDriver: true,
                    }),
                    Animated.spring(profilePromptTranslateY, {
                        toValue: 0,
                        damping: 12,
                        stiffness: 180,
                        useNativeDriver: true,
                    }),
                ]).start();
            }
        };

        showPendingProfilePrompt().catch((error) => {
            console.warn("Unable to show profile completion prompt:", error);
            if (active) setProfilePromptChecked(true);
        });

        return () => {
            active = false;
            completionSubscription.remove();
        };
    }, [profilePromptOpacity, profilePromptTranslateY]);


    // Function to navigate to a specific screen
    const navigateToScreen = async (screenName: string, event: any) => {

        // Extract the basic path from screenName (remove any query params)
        let targetPath = screenName.split('?')[0];

        if (isIdentityProtectedPath(targetPath) && !await requireIdentityVerification()) {
            return;
        }

        if (targetPath === '/profile' && await checkProStatus()) {
            targetPath = '/profile/profile-pro-user';
        }

        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastPressTimeRef.current < DOUBLE_TAP_DELAY) {
            router.push('/'); // Reset to home on double tap
        } else if (currentPath !== targetPath && targetPath !== "") {
            router.push(targetPath as any);
        }

        lastPressTimeRef.current = now;
    };

    return (
        <>
        <Tabs
            screenOptions={{
                tabBarHideOnKeyboard: true,
                tabBarActiveTintColor: COLORS.PrimaryColorText,
                tabBarLabelPosition: "below-icon",
                tabBarBackground: () => <GlassTabBarBackground/>,
                headerShown: false,

                tabBarButton: (props) => (
                    <HapticTab
                        {...props}
                        onPress={(e: any) => {
                            navigateToScreen(props.href || '', e)
                        }}

                    />
                ),
                tabBarItemStyle: {
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 60,
                    marginHorizontal: 2,
                    marginVertical: 8,
                },
                tabBarStyle: {
                    position: "absolute",
                    left: SPACING.md,
                    right: SPACING.md,
                    bottom: tabBarBottom,
                    height: TAB_BAR_HEIGHT,
                    paddingHorizontal: SPACING.xs,
                    paddingTop: 0,
                    paddingBottom: 0,
                    backgroundColor: "transparent",
                    borderTopWidth: 1,
                    borderWidth: 1,
                    borderColor: "rgba(3, 49, 38, 0.20)",
                    borderRadius: 32,
                    shadowColor: COLORS.PrimaryColorText,
                    shadowOffset: {width: 0, height: 10},
                    shadowOpacity: 0.16,
                    shadowRadius: 20,
                    elevation: 12,
                },
            }}
            initialRouteName="index"
        >
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarLabel: ({focused}) => (
                        <TabLabel focused={focused}>{t('tab.account')}</TabLabel>
                    ),
                    tabBarIcon: ({focused, color}) => (
                        <Image
                            style={{
                                height: 24,
                                width: 24,
                            }}
                            source={
                                focused ? require("@/assets/images/ic_profile_selected.png")
                                    : require("@/assets/images/ic_profile.png")}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="inbox"
                options={{
                    tabBarLabel: ({focused}) => (
                        <TabLabel focused={focused}>{t('tab.inbox')}</TabLabel>
                    ),
                    tabBarIcon: ({focused, color}) => (
                        <Image
                            style={{
                                height: 24,
                                width: 24,
                            }}
                            source={
                                focused ? require("@/assets/images/inbox_selected.png")
                                    : require("@/assets/images/inbox.png")}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="index"
                options={{
                    tabBarAccessibilityLabel: t('tab.home'),
                    tabBarLabel: ({focused}) => (
                        <TabLabel focused={focused}>{t('tab.home')}</TabLabel>
                    ),
                    tabBarIcon: ({focused}) => (
                        <View
                            accessible={false}
                            style={[styles.homeTabIcon, focused && styles.homeTabIconFocused]}
                        >
                            <MaterialCommunityIcons
                                accessible={false}
                                name="gavel"
                                size={24}
                                color={COLORS.White}
                                style={{transform: [{scaleX: -1}]}}
                            />
                        </View>
                    ),
                }}
            />

            <Tabs.Screen
                name="search"
                listeners={({navigation}) => ({
                    tabPress: (e) => {
                        const now = Date.now();

                        if (!isShowSearch) {
                            e.preventDefault(); // Prevent default if href is null
                        }

                        if (now - lastPressTimeRef.current < 300) {
                            // Double tap -> navigate

                            setUpdatePath(!updatePath)
                        }

                        lastPressTimeRef.current = now;
                    },
                })}

                options={{
                    tabBarLabel: ({focused}) => (
                        <TabLabel focused={focused} isSearch>{t('tab.search')}</TabLabel>
                    ),
                    tabBarIcon: ({focused}) => (
                        <Image
                            style={styles.searchTabIcon}
                            source={focused
                                ? require("@/assets/images/search-icon-selected.png")
                                : require("@/assets/images/search-icon.png")}
                        />
                    ),
                    href: (isShowSearch ? updatePath ? "/" : "/search/" : null) as any,
                }}
            />


            <Tabs.Screen
                name="settings"
                options={{
                    tabBarLabel: ({focused}) => (
                        <TabLabel focused={focused}>{t('tab.settings')}</TabLabel>
                    ),
                    tabBarIcon: ({focused, color}) => (
                        <Image
                            style={{
                                height: 24,
                                width: 24,
                            }}
                            source={
                                focused ? require("@/assets/images/ic_setting_selected.png")
                                    : require("@/assets/images/ic_setting.png")}
                        />
                    ),
                }}
            />

        </Tabs>
        {showProfilePrompt && (
            <View
                pointerEvents="box-none"
                style={[styles.profilePromptLayer, {paddingBottom: TAB_BAR_HEIGHT + tabBarBottom + SPACING.md}]}
            >
                <Animated.View
                    style={[
                        styles.profilePrompt,
                        {
                            opacity: profilePromptOpacity,
                            transform: [{translateY: profilePromptTranslateY}],
                        },
                    ]}
                >
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Please complete your profile"
                        accessibilityHint="Opens the Profile tab"
                        activeOpacity={0.85}
                        onPress={() => {
                            router.push("/(app)/(tabs)/profile");
                        }}
                    >
                        <Text style={styles.profilePromptText}>Please complete your profile</Text>
                    </TouchableOpacity>
                    <View style={styles.profilePromptArrow}/>
                </Animated.View>
            </View>
        )}
        {profilePromptChecked && <ImmigrationProfileGate/>}
        </>
    );
}

const styles = StyleSheet.create({
    tabLabel: {
        color: COLORS.PrimaryColorText,
        fontFamily: "InstrumentSansRegular",
        fontSize: 12,
        lineHeight: 16,
        textAlign: "center",
    },
    tabLabelFocused: {
        fontFamily: "InstrumentSansSemiBold",
    },
    searchTabLabel: {
        transform: [{translateY: 13}],
    },
    searchTabIcon: {
        width: 28,
        height: 28,
        transform: [{translateY: 10}],
    },
    glassBackground: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 32,
        overflow: "hidden",
        backgroundColor: "rgba(255, 247, 237, 0.32)",
    },
    glassCreamTint: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255, 247, 237, 0.40)",
    },
    glassInnerEdge: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 31,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.54)",
    },
    homeTabIcon: {
        width: 44,
        height: 44,
        marginTop: -8,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.PrimaryColorText,
        borderWidth: 2,
        borderColor: COLORS.BackgroundColor,
        shadowColor: COLORS.Black,
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.22,
        shadowRadius: 5,
        elevation: 5,
    },
    homeTabIconFocused: {
        backgroundColor: COLORS.SecodaryColor,
        transform: [{scale: 1.04}],
    },
    profilePromptLayer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        justifyContent: "flex-end",
        alignItems: "flex-start",
        paddingLeft: SPACING.sm,
    },
    profilePrompt: {
        maxWidth: 230,
        borderRadius: 12,
        backgroundColor: COLORS.PrimaryColorText,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        shadowColor: COLORS.Black,
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 6,
    },
    profilePromptText: {
        color: COLORS.White,
        fontFamily: "InstrumentSansSemiBold",
        fontSize: 14,
        lineHeight: 20,
    },
    profilePromptArrow: {
        position: "absolute",
        bottom: -9,
        left: 28,
        width: 0,
        height: 0,
        borderLeftWidth: 9,
        borderRightWidth: 9,
        borderTopWidth: 10,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopColor: COLORS.PrimaryColorText,
    },
});

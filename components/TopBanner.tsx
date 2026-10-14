import React, {useEffect, useRef} from "react";
import {
    Animated,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    PanResponder
} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useApp} from "@/contexts/AppContext";
import {router} from "expo-router";
import { COLORS as c } from "@/constants/colors";
import {MaterialIcons} from "@expo/vector-icons";
import {isProUser} from "@/constants/Utility";
import {NOTIFICATION_TYPES} from "@/constants/NOTIFICATION_TYPES";


const TopBanner = () => {
    const { banner, hideBanner } = useApp();
    const insets = useSafeAreaInsets();

    const translateY = useRef(new Animated.Value(-150)).current;
    const translateX = useRef(new Animated.Value(0)).current;

    // 🔥 Slide animation
    useEffect(() => {
        if (banner?.visible) {
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                damping: 18,
                stiffness: 120,
            }).start();
        } else {
            Animated.timing(translateY, {
                toValue: -150,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [banner]);

    // 🔥 Auto hide (like WhatsApp)
    useEffect(() => {
        if (banner?.visible) {

            const timeout = banner.data.type === "message" ? 8000 : 4000

            const timer = setTimeout(() => {
                hideBanner();
            }, timeout);

            return () => clearTimeout(timer);
        }
    }, [banner]);

    // 🔥 Swipe to dismiss
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gesture) =>
                Math.abs(gesture.dx) > 10,

            onPanResponderMove: (_, gesture) => {
                translateX.setValue(gesture.dx);
            },

            onPanResponderRelease: (_, gesture) => {
                if (Math.abs(gesture.dx) > 120) {
                    Animated.timing(translateX, {
                        toValue: gesture.dx > 0 ? 500 : -500,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(hideBanner);
                } else {
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    if (!banner) return null;

    const handlePress = async () => {
        hideBanner();

        const data = banner?.data;
        if (!data) return;

        const isUser = await isProUser();

        setTimeout(() => {


            switch (data.type) {
                case NOTIFICATION_TYPES.NEW_MESSAGE:
                case NOTIFICATION_TYPES.PAYMENT_CONFIRMED:
                case NOTIFICATION_TYPES.ONE_MINUTE_WARNING:
                case NOTIFICATION_TYPES.DAY_COMPLETED:
                case "message":
                case NOTIFICATION_TYPES.CONSULTATION_EXTENDED:

                    router.push({
                        pathname: "/requestFlow/ConsultationScreen",
                        params: {
                            referral_id: String(data.referral_id),
                            isUserPro: String(isUser),
                            session_id: String(data.session_id),
                        },
                    });
                    break;

                case NOTIFICATION_TYPES.NEW_REFERRAL:
                case NOTIFICATION_TYPES.REFERRAL_ACCEPTED:
                case "request_created":
                case "first_message":
                    router.push({
                        pathname: "/(app)/requestFlow/RequestDetails",
                        params: {
                            referral_id: String(data.referral_id),
                            isUserPro: String(isUser),
                            session_id: String(data.session_id),
                        },
                    });
                    break;

                case NOTIFICATION_TYPES.REFERRAL_REJECTED:
                case "new_request":
                    router.push("/(app)/(tabs)/inbox");
                    break;

                case NOTIFICATION_TYPES.SESSION_ENDED:
                    router.push({
                        pathname: "/(app)/requestFlow/RequestDetails",
                        params: {
                            referral_id: String(data.referral_id),
                            isUserPro: String(isUser),
                            session_id: String(data.session_id),
                        },
                    });
                    break;

                default:
                    console.log("No navigation for banner type:", data.type);
            }
        }, 100);
    };

    // 🎨 Theme-based colors
    const getBackgroundColor = () => {
        switch (banner.data?.type) {
            case NOTIFICATION_TYPES.NEW_MESSAGE:
                return c.PrimaryColor;

            case NOTIFICATION_TYPES.NEW_REFERRAL:
            case NOTIFICATION_TYPES.REFERRAL_ACCEPTED:
                return c.PrimaryColor;

            case NOTIFICATION_TYPES.PAYMENT_CONFIRMED:
                return c.SecodaryColor;

            default:
                return c.SecodaryColor;
        }
    };

    const getIcon = () => {
        switch (banner.data?.type) {
            case NOTIFICATION_TYPES.NEW_MESSAGE:
                return "chat";

            case NOTIFICATION_TYPES.NEW_REFERRAL:
            case NOTIFICATION_TYPES.REFERRAL_ACCEPTED:
                return "verified";

            case NOTIFICATION_TYPES.PAYMENT_CONFIRMED:
                return "payments";

            case NOTIFICATION_TYPES.ONE_MINUTE_WARNING:
                return "timer";

            case NOTIFICATION_TYPES.SESSION_ENDED:
                return "event-available";

            default:
                return "notifications";
        }
    };

    return (
        <Animated.View
            {...panResponder.panHandlers}
            style={[
                styles.wrapper,
                {
                    paddingTop:
                        Platform.OS === "android"
                            ? StatusBar.currentHeight
                            : insets.top,
                    transform: [
                        { translateY },
                        { translateX }
                    ],
                },
            ]}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={handlePress}
                style={[
                    styles.banner,
                    { backgroundColor: getBackgroundColor() }
                ]}
            >
                {/* 🔥 Icon */}
                <MaterialIcons
                    name={getIcon()}
                    size={22}
                    color="#fff"
                    style={{ marginRight: 12 }}
                />

                {/* 🔥 Text */}
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{banner.title}</Text>
                    <Text style={styles.body} numberOfLines={2}>
                        {banner.body}
                    </Text>
                </View>

                {/* 🔥 Close */}
                <TouchableOpacity onPress={hideBanner}>
                    <MaterialIcons name="close" size={20} color="#fff" />
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default TopBanner;

const styles = StyleSheet.create({
    wrapper: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 9999,
    },
    banner: {
        flexDirection: "row",
        alignItems: "center",
        width: "92%",
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,

        // 🔥 Shadow (iOS)
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,

        // 🔥 Elevation (Android)
        elevation: 6,
    },
    title: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 14,
    },
    body: {
        color: "#fff",
        fontSize: 13,
        marginTop: 2,
        opacity: 0.9,
    },
});

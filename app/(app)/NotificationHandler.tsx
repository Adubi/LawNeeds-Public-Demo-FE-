import { useApp } from "@/contexts/AppContext";
import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerDevice } from "@/services/apiHelper";
import {
  Alert,
  AppState,
  AppStateStatus,
  DeviceEventEmitter,
  InteractionManager,
  Linking,
  Platform,
} from "react-native";
import { getAuthToken } from "@/services/httpservice";
import { router } from "expo-router";
import { isProUser } from "@/constants/Utility";
import messaging from "@react-native-firebase/messaging";
import { getCurrentRoute } from "@/utils/navigationState";
import { useTranslation } from "react-i18next";
import { NOTIFICATION_TYPES } from "@/constants/NOTIFICATION_TYPES";
import {
  PROFILE_SURVEY_REQUEST_KEY,
  PROFILE_SURVEY_REQUESTED_EVENT,
} from "@/constants/onboarding";

import * as Notifications from "expo-notifications";

const NAVIGATION_READY_DELAY = 500; // ms to wait for router on cold start
const APNS_TOKEN_RETRY_DELAY = 500;
const APNS_TOKEN_RETRY_COUNT = 6;

const NotificationHandler = () => {
  const {
    setRefreshReloadCaseList,
    addNotification,
    showBanner,
    showExtendTimer,
  } = useApp();

  const { t } = useTranslation();
  const navigationReady = useRef(false);
  const pendingNotification = useRef<any>(null);
  const appStateRef = useRef(AppState.currentState); // ✅ Track app state

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        const previousState = appStateRef.current;
        appStateRef.current = nextState;

        // App came to foreground → clear badge
        if (
          (previousState === "background" || previousState === "inactive") &&
          nextState === "active"
        ) {
          clearBadge();
        }
      },
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Give expo-router time to fully mount the layout
    const timer = setTimeout(() => {
      navigationReady.current = true;
      if (pendingNotification.current) {
        navigateFromNotification(pendingNotification.current);
        pendingNotification.current = null;
      }
    }, NAVIGATION_READY_DELAY);

    return () => clearTimeout(timer);
  }, []);

  const requestPermission = async () => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert(
        t("per.permission_denied"),
        t("per.notification_permission_not_granted"),
      );
      return false;
    }
    return true;
  };

  const saveAndRegisterPushToken = async (token: string) => {
    await AsyncStorage.setItem("push_token", token);

    const authToken = await getAuthToken();
    if (authToken) {
      await registerDevice(
        token,
        () => console.log("✅ Device registered"),
        () => console.log("❌ Device registration failed"),
      );
    }
  };

  const waitForAPNSToken = async () => {
    for (let attempt = 0; attempt < APNS_TOKEN_RETRY_COUNT; attempt += 1) {
      const token = await messaging().getAPNSToken();
      if (token) return token;

      await new Promise((resolve) =>
        setTimeout(resolve, APNS_TOKEN_RETRY_DELAY),
      );
    }

    return null;
  };

  const registerForPushNotificationsAsync = async () => {
    try {
      if (Platform.OS === "ios") {
        if (!messaging().isDeviceRegisteredForRemoteMessages) {
          await messaging().registerDeviceForRemoteMessages();
        }

        const apnsToken = await waitForAPNSToken();
        if (!apnsToken) {
          console.warn(
            "APNs token is not available; FCM registration deferred.",
          );
          return;
        }
      }

      const token = await messaging().getToken();
      if (!token) return;

      await saveAndRegisterPushToken(token);
    } catch (e: any) {
      console.error("❌ FCM token error:", e);
    }
  };

  const shouldShowAlert = (data: any) => {
    const route = getCurrentRoute();
    if (route.name === "ConsultationScreen") {
      console.log("🚫 Skipping alert (already in same consultation)");
      return false;
    }
    return true;
  };

  const clearBadge = async () => {
    await Notifications.setBadgeCountAsync(0);
  };

  const incrementBadge = async () => {
    const current = await getBadgeCount();
    console.info(current);
    await Notifications.setBadgeCountAsync(current + 1);
  };

  // 🔥 CENTRAL HANDLER
  const navigateFromNotification = async (data: any) => {
    try {
      const isUser = await isProUser();

      switch (data.type) {
        case NOTIFICATION_TYPES.NEW_REFERRAL:
        case NOTIFICATION_TYPES.REFERRAL_ACCEPTED:
        case NOTIFICATION_TYPES.REQUEST_CREATED:
          if (!data.referral_id) return;
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
        case NOTIFICATION_TYPES.REFERRAL_UNDER_REVIEW:
        case NOTIFICATION_TYPES.REFERRAL_EXPIRED:
        case "new_request":
          router.push("/(app)/(tabs)/inbox");
          break;

        case NOTIFICATION_TYPES.CONSULTATION_BOOKED:
        case NOTIFICATION_TYPES.NEW_MESSAGE:
        case NOTIFICATION_TYPES.PAYMENT_CONFIRMED:
        case NOTIFICATION_TYPES.ONE_MINUTE_WARNING:
        case NOTIFICATION_TYPES.CONSULTATION_END_REQUESTED:
        case NOTIFICATION_TYPES.DAY_COMPLETED:
        case "message":
        case NOTIFICATION_TYPES.CONSULTATION_EXTENDED:
        case NOTIFICATION_TYPES.EXTENSION_STARTED:
        case NOTIFICATION_TYPES.EXTENSION_REQUESTED:
        case NOTIFICATION_TYPES.EXTENSION_APPROVED:
        case NOTIFICATION_TYPES.EXTENSION_PROPOSED:
        case NOTIFICATION_TYPES.EXTENSION_DENIED:
        case NOTIFICATION_TYPES.EXTENSION_PAYMENT_CONFIRMED:
        case NOTIFICATION_TYPES.EXTENSION_TIMED_OUT:
          if (!data.referral_id) return;

          router.push({
            pathname: "/(app)/requestFlow/ConsultationScreen",
            params: {
              referral_id: String(data.referral_id),
              isUserPro: String(isUser),
              session_id: String(data.session_id),
            },
          });
          break;

        case "first_message":
        case NOTIFICATION_TYPES.SESSION_ENDED:
          if (!data.referral_id) return;
          router.push({
            pathname: "/(app)/requestFlow/RequestDetails",
            params: {
              referral_id: String(data.referral_id),
              isUserPro: String(isUser),
              session_id: String(data.session_id),
            },
          });
          break;

        // Payout notifications carry session_id + referral_id, same shape
        // as the other consultation-session events above. Routes to the
        // existing ConsultationScreen (confirmed real route, matches
        // session_ended's destination). missed_consultation carries the
        // same referral_id/session_id shape, so it joins this block too.
        case NOTIFICATION_TYPES.PAYOUT_SENT:
        case NOTIFICATION_TYPES.PAYOUT_FAILED:
        case NOTIFICATION_TYPES.MISSED_CONSULTATION:
          if (!data.referral_id) return;
          router.push({
            pathname: "/(app)/requestFlow/ConsultationScreen",
            params: {
              referral_id: String(data.referral_id),
              isUserPro: String(isUser),
              session_id: String(data.session_id),
            },
          });
          break;

        case NOTIFICATION_TYPES.VERIFICATION_COMPLETED:
        case NOTIFICATION_TYPES.VERIFICATION_RESUBMISSION_REQUIRED:
        case NOTIFICATION_TYPES.VERIFICATION_NOT_COMMENCED:
        case NOTIFICATION_TYPES.VERIFICATION_ABANDONED:
          router.push("/(app)/identity-verification");
          break;

        case NOTIFICATION_TYPES.WELCOME_BACK:
          router.push("/(app)/(tabs)");
          break;

        case NOTIFICATION_TYPES.PROFILE_INCOMPLETE:
          router.push("/(app)/(tabs)/profile");
          break;

        case NOTIFICATION_TYPES.PROFILE_SURVEY_INCOMPLETE:
          await AsyncStorage.setItem(PROFILE_SURVEY_REQUEST_KEY, "true");
          router.push("/(app)/(tabs)");
          DeviceEventEmitter.emit(PROFILE_SURVEY_REQUESTED_EVENT);
          break;

        // TODO: No dedicated lawyer reviews screen exists in the app yet
        // (confirmed via file search — no "review"/"rating" route under app/).
        // Routing to the profile tab as a safe placeholder until a real
        // reviews screen is built and this can point at it directly.
        case NOTIFICATION_TYPES.NEW_REVIEW:
          router.push("/(app)/(tabs)/profile");
          break;

        // TODO: No dedicated lawyer dashboard screen exists in the app yet
        // (only app/(app)/(tabs)/profile was found). Routing to the profile
        // tab as a safe placeholder until a real dashboard screen is built.
        // response_rate_warning is the same kind of lawyer performance
        // signal as weekly_summary, so it shares this placeholder too.
        case NOTIFICATION_TYPES.WEEKLY_SUMMARY:
        case NOTIFICATION_TYPES.RESPONSE_RATE_WARNING:
          router.push("/(app)/(tabs)/profile");
          break;

        case NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRES_TODAY:
        case NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED:
          router.push("/(app)/manageSubscription/current-plan-screen");
          break;

        case NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED:
          router.push("/(app)/manageSubscription/upgrade-plans-screen");
          break;

        // app_update_available carries action='open_store' from the
        // backend (see FirebaseNotificationService.send_app_update_notification).
        // No in-app "what's new" screen exists yet, so this opens the
        // platform store page directly.
        case NOTIFICATION_TYPES.APP_UPDATE_AVAILABLE:
          Linking.openURL(
            Platform.OS === "ios"
              ? "https://apps.apple.com/us/app/lawneeds/id6557033638"
              : "https://play.google.com/store/apps/details?id=com.steve.LawNeeds",
          );
          break;

        default:
          console.log("⚠️ No navigation mapped for type:", data.type);
      }
    } catch (err) {
      console.error("❌ Navigation error:", err);
    }
  };

  const handleNotification = async (remoteMessage: any, source: string) => {
    const data = remoteMessage?.data;
    if (!data) return;

    addNotification();

    if (data?.type !== NOTIFICATION_TYPES.ONE_MINUTE_WARNING) {
      setRefreshReloadCaseList();
    }

    if (source === "foreground") {
      await clearBadge();

      if (shouldShowAlert(data)) {
        showBanner({
          type: data?.type || "default",
          title:
            remoteMessage?.notification?.title ||
            t("default_notification_title"),
          body: remoteMessage?.notification?.body || "",
          data,
        });
      }
      return; // No navigation for foreground
    }

    // await incrementBadge();

    if (source === "background") {
      InteractionManager.runAfterInteractions(() => {
        navigateFromNotification(data);

        if (
          data?.type === NOTIFICATION_TYPES.ONE_MINUTE_WARNING &&
          data?.referral_id
        ) {
          setTimeout(() => {
            showExtendTimer(data.referral_id, data.session_id);
          }, 800); // wait for screen to mount
        }
      });
      return;
    }

    if (source === "quit") {
      const doNavigate = () => {
        navigateFromNotification(data);
        if (
          data?.type === NOTIFICATION_TYPES.ONE_MINUTE_WARNING &&
          data?.referral_id
        ) {
          setTimeout(() => {
            showExtendTimer(data.referral_id, data.session_id);
          }, 1000);
        }
      };

      if (navigationReady.current) {
        doNavigate();
      } else {
        pendingNotification.current = data;
      }
    }
  };

  // Get current badge count
  const getBadgeCount = async (): Promise<number> => {
    return await Notifications.getBadgeCountAsync();
  };

  useEffect(() => {
    const initializePushNotifications = async () => {
      const permissionGranted = await requestPermission();
      if (permissionGranted) {
        await registerForPushNotificationsAsync();
      }
    };

    initializePushNotifications();

    const unsubscribeTokenRefresh = messaging().onTokenRefresh(
      saveAndRegisterPushToken,
    );
    const unsubscribeForeground = messaging().onMessage((remoteMessage) =>
      handleNotification(remoteMessage, "foreground"),
    );
    const unsubscribeOpened = messaging().onNotificationOpenedApp(
      (remoteMessage) => handleNotification(remoteMessage, "background"),
    );

    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          handleNotification(remoteMessage, "quit");
        }
      });

    return () => {
      unsubscribeTokenRefresh();
      unsubscribeForeground();
      unsubscribeOpened();
    };
  }, []);

  return null;
};

export default NotificationHandler;

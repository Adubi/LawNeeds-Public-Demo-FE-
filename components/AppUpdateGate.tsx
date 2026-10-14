import React, {useCallback, useEffect, useRef, useState} from "react";
import {
    AppState,
    AppStateStatus,
    Linking,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {MaterialIcons} from "@expo/vector-icons";
import {COLORS as c} from "@/constants/colors";
import {AppUpdateDecision, checkAppUpdatePolicy} from "@/services/AppUpdateService";

const SOFT_UPDATE_DISMISSED_AT_KEY = "soft_update_dismissed_at";
const SOFT_UPDATE_DISMISS_MS = 1000 * 60 * 60 * 24;

export default function AppUpdateGate() {
    const appStateRef = useRef(AppState.currentState);
    const checkingRef = useRef(false);
    const [decision, setDecision] = useState<AppUpdateDecision | null>(null);

    const openStore = useCallback(async () => {
        if (!decision?.storeUrl) return;
        try {
            await Linking.openURL(decision.storeUrl);
        } catch {
            // Keep the modal visible if the store URL cannot be opened.
        }
    }, [decision?.storeUrl]);

    const dismissSoftUpdate = useCallback(async () => {
        await AsyncStorage.setItem(SOFT_UPDATE_DISMISSED_AT_KEY, String(Date.now()));
        setDecision(null);
    }, []);

    const runUpdateCheck = useCallback(async () => {
        if (checkingRef.current) return;
        checkingRef.current = true;

        try {
            const nextDecision = await checkAppUpdatePolicy();
            if (!nextDecision) {
                setDecision(null);
                return;
            }

            if (nextDecision.type === "soft") {
                const dismissedAt = Number(
                    await AsyncStorage.getItem(SOFT_UPDATE_DISMISSED_AT_KEY)
                );
                if (dismissedAt && Date.now() - dismissedAt < SOFT_UPDATE_DISMISS_MS) {
                    return;
                }
            }

            setDecision(nextDecision);
        } catch {
            // Update checks should not block launch if Remote Config is temporarily unavailable.
        } finally {
            checkingRef.current = false;
        }
    }, []);

    useEffect(() => {
        runUpdateCheck();

        const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
            const becameActive =
                appStateRef.current.match(/inactive|background/) &&
                nextState === "active";

            appStateRef.current = nextState;
            if (becameActive) {
                runUpdateCheck();
            }
        });

        return () => subscription.remove();
    }, [runUpdateCheck]);

    if (!decision) return null;

    const isHardUpdate = decision.type === "hard";

    return (
        <Modal visible transparent animationType="fade" onRequestClose={isHardUpdate ? undefined : dismissSoftUpdate}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.iconWrap}>
                        <MaterialIcons name="system-update" size={28} color="#FFFFFF"/>
                    </View>
                    <Text style={styles.title}>
                        {isHardUpdate ? "Update required" : "Update available"}
                    </Text>
                    <Text style={styles.message}>{decision.message}</Text>

                    <View style={styles.actions}>
                        {!isHardUpdate && (
                            <Pressable onPress={dismissSoftUpdate} style={styles.secondaryButton}>
                                <Text style={styles.secondaryText}>Later</Text>
                            </Pressable>
                        )}
                        <Pressable onPress={openStore} style={styles.primaryButton}>
                            <Text style={styles.primaryText}>Update</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.48)",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    sheet: {
        width: "100%",
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        padding: 20,
        alignItems: "center",
    },
    iconWrap: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: c.SecodaryColor,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },
    title: {
        color: c.PrimaryColorText,
        fontSize: 20,
        fontFamily: "InstrumentSansSemiBold",
        textAlign: "center",
        marginBottom: 8,
    },
    message: {
        color: "#4B4B4B",
        fontSize: 15,
        lineHeight: 22,
        fontFamily: "InstrumentSansRegular",
        textAlign: "center",
    },
    actions: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 10,
        marginTop: 20,
        width: "100%",
    },
    secondaryButton: {
        flex: 1,
        height: 46,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#D0D0D0",
    },
    secondaryText: {
        color: c.PrimaryColorText,
        fontFamily: "InstrumentSansSemiBold",
    },
    primaryButton: {
        flex: 1,
        height: 46,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.SecodaryColor,
    },
    primaryText: {
        color: "#FFFFFF",
        fontFamily: "InstrumentSansSemiBold",
    },
});

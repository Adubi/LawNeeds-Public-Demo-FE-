import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import Modal from 'react-native-modal';
import {useTranslation} from "react-i18next";
import {getDailyPassOffering} from "@/constants/Utility";
import {findRevenueCatPackageForPlan} from "@/services/planToRevenueCat";

const {width} = Dimensions.get('window');

const COLORS = {
    PrimaryColor: '#176535',
    PrimaryColorText: '#033126',
    SecodaryColor: '#DD8550',
    Black: '#1d1d1d',
    White: '#ffffff',
    Gray: '#666666',
    Gray_2: '#B9B9B9',
    Gray_3: '#696969',
};
type Props = {
    visible: boolean;
    unlockAt: any;
    onStartAds: () => void;
    onUpgrade: () => void;
    onBuyPass: () => void;
    onClose: () => void;
};
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;


const FreemiumAdModal = ({
                             visible,
                             unlockAt,
                             onStartAds,
                             onUpgrade,
                             onBuyPass,
                             onClose,
                         }: Props) => {

    const {t} = useTranslation();

    const [loading, setLoading] = useState(false);
    const [dailyPassPrice, setDailyPassPrice] = useState("£4.99");
    const fallbackUnlockAtRef = useRef<number | null>(null);

    if (fallbackUnlockAtRef.current === null) {
        let parsedUnlockAt: number | null = null;

        if (typeof unlockAt === "string") {
            // Only append 'Z' if the string doesn't already have timezone info (+, -, or Z)
            const hasTimezone = /[Z+-]\d{2}:?\d{2}$|Z$/.test(unlockAt);
            const isoString = hasTimezone ? unlockAt : `${unlockAt}Z`;

            const date = new Date(isoString);

            if (!isNaN(date.getTime())) {
                parsedUnlockAt = date.getTime();
            }
        }

        if (typeof unlockAt === "number") {
            parsedUnlockAt = unlockAt;
        }

        fallbackUnlockAtRef.current =
            parsedUnlockAt && parsedUnlockAt > Date.now()
                ? parsedUnlockAt
                : Date.now() + SIX_HOURS_MS;

    }


    const resolvedUnlockAt = fallbackUnlockAtRef.current;
    const [remaining, setRemaining] = useState(resolvedUnlockAt - Date.now());

    useEffect(() => {
        if (!visible) return;

        const interval = setInterval(() => {
            setRemaining(Math.max(resolvedUnlockAt - Date.now(), 0));
        }, 1000);

        return () => clearInterval(interval);
    }, [visible, resolvedUnlockAt]);

    useEffect(() => {
        if (!visible) return;
        let isMounted = true;

        getDailyPassOffering().then((packages) => {
            if (!isMounted) return;
            const dailyPassPackage = findRevenueCatPackageForPlan(packages || [], "express-daily", "express");
            const priceString = dailyPassPackage?.product?.priceString;
            if (priceString) {
                setDailyPassPrice(priceString);
            }
        });

        return () => {
            isMounted = false;
        };
    }, [visible]);

    const formatTime = (ms: number) => {
        const total = Math.floor(ms / 1000);
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total % 60;
        return `${h.toString().padStart(2, '0')}:${m
            .toString()
            .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };


    return (
        <Modal
            isVisible={visible}
            animationIn="slideInUp"
            animationOut="slideOutDown"
            backdropOpacity={0.7}
            useNativeDriver
            hideModalContentWhileAnimating
            onBackdropPress={onClose}
            onBackButtonPress={onClose}
            onModalHide={() => setLoading(false)}
            style={styles.modalRoot}
        >
            <View style={styles.modalContent}>
                {!loading ? (
                    <>
                        <Text style={styles.lockIcon}>🔒</Text>

                        <Text style={styles.modalTitle}>{t('freemium.modal.title')}</Text>

                        <Text style={styles.modalSub}>
                            {t("freemium.modal.description", {
                                count:6,
                                hours: 6
                            })}
                        </Text>

                        <Text style={styles.timerLabel}>{t('freemium.modal.timer_label')}</Text>
                        <Text style={styles.timer}>{formatTime(remaining)}</Text>

                        {/* Upgrade */}
                        <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade}>
                            <Text style={styles.btnText}>{t('freemium.modal.upgrade_cta')}</Text>
                        </TouchableOpacity>

                        {/* Watch Ad */}
                        <TouchableOpacity style={styles.adBtn} onPress={onStartAds}>

                            <Text style={styles.btnText}>{t("freemium.modal.watch_ad_cta", {
                                count: 6
                            })}</Text>
                        </TouchableOpacity>

                        {/* Buy Pass */}
                        <TouchableOpacity style={styles.payBtn} onPress={onBuyPass}>

                            <Text style={styles.payText}>{t("freemium.modal.buy_pass", {
                                price: dailyPassPrice
                            })}</Text>

                        </TouchableOpacity>

                        <Text style={styles.limitNote}>
                            {t("freemium.modal.limit_note", {
                                count:6,
                                hours: 6
                            })}</Text>

                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.maybeLaterText}>{t('common.maybe_later')}</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={COLORS.PrimaryColor}/>
                        <Text style={styles.loadingText}>{t('freemium.modal.loading_text')}</Text>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalRoot: {
        margin: 0, // full screen
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: width * 0.85,
        backgroundColor: COLORS.White,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: COLORS.Black,
        shadowOffset: {width: 0, height: 10},
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.PrimaryColorText,
        marginBottom: 12,
        textAlign: 'center',
    },
    modalSub: {
        fontSize: 15,
        color: COLORS.Gray,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    adBtn: {
        width: '100%',
        backgroundColor: COLORS.PrimaryColor,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    payBtn: {
        width: '100%',
        backgroundColor: COLORS.SecodaryColor,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 4,
    },
    maybeLaterBtn: {
        width: '100%',
        marginTop: 12,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.Gray_2,
    },
    maybeLaterText: {
        color: COLORS.Gray_3,
        fontSize: 15,
        fontWeight: '600',
    },
    btnText: {
        color: COLORS.White,
        fontSize: 16,
        fontWeight: '700',
    },
    loaderContainer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 15,
        color: COLORS.PrimaryColorText,
        fontWeight: '600',
    },
    lockIcon: {
        fontSize: 36,
        marginBottom: 8,
    },

    timerLabel: {
        fontSize: 13,
        color: COLORS.Gray,
        marginTop: 8,
    },

    timer: {
        fontSize: 28,
        fontWeight: '800',
        fontFamily: 'monospace',
        marginBottom: 20,
    },
    payText: {
        color: COLORS.PrimaryColorText,
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    upgradeBtn: {
        width: '100%',
        backgroundColor: COLORS.Black,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },

    limitNote: {
        marginTop: 12,
        fontSize: 12,
        color: COLORS.Gray_3,
    },
});

export default FreemiumAdModal;

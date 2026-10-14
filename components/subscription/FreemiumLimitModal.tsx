import React from 'react';
import {Dimensions, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Modal from 'react-native-modal';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {AnalyticsEvent} from "@/helpers/analytics.events";
import Analytics from "@/helpers/AnalyticsHelper";
import {useTranslation} from "react-i18next";

const {width} = Dimensions.get('window');

const COLORS = {
    PrimaryColor: '#176535',
    PrimaryColorText: '#033126',
    SecondaryColor: '#DD8550',
    White: '#ffffff',
    Gray: '#666666',
    LightGray: '#f2f2f2'
};

interface Suggestion {
    type: string;
    message: string;
    plan?: string;
}

type Props = {
    visible: boolean;
    message: string;
    suggestions: Suggestion[];
    onUpgrade: (plan?: string) => void;
    onClose: () => void;
};

const FreemiumLimitModal = (
    {
        visible, message, suggestions, onUpgrade, onClose
    }: Props) => {

    const {t} = useTranslation();

    // Find specific suggestions from the array
    const upgradeInfo = suggestions.find(s => s.type === 'upgrade');
    const waitInfo = suggestions.find(s => s.type === 'wait');

    if (upgradeInfo && visible) {
        Analytics.upgradeInfoAvailable();
    }

    return (
        <Modal
            isVisible={visible}
            onBackdropPress={onClose}
            backdropOpacity={0.5}
            useNativeDriver
            style={styles.modalRoot}
        >
            <View style={styles.modalContent}>
                <MaterialIcons name="lock-outline" size={48} color={COLORS.PrimaryColor}/>

                <Text style={styles.title}>{t("freemium.limit_modal.title")}</Text>

                <Text style={styles.bodyText}>{message}</Text>

                {/* Primary Action: Upgrade */}
                {upgradeInfo && (
                    <TouchableOpacity
                        style={styles.upgradeBtn}
                        onPress={() => onUpgrade(upgradeInfo.plan)}
                    >
                        <Text style={styles.btnText}>{upgradeInfo.message.toUpperCase()}</Text>
                    </TouchableOpacity>
                )}

                {/* Secondary Info: Wait/Reset Info */}
                {waitInfo && (
                    <View style={styles.waitContainer}>
                        <MaterialIcons name="info-outline" size={16} color={COLORS.Gray}/>
                        <Text style={styles.waitText}>{waitInfo.message}</Text>
                    </View>
                )}

                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <Text style={styles.closeText}>{t('common.maybe_later')}</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalRoot: {margin: 0, justifyContent: 'center', alignItems: 'center'},
    modalContent: {
        backgroundColor: COLORS.White,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        width: width * 0.85,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.PrimaryColorText,
        marginVertical: 12,
    },
    bodyText: {
        fontSize: 15,
        color: COLORS.Gray,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    upgradeBtn: {
        backgroundColor: COLORS.PrimaryColor,
        width: '100%',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        elevation: 2,
    },
    btnText: {color: 'white', fontWeight: 'bold', fontSize: 14, textTransform: 'none'},
    waitContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.LightGray,
        padding: 12,
        borderRadius: 10,
        marginTop: 16,
        width: '100%',
    },
    waitText: {
        fontSize: 13,
        color: COLORS.Gray,
        marginLeft: 8,
        flex: 1,
    },
    closeBtn: {marginTop: 20},
    closeText: {color: COLORS.Gray, fontWeight: '600'},
});

export default FreemiumLimitModal;
import React from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Modal from 'react-native-modal';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {useTranslation} from "react-i18next";

const { width } = Dimensions.get('window');

const COLORS = {
    PrimaryColor: '#176535',
    PrimaryColorText: '#033126',
    SecondaryColor: '#DD8550',
    Black: '#1d1d1d',
    White: '#ffffff',
    Gray: '#666666',
    Gray_3: '#696969',
};

type Props = {
    visible: boolean;
    isFreemium: boolean; // Toggle logic
    onOpenTopup: () => void;
    onUpgradePremium: () => void;
    onViewUsage?: () => void;
    onClose: () => void;
};

const PremiumMinutesModal = ({
                                 visible,
                                 isFreemium,
                                 onOpenTopup,
                                 onUpgradePremium,
                                 onViewUsage,
                                 onClose,
                             }: Props) => {

    const {t} = useTranslation();

    return (
        <Modal
            isVisible={visible}
            animationIn="zoomIn"
            animationOut="zoomOut"
            backdropOpacity={0.5}
            useNativeDriver
            hideModalContentWhileAnimating
            onBackdropPress={onClose}
            onBackButtonPress={onClose}
            style={styles.modalRoot}
        >
            <View style={styles.modalContent}>
                {/* Dynamic Icon */}
                {isFreemium ? (
                    <MaterialIcons name="lock-outline" size={48} color={COLORS.PrimaryColor} style={styles.icon} />
                ) : (
                    <Text style={styles.lockIcon}>⏳</Text>
                )}

                {/* Dynamic Title */}
                <Text style={styles.modalTitle}>
                    {isFreemium ? t('premium.minutes_modal.title_freemium') : t('premium.minutes_modal.title_paid')}
                </Text>

                {/* Dynamic Subtext */}
                <Text style={styles.modalSub}>
                    {isFreemium
                        ? t('premium.minutes_modal.description_freemium')
                        : t('premium.minutes_modal.description_paid')}
                </Text>

                {/* Main Action: Upgrade to Premium (Primary for Freemium) */}
                <TouchableOpacity
                    style={styles.upgradeBtn}
                    onPress={onUpgradePremium}
                >
                    <Text style={styles.btnText}>{isFreemium ? t('common.upgrade_now') :t('premium.minutes_modal.upgrade_premium')}</Text>
                </TouchableOpacity>

                {/* Top Up Button: Only show if NOT freemium */}
                {!isFreemium && (
                    <TouchableOpacity
                        style={styles.topupBtn}
                        onPress={onOpenTopup}
                    >
                        <Text style={styles.btnText}>{t('premium.minutes_modal.topup_cta')}</Text>
                    </TouchableOpacity>
                )}

                {/* Secondary Action: View Usage (Freemium specific) */}
                {isFreemium && onViewUsage && (
                    <TouchableOpacity onPress={onViewUsage} style={styles.secondaryAction}>
                        <Text style={styles.secondaryActionText}>{t('premium.minutes_modal.view_usage')}</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity onPress={onClose}>
                    <Text style={styles.maybeLaterText}>{t('common.not_now')}</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalRoot: {
        margin: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: width * 0.85,
        backgroundColor: COLORS.White,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
    },
    icon: {
        marginBottom: 12,
    },
    lockIcon: {
        fontSize: 40,
        marginBottom: 8,
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
    upgradeBtn: {
        width: '100%',
        backgroundColor: COLORS.PrimaryColor,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    topupBtn: {
        width: '100%',
        backgroundColor: COLORS.Black,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    btnText: {
        color: COLORS.White,
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1,
    },
    secondaryAction: {
        marginBottom: 16,
    },
    secondaryActionText: {
        color: COLORS.SecondaryColor,
        fontSize: 14,
        fontWeight: '600',
    },
    maybeLaterText: {
        color: COLORS.Gray_3,
        fontSize: 15,
        fontWeight: '600',
    },
});

export default PremiumMinutesModal;
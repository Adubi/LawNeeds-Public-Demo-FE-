import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Purchases from 'react-native-purchases';
import { SafeAreaView } from 'react-native-safe-area-context';

const Colors = {
    bg: '#FFF7ED',
    card: '#FFFFFF',
    primary: '#176535',
    text: '#033126',
    subText: '#7F8C8D',
    border: '#EFEFEF',
};

export default function RestoreSubscriptionScreen() {

    const [loading, setLoading] = useState(false);

    async function restorePurchases() {
        try {
            setLoading(true);
            await Purchases.restorePurchases();
            Alert.alert(
                'Subscription Restored',
                'Your subscription has been successfully restored.'
            );
        } catch (e) {
            Alert.alert(
                'Restore Failed',
                'We could not restore your subscription. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.title}>Restore Subscription</Text>

                    <Text style={styles.description}>
                        If you previously purchased a subscription on this account,
                        you can restore it here. This is useful if you changed devices
                        or reinstalled the app.
                    </Text>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={restorePurchases}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Restore Purchases</Text>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.footerText}>
                        No payment will be charged during restore.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.bg },
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    card: {
        backgroundColor: Colors.card,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 10,
    },
    description: {
        fontSize: 14,
        color: Colors.subText,
        lineHeight: 22,
        marginBottom: 25,
    },
    button: {
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    footerText: {
        marginTop: 15,
        fontSize: 12,
        color: Colors.subText,
        textAlign: 'center',
    },
});

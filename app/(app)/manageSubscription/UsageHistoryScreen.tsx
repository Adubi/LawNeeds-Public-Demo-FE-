import React, {useEffect, useState} from 'react';
import {FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MaterialCommunityIcons, MaterialIcons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {heightPercentageToDP as hp, widthPercentageToDP as wp} from 'react-native-responsive-screen';
import {getSubscriptionUsageHistory} from "@/services/subscriptionHelper";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";

const Colors = {
    PrimaryColor: '#176535',
    AccentOrange: '#DD8550',
    Background: '#FFF7ED',
    CardBackground: '#FFFFFF',
    TextDark: '#033126',
    TextMuted: '#6D6D72',
    Danger: '#E74C3C',
    BorderGray: '#EFEFEF',
};
const StatusBadge = ({status}: { status: string }) => {
    const isSuccess = status === 'success';
    return (
        <View style={[styles.badge, isSuccess ? styles.successBadge : styles.errorBadge]}>
            <Text style={[styles.badgeText, isSuccess ? styles.successText : styles.errorText]}>
                {status.toUpperCase()}
            </Text>
        </View>
    );
};

const UsageItem = ({item}: { item: any }) => {
    const date = new Date(item.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Logic for viewing details or repeating action
    };

    return (
        <Pressable onPress={handlePress} style={({pressed}) => [
            styles.card,
            pressed && {opacity: 0.7, transform: [{scale: 0.98}]}
        ]}>
            <View style={styles.iconBox}>
                <MaterialCommunityIcons
                    name={item.action_type === 'query' ? 'magnify' : 'file-document-outline'}
                    size={wp(6)}
                    color="#2563EB"
                />
            </View>

            <View style={styles.mainContent}>
                <View style={styles.headerRow}>
                    <Text style={styles.actionText}>
                        {item.action_type === 'query' ? 'Legal Query' : 'Document Process'}
                    </Text>
                    <StatusBadge status={item.status}/>
                </View>

                <Text style={styles.idText} numberOfLines={1}>
                    {item.file_name || `Ref: ${item.id.substring(0, 8)}...`}
                </Text>

                <View style={styles.footerRow}>
                    <View style={styles.metaInfo}>
                        <MaterialCommunityIcons name="clock-outline" size={wp(3.5)} color="#94A3B8"/>
                        <Text style={styles.dateText}>{formattedDate}</Text>
                    </View>
                    <Text style={styles.costText}>
                        {item.minutes_deducted > 0 ? `-${item.minutes_deducted} min` : 'Free'}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
};

export default function UsageHistoryScreen() {

    const {t} = useTranslation();

    const [historyList, setHistoryList] = useState<any[]>([]);

    useEffect(() => {

        getSubscriptionUsageHistory((response: any) => {
         //   console.log('response', response.length);
            setHistoryList(response)
        }, (error: any) => {
            setHistoryList([])
        })

    }, []);

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
                    <MaterialIcons name="arrow-back-ios" size={22} color={Colors.TextDark}/>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('usage_history')}</Text>
            </View>

            <FlatList
                data={historyList || []}
                renderItem={({ item }) => <UsageItem item={item} />}
                keyExtractor={(item) => item.id.toString()} // Ensure ID is a string
                contentContainerStyle={[
                    styles.listPadding,
                    historyList?.length === 0 && { flex: 1, justifyContent: 'center' }
                ]}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>{t('no_transaction_yet')}</Text>
                    </View>
                }
                // Performance optimization:
                initialNumToRender={10}
                windowSize={5}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {flex: 1, backgroundColor: Colors.Background},
    center: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.Background},
    loadingText: {marginTop: 10, color: Colors.TextMuted, fontWeight: '600'},
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        alignContent: 'center',
        paddingHorizontal: 16,
        height: 60,
    },
    headerIcon: {width: 40, height: 40, justifyContent: 'center', alignItems: 'center'},
    headerTitle: {
        flex: 1,
        fontSize: 22,
        fontWeight: '800',
        color: Colors.TextDark,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
    },
    scrollContent: {padding: 20},
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9', // Light gray background
    },
    title: {
        fontSize: wp(7),
        fontWeight: '800',
        color: '#1E293B',
        fontFamily: 'Inter_900Black', // Use Inter if loaded
    },
    subtitle: {
        fontSize: wp(3.5),
        color: '#64748B',
    },
    listPadding: {
        padding: wp(4),
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: wp(4),
        marginBottom: hp(1.5),
        flexDirection: 'row',
        alignItems: 'center',
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 8,
        // Elevation for Android
        elevation: 2,
    },
    iconBox: {
        width: wp(12),
        height: wp(12),
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: wp(4),
    },
    mainContent: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    actionText: {
        fontSize: wp(4),
        fontWeight: '700',
        color: '#0F172A',
    },
    idText: {
        fontSize: wp(3.2),
        color: '#64748B',
        marginBottom: 8,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: wp(3),
        color: '#94A3B8',
        marginLeft: 4,
    },
    costText: {
        fontSize: wp(3.2),
        fontWeight: '600',
        color: '#475569',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    successBadge: {backgroundColor: '#DCFCE7'},
    errorBadge: {backgroundColor: '#FEE2E2'},
    badgeText: {fontSize: wp(2.5), fontWeight: '800'},
    successText: {color: '#166534'},
    errorText: {color: '#991B1B'},
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50, // Give it some breathing room
    },
    emptyText: {
        fontSize: 15,
        fontWeight: "600",
        color: Colors.TextDark,
        textAlign: 'center',
    },
});

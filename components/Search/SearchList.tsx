import React from 'react';
import {FlatList, Image, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {COLORS} from '@/constants/colors';
import {useTranslation} from 'react-i18next';

type SearchListItem = {
    id: string | number;
    image: string;
    topRated?: boolean;
    name: string;
    cases: string | number;
    satisfaction: string | number;
    tags: string[];
    distance: string;
    status?: string;
    badge?: string;
    [key: string]: any;
};

type SearchListProps = {
    data: SearchListItem[];
    onRequest: (item: SearchListItem) => void;
};

const SearchList = ({data,onRequest}: SearchListProps) => {

    const { t } = useTranslation();


    const renderItem = ({item}: { item: SearchListItem }) => (
        <View style={styles.card}>
            {/* ─── Avatar + “Top rated” chip ─────────────────────────── */}
            <View style={styles.avatarColumn}>
                <View style={styles.avatarWrapper}>
                    <Image
                        source={{
                            uri: item.image,
                        }}
                        style={styles.avatar}
                    />
                    {item.topRated && (
                        <Image
                            source={require('../../assets/images/top_rate_icon.png')}
                            style={styles.topRatedIcon}
                        />
                    )}
                </View>

                {item.topRated && (
                    <View style={styles.topRatedChip}>
                        <Text style={styles.topRatedText}>{t('search.top_rated')}</Text>
                    </View>
                )}
            </View>

            {/* ─── Middle details ────────────────────────────────────── */}
            <View style={styles.middle}>
                {/* name */}
                <Text numberOfLines={1} style={styles.name}>
                    {item.name}
                </Text>

                {/* stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statsBox}>
                        <Text style={styles.statsLabel}>Cases Helped</Text>
                        <Text style={styles.statsValue}>{item.cases}</Text>
                    </View>
                    <View style={styles.statsBox}>
                        <Text style={styles.statsLabel}>Satisfied</Text>
                        <Text style={styles.statsValue}>{item.satisfaction}</Text>
                    </View>
                </View>

                {/* tags */}
                <Text style={styles.tags}>
                    {item.tags.slice(0, 2).join(', ')}
                    {item.tags.length > 2 ? `  +${item.tags.length - 2} ${t('search.more')}` : ''}
                </Text>

                {/* distance */}
                <Text style={styles.distance}>{item.distance}</Text>
            </View>

            {/* ─── Badge + Request button ───────────────────────────── */}
            <View style={styles.rightColumn}>

                {item?.status ? (
                    <TouchableOpacity
                        activeOpacity={0.75}
                        style={item.status=== "Pending"? styles.statusPending:styles.statusApprove}
                        disabled={true}
                        onPress={() => {
                            // router.push("/(app)/(tabs)/search/searchHistory");
                        }}
                    >
                        <Text style={item.status=== "Pending"? styles.statusPendingTxt:styles.statusApproveTxt}>{item?.status}</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        activeOpacity={0.75}
                        style={styles.requestBtn}
                        onPress={()=>{
                            onRequest(item)
                        }}
                    >
                        <Text style={styles.requestTxt}>{t('search.request')}</Text>
                    </TouchableOpacity>
                )}
                {item.badge ? (
                    <View style={styles.badgeBox}>
                        <Image
                            source={require('../../assets/images/check-badge-solid.png')}
                            style={styles.badgeIcon}
                        />
                        <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                ) : <View style={styles.badgeBox1}/>}

            </View>
        </View>
    );

    return (
        <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingVertical: 12}}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
        />
    );
};

const CARD_RADIUS = 16;

const styles = StyleSheet.create({
    /* ───── Card container ───── */
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',

        marginBottom: 16,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: CARD_RADIUS,
        // shadow / elevation
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.08,
        shadowRadius: 6,
        marginStart: 16,
        marginEnd: 16,
    },

    /* ───── Avatar column ───── */
    avatarColumn: {
        alignItems: 'center',
        width: 66,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    topRatedIcon: {
        position: 'absolute',
        width: 40,
        height: 40,
        left: 10,
        top: 36, // sits neatly under avatar
    },
    topRatedChip: {
        marginTop: 6,

        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    topRatedText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FF4B3A',
    },

    /* ───── Middle column ───── */
    middle: {
        flex: 1,
        paddingHorizontal: 8,
    },
    name: {
        fontSize: 16,
        fontFamily: 'InstrumentSansSemiBold',
        color: '#181818',
        marginBottom: 4,
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: 2,
    },
    statsBox: {
        marginRight: 20,
        marginBottom: 5
    },
    statsLabel: {
        fontSize: 14,
        marginBottom: 5,
        fontFamily: 'InstrumentSansSemiBold',
        color: '#6C6C6C',
    },
    statsValue: {
        fontSize: 12,
        fontFamily: 'InstrumentSansSemiBold',
        fontWeight: '700',
        color: '#181818',
    },
    tags: {
        marginTop: 6,
        fontSize: 12,
        fontFamily: 'InstrumentSansSemiBold',
        color: '#181818',
    },
    distance: {
        fontSize: 12,
        color: '#6C6C6C',
        marginTop: 4,
        fontFamily: 'InstrumentSansRegular',
    },

    /* ───── Right column ───── */
    rightColumn: {
        justifyContent: 'space-between',
        alignItems: 'flex-end',

    },
    badgeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginEnd: 8
    },
    badgeBox1: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    badgeIcon: {
        width: 20,
        height: 20,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 4,
    },
    statusPending:{
        borderRadius: 22,
        borderWidth:1,
        borderColor:"red",
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    statusApprove:{
        borderRadius: 22,
        borderWidth:1,
        borderColor:"green",
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    /* ───── Request button ───── */
    requestBtn: {
        backgroundColor: COLORS.accent ?? '#FF8C5A',
        borderRadius: 22,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    statusPendingTxt:{
        fontSize: 13,
        fontWeight: '700',
        color:"red"
    },
    statusApproveTxt:{
        fontSize: 13,
        fontWeight: '700',
        color:"green"
    },
    requestTxt: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
});

export default SearchList;

import {Platform, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {FontAwesome6} from "@expo/vector-icons";
import React from "react";
import {useTranslation} from "react-i18next";
import {COLORS} from "@/constants/colors";
import {formatToLocalDateTime} from "@/constants/Utility";
import {CachedAvatar} from "@/components/CachedAvatar";

const CARD_RADIUS = 16;

type LawyerItemProps = {
    item: any;
    index: number;
    onListItemClick?: (item: any, index: number) => void;
};

export const LawyerItem = ({item, index, onListItemClick}: LawyerItemProps) => {

    const {t} = useTranslation();

    let formatted;
    if (item.date_started) {
        formatted = formatToLocalDateTime(item.date_started);
    }

    const getStatusColor = (status: string, lawyerStatus: string) => {

        status = status.toLowerCase();
        lawyerStatus = lawyerStatus.toLowerCase();

        if (status === "cancelled") {
            if (lawyerStatus === "rejected") return "#FF0000"; // Red
            if (lawyerStatus === "accepted") return "#FFA500"; // Orange (Withdrawn)
            if (lawyerStatus === "deleted") return "#808080"; // Grey (Deleted)
            return "#000000"; // fallback
        }

        switch (status) {
            case "active":   return "#4CAF50"; // Green
            case "pending":  return "#2196F3"; // Blue
            default:         return "#000000"; // Black
        }
    };

    let lawyerData = item?.lawyer_profile;
    // const showActionButton = item.lawyer_response_status === "pending" || item.lawyer_response_status === "accepted";

    return (<TouchableOpacity style={styles.mainList} onPress={() => {
            if (onListItemClick) {
                onListItemClick(item, index);
            }
        }}>

            <View style={styles.card}>
                <View style={styles.avatarColumn}>

                    {lawyerData.profile_picture ?
                        <View style={styles.avatarWrapper}>
                            <CachedAvatar uri={lawyerData.profile_picture} style={styles.avatar}/>
                        </View> :

                        <View style={{
                            width: 60,
                            height: 60,
                            borderRadius: 33,
                            backgroundColor: COLORS.Gray,
                            justifyContent: "center",
                            alignItems: "center"
                        }}>
                            <FontAwesome6
                                name="user"
                                size={36}
                                color={COLORS.White}
                            />
                        </View>
                    }

                </View>

                <View style={styles.middle}>

                    <View style={{
                        alignContent:'center',
                        marginBottom: 4,
                        flexDirection: 'row',
                    }}>

                        <Text numberOfLines={1} style={styles.name}>
                            {item.lawyer_name.trim() ? item.lawyer_name : lawyerData.name}
                        </Text>
                        {item.unread_messages > 0 && (
                            <View
                                style={{
                                    backgroundColor: COLORS.SecodaryColor, // red badge
                                    borderRadius: 12,
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                    minWidth: 24,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Text style={{color: "#fff", fontWeight: "600", fontSize: 14}}>
                                    {item.unread_messages}
                                </Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.distance}>{item.consultation_type}</Text>
                    <Text style={styles.distance}>{item.urgency_level}</Text>

                    {item.issue_summary &&
                        <Text style={styles.distance}>{item.issue_summary}</Text>
                    }

                    <Text style={styles.distance}>{formatted}</Text>

                    <Text style={[styles.distance, {
                        fontWeight: 700,
                        color: getStatusColor(item.status, item.lawyer_response_status)
                    }]}>{item.status === "matched" ? t('pending') :
                        (item.status === "active" ? t('accepted') :
                            (item.status === "cancelled" ? (
                                    item.lawyer_response_status === "rejected" ? t('rejected') :
                                        item.lawyer_response_status === "accepted" ? t('withdrawn') :
                                            item.lawyer_response_status === "pending" ? t('pending') :
                                                t('deleted')
                                ) :  t('deleted')
                            ))}
                    </Text>

                </View>


            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    mainList: {
        padding: 16,
        marginBottom: 16,
        backgroundColor: '#fff',
        borderRadius: CARD_RADIUS,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.08,
        shadowRadius: 6,
        marginStart: 16,
        marginEnd: 16,
    },
    card: {
        flexDirection: 'row',
    },
    avatarColumn: {
        marginTop: 8,
        marginRight: 8,
    },
    avatarWrapper: {
        position: 'relative',
    },
    middle: {
        flex: 1,
        paddingHorizontal: 10,
    },
    distance: {
        fontSize: 14,
        color: '#6C6C6C',
        marginTop: 4,
        fontFamily: 'InstrumentSansRegular',
    },
    rightColumn: {
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 8,
    },

    rightButton: {
        width: 36,
        height: 36, // better for visual symmetry
        resizeMode: 'cover',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    name: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'InstrumentSansSemiBold',
        color: '#181818',
        marginEnd: 8
    },
});

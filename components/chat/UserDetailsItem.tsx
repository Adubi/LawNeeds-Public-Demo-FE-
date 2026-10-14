import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {FontAwesome6, MaterialIcons} from "@expo/vector-icons";
import {COLORS as c, COLORS} from "@/constants/colors";
import React from "react";
import {formatToLocalDateTime} from "@/constants/Utility";
import {CachedAvatar} from "@/components/CachedAvatar";

const CARD_RADIUS = 16;
const TAG_PADDING = 6;

type LawyersDetailsItemProps = {
    requestDetails: any;
};

export const UserDetailsItem: React.FC<LawyersDetailsItemProps> = ({
                                                                       requestDetails,
                                                                   }) => {


    const getFormatedDate = (created_at: string) => {
        let formatted;
        if (created_at) {
            formatted = formatToLocalDateTime(created_at);
        }


     /*   if (item.started_at) {
            formatted = formatToLocalDateTime(item.started_at);
        }
        if (item.last_message_at) {
            formatted = formatToLocalDateTime(item.last_message_at);
        }*/

        return formatted;
    }


    let clientData = requestDetails?.client_profile;
    return (<View style={styles.mainListSingle}>

            <View style={styles.card}>
                {/* Avatar Section */}
                <View style={styles.avatarColumn}>

                    {clientData?.profile_picture_path ?
                        <View style={styles.avatarWrapper}>
                            <CachedAvatar uri={clientData?.profile_picture_path} style={styles.avatar}/>
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

                {/* Middle Info Section */}
                <View style={styles.middle}>
                    <Text numberOfLines={1} style={styles.name}>{clientData?.client_name || "Unknown User"}</Text>
                    <View style={styles.detailRow}>
                        <MaterialIcons name="timeline" size={16} color="#666"/>
                        <Text style={styles.detailText}>{requestDetails?.urgency_level}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <MaterialIcons name="calendar-today" size={16} color="#666"/>
                        <Text style={styles.detailText}>{getFormatedDate(requestDetails?.created_at) || "-"}</Text>
                    </View>

                    {clientData?.immigration_status ? (
                        <View style={styles.detailRow}>
                            <MaterialIcons name="badge" size={16} color="#666"/>
                            <Text style={styles.detailText}>{clientData.immigration_status}</Text>
                        </View>
                    ) : null}

                </View>
            </View>

        </View>)
}

const styles = StyleSheet.create({
    mainList: {
        padding: 16,
        marginHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: CARD_RADIUS,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.08,
        shadowRadius: 6,
    },
    mainListSingle: {
        padding: 16,
        marginHorizontal: 0,
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.08,
        shadowRadius: 6,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarColumn: {
        width: 60,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    middle: {
        flex: 1,
        paddingLeft: 12,
    },
    name: {
        fontSize: 16,
        fontFamily: 'InstrumentSansSemiBold',
        color: '#181818',
        marginBottom: 4,
    },
    subText: {
        fontSize: 14,
        color: c.Gray_3,
        fontWeight: 'bold',
        marginBottom: 4,
        fontFamily: 'InstrumentSansRegular',
    },
    favouriteView: {
        position: 'absolute',
        right: 10,
        flexDirection: 'row',
        top: -28,
        alignItems: 'center',
        backgroundColor: c.SecodaryColor,
        borderRadius: 16,
        paddingVertical: 4,
        paddingHorizontal: 8
    },
    favouriteText: {
        fontSize: 12,
        marginStart: 4,
        color: 'white',
        fontWeight: 'bold',
        fontFamily: 'InstrumentSansRegular',
    },
    matchScoreText: {
        fontSize: 16,
        color: c.PrimaryColor,
        fontWeight: 'bold',
        marginBottom: 4,
        fontFamily: 'InstrumentSansRegular',
    },
    expertiseRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    matchReasons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    matchReasonItem: {
        marginRight: 8,
        marginBottom: 4,
        flexDirection: 'row',
        alignItems: 'center'
    },
    matchReasonView: {
        backgroundColor: c.BackgroundColor, // you can replace with `secondary`
        borderRadius: 6,
        padding: 12,
    },
    tag: {
        borderColor: c.SecodaryColor, // you can replace with `secondary`
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: TAG_PADDING,
        paddingVertical: 4,
        marginRight: 8,
        marginBottom: 6,
    },
    tagText: {
        fontSize: 12,
        color: 'black',
        fontFamily: 'InstrumentSansRegular',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailsButton: {
        padding: 4,
        justifyContent: 'center'
    },
    detailText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
});

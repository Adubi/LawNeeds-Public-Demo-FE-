import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {FontAwesome6} from "@expo/vector-icons";
import React from "react";
import {useTranslation} from "react-i18next";
import {COLORS} from "@/constants/colors";
import {formatToLocalDateTime} from "@/constants/Utility";
import {CachedAvatar} from "@/components/CachedAvatar";

const CARD_RADIUS = 16;

type UserItemProps = {
    item: any; // or define a proper type/interface
    index: number;
    isActive: boolean;
    onListItemClick: (item: any, index: number) => void;
};

export const UserItem: React.FC<UserItemProps> = ({item, index, isActive, onListItemClick}) => {

    let formatted;


    if (isActive) {
        if (item.started_at) {
            formatted = formatToLocalDateTime(item.started_at);
        }
        if (item.last_message_at) {
            formatted = formatToLocalDateTime(item.last_message_at);
        }
    } else {

        if (item.created_at) {
            formatted = formatToLocalDateTime(item.created_at + "Z");
        }

    }

    let clientData = item?.user_profile;

    return (<TouchableOpacity style={styles.mainList} onPress={() => {
            if (onListItemClick) {
                onListItemClick(item, index);
            }
        }}>

            <View style={styles.card}>
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

                <View style={styles.middle}>

                    <View style={{
                        alignContent: 'center',
                        marginBottom: 4,
                        flexDirection: 'row',
                    }}>

                        <Text numberOfLines={1} style={styles.name}>
                            {item.user_name.trim() ?  item.user_name : (clientData.client_name ? clientData.client_name : "")}
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

                    {item.urgency_level &&
                        <View style={{flexDirection: 'row', width: "60%", gap: 6}}>
                            <Text style={styles.distance}>{item.urgency_level}</Text>


                        </View>
                    }
                    <Text style={styles.distance}>{item.consultation_type}</Text>
                    <Text style={styles.distance}>{formatted}</Text>

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
        flexDirection: 'row',
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

import {StyleSheet, Text, TouchableOpacity, View, Image} from "react-native";
import {FontAwesome6} from "@expo/vector-icons";
import {COLORS as c, COLORS} from "@/constants/colors";
import React from "react";
import {getCategoryColors} from "@/constants/Utility";
import {CachedAvatar} from "@/components/CachedAvatar";

const CARD_RADIUS = 16;
const TAG_PADDING = 6;

type LawyersDetailsItemProps = {
    item: any;
    index: number;
    listSize: number;
    onListItemClick: (item: any, index: number) => void;
};

export const LawyersListItem: React.FC<LawyersDetailsItemProps> = ({
                                                                          item,
                                                                          index,
                                                                          listSize,
                                                                          onListItemClick,
                                                                      }) => {

    return (<TouchableOpacity
        style={[styles.mainList, {
            marginBottom: (listSize === index + 1) ? 0 : 16,
        }]}
        onPress={() => onListItemClick?.(item, index)}
    >
        <View>
            {item.is_best_suited && <View style={styles.favouriteView}>
                <FontAwesome6
                    name="star"
                    size={12}
                    color={COLORS.White}
                />
                <Text style={styles.favouriteText}>BEST SUITED</Text>
            </View>
            }

            <View style={styles.card}>
                {/* Avatar Section */}
                <View style={styles.avatarColumn}>

                    {item.profile_picture ?
                        <View style={styles.avatarWrapper}>
                            <CachedAvatar uri={item.profile_picture} style={styles.avatar}/>
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
                    <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
                    {item.sra_bsb &&
                        <View>
                            <View style={styles.badgeBox}>
                                <Image
                                    source={require('../../assets/images/check-badge-solid.png')}
                                    style={styles.badgeIcon}
                                />
                                <Text style={styles.badgeText}>{item.sra_bsb}</Text>
                            </View>
                        </View>
                    }

                </View>
            </View>

            <View style={styles.expertiseRow}>
                {item.expertise.map((exp: any, i: number) => (
                    <View key={i} style={[styles.tag, {
                        backgroundColor: getCategoryColors(exp).primary || "white",
                        borderColor: getCategoryColors(exp).primary || c.SecodaryColor,
                    }]}>
                        <Text style={[styles.tagText, {
                            color: "white",
                        }]}>{exp}</Text>
                    </View>
                ))}
            </View>

            {item.match_reasons &&
                <View style={styles.matchReasonView}>

                    <Text style={styles.matchScoreText}>Match Score: {item.match_score}/100</Text>
                    <View style={styles.matchReasons}>
                        {item.match_reasons.map((exp: any, i: number) => (
                            <View key={i} style={styles.matchReasonItem}>

                                <FontAwesome6
                                    name="check"
                                    size={12}
                                    color={COLORS.Black}
                                />

                                <Text style={[styles.tagText, {
                                    marginStart: 8
                                }]}>{exp}</Text>
                            </View>
                        ))}
                    </View>
                </View>}
        </View>
    </TouchableOpacity>)
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
    textItem: {
        fontSize: 14,
        color: c.GrayDark,
    },
    badgeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginEnd: 8
    },
    badgeIcon: {
        width: 20,
        height: 20,
    },
    badgeText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
        color: c.Black,
    },
});

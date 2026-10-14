import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import {NativeViewGestureHandler} from "react-native-gesture-handler";
import {SafeAreaView} from "react-native-safe-area-context";
import {router, useFocusEffect} from "expo-router";
import {MaterialIcons} from "@expo/vector-icons";
import {COLORS as c, COLORS} from "@/constants/colors";
import {BORDER_RADIUS, SPACING} from "@/constants/theme";
import {RFValue} from "react-native-responsive-fontsize";
import {widthPercentageToDP as wp} from "react-native-responsive-screen";

import {useTranslation} from 'react-i18next';
import FilterModal from "@/components/Search/FilterModal";
import {professionalUserDetails, searchProfessionalList} from "@/services/apiHelper";
import {getCategoryColors, getUserData} from "@/constants/Utility";
import ProfessionalDetails from "@/app/(app)/(tabs)/search/ProfessionalDetails";
import BottomSheet, {BottomSheetScrollView} from "@gorhom/bottom-sheet";
import {setCurrentRoute} from "@/utils/navigationState";
import TourHighlight from '../../manage/TourHighlight';
import PageTourProvider from "@/app/(app)/manage/PageTourProvider";
import {useTour} from "@/app/(app)/manage/useTour";
import {CachedAvatar} from "@/components/CachedAvatar";

const limit = 20;
const createRandomSeed = () => Math.random().toString(36).slice(2);

const Index = () => {

    const {t} = useTranslation();

    const [search, setSearch] = useState("")
    const [availableFilters, setAvailableFilters] = useState(null)
    const [userDetails, setUserDetails] = useState(null);

    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrev, setHasPrev] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [dataList, setDataList] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [isFilterApplied, setIsFilterApplied] = useState(false);
    const [firstItemRendered, setFirstItemRendered] = useState(false);
    const firstItemRenderedRef = useRef(false);

    const [loginUserData, setLoginUserData] = useState(null);
    const randomSeedRef = useRef(createRandomSeed());

    const bottomSheetRef = useRef<BottomSheet>(null);
    const bottomSheetFilterRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['88%'], []);

    useTour("SEARCH", filteredData.length > 0 && firstItemRendered);

    const [filteredValue, setFilteredValue] = useState({
        sort: "", services: "", area: "", userType: ""
    });

    useFocusEffect(
        useCallback(() => {
            setCurrentRoute("Search", {
                session_id: "",
                referral_id: "",
            });
        }, [])
    );

    const handleSearch = (text: string) => {
        setSearch(text);
    };

    const getProfessionalListData = (userType = "", services = "", area = "", sort = "", pageNumber: number) => {
        setFilteredData([]);
        setLoading(true);

        setTimeout(() => {
            try {
                searchProfessionalList(userType, services, area, sort || "random", pageNumber, limit, (result: any) => {

                    const pagination = result.pagination;
                    if (pageNumber === 1) {
                        // First page or refresh
                        setDataList(result.professionals);

                        if (result.available_filters) {
                            setAvailableFilters(result.available_filters)
                        } else {
                            console.log("data cleared")
                        }
                    } else {
                        setDataList(prev => [...prev, ...result.professionals]);
                    }

                    setHasNext(pagination.has_next);
                    setHasPrev(pagination.has_prev);
                    setPage(pageNumber);
                }, () => {
                }, randomSeedRef.current)
            } catch (err) {
                console.error(err);
            } finally {
                setRefreshing(false);
            }
        }, 1000)
    }

    const updateProfessionalAvailabilityInList = (professional: any) => {
        if (!professional?.id) return;
        const mergeAvailability = (item: any) => {
            if (item.id !== professional.id) return item;
            return {
                ...item,
                availability_status: professional.availability_status ?? item.availability_status,
                availability_label: professional.availability_label ?? item.availability_label,
                next_available_at: professional.next_available_at ?? item.next_available_at,
            };
        };
        setDataList((current) => current.map(mergeAvailability));
        setFilteredData((current) => current.map(mergeAvailability));
    };

    const getUserDetailsData = (item: any) => {

        setLoading(true);

        try {
            professionalUserDetails(item.id, (result: any) => {
                const professional = {
                    ...item,
                    ...result,
                    availability_status: result.availability_status ?? item.availability_status,
                    availability_label: result.availability_label ?? item.availability_label,
                    next_available_at: result.next_available_at ?? item.next_available_at,
                };
                updateProfessionalAvailabilityInList(professional);
                setUserDetails(professional);
                bottomSheetRef.current?.expand();
            }, () => {
                console.log("setError");
            })
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }


    useEffect(() => {

        if (search && search.length > 0) {
            const filtered = dataList.filter((item: any) => {
                const words = item.display_name.toLowerCase().split(' ');
                return words.some((word: any) => word.includes(search.toLowerCase()));
            });

            setFilteredData(filtered);
        } else {
            setFilteredData(dataList);
        }
        setLoading(false);


    }, [search, dataList]);


    useEffect(() => {

        getProfessionalListData(filteredValue.userType, filteredValue.services, filteredValue.area, filteredValue.sort, 1);

    }, []);

    useEffect(() => {
        const getAppUserData = async () => {
            const userData = await getUserData();
            if (userData) {
                setLoginUserData(userData);
            }
        }
        getAppUserData();
    }, [])

    const loadMore = () => {
        if (hasNext && !loading) {
            getProfessionalListData(filteredValue.userType, filteredValue.services, filteredValue.area, filteredValue.sort, page + 1);
        }
    };

    const onRefresh = () => {
        if (hasPrev && !refreshing) {
            setRefreshing(true);
            randomSeedRef.current = createRandomSeed();
            getProfessionalListData(filteredValue.userType, filteredValue.services, filteredValue.area, filteredValue.sort, 1);
        }
    };

    const onViewableItemsChanged = useRef(({viewableItems}: { viewableItems: Array<{ index: number | null }> }) => {
        if (
            !firstItemRenderedRef.current &&
            viewableItems.some(viewableItem => viewableItem.index === 0)
        ) {
            firstItemRenderedRef.current = true;
            setFirstItemRendered(true);
        }
    }).current;

    const statusColor = (status?: string) => {
        if (status === "online") return "#1F9D55";
        if (status === "away") return "#F59E0B";
        return "#D64545";
    };

    const renderItem = ({ item, index }: { item: any; index: number }) => {

        const card = (<TouchableOpacity style={styles.card} onPress={() => {
            getUserDetailsData(item);
        }}>
            <View style={{flexDirection: 'row'}}>
                {/* ─── Avatar + “Top rated” chip ─────────────────────────── */}
                <View style={styles.avatarColumn}>
                    <View style={styles.avatarWrapper}>
                        <CachedAvatar uri={item.profile_picture_path} style={styles.avatar}/>
                        {item.topRated && (
                            <Image
                                source={require('../../../../assets/images/top_rate_icon.png')}
                                style={styles.topRatedIcon}
                            />
                        )}
                    </View>

                    {item?.topRated && (
                        <View style={styles.topRatedChip}>
                            <Text style={styles.topRatedText}>{t('search.top_rated')}</Text>
                        </View>
                    )}
                </View>

                {/* ─── Middle details ────────────────────────────────────── */}
                <View style={styles.middle}>
                    {/* name */}
                    <Text numberOfLines={1} style={styles.name}>
                        {item.display_name}
                    </Text>

                    {/* stats */}

                    {item.cases &&
                        <View style={styles.statsRow}>
                            <View style={styles.statsBox}>
                                <Text style={styles.statsLabel}>{t('case_helped')}</Text>
                                <Text style={styles.statsValue}>{item.cases}</Text>
                            </View>
                            <View style={styles.statsBox}>
                                <Text style={styles.statsLabel}>{t('satisfied')}</Text>
                                <Text style={styles.statsValue}>{item.satisfaction}</Text>
                            </View>
                        </View>
                    }
                    {item.firm_name && <Text style={styles.tags}>
                        {item.firm_name}
                    </Text>}

                    {/* tags */}
                    {/*   {item.legal_expertise && item.legal_expertise.length > 0 && <Text style={styles.tags}>
                        {item.legal_expertise.slice(0, 2).join(', ')}
                        {item.legal_expertise.length > 2 ? `  +${item.legal_expertise.length - 2} ${t('search.more')}` : ''}
                    </Text>}*/}

                    <View style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        marginTop: 8
                    }}>
                        {item.legal_expertise.map((exp: any, i: number) => {
                            // 1. Call the function once per expertise item
                            const categoryColors = getCategoryColors(exp);
                            const themeColor = categoryColors.primary || "white";

                            return (
                                <View
                                    key={i}
                                    style={[styles.tag, {
                                        backgroundColor: themeColor,
                                        borderColor: themeColor,
                                    }]}
                                >
                                    <Text style={[styles.tagText, {color: "white"}]}>
                                        {exp?.label || exp}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>

                    <View style={styles.locationAvailabilityRow}>
                        <Text style={styles.distance} numberOfLines={1}>{item.town_city}</Text>
                        <View style={styles.availabilityRow}>
                            <View style={[styles.statusDot, {backgroundColor: statusColor(item.availability_status)}]}/>
                            <Text style={styles.availabilityLabel} numberOfLines={1}>
                                {item.availability_label || "Offline"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ─── Badge + Request button ───────────────────────────── */}
                <View style={styles.rightColumn}>

                    {item?.status ? (

                        <TouchableOpacity
                            activeOpacity={0.75}
                            style={item.status === "Pending" ? styles.statusPending : styles.statusApprove}
                            disabled={true}
                            onPress={() => {
                                // router.push("/(app)/(tabs)/search/searchHistory");
                            }}
                        >
                            <Text
                                style={item.status === "Pending" ? styles.statusPendingTxt : styles.statusApproveTxt}>{item?.status}</Text>
                        </TouchableOpacity>
                    ) : (

                        <TouchableOpacity
                            activeOpacity={0.75}
                            style={styles.requestBtn}
                            onPress={async () => {
                                router.push({
                                    pathname: "/(app)/message",
                                    params: {
                                        profilePicture: item.profile_picture_path,
                                        lawyerId: item.id,
                                        lawyerName: item.display_name,
                                        tokenForNotification: item?.push_token || ""
                                    },
                                });
                            }}
                        >
                            <Text style={styles.requestTxt}>{t('search.request')}</Text>
                        </TouchableOpacity>
                    )}

                    {item.sra_bsb ? (
                        <View style={styles.badgeBox}>
                            <Image
                                source={require('../../../../assets/images/check-badge-solid.png')}
                                style={styles.badgeIcon}
                            />
                            <Text style={styles.badgeText}>{item.sra_bsb}</Text>
                        </View>
                    ) : <View style={styles.badgeBox1}/>}

                </View>
            </View>
        </TouchableOpacity>)

        if (index === 0) {
            return (
                <TourHighlight
                    zone={2}
                    title={t('tour_service_request_title')}
                    text={t('tour_service_request_desc')}
                >
                    {card}
                </TourHighlight>
            );
        }

        return card;
    };

    const manageFilterObject = (dataSort = "",
                                selectedService = "", selectedArea = "", selectedUserType = "") => {
        randomSeedRef.current = createRandomSeed();
        setFilteredValue({
            sort: dataSort || "random", services: selectedService, area: selectedArea, userType: selectedUserType
        })

        getProfessionalListData(selectedUserType, selectedService, selectedArea, dataSort || "random", 1)
    }


    return (

        <View style={{
            flex: 1,
        }}>
            <SafeAreaView style={styles.container}>

                <View style={{flexDirection: "row", alignItems: "center", padding: SPACING.md,}}>
                    <TouchableOpacity
                        onPress={() => router.replace("/(app)/(tabs)")}
                        style={styles.backButton}
                        accessibilityRole="button"
                        accessibilityLabel={t('change_email.go_back')}
                    >
                        <MaterialIcons name="arrow-back-ios" size={24}/>
                    </TouchableOpacity>
                    <Text style={styles.title} allowFontScaling={false}>
                        {t('search.professionals')}
                    </Text>

                </View>

                <NativeViewGestureHandler disallowInterruption={true}>
                    <View style={{flexDirection: "row", padding: SPACING.sm}}>


                        <TourHighlight
                            zone={1}
                            title={t('tab.search')}
                            text={t('tour_search_desc')}
                            style={{flex: 1}}
                        >

                            <View style={{flexDirection: "row", padding: SPACING.sm, alignItems: "center"}}>
                                <View style={styles.content}>
                                    <Image
                                        source={require("../../../../assets/images/ic_icon_search.png")}
                                        style={{width: wp(5), height: wp(5), marginEnd: 10}}
                                    />
                                    <TextInput
                                        style={styles.textInput}
                                        value={search}
                                        placeholderTextColor={"#808080"}
                                        onChangeText={handleSearch}
                                        placeholder={t('tab.search')}
                                        allowFontScaling={false}
                                    />
                                    {search?.length > 0 && (
                                        <TouchableOpacity onPress={() => handleSearch("")}>
                                            <MaterialIcons name="close" size={20} color="#808080"/>
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        bottomSheetFilterRef.current?.expand();
                                        setIsFilterApplied(true);
                                    }}
                                    style={{justifyContent: "center", marginStart: 10}}
                                >
                                    <Image
                                        style={{width: wp(6), height: wp(6)}}
                                        source={
                                            isFilterApplied
                                                ? require("../../../../assets/images/ic_filter_selected.png")
                                                : require("../../../../assets/images/ic_filter.png")
                                        }
                                    />
                                </TouchableOpacity>
                            </View>
                        </TourHighlight>
                    </View>
                </NativeViewGestureHandler>

                <View style={{flex: 1, backgroundColor: COLORS.White, marginBottom: 60}}>

                    {filteredData && filteredData.length === 0 ? <View style={{
                            alignItems: 'center',
                            flex: 1,
                            justifyContent: 'center'
                        }}>
                            {loading ? <ActivityIndicator size="small" color="#000"/> :
                                <Text
                                    style={styles.title}>{t('common.no_data_available')}</Text>
                            }
                        </View> :
                        <FlatList
                            data={filteredData}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id.toString()}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{paddingVertical: 12}}
                            keyboardDismissMode="interactive"
                            keyboardShouldPersistTaps="handled"
                            onEndReached={loadMore} // loads more when scroll to end
                            onEndReachedThreshold={0.5}
                            onViewableItemsChanged={onViewableItemsChanged}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
                            }
                            ListFooterComponent={
                                loading ? <ActivityIndicator size="small" color="#000"/> : null
                            }
                        />}

                </View>


                <BottomSheet
                    ref={bottomSheetRef}
                    index={-1}
                    snapPoints={snapPoints}
                    enablePanDownToClose
                    backgroundStyle={styles.profileSheetBackground}
                    handleIndicatorStyle={styles.profileSheetHandle}
                    onClose={() => setUserDetails(null)}
                >
                    <BottomSheetScrollView
                        contentContainerStyle={styles.profileSheetScrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {userDetails && <ProfessionalDetails professional={userDetails}
                                                             loginUserData={loginUserData}
                                                             onClose={() => {
                                                                 bottomSheetRef?.current?.close()
                                                             }}/>
                        }
                    </BottomSheetScrollView>
                </BottomSheet>

                {availableFilters &&
                    <BottomSheet
                        ref={bottomSheetFilterRef}
                        index={-1}
                        snapPoints={snapPoints}
                        enablePanDownToClose
                        backgroundStyle={styles.filterSheetBackground}
                        handleIndicatorStyle={styles.filterSheetHandle}
                        onClose={() => setIsFilterApplied(false)}
                    >
                        <BottomSheetScrollView
                            contentContainerStyle={styles.filterSheetScrollContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <FilterModal applyFilter={(dataSort = "", selectedService = "",
                                                       selectedArea = "", selectedUserType = "") => {
                                manageFilterObject(dataSort, selectedService, selectedArea, selectedUserType);
                                bottomSheetFilterRef?.current?.close()
                                setIsFilterApplied(false);
                            }}
                                         cancelFilter={() => {
                                             bottomSheetFilterRef?.current?.close()
                                             setIsFilterApplied(false);
                                         }}
                                         availableFilters={availableFilters}/>
                        </BottomSheetScrollView>
                    </BottomSheet>
                }

            </SafeAreaView>


        </View>
    );
};

export default function SearchScreen() {
    return (
        <PageTourProvider>
            <Index/>
        </PageTourProvider>
    );
}

const CARD_RADIUS = 16;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BackgroundColor,

    },
    profileSheetBackground: {
        backgroundColor: COLORS.BackgroundColor,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    profileSheetHandle: {
        backgroundColor: COLORS.SecodaryColor,
        width: 40,
    },
    profileSheetScrollContent: {
        paddingBottom: 32,
    },
    filterSheetBackground: {
        backgroundColor: COLORS.BackgroundColor,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    filterSheetHandle: {
        backgroundColor: COLORS.SecodaryColor,
        width: 40,
    },
    filterSheetScrollContent: {
        paddingBottom: 32,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
    },
    title: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(18),
        color: COLORS.PrimaryColorText,
    },
    formLabel: {
        fontSize: 18,
        fontFamily: "InstrumentSansSemiBold",
        color: COLORS.PrimaryColorText,
    },
    radioGroup: {
        marginTop: 15,
        flexDirection: "column",
        gap: 18,
    },
    radioButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: SPACING.sm,
    },
    radioText: {
        fontSize: 16,
        fontFamily: "InstrumentSansSemiBold",
        color: COLORS.PrimaryColorText,
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.Gray_2,
        alignItems: "center",
        justifyContent: "center",
    },
    radioSelected: {
        width: 16,
        height: 16,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.PrimaryColor,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        marginBottom: 16,
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
        flex: 1,
        fontSize: 12,
        color: '#6C6C6C',
        fontFamily: 'InstrumentSansRegular',
        marginRight: 8,
    },
    locationAvailabilityRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 4,
    },
    availabilityRow: {
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 0,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 5,
    },
    availabilityLabel: {
        fontSize: 12,
        color: "#181818",
        fontFamily: "InstrumentSansSemiBold",
        maxWidth: 72,
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
    statusPending: {
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "red",
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    statusApprove: {
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "green",
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
    statusPendingTxt: {
        fontSize: 13,
        fontWeight: '700',
        color: "red"
    },
    statusApproveTxt: {
        fontSize: 13,
        fontWeight: '700',
        color: "green"
    },
    requestTxt: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    tag: {
        borderColor: c.SecodaryColor, // you can replace with `secondary`
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 4,
        marginRight: 8,
        marginBottom: 6,
    },
    tagText: {
        fontSize: 12,
        color: 'black',
        fontFamily: 'InstrumentSansRegular',
    },
    content: {
        borderWidth: 1,
        borderRadius: wp(100),
        paddingHorizontal: "5%",
        alignItems: 'center',
        backgroundColor: COLORS.White,
        borderColor: COLORS.White,
        flexDirection: "row",
        overflow: "hidden",
        width: "90%",
    },
    textInput: {
        flex: 1,
        fontSize: RFValue(14),
        fontFamily: "InstrumentSansSemiBold",
        height: wp(13),
        color: COLORS.Black
    }
});

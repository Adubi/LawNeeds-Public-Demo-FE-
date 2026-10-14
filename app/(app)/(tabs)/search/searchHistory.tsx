import React, {useState} from 'react';
import {Image, Modal, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {SafeAreaView} from "react-native-safe-area-context";
import {BORDER_RADIUS, SPACING} from "@/constants/theme";
import {router} from "expo-router";
import {MaterialIcons} from "@expo/vector-icons";
import SearchComponents from "../../../../components/Search/SearchComponents";
import {widthPercentageToDP as wp} from "react-native-responsive-screen";
import {COLORS} from "@/constants/colors";
import SearchList from "../../../../components/Search/SearchList";
import {Button} from "@/components/Button";
import {RFValue} from "react-native-responsive-fontsize";
import {useTranslation} from 'react-i18next';




const data = [
    {
        id: '1',
        name: 'Ayomide Oyeanusi',
        cases: '250+',
        satisfaction: '95%',
        tags: ['Real Estate', 'Immigration', '+5 more'],
        distance: '5 Miles from you, London, UK',
        topRated: true,
        badge: 'IAA',
        status:"Pending",
        image:  'https://via.placeholder.com/50', // replace with real URL
    },
    {
        id: '2',
        name: 'Ayomide Oyeanusi',
        cases: '250+',
        satisfaction: '95%',
        tags: ['Real Estate', 'Immigration'],
        distance: '5 Miles from you, London, UK',
        topRated: false,
        status:"Approved",
        image: 'https://via.placeholder.com/50',
    },
    {
        id: '3',
        name: 'Ayomide Oyeanusi',
        cases: '250+',
        satisfaction: '95%',
        tags: ['Real Estate', 'Immigration'],
        distance: '5 Miles from you, London, UK',
        topRated: true,
        badge: 'SRA',
        status:"Pending",
        image: 'https://via.placeholder.com/50',
    },
    {
        id: '4',
        name: 'Ayomide Oyeanusi',
        cases: '250+',
        satisfaction: '95%',
        tags: ['Real Estate', 'Immigration'],
        distance: '5 Miles from you, London, UK',
        topRated: false,
        badge: 'IAA',
        status:"Approved",
        image: 'https://via.placeholder.com/50',
    },
];
const SearchHistory = () => {

    const { t } = useTranslation();

    const [search, setSearch] = useState("")
    const [modalVisible, setModalVisible] = useState(false)
    const [selectedTypesOption, setSelectedTypesOption] = useState<string | null>(null)
    const typesOptions = [{"id": "distance", "name": t('search.distance')}, {"id": "city", "name": t('search.city')}]

    return (
        <GestureHandlerRootView style={{flex: 1}}>
            <SafeAreaView style={styles.container}>
                    <View style={{flexDirection: "row", alignItems: "center", padding: SPACING.md,}}>
                        <TouchableOpacity
                            onPress={() => router.replace("/(app)/(tabs)")}
                            style={styles.backButton}
                            accessibilityRole="button"
                            accessibilityLabel="Go back"
                        >
                            <MaterialIcons name="arrow-back-ios" size={24}/>
                        </TouchableOpacity>
                        <Text style={styles.title} allowFontScaling={false}>
                            {'search.professionals'}
                        </Text>


                    </View>
                    <View style={{flexDirection: "row", padding: SPACING.sm,}}>
                        <SearchComponents searchText={search} setSearchText={setSearch}/>
                        <TouchableOpacity onPress={() => {
                            setModalVisible(true)
                        }} style={{justifyContent: "center", marginStart: 10}}>
                            {/*<MaterialCommunityIcons name={filterIcon} size={35}/>*/}
                            {/*<Image source={require(filter)} />*/}
                            {!modalVisible ?   <Image style={{  width: wp(6),
                                height: wp(6),}} source={require("../../../../assets/images/ic_filter.png")} />:  <Image style={{  width: wp(6),
                                height: wp(6),}} source={require("../../../../assets/images/ic_filter_selected.png")} />}

                        </TouchableOpacity>
                    </View>
                    <View style={{flex:1,backgroundColor:COLORS.White}}>
                        <SearchList data={data} onRequest={() => undefined} />

                    </View>

                    <Modal
                        animationType="slide"
                        transparent={true}

                        visible={modalVisible}
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <View
                            style={{
                                flex: 1,
                                justifyContent: 'flex-end',
                                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            }}
                        >
                            <View
                                style={{
                                    backgroundColor: COLORS.White,
                                    padding: 20,
                                    borderTopLeftRadius: 20,
                                    borderTopRightRadius: 20,
                                    width: '100%',
                                    maxHeight: '80%',
                                }}
                            >


                                <View style={{marginHorizontal: 15, marginTop: 20, marginBottom: 40}}>
                                    <Text style={styles.title}>{t('sort_by')}</Text>
                                    <View style={styles.radioGroup}>
                                        {
                                            typesOptions.map((item, index) => (
                                                <TouchableOpacity
                                                    key={index}
                                                    style={styles.radioButton}
                                                    onPress={() => setSelectedTypesOption(item.id)}
                                                >
                                                    <View style={styles.radio}>
                                                        {selectedTypesOption === item.id &&
                                                        <View style={styles.radioSelected}/>}
                                                    </View>
                                                    <Text style={styles.radioText}>{item.name}</Text>
                                                </TouchableOpacity>
                                            ))
                                        }
                                    </View>
                                </View>


                                <Button
                                    title={t('apply')}
                                    onPress={() => setModalVisible(false)}
                                    variant="secondary"
                                    style={{marginTop: 25}}
                                />
                            </View>
                        </View>
                    </Modal>
                </SafeAreaView>
        </GestureHandlerRootView>
    );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BackgroundColor,

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
});
export default SearchHistory;

import React, {useEffect, useState} from "react";
import {FlatList, Platform, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";

import {widthPercentageToDP as wp,} from "react-native-responsive-screen";
import {COLORS} from "@/constants/colors";
import {RFValue} from "react-native-responsive-fontsize";
import {useLocalSearchParams, useRouter} from "expo-router";
import {SPACING} from "@/constants/theme";
import {useTranslation} from 'react-i18next';
import {changeAppLanguage, getAppSelectedLanguage, languageDataList} from "@/components/i18n";
import {Ionicons, MaterialIcons} from "@expo/vector-icons";
import {useApp} from "@/contexts/AppContext";


const SelectLanguage = () => {

    const {t} = useTranslation();
    const [selectedLanguage, setSelectedLanguage] = useState(languageDataList[0]);
    const {triggerLanguageUpdate} = useApp();

    const router = useRouter();
    const params = useLocalSearchParams();

    const handleBack = () => {
        router.back();
    };

    useEffect(() => {

        if (selectedLanguage) {
            changeAppLanguage(selectedLanguage.code)
            triggerLanguageUpdate();

        }

    }, [selectedLanguage])

    useEffect(() => {

        const getSelectedLanguage = async () => {
            const code = await getAppSelectedLanguage();

            const selectedLang =
                languageDataList.find(item => item.code === code) ||
                languageDataList[0];
            setSelectedLanguage(selectedLang)
        };

        getSelectedLanguage();
    }, [])


    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                    onPress={() => handleBack()}
                    style={styles.backButton}
                    accessibilityRole="button"
                    accessibilityLabel={('change_email.go_back')}
                >
                    <MaterialIcons name="arrow-back-ios" size={24} />
                </TouchableOpacity>
                <Text style={styles.title} allowFontScaling={false}>
                    {t('setting.select_language')}
                </Text>
            </View>

            <View
                style={{
                    flex: 1,
                    justifyContent: "flex-end",
                    gap: 15,
                    marginBottom: Platform.OS !== "ios" ? 60 : 40
                }}
            >

                <FlatList
                    contentContainerStyle={{ paddingBottom: 40, marginTop: 20 }}
                    keyExtractor={(item) => item.code}
                    data={languageDataList}
                    ItemSeparatorComponent={() => (
                        <View style={{ height: 1, backgroundColor: '#e0e0e0', marginHorizontal: 16 }} />
                    )}
                    renderItem={({ item }) => {
                        const isSelected = item.code === selectedLanguage?.code;
                        return (
                            <TouchableOpacity
                                style={{
                                    backgroundColor: isSelected ? '#e6f4ea' : 'transparent',
                                    borderLeftWidth: isSelected ? 4 : 0,
                                    borderLeftColor: '#28a745',
                                    paddingVertical: 15,
                                    paddingHorizontal: 16,
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                                onPress={() => setSelectedLanguage(item)}
                            >
                                <Text
                                    style={{
                                        ...styles.itemText,
                                        fontWeight: isSelected ? 'bold' : 'normal',
                                        color: isSelected ? '#28a745' : '#000',
                                    }}
                                >
                                    {item.name}
                                </Text>

                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    {isSelected ?
                                        <Ionicons name="checkmark" size={24} color="#28a745"/>
                                        :
                                        <Ionicons name="chevron-forward" size={24} color="#aaa"/>
                                    }
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />



              {/*  <TouchableOpacity
                    style={[
                        styles?.button,
                        {backgroundColor: COLORS.PrimaryColor, width: wp(90)},
                    ]}
                    onPress={() => {
                        setModalVisible(true)
                    }}
                >
                    <Text
                        style={[styles.buttonText, {color: COLORS.White}]}
                        allowFontScaling={false}
                    >
                        {t('done')}
                    </Text>
                </TouchableOpacity>*/}
            </View>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BackgroundColor,
        padding: SPACING.md,
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
    text: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
        color: COLORS.PrimaryColorText,
    },
    buttonText: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
    },
    button: {
        padding: wp(3.5),
        width: "40%",
        borderRadius: wp(100),
        marginHorizontal: wp(3.5),
        justifyContent: "center",
        alignItems: "center",
    },
    secondaryButtonText: {
        color: COLORS.Gray,
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
    },
    reviewButton_two: {
        flex: 1,
        borderColor: COLORS.PrimaryColor,
        shadowColor: COLORS.PrimaryColor,
        borderWidth: 2,
    },
    bottomDivider: {
        width: "100%",
        height: 1,
        backgroundColor: "#C0C0C0",
        marginVertical: 10,
    },
    closeButton: {
        position: "absolute",
        top: 10,
        right: 10,
        padding: 10,
        justifyContent: "center",
    },
    closeButtonImage: {
        width: 24,
        height: 24,
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignContent:'center',
        backgroundColor: 'rgba(0,0,0,0.4)',

    },
    modalContainer: {
        marginStart: 20,
        marginEnd: 20,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    itemText: {
        fontSize: 16,
    },
    doneButton: {
        backgroundColor: '#007AFF',
        borderRadius: 6,
        height: 40,
        marginTop: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doneButtonText: {
        color: 'white',
        fontWeight: 'bold',
    }
});

export default SelectLanguage;

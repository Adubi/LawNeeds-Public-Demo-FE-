import React from 'react';
import {Image, StyleSheet, TextInput, TouchableOpacity, View} from "react-native";
import {widthPercentageToDP as wp} from "react-native-responsive-screen";
import {RFValue} from "react-native-responsive-fontsize";
import {COLORS} from "@/constants/colors";
import {MaterialIcons} from "@expo/vector-icons";
import {useTranslation} from 'react-i18next';

type SearchComponentsProps = {
    searchText: string;
    setSearchText: (value: string) => void;
};

const SearchComponents = ({searchText, setSearchText}: SearchComponentsProps) => {
    const {t} = useTranslation();

    return (
        <View style={style.content}>
            <Image
                source={require("../../assets/images/ic_icon_search.png")}
                style={{width: wp(5), height: wp(5), marginEnd: 10}}
            />

            <TextInput
                style={style.textInput}
                value={searchText}
                placeholderTextColor={"#808080"}
                onChangeText={setSearchText}
                placeholder={t('tab.search')}
                allowFontScaling={false}
            />

            {searchText?.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText("")}>
                    <MaterialIcons name="close" size={20} color="#808080"/>
                </TouchableOpacity>
            )}
        </View>
    );
};

const style = StyleSheet.create({
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

export default SearchComponents;

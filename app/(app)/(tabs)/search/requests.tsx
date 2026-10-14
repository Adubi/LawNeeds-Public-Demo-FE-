import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {SafeAreaView} from "react-native-safe-area-context";
import {router} from "expo-router";
import {MaterialIcons} from "@expo/vector-icons";
import {COLORS} from "@/constants/colors";
import {SPACING} from "@/constants/theme";
import {RFValue} from "react-native-responsive-fontsize";
import RequestList from "../../../../components/Search/requestList";


const data = [
    {
        id: '1',
        name: 'Ayomide Oyeanusi',
        distance: '5 Miles from you, London, UK',
        image:  'https://via.placeholder.com/50', // replace with real URL
    },
    {
        id: '2',
        name: 'Ayomide Oyeanusi',

        distance: '5 Miles from you, London, UK',
        isUrgent:true,
        image: 'https://via.placeholder.com/50',
    },
    {
        id: '3',
        name: 'Ayomide Oyeanusi',
        distance: '5 Miles from you, London, UK',
        image: 'https://via.placeholder.com/50',
    },
    {
        id: '4',
        name: 'Ayomide Oyeanusi',
        isUrgent:true,
        distance: '5 Miles from you, London, UK',
        image: 'https://via.placeholder.com/50',
    },
];

const Requests = () => {
    return (
        <GestureHandlerRootView style={{flex: 1}}>
            <SafeAreaView style={styles.container}>
                    <View style={{flexDirection: "row", alignItems: "center",  padding: SPACING.md,}}>
                        <TouchableOpacity
                            onPress={() => router.replace("/(app)/(tabs)")}
                            style={styles.backButton}
                            accessibilityRole="button"
                            accessibilityLabel="Go back"
                        >
                            <MaterialIcons name="arrow-back-ios" size={24}/>
                        </TouchableOpacity>
                        <Text style={styles.title} allowFontScaling={false}>
                            Requests
                        </Text>


                    </View>
                    <View style={{flex:1,backgroundColor:COLORS.White}}>
                        <RequestList
                            data={data}
                            loginUserData={null}
                            isActive={true}
                            isProUser={false}
                            onListItemClick={() => undefined}
                            setRefreshItem={() => undefined}
                        />

                    </View>
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

});
export default Requests;

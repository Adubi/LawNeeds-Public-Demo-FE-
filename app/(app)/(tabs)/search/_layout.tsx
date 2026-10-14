import React from 'react';
import {View} from "react-native";
import {Slot} from "expo-router";

const SearchLayout = () => {
    return (
        <>
            <Slot screenOptions={{ headerShown: false }}/>
        </>
    );
};

export default SearchLayout;

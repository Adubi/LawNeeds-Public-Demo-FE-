import React from 'react';
import {Slot} from "expo-router";

const _layout = () => {
    return (
        <>
            <Slot screenOptions={{
                headerShown: false
            }}/>
        </>
    );
};

export default _layout;

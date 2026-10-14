import React from "react";
import {Slot} from "expo-router";

const ProfileLayout = () => (
  <>
  <Slot screenOptions={{ headerShown: false }}/>
  </>
);

export default ProfileLayout;

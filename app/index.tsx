import React, {useEffect} from "react";
import {View} from "react-native";
import {enableScreens} from 'react-native-screens';
import {useRouter} from "expo-router";
import {getAuthToken} from "@/services/httpservice";
import {identityVerificationDestination} from "@/services/identityVerificationNavigation";

enableScreens(true);

const SplashScreen: React.FC = () => {
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
          try {
            const token = await getAuthToken();

            if (token) {
              router.replace(await identityVerificationDestination() as any);
            } else {
              router.replace("/welcome");
            }
          } catch (e) {
            router.replace("/welcome");
          }
        };

        checkAuth();
    }, []);

    return <View/>;
};

export default SplashScreen;

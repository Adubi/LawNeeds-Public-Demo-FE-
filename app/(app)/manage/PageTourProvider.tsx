import React, {createContext, memo} from "react";
import {View} from "react-native";
import {TourGuideProvider, useTourGuideController} from "rn-tourguide";
import CustomTourTooltip from "@/app/(app)/manage/CustomTourTooltip";

export const TourCanStartContext = createContext(false);

function ReadyGate({children}: {children: React.ReactNode}) {
    const {canStart} = useTourGuideController();
    return (
        <TourCanStartContext.Provider value={canStart ?? false}>
            {children}
        </TourCanStartContext.Provider>
    );
}

const PageTourProvider = memo(function PageTourProvider({children}: {children: React.ReactNode}) {
    return (
        <View style={{flex: 1}}>
            <TourGuideProvider
                backdropColor="rgba(0,0,0,.65)"
                borderRadius={14}
                androidStatusBarVisible
                tooltipComponent={CustomTourTooltip}
                animationDuration={0}
                wrapperStyle={{flex: 1}}
            >
                <ReadyGate>
                    {children}
                </ReadyGate>
            </TourGuideProvider>
        </View>
    );
});

export default PageTourProvider;

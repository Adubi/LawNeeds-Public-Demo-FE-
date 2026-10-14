import React, {memo} from "react";
import {TourGuideZone} from "rn-tourguide";
import {StyleProp, ViewStyle} from "react-native";

type Props = {
    children: React.ReactNode;
    zone: number;
    text: string;
    title?: string;
    active?: boolean;
    keepTooltipPosition?: boolean;
    shape?: "circle" | "rectangle";
    style?: StyleProp<ViewStyle>;
};

const TourHighlight = memo(function TourHighlight({
                                                      children,
                                                      zone,
                                                      text,
                                                      title,
                                                      active = true,
                                                      keepTooltipPosition = true,
                                                      shape = "rectangle",
                                                      style,
                                                  }: Props) {
    if (!active) return <>{children}</>;

    return (
        <TourGuideZone
            zone={zone}
            text={JSON.stringify({title: title ?? "", description: text})}
            keepTooltipPosition={keepTooltipPosition}
            shape={shape}
            style={style}

            isTourGuide
        >
            {children}
        </TourGuideZone>
    );
});

export default TourHighlight;

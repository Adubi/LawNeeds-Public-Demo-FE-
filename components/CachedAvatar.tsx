import React from "react";
import {Image} from "react-native";

type CachedAvatarProps = {
    uri?: string | null;
    style: any;
    resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
};

export const CachedAvatar = ({uri, style, resizeMode = "cover"}: CachedAvatarProps) => {
    if (!uri) {
        return null;
    }

    return (
        <Image
            source={{uri, cache: "force-cache"}}
            style={style}
            resizeMode={resizeMode}
        />
    );
};

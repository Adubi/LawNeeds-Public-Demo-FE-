import { Alert } from "react-native";

// Function to show a two-button alert
export const showTwoButtonAlert = ({
                                title = "",
                                message = "",
                                okLabel = "OK",
                                cancelLabel = "Cancel",
                                onOkPress = () => {},
                                onCancelPress = () => {},
                            }) => {
    Alert.alert(
        title,
        message,
        [
            {
                text: cancelLabel,
                style: "cancel",
                onPress: onCancelPress,
            },
            {
                text: okLabel,
                onPress: onOkPress,
            },
        ],
        { cancelable: false }
    );
};

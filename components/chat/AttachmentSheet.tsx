import {Modal, Platform, Text, TouchableOpacity, View} from "react-native";
import {COLORS as c} from "@/constants/colors";
import {RFValue} from "react-native-responsive-fontsize";
import {Entypo, FontAwesome5} from "@expo/vector-icons";
import {Button} from "@/components/Button";
import React from "react";
import {useTranslation} from "react-i18next";
import {useSafeAreaInsets} from "react-native-safe-area-context";


type AttachmentSheetProps = {
    isShowAttachmentSheet: boolean;
    onClose: () => void;
    onRecordingStarted: () => void | Promise<void>;
    onAttachment: () => void | Promise<void>;
    onImageAttachment: () => void | Promise<void>;
};

const AttachmentSheet = ({
                             isShowAttachmentSheet,
                             onClose,
                             onRecordingStarted,
                             onAttachment,
                             onImageAttachment,
                         }: AttachmentSheetProps) => {

        const {t} = useTranslation();
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={isShowAttachmentSheet}
                onRequestClose={() => onClose}
            >
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'flex-end',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    }}
                >
                    <View
                        style={{
                            backgroundColor: c.BackgroundColor,
                            padding: 20,
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            width: '100%',
                            maxHeight: '80%',
                        }}
                    >

                        <Text style={{
                            fontSize: RFValue(14),
                            fontFamily: "InstrumentSansBold",
                            marginBottom: 5,
                            textAlign: 'center'
                        }}>{t("search.select")}</Text>
                        <View style={{
                            width: "100%",
                            height: 1,

                            backgroundColor: "#C0C0C0",
                            marginVertical: 10,
                        }}/>
                        <View style={{flexDirection: "row", justifyContent: "space-evenly"}}>
                            <TouchableOpacity
                                style={{
                                    alignItems: "center",
                                    justifyContent: "center",
                                    paddingVertical: 10
                                }}
                                onPress={() => {
                                    onClose();
                                    if (onRecordingStarted) {
                                        onRecordingStarted();
                                    }
                                }}
                            >
                                <View
                                    style={{
                                        backgroundColor: "white",
                                        padding: 12,
                                        borderRadius: 12,
                                        elevation: 3, // for Android shadow
                                        shadowColor: "#000", // for iOS shadow
                                        shadowOffset: {width: 0, height: 1},
                                        shadowOpacity: 0.2,
                                        shadowRadius: 2,
                                        marginBottom: 5,
                                    }}
                                >
                                    <FontAwesome5 name={"record-vinyl"} size={30} color="#000"/>
                                </View>
                                <Text style={{
                                    fontFamily: "InstrumentSansSemiBold",
                                    fontSize: RFValue(14),
                                    textAlign: 'center'
                                }}>{t('record')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{paddingVertical: 10, justifyContent: "center", alignContent: "center"}}
                                onPress={() => {
                                    onClose();
                                    if (onImageAttachment) {
                                        onImageAttachment()
                                    }
                                }}
                            >
                                <View
                                    style={{
                                        backgroundColor: "white",
                                        padding: 12,
                                        borderRadius: 12,
                                        elevation: 3, // for Android shadow
                                        shadowColor: "#000", // for iOS shadow
                                        shadowOffset: {width: 0, height: 1},
                                        shadowOpacity: 0.2,
                                        shadowRadius: 2,
                                        marginBottom: 5,
                                    }}
                                >
                                    <FontAwesome5 name={"image"} size={30} color="#000"/>
                                </View>
                                <Text
                                    style={{
                                        fontFamily: "InstrumentSansSemiBold",
                                        fontSize: RFValue(14),
                                        textAlign: "center",
                                        color: "#000",
                                    }}
                                >
                                    {t('media')}
                                </Text>

                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{paddingVertical: 10, justifyContent: "center", alignItems: "center"}}
                                onPress={() => {
                                    onClose();
                                    if (onAttachment) {
                                        onAttachment();
                                    }
                                }}
                            >
                                <View
                                    style={{
                                        backgroundColor: "white",
                                        padding: 12,
                                        width: 54,           // Fixed width
                                        height: 54,          // Fixed height
                                        alignItems: 'center',     // Center icon horizontally
                                        justifyContent: 'center', // Center icon vertically
                                        borderRadius: 12,
                                        elevation: 3,
                                        shadowColor: "#000", // for iOS shadow
                                        shadowOffset: {width: 0, height: 1},
                                        shadowOpacity: 0.2,
                                        shadowRadius: 2,
                                        marginBottom: 5,
                                    }}
                                >
                                    <Entypo name={"attachment"} size={30} color="#000"/>
                                </View>
                                <Text
                                    style={{
                                        fontFamily: "InstrumentSansSemiBold",
                                        fontSize: RFValue(14),
                                        textAlign: 'center'
                                    }}>{t('attach')}</Text>
                            </TouchableOpacity>

                        </View>
                        <Button
                            title={t('cancel')}
                            onPress={onClose}
                            variant="secondary"
                            style={{
                                marginTop: 25,
                                marginBottom: Platform.OS === "ios" ? useSafeAreaInsets().bottom : 0,
                            }}
                        />
                    </View>
                </View>
            </Modal>
        )

    };

export default AttachmentSheet;

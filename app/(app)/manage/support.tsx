import {
    Alert, Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Image,
    Pressable,
} from "react-native";
import React, {useState} from "react";
import {SafeAreaView} from "react-native-safe-area-context";
import {COLORS} from "@/constants/colors";
import {SPACING} from "@/constants/theme";
import {router} from "expo-router";
import {MaterialIcons} from "@expo/vector-icons";
import {RFValue} from "react-native-responsive-fontsize";
import {Button} from "@/components/Button";
import UserService from "@/services/UserServices";
import {useTranslation} from 'react-i18next';
import * as ImagePicker from "expo-image-picker";
import {KeyboardAwareScrollView} from "react-native-keyboard-controller";

type SelectedImage = {
    uri: string;
    name: string;
    type: string;
};

const Support = () => {

    const {t} = useTranslation();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [comment, setComment] = useState("");
    const [images, setImages] = useState<SelectedImage[]>([]);
    const [previewImage, setPreviewImage] = useState<SelectedImage | null>(null);

    const AppDialog = (title: string, message: string) => {

        Alert.alert(
            title,
            message,
            [
                {
                    text: t('ok'),
                    onPress: () => {
                        router.back();
                    },
                },
            ],
            {cancelable: true}
        );
    }

    const handleSubmit = async () => {

        if (name === "") {
            Alert.alert(t('validation.missing_info'), t('validation.enter_your_name'))
        } else if (email === "") {
            Alert.alert(t('validation.missing_info'), t('validation.enter_your_email'))
        } else if (phone === "") {
            Alert.alert(t('validation.missing_info'), t('validation.enter_your_phone'))
        } else if (comment === "") {
            Alert.alert(t('validation.missing_info'), t('validation.enter_feedback'))
        } else {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("email", email);

            formData.append("phone", phone);
            formData.append("comment", comment);

            images.forEach((image) => {
                formData.append("photos", {
                    uri: image.uri,
                    name: image.name,
                    type: image.type,
                } as any);
            });

            const response = await UserService.SubmitFeedback(formData);

            if (response) {
                AppDialog(t('success.success'), t('support.feedback_success'))
            } else {
                AppDialog(t('error.title'), t('error.error_msg'))
            }
        }
    }
    const pickImage = async () => {

        try {

            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                alert(t('per.camera_roll'));

                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsMultipleSelection: true,
                selectionLimit: 0,
                allowsEditing: false,
                quality: 0.7,
            });

            if (!result.canceled) {
                const selectedImages = result.assets.map((asset) => {
                    const localUri = asset.uri;
                    const filename = asset.fileName || localUri.split("/").pop() || `support-image-${Date.now()}.jpg`;
                    const match = /\.(\w+)$/.exec(filename || "");
                    const type = asset.mimeType || (match ? `image/${match[1]}` : "image/jpeg");

                    return {
                        uri: localUri,
                        name: filename,
                        type,
                    };
                });

                setImages((current) => {
                    const existing = new Set(current.map((image) => image.uri));
                    const uniqueNewImages = selectedImages.filter((image) => !existing.has(image.uri));
                    return [...current, ...uniqueNewImages];
                });

            } else {
                console.log("Image selection was canceled.");
            }
        } catch (error: any) {
            console.error("Error updating profile picture:", error.response ? error.response.data : error.message);
        }
    }

    const removeImage = (uri: string) => {
        setImages((current) => current.filter((image) => image.uri !== uri));
        if (previewImage?.uri === uri) {
            setPreviewImage(null);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Modal
                visible={previewImage !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setPreviewImage(null)}
            >
                <View style={styles.previewOverlay}>
                    <View style={styles.previewHeader}>
                        <Text style={styles.previewTitle} numberOfLines={1}>
                            {previewImage?.name}
                        </Text>
                        <TouchableOpacity
                            onPress={() => setPreviewImage(null)}
                            style={styles.previewCloseButton}
                            accessibilityRole="button"
                            accessibilityLabel="Close image preview"
                        >
                            <MaterialIcons name="close" size={26} color="#fff"/>
                        </TouchableOpacity>
                    </View>
                    {previewImage && (
                        <Image
                            source={{uri: previewImage.uri}}
                            style={styles.previewImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>

            <KeyboardAwareScrollView
                keyboardDismissMode="interactive"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                bottomOffset={80}
                extraKeyboardSpace={80}
                style={{
                    flex: 1,
                    marginBottom: 48
                }}
                contentContainerStyle={styles.scrollContent}
            >

                <View style={{flexDirection: "row", alignItems: "center"}}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                        accessibilityRole="button"
                        accessibilityLabel={t('change_email.go_back')}
                    >
                        <MaterialIcons name="arrow-back-ios" size={24}/>
                    </TouchableOpacity>
                    <Text style={styles.title} allowFontScaling={false}>
                        {t('contact_support')}
                    </Text>
                </View>

                <View style={{flex: 1}}>
                    <Text style={styles.description} allowFontScaling={false}>
                        {t('support.support_desc')}

                    </Text>


                    <View style={{gap: 20, paddingVertical: SPACING.lg}}>
                        <View>
                            <Text style={styles.description} allowFontScaling={false}>
                                {t('support.name')}
                            </Text>
                            <TextInput
                                style={{
                                    width: "100%",
                                    borderBottomWidth: 1,
                                    fontFamily: "InstrumentSansSemiBold",
                                    fontSize: RFValue(14),
                                }}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>
                        <View>
                            <Text style={styles.description} allowFontScaling={false}>
                                {t('email')}
                            </Text>
                            <TextInput
                                style={{
                                    width: "100%",
                                    borderBottomWidth: 1,
                                    fontFamily: "InstrumentSansSemiBold",
                                    fontSize: RFValue(14),
                                }}
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                        <View>
                            <Text style={styles.description} allowFontScaling={false}>
                                {t('phone_number')}
                            </Text>

                            <TextInput
                                style={{
                                    width: "100%",
                                    borderBottomWidth: 1,
                                    fontFamily: "InstrumentSansSemiBold",
                                    fontSize: RFValue(14),
                                }}
                                keyboardType={"number-pad"}
                                value={phone}
                                onChangeText={setPhone}
                            />
                        </View>
                        <View>
                            <Text style={styles.description} allowFontScaling={false}>
                                {t('support.comment')}
                            </Text>
                            <TextInput
                                style={{
                                    width: "100%",
                                    height: 100,
                                    borderBottomWidth: 1,
                                    fontFamily: "InstrumentSansSemiBold",
                                    fontSize: RFValue(14),
                                    textAlignVertical: "top", // ✅ Important for multiline input
                                    textAlign: "left",
                                }}
                                multiline={true}
                                value={comment}
                                onChangeText={setComment}
                                numberOfLines={5}
                            />
                        </View>

                        <View style={{width: "100%",}}>
                            <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
                                <View style={{justifyContent: "center", alignItems: "center", flex: 1}}>
                                    <MaterialIcons name="add-photo-alternate" size={50} color="#aaa"/>
                                    <Text style={styles.text}>
                                        {images.length > 0 ? "Add more images" : t('tap_to_upload_image')}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {images.length > 0 && (
                                <View style={styles.imageGrid}>
                                    {images.map((image, index) => (
                                        <View key={`${image.uri}-${index}`} style={styles.imagePreviewCard}>
                                            <Pressable
                                                onPress={() => setPreviewImage(image)}
                                                style={styles.imagePreviewButton}
                                            >
                                                <Image source={{uri: image.uri}} style={styles.image}/>
                                            </Pressable>
                                            <TouchableOpacity
                                                onPress={() => removeImage(image.uri)}
                                                style={styles.removeImageButton}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Remove ${image.name}`}
                                            >
                                                <MaterialIcons name="close" size={18} color="#fff"/>
                                            </TouchableOpacity>
                                            <Text style={styles.imageName} numberOfLines={1}>
                                                {image.name}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                            <View>
                                <Text style={styles.imageHint}>
                                    {images.length > 0 ? "Tap an image to preview it." : "You can upload one or more screenshots/images."}
                                </Text>
                            </View>
                        </View>
                        <View
                            style={{
                                width: "100%",
                            }}
                        >
                            <View
                                style={{
                                    width: "40%",
                                    marginBottom: 40,
                                    alignItems: "flex-end",
                                    marginLeft: "auto",
                                }}
                            >
                                <Button
                                    title={t('submit')}
                                    onPress={() => handleSubmit()}
                                    loading={false}
                                    variant="secondary"
                                />
                            </View>
                        </View>


                    </View>

                </View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
};

export default Support;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BackgroundColor,
        padding: SPACING.md,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 120,
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
    text: {
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
        color: COLORS.PrimaryColorText,
    },
    description: {
        marginTop: SPACING.sm,
        fontFamily: "InstrumentSansRegular",
        fontSize: RFValue(15),
        color: COLORS.PrimaryColorText,
    },
    footerContainer: {
        position: 'absolute',
        bottom: 10, // Adjust spacing as needed
        width: '100%',
        alignItems: 'center',
    },
    footerText: {
        fontSize: RFValue(12),
        fontStyle: 'italic',
        textAlign: 'center',
        color: '#666', // optional: make it a bit lighter
    },
    imageBox: {
        width: "100%",
        height: 150,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ccc',
        backgroundColor: '#f8f8f8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    imageGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 12,
        marginBottom: 8,
    },
    imagePreviewCard: {
        width: "31%",
        minWidth: 96,
        position: "relative",
    },
    imagePreviewButton: {
        width: "100%",
        aspectRatio: 1,
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: "#f8f8f8",
        borderWidth: 1,
        borderColor: "#ddd",
    },
    removeImageButton: {
        position: "absolute",
        top: -8,
        right: -8,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#D64545",
        zIndex: 2,
    },
    imageName: {
        marginTop: 6,
        fontFamily: "InstrumentSansRegular",
        fontSize: RFValue(10),
        color: COLORS.PrimaryColorText,
    },
    imageHint: {
        fontFamily: "InstrumentSansRegular",
        fontSize: RFValue(12),
        color: "#666",
        marginTop: 4,
    },
    previewOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.92)",
        padding: SPACING.md,
        justifyContent: "center",
    },
    previewHeader: {
        position: "absolute",
        top: 48,
        left: SPACING.md,
        right: SPACING.md,
        zIndex: 2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    previewTitle: {
        flex: 1,
        color: "#fff",
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
    },
    previewCloseButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.16)",
        alignItems: "center",
        justifyContent: "center",
    },
    previewImage: {
        width: "100%",
        height: "80%",
    },
    placeholderText: {
        color: '#999',
        textAlign: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
});

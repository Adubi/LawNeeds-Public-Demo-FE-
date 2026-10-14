import React from 'react';
import {WebView} from "react-native-webview";
import {Alert, Dimensions, StyleSheet, TouchableOpacity, View} from "react-native";
import {router, useLocalSearchParams} from "expo-router";
import {MaterialIcons} from "@expo/vector-icons";
import {ThemedText} from "@/components/ThemedText";
import {COLORS as c} from "@/constants/colors";
import {SPACING} from "@/constants/theme";

import {Edges, SafeAreaView} from "react-native-safe-area-context";
import * as FileSystem from 'expo-file-system/legacy';

import * as Sharing from 'expo-sharing';
import * as Print from "expo-print";
import {useTranslation} from "react-i18next";

const ManuScriptViewer = () => {

    const params = useLocalSearchParams();
    const fileParam = Array.isArray(params.file) ? params.file[0] : params.file;
    const file = fileParam || "";
    const {t} = useTranslation();

    const primary = c.PrimaryColor;
    const secondary = c.SecodaryColor;
    const backgroundColor = c.BackgroundColor;
    const textColor = c.PrimaryColorText;
    const inputBg = c.BackgroundColor;

    const styles = createStyles({
        primary,
        secondary,
        inputBackground: inputBg,
        backgroundColor,
        textColor
    });


    const shareManuScript = async () => {
            try {

                // Write content to file
                const htmlContent = await FileSystem.readAsStringAsync(file.toString(), {
                    encoding: FileSystem.EncodingType.UTF8,
                });

                // 2️⃣ Convert HTML → PDF
                const pdf = await Print.printToFileAsync({
                    html: htmlContent,
                });
                const pdfPath = FileSystem.documentDirectory + "manuscript.pdf";

                await FileSystem.moveAsync({
                    from: pdf.uri,
                    to: pdfPath,
                });

                // Open share dialog
                await Sharing.shareAsync(pdfPath, {
                    mimeType: 'text/plain',
                    dialogTitle: t('share_dialog_title'),
                });

            } catch (error) {
                console.error(error);
                Alert.alert('Error', 'Failed to generate manuscript.');
            }

    }

    const edgesData: Edges = ['top', 'left', 'right', 'bottom'];

    return (

        <SafeAreaView edges={edgesData}
            style={{flex: 1, backgroundColor: backgroundColor}}>


            <View style={{flex: 1, backgroundColor: backgroundColor}}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={async () => {

                            router.back()
                        }}
                        style={styles.headerIcon}
                    >
                        <MaterialIcons name="arrow-back-ios" size={24} color={textColor}/>

                    </TouchableOpacity>
                    <ThemedText style={{fontSize: 24, color: textColor, alignSelf: 'center'}}>
                        {t('manuscript')}
                    </ThemedText>
                    <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                    }}>
                        <TouchableOpacity onPress={async () => {
                            await shareManuScript()

                        }} style={styles.headerIcon}>
                            <MaterialIcons name="share" size={24} color={textColor}/>
                        </TouchableOpacity>

                    </View>
                </View>

                <WebView
                    source={{ uri: file }}
                    originWhitelist={["*"]}
                    allowFileAccess={true}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowUniversalAccessFromFileURLs={true}
                    allowFileAccessFromFileURLs={true}
                    setBuiltInZoomControls={false}
                    automaticallyAdjustContentInsets={true}
                    scalesPageToFit={false}
                    contentMode="mobile"
                    style={{ flex: 1, backgroundColor: "#fff" }}
                />


            </View>

        </SafeAreaView>


    );
}

export default ManuScriptViewer;

const createStyles = (colors: {
    primary: string;
    secondary: string;
    inputBackground: string;
    backgroundColor: string;
    textColor: string;
}) => StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        backgroundColor: colors.backgroundColor,
        borderBottomColor: "rgba(0,0,0,0.1)",
        padding: SPACING.md,
    },
    headerIcon: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: 'center',
    },
    pdf: {
        flex:1,
        width: Dimensions.get('window').width,
        height:Dimensions.get('window').height,
    }
});

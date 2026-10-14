import React from "react";
import {Pressable, StyleSheet, View} from "react-native";
import {FontAwesome} from "@expo/vector-icons";


interface FeedbackUiProps {
    messageData: any;
    selectedIndex: number;
    deleteFeedback: (index: number, feedbackId: String) => void;
    selectThumbsUp: (messageData: any, index: number) => void;
    selectThumbsDown: (messageData: any, index: number) => void;
}

const FeedbackUi: React.FC<FeedbackUiProps> = ({ messageData, selectedIndex, deleteFeedback, selectThumbsUp, selectThumbsDown }) => {


    const handleThumbsUp = React.useCallback(() => {

        if (messageData?.feedbackType === 'thumbs_up') {
            deleteFeedback?.(selectedIndex, messageData.feedbackId);
        } else {
            selectThumbsUp?.(messageData, selectedIndex);
        }
    }, [messageData, selectedIndex, deleteFeedback, selectThumbsUp]);

    return (
        <View style={styles.feedbackRowContainer}>

            <View style={styles.feedbackRow}>
                <Pressable
                    onPress={handleThumbsUp}
                    style={({ pressed }) => [
                        styles.feedbackButton,
                        pressed && { opacity: 0.5 },
                    ]}
                >
                    <FontAwesome
                        name={(messageData?.feedbackType === 'thumbs_up') ? 'thumbs-up' : "thumbs-o-up"}
                        size={20}
                        color="#FFD700"/>
                </Pressable>
            </View>
            <View style={styles.feedbackRow}>
                <Pressable
                    onPress={() => {
                        if (messageData?.feedbackType === 'thumbs_down') {
                            if(deleteFeedback) {
                                deleteFeedback(selectedIndex, messageData.feedbackId);
                            }
                        } else {
                            if(selectThumbsDown) {
                                selectThumbsDown(messageData, selectedIndex)
                            }
                        }
                    }}
                    style={({ pressed }) => [
                        styles.feedbackButton,
                        pressed && { opacity: 0.5 },
                    ]}
                >
                    <FontAwesome
                        name={(messageData?.feedbackType === 'thumbs_down') ? 'thumbs-down' : "thumbs-o-down"}
                        size={20}
                        color="#FFD700"
                    />
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    feedbackRow: {
        borderRadius: 12, // half of width/height to make it circular
        borderWidth: 0.6,
        borderColor: 'grey',
        backgroundColor: 'white',
        paddingStart: 6,
        paddingEnd: 6,
        paddingTop: 2,
        paddingBottom: 2,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    feedbackRowContainer: {
        flexDirection: 'row',
     //   marginTop: 2,
        marginStart: 16, // 56
        justifyContent: 'flex-start',

    },
    feedbackButton: {
        padding: 4,
        borderRadius: 20,
    }
});


export default FeedbackUi;

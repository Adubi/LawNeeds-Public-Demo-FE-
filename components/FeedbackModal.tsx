// FeedbackModal.tsx
import React, {useState} from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import {Ionicons} from "@expo/vector-icons";
import {COLORS} from "@/constants/colors";
import {Button} from "./Button";
import {useTranslation} from 'react-i18next';
import {SPACING} from "@/constants/theme";

const reasons = [
    {
        "value": "incorrect_info",
        "label": "incorrect_info"
    },
    {
        "value": "not_helpful",
        "label": "not_helpful"
    },
    {
        "value": "too_generic",
        "label": "too_generic"
    },
    {
        "value": "confusing",
        "label": "confusing"
    },
    {
        "value": "other",
        "label": "other"
    }
];

type FeedbackModalProps = {
    visible: boolean;
    onClose: () => void;
    onSubmit: (reason: any, otherReason: string) => void;
    feedbackReasons: any
};


const FeedbackModal: React.FC<FeedbackModalProps> = ({visible, onClose, onSubmit, feedbackReasons}) => {
    const [selectedReason, setSelectedReason] = useState(0);
    const [otherText, setOtherText] = useState("");

    const {t} = useTranslation();

    let reasonsList = feedbackReasons && feedbackReasons.length > 0 ? feedbackReasons : reasons;

    return (
        <Modal visible={visible} onDismiss={() => {
            onClose()
        }} onRequestClose={(item) => {
            onClose()
        }} transparent animationType="slide">
            <TouchableWithoutFeedback onPress={onClose}>

                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>{`${t('select_reason')}`}</Text>

                        <FlatList
                            data={reasonsList}
                            keyExtractor={(item) => item.value.toString()}
                            renderItem={({item, index}) => {

                                const RoundIcon = selectedReason === index ? 'radio-button-on' : 'radio-button-off'
                                return (
                                    <TouchableOpacity
                                        style={styles.optionContainer}
                                        onPress={() => {
                                            setSelectedReason(index)
                                        }}
                                    >
                                        <Ionicons
                                            name={RoundIcon}
                                            size={24}
                                            color={COLORS.SecodaryColor}
                                        />
                                        <Text style={styles.optionLabel}>{item.label}</Text>
                                    </TouchableOpacity>
                                )
                            }}
                        />

                        {reasonsList[selectedReason].value === "other" &&
                        <View>
                            <Text style={styles.description} allowFontScaling={false}>
                                Enter Reason
                            </Text>
                            <TextInput
                                style={{
                                    width: "100%",
                                    height: 100,
                                    marginTop: 4,
                                    fontFamily: "InstrumentSansRegular",
                                    borderBottomWidth: 1,
                                    fontSize: 16,
                                    textAlignVertical: "top", // ✅ Important for multiline input
                                    textAlign: "left",
                                }}
                                multiline={true}
                                value={otherText}
                                onChangeText={setOtherText}
                                numberOfLines={4}
                            />
                        </View>
                        }

                        <Button title={t('submit')}
                                onPress={() => onSubmit(reasonsList[selectedReason].value, otherText)}
                                style={styles.confirmBtn}/>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};


const styles = StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center',
    },
    modal: {
        backgroundColor: 'white', padding: 20, borderRadius: 8, width: '85%',
    },
    title: {
        fontWeight: 'bold', marginBottom: 12, fontSize: 16,
    },
    reasonBtn: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    confirmBtn: {
        marginTop: 20,
        padding: 10,
        backgroundColor: COLORS.SecodaryColor,
        borderRadius: 8,

        alignItems: 'center',
    },
    closeBtn: {
        marginTop: 10,
        padding: 10,
        backgroundColor: 'gray',
        borderRadius: 6,
        alignItems: 'center',
    },
    optionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    optionLabel: {
        marginLeft: 10,
        fontSize: 16,
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',

    },
    description: {
        marginTop: SPACING.sm,
        fontFamily: "InstrumentSansMedium",
        fontSize: 16,
        color: COLORS.PrimaryColorText,
    },
});

export default FeedbackModal;

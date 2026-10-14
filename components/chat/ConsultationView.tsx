import React, {useState} from 'react';
import {ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {COLORS as c} from "@/constants/colors";
import LawyersList from "@/components/chat/LawyersList";
import {useTranslation} from "react-i18next";
import {Feather} from "@expo/vector-icons";

type Option = {
    value: string;
    label: string;
};
type QuestionProps = {
    optionData: any;
    onSelect: (options: any, type: string, isBack: boolean) => void;
    onSelectLawyer: (referral_id: string, lawyer_data: any) => void;
    onRefreshLawyers?: (referral_id: string, current_lawyer_ids: string[]) => Promise<any>;
    updateFocus: (status: boolean) => void;
};

const ConsultationView: React.FC<QuestionProps> = ({optionData, onSelect, onSelectLawyer, onRefreshLawyers}) => {

    const {t} = useTranslation();

    const [selectedValue, setSelectedValue] = useState<string | null>(null);
    const [notes, setNotes] = useState<string | null>("");
    const [refreshingLawyers, setRefreshingLawyers] = useState(false);

    const handleSelect = (option: Option) => {
        onSelect(option, optionData.next_step, false);
    };

    const secondary = c.SecodaryColor;
    const textColor = c.PrimaryColorText;

    const handleRefreshLawyers = async () => {
        if (!onRefreshLawyers || !optionData?.referral_id || refreshingLawyers) return;

        try {
            setRefreshingLawyers(true);
            const currentLawyerIds = (optionData?.recommended_lawyers || [])
                .map((lawyer: any) => lawyer?.lawyer_id)
                .filter(Boolean);
            await onRefreshLawyers(optionData.referral_id, currentLawyerIds);
        } finally {
            setRefreshingLawyers(false);
        }
    };

    return (
        <View style={styles.container}>

            <View style={styles.optionsContainer}>

                {optionData?.options ?
                    <View style={{
                        borderColor: secondary,
                        borderWidth: 1,
                        borderRadius: 8,
                        padding: 16,
                    }}>

                        { optionData.next_step !== "consultation_type" &&
                        <Pressable
                            onPress={()=> {
                                onSelect(optionData, optionData.next_step, true);
                            }}
                            style={({pressed}) => [
                                {flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 12,
                                borderWidth: 1,
                                borderColor: secondary,
                                borderRadius: 8,
                                paddingVertical: 8,
                                alignSelf: 'flex-start',
                                paddingHorizontal: 12,
                            }, pressed && styles.pressedButton,
                            ]}
                        >
                            <Feather name="arrow-left" size={16} color={secondary} />
                            <Text
                                style={{
                                    color: secondary,
                                    fontWeight: '600',
                                    marginLeft: 6,
                                    fontSize: 16,
                                }}
                            >
                                {t('back')}
                            </Text>
                        </Pressable>
                        }

                        {optionData.next_step === "upload" ?
                            <Text style={styles.questionText}>{t('upload_options')}</Text> :
                            <Text style={styles.questionText}>{t('select_option')}</Text>
                        }
                        {optionData?.options?.map((opt: any) => (
                            <Pressable
                                key={opt.value}
                                onPress={() => handleSelect(opt)}
                                style={({pressed}) => [
                                    styles.optionButton,
                                    selectedValue === opt.value && styles.selectedButton,
                                    pressed && styles.pressedButton,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        selectedValue === opt.value && styles.selectedText,
                                    ]}
                                >
                                    {opt.label}
                                </Text>
                            </Pressable>))}


                    </View> :

                    (optionData.next_step === "select_lawyer" ?
                            <View style={{
                                borderColor: secondary,
                                borderWidth: 1,
                                borderRadius: 8,
                            }}>

                                { optionData.next_step !== "consultation_type" &&
                                    <Pressable
                                        onPress={()=> {
                                            onSelect(optionData, optionData.next_step, true);
                                        }}
                                        style={({pressed}) => [
                                            {flexDirection: 'row',
                                                alignItems: 'center',
                                                marginBottom: 12,
                                                marginTop: 8,
                                                marginStart: 8,
                                                borderWidth: 1,
                                                borderColor: secondary,
                                                borderRadius: 8,
                                                paddingVertical: 8,
                                                alignSelf: 'flex-start',
                                                paddingHorizontal: 12,
                                            }, pressed && styles.pressedButton,
                                        ]}
                                    >
                                        <Feather name="arrow-left" size={16} color={secondary} />
                                        <Text
                                            style={{
                                                color: secondary,
                                                fontWeight: '600',
                                                marginLeft: 6,
                                                fontSize: 16,
                                            }}
                                        >
                                            {t('back')}
                                        </Text>
                                    </Pressable>
                                }

                                <View style={styles.recommendationHeader}>
                                    <Text style={[styles.questionText, styles.recommendationTitle]}>
                                        {t('recommended_professionals')}
                                    </Text>

                                    <Pressable
                                        disabled={refreshingLawyers}
                                        onPress={handleRefreshLawyers}
                                        style={({pressed}) => [
                                            styles.refreshButton,
                                            pressed && styles.pressedButton,
                                            refreshingLawyers && styles.disabledButton,
                                        ]}
                                    >
                                        {refreshingLawyers ? (
                                            <ActivityIndicator size="small" color={secondary}/>
                                        ) : (
                                            <>
                                                <Feather name="refresh-cw" size={16} color={secondary}/>
                                                <Text style={styles.refreshText}>Refresh</Text>
                                            </>
                                        )}
                                    </Pressable>
                                </View>

                                <LawyersList data={optionData?.recommended_lawyers}
                                             onListItemClick={async (item: any, index: any) => {
                                                 onSelectLawyer(optionData.referral_id, item)
                                             }
                                             }/>

                            </View> :
                        (optionData.next_step !== "confirm" ? <View style={{
                                borderColor: secondary,
                                borderWidth: 1,
                                borderRadius: 8,
                                padding: 16,
                            }}>

                                { optionData.next_step !== "consultation_type" &&
                                    <Pressable
                                        onPress={()=> {
                                            onSelect(optionData, optionData.next_step, true);
                                        }}
                                        style={({pressed}) => [
                                            {flexDirection: 'row',
                                                alignItems: 'center',
                                                marginBottom: 12,
                                                borderWidth: 1,
                                                borderColor: secondary,
                                                borderRadius: 8,
                                                paddingVertical: 8,
                                                alignSelf: 'flex-start',
                                                paddingHorizontal: 12,
                                            }, pressed && styles.pressedButton,
                                        ]}
                                    >
                                        <Feather name="arrow-left" size={16} color={secondary} />
                                        <Text
                                            style={{
                                                color: secondary,
                                                fontWeight: '600',
                                                marginLeft: 6,
                                                fontSize: 16,
                                            }}
                                        >
                                            {t('back')}
                                        </Text>
                                    </Pressable>
                                }



                                <Text style={styles.questionText}>{t('search.additional_notes')}</Text>


                                <KeyboardAvoidingView
                                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                                >
                                    <TextInput
                                        value={notes ?? ""}
                                        placeholderTextColor="#888888"
                                        onChangeText={setNotes}
                                        placeholder={t('place_holder_additional_notes')}
                                        style={[styles.textInput, {color: textColor}]}
                                        multiline
                                    />

                                    <View style={{
                                        flexDirection: 'row',
                                        flex: 1,
                                        justifyContent: 'flex-end'
                                    }}>
                                        <Pressable
                                            onPress={() => {
                                                let updatedData = {
                                                    value: "",
                                                    label: ""
                                                }
                                                onSelect(updatedData, optionData.next_step, false);
                                            }}
                                            style={({pressed}) => [styles.button,
                                                pressed &&
                                                styles.buttonPressed, {
                                                    marginEnd: 8,
                                                    paddingStart: 12,
                                                    paddingEnd: 12
                                                }]}
                                        >
                                            <Text style={styles.buttonText}>{t('skip')}</Text>
                                        </Pressable>

                                        <Pressable
                                            onPress={() => {
                                                let updatedData = {
                                                    value: notes,
                                                    label: notes
                                                }
                                                onSelect(updatedData, optionData.next_step, false);
                                            }}
                                            style={({pressed}) => [styles.button,
                                                pressed &&
                                                styles.buttonPressed, {
                                                    paddingStart: 8,
                                                    paddingEnd: 8
                                                }]}
                                        >
                                            <Text style={styles.buttonText}>{t('continue')}</Text>
                                        </Pressable>
                                    </View>
                                </KeyboardAvoidingView>
                            </View> :
                                <Pressable
                                    onPress={()=> {
                                        onSelect(optionData, optionData.next_step, true);
                                    }}
                                    style={({pressed}) => [
                                        {flexDirection: 'row',
                                            alignItems: 'center',
                                            marginBottom: 12,
                                            borderWidth: 1,
                                            borderColor: secondary,
                                            borderRadius: 8,
                                            paddingVertical: 8,
                                            alignSelf: 'flex-start',
                                            paddingHorizontal: 12,
                                        }, pressed && styles.pressedButton,
                                    ]}
                                >
                                    <Feather name="arrow-left" size={16} color={secondary} />
                                    <Text
                                        style={{
                                            color: secondary,
                                            fontWeight: '600',
                                            marginLeft: 6,
                                            fontSize: 16,
                                        }}
                                    >
                                        {t('back')}
                                    </Text>
                                </Pressable>
                        )
                    )

                }
            </View>
        </View>
    );
};

export default ConsultationView;

const styles = StyleSheet.create({
    container: {
        margin: 16,
    },
    messageBubble: {
        backgroundColor: '#E0E0E0',
        padding: 12,
        borderRadius: 16,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    messageText: {
        color: '#333',
    },
    questionText: {
        fontSize: 16,
        marginBottom: 12,
        color: '#000',
        fontWeight: '600',
    },
    optionsContainer: {
        flexDirection: 'column',
        gap: 10,
    },
    optionButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        marginTop: 8,
        borderColor: c.SecodaryColor,
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    pressedButton: {
        backgroundColor: '#666666',
    },
    selectedButton: {
        backgroundColor: '#4A90E2',
        borderColor: '#4A90E2',
    },
    optionText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
        textAlign: 'center',
    },
    selectedText: {
        color: '#fff',
        fontWeight: '600',
    },
    textInput: {
        borderColor: c.SecodaryColor,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        textAlignVertical: 'top', // Ensures text starts at the top
        backgroundColor: 'white',
        minHeight: 100,
        marginBottom: 16,
    },
    button: {
        backgroundColor: c.SecodaryColor,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonPressed: {
        backgroundColor: c.PrimaryColor,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    recommendationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginStart: 16,
        marginTop: 8,
        marginEnd: 16,
        marginBottom: 12,
    },
    recommendationTitle: {
        flex: 1,
        marginBottom: 0,
    },
    refreshButton: {
        minHeight: 36,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: c.SecodaryColor,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#fff',
    },
    refreshText: {
        color: c.SecodaryColor,
        fontSize: 14,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.6,
    },
});

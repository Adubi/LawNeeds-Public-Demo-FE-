import {Modal, Pressable, StyleSheet, Text, TextProps, TouchableOpacity, View} from 'react-native';

import {useThemeColor} from '@/hooks/useThemeColor';
import {Ionicons} from "@expo/vector-icons";
import React, {useState} from "react";
import SearchList from "./Search/SearchList";
import {router} from "expo-router";

export type ThemedTextProps = TextProps & {
    lightColor?: string;
    darkColor?: string;
    option?: boolean;
    professionalList?: any[];
    optionList?: string[];
    messageId?: string | null;
    professional?: boolean | false;
    onSelect?: (item: string, messageId: string | null) => void;
    type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedTextNew({
                               style,
                               lightColor,
                               darkColor,
                               option=false,
                               messageId = "",
                               professional=false,
                               professionalList=[],
                               optionList=[],
                               onSelect,
                               type = 'default',
                               ...rest
                           }: ThemedTextProps) {
    const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
    const [modalVisible,setModalVisible]=useState(false)
    const [modalProfessionalListVisible,setModalProfessionalListVisible]=useState(false)
    const onPress =()=>{
        if (professional){
            setModalProfessionalListVisible(true)
        }else{
            setModalVisible(true)
        }
    }

    return (
        <View>
            <Text
                style={[
                    { color: color as string },
                    type === 'default' ? styles.default : undefined,
                    type === 'title' ? styles.title : undefined,
                    type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
                    type === 'subtitle' ? styles.subtitle : undefined,
                    type === 'link' ? styles.link : undefined,
                    style,
                ]}
                {...rest}
            />
            {option? <TouchableOpacity onPress={onPress} style={styles.buttonContainer}>
                <Ionicons name="list" size={20} color="#DD8550" style={styles.icon}/>
                <Text style={styles.buttonText}>Choose</Text>
            </TouchableOpacity>:null}

            <Modal
                animationType="slide"
                transparent={true}

                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable style={styles.overlay} onPress={()=>setModalVisible(false)}>
                    <Pressable style={styles.modalContainer}>
                        <View style={styles.dragIndicator} />
                        {option &&(<Text style={styles.titleModal}>Choose</Text>)}

                        {optionList && optionList.length > 0 && optionList?.map((item, index) => (
                            <TouchableOpacity key={index} style={styles.option} onPress={() => {
                                onSelect?.(item,messageId)
                                setModalVisible(false)
                            }}>
                                <Text style={styles.optionText}>{item}</Text>
                            </TouchableOpacity>
                        ))}

                        {option && ( <Text style={styles.note}>Tap on item to select it</Text>)}
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}

                visible={modalProfessionalListVisible}
                onRequestClose={() => setModalProfessionalListVisible(false)}
            >
                <Pressable style={styles.overlay} onPress={()=>setModalProfessionalListVisible(false)}>
                    <Pressable style={styles.modalProContainer}>
                        <View style={styles.dragIndicator} />
                        <Text style={styles.titleModal}>Recommendations</Text>

                        <SearchList data={professionalList} onRequest={()=>{
                            setModalProfessionalListVisible(false)
                            router.push("/(app)/message");
                        }}/>

                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    default: {
        fontSize: 16,
        lineHeight: 24.6,
    },
    defaultSemiBold: {
        fontSize: 16,
        lineHeight: 24.6,
        fontWeight: '600',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        lineHeight: 32,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    link: {
        lineHeight: 30,
        fontSize: 16,
        color: '#0a7ea4',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopWidth: 0.3,
        borderColor: 'white',
        paddingVertical: 5,

    },
    icon: {
        paddingRight: 5,
    },
    buttonText: {
        color: '#DD8550',
        fontSize: 18,
        textAlign: 'center',
    },
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 30,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    modalProContainer: {
        backgroundColor: 'white',

        paddingTop: 12,
        paddingBottom: 30,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    dragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#ccc',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 10,
    },
    titleModal: {
        fontSize: 18,
        fontFamily: 'InstrumentSansSemiBold',
        textAlign: 'center',
        marginBottom: 20,
    },
    option: {
        paddingVertical: 15,
        borderBottomColor: '#e0e0e0',
        borderBottomWidth: 1,
    },
    optionText: {
        fontSize: 16,
        fontFamily: 'InstrumentSansRegular',
    },
    note: {
        marginTop: 20,
        fontSize: 13,
        fontFamily: 'InstrumentSansRegular',
        textAlign: 'center',
        color: '#666',
    },

});

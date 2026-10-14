import React, {useState} from 'react';
import {Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {Feather, MaterialIcons} from '@expo/vector-icons';
import {COLORS} from '@/constants/colors';
import {SPACING} from '@/constants/theme';
import {useTranslation} from 'react-i18next';
import {handleOpenFile} from "@/constants/Utility";

type Props = {
    files: any[];
    type: 'doc' | 'pdf' | 'image';
    onDeleteFile: (index: number) => void;
    onCancel: () => void;
    onUpload: () => void;
};

export default function ReferralFilePreviewSheet({
                                                     files,
                                                     type,
                                                     onDeleteFile,
                                                     onCancel,
                                                     onUpload,
                                                 }: Props) {
    const { t } = useTranslation();
    const secondary = COLORS.SecodaryColor;
    const textColor = COLORS.PrimaryColorText;
    const backgroundColor = COLORS.BackgroundColor;
    const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

    const handleFilePress = (file: any) => {
        if (type === 'image') {
            setPreviewImageUri(file.uri);
        } else if (type === 'pdf') {
            handleOpenFile(file.uri, '', 'application/pdf');
        } else if (type === 'doc') {
            handleOpenFile(
                file.uri,
                '',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            );
        }
    };


    const getFileIcon = (fileType: string) => {
        if (fileType === 'image') return '🖼️';
        if (fileType === 'pdf') return '📄';
        return '📝';
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={true}
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={[styles.sheet, { backgroundColor }]}>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: textColor }]}>
                            {t('chat.preview_files') || 'Preview Files'}
                        </Text>
                        <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
                            <MaterialIcons name="close" size={22} color={textColor} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.subtitle, { color: '#888' }]}>
                        {files.length} {files.length === 1
                        ? (t('chat.file_selected') || 'file selected')
                        : (t('chat.files_selected') || 'files selected')}
                    </Text>

                    {/* File list */}
                    <ScrollView
                        style={styles.fileList}
                        contentContainerStyle={{ paddingBottom: 12 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {files.map((file, index) => (
                            <View key={`${file.name}-${index}`} style={styles.fileCard}>

                                {/* Image thumbnail OR file icon */}
                                {type === 'image' && file.uri ? (
                                    <Image
                                        source={{ uri: file.uri }}
                                        style={styles.thumbnail}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.iconBox}>
                                        <Text style={styles.fileEmoji}>
                                            {getFileIcon(type)}
                                        </Text>
                                    </View>
                                )}

                                {/* File info */}
                                <View style={styles.fileInfo}>
                                    <Text
                                        style={[styles.fileName, { color: textColor }]}
                                        numberOfLines={2}
                                        ellipsizeMode="middle"
                                    >
                                        {file.name || file.fileName || 'Unknown file'}
                                    </Text>
                                    {file.size || file.fileSize ? (
                                        <Text style={styles.fileSize}>
                                            {formatFileSize(file.size || file.fileSize)}
                                        </Text>
                                    ) : null}
                                </View>

                                <TouchableOpacity
                                    key={`${file.name}-${index}`}
                                    style={styles.fileCard}
                                    onPress={() => handleFilePress(file)}
                                    activeOpacity={0.7}
                                >
                                    {/* 👁️ View hint badge */}
                                    <View style={styles.viewBadge}>
                                        <Feather name="eye" size={10} color="#fff" />
                                    </View>

                                    {/* existing thumbnail / icon, fileInfo, deleteBtn — unchanged */}
                                </TouchableOpacity>

                                {/* Delete button */}
                                <TouchableOpacity
                                    onPress={() => onDeleteFile(index)}
                                    style={styles.deleteBtn}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <MaterialIcons name="delete-outline" size={22} color="#FF3B30" />
                                </TouchableOpacity>

                            </View>
                        ))}
                    </ScrollView>

                    {/* Action buttons */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            onPress={onCancel}
                            style={[styles.btn, styles.cancelBtn]}
                        >
                            <Text style={[styles.btnText, { color: textColor }]}>
                                {t('cancel') || 'Cancel'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onUpload}
                            style={[styles.btn, styles.uploadBtn, { backgroundColor: secondary }]}
                        >
                            <Feather name="upload" size={16} color="#fff" style={{ marginRight: 6 }} />
                            <Text style={[styles.btnText, { color: '#fff' }]}>
                                {t('chat.upload_files') || 'Upload'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>

            {/* Fullscreen image preview */}
            {previewImageUri && (
                <Modal animationType="fade" transparent={true} visible={true}>
                    <View style={styles.imageOverlay}>
                        <Image
                            source={{ uri: previewImageUri }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                        <TouchableOpacity
                            style={styles.imageCloseBtn}
                            onPress={() => setPreviewImageUri(null)}
                        >
                            <MaterialIcons name="close" size={30} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </Modal>
            )}
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingHorizontal: SPACING.md,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    closeBtn: {
        padding: 4,
    },
    subtitle: {
        fontSize: 13,
        marginBottom: 16,
    },
    fileList: {
        flexGrow: 0,
        maxHeight: 380,
    },
    fileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 10,
        marginBottom: 10,
        gap: 10,
    },
    thumbnail: {
        width: 52,
        height: 52,
        borderRadius: 8,
        backgroundColor: '#ddd',
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 8,
        backgroundColor: '#E8E8E8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fileEmoji: {
        fontSize: 26,
    },
    fileInfo: {
        flex: 1,
    },
    fileName: {
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 18,
    },
    fileSize: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    deleteBtn: {
        padding: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    btn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    cancelBtn: {
        backgroundColor: '#E8E8E8',
    },
    uploadBtn: {
        // backgroundColor set inline
    },
    btnText: {
        fontSize: 15,
        fontWeight: '600',
    },
    viewBadge: {
        position: 'absolute',
        top: 6,
        left: 6,
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 4,
        padding: 3,
        zIndex: 1,
    },
    imageOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fullImage: {
        width: '100%',
        height: '85%',
    },
    imageCloseBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 56 : 32,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 6,
    },
});
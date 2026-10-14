import React, {useCallback} from 'react';
import {FlatList, StyleSheet} from "react-native";
import {COLORS as c} from "@/constants/colors";
import {LawyersListItem} from "@/components/chat/LawyersListItem";

const CARD_RADIUS = 16;
const TAG_PADDING = 6;

type LawyerListItemData = {
    lawyer_id: string | number;
    [key: string]: any;
};

type LawyersListProps = {
    data: LawyerListItemData[];
    onListItemClick: (item: LawyerListItemData, index: number) => void;
};

const renderItem = (
    {item, index}: { item: LawyerListItemData; index: number },
    listSize: number,
    onListItemClick: (item: LawyerListItemData, index: number) => void
) => {
    return <LawyersListItem item={item}
                               index={index}
                               listSize={listSize}
                               onListItemClick={onListItemClick}
    />

};

const LawyersList = ({data, onListItemClick}: LawyersListProps) => {


    const memoizedRenderItem = useCallback(
        ({item, index}: { item: LawyerListItemData; index: number }) => renderItem({item, index}, data.length, onListItemClick),
        [data.length, onListItemClick]
    );

    return (
        <FlatList
            data={data}
            renderItem={memoizedRenderItem}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            keyExtractor={(item) => item.lawyer_id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            scrollEnabled={false}
        />
    );
};

const styles = StyleSheet.create({
    listContainer: {
        paddingVertical: 20,
    },
    mainList: {
        padding: 16,
        marginHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: CARD_RADIUS,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.08,
        shadowRadius: 6,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarColumn: {
        width: 66,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    middle: {
        flex: 1,
        paddingLeft: 12,
    },
    name: {
        fontSize: 16,
        fontFamily: 'InstrumentSansSemiBold',
        color: '#181818',
        marginBottom: 4,
    },
    subText: {
        fontSize: 14,
        color: c.Gray_3,
        fontWeight: 'bold',
        marginBottom: 4,
        fontFamily: 'InstrumentSansRegular',
    },
    favouriteView: {
        position: 'absolute',
        right: 10,
        flexDirection: 'row',
        top: -28,
        alignItems: 'center',
        backgroundColor: c.SecodaryColor,
        borderRadius: 16,
        paddingVertical: 4,
        paddingHorizontal:8
    },
    favouriteText: {
        fontSize: 12,
        marginStart: 4,
        color: 'white',
        fontWeight: 'bold',
        fontFamily: 'InstrumentSansRegular',
    },
    matchScoreText: {
        fontSize: 16,
        color: c.PrimaryColor,
        fontWeight: 'bold',
        marginBottom: 4,
        fontFamily: 'InstrumentSansRegular',
    },
    expertiseRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    matchReasons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    matchReasonItem: {
        marginRight: 8,
        marginBottom: 4,
        flexDirection: 'row',
        alignItems: 'center'
    },
    matchReasonView: {
        backgroundColor: c.BackgroundColor, // you can replace with `secondary`
        borderRadius: 6,
        padding: 12,
    },
    tag: {
        borderColor: c.SecodaryColor, // you can replace with `secondary`
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: TAG_PADDING,
        paddingVertical: 4,
        marginRight: 8,
        marginBottom: 6,
    },
    tagText: {
        fontSize: 12,
        color: 'black',
        fontFamily: 'InstrumentSansRegular',
    },
});
export default LawyersList;

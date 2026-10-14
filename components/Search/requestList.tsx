import React from 'react';
import {Alert, FlatList, RefreshControlProps, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {UserItem} from "@/components/Search/UserItem";
import {LawyerItem} from "@/components/Search/LawyerItem";
import {Swipeable} from "react-native-gesture-handler";
import {acceptRejectCase, userCancelRequest} from "@/services/apiHelper";
import {showTwoButtonAlert} from "@/components/Search/showTwoButtonAlert";
import {useTranslation} from "react-i18next";
import {router} from "expo-router";
import ConsultationService from "@/services/ConsultationService";
import Analytics from "@/helpers/AnalyticsHelper";

type listProps = {
    data: any;
    loginUserData: any;
    isActive: boolean,
    isProUser: boolean;
    onListItemClick: (item: any) => void;
    setRefreshItem: () => void;
    refreshControl?: React.ReactElement<RefreshControlProps>;
};

const RequestList: React.FC<listProps> = ({
                                              data,
                                              isActive = true,
                                              loginUserData,
                                              setRefreshItem,
                                              isProUser,
                                              onListItemClick,
                                              refreshControl
                                          }) => {

    const {t} = useTranslation();

    const handleAfterAccept = async (session_id: string) => {

        const res = await ConsultationService.GetPricingRules(session_id);

        const isPriceProposed = res?.proposed_price_status?.price_proposed === true;
        if (!isPriceProposed) {
            try {
                router.push({
                    pathname: "/requestFlow/pricing-screen",
                    params: {session_id: session_id}
                });

            } catch (e) {
                console.log("Pricing error", e);
            }
        }
    };

    const handleCaseAction = async (type: any, item: any) => {
        try {

            let session_id = ""
            let response;
            if (["accept", "reject"].includes(type)) {

                response = await acceptRejectCase(item.referral_id, type === "accept");
                session_id = response.session_id;

                if (type === "accept") {
                    Analytics.lawyerMatched({
                        action: "accept",
                        firm_id: loginUserData?.id || ""
                    })
                    handleAfterAccept(session_id);
                }

            } else {
                response = await userCancelRequest(item.referral_id, type);
            }

            if (response) {
                Alert.alert(
                    "",
                    response.message);
            }

            setRefreshItem()

        } catch (error: any) {

            const errorDetail = error?.response?.data?.detail;
            if (errorDetail) {
                Alert.alert(
                    t("error.title"),
                    errorDetail || t("error.case_not_found") // localization
                );

            } else {
                Alert.alert(
                    t("common.error"),
                    t("common.something_wrong")
                );
            }
        }

    }

    const showAlertView = (type: string, message: string = "", item: any) => {

        const config = {
            accept: {title: t('accept'), ok: t('accept'), cancel: t('cancel')},
            reject: {title: t('reject'), ok: t('reject'), cancel: t('cancel')},
            delete: {title: "", ok: t('yes'), cancel: t('no')},
            withdraw: {title: "", ok: t('yes'), cancel: t('no')}
        }[type];

        showTwoButtonAlert({
            title: config?.title,
            message,
            okLabel: config?.ok,
            cancelLabel: config?.cancel,
            onOkPress: () => handleCaseAction(type, item),
            onCancelPress: () => {
                console.log("User cancelled");
            },
        });

    }


    const renderRightActions = (item: any, isLawyer: boolean, isDeleteShow: boolean) => {
        if (isLawyer) {
            // Lawyer sees Accept + Reject
            return (
                <View style={{flexDirection: "row"}}>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={async () => {
                            showAlertView("accept", t("accept_request_message"), item)
                        }
                        }
                    >
                        <Text style={styles.actionText}>{t('accept')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() =>
                            showAlertView("reject", t("reject_request_message"), item)
                        }
                    >
                        <Text style={styles.actionText}>{t('reject')}</Text>
                    </TouchableOpacity>

                </View>
            );
        }

        const isMatched = item?.status === "matched";
        const isSessionInactive =
            item?.status === "active" &&
            !["active", "cancelled", "completed"].includes(item?.session_status);

        if (isMatched) {
            return (
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() =>
                        showAlertView("delete", t("delete_request_message"), item)
                    }
                >
                    <Text style={styles.actionText}>{t('delete')}</Text>
                </TouchableOpacity>
            );
        }
        if(isSessionInactive) {
            return (
                <TouchableOpacity
                    style={[styles.actionButton, styles.withdrawButton]}
                    onPress={() =>
                        showAlertView("withdraw", t("withdraw_request_message"), item)
                    }
                >
                    <Text style={styles.actionText}>{t('withdraw')}</Text>
                </TouchableOpacity>
            );
        }
    };

    const renderItem = ({item, index}: { item: any; index: number }) => {

        // Lawyer (Pro user)
        if (isProUser) {

            // Active lawyers cannot swipe
            if (isActive) {
                return (
                    <UserItem
                        item={item}
                        isActive={isActive}
                        index={index}
                        onListItemClick={onListItemClick}
                    />
                );
            }

            return (
                <Swipeable renderRightActions={() => renderRightActions(item, true, false)}>
                    <UserItem
                        item={item}
                        index={index}
                        isActive={false}
                        onListItemClick={onListItemClick}
                    />
                </Swipeable>
            );
        } else {

            const showActionButton = item.lawyer_response_status === "pending" || item.lawyer_response_status === "accepted";
            const actionOnRejectWithdraw = item.lawyer_response_status === "rejected"

            if (showActionButton && item.status !== "cancelled") {
                return (
                    <Swipeable renderRightActions={() => renderRightActions(item, false, false)}>
                        <LawyerItem
                            item={item}
                            index={index}
                            onListItemClick={onListItemClick}
                        />
                    </Swipeable>
                );
            } else if (actionOnRejectWithdraw) {

                return (
                    <Swipeable renderRightActions={() => renderRightActions(item, false, true)}>
                        <LawyerItem
                            item={item}
                            index={index}
                            onListItemClick={onListItemClick}
                        />
                    </Swipeable>
                );
            }

            return (
                <LawyerItem
                    item={item}
                    index={index}
                    onListItemClick={onListItemClick}
                />
            );
        }
    };

    return (
        <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => item.referral_id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingVertical: 12}}
            refreshControl={refreshControl}
        />
    );
};


export default RequestList;


const styles = StyleSheet.create({
    container: {flex: 1, marginTop: 40},
    item: {
        backgroundColor: '#f9f9f9',
        padding: 20,
        borderBottomWidth: 1,
        borderColor: '#ddd',
    },
    title: {fontSize: 18},
    actionButton: {
        width: 80,
        borderRadius: 4,
        marginBottom: 12,
        marginEnd: 2,
        marginTop: 6,
        justifyContent: "center",
        alignItems: "center",
    },

    acceptButton: {
        backgroundColor: "#4CAF50",
    },

    rejectButton: {
        backgroundColor: "#FF3B30",
    },

    withdrawButton: {
        backgroundColor: "#FF9500",
    },

    deleteButton: {
        backgroundColor: "#FF3B30",
    },
    actionText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    deleteText: {color: 'white', fontWeight: 'bold'},
});

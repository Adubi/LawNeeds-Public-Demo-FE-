import React, {useEffect, useState} from "react";
import {
    ActivityIndicator,
    Image,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {BORDER_RADIUS, COLORS, FONT_SIZES, SPACING} from "@/constants/theme";
import {COLORS as c} from "@/constants/colors";

import {formatToLocalDateTime, getCategoryColors} from "@/constants/Utility";
import {Ionicons} from "@expo/vector-icons";
import {useTranslation} from "react-i18next";
import {widthPercentageToDP as wp} from "react-native-responsive-screen";
import {RFValue} from "react-native-responsive-fontsize";
import {cancellationPolicy} from "@/services/httpservice";
import {CachedAvatar} from "@/components/CachedAvatar";
import {Calendar, toDateId} from "@marceloterreiro/flash-calendar";
import {professionalBookingSlots} from "@/services/apiHelper";

interface WorkExperience {
    id: string;
    company_name: string;
    achievement: string;
    start_date: string;
    end_date: string;
}

interface reviewData {
    id: string;
    rating: number;
    review_text: string;
    reviewer_name: string;
    created_at: string;
}

interface Professional {
    id: string;
    first_name: string;
    last_name: string;
    firm_name: string | null;
    town_city: string;
    profile_picture_path: string;
    legal_expertise: string[];
    sra_bsb: string;
    sra_bsb_iaa: string;
    tagline: string | null;
    about: string;
    work_experiences: WorkExperience[];
    skills: string[];
    member_since: string;
    hourly_rate?: string;
    firm_hourly_rate?: string;
    availability_status?: "online" | "away" | "offline" | string;
    availability_label?: string;
    next_available_at?: string | null;
    recent_reviews?: reviewData[]
    response_stats?: {
        response_rate_percent: number | null;
        average_response_time_seconds: number | null;
        average_response_time_label: string | null;
        responded_requests: number;
        eligible_requests: number;
        window_days: number;
    };
}

interface LoginData {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    user_name: string;
    professional_type?: string;
}

interface Props {
    onClose: () => void;
    professional: Professional;
    onSelectLawyer?: (id: string, booking?: SelectedBooking | null) => void;
    loginUserData?: LoginData | null;
    consultationType?: string;
    requireBookingSlot?: boolean;
}

type BookingSlot = {
    start_at: string;
    end_at: string;
    timezone: string;
};

type SelectedBooking = {
    start_at: string;
    end_at: string;
    timezone: string;
};

interface ReviewItemProps {
    reviewer_name: string;
    review_text: string;
    rating: number;
    review_date: string;
}

const ProfessionalDetails: React.FC<Props> = ({
                                                   onClose,
                                                   loginUserData,
                                                   professional,
                                                   onSelectLawyer,
                                                   consultationType = "single_30_min",
                                                   requireBookingSlot = true,
                                               }) => {

    const {t} = useTranslation();

    const [consultationConsent, setConsultationConsent] = useState(false);

    const [selectedDateId, setSelectedDateId] = useState(toDateId(new Date()));
    const [bookingSlots, setBookingSlots] = useState<BookingSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
    const [slotsLoading, setSlotsLoading] = useState(false);

    const primary = c.PrimaryColor;
    const secondary = c.SecodaryColor;
    const backgroundColor = c.BackgroundColor;
    const textColor = c.PrimaryColorText;
    const inputBg = c.BackgroundColor;


    const styles = React.useMemo(() =>
            createStyles({ primary, secondary, inputBackground: inputBg, backgroundColor, textColor }),
        [primary, secondary, inputBg, backgroundColor, textColor]
    );

    const statusColor = (status?: string) => {
        if (status === "online") return "#1F9D55";
        if (status === "away") return "#F59E0B";
        return "#D64545";
    };

    const formatSlotTime = (slot: BookingSlot) => {
        const start = new Date(slot.start_at);
        const end = new Date(slot.end_at);
        return `${start.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})} - ${end.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}`;
    };

    const formatNextAvailable = (value?: string | null) => {
        if (!value) return null;
        return new Date(value).toLocaleString([], {
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const slotsByDate = React.useMemo(() => {
        return bookingSlots.reduce<Record<string, BookingSlot[]>>((acc, slot) => {
            const key = toDateId(new Date(slot.start_at));
            acc[key] = [...(acc[key] || []), slot];
            return acc;
        }, {});
    }, [bookingSlots]);

    const visibleSlotDateIds = React.useMemo(() => new Set(Object.keys(slotsByDate)), [slotsByDate]);
    const today = React.useMemo(() => new Date(), []);
    const maxDate = React.useMemo(() => {
        const value = new Date(today);
        value.setDate(value.getDate() + 14);
        return value;
    }, [today]);
    const disabledDateIds = React.useMemo(() => {
        const ids: string[] = [];
        const cursor = new Date(today);
        cursor.setHours(0, 0, 0, 0);
        while (cursor <= maxDate) {
            const id = toDateId(cursor);
            if (!visibleSlotDateIds.has(id)) ids.push(id);
            cursor.setDate(cursor.getDate() + 1);
        }
        return ids;
    }, [maxDate, today, visibleSlotDateIds]);

    useEffect(() => {
        if (!onSelectLawyer || !requireBookingSlot) return;
        setSlotsLoading(true);
        setSelectedSlot(null);
        const from = new Date();
        const to = new Date();
        to.setDate(to.getDate() + 14);
        professionalBookingSlots(
            professional.id,
            from.toISOString(),
            to.toISOString(),
            consultationType,
            (response: any) => {
                const slots = response?.slots || [];
                setBookingSlots(slots);
                if (slots.length > 0) {
                    setSelectedDateId(toDateId(new Date(slots[0].start_at)));
                }
                setSlotsLoading(false);
            },
            () => {
                setBookingSlots([]);
                setSlotsLoading(false);
            }
        )
    }, [consultationType, onSelectLawyer, professional.id, requireBookingSlot]);

    const renderStars = (currentRating: number) => {
        return (
            <View style={{flexDirection: "row", marginBottom: 8}}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        disabled
                    >
                        <Ionicons
                            name={star <= currentRating ? "star" : "star-outline"}
                            size={24}
                            color="#FFB300"
                            style={{marginHorizontal: 2}}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const getFormatedDate = (created_at: string) => {
        let formatted;
        if (created_at) {
            formatted = formatToLocalDateTime(created_at);
        }

        return formatted;
    }


    const ReviewItem: React.FC<ReviewItemProps> = React.memo(({
                                                                  reviewer_name,
                                                                  review_text,
                                                                  rating,
                                                                  review_date
                                                              }) => (
        <View style={styles.card}>
            {renderStars(rating)}
            <Text style={styles.reviewText}>{review_text || ""}</Text>
            <View style={styles.reviewerInfo}>
                <Text style={styles.reviewerName}>{reviewer_name}</Text>
                <Text style={styles.reviewDate}>{getFormatedDate(review_date)}</Text>
            </View>
        </View>
    ));


    const ReviewScreen = React.memo(() => {

        let reviews = professional.recent_reviews ? professional.recent_reviews : []

        return (<View style={{flex: 1, marginTop: 16}}>
            {/* Reviews List */}

            <Text style={[styles.headerTitle, {fontWeight: "bold", marginBottom: 8}]}>
                {t('reviews')}
            </Text>

            {reviews && reviews.length > 0 ? (
                reviews.map((item) => (
                    <ReviewItem
                        key={item.id}
                        reviewer_name={item.reviewer_name}
                        review_text={item.review_text}
                        rating={item.rating}
                        review_date={item.created_at}
                    />
                ))
            ) : (
                <Text style={{textAlign: 'center', marginVertical: 10, color: '#666'}}>
                    {t('no_reviews')}
                </Text>
            )}

        </View>)
    })

    return (
        <View style={styles.sheetContent}>
            <View style={styles.header}>
                <View style={styles.headerCopy}>
                    <Text style={styles.headerTitle}>{t('professional_details')}</Text>
                </View>
                <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeButton}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.close', {defaultValue: 'Close professional profile'})}
                    hitSlop={8}
                >
                    <Ionicons name="close" size={22} color={c.PrimaryColorText}/>
                </TouchableOpacity>
            </View>

            <View style={styles.profileHero}>
                <CachedAvatar
                    key={professional.profile_picture_path}
                    uri={professional.profile_picture_path}
                    style={styles.profileImage}
                />
                <View style={styles.profileSummary}>
                    <Text style={styles.name} numberOfLines={2}>
                        {professional.firm_name || `${professional.first_name} ${professional.last_name}`}
                    </Text>
                    {!!professional.town_city && <Text style={styles.city}>{professional.town_city}</Text>}
                    <View style={styles.availabilityInline}>
                        <View style={[styles.statusDot, {backgroundColor: statusColor(professional.availability_status)}]}/>
                        <Text style={styles.availabilityText}>
                            {professional.availability_label || "Offline"}
                        </Text>
                    </View>
                    {formatNextAvailable(professional.next_available_at) && (
                        <Text style={styles.nextAvailableText}>
                            Next available: {formatNextAvailable(professional.next_available_at)}
                        </Text>
                    )}
                </View>
            </View>

            <View style={styles.content}>

                        {professional.response_stats && <View
                            style={styles.responseStatsCard}
                            accessible
                            accessibilityLabel={
                                professional.response_stats?.eligible_requests
                                    ? `${professional.response_stats.response_rate_percent}% response rate. ${professional.response_stats.average_response_time_label || 'Average response time unavailable'}. Based on the last ${professional.response_stats.window_days} days.`
                                    : 'No referral response history yet.'
                            }
                        >
                            {professional.response_stats?.eligible_requests ? (
                                <>
                                    <View style={styles.responseStat}>
                                        <Text style={styles.responseStatValue}>
                                            {professional.response_stats.response_rate_percent}%
                                        </Text>
                                        <Text style={styles.responseStatLabel}>
                                            {t('response_rate', {defaultValue: 'Response rate'})}
                                        </Text>
                                    </View>
                                    <View style={styles.responseStatDivider}/>
                                    <View style={styles.responseStat}>
                                        <Text style={styles.responseStatValue}>
                                            {professional.response_stats.average_response_time_label || '—'}
                                        </Text>
                                        <Text style={styles.responseStatLabel}>
                                            {t('average_response_time', {defaultValue: 'Average response'})}
                                        </Text>
                                    </View>
                                </>
                            ) : (
                                <Text style={styles.responseEmptyText}>
                                    {t('no_response_history', {defaultValue: 'No referral response history yet'})}
                                </Text>
                            )}
                        </View>}

                        {/* Expertise */}

                        {/*{professional.legal_expertise && professional.legal_expertise.map((exp, i) => (
                            <Text key={i} style={styles.textItem}>
                                • {exp}
                            </Text>
                        ))}*/}

                        {(professional.legal_expertise && professional.legal_expertise.length > 0) &&
                            <><Text style={styles.sectionTitle}>{t('expertise')}</Text>
                                <View style={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    marginTop: 8
                                }}>
                                    {professional.legal_expertise.map((exp: any, i: number) => (
                                        <View key={i} style={[styles.tag, {
                                            backgroundColor: getCategoryColors(exp).primary || "white",
                                            borderColor: getCategoryColors(exp).primary || c.SecodaryColor,
                                        }]}>
                                            <Text style={[styles.tagText, {
                                                color: "white",
                                            }]}>{exp?.label || exp}</Text>
                                        </View>
                                    ))}
                                </View></>}


                        {(professional.skills && professional.skills.length > 0) &&
                            <><Text style={styles.sectionTitle}>{t('profile.skills')}</Text>
                                <View style={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    marginTop: 8
                                }}>
                                    {professional.skills.map((skillItem: any, i: number) => (
                                        <View key={i} style={[styles.tag]}>
                                            <Text style={[styles.textBold, {
                                                color: "black",
                                            }]}>{skillItem?.label || skillItem}</Text>
                                        </View>
                                    ))}
                                </View></>}

                        {(professional.hourly_rate || professional.firm_hourly_rate) &&
                            <>
                                <Text style={styles.sectionTitle}>{t('rate_of_hour')}</Text>

                                <Text style={styles.textItem}>
                                    £{professional.hourly_rate ? professional.hourly_rate :
                                    (professional.firm_hourly_rate ? professional.firm_hourly_rate : 0)}
                                </Text>
                            </>
                        }

                        {professional.sra_bsb &&
                            <View>
                                <View style={styles.badgeBox}>
                                    <Image
                                        source={require('../../../../assets/images/check-badge-solid.png')}
                                        style={styles.badgeIcon}
                                    />
                                    <Text style={styles.badgeText}>{professional.sra_bsb}</Text>
                                </View>

                            </View>
                        }

                        {/* About */}
                        {professional.about &&
                            <><Text style={styles.sectionTitle}>{t('profile.about')}</Text>
                                <Text style={styles.textItem}>{professional.about}</Text>
                            </>
                        }

                        {/* Work Experience */}
                        {professional.work_experiences && professional.work_experiences.length > 0 &&
                            <>
                                <Text style={styles.sectionTitle}>{t('work_experience')}</Text>
                                {professional.work_experiences.map((we) => (
                                    <View key={we.id} style={styles.experienceBox}>
                                        <Text style={styles.textBold}>{we.company_name}</Text>
                                        <Text style={styles.textItem}>{we.achievement}</Text>
                                        <Text style={styles.textItem}>
                                            {we.start_date} - {we.end_date}
                                        </Text>
                                    </View>
                                ))}
                            </>
                        }

                        {/* Member Since */}
                        {professional.member_since &&
                            <>
                                <Text style={styles.sectionTitle}>{t('member_since')}</Text>
                                <Text style={styles.textItem}>
                                    {new Date(professional.member_since).toDateString()}
                                </Text>
                            </>
                        }

                        {onSelectLawyer && requireBookingSlot && (
                            <View style={styles.bookingSection}>
                                <Text style={styles.sectionTitle}>Availability</Text>
                                {slotsLoading ? (
                                    <ActivityIndicator size="small" color={secondary} style={{marginTop: 12}}/>
                                ) : (
                                    <>
                                        <Calendar
                                            calendarInstanceId={`professional-${professional.id}`}
                                            calendarMonthId={selectedDateId}
                                            calendarMinDateId={toDateId(today)}
                                            calendarMaxDateId={toDateId(maxDate)}
                                            calendarDisabledDateIds={disabledDateIds}
                                            calendarActiveDateRanges={[{startId: selectedDateId, endId: selectedDateId}]}
                                            calendarFirstDayOfWeek="monday"
                                            calendarDayHeight={36}
                                            calendarRowHorizontalSpacing={4}
                                            calendarRowVerticalSpacing={6}
                                            onCalendarDayPress={(dateId) => {
                                                setSelectedDateId(dateId);
                                                setSelectedSlot(null);
                                            }}
                                        />
                                        <View style={styles.timeChipGrid}>
                                            {(slotsByDate[selectedDateId] || []).length > 0 ? (
                                                (slotsByDate[selectedDateId] || []).map((slot) => {
                                                    const selected = selectedSlot?.start_at === slot.start_at;
                                                    return (
                                                        <TouchableOpacity
                                                            key={slot.start_at}
                                                            style={[styles.timeChip, selected && styles.timeChipSelected]}
                                                            onPress={() => setSelectedSlot(slot)}
                                                        >
                                                            <Text style={[styles.timeChipText, selected && styles.timeChipTextSelected]}>
                                                                {formatSlotTime(slot)}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })
                                            ) : (
                                                <Text style={styles.emptySlotsText}>No slots available for this day.</Text>
                                            )}
                                        </View>
                                    </>
                                )}
                            </View>
                        )}

                        <ReviewScreen/>

                    {onSelectLawyer && (
                        <View style={styles.consultationContainer}>
                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setConsultationConsent(!consultationConsent)}
                                activeOpacity={0.8}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        consultationConsent && styles.checkboxChecked,
                                    ]}
                                >
                                    {consultationConsent && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </View>

                                <Text style={styles.consultationPolicyText}>
                                    By clicking{' '}
                                    <Text style={styles.highlightText}>Select</Text>, you
                                    acknowledge that if your consultation is delivered within
                                    14 days, your statutory right to cancel will no longer
                                    apply. You can still cancel or reschedule the consultation
                                    per our{' '}
                                    <Text
                                        style={styles.policyLink}
                                        onPress={() => Linking.openURL(cancellationPolicy)}
                                    >
                                        Cancellation Policy
                                    </Text>
                                    .
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.selectButton,
                                    (!consultationConsent || (requireBookingSlot && !selectedSlot)) && styles.selectButtonDisabled,
                                ]}
                                disabled={!consultationConsent || (requireBookingSlot && !selectedSlot)}
                                onPress={() => onSelectLawyer(professional.id, selectedSlot)}
                            >
                                <Text
                                    style={[
                                        styles.selectButtonText,
                                        (!consultationConsent || (requireBookingSlot && !selectedSlot)) &&
                                        styles.selectButtonTextDisabled,
                                    ]}
                                >
                                    {t('search.select')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
            </View>
        </View>
    )
};


const createStyles = (colors: {
    primary: string;
    secondary: string;
    inputBackground: string;
    backgroundColor: string;
    textColor: string;
}) => StyleSheet.create({
    sheetContent: {
        backgroundColor: c.BackgroundColor,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: c.BackgroundColor,
    },
    headerCopy: {
        flex: 1,
        paddingRight: 12,
    },
    headerEyebrow: {
        color: c.GrayDark,
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0.2,
        marginBottom: 2,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: c.PrimaryColorText,
    },
    closeButton: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 22,
        backgroundColor: "rgba(3, 49, 38, 0.08)",
    },
    profileHero: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 20,
        marginTop: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: c.GrayLight,
        borderRadius: 16,
        backgroundColor: c.White,
    },
    profileSummary: {
        flex: 1,
        minWidth: 0,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 28,
    },
    profileImage: {
        width: 76,
        height: 76,
        borderRadius: 38,
        marginRight: 14,
        borderWidth: 2,
        borderColor: c.PrimaryColor,
    },
    name: {
        fontSize: 18,
        fontWeight: "700",
        color: c.PrimaryColorText,
    },
    city: {
        fontSize: 14,
        color: c.Gray,
        marginTop: 3,
    },
    availabilityInline: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        marginTop: 9,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: c.BackgroundColor,
    },
    statusDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        marginRight: 6,
    },
    availabilityText: {
        fontSize: 13,
        fontWeight: "600",
        color: c.PrimaryColorText,
    },
    nextAvailableText: {
        fontSize: 12,
        color: c.GrayDark,
        marginTop: 7,
    },
    responseStatsCard: {
        flexDirection: "row",
        alignItems: "stretch",
        marginTop: 4,
        marginBottom: 8,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: c.GrayLight,
        borderRadius: 12,
        backgroundColor: c.White,
    },
    responseStat: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 6,
    },
    responseStatDivider: {
        width: StyleSheet.hairlineWidth,
        backgroundColor: c.GrayLight,
    },
    responseStatValue: {
        color: c.PrimaryColorText,
        fontSize: 15,
        fontWeight: "700",
        textAlign: "center",
        fontVariant: ["tabular-nums"],
    },
    responseStatLabel: {
        color: c.GrayDark,
        fontSize: 12,
        marginTop: 4,
        textAlign: "center",
    },
    responseEmptyText: {
        flex: 1,
        color: c.GrayDark,
        fontSize: 13,
        textAlign: "center",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginTop: 15,
        color: c.PrimaryColor,
    },
    textItem: {
        fontSize: 14,
        color: c.GrayDark,
        marginTop: 3,
    },
    textBold: {
        fontSize: 14,
        fontWeight: "600",
        color: c.Black,
    },
    experienceBox: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderColor: c.GrayLight,
    },
    bookingSection: {
        marginTop: 4,
        paddingBottom: 10,
    },
    timeChipGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 12,
        minHeight: 44,
    },
    timeChip: {
        minHeight: 36,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: c.GrayLight,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
        marginBottom: 8,
        backgroundColor: c.White,
    },
    timeChipSelected: {
        backgroundColor: c.SecodaryColor,
        borderColor: c.SecodaryColor,
    },
    timeChipText: {
        fontSize: 12,
        color: c.PrimaryColorText,
        fontWeight: "600",
    },
    timeChipTextSelected: {
        color: c.White,
    },
    emptySlotsText: {
        color: c.GrayDark,
        fontSize: 13,
        marginTop: 4,
    },
    selectButton: {
        backgroundColor: c.SecodaryColor,
        paddingVertical: 14,
        marginHorizontal: 20,
        marginBottom: 40,
        borderRadius: 10,
        alignItems: "center",
    },
    selectButtonText: {
        color: c.White,
        fontSize: 16,
        fontWeight: "600",
    },
    tag: {
        borderColor: c.SecodaryColor, // you can replace with `secondary`
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 4,
        marginRight: 8,
        marginBottom: 6,
    },
    tagText: {
        fontSize: 12,
        color: 'black',
        fontFamily: 'InstrumentSansRegular',
    },
    inputArea: {
        flex: 1,
        marginTop: 8,
        flexDirection: "row",
        alignItems: "center",
        minHeight: 48,
        maxHeight: 100,
        paddingHorizontal: SPACING.md,
        borderWidth: 3,
        borderColor: COLORS.light.pink,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: colors.inputBackground,
    },
    textInput: {
        flex: 1,
        fontSize: FONT_SIZES.md,
        paddingVertical: SPACING.sm,
    },
    snackbar: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: c.PrimaryColor,
        padding: SPACING.md,
        borderRadius: wp(3),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    snackbarText: {
        color: '#FFF',
        fontFamily: "InstrumentSansSemiBold",
        fontSize: RFValue(14),
        flex: 1,
        marginRight: SPACING.sm,
    },
    saveBtnText: {
        fontFamily: 'InstrumentSansSemiBold',
        fontSize: 18,
        color: c.White
    },
    loaderContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
    },
    card: {
        padding: 12,
        marginBottom: 10,
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ddd"
    },
    reviewText: {
        fontSize: 16,
        marginTop: 6,
        marginBottom: 8
    },
    reviewerInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 6
    },
    reviewerName: {
        fontWeight: "bold",
        color: c.PrimaryColorText
    },
    reviewDate: {
        color: "#888",
        fontSize: 13
    },
    badgeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        marginEnd: 8
    },
    badgeIcon: {
        width: 20,
        marginEnd: 4,
        height: 20,
    },
    badgeText: {
        fontSize: 16,
        fontWeight: '600',
        color: c.Black
    },
    consultationContainer: {
        marginTop: 12,
    },

    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        marginHorizontal: 16
    },

    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 1.5,
        borderColor: '#C7C7CC',
        borderRadius: 4,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },

    checkboxChecked: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },

    checkmark: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },

    consultationPolicyText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
        color: '#666',
    },

    highlightText: {
        fontWeight: '600',
        color: '#000',
    },

    policyLink: {
        color: '#007AFF',
        textDecorationLine: 'underline',
    },

    selectButtonDisabled: {
        backgroundColor: '#D1D1D6',
    },

    selectButtonTextDisabled: {
        color: '#8E8E93',
    },
});

export default ProfessionalDetails;

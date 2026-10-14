import React, {useEffect, useMemo, useState} from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {KeyboardAwareScrollView} from "react-native-keyboard-controller";
import {SafeAreaView} from "react-native-safe-area-context";
import {router} from "expo-router";
import {Calendar, toDateId} from "@marceloterreiro/flash-calendar";
import {Ionicons, MaterialIcons} from "@expo/vector-icons";
import {COLORS} from "@/constants/colors";
import {SPACING} from "@/constants/theme";
import {
    getMyAvailability,
    updateMyAvailability,
    updateMyPresence,
} from "@/services/apiHelper";

type Rule = {
    weekday: number;
    start_minute: number;
    end_minute: number;
    timezone: string;
    consultation_types: string[];
    is_active: boolean;
};

type ExceptionBlock = {
    start_at: string;
    end_at: string;
    timezone: string;
    is_available: boolean;
    consultation_types: string[];
    reason?: string;
};

type AvailabilityResponse = {
    rules?: Rule[];
    exceptions?: ExceptionBlock[];
    availability?: {
        rules?: Rule[];
        exceptions?: ExceptionBlock[];
    };
};

const WEEKDAYS = [
    {label: "Mon", value: 0},
    {label: "Tue", value: 1},
    {label: "Wed", value: 2},
    {label: "Thu", value: 3},
    {label: "Fri", value: 4},
    {label: "Sat", value: 5},
    {label: "Sun", value: 6},
];

const CONSULTATION_TYPES = [
    {label: "5 min", value: "single_5_min"},
    {label: "10 min", value: "single_10_min"},
    {label: "20 min", value: "single_20_min"},
    {label: "30 min", value: "single_30_min"},
    {label: "1 hour", value: "single_1_hour"},
    {label: "3-day kickoff", value: "ongoing_3_day"},
    {label: "5-day kickoff", value: "ongoing_5_day"},
];

const DEFAULT_CONSULTATION_TYPES = CONSULTATION_TYPES.map((type) => type.value);

const pad2 = (value: number) => String(value).padStart(2, "0");

const minuteToTime = (minute: number) => `${pad2(Math.floor(minute / 60))}:${pad2(minute % 60)}`;

const timeToMinute = (value: string) => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return hour * 60 + minute;
};

const localDateTimeIso = (dateId: string, timeText: string) => {
    const [year, month, day] = dateId.split("-").map(Number);
    const minute = timeToMinute(timeText);
    if (minute === null) return null;
    const date = new Date(year, month - 1, day, Math.floor(minute / 60), minute % 60, 0, 0);
    return date.toISOString();
};

const normalizeAvailability = (response: AvailabilityResponse | null | undefined) => {
    const availability = response?.availability || response;
    return {
        rules: availability?.rules || [],
        exceptions: availability?.exceptions || [],
    };
};

const availabilityCount = (rules: Rule[] = [], exceptions: ExceptionBlock[] = []) => rules.length + exceptions.length;

const AvailabilityScreen = () => {
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London";

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [rules, setRules] = useState<Rule[]>([]);
    const [exceptions, setExceptions] = useState<ExceptionBlock[]>([]);
    const [lastLoadedAvailabilityCount, setLastLoadedAvailabilityCount] = useState(0);
    const [selectedWeekday, setSelectedWeekday] = useState(0);
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("17:00");
    const [timezone, setTimezone] = useState(localTimezone);
    const [selectedRuleTypes, setSelectedRuleTypes] = useState<string[]>(DEFAULT_CONSULTATION_TYPES);
    const [selectedExceptionTypes, setSelectedExceptionTypes] = useState<string[]>(DEFAULT_CONSULTATION_TYPES);

    const [selectedDateId, setSelectedDateId] = useState(toDateId(new Date()));
    const [exceptionStart, setExceptionStart] = useState("09:00");
    const [exceptionEnd, setExceptionEnd] = useState("10:00");
    const [exceptionAvailable, setExceptionAvailable] = useState(false);

    const [presenceStatus, setPresenceStatus] = useState("offline");
    const [presenceLabel, setPresenceLabel] = useState("Offline");
    const [acceptingConsultations, setAcceptingConsultations] = useState(true);

    const today = useMemo(() => new Date(), []);
    const maxDate = useMemo(() => {
        const value = new Date(today);
        value.setMonth(value.getMonth() + 3);
        return value;
    }, [today]);

    const load = () => {
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London");
        setLoading(true);
        getMyAvailability(
            (response: any) => {
                const availability = normalizeAvailability(response);
                setRules(availability.rules);
                setExceptions(availability.exceptions);
                setLastLoadedAvailabilityCount(availabilityCount(availability.rules, availability.exceptions));
                setLoading(false);
            },
            () => {
                setLoading(false);
                Alert.alert("Availability", "Could not load your availability.");
            }
        );
        updateMyPresence(
            {heartbeat: true},
            (response: any) => {
                setPresenceStatus(response.availability_status);
                setPresenceLabel(response.availability_label);
                setAcceptingConsultations(response.accepting_consultations);
            },
            () => {}
        );
    };

    useEffect(() => {
        load();
    }, []);

    const toggleRuleType = (value: string) => {
        setSelectedRuleTypes((current) =>
            current.includes(value)
                ? current.filter((item) => item !== value)
                : [...current, value]
        );
    };

    const toggleExceptionType = (value: string) => {
        setSelectedExceptionTypes((current) =>
            current.includes(value)
                ? current.filter((item) => item !== value)
                : [...current, value]
        );
    };

    const addRule = () => {
        const start = timeToMinute(startTime);
        const end = timeToMinute(endTime);
        if (start === null || end === null || end <= start) {
            Alert.alert("Availability", "Use valid 24-hour times like 09:00 and 17:00.");
            return;
        }
        if (selectedRuleTypes.length === 0) {
            Alert.alert("Availability", "Select at least one consultation type.");
            return;
        }
        setRules((current) => [
            ...current,
            {
                weekday: selectedWeekday,
                start_minute: start,
                end_minute: end,
                timezone,
                consultation_types: [...selectedRuleTypes],
                is_active: true,
            },
        ]);
    };

    const addException = () => {
        const startAt = localDateTimeIso(selectedDateId, exceptionStart);
        const endAt = localDateTimeIso(selectedDateId, exceptionEnd);
        if (!startAt || !endAt || new Date(endAt) <= new Date(startAt)) {
            Alert.alert("Availability", "Use a valid one-off start and end time.");
            return;
        }
        if (selectedExceptionTypes.length === 0) {
            Alert.alert("Availability", "Select at least one consultation type for the one-off block.");
            return;
        }
        setExceptions((current) => [
            ...current,
            {
                start_at: startAt,
                end_at: endAt,
                timezone,
                is_available: exceptionAvailable,
                consultation_types: [...selectedExceptionTypes],
                reason: exceptionAvailable ? "One-off available slot" : "Unavailable",
            },
        ]);
    };

    const saveAvailability = () => {
        if (availabilityCount(rules, exceptions) === 0 && lastLoadedAvailabilityCount === 0) {
            Alert.alert("Availability", "Add a weekly window or one-off block before saving.");
            return;
        }
        setSaving(true);
        updateMyAvailability(
            {rules, exceptions},
            (response: any) => {
                const savedAvailability = normalizeAvailability(response);
                setRules(savedAvailability.rules);
                setExceptions(savedAvailability.exceptions);
                getMyAvailability(
                    (reloadResponse: any) => {
                        const reloadedAvailability = normalizeAvailability(reloadResponse);
                        setRules(reloadedAvailability.rules);
                        setExceptions(reloadedAvailability.exceptions);
                        setLastLoadedAvailabilityCount(availabilityCount(reloadedAvailability.rules, reloadedAvailability.exceptions));
                        setSaving(false);
                        Alert.alert("Availability", "Availability saved.");
                    },
                    () => {
                        setSaving(false);
                        Alert.alert("Availability", "Availability saved, but could not reload it from the server.");
                    }
                );
            },
            (error: any) => {
                setSaving(false);
                Alert.alert("Availability", error?.response?.data?.detail || "Could not save availability.");
            }
        );
    };

    const savePresence = (override: "" | "away" | "offline") => {
        updateMyPresence(
            {
                heartbeat: override === "",
                manual_status_override: override,
                accepting_consultations: acceptingConsultations,
            },
            (response: any) => {
                setPresenceStatus(response.availability_status);
                setPresenceLabel(response.availability_label);
                setAcceptingConsultations(response.accepting_consultations);
            },
            () => Alert.alert("Presence", "Could not update your status.")
        );
    };

    const toggleAccepting = () => {
        const next = !acceptingConsultations;
        setAcceptingConsultations(next);
        updateMyPresence(
            {heartbeat: true, accepting_consultations: next},
            (response: any) => {
                setPresenceStatus(response.availability_status);
                setPresenceLabel(response.availability_label);
            },
            () => Alert.alert("Presence", "Could not update consultation availability.")
        );
    };

    const statusColor = presenceStatus === "online" ? "#1F9D55" : presenceStatus === "away" ? "#F59E0B" : "#D64545";

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back-ios" size={24} color={COLORS.Black}/>
                </TouchableOpacity>
                <Text style={styles.title}>Manage Availability</Text>
            </View>

            {loading ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color={COLORS.SecodaryColor}/>
                </View>
            ) : (
                <KeyboardAwareScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    keyboardDismissMode="interactive"
                    keyboardShouldPersistTaps="handled"
                    bottomOffset={80}
                    extraKeyboardSpace={80}
                >
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Live status</Text>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, {backgroundColor: statusColor}]}/>
                            <Text style={styles.statusText}>{presenceLabel}</Text>
                        </View>
                        <View style={styles.rowWrap}>
                            <TouchableOpacity style={styles.smallButton} onPress={() => savePresence("")}>
                                <Text style={styles.smallButtonText}>Online</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.smallButton} onPress={() => savePresence("away")}>
                                <Text style={styles.smallButtonText}>Away</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.smallButton} onPress={() => savePresence("offline")}>
                                <Text style={styles.smallButtonText}>Offline</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.toggleRow} onPress={toggleAccepting}>
                            <Ionicons
                                name={acceptingConsultations ? "checkbox" : "square-outline"}
                                size={22}
                                color={COLORS.SecodaryColor}
                            />
                            <Text style={styles.toggleText}>Accepting consultation requests</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Weekly availability</Text>
                        <Text style={styles.label}>Day</Text>
                        <View style={styles.rowWrap}>
                            {WEEKDAYS.map((day) => (
                                <TouchableOpacity
                                    key={day.value}
                                    style={[styles.chip, selectedWeekday === day.value && styles.chipSelected]}
                                    onPress={() => setSelectedWeekday(day.value)}
                                >
                                    <Text style={[styles.chipText, selectedWeekday === day.value && styles.chipTextSelected]}>
                                        {day.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.timeRow}>
                            <View style={styles.timeField}>
                                <Text style={styles.label}>Start</Text>
                                <TextInput
                                    value={startTime}
                                    onChangeText={setStartTime}
                                    style={styles.input}
                                    placeholder="09:00"
                                    keyboardType="numbers-and-punctuation"
                                    returnKeyType="next"
                                    maxLength={5}
                                />
                            </View>
                            <View style={styles.timeField}>
                                <Text style={styles.label}>End</Text>
                                <TextInput
                                    value={endTime}
                                    onChangeText={setEndTime}
                                    style={styles.input}
                                    placeholder="17:00"
                                    keyboardType="numbers-and-punctuation"
                                    returnKeyType="done"
                                    maxLength={5}
                                />
                            </View>
                        </View>

                        <Text style={styles.label}>Consultation types</Text>
                        <View style={styles.rowWrap}>
                            {CONSULTATION_TYPES.map((type) => {
                                const selected = selectedRuleTypes.includes(type.value);
                                return (
                                    <TouchableOpacity
                                        key={type.value}
                                        style={[styles.chip, selected && styles.chipSelected]}
                                        onPress={() => toggleRuleType(type.value)}
                                    >
                                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                                            {type.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TouchableOpacity style={styles.outlineButton} onPress={addRule}>
                            <Ionicons name="add" size={18} color={COLORS.SecodaryColor}/>
                            <Text style={styles.outlineButtonText}>Add selected weekly window</Text>
                        </TouchableOpacity>

                        {rules.map((rule, index) => (
                            <View key={`${rule.weekday}-${rule.start_minute}-${index}`} style={styles.listItem}>
                                <View>
                                    <Text style={styles.listTitle}>
                                        {WEEKDAYS.find((day) => day.value === rule.weekday)?.label} {minuteToTime(rule.start_minute)}-{minuteToTime(rule.end_minute)}
                                    </Text>
                                    <Text style={styles.listMeta}>
                                        {rule.consultation_types?.length || 0} consultation type{rule.consultation_types?.length === 1 ? "" : "s"}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => setRules((current) => current.filter((_, i) => i !== index))}>
                                    <Ionicons name="trash-outline" size={20} color="#D64545"/>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>One-off dates</Text>
                        <Calendar
                            calendarInstanceId="lawyer-availability-exceptions"
                            calendarMonthId={selectedDateId}
                            calendarMinDateId={toDateId(today)}
                            calendarMaxDateId={toDateId(maxDate)}
                            calendarActiveDateRanges={[{startId: selectedDateId, endId: selectedDateId}]}
                            calendarFirstDayOfWeek="monday"
                            calendarDayHeight={36}
                            calendarRowHorizontalSpacing={4}
                            calendarRowVerticalSpacing={6}
                            onCalendarDayPress={setSelectedDateId}
                        />

                        <View style={styles.timeRow}>
                            <View style={styles.timeField}>
                                <Text style={styles.label}>Start</Text>
                                <TextInput
                                    value={exceptionStart}
                                    onChangeText={setExceptionStart}
                                    style={styles.input}
                                    placeholder="09:00"
                                    keyboardType="numbers-and-punctuation"
                                    returnKeyType="next"
                                    maxLength={5}
                                />
                            </View>
                            <View style={styles.timeField}>
                                <Text style={styles.label}>End</Text>
                                <TextInput
                                    value={exceptionEnd}
                                    onChangeText={setExceptionEnd}
                                    style={styles.input}
                                    placeholder="10:00"
                                    keyboardType="numbers-and-punctuation"
                                    returnKeyType="done"
                                    maxLength={5}
                                />
                            </View>
                        </View>

                        <View style={styles.rowWrap}>
                            <TouchableOpacity
                                style={[styles.chip, !exceptionAvailable && styles.chipSelected]}
                                onPress={() => setExceptionAvailable(false)}
                            >
                                <Text style={[styles.chipText, !exceptionAvailable && styles.chipTextSelected]}>
                                    Unavailable
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.chip, exceptionAvailable && styles.chipSelected]}
                                onPress={() => setExceptionAvailable(true)}
                            >
                                <Text style={[styles.chipText, exceptionAvailable && styles.chipTextSelected]}>
                                    Available
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Consultation types</Text>
                        <View style={styles.rowWrap}>
                            {CONSULTATION_TYPES.map((type) => {
                                const selected = selectedExceptionTypes.includes(type.value);
                                return (
                                    <TouchableOpacity
                                        key={type.value}
                                        style={[styles.chip, selected && styles.chipSelected]}
                                        onPress={() => toggleExceptionType(type.value)}
                                    >
                                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                                            {type.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TouchableOpacity style={styles.outlineButton} onPress={addException}>
                            <Ionicons name="add" size={18} color={COLORS.SecodaryColor}/>
                            <Text style={styles.outlineButtonText}>Add selected one-off block</Text>
                        </TouchableOpacity>

                        {exceptions.map((item, index) => (
                            <View key={`${item.start_at}-${index}`} style={styles.listItem}>
                                <View>
                                    <Text style={styles.listTitle}>
                                        {new Date(item.start_at).toLocaleDateString()} {new Date(item.start_at).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                                        {" - "}
                                        {new Date(item.end_at).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                                    </Text>
                                    <Text style={styles.listMeta}>
                                        {item.is_available ? "Available" : "Unavailable"} - {item.consultation_types?.length || 0}{" "}
                                        consultation type{item.consultation_types?.length === 1 ? "" : "s"}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => setExceptions((current) => current.filter((_, i) => i !== index))}>
                                    <Ionicons name="trash-outline" size={20} color="#D64545"/>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={saveAvailability}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#FFF"/>
                        ) : (
                            <Text style={styles.saveButtonText}>Save availability</Text>
                        )}
                    </TouchableOpacity>
                </KeyboardAwareScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BackgroundColor,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.BackgroundColor,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.PrimaryColorText,
    },
    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        padding: SPACING.md,
        paddingBottom: 36,
    },
    section: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E7E7E7",
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: COLORS.PrimaryColorText,
        marginBottom: 12,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.Gray,
        marginTop: 10,
        marginBottom: 6,
    },
    input: {
        minHeight: 44,
        borderWidth: 1,
        borderColor: "#DADADA",
        borderRadius: 8,
        paddingHorizontal: 12,
        color: COLORS.Black,
        backgroundColor: COLORS.White,
    },
    rowWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
    },
    chip: {
        minHeight: 36,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#DADADA",
        justifyContent: "center",
        backgroundColor: COLORS.White,
    },
    chipSelected: {
        backgroundColor: COLORS.SecodaryColor,
        borderColor: COLORS.SecodaryColor,
    },
    chipText: {
        fontSize: 13,
        color: COLORS.PrimaryColorText,
        fontWeight: "600",
    },
    chipTextSelected: {
        color: COLORS.White,
    },
    timeRow: {
        flexDirection: "row",
        gap: 12,
    },
    timeField: {
        flex: 1,
    },
    outlineButton: {
        minHeight: 42,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderWidth: 1,
        borderColor: COLORS.SecodaryColor,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginTop: 14,
        backgroundColor: COLORS.White,
    },
    outlineButtonText: {
        color: COLORS.SecodaryColor,
        fontWeight: "700",
    },
    dangerButton: {
        minHeight: 42,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        paddingHorizontal: 12,
        marginTop: 14,
        backgroundColor: "#FDEDED",
    },
    dangerButtonText: {
        color: "#D64545",
        fontWeight: "700",
    },
    listItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#EFEFEF",
    },
    listTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.PrimaryColorText,
    },
    listMeta: {
        fontSize: 12,
        color: COLORS.Gray,
        marginTop: 2,
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.PrimaryColorText,
    },
    smallButton: {
        minHeight: 36,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: "#F2F2F2",
        justifyContent: "center",
    },
    smallButtonText: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.PrimaryColorText,
    },
    toggleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
        gap: 8,
    },
    toggleText: {
        fontSize: 14,
        color: COLORS.PrimaryColorText,
        fontWeight: "600",
    },
    saveButton: {
        minHeight: 50,
        borderRadius: 10,
        backgroundColor: COLORS.SecodaryColor,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: COLORS.White,
        fontWeight: "800",
        fontSize: 16,
    },
});

export default AvailabilityScreen;

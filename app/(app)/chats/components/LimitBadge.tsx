import {StyleSheet, View, Text} from "react-native";

type LimitBadgeProps = {
    icon: string;
    remaining: number;
    count: number | null;
    label: string;
};

export default function LimitBadge({
                                       icon,
                                       remaining,
                                       count,
                                       label
                                   }: LimitBadgeProps) {

    return (
        <View style={styles.badge}>
            <Text style={styles.iconStyle}>{icon}</Text>
            {count === null ? (
                <Text style={{
                    fontSize: 11, fontWeight: '700',
                    color: count === 0 ? '#FF3B30' : '#495057'
                }}>
                    Unlimited
                </Text>
            ) : (
                <Text style={{
                    fontSize: 11, fontWeight: '700',
                    color: count === 0 ? '#FF3B30' : '#495057'
                }}>
                    {(remaining >= count ? count : remaining)}/{count}
                </Text>)
            }
            <Text style={styles.textLabel}>
                {label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 4,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E9ECEF'
    },
    iconStyle: {
        fontSize: 10, marginRight: 2
    },
    textLabel: {
        fontSize: 10, color: '#6C757D', marginLeft: 2
    }
})

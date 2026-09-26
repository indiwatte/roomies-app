import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRooms } from "@/features/rooms/room-context";
import { typography } from '../../constants/typography';

export default function RewardsScreen() {
    const { currentRoom } = useRooms();
    const insets = useSafeAreaInsets();

    if (!currentRoom) {
        return null;
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top + 64 }]}>
            <Text style={styles.title}>Rewards</Text>
            <Text style={styles.subtitle}>
                Define what house points unlock for {currentRoom.name}.
            </Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Pizza night</Text>
                <Text style={styles.cardMeta}>120 coins</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Skip one chore</Text>
                <Text style={styles.cardMeta}>80 coins</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: "#F8F7F4",
    },
    title: {
         ...typography.title,
        fontSize: 28,
        fontWeight: "700",
        color: "#222",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        marginBottom: 24,
    },
    card: {
        padding: 20,
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E7E2D9",
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#222",
        marginBottom: 6,
    },
    cardMeta: {
        fontSize: 14,
        color: "#666",
    },
});
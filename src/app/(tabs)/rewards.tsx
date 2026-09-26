import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import Card from "@/components/Card";
import ScreenHeader from "@/components/ScreenHeader";
import { useRooms } from "@/features/rooms/room-store";
import { colors } from "../../constants/colors";

const BASE_REWARDS = [
    { id: "r1", title: "Movie Night", points: 120, description: "Finish all weekly tasks." },
    { id: "r2", title: "Take-out Friday", points: 180, description: "Keep shared spaces clean for 7 days." },
    { id: "r3", title: "Chore-Free Sunday", points: 250, description: "Complete your assigned tasks on time." },
];

export default function RewardsScreen() {
    const { currentRoom, members } = useRooms();

    const rewards = useMemo(() => {
        if (!currentRoom) return [];
        const bonus = members.length * 10;

        return BASE_REWARDS.map((reward) => ({
            ...reward,
            points: reward.points + bonus,
        }));
    }, [currentRoom, members.length]);

    if (!currentRoom) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>No current room</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <ScreenHeader
                title={`Rewards for ${currentRoom.name}`}
                subtitle="Collect points together and unlock room rewards."
            />

            {rewards.map((reward) => (
                <Card key={reward.id} style={styles.rewardCard}>
                    <View style={styles.rewardTopRow}>
                        <Text style={styles.rewardTitle}>{reward.title}</Text>
                        <View style={styles.pointsBadge}>
                            <Text style={styles.pointsText}>{reward.points} pts</Text>
                        </View>
                    </View>

                    <Text style={styles.rewardDescription}>{reward.description}</Text>
                </Card>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        color: colors.dark,
        paddingHorizontal: 24,
        paddingTop: 72,
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 72,
        paddingBottom: 130,
        gap: 12,
    },
    rewardCard: {
        gap: 10,
    },
    rewardTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    rewardTitle: {
        color: colors.dark,
        fontSize: 18,
        fontWeight: "700",
        flex: 1,
        marginRight: 8,
    },
    pointsBadge: {
        backgroundColor: colors.blue,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    pointsText: {
        color: colors.dark,
        fontSize: 12,
        fontWeight: "700",
    },
    rewardDescription: {
        color: colors.dark,
        fontSize: 14,
        lineHeight: 20,
    },
});
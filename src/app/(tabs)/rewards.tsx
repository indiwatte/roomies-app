import { useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import Button from "@/components/Button";
import Card from "@/components/Card";
import ScreenHeader from "@/components/ScreenHeader";
import { updateMemberCoinsInStrapi } from "@/api/members";
import { useAuth } from "@/features/auth/auth-store";
import { useRooms } from "@/features/rooms/room-store";
import { colors } from "../../constants/colors";

const BASE_REWARDS = [
    { id: "r1", title: "Pizza Night", cost: 40, description: "Pizza Night on the Roommates" },
    { id: "r2", title: "Morning coffee", cost: 90, description: "Morning Coffee in Bed on the house" },
    { id: "r3", title: "Let's skip", cost: 140, description: "Skip one small chore this week." },
    { id: "r4", title: "Movie night", cost: 140, description: "Movie night pick" },
];

export default function RewardsScreen() {
    const { currentRoom, members, updateMemberCoins } = useRooms();
    const { user } = useAuth();

    const me =
        members.find(
            (member) =>
                (member.memberName ?? "").trim().toLowerCase() === (user?.username ?? "").trim().toLowerCase()
        ) ?? members[0] ?? null;
    const myCoins = me?.coins ?? 0;

    const handleBuy = async (cost: number, title: string) => {
        if (!me?.documentId) {
            Alert.alert("No profile", "Join room again so your profile can sync.");
            return;
        }

        if (myCoins < cost) {
            Alert.alert("Not enough FishCoins", `You need ${cost - myCoins} more FishCoins.`);
            return;
        }

        const nextCoins = myCoins - cost;
        updateMemberCoins(me.id, nextCoins);

        try {
            await updateMemberCoinsInStrapi(me.documentId, nextCoins);
            Alert.alert("Purchased", `You bought ${title}.`);
        } catch (error) {
            console.error("Fout bij kopen reward:", error);
            Alert.alert("Purchase failed", "Could not save purchase to server.");
        }
    };

    const rewards = useMemo(() => {
        if (!currentRoom) return [];
        const bonus = members.length * 2;

        return BASE_REWARDS.map((reward) => ({
            ...reward,
            cost: reward.cost + bonus,
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
                subtitle="Spend your well earned FishCoins on rewards."
            />

            <Card style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Your Balance</Text>
                <Text style={styles.balanceValue}>{myCoins} FishCoins</Text>
            </Card>

            {rewards.map((reward) => (
                <Card key={reward.id} style={styles.rewardCard}>
                    <View style={styles.rewardTopRow}>
                        <Text style={styles.rewardTitle}>{reward.title}</Text>
                        <View style={styles.pointsBadge}>
                            <Text style={styles.pointsText}>{reward.cost} FishCoins</Text>
                        </View>
                    </View>

                    <Text style={styles.rewardDescription}>{reward.description}</Text>

                    <Button
                        title="Buy"
                        variant="dark"
                        disabled={myCoins < reward.cost}
                        onPress={() => {
                            void handleBuy(reward.cost, reward.title);
                        }}
                    />
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
    balanceCard: {
        marginBottom: 4,
    },
    balanceLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
        fontWeight: "600",
    },
    balanceValue: {
        fontSize: 24,
        fontWeight: "800",
        color: colors.primary,
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
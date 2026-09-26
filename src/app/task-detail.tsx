import { Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function TaskDetailScreen() {
    return (
        <>
            <Stack.Screen options={{ title: "Task detail" }} />
            <View style={styles.container}>
                <Text style={styles.title}>Dishwasher duty</Text>
                <Text style={styles.meta}>Assigned to: You</Text>
                <Text style={styles.meta}>Reward: 20 coins</Text>

                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.body}>
                    Placeholder detail screen for the next step in the task flow.
                </Text>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: "#F8F7F4",
    },
    title: {
        fontSize: 30,
        fontWeight: "700",
        color: "#222",
        marginBottom: 12,
    },
    meta: {
        fontSize: 16,
        color: "#666",
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#222",
        marginTop: 24,
        marginBottom: 8,
    },
    body: {
        fontSize: 16,
        color: "#444",
        lineHeight: 24,
    },
});
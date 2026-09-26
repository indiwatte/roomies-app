import { Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import Card from "@/components/Card";
import ScreenHeader from "@/components/ScreenHeader";
import { colors } from "../constants/colors";

export default function TaskDetailScreen() {
    return (
        <>
            <Stack.Screen options={{ title: "Task detail" }} />
            <View style={styles.container}>
                <ScreenHeader title="Dishwasher duty" subtitle="Assigned to: You • Reward: 20 coins" />

                <Card>
                    <Text style={styles.sectionTitle}>Notes</Text>
                    <Text style={styles.body}>
                        Placeholder detail screen for the next step in the task flow.
                    </Text>
                </Card>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: colors.screenBg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.dark,
        marginBottom: 8,
    },
    body: {
        fontSize: 16,
        color: colors.textPrimary,
        lineHeight: 24,
    },
});
import { Link, Redirect, Stack, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import Card from "@/components/Card";
import { useRooms } from "@/features/rooms/room-store";
import { colors } from "../../constants/colors";

export default function RoomScreen() {
    const { code } = useLocalSearchParams<{ code: string }>();
    const { getRoom, setCurrentRoom } = useRooms();
    const room = getRoom(code ?? "");

    useEffect(() => {
        if (code && room) {
            setCurrentRoom(code);
        }
    }, [code, room, setCurrentRoom]);

    if (room) {
        return <Redirect href="/(tabs)" />;
    }

    if (!room) {
        return (
            <>
                <Stack.Screen options={{ title: "Room" }} />
                <View style={styles.container}>
                    <Card style={styles.card}>
                        <Text style={styles.title}>Room niet gevonden</Text>
                        <Link href="/join-room" style={styles.link}>
                            Join met een geldige code
                        </Link>
                    </Card>
                </View>
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: colors.screenBg,
    },
    card: {
        width: "100%",
        alignItems: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: colors.dark,
        marginBottom: 16,
        textAlign: "center",
    },
    link: {
        fontSize: 16,
        color: colors.dark,
        textDecorationLine: "underline",
    },
});

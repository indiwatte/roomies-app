import { Link, Redirect, Stack, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useRooms } from "@/features/rooms/room-context";

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
                    <Text style={styles.title}>Room niet gevonden</Text>
                    <Link href="/join-room" style={styles.link}>
                        Join met een geldige code
                    </Link>
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
        backgroundColor: "#F8F7F4",
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 16,
        textAlign: "center",
    },
    link: {
        fontSize: 16,
        color: "#222",
        textDecorationLine: "underline",
    },
});

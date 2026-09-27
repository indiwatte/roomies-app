import { Redirect, router } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import { useAudioPlayer } from "expo-audio";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRooms } from "@/features/rooms/room-store";
import { colors } from '../constants/colors';
import Button from "@/components/Button";
import Card from "@/components/Card";
import ScreenHeader from "@/components/ScreenHeader";
import { useAuth } from "@/features/auth/auth-store";

export default function LandingScreen() {
    const insets = useSafeAreaInsets();
    const { isAuthenticated } = useAuth();
    const { currentRoom } = useRooms();

    const meowPlayer = useAudioPlayer(
        require("../../assets/meow.mp3")
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            meowPlayer.play();
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    if (!isAuthenticated) {
        return <Redirect href="/onboarding" />;
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
            <View style={styles.header}>
                <ScreenHeader
                    title="Welcome to the gang"
                    subtitle="I'm Homi, your house cat! Join your room, or if your new make a new one. I will be there either way"
                    style={styles.heroHeader}
                />
            </View>

            {currentRoom ? (
                <Card style={styles.roomCard}>
                    <Text style={styles.roomLabel}>Active room</Text>
                    <Text style={styles.roomName}>{currentRoom.name}</Text>
                    <Text style={styles.roomCode}>{currentRoom.code}</Text>

                    <Button
                        title="Enter room"
                        variant="secondary"
                        onPress={() => router.push("/(tabs)")}
                        style={{ paddingVertical: 12 }}
                    />
                </Card>
            ) : null}

            <View style={styles.imageContainer}>
                <View style={styles.blueCircle} />
                <Image
                    source={require("../../assets/cat-home.png")}
                    style={styles.catImage}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.buttonContainer}>
                <Button
                    title="Create a room"
                    variant="dark"
                    onPress={() => router.push("/create-room")}
                    style={{ marginBottom: 12 }}
                />

                <Button
                    title="Join a room"
                    variant="outline"
                    onPress={() => router.push("/join-room")}
                />
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: 20,
        paddingBottom: 40,
        paddingHorizontal: 24,
        backgroundColor: colors.background, // primary color
    },


    header: {
        alignItems: "center",
        width: "100%",
        justifyContent: 'center',
    },

    heroHeader: {
        alignItems: "center",
        marginBottom: 8,
    },
    roomCard: {
        width: "100%",
        marginBottom: 16,
    },
    imageContainer: {
        width: "100%",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        marginVertical: 8,
    },
    blueCircle: {
        position: "absolute",
        width: 360,
        height: 360,
        borderRadius: 200,
        backgroundColor: colors.blue,
    },
    catImage: {
        width: 650,
        height: 600,
    },
    roomLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.textMuted,
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    roomName: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.dark,
    },
    roomCode: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
        marginBottom: 10,
    },
    buttonContainer: {
        width: "100%",
        marginTop: "auto",
    },

});
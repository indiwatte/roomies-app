import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useAudioPlayer } from "expo-audio";
import { useEffect } from "react";

import { useRooms } from "@/features/rooms/room-context";
import { colors } from '../constants/colors';
import Button from "@/components/Button"; 
import { typography } from '../constants/typography';

export default function LandingScreen() {
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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.logo}>Homi</Text>

                <Text style={styles.title}>Together we work better</Text>

                <Text style={styles.subtitle}>
                    Hello there, Im Homi, your shared house cat from now on, so let's maintain our shared homes in a cozy and fun way
                </Text>
            </View>

            {currentRoom ? (
                <View style={styles.roomCard}>
                    <Text style={styles.roomLabel}>Active room</Text>
                    <Text style={styles.roomName}>{currentRoom.name}</Text>
                    <Text style={styles.roomCode}>{currentRoom.code}</Text>

                    <Button
                        title="Enter room"
                        variant="secondary"
                        onPress={() => router.push("/(tabs)")}
                        style={{ paddingVertical: 12 }}
                    />
                </View>
            ) : null}

            

            {/* De kat illustratie met blauwe achtergrondcirkel */}
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
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 24,
        backgroundColor: colors.background, // primary color
    },
   

    header: {
        alignItems: "center",
        width: "100%",
    },

    logo: {
        fontSize: 42,
        fontWeight: "700",
        color: "#3C222D",
        marginBottom: 30,
        marginTop: 30,
    },

    title: {
        ...typography.title,
        fontSize: 24,
        textAlign: "center",
        marginBottom: 20,
    },

    subtitle: {
        fontSize: 14,
        textAlign: "center",
        color: "#3C222D",
        paddingHorizontal: 10,
    },
    roomCard: {
        width: "100%",
        padding: 16,
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E7E2D9",
        marginBottom: 10,
    },
    roomLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#7D7464",
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    roomName: {
        fontSize: 20,
        fontWeight: "700",
        color: "#3C222D",
    },
    roomCode: {
        fontSize: 14,
        color: "#666",
        marginTop: 2,
        marginBottom: 10,
    },
    roomButton: {
        padding: 12,
        borderRadius: 12,
        backgroundColor: "#ECE7DD",
        alignItems: "center",
    },
    roomButtonText: {
        color: "#3C222D",
        fontSize: 14,
        fontWeight: "600",
    },
    imageContainer: {
        width: "100%",
        height: 220,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        marginVertical: 10,
    },
    blueCircle: {
        position: "absolute",
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: colors.blue,// blue color
    },
    catImage: {
        width: 520,
        height: 520,
    },
    buttonContainer: {
        width: "100%",
    },

});
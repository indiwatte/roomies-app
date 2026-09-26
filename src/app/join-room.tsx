import { useState } from "react";
import { router, Stack } from "expo-router";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
} from "react-native";

import { useRooms } from "@/features/rooms/room-context";

export default function JoinRoomScreen() {
    const { joinRoom } = useRooms();
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);

    const canSubmit = code.trim().length > 0;

    const handleJoin = async () => {
        if (!canSubmit) return;
        const normalized = code.trim().toUpperCase();

        // Gebruik await omdat joinRoom nu asynchroon in Strapi zoekt!
        const success = await joinRoom(normalized);

        if (success) {
            setError(null);
            router.replace("/(tabs)");
        } else {
            setError("Room niet gevonden. Controleer de code.");
        }
    };

    return (
        <>
            <Stack.Screen options={{ title: "Join a room" }} />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <Text style={styles.label}>Room code</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Bijv. ABC123"
                    value={code}
                    onChangeText={(value) => {
                        setCode(value.toUpperCase());
                        setError(null);
                    }}
                    autoCapitalize="characters"
                    autoFocus
                    maxLength={6}
                    returnKeyType="done"
                    onSubmitEditing={handleJoin}
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Pressable
                    style={[styles.button, !canSubmit && styles.buttonDisabled]}
                    onPress={handleJoin}
                    disabled={!canSubmit}
                >
                    <Text style={styles.buttonText}>Join room</Text>
                </Pressable>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: "#F8F7F4",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: "white",
        marginBottom: 12,
    },
    error: {
        color: "#C0392B",
        marginBottom: 12,
    },
    button: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: "#222",
        alignItems: "center",
    },
    buttonDisabled: {
        opacity: 0.4,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
});

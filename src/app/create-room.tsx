import { useState } from "react";
import { router, Stack } from "expo-router";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
} from "react-native";

import { useRooms } from "@/features/rooms/room-context";

export default function CreateRoomScreen() {
    const { createRoom } = useRooms();
    const [name, setName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const canSubmit = name.trim().length > 0 && !isCreating;

    const handleCreate = async () => {
        if (!canSubmit) return;

        setIsCreating(true);
        try {
            // Wait for the room (and its Strapi record) to actually exist
            // before navigating. Navigating first caused a race where the
            // tabs layout saw `currentRoom` as still undefined and bounced
            // back, which could spiral into a navigation update loop.
            await createRoom(name.trim());
            router.replace("/(tabs)");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ title: "Create a room" }} />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <Text style={styles.label}>Room name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Bijv. Casa 42"
                    value={name}
                    onChangeText={setName}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleCreate}
                />

                <Pressable
                    style={[styles.button, !canSubmit && styles.buttonDisabled]}
                    onPress={handleCreate}
                    disabled={!canSubmit}
                >
                    {isCreating ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.buttonText}>Room aanmaken</Text>
                    )}
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
        marginBottom: 24,
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

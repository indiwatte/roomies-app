import { useState } from "react";
import { router, Stack } from "expo-router";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TextInput,
} from "react-native";

import Button from "@/components/Button";
import Card from "@/components/Card";
import ScreenHeader from "@/components/ScreenHeader";
import { useRooms } from "@/features/rooms/room-store";
import { colors } from "../constants/colors";

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
                <ScreenHeader title="Create a room" subtitle="Start a cozy shared space with your homies." />

                <Card>
                    <TextInput
                        style={styles.input}
                        placeholder="Bijv. Casa 42"
                        placeholderTextColor={colors.textDisabled}
                        value={name}
                        onChangeText={setName}
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={handleCreate}
                    />

                    <Button
                        title={isCreating ? "Room aanmaken..." : "Room aanmaken"}
                        variant="dark"
                        onPress={handleCreate}
                        disabled={!canSubmit}
                        icon={isCreating ? <ActivityIndicator color={colors.white} /> : undefined}
                    />
                </Card>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: colors.screenBg,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: colors.white,
        marginBottom: 24,
        color: colors.dark,
    },
});

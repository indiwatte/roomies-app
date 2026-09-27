import { useState } from "react";
import { Redirect, router, Stack } from "expo-router";
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
} from "react-native";

import Button from "@/components/Button";
import Card from "@/components/Card";
import ScreenHeader from "@/components/ScreenHeader";
import { useAuth } from "@/features/auth/auth-store";
import { useRooms } from "@/features/rooms/room-store";
import { colors } from "../constants/colors";

export default function JoinRoomScreen() {
    const { isAuthenticated } = useAuth();
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

    if (!isAuthenticated) {
        return <Redirect href="/onboarding" />;
    }

    return (
        <>
            <Stack.Screen options={{ title: "Join a room" }} />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScreenHeader title="Join a room" subtitle="Use your 6-digit code to enter an existing room." />

                <Card>
                    <TextInput
                        style={styles.input}
                        placeholder="Bijv. ABC123"
                        placeholderTextColor={colors.textDisabled}
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

                    <Button
                        title="Join room"
                        variant="dark"
                        onPress={handleJoin}
                        disabled={!canSubmit}
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
        marginBottom: 12,
        color: colors.dark,
    },
    error: {
        color: colors.primary,
        marginBottom: 12,
    },
});

import { Redirect, router, Stack } from "expo-router";
import { useMemo, useState, useEffect } from "react";
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { useAudioPlayer } from "expo-audio";

import Button from "@/components/Button";
import Card from "@/components/Card";
import ScreenHeader from "@/components/ScreenHeader";
import { colors } from "@/constants/colors";
import { useAuth } from "@/features/auth/auth-store";

export default function OnboardingScreen() {
    const { signIn, signUp, loading, error, isAuthenticated } = useAuth();
    const meowPlayer = useAudioPlayer(require("../../assets/meow.mp3"));

    const [mode, setMode] = useState<"register" | "login">("register");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const canSubmit = useMemo(() => {
        if (!email.trim() || !password.trim() || loading) return false;
        if (mode === "register" && !name.trim()) return false;
        return true;
    }, [email, loading, mode, name, password]);

    useEffect(() => {
        void meowPlayer.seekTo(0).then(() => {
            meowPlayer.play();
        });

        const interval = setInterval(() => {
            void meowPlayer.seekTo(0).then(() => {
                meowPlayer.play();
            });
        }, 4000);

        return () => clearInterval(interval);
    }, [meowPlayer]);

    if (isAuthenticated) {
        return <Redirect href="/" />;
    }

    const handleSubmit = async () => {
        if (!canSubmit) return;

        try {
            if (mode === "register") {
                await signUp({
                    name: name.trim(),
                    email: email.trim(),
                    password,
                });
            } else {
                await signIn({
                    email: email.trim(),
                    password,
                });
            }

            router.replace("/");
        } catch { }
    };

    return (
        <>
            <Stack.Screen options={{ title: "Welcome" }} />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={styles.heroImageWrap}>
                    <Image
                        source={require("../../assets/cat-face.png")}
                        style={styles.heroImage}
                        resizeMode="contain"
                    />
                </View>

                <ScreenHeader
                    title="I'm Homi, who are you?"
                    subtitle="Let's get you set up! Create an account to keep your actions safely linked to your profile."
                    style={styles.headerBlock}
                />

                <Card>
                    <View style={styles.modeRow}>
                        <Button
                            title="Register"
                            variant={mode === "register" ? "dark" : "light"}
                            onPress={() => setMode("register")}
                            style={styles.modeButton}
                        />
                        <Button
                            title="Login"
                            variant={mode === "login" ? "dark" : "light"}
                            onPress={() => setMode("login")}
                            style={styles.modeButton}
                        />
                    </View>

                    {mode === "register" ? (
                        <>
                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                placeholder="Bijv. Indi"
                                placeholderTextColor={colors.textDisabled}
                            />
                        </>
                    ) : null}

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholder="jij@email.com"
                        placeholderTextColor={colors.textDisabled}
                    />

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholder="••••••••"
                        placeholderTextColor={colors.textDisabled}
                    />

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <Button
                        title={mode === "register" ? "Create account" : "Login"}
                        variant="primary"
                        onPress={handleSubmit}
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
    heroImageWrap: {
        alignItems: "flex-start",


        marginBottom: 5,
    },
    heroImage: {
        width: 220,
        height: 220,
    },
    headerBlock: {
        marginBottom: 12,
    },
    modeRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 16,
    },
    modeButton: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textSecondary,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        backgroundColor: colors.white,
        color: colors.dark,
        marginBottom: 14,
    },
    errorText: {
        color: colors.primary,
        marginBottom: 12,
        fontSize: 13,
    },
});

import { Redirect } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View, TextInput, Pressable } from "react-native";

import { useRooms } from "@/features/rooms/room-context";

export default function ProfileScreen() {
    const { currentRoom, members, setMyProfile } = useRooms();
    const myProfile = members.find((m) => m.id === "you");

    const [name, setName] = useState(myProfile?.memberName ?? "");
    const [saved, setSaved] = useState(false);

    if (!currentRoom) {
        return <Redirect href="/" />;
    }

    const handleSave = () => {
        if (!name.trim()) return;
        setMyProfile(name, "#F6CFA3");
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Your Profile</Text>
            <Text style={styles.subtitle}>Set your name for room {currentRoom.name}.</Text>

            <View style={styles.form}>
                <Text style={styles.label}>Your Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your name..."
                    value={name}
                    onChangeText={setName}
                />

                <Pressable style={styles.button} onPress={handleSave}>
                    <Text style={styles.buttonText}>Save Profile</Text>
                </Pressable>

                {saved && <Text style={styles.successText}>Profile saved successfully! ✓</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: "#F8F7F4",
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#222",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        marginBottom: 24,
    },
    form: {
        backgroundColor: "#FFF",
        padding: 20,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#E7E2D9",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: "#FAFAFA",
        marginBottom: 20,
    },
    button: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: "#222",
        alignItems: "center",
    },
    buttonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "600",
    },
    successText: {
        marginTop: 12,
        color: "#526B4C",
        fontWeight: "600",
        textAlign: "center",
    },
});

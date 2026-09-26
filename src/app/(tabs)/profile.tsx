import { Redirect } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View, TextInput } from "react-native";

import Button from "@/components/Button";
import Card from "@/components/Card";
import ScreenHeader from "@/components/ScreenHeader";
import { useRooms } from "@/features/rooms/room-store";
import { colors } from "../../constants/colors";

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
        setMyProfile(name, colors.assigneeBorder);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <View style={styles.container}>
            <ScreenHeader title="Your Profile" subtitle={`Set your name for room ${currentRoom.name}.`} />

            <Card style={styles.form}>
                <Text style={styles.label}>Your Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your name..."
                    placeholderTextColor={colors.textDisabled}
                    value={name}
                    onChangeText={setName}
                />

                <Button title="Save Profile" variant="dark" onPress={handleSave} />

                {saved && <Text style={styles.successText}>Profile saved successfully! ✓</Text>}
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: colors.screenBg,
    },
    form: {
        padding: 20,
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
        padding: 16,
        fontSize: 16,
        backgroundColor: colors.background,
        marginBottom: 20,
        color: colors.dark,
    },
    successText: {
        marginTop: 12,
        color: colors.checkCircleBg,
        fontWeight: "600",
        textAlign: "center",
    },
});

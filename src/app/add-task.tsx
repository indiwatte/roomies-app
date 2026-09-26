import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import Button from "@/components/Button";
import Card from "@/components/Card";
import ScreenHeader from "@/components/ScreenHeader";
import { createTask } from "../api/tasks";
import { ensureRoom } from "../api/rooms";
import { ensureMembers } from "../api/members";
import { useRooms } from "@/features/rooms/room-store";
import { colors } from "../constants/colors";

export default function AddTaskScreen() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("2026-12-31");
    const [dueTime, setDueTime] = useState("18:00");
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [strapiRoomId, setStrapiRoomId] = useState<string | null>(null);
    const [memberIdMap, setMemberIdMap] = useState<Record<string, string>>({});
    const [syncing, setSyncing] = useState(true);
    const [saving, setSaving] = useState(false);

    const { currentRoom, members } = useRooms();

    // Zorg dat de huidige room en alle roommates ook als echte records
    // in Strapi bestaan, zodat we ze als relatie aan de taak kunnen hangen.
    useEffect(() => {
        let isMounted = true;

        async function sync() {
            if (!currentRoom) {
                setSyncing(false);
                return;
            }

            try {
                const strapiRoom = await ensureRoom(currentRoom.code, currentRoom.name);
                const roomId = strapiRoom?.documentId
                    ? String(strapiRoom.documentId)
                    : strapiRoom?.id
                        ? String(strapiRoom.id)
                        : null;
                const resolvedMembers = await ensureMembers(members, roomId);

                if (!isMounted) return;

                setStrapiRoomId(roomId);
                setMemberIdMap(resolvedMembers);
                setSelectedMemberId((current) => current ?? members[0]?.id ?? null);
            } catch (error) {
                console.error("Fout bij synchroniseren met Strapi:", error);
                if (isMounted) {
                    Alert.alert(
                        "Verbindingsfout",
                        "Kon de room en members niet synchroniseren met de server. Controleer of de backend draait en probeer opnieuw."
                    );
                }
            } finally {
                if (isMounted) setSyncing(false);
            }
        }

        sync();

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRoom?.code]);

    const handleSaveTask = async () => {
        if (!title.trim()) {
            Alert.alert("Titel ontbreekt", "Geef de taak een titel.");
            return;
        }

        if (saving || syncing) return;

        const resolvedMemberId = selectedMemberId ? memberIdMap[selectedMemberId] ?? null : null;

        const taskPayload = {
            title: title.trim(),
            description,
            dueDate,
            dueTime,
            completed: false,
            recurring: false,
            room: strapiRoomId,
            assignedTo: resolvedMemberId,
        };

        setSaving(true);

        try {
            await createTask(taskPayload);
            router.back();
        } catch (error) {
            console.error("Fout bij aanmaken taak:", error);
            Alert.alert(
                "Opslaan mislukt",
                error instanceof Error ? error.message : "Kon de taak niet opslaan. Probeer opnieuw."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ title: "Add task" }} />
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <ScreenHeader
                    title="Add task"
                    subtitle="Create a new task and assign it to one of your homies."
                />

                <Card>
                    <Text style={styles.label}>Task title</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Bijv. Keuken opruimen"
                        placeholderTextColor={colors.textDisabled}
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Extra details..."
                        placeholderTextColor={colors.textDisabled}
                        value={description}
                        onChangeText={setDescription}
                    />

                    <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="2026-12-31"
                        placeholderTextColor={colors.textDisabled}
                        value={dueDate}
                        onChangeText={setDueDate}
                    />

                    <Text style={styles.label}>Due Time</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="18:00"
                        placeholderTextColor={colors.textDisabled}
                        value={dueTime}
                        onChangeText={setDueTime}
                    />

                    <Text style={styles.label}>Assign to</Text>
                    <View style={styles.memberRow}>
                        {members.map((member) => {
                            const isSelected = selectedMemberId === member.id;

                            return (
                                <Card
                                    key={member.id}
                                    onPress={() => setSelectedMemberId(member.id)}
                                    style={[styles.memberChip, isSelected && styles.memberChipSelected]}
                                >
                                    {member.avatarUri ? (
                                        <Image source={{ uri: member.avatarUri }} style={styles.memberAvatar} />
                                    ) : (
                                        <View style={[styles.memberAvatar, { backgroundColor: member.avatarColor }]}> 
                                            <Text style={styles.memberInitials}>{member.initials}</Text>
                                        </View>
                                    )}
                                    <Text
                                        style={[styles.memberName, isSelected && styles.memberNameSelected]}
                                        numberOfLines={1}
                                    >
                                        {member.memberName}
                                    </Text>
                                </Card>
                            );
                        })}
                    </View>

                    <Button
                        title={syncing ? "Even synchroniseren..." : "Save task"}
                        variant="dark"
                        onPress={handleSaveTask}
                        disabled={saving || syncing}
                        icon={saving ? <ActivityIndicator color={colors.white} /> : undefined}
                        style={styles.saveButton}
                    />
                </Card>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.screenBg,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 60,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textSecondary,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: colors.white,
        marginBottom: 20,
        color: colors.dark,
    },
    memberRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 24,
    },
    memberChip: {
        width: 78,
        alignItems: "center",
        padding: 8,
        borderRadius: 14,
        backgroundColor: colors.white,
    },
    memberChipSelected: {
        borderColor: colors.dark,
        backgroundColor: colors.background,
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 6,
    },
    memberInitials: {
        fontSize: 13,
        fontWeight: "700",
        color: colors.assigneeText,
    },
    memberName: {
        fontSize: 11,
        color: colors.textSecondary,
        textAlign: "center",
    },
    memberNameSelected: {
        color: colors.dark,
        fontWeight: "700",
    },
    saveButton: {
        marginBottom: 40,
    },
});
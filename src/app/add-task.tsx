import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { createTask } from "../api/tasks";
import { ensureRoom } from "../api/rooms";
import { ensureMembers } from "../api/members";
import { useRooms } from "@/features/rooms/room-context";

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
                <Text style={styles.label}>Task title</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Bijv. Keuken opruimen"
                    value={title}
                    onChangeText={setTitle}
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Extra details..."
                    value={description}
                    onChangeText={setDescription}
                />

                <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="2026-12-31"
                    value={dueDate}
                    onChangeText={setDueDate}
                />

                <Text style={styles.label}>Due Time</Text>
                <TextInput
                    style={styles.input}
                    placeholder="18:00"
                    value={dueTime}
                    onChangeText={setDueTime}
                />

                <Text style={styles.label}>Assign to</Text>
                <View style={styles.memberRow}>
                    {members.map((member) => {
                        const isSelected = selectedMemberId === member.id;

                        return (
                            <Pressable
                                key={member.id}
                                style={[styles.memberChip, isSelected && styles.memberChipSelected]}
                                onPress={() => setSelectedMemberId(member.id)}
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
                            </Pressable>
                        );
                    })}
                </View>

                <Pressable
                    style={[styles.button, (saving || syncing) && styles.buttonDisabled]}
                    onPress={handleSaveTask}
                    disabled={saving || syncing}
                >
                    {saving ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.buttonText}>
                            {syncing ? "Even synchroniseren..." : "Save task"}
                        </Text>
                    )}
                </Pressable>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F7F4",
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 60,
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
        backgroundColor: "#FFF",
        marginBottom: 20,
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
        borderWidth: 1,
        borderColor: "#DDD",
        backgroundColor: "#FFF",
    },
    memberChipSelected: {
        borderColor: "#222",
        backgroundColor: "#F0EEE9",
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
        color: "#3A3128",
    },
    memberName: {
        fontSize: 11,
        color: "#666",
        textAlign: "center",
    },
    memberNameSelected: {
        color: "#222",
        fontWeight: "700",
    },
    button: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: "#222",
        alignItems: "center",
        marginBottom: 40,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
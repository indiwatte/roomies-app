import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ImageBackground,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "@/components/Button";
import Card from "@/components/Card";
import { useRooms } from "@/features/rooms/room-store";
import { getTasksForRoom, type StrapiTask } from "../../api/tasks";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";

export default function HomeScreen() {
    const { currentRoom, members, refreshMembers } = useRooms();
    const insets = useSafeAreaInsets();
    const roomDocumentId = currentRoom?.documentId;
    const currentUser = members.find((member) => member.id === "you") ?? members[0];

    const [roomTasks, setRoomTasks] = useState<StrapiTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [enteredName, setEnteredName] = useState("");
    const [isNameDismissed, setIsNameDismissed] = useState(false);

    const needsName = !currentUser || currentUser.memberName === "You" || !currentUser.memberName;
    const showNameModal = needsName && !isNameDismissed;

    const displayName =
        currentUser?.memberName && currentUser.memberName !== "You"
            ? currentUser.memberName
            : enteredName || "You";

    const tasks = useMemo(() => {
        const myNormalizedName = displayName !== "You" ? displayName.trim().toLowerCase() : "";
        if (!myNormalizedName) return [];

        return roomTasks.filter((task) => {
            const relation = task.assignedTo as { name?: string } | null | undefined;
            return (relation?.name ?? "").trim().toLowerCase() === myNormalizedName;
        });
    }, [displayName, roomTasks]);

    useFocusEffect(
        useCallback(() => {
            if (!roomDocumentId) {
                setRoomTasks([]);
                setLoading(false);
                return;
            }

            let canceled = false;

            async function fetchHomeTasks() {
                setLoading(true);
                try {
                    const roomId = roomDocumentId;
                    if (!roomId) {
                        if (!canceled) setRoomTasks([]);
                        return;
                    }

                    const data = await getTasksForRoom(roomId);
                    const activeTasks = (data ?? []).filter((task) => !task.completed);
                    if (!canceled) setRoomTasks(activeTasks);
                } catch (err) {
                    console.error("Fout bij ophalen home taken:", err);
                } finally {
                    if (!canceled) setLoading(false);
                }
            }

            void fetchHomeTasks();
            void refreshMembers();

            return () => {
                canceled = true;
            };
        }, [roomDocumentId, refreshMembers])
    );

    if (!currentRoom) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Modal visible={showNameModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <Card style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Hello fella, what&apos;s your name?</Text>
                        <Text style={styles.modalSubText}>
                            This is to make sure your homies can recognize you in the shared room
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Bijv. Indi of Thomas..."
                            placeholderTextColor={colors.dark}
                            value={enteredName}
                            onChangeText={setEnteredName}
                            autoFocus
                        />

                        <Button
                            title="Aan de slag!"
                            variant="primary"
                            onPress={() => {
                                if (!enteredName.trim()) return;
                                setIsNameDismissed(true);
                            }}
                            disabled={!enteredName.trim()}
                        />
                    </Card>
                </View>
            </Modal>

            <ImageBackground
                source={require("../../../assets/room.jpeg")}
                resizeMode="cover"
                style={[styles.headerBackground, { paddingTop: insets.top + 16 }]}
            >
                <View style={styles.headerOverlay} />

                <Image
                    source={require("../../../assets/cat-lying.png")}
                    style={styles.catLyingImage}
                    resizeMode="contain"
                />
            </ImageBackground>

            <ScrollView
                style={styles.bottomSheet}
                contentContainerStyle={styles.bottomScrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.sheetHandle} />

                <View style={styles.greetingSection}>
                    <Text style={styles.greetingTitle}>Hi, {displayName}!</Text>
                    <Text style={styles.greetingSubtitle}>What would you like to do in your space today?</Text>
                </View>

                <View style={styles.badgeRow}>
                    <Card style={styles.pillBadge}>
                        <Ionicons name="home" size={12} color={colors.dark} />
                        <Text style={styles.pillText}>{currentRoom.name}</Text>
                    </Card>
                    <Card style={styles.pillBadge}>
                        <Ionicons name="key" size={12} color={colors.dark} />
                        <Text style={styles.pillText}>{currentRoom.code}</Text>
                    </Card>
                    <Card style={styles.pillBadge}>
                        <Ionicons name="people" size={12} color={colors.primary} />
                        <Text style={styles.pillText}>{members.length} members</Text>
                    </Card>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Your Tasks</Text>
                    <Pressable onPress={() => router.push("/tasks")}> 
                        <Text style={styles.seeAllText}>View all ({tasks.length})</Text>
                    </Pressable>
                </View>

                {loading ? (
                    <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
                ) : tasks.length === 0 ? (
                    <Card style={styles.emptyContainer}>
                        <Ionicons name="checkmark-circle-outline" size={32} color={colors.green} style={styles.emptyIcon} />
                        <Text style={styles.emptyText}>Geen openstaande taken in deze room!</Text>
                        <Text style={styles.emptySubText}>Tijd om te ontspannen.</Text>
                    </Card>
                ) : (
                    tasks.map((task, index) => {
                        const cardColor = index % 2 === 0 ? colors.white : colors.blue;

                        return (
                            <Pressable
                                key={task.documentId ?? task.id}
                                style={styles.taskPressable}
                                onPress={() => router.push("/tasks")}
                            >
                                <Card style={[styles.taskCard, { backgroundColor: cardColor }]}>
                                    <View style={styles.taskLeft}>
                                        <View style={styles.taskIconBox}>
                                            <Ionicons name="checkbox-outline" size={16} color={colors.dark} />
                                        </View>
                                        <View style={styles.taskTextWrap}>
                                            <Text style={styles.taskTitle} numberOfLines={1}>
                                                {task.title}
                                            </Text>
                                            <Text style={styles.taskDesc} numberOfLines={1}>
                                                {task.description ||
                                                    (task.dueDate
                                                        ? `Due: ${String(task.dueDate).slice(0, 10)}`
                                                        : "Geen omschrijving")}
                                            </Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color={colors.dark} />
                                </Card>
                            </Pressable>
                        );
                    })
                )}

                <Button
                    title="Add a new task"
                    variant="dark"
                    icon={<Ionicons name="add" size={18} color={colors.white} />}
                    onPress={() => router.push("/add-task")}
                    style={styles.addTaskButton}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: colors.dark,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        opacity: 0.9,
    },
    modalContent: {
        width: "100%",
        maxWidth: 340,
    },
    modalTitle: {
        ...typography.title,
        fontSize: 22,
        textAlign: "center",
        color: colors.dark,
        marginBottom: 8,
    },
    modalSubText: {
        fontSize: 14,
        textAlign: "center",
        color: colors.dark,
        marginBottom: 20,
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.blue,
        borderRadius: 12,
        padding: 14,
        color: colors.dark,
        marginBottom: 16,
    },
    headerBackground: {
        height: 280,
        width: "100%",
        position: "relative",
    },
    headerOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: colors.background,
        opacity: 0.2,
    },
    catLyingImage: {
        width: 360,
        height: 220,
        alignSelf: "flex-end",
        position: "absolute",
        bottom: -90,
        left: -20,
    },
    bottomSheet: {
        flex: 1,
        backgroundColor: colors.background,
        marginTop: -30,
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        overflow: "hidden",
    },
    bottomScrollContent: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 130,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.blue,
        alignSelf: "center",
        marginBottom: 20,
    },
    greetingSection: {
        marginBottom: 24,
    },
    greetingTitle: {
        ...typography.title,
        fontSize: 30,
        color: colors.dark,
    },
    greetingSubtitle: {
        fontSize: 14,
        color: colors.dark,
    },
    badgeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 20,
    },
    pillBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 22,
        backgroundColor: colors.white,
    },
    pillText: {
        fontSize: 12,
        fontWeight: "700",
        color: colors.dark,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: colors.dark,
    },
    seeAllText: {
        fontSize: 13,
        fontWeight: "700",
        color: colors.primary,
    },
    loader: {
        marginVertical: 20,
    },
    emptyContainer: {
        alignItems: "center",
        marginBottom: 12,
    },
    emptyIcon: {
        marginBottom: 8,
    },
    emptyText: {
        color: colors.dark,
        fontSize: 15,
        fontWeight: "700",
    },
    emptySubText: {
        color: colors.dark,
        fontSize: 13,
    },
    taskPressable: {
        marginBottom: 12,
    },
    taskCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    taskLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    taskIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
        backgroundColor: colors.white,
    },
    taskTextWrap: {
        flex: 1,
        paddingRight: 8,
    },
    taskTitle: {
        color: colors.dark,
        fontSize: 15,
        fontWeight: "700",
    },
    taskDesc: {
        color: colors.dark,
        fontSize: 13,
    },
    addTaskButton: {
        marginTop: 16,
    },
});
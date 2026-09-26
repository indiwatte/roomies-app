import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRooms, type MemberProfile } from "@/features/rooms/room-context";
import { getTasksForRoom, updateTaskStatus, type StrapiTask } from "../../api/tasks";
import { typography } from '../../constants/typography';

const SWIPE_THRESHOLD = 75;
const MAX_SWIPE = 85;

type AssigneeDisplay = {
    memberName: string;
    initials: string;
    avatarColor: string;
    avatarUri: string | null;
};

function findAssigneeDisplay(members: MemberProfile[], assignedTo: unknown): AssigneeDisplay | null {
    if (!assignedTo) return null;

    const relation = assignedTo as { name?: string };

    const name = relation.name ?? "";
    const match = members.find(
        (member) => member.memberName.trim().toLowerCase() === name.trim().toLowerCase()
    );

    if (match) return match;

    return {
        memberName: name || "Unassigned",
        initials: name ? name.slice(0, 2).toUpperCase() : "?",
        avatarColor: "#EFE3CF",
        avatarUri: null,
    };
}

function TaskCard({ task, assignee, onCompleted }: {
    task: StrapiTask;
    assignee: AssigneeDisplay | null;
    onCompleted?: (documentId: string | undefined) => void;
}) {
    const [completed, setCompleted] = useState(!!task.completed);

    const swipeProgress = useSharedValue(task.completed ? 1 : 0);
    const checkProgress = useSharedValue(task.completed ? 1 : 0);
    const catTranslateY = useSharedValue(-70);
    const catOpacity = useSharedValue(0);

    const completeTask = () => {
        if (completed) return;

        setCompleted(true);

        if (task.documentId) {
            updateTaskStatus(task.documentId, true).catch((error) => {
                console.error("Fout bij updaten taak:", error);
            });
        }

        onCompleted?.(task.documentId);

        catOpacity.value = withTiming(1, {
            duration: 250,
            easing: Easing.out(Easing.cubic),
        });

        catTranslateY.value = withTiming(0, {
            duration: 500,
            easing: Easing.out(Easing.cubic),
        });

        checkProgress.value = withSpring(1, {
            damping: 12,
            stiffness: 180,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        setTimeout(() => {
            catTranslateY.value = withTiming(-70, {
                duration: 500,
                easing: Easing.in(Easing.cubic),
            });

            catOpacity.value = withTiming(0, {
                duration: 350,
                easing: Easing.in(Easing.cubic),
            });
        }, 4000);
    };

    const gesture = Gesture.Pan()
        .enabled(!completed)
        .activeOffsetX(10)
        .failOffsetY([-20, 20])
        .onUpdate((event) => {
            const progress = Math.min(Math.max(event.translationX, 0) / SWIPE_THRESHOLD, 1);
            swipeProgress.value = progress;
        })
        .onEnd(() => {
            if (swipeProgress.value >= 0.8) {
                swipeProgress.value = withSpring(1, {
                    damping: 18,
                    stiffness: 180,
                });
                runOnJS(completeTask)();
            } else {
                swipeProgress.value = withSpring(0, {
                    damping: 18,
                    stiffness: 180,
                });
            }
        });

    const backgroundAnimatedStyle = useAnimatedStyle(() => {
        return {
            width: interpolate(swipeProgress.value, [0, 1], [0, 110]),
            opacity: interpolate(swipeProgress.value, [0, 0.2, 1], [0, 1, 1]),
        };
    });

    const checkAnimatedStyle = useAnimatedStyle(() => ({
        opacity: checkProgress.value,
        transform: [{ scale: interpolate(checkProgress.value, [0, 1], [0.5, 1]) }],
    }));

    const catAnimatedStyle = useAnimatedStyle(() => ({
        opacity: catOpacity.value,
        transform: [{ translateY: catTranslateY.value }],
    }));

    return (
        <View style={styles.swipeArea}>
            <Animated.View style={[styles.completeBackground, backgroundAnimatedStyle]}>
                <Animated.View style={checkAnimatedStyle}>
                    <Text style={styles.backgroundCheck}>✓</Text>
                </Animated.View>
            </Animated.View>

            <GestureDetector gesture={gesture}>
                <Animated.View style={[styles.card, completed && styles.completedCard]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderText}>
                            <View style={styles.titleRow}>
                                <Text style={[styles.cardTitle, completed && styles.completedTitle]}>
                                    {task.title}
                                </Text>

                                {completed ? (
                                    <Animated.View style={[styles.checkCircle, checkAnimatedStyle]}>
                                        <Text style={styles.checkCircleText}>✓</Text>
                                    </Animated.View>
                                ) : null}
                            </View>

                            <Text style={styles.cardMeta}>
                                {task.dueDate ? `Due: ${String(task.dueDate).slice(0, 10)}` : "No due date"}
                                {task.dueTime ? ` • ${task.dueTime}` : ""}
                            </Text>

                            {task.description ? (
                                <Text style={styles.cardDescription} numberOfLines={2}>
                                    {task.description}
                                </Text>
                            ) : null}
                        </View>

                        {assignee ? (
                            <View style={styles.assigneeWrap}>
                                {assignee.avatarUri ? (
                                    <Image source={{ uri: assignee.avatarUri }} style={styles.assigneeAvatar} />
                                ) : (
                                    <View
                                        style={[
                                            styles.assigneeAvatar,
                                            { backgroundColor: assignee.avatarColor || "#EFE3CF" },
                                        ]}
                                    >
                                        <Text style={styles.assigneeInitials}>{assignee.initials || "?"}</Text>
                                    </View>
                                )}

                                <Text style={styles.assigneeName} numberOfLines={1}>
                                    {assignee.memberName}
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    {!completed ? (
                        <View style={styles.swipeHint}>
                            <Text style={styles.swipeArrow}>→</Text>
                            <Text style={styles.swipeHintText}>Swipe to complete</Text>
                        </View>
                    ) : (
                        <View style={styles.completedMessage}>
                            <Text style={styles.completedMessageText}>Task completed ✓</Text>
                        </View>
                    )}
                </Animated.View>
            </GestureDetector>

            <Animated.View style={[styles.catFeedback, catAnimatedStyle]} pointerEvents="none">
                <View style={styles.speechBubble}>
                    <Text style={styles.speechText}>Keep going!</Text>
                </View>

                <Image
                    source={require("../../../assets/cat-face.png")}
                    style={styles.feedbackCat}
                    resizeMode="contain"
                />
            </Animated.View>
        </View>
    );
}

export default function TasksScreen() {
    const { currentRoom, members, refreshMembers } = useRooms();
    const insets = useSafeAreaInsets();

    const [tasks, setTasks] = useState<StrapiTask[]>([]);
    const [loading, setLoading] = useState(true);

    const roomDocumentId = currentRoom?.documentId;

    // Herlaad taken (en members) elke keer dat dit tabblad in focus komt,
    // zodat nieuwe taken/members van andere apparaten direct zichtbaar zijn.
    useFocusEffect(
        useCallback(() => {
            if (!roomDocumentId) {
                setTasks([]);
                setLoading(false);
                return;
            }

            let canceled = false;

            async function fetchTasks() {
                setLoading(true);
                try {
                    const roomId = roomDocumentId;
                    if (!roomId) return;

                    const roomTasks = await getTasksForRoom(roomId);
                    if (!canceled) setTasks(roomTasks ?? []);
                } catch (err) {
                    console.error("Fout bij ophalen taken:", err);
                } finally {
                    if (!canceled) setLoading(false);
                }
            }

            void fetchTasks();
            void refreshMembers();

            return () => {
                canceled = true;
            };
        }, [roomDocumentId, refreshMembers])
    );

    const handleCompleted = (documentId: string | undefined) => {
        if (!documentId) return;
        setTasks((current) =>
            current.map((task) => (task.documentId === documentId ? { ...task, completed: true } : task))
        );
    };

    if (!currentRoom) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>No current room</Text>
                <Text>currentRoom is null.</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingTop: insets.top + 64, paddingBottom: 140 }}
        >
            <Text style={styles.title}>Tasks for {currentRoom.name}</Text>
            <Text style={styles.subtitle}>Swipe a task to the right to complete it.</Text>

            {loading ? (
                <Text style={styles.subtitle}>Taken laden...</Text>
            ) : tasks.length === 0 ? (
                <Text style={styles.subtitle}>Nog geen taken in deze room. Voeg er eentje toe!</Text>
            ) : (
                tasks.map((task) => (
                    <TaskCard
                        key={task.documentId ?? task.id}
                        task={task}
                        assignee={findAssigneeDisplay(members, task.assignedTo)}
                        onCompleted={handleCompleted}
                    />
                ))
            )}

            <Pressable style={styles.button} onPress={() => router.push("/add-task")}>
                <Text style={styles.buttonText}>Add a task</Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        backgroundColor: "#F8F7F4",
    },
    title: {
        ...typography.title,
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
    swipeArea: {
        position: "relative",
        marginBottom: 16,
    },
    completeBackground: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 110,
        borderRadius: 18,
        backgroundColor: "#DDE8D8",
        alignItems: "center",
        justifyContent: "center",
    },
    backgroundCheck: {
        fontSize: 32,
        fontWeight: "800",
        color: "#496043",
    },
    card: {
        padding: 20,
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E7E2D9",
        overflow: "hidden",
    },
    completedCard: {
        borderColor: "#D5E0D1",
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    cardHeaderText: {
        flex: 1,
        paddingRight: 10,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#222",
        marginBottom: 4,
    },
    completedTitle: {
        color: "#777",
    },
    cardMeta: {
        fontSize: 14,
        color: "#666",
    },
    cardDescription: {
        fontSize: 13,
        color: "#8A8176",
        marginTop: 6,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#526B4C",
        alignItems: "center",
        justifyContent: "center",
    },
    checkCircleText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
    },
    assigneeWrap: {
        alignItems: "center",
    },
    assigneeAvatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#EFE3CF",
    },
    assigneeInitials: {
        fontSize: 14,
        fontWeight: "700",
        color: "#3A3128",
    },
    assigneeName: {
        fontSize: 11,
        marginTop: 6,
        color: "#756A5B",
        fontWeight: "600",
    },
    swipeHint: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 14,
        paddingVertical: 4,
    },
    swipeArrow: {
        fontSize: 20,
        color: "#8A8176",
        fontWeight: "600",
    },
    swipeHintText: {
        fontSize: 13,
        color: "#8A8176",
    },
    completedMessage: {
        marginBottom: 14,
        paddingVertical: 4,
    },
    completedMessageText: {
        fontSize: 13,
        color: "#526B4C",
        fontWeight: "600",
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
    catFeedback: {
        position: "absolute",
        left: -10,
        top: -50,
        alignItems: "center",
        zIndex: 10,
    },
    feedbackCat: {
        width: 130,
        height: 130,
    },
    speechBubble: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        marginBottom: -5,
        borderWidth: 1,
        borderColor: "#E7E2D9",
    },
    speechText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#3C222D",
    },
});

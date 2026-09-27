import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    Easing,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "@/components/Button";
import Card from "@/components/Card";
import ScreenHeader from "@/components/ScreenHeader";
import { useRooms, type MemberProfile } from "@/features/rooms/room-store";
import { getTasksForRoom, updateTaskStatus, type StrapiTask } from "../../api/tasks";
import { colors } from "../../constants/colors";

const SWIPE_THRESHOLD = 75;

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
        avatarColor: colors.blue,
        avatarUri: null,
    };
}

function TaskCard({
    task,
    assignee,
    onCompleted,
}: {
    task: StrapiTask;
    assignee: AssigneeDisplay | null;
    onCompleted?: (documentId: string | undefined) => void;
}) {
    const [completed, setCompleted] = useState(Boolean(task.completed));

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

    const backgroundAnimatedStyle = useAnimatedStyle(() => ({
        width: interpolate(swipeProgress.value, [0, 1], [0, 110]),
        opacity: interpolate(swipeProgress.value, [0, 0.2, 1], [0, 1, 1]),
    }));

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
                <Animated.View>
                    <Card style={[styles.card, completed && styles.completedCard]}>
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
                                                { backgroundColor: assignee.avatarColor || colors.blue },
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
                    </Card>
                </Animated.View>
            </GestureDetector>

            <Animated.View style={[styles.catFeedback, catAnimatedStyle]} pointerEvents="none">
                <Card style={styles.speechBubble}>
                    <Text style={styles.speechText}>Keep going!</Text>
                </Card>
                <Image
                    source={require("../../../assets/cat-home.png")}
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
    const roomDocumentId = currentRoom?.documentId;

    const [tasks, setTasks] = useState<StrapiTask[]>([]);
    const [loading, setLoading] = useState(true);

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
                    if (!roomId) {
                        if (!canceled) setTasks([]);
                        return;
                    }

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
                <Text style={styles.subtitle}>currentRoom is null.</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingTop: insets.top + 64, paddingBottom: 140 }}
        >
            <ScreenHeader
                title={`Tasks for ${currentRoom.name}`}
                subtitle="Swipe a task to the right to complete it."
            />

            {loading ? (
                <Text style={styles.subtitle}>Taken laden...</Text>
            ) : tasks.length === 0 ? (
                <Card>
                    <Text style={styles.subtitle}>Nog geen taken in deze room. Voeg er eentje toe!</Text>
                </Card>
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

            <Button title="Add a task" variant="dark" onPress={() => router.push("/add-task")} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        backgroundColor: colors.background,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        color: colors.dark,
    },
    subtitle: {
        fontSize: 16,
        color: colors.dark,
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
        backgroundColor: colors.green,
        alignItems: "center",
        justifyContent: "center",
    },
    backgroundCheck: {
        fontSize: 32,
        fontWeight: "800",
        color: colors.dark,
    },
    card: {
        overflow: "hidden",
    },
    completedCard: {
        borderColor: colors.green,
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
        color: colors.dark,
        marginBottom: 4,
    },
    completedTitle: {
        color: colors.dark,
    },
    cardMeta: {
        fontSize: 14,
        color: colors.dark,
    },
    cardDescription: {
        fontSize: 13,
        color: colors.dark,
        marginTop: 8,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.green,
        alignItems: "center",
        justifyContent: "center",
    },
    checkCircleText: {
        color: colors.dark,
        fontWeight: "800",
    },
    assigneeWrap: {
        alignItems: "center",
        maxWidth: 72,
    },
    assigneeAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
        backgroundColor: colors.blue,
    },
    assigneeInitials: {
        color: colors.dark,
        fontWeight: "700",
        fontSize: 14,
    },
    assigneeName: {
        fontSize: 11,
        color: colors.dark,
    },
    swipeHint: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    swipeArrow: {
        color: colors.primary,
        fontSize: 16,
    },
    swipeHintText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: "600",
    },
    completedMessage: {
        marginTop: 4,
    },
    completedMessageText: {
        color: colors.green,
        fontSize: 13,
        fontWeight: "700",
    },
    catFeedback: {
        position: "absolute",
        right: 30,
        top: -20,
        alignItems: "flex-start",
    },
    speechBubble: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginBottom: 4,
    },
    speechText: {
        color: colors.dark,
        fontWeight: "700",
        fontSize: 12,
    },
    feedbackCat: {
        width: 150,
        height: 150,
    },
});
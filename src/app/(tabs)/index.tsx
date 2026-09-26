import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator, TextInput, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useRooms } from "@/features/rooms/room-context";
import { colors } from "../../constants/colors";
import { getTasksForRoom, type StrapiTask } from "../../api/tasks";
import Button from "@/components/Button";
import { typography } from '../../constants/typography';

export default function HomeScreen() {
  const { currentRoom, members, refreshMembers } = useRooms();
  const currentUser = members.find((member) => member.id === "you") ?? members[0];
  const insets = useSafeAreaInsets();
  const roomDocumentId = currentRoom?.documentId;

  const [roomTasks, setRoomTasks] = useState<StrapiTask[]>([]);
  const [loading, setLoading] = useState(true);

  // State voor de ingevoerde naam en of de modal is weggedrukt
  const [enteredName, setEnteredName] = useState("");
  const [isNameDismissed, setIsNameDismissed] = useState(false);

  // 1. Bereken direct of de modal getoond moet worden (Derived State)
  const needsName = !currentUser || currentUser.memberName === "You" || !currentUser.memberName;
  const showNameModal = needsName && !isNameDismissed;

  // 2. Wanneer de gebruiker op opslaan klikt
  const handleSaveName = () => {
    if (!enteredName.trim()) return;
    setIsNameDismissed(true);
  };

  // 3. Bepaal direct welke naam we tonen in de begroeting
  const displayName = currentUser?.memberName && currentUser.memberName !== "You"
    ? currentUser.memberName
    : (enteredName || "You");

  // Alleen taken die aan jou zijn toegewezen (voor de "Your Tasks" sectie)
  const myNormalizedName = displayName !== "You" ? displayName.trim().toLowerCase() : "";
  const tasks = myNormalizedName
    ? roomTasks.filter((task) => {
      const relation = task.assignedTo as { name?: string } | null | undefined;
      return (relation?.name ?? "").trim().toLowerCase() === myNormalizedName;
    })
    : [];

  // Haal de echte taken op voor deze kamer uit Strapi, telkens als dit scherm
  // in focus komt zodat nieuwe taken/members van anderen direct zichtbaar zijn.
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
          const data = await getTasksForRoom(roomDocumentId!);
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
      {/* 1. POP-UP MODAL VOOR NAAM INVOEREN */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Hello fella, what's your name?</Text>
            <Text style={styles.modalSubText}>
              This is to make sure your homies can recognize you in the shared room
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Bijv. Indi of Thomas..."
              placeholderTextColor="#A8A29E"
              value={enteredName}
              onChangeText={setEnteredName}
              autoFocus
            />

            <Button
              title="Aan de slag!"
              variant="primary"
              onPress={handleSaveName}
              disabled={!enteredName.trim()}
            />
          </View>
        </View>
      </Modal>

      {/* 2. BOVENSTE HEADER SECTIE */}
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

      {/* 3. ONDERSTE WITTE SECTIE */}
      <ScrollView
        style={styles.bottomSheet}
        contentContainerStyle={styles.bottomScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sheetHandle} />

        {/* Persoonlijke begroeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>
            Hi, {displayName}!
          </Text>
          <Text style={styles.greetingSubtitle}>
            What would you like to do in your space today?
          </Text>
        </View>

        {/* Room info */}
        <View style={styles.headerTopContent}>
          <View style={styles.badgeRow}>
            <View style={styles.pillBadge}>
              <Ionicons name="home" size={12} color={colors.dark} />
              <Text style={styles.pillText}>{currentRoom.name}</Text>
            </View>
            <View style={styles.pillBadge}>
              <Ionicons name="key" size={12} color={colors.dark} />
              <Text style={styles.pillText}>{currentRoom.code}</Text>
            </View>
            <View style={styles.pillBadge}>
              <Ionicons name="people" size={12} color={colors.primary} />
              <Text style={styles.pillText}>{members.length} members</Text>
            </View>
          </View>
        </View>

        {/* Taken Sectie */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Tasks</Text>
          <Pressable onPress={() => router.push("/tasks")}>
            <Text style={styles.seeAllText}>View all ({tasks.length})</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : tasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={32} color={colors.green} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyText}>Geen openstaande taken in deze room! 🎉</Text>
            <Text style={styles.emptySubText}>Tijd om te ontspannen.</Text>
          </View>
        ) : (
          tasks.map((task, index) => {
            const cardColors = [colors.white, colors.blue, "#FCE8E2"];
            const bgCardColor = cardColors[index % cardColors.length];

            return (
              <Pressable
                key={task.documentId ?? task.id}
                style={[styles.taskCard, { backgroundColor: bgCardColor }]}
                onPress={() => router.push("/tasks")}
              >
                <View style={styles.taskLeft}>
                  <View style={styles.taskRadioOuter} />
                  <View style={[styles.taskIconBox, { backgroundColor: colors.white }]}>
                    <Ionicons name="checkbox-outline" size={16} color={colors.dark} />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                    <Text style={styles.taskDesc} numberOfLines={1}>
                      {task.description || (task.dueDate ? `Due: ${String(task.dueDate).slice(0, 10)}` : "Geen omschrijving")}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#8A8176" />
              </Pressable>
            );
          })
        )}

        <Button
          title="Add a new task"
          variant="dark"
          icon={<Ionicons name="add" size={18} color={colors.white} />}
          onPress={() => router.push("/add-task")}
          style={{ marginTop: 16 }}
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
    backgroundColor: "rgba(60, 34, 45, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    shadowColor: "#3C222D",
    shadowOpacity: 0.2,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  modalTitle: {
    ...typography.title,
    fontSize: 22,
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubText: {
    fontSize: 14,
    color: "#756A5B",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: "#EFEBE4",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: colors.dark,
    marginBottom: 20,
  },
  headerBackground: {
    height: 280,
    width: "100%",
    justifyContent: "space-between",
    position: "relative",
  },
  headerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(60, 34, 45, 0.15)",
  },
  headerTopContent: {
    marginBottom: 20,
    zIndex: 10,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pillBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 253, 249, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.dark,
  },
  catLyingImage: {
    width: 600,
    height: 300,
    alignSelf: "flex-end",
    position: "absolute",
    bottom: -150,
    left: -40,
    zIndex: 10,
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: colors.background,
    marginTop: -30,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: "hidden",
    shadowColor: "#3C222D",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -5 },
    elevation: 10,
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
    backgroundColor: "#D5CEC3",
    alignSelf: "center",
    marginBottom: 20,
  },
  greetingSection: {
    marginBottom: 28,
  },
  greetingTitle: {
    ...typography.title,
    fontSize: 30,
    fontWeight: "800",
    color: colors.dark,
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: "#756A5B",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
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
  taskCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EFEBE4",
  },
  taskLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  taskRadioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D5CEC3",
  },
  taskIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: 2,
  },
  taskDesc: {
    fontSize: 12,
    color: "#8A8176",
  },
  emptyContainer: {
    padding: 28,
    backgroundColor: colors.white,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EFEBE4",
  },
  emptyText: {
    fontSize: 15,
    color: colors.dark,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 13,
    color: "#8A8176",
    marginTop: 2,
  },
});
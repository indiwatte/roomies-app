import { Redirect, router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "@/components/Button";
import Card from "@/components/Card";
import ScreenHeader from "@/components/ScreenHeader";
import { colors } from "@/constants/colors";
import { useAuth } from "@/features/auth/auth-store";
import { useRooms } from "@/features/rooms/room-store";

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const { currentRoom } = useRooms();
    const { user, signOut } = useAuth();

    if (!currentRoom) {
        return <Redirect href="/" />;
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
            <ScreenHeader
                title="Your Account"
                subtitle={`Signed in for room ${currentRoom.name}`}
            />

            <Card>
                <Text style={styles.label}>Username</Text>
                <Text style={styles.value}>{user?.username ?? "Unknown"}</Text>

                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{user?.email ?? "No email"}</Text>

                <Button
                    title="Log out"
                    variant="outline"
                    onPress={() => {
                        signOut();
                        useRooms.setState({
                            rooms: {},
                            currentRoomCode: null,
                            currentRoom: undefined,
                            members: [],
                        });
                        router.replace("/onboarding");
                    }}
                    style={styles.logoutButton}
                />
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        paddingTop: 20,
        backgroundColor: colors.screenBg,
    },
    label: {
        fontSize: 12,
        fontWeight: "700",
        color: colors.textMuted,
        textTransform: "uppercase",
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        color: colors.dark,
        marginBottom: 16,
    },
    logoutButton: {
        marginTop: 8,
    },
});

import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "@/components/Button";
import Card from "@/components/Card";
import ScreenHeader from "@/components/ScreenHeader";
import { updateMemberAvatarInStrapi } from "@/api/members";
import { type MemberProfile, useRooms } from "@/features/rooms/room-store";
import { colors } from "../../constants/colors";

function MemberAvatar({ member }: { member: MemberProfile }) {
    if (member.avatarUri) {
        return <Image source={{ uri: member.avatarUri }} style={styles.memberAvatar} />;
    }

    return (
        <View style={[styles.memberAvatar, { backgroundColor: member.avatarColor || colors.blue }]}>
            <Text style={styles.memberInitials}>{member.initials || "?"}</Text>
        </View>
    );
}

export default function MembersScreen() {
    const { currentRoom, members, updateMemberAvatar, refreshMembers } = useRooms();
    const insets = useSafeAreaInsets();
    const [processingMemberId, setProcessingMemberId] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            void refreshMembers();
        }, [refreshMembers])
    );

    const ensureCameraPermission = async () => {
        const current = await ImagePicker.getCameraPermissionsAsync();
        if (current.granted) return true;

        const requested = await ImagePicker.requestCameraPermissionsAsync();
        if (!requested.granted) {
            Alert.alert("Permission required", "Camera access is required.");
            return false;
        }

        return true;
    };

    const ensureLibraryPermission = async () => {
        const current = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (current.granted) return true;

        const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!requested.granted) {
            Alert.alert("Permission required", "Photo library access is required.");
            return false;
        }

        return true;
    };

    const processAndSaveAvatar = async (member: MemberProfile, sourceUri: string) => {
        const result = await ImageManipulator.manipulateAsync(
            sourceUri,
            [{ resize: { width: 512, height: 512 } }],
            {
                format: ImageManipulator.SaveFormat.PNG,
                compress: 1,
            }
        );

        if (member.documentId) {
            await updateMemberAvatarInStrapi(member.documentId, result.uri);
        }

        updateMemberAvatar(member.id, result.uri);
        void refreshMembers();
    };

    const pickFromLibrary = async (member: MemberProfile) => {
        const hasPermission = await ensureLibraryPermission();
        if (!hasPermission) {
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (result.canceled || !result.assets[0]?.uri) return;
        await processAndSaveAvatar(member, result.assets[0].uri);
    };

    const takePhoto = async (member: MemberProfile) => {
        const hasPermission = await ensureCameraPermission();
        if (!hasPermission) {
            return;
        }

        // On first permission grant, a short delay prevents native camera from hanging.
        await new Promise((resolve) => setTimeout(resolve, 120));

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (result.canceled || !result.assets[0]?.uri) return;
        await processAndSaveAvatar(member, result.assets[0].uri);
    };

    const onPickPhoto = (member: MemberProfile) => {
        Alert.alert("Add photo", `Choose a photo for ${member.memberName}`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Camera",
                onPress: () => {
                    setProcessingMemberId(member.id);
                    void takePhoto(member).finally(() => setProcessingMemberId(null));
                },
            },
            {
                text: "Gallery",
                onPress: () => {
                    setProcessingMemberId(member.id);
                    void pickFromLibrary(member).finally(() => setProcessingMemberId(null));
                },
            },
        ]);
    };

    if (!currentRoom) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>No current room</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <Image source={require("../../../assets/window.png")} style={styles.windowImage} resizeMode="cover" />
                <View style={styles.headerOverlay} />
                <ScreenHeader
                    title={`Homies in ${currentRoom.name}`}
                    subtitle="Meet your crew through the window and keep profiles fresh."
                    style={styles.headerTextBlock}
                />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {members.length === 0 ? (
                    <Card>
                        <Text style={styles.emptyTitle}>No members yet</Text>
                        <Text style={styles.emptyText}>Join this room from another device to see your homies.</Text>
                    </Card>
                ) : (
                    members.map((member) => {
                        const busy = processingMemberId === member.id;

                        return (
                            <Card key={member.id} style={styles.memberCard}>
                                <ImageBackground
                                    source={require("../../../assets/window.png")}
                                    style={styles.memberCardBg}
                                    imageStyle={styles.memberCardBgImage}
                                    resizeMode="cover"
                                >
                                    <View style={styles.memberCardOverlay}>
                                        <View style={styles.memberTopRow}>
                                            <MemberAvatar member={member} />

                                            <View style={styles.memberInfo}>
                                                <Text style={styles.memberName}>{member.memberName}</Text>
                                                <Text style={styles.memberRole}>{member.role}</Text>
                                            </View>

                                            <Ionicons name="people" size={20} color={colors.primary} />
                                        </View>

                                        {busy ? (
                                            <ActivityIndicator size="small" color={colors.primary} style={styles.busyLoader} />
                                        ) : (
                                            <Button
                                                title="Add photo"
                                                variant="outline"
                                                onPress={() => onPickPhoto(member)}
                                                icon={<Ionicons name="camera" size={16} color={colors.dark} />}
                                            />
                                        )}
                                    </View>
                                </ImageBackground>
                            </Card>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        color: colors.dark,
    },
    header: {
        height: 220,
        paddingHorizontal: 24,
        justifyContent: "flex-end",
        paddingBottom: 20,
        overflow: "hidden",
    },
    windowImage: {
        ...StyleSheet.absoluteFill,
    },
    headerOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: colors.background,
        opacity: 0.55,
    },
    headerTextBlock: {
        marginBottom: 0,
    },
    content: {
        padding: 24,
        paddingBottom: 130,
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.dark,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: colors.dark,
    },
    memberCard: {
        padding: 0,
        overflow: "hidden",
        backgroundColor: colors.white,
        transform: [{ rotate: "-0.6deg" }],
    },
    memberCardBg: {
        width: "100%",
    },
    memberCardBgImage: {
        opacity: 0.9,
    },
    memberCardOverlay: {
        padding: 16,
        gap: 12,
        backgroundColor: "rgba(255, 253, 249, 0.48)",
    },
    memberTopRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    memberAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
        backgroundColor: colors.blue,
    },
    memberInitials: {
        fontSize: 16,
        fontWeight: "800",
        color: colors.dark,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 17,
        fontWeight: "700",
        color: colors.dark,
    },
    memberRole: {
        fontSize: 13,
        color: colors.dark,
        marginTop: 2,
    },
    busyLoader: {
        marginVertical: 8,
    },
});
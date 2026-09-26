import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    ImageBackground,
    ScrollView,
    PanResponder,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { type MemberProfile, useRooms } from "@/features/rooms/room-context";
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

const FUN_QUOTES = [
    "Hey, what are you doing???",
    "Easy there, I just cleaned this room!",
    "Wheee... room tour time!",
    "Can we get pizza after chores?",
    "I am not late, I am energy-saving.",
];

function DraggableRoomTile({
    tile,
    isProcessing,
    onPickPhoto,
}: {
    tile: MemberProfile;
    isProcessing: boolean;
    onPickPhoto: (tile: MemberProfile) => void;
}) {
    const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const scale = useRef(new Animated.Value(1)).current;
    const [isDragging, setIsDragging] = useState(false);
    const [quote, setQuote] = useState<string | null>(null);
    const quoteTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showQuote = () => {
        const randomQuote = FUN_QUOTES[Math.floor(Math.random() * FUN_QUOTES.length)];
        setQuote(randomQuote);

        if (quoteTimeout.current) {
            clearTimeout(quoteTimeout.current);
        }
        quoteTimeout.current = setTimeout(() => {
            setQuote(null);
            quoteTimeout.current = null;
        }, 1500);
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                setIsDragging(true);
                showQuote();
                Animated.spring(scale, {
                    toValue: 1.08,
                    useNativeDriver: true,
                    speed: 18,
                    bounciness: 8,
                }).start();
            },
            onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
                useNativeDriver: false,
            }),
            onPanResponderRelease: () => {
                setIsDragging(false);
                Animated.parallel([
                    Animated.spring(pan, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: true,
                        speed: 18,
                        bounciness: 20,
                    }),
                    Animated.spring(scale, {
                        toValue: 1,
                        useNativeDriver: true,
                        speed: 18,
                        bounciness: 20,
                    }),
                ]).start();
            },
            onPanResponderTerminate: () => {
                setIsDragging(false);
                Animated.parallel([
                    Animated.spring(pan, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: true,
                        speed: 18,
                        bounciness: 10,
                    }),
                    Animated.spring(scale, {
                        toValue: 1,
                        useNativeDriver: true,
                        speed: 18,
                        bounciness: 6,
                    }),
                ]).start();
            },
        })
    ).current;

    return (
        <View style={styles.tileCard}>
            <View style={styles.tileHeader}>
                <Text style={styles.tileRoomName}>{tile.roomName}</Text>
            </View>

            <ImageBackground
                source={require("../../../assets/window.png")}
                style={styles.tileCanvas}
                imageStyle={styles.tileCanvasImage}
                resizeMode="cover"
            >
                <View style={styles.tileCanvasTint} />

                <Animated.View
                    {...panResponder.panHandlers}
                    style={[
                        styles.avatar,
                        {
                            backgroundColor: tile.avatarColor,
                            zIndex: isDragging ? 2 : 1,
                            transform: [
                                { translateX: pan.x },
                                { translateY: pan.y },
                                { scale },
                            ],
                        },
                    ]}
                >
                    {quote ? (
                        <View style={styles.quoteBubble}>
                            <Text style={styles.quoteText}>{quote}</Text>
                        </View>
                    ) : null}

                    {tile.avatarUri ? (
                        <Image source={{ uri: tile.avatarUri }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarInitials}>{tile.initials}</Text>
                    )}
                </Animated.View>
            </ImageBackground>

            <Text style={styles.memberName}>{tile.memberName}</Text>
            <Text style={styles.memberMeta}>{tile.role}</Text>

            <Pressable
                style={styles.photoButton}
                onPress={() => onPickPhoto(tile)}
                disabled={isProcessing}
            >
                {isProcessing ? (
                    <ActivityIndicator size="small" color="#6C5C49" />
                ) : (
                    <Text style={styles.photoButtonText}>
                        {tile.avatarUri ? "Change photo" : "Add photo"}
                    </Text>
                )}
            </Pressable>
        </View>
    );
}

export default function MembersScreen() {
    const { currentRoom, members, updateMemberAvatar, refreshMembers } = useRooms();
    const [processingMemberId, setProcessingMemberId] = useState<string | null>(null);
    const insets = useSafeAreaInsets();

    // Herlaad de members elke keer dat dit tabblad in focus komt, zodat net
    // toegevoegde homies zichtbaar zijn zonder de app te hoeven herladen.
    useFocusEffect(
        useCallback(() => {
            void refreshMembers();
        }, [refreshMembers])
    );

    const processAndSaveAvatar = async (memberId: string, sourceUri: string) => {
        const result = await ImageManipulator.manipulateAsync(
            sourceUri,
            [{ resize: { width: 512, height: 512 } }],
            {
                format: ImageManipulator.SaveFormat.PNG,
                compress: 1,
            }
        );

        updateMemberAvatar(memberId, result.uri);
    };

    const pickFromLibrary = async (memberId: string) => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Permission required", "Photo library access is required.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (result.canceled || !result.assets[0]?.uri) {
            return;
        }

        await processAndSaveAvatar(memberId, result.assets[0].uri);
    };

    const takePhoto = async (memberId: string) => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Permission required", "Camera access is required.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (result.canceled || !result.assets[0]?.uri) {
            return;
        }

        await processAndSaveAvatar(memberId, result.assets[0].uri);
    };

    const runPhotoFlow = (memberId: string, action: () => Promise<void>) => {
        if (processingMemberId) {
            return;
        }

        setProcessingMemberId(memberId);
        void action()
            .catch(() => {
                Alert.alert("Photo error", "Could not save this photo. Try again.");
            })
            .finally(() => {
                setProcessingMemberId((current) =>
                    current === memberId ? null : current
                );
            });
    };

    const openPhotoOptions = (tile: MemberProfile) => {
        Alert.alert("Add roommate photo", `Choose a photo for ${tile.memberName}.`, [
            {
                text: "Take photo",
                onPress: () => runPhotoFlow(tile.id, () => takePhoto(tile.id)),
            },
            {
                text: "Photo library",
                onPress: () => runPhotoFlow(tile.id, () => pickFromLibrary(tile.id)),
            },
            { text: "Cancel", style: "cancel" },
        ]);
    };

    if (!currentRoom) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={[styles.topBar, { paddingTop: insets.top + 64 }]}>
                <View style={styles.topBarText}>
                    <Text style={styles.title}>Homies </Text>
                    <Text style={styles.subtitle}>
                        Here you have an overview of your roommates in {currentRoom.name}
                    </Text>
                </View>

                <Pressable
                    style={styles.addButton}
                    onPress={() =>
                        Alert.alert("Invite a roommate", `Share room code ${currentRoom.code}`)
                    }
                >
                    <Ionicons name="add" size={22} color={colors.dark} />
                </Pressable>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.floorPlan}>
                    {members.map((tile) => (
                        <DraggableRoomTile
                            key={tile.id}
                            tile={tile}
                            isProcessing={processingMemberId === tile.id}
                            onPickPhoto={openPhotoOptions}
                        />
                    ))}
                </View>

                <Pressable style={styles.inviteCard}>
                    <Text style={styles.inviteTitle}>Invite a roommate</Text>
                    <Text style={styles.inviteText}>Share room code {currentRoom.code}</Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        backgroundColor: colors.blue,
    },
    topBar: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 18,
    },
    topBarText: {
        flex: 1,
        paddingRight: 12,
    },
    addButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.dark + "22",
        shadowColor: "#C78CB0",
        shadowOpacity: 0.14,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    scrollContent: {
        paddingBottom: 130,
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
    floorPlan: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 18,
        gap: 12,
    },
    tileCard: {
        width: "48%",
        borderRadius: 18,
        padding: 8,

    },
    tileHeader: {
        marginBottom: 8,
        alignItems: "center",
    },
    tileRoomName: {
        fontSize: 12,
        fontWeight: "700",
        color: "#7F725F",
        letterSpacing: 0.4,
        textTransform: "uppercase",
    },
    tileCanvas: {
        aspectRatio: 1,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
        overflow: "visible",
    },
    tileCanvasImage: {
        transform: [{ scale: 1.2 }],
    },
    tileCanvasTint: {
        ...StyleSheet.absoluteFill,
        borderRadius: 16,

    },
    avatar: {
        width: 102,
        height: 102,
        borderRadius: 51,
        borderWidth: 2,
        borderColor: "#F6EFE3",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#C9BDAA",
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    avatarInitials: {
        fontSize: 18,
        fontWeight: "700",
        color: "#3A3128",
    },
    avatarImage: {
        width: "100%",
        height: "100%",
        borderRadius: 51,
    },
    quoteBubble: {
        position: "absolute",
        bottom: "112%",
        backgroundColor: "#FFFDF8",
        borderWidth: 1,
        borderColor: "#EADFCC",
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 6,
        maxWidth: 160,
        shadowColor: "#AA9C88",
        shadowOpacity: 0.22,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    quoteText: {
        fontSize: 12,
        color: "#4A3F32",
        fontWeight: "600",
        textAlign: "center",
    },
    memberName: {
        fontSize: 15,
        fontWeight: "700",
        color: "#222",
        textAlign: "center",
        marginBottom: 2,
    },
    memberMeta: {
        fontSize: 12,
        color: "#70665A",
        textAlign: "center",
    },
    photoButton: {
        marginTop: 10,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E6DCCB",
        backgroundColor: "#FFF8EE",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 34,
    },
    photoButtonText: {
        color: "#6C5C49",
        fontSize: 13,
        fontWeight: "600",
    },
    inviteCard: {
        padding: 20,
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E7DCC9",
    },
    inviteTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#222",
        marginBottom: 4,
    },
    inviteText: {
        fontSize: 14,
        color: "#666",
    },
});
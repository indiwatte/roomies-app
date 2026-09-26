import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";

import { generateRoomCode } from "@/features/rooms/generate-room-code";
import { createRoomInStrapi } from "../../api/rooms";
import { getMembersForRoom, createMemberInStrapi } from "../../api/members"; // Importeer member API
import { API_URL } from "../../api/config";

export type Room = {
    id?: number;
    documentId?: string;
    code: string;
    name: string;
    createdAt: number;
};

export type MemberProfile = {
    id: string;
    documentId?: string;
    roomName?: string;
    memberName: string;
    role: string;
    initials: string;
    avatarColor: string;
    avatarUri: string | null;
};

type RoomContextValue = {
    createRoom: (name: string) => Promise<string>;
    joinRoom: (code: string) => Promise<boolean>;
    getRoom: (code: string) => Room | undefined;
    setCurrentRoom: (code: string) => boolean;
    currentRoom: Room | undefined;
    members: MemberProfile[];
    setMyProfile: (name: string, color: string) => Promise<void>;
    updateMemberAvatar: (memberId: string, avatarUri: string) => void;
    refreshMembers: () => Promise<void>;
};

const RoomContext = createContext<RoomContextValue | null>(null);

export function RoomProvider({ children }: PropsWithChildren) {
    const [rooms, setRooms] = useState<Record<string, Room>>({});
    const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null);
    const [members, setMembers] = useState<MemberProfile[]>([]);

    const loadMembersForCurrentRoom = useCallback(async (roomDocId: string) => {
        const strapiMembers = await getMembersForRoom(roomDocId);
        const mapped = strapiMembers.map((m: any) => ({
            id: String(m.id),
            documentId: m.documentId,
            roomName: m.room?.name,
            memberName: m.name,
            role: m.role || "Member",
            initials: m.name ? m.name.slice(0, 2).toUpperCase() : "ME",
            avatarColor: "#F6CFA3",
            avatarUri: null,
        }));
        setMembers(mapped);
    }, []);

    const createRoom = useCallback(async (name: string) => {
        const code = generateRoomCode();

        const strapiResponse = await createRoomInStrapi({
            name: name,
            code: code,
        });

        const newRoom: Room = {
            id: strapiResponse?.id,
            documentId: strapiResponse?.documentId,
            code,
            name,
            createdAt: Date.now(),
        };

        setRooms((current) => ({
            ...current,
            [code]: newRoom,
        }));
        setCurrentRoomCode(code);
        setMembers([]); // Leeg beginnen voor een nieuwe room
        return code;
    }, []);

    const joinRoom = useCallback(
        async (code: string) => {
            const normalizedCode = code.trim().toUpperCase();

            if (rooms[normalizedCode]) {
                setCurrentRoomCode(normalizedCode);
                await loadMembersForCurrentRoom(rooms[normalizedCode].documentId!);
                return true;
            }

            try {
                const response = await fetch(
                    `${API_URL}/rooms?filters[code][$eq]=${encodeURIComponent(normalizedCode)}`
                );
                const data = await response.json();

                if (data.data && data.data.length > 0) {
                    const strapiRoom = data.data[0];
                    const roomObj: Room = {
                        id: strapiRoom.id,
                        documentId: strapiRoom.documentId,
                        code: strapiRoom.code,
                        name: strapiRoom.name,
                        createdAt: Date.now(),
                    };

                    setRooms((current) => ({
                        ...current,
                        [normalizedCode]: roomObj,
                    }));
                    setCurrentRoomCode(normalizedCode);

                    // Laad direct de members die bij deze kamer horen uit Strapi!
                    await loadMembersForCurrentRoom(strapiRoom.documentId);
                    return true;
                }
            } catch (error) {
                console.error("Fout bij opzoeken room in Strapi:", error);
            }

            return false;
        },
        [rooms, loadMembersForCurrentRoom]
    );

    const getRoom = useCallback(
        (code: string) => {
            const normalizedCode = code.trim().toUpperCase();
            return rooms[normalizedCode];
        },
        [rooms]
    );

    const setCurrentRoom = useCallback(
        (code: string) => {
            const normalizedCode = code.trim().toUpperCase();
            if (!rooms[normalizedCode]) {
                return false;
            }

            setCurrentRoomCode(normalizedCode);
            loadMembersForCurrentRoom(rooms[normalizedCode].documentId!);
            return true;
        },
        [rooms, loadMembersForCurrentRoom]
    );

    const currentRoom = currentRoomCode ? rooms[currentRoomCode] : undefined;

    const setMyProfile = useCallback(async (name: string, color: string) => {
        const initials = name ? name.slice(0, 2).toUpperCase() : "ME";

        if (currentRoom?.documentId) {
            await createMemberInStrapi({
                name: name,

                room: currentRoom.documentId,
            });
        }

        setMembers((current) => {
            const existing = current.find((m) => m.id === "you");
            if (existing) {
                return current.map((m) =>
                    m.id === "you" ? { ...m, memberName: name, initials, avatarColor: color } : m
                );
            } else {
                return [
                    {
                        id: "you",
                        memberName: name,
                        role: "Owner",
                        initials,
                        avatarColor: color || "#F6CFA3",
                        avatarUri: null,
                    },
                    ...current,
                ];
            }
        });
    }, [currentRoom]);

    const updateMemberAvatar = useCallback((memberId: string, avatarUri: string) => {
        setMembers((current) =>
            current.map((member) =>
                member.id === memberId ? { ...member, avatarUri } : member
            )
        );
    }, []);

    const refreshMembers = useCallback(async () => {
        if (!currentRoom?.documentId) return;
        await loadMembersForCurrentRoom(currentRoom.documentId);
    }, [currentRoom, loadMembersForCurrentRoom]);

    const value = useMemo(
        () => ({
            createRoom,
            joinRoom,
            getRoom,
            setCurrentRoom,
            currentRoom,
            members,
            setMyProfile,
            updateMemberAvatar,
            refreshMembers,
        }),
        [
            currentRoomCode,
            members,
            refreshMembers,
        ]
    );

    return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRooms() {
    const context = useContext(RoomContext);
    if (!context) {
        throw new Error("useRooms must be used within a RoomProvider");
    }
    return context;
}
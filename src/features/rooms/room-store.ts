import { create } from "zustand";

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

type RoomState = {
    rooms: Record<string, Room>;
    currentRoomCode: string | null;
    currentRoom: Room | undefined;
    members: MemberProfile[];
    createRoom: (name: string) => Promise<string>;
    joinRoom: (code: string) => Promise<boolean>;
    getRoom: (code: string) => Room | undefined;
    setCurrentRoom: (code: string) => boolean;
    setMyProfile: (name: string, color: string) => Promise<void>;
    updateMemberAvatar: (memberId: string, avatarUri: string) => void;
    refreshMembers: () => Promise<void>;
};

export const useRooms = create<RoomState>((set, get) => {
    // Interne helper (geen deel van de publieke store) die de members voor
    // een room ophaalt bij Strapi en de store bijwerkt.
    const loadMembersForCurrentRoom = async (roomDocId: string) => {
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
        set({ members: mapped });
    };

    return {
        rooms: {},
        currentRoomCode: null,
        currentRoom: undefined,
        members: [],

        createRoom: async (name: string) => {
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

            set((state) => ({
                rooms: { ...state.rooms, [code]: newRoom },
                currentRoomCode: code,
                currentRoom: newRoom,
                members: [], // Leeg beginnen voor een nieuwe room
            }));

            return code;
        },

        joinRoom: async (code: string) => {
            const normalizedCode = code.trim().toUpperCase();
            const { rooms } = get();

            if (rooms[normalizedCode]) {
                set({ currentRoomCode: normalizedCode, currentRoom: rooms[normalizedCode] });
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

                    set((state) => ({
                        rooms: { ...state.rooms, [normalizedCode]: roomObj },
                        currentRoomCode: normalizedCode,
                        currentRoom: roomObj,
                    }));

                    // Laad direct de members die bij deze kamer horen uit Strapi!
                    await loadMembersForCurrentRoom(strapiRoom.documentId);
                    return true;
                }
            } catch (error) {
                console.error("Fout bij opzoeken room in Strapi:", error);
            }

            return false;
        },

        getRoom: (code: string) => {
            const normalizedCode = code.trim().toUpperCase();
            return get().rooms[normalizedCode];
        },

        setCurrentRoom: (code: string) => {
            const normalizedCode = code.trim().toUpperCase();
            const room = get().rooms[normalizedCode];
            if (!room) {
                return false;
            }

            set({ currentRoomCode: normalizedCode, currentRoom: room });
            void loadMembersForCurrentRoom(room.documentId!);
            return true;
        },

        setMyProfile: async (name: string, color: string) => {
            const initials = name ? name.slice(0, 2).toUpperCase() : "ME";
            const currentRoom = get().currentRoom;

            if (currentRoom?.documentId) {
                await createMemberInStrapi({
                    name: name,
                    room: currentRoom.documentId,
                });
            }

            set((state) => {
                const existing = state.members.find((m) => m.id === "you");
                if (existing) {
                    return {
                        members: state.members.map((m) =>
                            m.id === "you" ? { ...m, memberName: name, initials, avatarColor: color } : m
                        ),
                    };
                }

                return {
                    members: [
                        {
                            id: "you",
                            memberName: name,
                            role: "Owner",
                            initials,
                            avatarColor: color || "#F6CFA3",
                            avatarUri: null,
                        },
                        ...state.members,
                    ],
                };
            });
        },

        updateMemberAvatar: (memberId: string, avatarUri: string) => {
            set((state) => ({
                members: state.members.map((member) =>
                    member.id === memberId ? { ...member, avatarUri } : member
                ),
            }));
        },

        refreshMembers: async () => {
            const currentRoom = get().currentRoom;
            if (!currentRoom?.documentId) return;
            await loadMembersForCurrentRoom(currentRoom.documentId);
        },
    };
});
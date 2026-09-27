import { create } from "zustand";

import { generateRoomCode } from "@/features/rooms/generate-room-code";
import { useAuth } from "@/features/auth/auth-store";
import { createRoomInStrapi, createSecureRoom, getRoomByCode } from "../../api/rooms";
import { getMembersForRoom, createMemberInStrapi, joinOrClaimMember } from "../../api/members"; // Importeer member API

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
        const seen = new Set<string>();
        const mapped = strapiMembers.reduce<MemberProfile[]>((acc, m: any) => {
            const normalizedName = String(m.name ?? "").trim().toLowerCase();
            const dedupeKey = m?.user?.id ? `user:${String(m.user.id)}` : `name:${normalizedName}`;

            if (seen.has(dedupeKey)) {
                return acc;
            }

            seen.add(dedupeKey);
            acc.push({
                id: String(m.id),
                documentId: m.documentId,
                roomName: m.room?.name,
                memberName: m.name,
                role: m.role || "Member",
                initials: m.name ? m.name.slice(0, 2).toUpperCase() : "ME",
                avatarColor: "#F6CFA3",
                avatarUri: m.avatar ?? null,
            });

            return acc;
        }, []);
        set({ members: mapped });
    };

    return {
        rooms: {},
        currentRoomCode: null,
        currentRoom: undefined,
        members: [],

        createRoom: async (name: string) => {
            const fallbackCode = generateRoomCode();

            const secureResponse = await createSecureRoom(name);
            const strapiResponse = secureResponse ?? (await createRoomInStrapi({
                name: name,
                code: fallbackCode,
            }));

            const code = String(strapiResponse?.code ?? fallbackCode);

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
                const authUser = useAuth.getState().user;
                if (authUser?.username) {
                    await joinOrClaimMember(normalizedCode, authUser.username);
                }
                await loadMembersForCurrentRoom(rooms[normalizedCode].documentId!);
                return true;
            }

            try {
                const strapiRoom = await getRoomByCode(normalizedCode);

                if (strapiRoom) {
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

                    const authUser = useAuth.getState().user;
                    if (authUser?.username) {
                        await joinOrClaimMember(normalizedCode, authUser.username);
                    }

                    if (strapiRoom.documentId) {
                        await loadMembersForCurrentRoom(strapiRoom.documentId);
                    }
                    return true;
                }
            } catch (error) {
                console.warn("Room lookup mislukt:", error);
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
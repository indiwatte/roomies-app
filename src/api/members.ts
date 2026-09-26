import { API_URL } from "./config";

export type StrapiMember = {
    id?: number;
    documentId?: string;
    name: string;
    avatar?: string;
    role?: string;
};

type StrapiListResponse<T> = {
    data?: T[];
    error?: { message?: string };
};

type StrapiSingleResponse<T> = {
    data?: T;
    error?: { message?: string };
};

type LocalMember = {
    id: string;
    memberName: string;
    avatarUri: string | null;
};

// Haal alle members op (algemeen)
export async function getMembers(): Promise<StrapiMember[]> {
    try {
        const response = await fetch(`${API_URL}/members?populate=*`);
        const json = (await response.json()) as StrapiListResponse<StrapiMember>;

        if (!response.ok) {
            throw new Error(json?.error?.message || `Kon members niet ophalen (${response.status})`);
        }

        return json.data ?? [];
    } catch (error) {
        console.error("Fout bij ophalen members:", error);
        return [];
    }
}

// Haal alleen members op die bij een specifieke kamer horen
export async function getMembersForRoom(roomId: string): Promise<StrapiMember[]> {
    try {
        const response = await fetch(
            `${API_URL}/members?filters[room][documentId][$eq]=${encodeURIComponent(roomId)}&populate=*`
        );
        const json = (await response.json()) as StrapiListResponse<StrapiMember>;

        if (!response.ok) {
            throw new Error(json?.error?.message || `Kon members voor room niet ophalen (${response.status})`);
        }

        return json.data ?? [];
    } catch (error) {
        console.error("Fout bij ophalen members voor room:", error);
        return [];
    }
}

// Maak een nieuw member aan in Strapi
export async function createMemberInStrapi(memberData: Record<string, unknown>): Promise<StrapiMember> {
    const response = await fetch(`${API_URL}/members`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: memberData }),
    });

    const json = (await response.json()) as StrapiSingleResponse<StrapiMember>;

    if (!response.ok) {
        throw new Error(json?.error?.message || `Kon member niet aanmaken (${response.status})`);
    }

    return json.data as StrapiMember;
}

// Zorgt dat elk lokaal roommate-profiel een bijbehorend Strapi member record heeft
// (gematcht op naam) en geeft een mapping terug van lokaal-id -> Strapi documentId.
export async function ensureMembers(localMembers: LocalMember[], roomId: string | null): Promise<Record<string, string>> {
    const existingMembers = await getMembers();
    const byName = new Map(
        existingMembers.map((member) => [String(member.name).trim().toLowerCase(), member])
    );

    const resolvedIds: Record<string, string> = {};

    for (const localMember of localMembers) {
        const key = localMember.memberName.trim().toLowerCase();
        const match = byName.get(key);

        if (match) {
            resolvedIds[localMember.id] = String(match.documentId ?? match.id ?? "");
            continue;
        }

        const created = await createMemberInStrapi({
            name: localMember.memberName,
            avatar: localMember.avatarUri ?? "",
            room: roomId ?? undefined,
        });

        resolvedIds[localMember.id] = String(created.documentId ?? created.id ?? "");
    }

    return resolvedIds;
}

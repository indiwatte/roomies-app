import { API_URL } from "./config";
import { withAuthHeaders } from "./auth-headers";

export type StrapiMember = {
    id?: number;
    documentId?: string;
    name: string;
    avatar?: string;
    role?: string;
    coins?: number;
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

function isExpectedAuthError(responseStatus: number, message: string): boolean {
    const normalized = message.toLowerCase();
    return (
        responseStatus === 401 ||
        responseStatus === 403 ||
        normalized.includes("missing or invalid credentials")
    );
}

// Haal alle members op (algemeen)
export async function getMembers(): Promise<StrapiMember[]> {
    try {
        const response = await fetch(`${API_URL}/members?populate=*`, {
            headers: withAuthHeaders(),
        });
        const json = (await response.json()) as StrapiListResponse<StrapiMember>;

        if (!response.ok) {
            const message = json?.error?.message || `Kon members niet ophalen (${response.status})`;
            if (isExpectedAuthError(response.status, message)) {
                return [];
            }
            throw new Error(message);
        }

        return json.data ?? [];
    } catch (error) {
        console.warn("Members ophalen mislukt:", error);
        return [];
    }
}

// Haal alleen members op die bij een specifieke kamer horen
export async function getMembersForRoom(roomId: string): Promise<StrapiMember[]> {
    try {
        const response = await fetch(
            `${API_URL}/members?filters[room][documentId][$eq]=${encodeURIComponent(roomId)}&populate=*`,
            {
                headers: withAuthHeaders(),
            }
        );
        const json = (await response.json()) as StrapiListResponse<StrapiMember>;

        if (!response.ok) {
            const message = json?.error?.message || `Kon members voor room niet ophalen (${response.status})`;
            if (isExpectedAuthError(response.status, message)) {
                return [];
            }
            throw new Error(message);
        }

        return json.data ?? [];
    } catch (error) {
        console.warn("Members voor room ophalen mislukt:", error);
        return [];
    }
}

// Maak een nieuw member aan in Strapi
export async function createMemberInStrapi(memberData: Record<string, unknown>): Promise<StrapiMember> {
    const response = await fetch(`${API_URL}/members`, {
        method: "POST",
        headers: withAuthHeaders({
            "Content-Type": "application/json",
        }),
        body: JSON.stringify({ data: memberData }),
    });

    const json = (await response.json()) as StrapiSingleResponse<StrapiMember>;

    if (!response.ok) {
        throw new Error(json?.error?.message || `Kon member niet aanmaken (${response.status})`);
    }

    return json.data as StrapiMember;
}

export async function updateMemberAvatarInStrapi(
    documentId: string,
    avatarUri: string
): Promise<StrapiMember> {
    const response = await fetch(`${API_URL}/members/${documentId}`, {
        method: "PUT",
        headers: withAuthHeaders({
            "Content-Type": "application/json",
        }),
        body: JSON.stringify({
            data: {
                avatar: avatarUri,
            },
        }),
    });

    const json = (await response.json()) as StrapiSingleResponse<StrapiMember>;

    if (!response.ok) {
        throw new Error(json?.error?.message || `Kon member avatar niet updaten (${response.status})`);
    }

    return json.data as StrapiMember;
}

export async function updateMemberCoinsInStrapi(
    documentId: string,
    coins: number
): Promise<StrapiMember> {
    const nextCoins = Math.max(0, Math.floor(coins));

    const response = await fetch(`${API_URL}/members/${documentId}`, {
        method: "PUT",
        headers: withAuthHeaders({
            "Content-Type": "application/json",
        }),
        body: JSON.stringify({
            data: {
                coins: nextCoins,
            },
        }),
    });

    const json = (await response.json()) as StrapiSingleResponse<StrapiMember>;

    if (!response.ok) {
        throw new Error(json?.error?.message || `Kon member coins niet updaten (${response.status})`);
    }

    return json.data as StrapiMember;
}

export async function joinOrClaimMember(code: string, name: string): Promise<StrapiMember | null> {
    try {
        const response = await fetch(`${API_URL}/members/join-or-claim`, {
            method: "POST",
            headers: withAuthHeaders({
                "Content-Type": "application/json",
            }),
            body: JSON.stringify({ code, name }),
        });

        const json = (await response.json()) as {
            data?: StrapiMember;
            error?: { message?: string };
        };

        if (!response.ok) {
            throw new Error(json?.error?.message || `Kon member niet claimen (${response.status})`);
        }

        return json?.data ?? null;
    } catch (error) {
        console.error("Fout bij claimen member:", error);
        return null;
    }
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

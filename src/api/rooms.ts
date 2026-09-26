import { API_URL } from "./config";

export type StrapiRoom = {
    id?: number;
    documentId?: string;
    name: string;
    code: string;
};

type StrapiListResponse<T> = {
    data?: T[];
    error?: { message?: string };
};

type StrapiSingleResponse<T> = {
    data?: T;
    error?: { message?: string };
};

export async function getRooms(): Promise<StrapiRoom[]> {
    try {
        const response = await fetch(`${API_URL}/rooms`);
        const data = (await response.json()) as StrapiListResponse<StrapiRoom>;
        return data.data ?? [];
    } catch (error) {
        console.error("Fout bij ophalen rooms:", error);
        return [];
    }
}

// Zoek een room op basis van de lokale room code.
export async function getRoomByCode(code: string): Promise<StrapiRoom | null> {
    try {
        const response = await fetch(
            `${API_URL}/rooms?filters[code][$eq]=${encodeURIComponent(code)}`
        );
        const json = (await response.json()) as StrapiListResponse<StrapiRoom>;

        if (!response.ok) {
            throw new Error(json?.error?.message || `Kon room niet ophalen (${response.status})`);
        }

        return json.data?.[0] ?? null;
    } catch (error) {
        console.error("Fout bij ophalen room:", error);
        return null;
    }
}

export async function createRoomInStrapi(roomData: Record<string, unknown>): Promise<StrapiRoom | undefined> {
    try {
        const response = await fetch(`${API_URL}/rooms`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ data: roomData }),
        });
        const result = (await response.json()) as StrapiSingleResponse<StrapiRoom>;

        if (!response.ok) {
            throw new Error(result?.error?.message || `Kon room niet aanmaken (${response.status})`);
        }

        console.log("Room opgeslagen in Strapi:", result);
        return result.data;
    } catch (error) {
        console.error("Fout bij aanmaken room in Strapi:", error);
        return undefined;
    }
}

// Zorgt dat er een Strapi room bestaat voor de gegeven lokale code, en geeft die terug.
export async function ensureRoom(code: string, name: string): Promise<StrapiRoom | undefined | null> {
    const existing = await getRoomByCode(code);
    if (existing) {
        return existing;
    }

    return createRoomInStrapi({ name, code });
}

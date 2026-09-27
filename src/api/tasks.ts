import { API_URL } from "./config";
import { withAuthHeaders } from "./auth-headers";

export type StrapiTask = {
    id?: number;
    documentId?: string;
    title: string;
    description?: string | null;
    dueDate?: string | null;
    dueTime?: string | null;
    completed?: boolean;
    recurring?: boolean;
    rewardValue?: number;
    assignedTo?: unknown;
    room?: { id?: number; documentId?: string };
};

type StrapiListResponse<T> = {
    data?: T[];
    error?: { message?: string };
};

type StrapiSingleResponse<T> = {
    data?: T;
    error?: { message?: string };
};

// Haal alle taken op (algemeen)
export async function getTasks(): Promise<StrapiTask[]> {
    try {
        const response = await fetch(`${API_URL}/tasks?populate=*&sort=createdAt:asc`, {
            headers: withAuthHeaders(),
        });
        const json = (await response.json()) as StrapiListResponse<StrapiTask>;

        if (!response.ok) {
            throw new Error(json?.error?.message || `Kon taken niet ophalen (${response.status})`);
        }

        return json.data ?? [];
    } catch (error) {
        console.error("Fout bij ophalen taken:", error);
        return [];
    }
}

// Haal alleen taken op voor een specifieke kamer
export async function getTasksForRoom(roomId: string): Promise<StrapiTask[]> {
    try {
        const response = await fetch(
            `${API_URL}/tasks?filters[room][documentId][$eq]=${encodeURIComponent(roomId)}&populate=*&sort=createdAt:asc`,
            {
                headers: withAuthHeaders(),
            }
        );
        const json = (await response.json()) as StrapiListResponse<StrapiTask>;

        if (!response.ok) {
            throw new Error(json?.error?.message || `Kon taken voor room niet ophalen (${response.status})`);
        }

        return json.data ?? [];
    } catch (error) {
        console.error("Fout bij ophalen taken voor room:", error);
        return [];
    }
}

// Maak een nieuwe taak aan.
export async function createTask(taskData: Record<string, unknown>): Promise<StrapiTask> {
    const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: withAuthHeaders({
            "Content-Type": "application/json",
        }),
        body: JSON.stringify({ data: taskData }),
    });

    const json = (await response.json()) as StrapiSingleResponse<StrapiTask>;

    if (!response.ok) {
        throw new Error(json?.error?.message || `Kon taak niet opslaan (${response.status})`);
    }

    return json.data as StrapiTask;
}

// Update de status van een taak (bijv. completed: true)
export async function updateTaskStatus(documentId: string, completedStatus: boolean): Promise<StrapiTask> {
    const response = await fetch(`${API_URL}/tasks/${documentId}`, {
        method: "PUT",
        headers: withAuthHeaders({
            "Content-Type": "application/json",
        }),
        body: JSON.stringify({
            data: { completed: completedStatus },
        }),
    });

    const json = (await response.json()) as StrapiSingleResponse<StrapiTask>;

    if (!response.ok) {
        throw new Error(json?.error?.message || `Kon taak niet updaten (${response.status})`);
    }

    return json.data as StrapiTask;
}

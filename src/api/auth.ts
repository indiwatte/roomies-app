import { API_URL } from "./config";

export type AuthUser = {
    id: number;
    username: string;
    email?: string;
};

type AuthResponse = {
    jwt?: string;
    user?: AuthUser;
    error?: {
        message?: string;
    };
};

type RegisterParams = {
    name: string;
    email: string;
    password: string;
};

type LoginParams = {
    email: string;
    password: string;
};

function normalizeUsername(name: string) {
    const base = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 24);

    return `${base || "homi-user"}-${Math.floor(Math.random() * 10000)}`;
}

export async function registerWithPassword({ name, email, password }: RegisterParams) {
    const response = await fetch(`${API_URL}/auth/local/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: normalizeUsername(name),
            email: email.trim().toLowerCase(),
            password,
        }),
    });

    const json = (await response.json()) as AuthResponse;

    if (!response.ok || !json.jwt || !json.user) {
        throw new Error(json?.error?.message || "Registratie mislukt");
    }

    return { jwt: json.jwt, user: json.user };
}

export async function loginWithPassword({ email, password }: LoginParams) {
    const response = await fetch(`${API_URL}/auth/local`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            identifier: email.trim().toLowerCase(),
            password,
        }),
    });

    const json = (await response.json()) as AuthResponse;

    if (!response.ok || !json.jwt || !json.user) {
        throw new Error(json?.error?.message || "Inloggen mislukt");
    }

    return { jwt: json.jwt, user: json.user };
}

export async function getMe(jwt: string) {
    const response = await fetch(`${API_URL}/users/me`, {
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
    });

    const json = (await response.json()) as AuthUser & { error?: { message?: string } };

    if (!response.ok || !json?.id) {
        throw new Error(json?.error?.message || "Kon gebruiker niet ophalen");
    }

    return json as AuthUser;
}

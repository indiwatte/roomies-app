import { create } from "zustand";

import { getMe, loginWithPassword, registerWithPassword, type AuthUser } from "@/api/auth";
import { setAuthToken } from "./auth-token";

type AuthState = {
    jwt: string | null;
    user: AuthUser | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    signUp: (params: { name: string; email: string; password: string }) => Promise<void>;
    signIn: (params: { email: string; password: string }) => Promise<void>;
    restoreSession: () => Promise<void>;
    signOut: () => void;
};

export const useAuth = create<AuthState>((set, get) => ({
    jwt: null,
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,

    signUp: async ({ name, email, password }) => {
        set({ loading: true, error: null });
        try {
            const { jwt, user } = await registerWithPassword({ name, email, password });
            setAuthToken(jwt);
            set({ jwt, user, isAuthenticated: true, loading: false, error: null });
        } catch (error) {
            set({
                loading: false,
                error: error instanceof Error ? error.message : "Registratie mislukt",
            });
            throw error;
        }
    },

    signIn: async ({ email, password }) => {
        set({ loading: true, error: null });
        try {
            const { jwt, user } = await loginWithPassword({ email, password });
            setAuthToken(jwt);
            set({ jwt, user, isAuthenticated: true, loading: false, error: null });
        } catch (error) {
            set({
                loading: false,
                error: error instanceof Error ? error.message : "Inloggen mislukt",
            });
            throw error;
        }
    },

    restoreSession: async () => {
        const jwt = get().jwt;
        if (!jwt) return;

        set({ loading: true });
        try {
            const user = await getMe(jwt);
            setAuthToken(jwt);
            set({ user, isAuthenticated: true, loading: false, error: null });
        } catch {
            setAuthToken(null);
            set({ jwt: null, user: null, isAuthenticated: false, loading: false, error: null });
        }
    },

    signOut: () => {
        setAuthToken(null);
        set({ jwt: null, user: null, isAuthenticated: false, error: null });
    },
}));

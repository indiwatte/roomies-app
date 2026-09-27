import { getAuthToken } from "@/features/auth/auth-token";

type HeadersMap = Record<string, string>;

export function withAuthHeaders(baseHeaders: HeadersMap = {}): HeadersMap {
    const token = getAuthToken();
    if (!token) {
        return baseHeaders;
    }

    return {
        ...baseHeaders,
        Authorization: `Bearer ${token}`,
    };
}

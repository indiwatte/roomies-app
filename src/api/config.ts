const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

// Fallback keeps local dev usable if .env is temporarily missing.
const fallbackUrl = "http://192.168.0.239:1337/api";

export const API_URL = (envUrl && envUrl.length > 0 ? envUrl : fallbackUrl).replace(/\/$/, "");

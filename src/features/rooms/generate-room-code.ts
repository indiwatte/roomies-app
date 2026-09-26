/**
 * Generates a short, clean room code (e.g. "K9X2" or "B4M8").
 */
export function generateRoomCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Geen verwarrende letters/cijfers zoals O/0 of I/1
    let code = "";

    // Genereer een code van 4 karakters (bijv. "A7K3")
    for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        code += chars[randomIndex];
    }

    return code;
}

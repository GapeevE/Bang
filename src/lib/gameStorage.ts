import { Game, type GameSnapshot } from "@/lib/game";

const STORAGE_KEY = "bang:game";

export function loadGame(): Game | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw === null) return null;
        const snapshot = JSON.parse(raw) as GameSnapshot;
        return Game.fromSnapshot(snapshot);
    } catch {
        // Битые данные в хранилище — игнорируем и стартуем заново.
        return null;
    }
}

export function saveGame(game: Game | null): void {
    if (game === null) {
        localStorage.removeItem(STORAGE_KEY);
        return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game.toSnapshot()));
}

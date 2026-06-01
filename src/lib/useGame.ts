import { useContext } from "react";
import { GameContext } from "@/lib/gameContextValue";

export function useGame() {
    const ctx = useContext(GameContext);
    if (ctx === null) {
        throw new Error("useGame must be used within a GameProvider");
    }
    return ctx;
}

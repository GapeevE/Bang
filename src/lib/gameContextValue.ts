import { createContext } from "react";
import type { Game } from "@/lib/game";

export type GameContextValue = {
    game: Game | null;
    // Версия игры — растёт при каждом изменении мутабельного инстанса Game.
    // Завязывайте на неё useMemo/эффекты, если нужно реагировать на ход игры.
    version: number;
    // Заменить игру целиком (новая игра / сброс).
    setGame: (game: Game | null) => void;
    // Зафиксировать мутацию текущего инстанса Game: персист + ре-рендер.
    commitGame: () => void;
};

export const GameContext = createContext<GameContextValue | null>(null);

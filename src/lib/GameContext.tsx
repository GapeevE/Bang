import { useState, type ReactNode } from "react";
import type { Game } from "@/lib/game";
import { GameContext } from "@/lib/gameContextValue";
import { loadGame, saveGame } from "@/lib/gameStorage";

export function GameProvider({ children }: { children: ReactNode }) {
    // Восстанавливаем игру из localStorage при загрузке страницы.
    const [game, setGameState] = useState<Game | null>(() => loadGame());
    const [version, setVersion] = useState(0);

    // Любое изменение игры сразу персистим — localStorage единственный источник правды.
    const setGame = (next: Game | null) => {
        saveGame(next);
        setGameState(next);
        setVersion((v) => v + 1);
    };

    // Game мутабелен: после изменения его полей вызываем commitGame,
    // чтобы перезаписать localStorage и форсировать ре-рендер.
    const commitGame = () => {
        if (game) {
            // Постоянные пассивки (Сюзи Лафайет) и проверка победы.
            game.applyContinuousPassives();
            game.checkWinConditions();
        }
        saveGame(game);
        setVersion((v) => v + 1);
    };

    return (
        <GameContext.Provider value={{ game, version, setGame, commitGame }}>
            {children}
        </GameContext.Provider>
    );
}

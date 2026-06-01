import { useEffect } from "react";
import { toast } from "sonner";
import ActivePlayerPanel from "@/components/blocks/ActivePlayerPanel";
import DeckArea from "@/components/blocks/DeckArea";
import PlayerCard from "@/components/blocks/PlayerCard";
import VictoryDialog from "@/components/blocks/VictoryDialog";
import { useGame } from "@/lib/useGame";

function App() {
  // version нужен, чтобы перерисовываться на мутациях инстанса Game.
  const { game, version } = useGame();

  // На каждое изменение игры показываем тоасты о выбывших игроках (с ролью).
  useEffect(() => {
    if (!game || game.recentDeaths.length === 0) return;
    const deaths = game.recentDeaths.splice(0);
    for (const d of deaths) {
      toast.error(`${d.name} погибает. Его роль: ${d.role}`, {
        position: "top-right",
      });
    }
  }, [game, version]);

  if (game === null) {
    return null;
  }

  return (
    <div key={version} className="flex flex-col items-center gap-6 p-4">
      <DeckArea />

      <div className="grid w-full max-w-4xl grid-cols-2 gap-4">
        {game.players.map((player, index) => (
          <PlayerCard
            key={index}
            player={player}
            isActive={player === game.activePlayer}
          />
        ))}
      </div>

      <ActivePlayerPanel />

      <VictoryDialog />
    </div>
  );
}

export default App

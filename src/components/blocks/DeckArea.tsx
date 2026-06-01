import { Card } from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    cardBorderClass,
    cardNameSuitValue,
    cardSuitValue,
} from "@/lib/cards/cardRegistry";
import { useGame } from "@/lib/useGame";

export default function DeckArea() {
    const { game } = useGame();
    if (game === null) return null;

    const deckCount = game.deck.getItems().length;
    const discard = game.deck.getDiscard();
    const topDiscard = discard[discard.length - 1] ?? null;

    return (
        <div className="flex items-start justify-center gap-8 p-4">
            {/* Колода */}
            <div className="flex flex-col items-center gap-2">
                <span className="text-2xl font-bold text-zinc-100">{deckCount}</span>
                <Card className="flex h-32 w-24 items-center justify-center bg-muted text-muted-foreground" />
                <span className="min-w-28 rounded-md bg-zinc-800 py-1 text-center text-base font-semibold text-zinc-100">
                    Колода
                </span>
            </div>

            {/* Сброс */}
            <div className="flex flex-col items-center gap-2">
                <span className="text-2xl font-bold text-zinc-100">
                    {discard.length}
                </span>
                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className="cursor-pointer"
                            disabled={discard.length === 0}
                        >
                            <Card
                                className={`flex h-32 w-24 flex-col items-center justify-center gap-1 p-2 text-center ${
                                    topDiscard
                                        ? `border-2 ${cardBorderClass(topDiscard)}`
                                        : "bg-muted text-muted-foreground"
                                }`}
                            >
                                {topDiscard ? (
                                    <>
                                        <span className="text-xs font-medium">
                                            {topDiscard.name}
                                        </span>
                                        <span className="text-sm font-semibold">
                                            {cardSuitValue(topDiscard)}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-xs">пусто</span>
                                )}
                            </Card>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                            Карты в сбросе ({discard.length})
                        </p>
                        <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto">
                            {discard.map((card, index) => (
                                <span
                                    key={index}
                                    className={`rounded-md border-2 px-2 py-1 text-xs ${cardBorderClass(card)}`}
                                >
                                    {cardNameSuitValue(card)}
                                </span>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
                <span className="min-w-28 rounded-md bg-zinc-800 py-1 text-center text-base font-semibold text-zinc-100">
                    Сброс
                </span>
            </div>
        </div>
    );
}

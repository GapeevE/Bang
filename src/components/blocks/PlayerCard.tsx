import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cardSuitValue } from "@/lib/cards/cardRegistry";
import type { Player } from "@/lib/player";

// Палитра под цвета из StartForm (NEON_COLORS).
// Классы прописаны статически, чтобы их не вырезал Tailwind.
const COLOR_PALETTE: Record<
    string,
    { border: string; bg: string; accent: string; text: string }
> = {
    lime: { border: "border-lime-400", bg: "bg-lime-100", accent: "bg-lime-400", text: "text-lime-700" },
    green: { border: "border-green-400", bg: "bg-green-100", accent: "bg-green-400", text: "text-green-700" },
    emerald: { border: "border-emerald-400", bg: "bg-emerald-100", accent: "bg-emerald-400", text: "text-emerald-700" },
    cyan: { border: "border-cyan-400", bg: "bg-cyan-100", accent: "bg-cyan-400", text: "text-cyan-700" },
    sky: { border: "border-sky-400", bg: "bg-sky-100", accent: "bg-sky-400", text: "text-sky-700" },
    fuchsia: { border: "border-fuchsia-500", bg: "bg-fuchsia-100", accent: "bg-fuchsia-500", text: "text-fuchsia-700" },
    pink: { border: "border-pink-500", bg: "bg-pink-100", accent: "bg-pink-500", text: "text-pink-700" },
    rose: { border: "border-rose-500", bg: "bg-rose-100", accent: "bg-rose-500", text: "text-rose-700" },
};

const FALLBACK_PALETTE = {
    border: "border-foreground/20",
    bg: "bg-muted",
    accent: "bg-muted-foreground",
    text: "text-muted-foreground",
};

const BLUE_BUTTON = "border-2 border-blue-500 text-blue-500 hover:bg-blue-500/10";

export default function PlayerCard({
    player,
    isActive = false,
}: {
    player: Player;
    isActive?: boolean;
}) {
    const palette = COLOR_PALETTE[player.color] ?? FALLBACK_PALETTE;
    const weapon = player.activeWeapon;

    return (
        <Card
            className={`w-full text-zinc-900 ${palette.bg} ${palette.border} ${
                isActive ? "border-8" : "border-4"
            }`}
        >
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={`size-3 rounded-full ${palette.accent}`} />
                    <CardTitle>{player.name}</CardTitle>
                </div>
                <span className={`text-sm font-semibold ${palette.text}`}>
                    ♥ {player.health}
                </span>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                    {/* Персонаж: имя + popover с описанием способности. */}
                    {player.character && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="secondary" size="sm">
                                    {player.character.name}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent>
                                <p className="font-medium">{player.character.name}</p>
                                <p className="mt-1 text-muted-foreground">
                                    {player.character.description}
                                </p>
                            </PopoverContent>
                        </Popover>
                    )}

                    {/* Роль показывается только у шерифа (остальные скрыты). */}
                    {player.role?.kind === "sheriff" && (
                        <Button variant="secondary" size="sm">
                            {player.role.name}
                        </Button>
                    )}

                    {/* Оружие: синяя обводка, popover с описанием и дальностью. */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className={BLUE_BUTTON}>
                                {weapon.name} - {weapon.range}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <p className="font-medium">
                                {weapon.name}
                                {!weapon.isDefault && ` (${cardSuitValue(weapon)})`}
                            </p>
                            <p className="mt-1 text-muted-foreground">
                                Дальность: {weapon.range}
                            </p>
                            {weapon.description && (
                                <p className="mt-1 text-muted-foreground">
                                    {weapon.description}
                                </p>
                            )}
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-medium text-zinc-600">
                        Снаряжение
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {player.equipment.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                            player.equipment.map((card, index) => (
                                <Popover key={index}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={BLUE_BUTTON}
                                        >
                                            {card.name}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent>
                                        <p className="font-medium">
                                            {card.name} ({cardSuitValue(card)})
                                        </p>
                                        {card.description && (
                                            <p className="mt-1 text-muted-foreground">
                                                {card.description}
                                            </p>
                                        )}
                                    </PopoverContent>
                                </Popover>
                            ))
                        )}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex flex-col items-start gap-1.5">
                <p className="text-xs font-medium text-zinc-600">Карты</p>
                {/* Содержимое руки скрыто — видно только количество карт. */}
                <span className="text-sm font-semibold text-zinc-700">
                    🂠 {player.hand.length}
                </span>
            </CardFooter>
        </Card>
    );
}

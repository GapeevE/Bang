import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Card as GameCard } from "@/lib/cards/card";
import {
    cardBorderClass,
    cardLabel,
    cardNameSuitValue,
    cardSuitValue,
} from "@/lib/cards/cardRegistry";
import { Beer, CatBalou, Duel, Panic } from "@/lib/cards/actions";
import { Bang } from "@/lib/cards/bang";
import { Jail } from "@/lib/cards/equipments";
import { useGame } from "@/lib/useGame";
import type { Player } from "@/lib/player";

export default function ActivePlayerPanel() {
    const { game, commitGame } = useGame();
    const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);
    // Идёт выбор цели для выбранной карты.
    const [choosingTarget, setChoosingTarget] = useState(false);
    // Выбранные карты для лечения Тома Кетчума (нужно 2).
    const [ketchumPick, setKetchumPick] = useState<GameCard[]>([]);

    if (game === null) return null;

    const active = game.activePlayer;
    const shot = game.pendingShot;
    const dying = game.pendingDeath;

    // --- Игрок на грани смерти: может спастись Пивом ---------------------
    if (dying) {
        const drinkBeer = () => {
            game.useBeerToSurvive();
            toast.success(`${dying.name} выпивает Пиво и остаётся жив (1 ♥)!`, {
                position: "top-right",
            });
            commitGame();
        };
        const die = () => {
            game.acceptDeath();
            toast.error(`${dying.name} выбывает из игры`, {
                position: "top-right",
            });
            commitGame();
        };

        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>{dying.name} на грани смерти</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">
                        Здоровье на нуле. Можно сыграть Пиво и выжить с 1 ♥.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={drinkBeer}>Выпить Пиво (выжить с 1 ♥)</Button>
                        <Button variant="destructive" onClick={die}>
                            Принять смерть
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // --- Счастливчик Люк: выбор карты проверки --------------------------
    const lucky = game.pendingLuckyCheck;
    if (lucky) {
        const checkLabel: Record<typeof lucky.kind, string> = {
            barrel: "Бочка",
            dodge: "Проверка-уклонение",
            dynamite: "Динамит",
            jail: "Тюрьма",
        };
        const pick = (card: GameCard) => {
            game.resolveLuckyCheck(card);
            toast(`Счастливчик Люк выбирает ${cardLabel(card)} для проверки`, {
                position: "top-right",
            });
            commitGame();
        };
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>
                        Счастливчик Люк — проверка ({checkLabel[lucky.kind]})
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">
                        Вскрыты 2 карты — выберите одну для проверки.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {lucky.options.map((card, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                className={`border-2 ${cardBorderClass(card)}`}
                                onClick={() => pick(card)}
                            >
                                {cardLabel(card)}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // --- Проверка динамита в начале хода --------------------------------
    const dynamiteOwner = game.pendingDynamite;
    if (dynamiteOwner) {
        const check = () => {
            const { card, exploded } = game.resolveDynamite();
            // Счастливчик Люк: проверка приостановлена для выбора карты.
            if (game.pendingLuckyCheck) {
                commitGame();
                return;
            }
            const drawnLabel = card
                ? `${card.name} (${cardSuitValue(card)})`
                : "—";
            if (exploded) {
                toast.error(
                    `Динамит взорвался у ${dynamiteOwner.name}! Вытянуто ${drawnLabel} — потеря 3 ♥.`,
                    { position: "top-right" },
                );
            } else {
                toast(
                    `${dynamiteOwner.name} проверяет динамит: ${drawnLabel} — обошлось, динамит уходит дальше.`,
                    { position: "top-right" },
                );
            }
            commitGame();
        };

        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Динамит у {dynamiteOwner.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">
                        Начало хода: проверьте динамит. Пики 2–9 — взрыв (−3 ♥),
                        иначе он перейдёт следующему игроку.
                    </p>
                    <Button className="w-fit" onClick={check}>
                        Проверить динамит
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // --- Проверка тюрьмы в начале хода ----------------------------------
    const jailedPlayer = game.pendingJail;
    if (jailedPlayer) {
        const check = () => {
            const { card, freed } = game.resolveJail();
            if (game.pendingLuckyCheck) {
                commitGame();
                return;
            }
            const drawnLabel = card
                ? `${card.name} (${cardSuitValue(card)})`
                : "—";
            if (freed) {
                toast.success(
                    `${jailedPlayer.name} выходит из тюрьмы (${drawnLabel}) и ходит!`,
                    { position: "top-right" },
                );
            } else {
                toast(
                    `${jailedPlayer.name} остаётся в тюрьме (${drawnLabel}) — ход пропущен.`,
                    { position: "top-right" },
                );
            }
            commitGame();
        };

        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Тюрьма: {jailedPlayer.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">
                        Начало хода: проверьте тюрьму. Черва — освобождение и ход,
                        иначе ход пропускается.
                    </p>
                    <Button className="w-fit" onClick={check}>
                        Проверить тюрьму
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // --- Особый набор карт (Кит Карсон / Джесси Джеймс / Туко) ----------
    const draw = game.pendingDraw;
    if (draw) {
        if (draw.kind === "kitCarson") {
            const keepAndReturn = (returned: GameCard) => {
                game.kitCarsonResolve(returned);
                toast(`${active.name}: 1 карта возвращена наверх колоды`, {
                    position: "top-right",
                });
                commitGame();
            };
            return (
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Кит Карсон: {active.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        <p className="text-sm text-muted-foreground">
                            Выберите карту, которую вернуть наверх колоды (две
                            другие останутся на руке).
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {draw.revealed.map((card, index) => (
                                <Button
                                    key={index}
                                    variant="outline"
                                    className={`border-2 ${cardBorderClass(card)}`}
                                    onClick={() => keepAndReturn(card)}
                                >
                                    Вернуть {cardLabel(card)}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            );
        }

        if (draw.kind === "jesseJames") {
            const opponents = game.players.filter(
                (p) => p !== active && p.isAlive && p.hand.length > 0,
            );
            const takeFrom = (target: Player) => {
                game.jesseJamesResolve(target);
                toast(`${active.name} берёт карту с руки ${target.name}`, {
                    position: "top-right",
                });
                commitGame();
            };
            const fromDeck = () => {
                game.specialDrawFromDeck();
                commitGame();
            };
            return (
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Джесси Джеймс: {active.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        <p className="text-sm text-muted-foreground">
                            Первую карту можно взять с руки соперника (вслепую) или
                            из колоды.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {opponents.map((p, index) => (
                                <Button
                                    key={index}
                                    variant="outline"
                                    onClick={() => takeFrom(p)}
                                >
                                    С руки {p.name} ({p.hand.length})
                                </Button>
                            ))}
                            <Button variant="secondary" onClick={fromDeck}>
                                Взять из колоды
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        // tuco
        const top = game.deck.getDiscard().at(-1) ?? null;
        const fromDiscard = () => {
            game.tucoResolve();
            commitGame();
        };
        const fromDeck = () => {
            game.specialDrawFromDeck();
            commitGame();
        };
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Туко: {active.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">
                        Первую карту можно взять с верха сброса
                        {top ? ` (${cardLabel(top)})` : ""} или из колоды.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" disabled={!top} onClick={fromDiscard}>
                            Взять из сброса
                        </Button>
                        <Button variant="secondary" onClick={fromDeck}>
                            Взять из колоды
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // --- Реакция на «Индейцев» ------------------------------------------
    const indians = game.pendingIndians;
    if (indians) {
        const target = indians.target;
        const bangCards = target.hand.filter((c) => c instanceof Bang) as Bang[];

        const discardBang = (card: Bang) => {
            game.indiansDiscardBang(card);
            toast(`${target.name} сбрасывает «Бэнг!» от Индейцев`, {
                position: "top-right",
            });
            commitGame();
        };
        const takeHit = () => {
            game.indiansTakeHit();
            toast.error(
                `${target.name} теряет 1 ♥ от Индейцев (осталось ${Math.max(0, target.health)})`,
                { position: "top-right" },
            );
            commitGame();
        };

        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Индейцы → {target.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">
                        {target.name}: сбросьте «Бэнг!» или потеряйте 1 ♥.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {bangCards.map((card, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                className={`border-2 ${cardBorderClass(card)}`}
                                onClick={() => discardBang(card)}
                            >
                                Сбросить {cardLabel(card)}
                            </Button>
                        ))}
                        <Button variant="destructive" onClick={takeHit}>
                            Потерять 1 ♥
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // --- Паника/Красотка: выбор карты у цели ----------------------------
    const steal = game.pendingSteal;
    if (steal) {
        const target = steal.target;
        const verb = steal.mode === "steal" ? "забирает" : "сбрасывает";
        const title = steal.mode === "steal" ? "Паника" : "Красотка";
        const weapon =
            target.weapon && !target.weapon.isDefault ? target.weapon : null;

        const finish = (card: GameCard | null) => {
            if (card) {
                toast(`${steal.actor.name} ${verb} карту «${cardNameSuitValue(card)}» у ${target.name}`, {
                    position: "top-right",
                });
            }
            commitGame();
        };

        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>
                        {title}: {steal.actor.name} → {target.name}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">
                        Выберите, что {verb === "забирает" ? "забрать" : "сбросить"}.
                        Карта с руки — вслепую (случайная).
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {target.hand.length > 0 && (
                            <Button
                                variant="outline"
                                onClick={() => finish(game.stealFromHand())}
                            >
                                Случайная с руки ({target.hand.length})
                            </Button>
                        )}
                        {weapon && (
                            <Button
                                variant="outline"
                                className="border-2 border-blue-500"
                                onClick={() => finish(game.stealWeapon())}
                            >
                                Оружие: {weapon.name}
                            </Button>
                        )}
                        {target.equipment.map((eq, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                className="border-2 border-blue-500"
                                onClick={() => finish(game.stealEquipment(eq))}
                            >
                                {eq.name}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // --- Магазин: игроки разбирают вскрытые карты -----------------------
    const store = game.pendingStore;
    if (store) {
        const pick = (card: GameCard) => {
            game.takeFromStore(card);
            toast(`${store.current.name} берёт «${cardNameSuitValue(card)}»`, {
                position: "top-right",
            });
            commitGame();
        };

        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Магазин — выбирает {store.current.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">
                        {store.current.name}, возьмите одну карту.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {store.offered.map((card, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                className={`border-2 ${cardBorderClass(card)}`}
                                onClick={() => pick(card)}
                            >
                                {cardLabel(card)}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // --- Дуэль: участники по очереди сбрасывают «Бэнг!» -----------------
    const duel = game.pendingDuel;
    if (duel) {
        const current = duel.current;
        const bangCards = current.hand.filter((c) => c instanceof Bang) as Bang[];

        const playBang = (card: Bang) => {
            game.duelPlayBang(card);
            commitGame();
        };
        const giveUp = () => {
            game.duelGiveUp();
            toast.error(
                `${current.name} проигрывает дуэль и теряет 1 ♥ (осталось ${Math.max(0, current.health)})`,
                { position: "top-right" },
            );
            commitGame();
        };

        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>
                        Дуэль: {duel.challenger.name} против {duel.opponent.name}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">
                        Ход {current.name}: сбросьте «Бэнг!» или сдайтесь.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {bangCards.map((card, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                className={`border-2 ${cardBorderClass(card)}`}
                                onClick={() => playBang(card)}
                            >
                                Сбросить {cardLabel(card)}
                            </Button>
                        ))}
                        <Button variant="destructive" onClick={giveUp}>
                            Сдаться (−1 ♥)
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // --- Реакция цели на выстрел «Бэнг!»/«Гатлинг» ----------------------
    if (shot) {
        const target = shot.target;
        const missedCards = game.dodgeCards(target);
        const canUseBarrel = game.canUseBarrel();

        const useBarrel = () => {
            const drawn = game.useBarrel();
            const saved = shot.barrelSaved;
            if (drawn) {
                const drawnLabel = `${drawn.name} (${cardSuitValue(drawn)})`;
                if (saved) {
                    toast.success(
                        `Бочка: выпала черва ${drawnLabel} — ${target.name} спасён!`,
                        { position: "top-right" },
                    );
                } else {
                    toast(`Бочка: ${drawnLabel} — мимо, не спасло`, {
                        position: "top-right",
                    });
                }
            }
            commitGame();
        };
        const playMissed = (card: GameCard) => {
            game.playMissed(card);
            commitGame();
        };
        const takeHit = () => {
            game.resolveShot();
            toast.error(
                `${target.name} теряет 1 ♥ (осталось ${Math.max(0, target.health)})`,
                { position: "top-right" },
            );
            commitGame();
        };
        const dismiss = () => {
            game.dismissShot();
            commitGame();
        };
        const dodgeCheck = () => {
            const { card, dodged, pending } = game.useDodgeCheck();
            if (pending) {
                commitGame();
                return;
            }
            const label = card ? `${card.name} (${cardSuitValue(card)})` : "—";
            if (dodged) {
                toast.success(
                    `${target.name} (Человек-Без-Имени) уклонился: ${label}`,
                    { position: "top-right" },
                );
            } else {
                toast(`Проверка-уклонение: ${label} — не черва`, {
                    position: "top-right",
                });
            }
            commitGame();
        };
        // Сколько ещё «Мимо!» нужно цели (Ангельские Глазки — 2).
        const missedLeft = game.missedRequired(target) - shot.missedPlayed;

        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>
                        Выстрел: {shot.shooter.name} → {target.name}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    {shot.barrelSaved ? (
                        <>
                            <p className="text-sm text-emerald-500">
                                Бочка спасла {target.name} (выпала черва)!
                            </p>
                            <Button variant="secondary" className="w-fit" onClick={dismiss}>
                                Продолжить
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">
                                {target.name}, отбейтесь от выстрела.
                                {missedLeft > 1 &&
                                    ` Нужно ещё ${missedLeft} «Мимо!».`}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {canUseBarrel && (
                                    <Button variant="outline" onClick={useBarrel}>
                                        Тянуть из бочки
                                    </Button>
                                )}
                                {game.canUseDodgeCheck() && (
                                    <Button variant="outline" onClick={dodgeCheck}>
                                        Проверка-уклонение
                                    </Button>
                                )}
                                {missedCards.map((card, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        className={`border-2 ${cardBorderClass(card)}`}
                                        onClick={() => playMissed(card)}
                                    >
                                        {cardLabel(card)}
                                    </Button>
                                ))}
                                <Button variant="destructive" onClick={takeHit}>
                                    Получить урон (−1 ♥)
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        );
    }

    // --- Обычный ход активного игрока -----------------------------------
    const resetSelection = () => {
        setSelectedCard(null);
        setChoosingTarget(false);
    };

    const selectCard = (card: GameCard) => {
        if (selectedCard === card) {
            resetSelection();
        } else {
            setSelectedCard(card);
            setChoosingTarget(false);
        }
    };

    // Нажата кнопка «Разыграть»: для карт с целью — открыть выбор цели,
    // иначе разыграть сразу.
    const onPlay = () => {
        if (selectedCard === null) return;
        if (game.needsTarget(selectedCard)) {
            setChoosingTarget(true);
            return;
        }
        const wasBeer = selectedCard instanceof Beer;
        game.playCard(selectedCard);
        if (wasBeer) {
            toast.success(`${active.name} восстановил единицу здоровья`, {
                position: "top-right",
            });
        }
        resetSelection();
        commitGame();
    };

    const playOnTarget = (target: Player) => {
        if (selectedCard === null) return;
        // Тюрьму нельзя посадить на шерифа.
        if (selectedCard instanceof Jail && target.role?.kind === "sheriff") {
            toast.warning("Нельзя посадить шерифа в тюрьму!", {
                position: "top-right",
            });
            return;
        }
        game.playCard(selectedCard, target);
        resetSelection();
        commitGame();
    };

    const onDiscard = () => {
        if (selectedCard === null) return;
        game.discardFromHand(selectedCard);
        resetSelection();
        commitGame();
    };

    const toggleKetchum = (card: GameCard) => {
        setKetchumPick((prev) =>
            prev.includes(card)
                ? prev.filter((c) => c !== card)
                : prev.length < 2
                  ? [...prev, card]
                  : prev,
        );
    };

    const confirmKetchum = () => {
        if (ketchumPick.length !== 2) return;
        game.tomKetchumHeal(ketchumPick[0], ketchumPick[1]);
        setKetchumPick([]);
        toast.success(`${active.name} восстановил единицу здоровья`, {
            position: "top-right",
        });
        commitGame();
    };

    const onPlayAsStore = () => {
        if (selectedCard === null) return;
        game.playAsGeneralStore(selectedCard);
        resetSelection();
        commitGame();
    };

    // Завершить розыгрыш → перейти к фазе сброса.
    const endPlay = () => {
        game.endPlayPhase();
        resetSelection();
        commitGame();
    };

    const passTurn = () => {
        const excess = game.excessCards();
        if (excess > 0) {
            toast.warning(
                `${active.name}: на руке слишком много карт. Сбросьте ещё ${excess} (лимит — ${active.health} по числу здоровья).`,
                { position: "top-right" },
            );
            return;
        }
        game.nextPlayer();
        resetSelection();
        commitGame();
    };

    // Список целей зависит от выбранной карты.
    const targetsFor = (card: GameCard): Player[] => {
        const others = game.players.filter((p) => p !== active && p.isAlive);
        if (card instanceof Panic) {
            return others.filter((p) => game.distanceBetween(active, p) <= 1);
        }
        if (card instanceof Jail) {
            // Тюрьма — любой игрок без учёта расстояния (шериф отсеивается при клике).
            return others.filter((p) => !p.hasEquipment("jail"));
        }
        if (card instanceof CatBalou || card instanceof Duel) {
            // Красотка и Дуэль — любой игрок без учёта расстояния.
            return others;
        }
        // «Бэнг!» — только достижимые цели.
        return others.filter((p) => game.canReach(active, p));
    };
    const targets = selectedCard ? targetsFor(selectedCard) : [];
    const canPlaySelected = selectedCard !== null && game.canPlayCard(selectedCard);

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <CardTitle>Ход игрока: {active.name}</CardTitle>
                    {active.role && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="secondary" size="sm">
                                    {active.role.name}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent>
                                <p className="font-medium">{active.role.name}</p>
                                <p className="mt-1 text-muted-foreground">
                                    Цель: {active.role.goal}
                                </p>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>
                        Оружие: {active.activeWeapon.name} (дальность{" "}
                        {active.activeWeapon.range})
                    </span>
                    <span className="font-semibold text-foreground">
                        ♥ {active.health}
                    </span>
                </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                        {game.phase === "play"
                            ? "Карты на руке — фаза розыгрыша"
                            : "Карты на руке — сбросьте лишние и передайте ход"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {active.hand.length === 0 ? (
                            <span className="text-xs text-muted-foreground">Нет карт</span>
                        ) : (
                            active.hand.map((card, index) => (
                                <Tooltip key={index}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant={
                                                selectedCard === card
                                                    ? "default"
                                                    : "outline"
                                            }
                                            className={`border-2 ${cardBorderClass(card)}`}
                                            onClick={() => selectCard(card)}
                                        >
                                            {cardLabel(card)}
                                        </Button>
                                    </TooltipTrigger>
                                    {card.description && (
                                        <TooltipContent>
                                            {card.description}
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            ))
                        )}
                    </div>
                </div>

                {selectedCard !== null && (
                    <div className="flex flex-col gap-2 rounded-lg border p-3">
                        <p className="text-xs font-medium text-muted-foreground">
                            «{cardLabel(selectedCard)}»
                        </p>

                        {choosingTarget ? (
                            <div className="flex flex-wrap gap-2">
                                {targets.length === 0 ? (
                                    <span className="text-xs text-muted-foreground">
                                        Нет достижимых целей
                                    </span>
                                ) : (
                                    targets.map((target, index) => (
                                        <Button
                                            key={index}
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => playOnTarget(target)}
                                        >
                                            {target.name} (♥ {target.health})
                                        </Button>
                                    ))
                                )}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setChoosingTarget(false)}
                                >
                                    Назад
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {game.phase === "play" ? (
                                    <>
                                        <Button
                                            size="sm"
                                            disabled={!canPlaySelected}
                                            onClick={onPlay}
                                        >
                                            Разыграть
                                        </Button>
                                        {game.canUseAnyAsStore() && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={onPlayAsStore}
                                            >
                                                Как «Магазин»
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={onDiscard}
                                    >
                                        Сбросить
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={resetSelection}
                                >
                                    Отмена
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {game.canTomKetchumHeal() && (
                    <div className="flex flex-col gap-2 rounded-lg border p-3">
                        <p className="text-xs font-medium text-muted-foreground">
                            Том Кетчум: выберите 2 карты для сброса, чтобы
                            восстановить 1 ♥ ({ketchumPick.length}/2)
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {active.hand.map((card, index) => (
                                <Button
                                    key={index}
                                    size="sm"
                                    variant={
                                        ketchumPick.includes(card)
                                            ? "default"
                                            : "outline"
                                    }
                                    className={`border-2 ${cardBorderClass(card)}`}
                                    onClick={() => toggleKetchum(card)}
                                >
                                    {cardLabel(card)}
                                </Button>
                            ))}
                        </div>
                        {ketchumPick.length === 2 && (
                            <Button
                                size="sm"
                                className="w-fit"
                                onClick={confirmKetchum}
                            >
                                Сбросить 2 → +1 ♥
                            </Button>
                        )}
                    </div>
                )}

                {game.phase === "play" ? (
                    <Button
                        variant="secondary"
                        className="w-fit"
                        onClick={endPlay}
                    >
                        Закончить розыгрыш
                    </Button>
                ) : (
                    <Button
                        variant="secondary"
                        className="w-fit"
                        onClick={passTurn}
                    >
                        Передать ход
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

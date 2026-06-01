import {
    Beer,
    CatBalou,
    Duel,
    Gatling,
    GeneralStore,
    Indians,
    Panic,
    Saloon,
    Stagecoach,
    WellsFargo,
} from "@/lib/cards/actions";
import { Bang } from "@/lib/cards/bang";
import type { Card, CardSnapshot } from "@/lib/cards/card";
import { cardFromSnapshot } from "@/lib/cards/cardRegistry";
import { Deck } from "@/lib/cards/deck";
import { createCharacters } from "@/lib/characters/character.init";
import { Equipment } from "@/lib/cards/equipment";
import { Dynamite, Jail } from "@/lib/cards/equipments";
import { Missed } from "@/lib/cards/missed";
import { Player, type PlayerSnapshot } from "@/lib/player";
import { Role, rolesForCount, type RoleKind } from "@/lib/characters/role";
import { Weapon } from "@/lib/cards/weapon";

// Карт активному игроку в начале его хода.
const TURN_DRAW_COUNT = 2;

// Взрыв динамита: пики 2–9.
function isDynamiteBlast(card: Card | null): boolean {
    return (
        !!card &&
        card.suit === "spades" &&
        typeof card.value === "number" &&
        card.value >= 2 &&
        card.value <= 9
    );
}

// Перемешать копию массива (Фишер — Йетс).
function shuffled<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

// Незавершённый выстрел «Бэнг!»/«Гатлинг», ожидающий реакции текущей цели.
export type PendingShot = {
    shooter: Player;
    target: Player;
    // Спасла ли бочка (выпала черва) — для отображения в UI.
    barrelSaved: boolean;
    // Бочка уже была разыграна в этом выстреле.
    barrelUsed: boolean;
    // Оставшиеся цели (для «Гатлинг» — выстрел по всем по очереди).
    queue: Player[];
    // Можно ли отбиться бочкой (для «Гатлинг» — да, как от обычного «Бэнг!»).
    allowBarrel: boolean;
    // Сколько «Мимо!» уже сыграно текущей целью (для Ангельских Глазок нужно 2).
    missedPlayed: number;
    // Использовал ли Человек-Без-Имени свою проверку-уклонение в этом выстреле.
    dodgeCheckUsed: boolean;
};

// «Индейцы»: каждая цель по очереди сбрасывает «Бэнг!» или теряет HP.
export type PendingIndians = {
    shooter: Player;
    target: Player;
    queue: Player[];
};

// «Паника»/«Красотка»: выбранная цель, у которой забирают/сбрасывают карту.
export type PendingSteal = {
    actor: Player;
    target: Player;
    // steal — забрать себе (Паника), discard — сбросить (Красотка).
    mode: "steal" | "discard";
};

// «Магазин»: вскрытые карты и очередь игроков, выбирающих по одной.
export type PendingStore = {
    offered: Card[];
    current: Player;
    queue: Player[];
};

// «Дуэль»: двое по очереди сбрасывают «Бэнг!»; current — чей сейчас ответ.
export type PendingDuel = {
    challenger: Player;
    current: Player;
    opponent: Player;
};

// Итог партии: победившая сторона и игрок-«герой» для поздравления.
export type GameResult = {
    winner: Player;
    side: string;
};

// Счастливчик Люк: вскрыты 2 карты, игрок выбирает одну для проверки.
export type PendingLuckyCheck = {
    kind: "barrel" | "dodge" | "dynamite" | "jail";
    options: Card[];
};

// Особый набор карт в фазе набора, ожидающий выбора игрока.
// kitCarson — выбрать, какую из 3 вернуть наверх; jesseJames — выбрать соперника;
// tuco — подтвердить взятие из сброса либо обычный набор.
export type PendingDraw =
    | { kind: "kitCarson"; revealed: Card[] }
    | { kind: "jesseJames" }
    | { kind: "tuco" };

// Фаза хода активного игрока.
// play — розыгрыш карт; discard — добровольный сброс лишних карт перед передачей хода.
export type TurnPhase = "play" | "discard";

// Сериализованное представление игры для localStorage.
export type GameSnapshot = {
    players: PlayerSnapshot[];
    activePlayerIndex: number;
    deck: CardSnapshot[];
    discard: CardSnapshot[];
    history: string[];
    phase: TurnPhase;
};

export class Game {
    public players: Player[];
    public activePlayer: Player;
    public deck: Deck<Card>;
    // Текущий незавершённый выстрел (ожидает реакции цели), либо null.
    public pendingShot: PendingShot | null = null;
    // Незавершённые «Индейцы» (ожидают реакции текущей цели), либо null.
    public pendingIndians: PendingIndians | null = null;
    // Незавершённая «Паника»/«Красотка» (ожидает выбора карты), либо null.
    public pendingSteal: PendingSteal | null = null;
    // Незавершённый «Магазин» (игроки разбирают карты), либо null.
    public pendingStore: PendingStore | null = null;
    // Незавершённая «Дуэль» (ожидает ответа текущего участника), либо null.
    public pendingDuel: PendingDuel | null = null;
    // Игрок, которому нужно проверить динамит в начале хода (до набора), либо null.
    public pendingDynamite: Player | null = null;
    // Игрок, которому нужно проверить тюрьму в начале хода, либо null.
    public pendingJail: Player | null = null;
    // Незавершённый особый набор карт (Кит Карсон/Джесси Джеймс/Туко), либо null.
    public pendingDraw: PendingDraw | null = null;
    // Незавершённый выбор карты проверки Счастливчиком Люком, либо null.
    public pendingLuckyCheck: PendingLuckyCheck | null = null;
    // Игрок на грани смерти (0 HP), которому предложено спастись Пивом.
    public pendingDeath: Player | null = null;
    // Кто нанёс смертельный удар игроку на грани смерти (для награды за бандита).
    private pendingDeathKiller: Player | null = null;
    // Лог хода игры (для отчёта партии).
    public history: string[] = [];
    // Буфер недавних смертей для UI-уведомлений (не сериализуется).
    public recentDeaths: { name: string; role: string }[] = [];
    // Итог партии (после выполнения цели одной из сторон), либо null.
    public result: GameResult | null = null;
    // Текущая фаза хода: розыгрыш карт либо сброс лишних.
    public phase: TurnPhase = "play";
    // Нужно ли добрать карту хода после разрешения отложенных проверок.
    private turnDrawPending = false;

    constructor(players: Player[], deck: Deck<Card>) {
        this.players = players;
        this.activePlayer = players[0];
        this.deck = deck;
    }

    // Запись в лог партии.
    public log(message: string): void {
        this.history.push(message);
    }

    // Случайно раздаёт роли и персонажей. Шериф получает +1 к макс. здоровью.
    // Стартовое здоровье берётся из персонажа.
    public dealRolesAndCharacters(): void {
        const roles = shuffled(rolesForCount(this.players.length));
        const characters = shuffled(createCharacters());

        this.players.forEach((player, i) => {
            const roleKind: RoleKind = roles[i] ?? "outlaw";
            player.role = new Role(roleKind);
            player.character = characters[i % characters.length];

            // Здоровье = здоровью персонажа (+1 шерифу).
            const base =
                player.character.health + (roleKind === "sheriff" ? 1 : 0);
            player.maxHealth = base;
            player.health = base;

            this.log(
                `${player.name}: роль «${player.role.name}», персонаж «${player.character.name}» (${base} ♥)`,
            );
        });

        // Ход начинает шериф.
        const sheriff = this.players.find((p) => p.role?.kind === "sheriff");
        if (sheriff) this.activePlayer = sheriff;
    }

    // Начальная раздача: тасуем колоду и даём каждому игроку карт по числу
    // его здоровья (раздаётся после ролей/персонажей, когда здоровье задано).
    public dealInitialHands(): void {
        this.deck.shuffle();
        for (const player of this.players) {
            player.hand.push(...this.deck.draw(player.health));
        }
    }

    // Начало хода активного игрока: сброс счётчика «Бэнг!»,
    // проверки динамита/тюрьмы (до набора), затем добор карты.
    public startTurn(): void {
        this.activePlayer.bangsPlayedThisTurn = 0;
        this.activePlayer.usedAnyAsStore = false;
        this.turnDrawPending = true;
        this.phase = "play";
        this.log(`— Ход игрока ${this.activePlayer.name} —`);
        // Динамит проверяется первым (до набора).
        if (this.activePlayer.hasEquipment("dynamite")) {
            this.pendingDynamite = this.activePlayer;
            return;
        }
        this.afterDynamitePhase();
    }

    // После фазы динамита: проверка тюрьмы либо добор карты.
    private afterDynamitePhase(): void {
        if (this.pendingDeath) return; // ждём разрешения грани смерти
        if (this.activePlayer.hasEquipment("jail")) {
            this.pendingJail = this.activePlayer;
            return;
        }
        this.drawTurnCard();
    }

    // Добор карты(карт) фазы набора с учётом способностей персонажа.
    private drawTurnCard(): void {
        if (!this.turnDrawPending) return;
        const player = this.activePlayer;
        const special = player.character?.specialDraw;

        // Интерактивные особые наборы — ждут выбора в UI.
        if (special === "kitCarson") {
            const revealed = this.deck.draw(3);
            if (revealed.length > 0) {
                this.turnDrawPending = false;
                this.pendingDraw = { kind: "kitCarson", revealed };
                return;
            }
        } else if (special === "jesseJames") {
            // Доступен выбор, только если есть соперник с картами на руке.
            if (this.otherLivingPlayers(player).some((p) => p.hand.length > 0)) {
                this.turnDrawPending = false;
                this.pendingDraw = { kind: "jesseJames" };
                return;
            }
        } else if (special === "tuco") {
            if (this.deck.getDiscard().length > 0) {
                this.turnDrawPending = false;
                this.pendingDraw = { kind: "tuco" };
                return;
            }
        }

        // Обычный набор.
        this.turnDrawPending = false;
        player.hand.push(...this.deck.draw(TURN_DRAW_COUNT));
        this.applyMadDogBonus(player);
    }

    // Бешеный Пёс: вскрывает последнюю добранную карту; черва/бубна — ещё одна.
    private applyMadDogBonus(player: Player): void {
        if (!player.character?.revealSecondDrawBonus) return;
        const last = player.hand[player.hand.length - 1];
        if (last && (last.suit === "hearts" || last.suit === "diamonds")) {
            player.hand.push(...this.deck.draw(1));
            this.log(
                `Бешеный Пёс (${player.name}): вскрыта ${last.name} (${last.suit === "hearts" ? "черва" : "бубна"}) — берёт ещё карту`,
            );
        }
    }

    // --- Особый набор карт (Кит Карсон / Джесси Джеймс / Туко) -----------

    // Кит Карсон: оставить 2 из 3 вскрытых, выбранную вернуть наверх колоды.
    public kitCarsonResolve(returned: Card): void {
        const pd = this.pendingDraw;
        if (!pd || pd.kind !== "kitCarson") return;
        const kept = pd.revealed.filter((c) => c !== returned);
        this.activePlayer.hand.push(...kept);
        this.deck.putOnTop(returned);
        this.pendingDraw = null;
        this.log(`Кит Карсон (${this.activePlayer.name}) оставил 2 карты, 1 вернул в колоду`);
    }

    // Джесси Джеймс: взять первую карту с руки выбранного соперника, добрать остаток из колоды.
    public jesseJamesResolve(target: Player): void {
        const pd = this.pendingDraw;
        if (!pd || pd.kind !== "jesseJames") return;
        const me = this.activePlayer;
        if (target !== me && target.hand.length > 0) {
            const idx = Math.floor(Math.random() * target.hand.length);
            const [stolen] = target.hand.splice(idx, 1);
            me.hand.push(stolen);
            this.log(`Джесси Джеймс (${me.name}) берёт карту с руки ${target.name}`);
            // Остаток фазы набора — из колоды.
            me.hand.push(...this.deck.draw(TURN_DRAW_COUNT - 1));
        } else {
            me.hand.push(...this.deck.draw(TURN_DRAW_COUNT));
        }
        this.pendingDraw = null;
    }

    // Джесси Джеймс/Туко: отказаться от способности и набрать обычным образом.
    public specialDrawFromDeck(): void {
        const pd = this.pendingDraw;
        if (!pd) return;
        this.pendingDraw = null;
        this.activePlayer.hand.push(...this.deck.draw(TURN_DRAW_COUNT));
        this.applyMadDogBonus(this.activePlayer);
    }

    // Туко: первую карту взять с верха стопки сброса, остаток — из колоды.
    public tucoResolve(): void {
        const pd = this.pendingDraw;
        if (!pd || pd.kind !== "tuco") return;
        const me = this.activePlayer;
        const top = this.deck.takeFromDiscardTop();
        if (top) {
            me.hand.push(top);
            this.log(`Туко (${me.name}) берёт ${top.name} из сброса`);
            me.hand.push(...this.deck.draw(TURN_DRAW_COUNT - 1));
        } else {
            me.hand.push(...this.deck.draw(TURN_DRAW_COUNT));
        }
        this.pendingDraw = null;
    }

    // Том Кетчум: сбросить 2 карты с руки, чтобы восстановить 1 ♥.
    public canTomKetchumHeal(): boolean {
        const me = this.activePlayer;
        return (
            !this.isBusy &&
            !!me.character?.discardTwoToHeal &&
            me.canHeal &&
            me.hand.length >= 2
        );
    }

    public tomKetchumHeal(a: Card, b: Card): void {
        const me = this.activePlayer;
        if (!this.canTomKetchumHeal() || a === b) return;
        const ia = me.hand.indexOf(a);
        const ib = me.hand.indexOf(b);
        if (ia === -1 || ib === -1) return;
        me.hand = me.hand.filter((c) => c !== a && c !== b);
        this.deck.discard(a, b);
        me.heal(1);
        this.log(`Том Кетчум (${me.name}) сбрасывает 2 карты и восстанавливает 1 ♥`);
    }

    // Передаёт ход следующему живому игроку по кругу и начинает его ход.
    public nextPlayer(): Player {
        if (this.isBusy || this.result) return this.activePlayer;
        // Перед сменой хода проверяем, не выполнена ли чья-то цель.
        if (this.checkWinConditions()) return this.activePlayer;
        const alive = this.players;
        const currentIndex = alive.indexOf(this.activePlayer);
        let nextIndex = (currentIndex + 1) % alive.length;
        while (!alive[nextIndex].isAlive && nextIndex !== currentIndex) {
            nextIndex = (nextIndex + 1) % alive.length;
        }
        this.activePlayer = alive[nextIndex];
        this.startTurn();
        return this.activePlayer;
    }

    // Дистанция от shooter до target с учётом снаряжения (Мустанг/Прицел).
    public distanceBetween(shooter: Player, target: Player): number {
        const living = this.players.filter((p) => p.isAlive);
        const from = living.indexOf(shooter);
        const to = living.indexOf(target);
        if (from === -1 || to === -1) return Infinity;

        const diff = Math.abs(from - to);
        let distance = Math.min(diff, living.length - diff);

        // Мустанг цели увеличивает дистанцию до неё.
        distance += target.equipment.filter((e) => e.kind === "mustang").length;
        // Неуловимый Джо: для всех соперников на +1 дальше.
        if (target.character?.extraDistance) distance += 1;
        // Прицел стрелка уменьшает дистанцию до остальных.
        distance -= shooter.equipment.filter((e) => e.kind === "scope").length;
        // Хладнокровная Рози: все соперники для неё на 1 ближе.
        if (shooter.character?.closerDistance) distance -= 1;

        return Math.max(1, distance);
    }

    // Достижима ли цель для выстрела (дистанция в пределах дальности оружия).
    public canReach(shooter: Player, target: Player): boolean {
        return this.distanceBetween(shooter, target) <= shooter.activeWeapon.range;
    }

    // Можно ли активному игроку сыграть ещё один «Бэнг!» в этом ходу.
    public canPlayBang(): boolean {
        const p = this.activePlayer;
        return (
            p.activeWeapon.unlimitedBang ||
            !!p.character?.unlimitedBang ||
            p.bangsPlayedThisTurn === 0
        );
    }

    // Идёт ли разрешение какого-либо отложенного эффекта (блокирует новые ходы).
    public get isBusy(): boolean {
        return (
            this.pendingShot !== null ||
            this.pendingIndians !== null ||
            this.pendingSteal !== null ||
            this.pendingStore !== null ||
            this.pendingDuel !== null ||
            this.pendingDynamite !== null ||
            this.pendingJail !== null ||
            this.pendingDraw !== null ||
            this.pendingLuckyCheck !== null ||
            this.pendingDeath !== null
        );
    }

    // Считается ли карта «Бэнг!» для активного игрока
    // (Бедовая Джейн может играть «Мимо!» как «Бэнг!»).
    public isBangLike(card: Card, player: Player = this.activePlayer): boolean {
        if (card instanceof Bang) return true;
        return !!player.character?.missedAsBang && card instanceof Missed;
    }

    // Карта, требующая выбор цели среди других игроков.
    public needsTarget(card: Card): boolean {
        return (
            this.isBangLike(card) ||
            card instanceof Panic ||
            card instanceof CatBalou ||
            card instanceof Duel ||
            card instanceof Jail
        );
    }

    // Можно ли посадить цель в тюрьму (не себя, не шериф, не уже в тюрьме).
    public canJail(target: Player): boolean {
        return (
            target !== this.activePlayer &&
            target.isAlive &&
            target.role?.kind !== "sheriff" &&
            !target.hasEquipment("jail")
        );
    }

    // Розыгрыш карты с руки активного игрока.
    public playCard(card: Card, target?: Player): void {
        if (this.isBusy || this.phase !== "play") return;
        const player = this.activePlayer;
        const index = player.hand.indexOf(card);
        if (index === -1) return;

        // «Мимо!» обычно нельзя разыграть активно — кроме Бедовой Джейн,
        // которая играет его как «Бэнг!».
        if (card instanceof Missed && !this.isBangLike(card, player)) return;

        this.log(
            `${player.name} разыгрывает «${card.name}»${target ? ` → ${target.name}` : ""}`,
        );

        if (card instanceof Weapon) {
            player.hand.splice(index, 1);
            this.equipWeapon(player, card);
            this.onCardEntersPlay(player, card);
            return;
        }

        if (card instanceof Jail) {
            if (!target || !this.canJail(target)) return;
            player.hand.splice(index, 1);
            target.equipment.push(card);
            this.log(`${player.name} сажает ${target.name} в тюрьму`);
            this.onCardEntersPlay(player, card);
            return;
        }

        if (card instanceof Equipment) {
            player.hand.splice(index, 1);
            this.equipEquipment(player, card);
            this.onCardEntersPlay(player, card);
            return;
        }

        if (this.isBangLike(card, player)) {
            if (!target || !this.canReach(player, target) || !this.canPlayBang()) {
                return;
            }
            player.hand.splice(index, 1);
            this.deck.discard(card);
            player.bangsPlayedThisTurn += 1;
            this.startShot(player, [target], true);
            return;
        }

        if (card instanceof Gatling) {
            player.hand.splice(index, 1);
            this.deck.discard(card);
            this.startShot(player, this.otherLivingPlayers(player), true);
            return;
        }

        if (card instanceof Indians) {
            player.hand.splice(index, 1);
            this.deck.discard(card);
            this.startIndians(player, this.otherLivingPlayers(player));
            return;
        }

        if (card instanceof Panic) {
            if (!target || this.distanceBetween(player, target) > 1) return;
            player.hand.splice(index, 1);
            this.deck.discard(card);
            this.pendingSteal = { actor: player, target, mode: "steal" };
            return;
        }

        if (card instanceof CatBalou) {
            if (!target) return;
            player.hand.splice(index, 1);
            this.deck.discard(card);
            this.pendingSteal = { actor: player, target, mode: "discard" };
            return;
        }

        if (card instanceof Saloon) {
            player.hand.splice(index, 1);
            this.deck.discard(card);
            for (const p of this.players) {
                if (p.isAlive) p.heal(1);
            }
            return;
        }

        if (card instanceof GeneralStore) {
            player.hand.splice(index, 1);
            this.deck.discard(card);
            this.startStore(player);
            return;
        }

        if (card instanceof Duel) {
            if (!target) return;
            player.hand.splice(index, 1);
            this.deck.discard(card);
            // Первым отвечает вызванный игрок.
            this.pendingDuel = { challenger: player, current: target, opponent: player };
            return;
        }

        if (card instanceof Beer) {
            // Пиво бесполезно при полном здоровье — не разыгрываем.
            if (!player.canHeal) return;
            player.hand.splice(index, 1);
            this.deck.discard(card);
            player.heal(1);
            return;
        }

        if (card instanceof Stagecoach) {
            player.hand.splice(index, 1);
            this.deck.discard(card);
            player.hand.push(...this.deck.draw(2));
            return;
        }

        if (card instanceof WellsFargo) {
            player.hand.splice(index, 1);
            this.deck.discard(card);
            player.hand.push(...this.deck.draw(3));
            return;
        }

        // Прочие карты пока просто уходят в сброс.
        player.hand.splice(index, 1);
        this.deck.discard(card);
    }

    private otherLivingPlayers(player: Player): Player[] {
        return this.players.filter((p) => p !== player && p.isAlive);
    }

    // Дядя Уилл: может ли активный игрок сыграть карту как «Магазин» в этом ходу.
    public canUseAnyAsStore(): boolean {
        return (
            !this.isBusy &&
            !!this.activePlayer.character?.anyCardAsGeneralStore &&
            !this.activePlayer.usedAnyAsStore
        );
    }

    // Сыграть любую карту с руки как «Магазин» (способность Дяди Уилла).
    public playAsGeneralStore(card: Card): void {
        if (!this.canUseAnyAsStore()) return;
        const player = this.activePlayer;
        const index = player.hand.indexOf(card);
        if (index === -1) return;
        player.hand.splice(index, 1);
        this.deck.discard(card);
        player.usedAnyAsStore = true;
        this.log(`${player.name} играет «${card.name}» как «Магазин» (Дядя Уилл)`);
        this.startStore(player);
    }

    // Цели, у которых можно что-то забрать/сбросить (есть хотя бы одна карта).
    private hasAnyCard(player: Player): boolean {
        return (
            player.hand.length > 0 ||
            player.equipment.length > 0 ||
            (player.weapon !== null && !player.weapon.isDefault)
        );
    }

    // Можно ли разыграть карту прямо сейчас (для UI / блокировки кнопки).
    public canPlayCard(card: Card): boolean {
        if (this.isBusy) return false;
        const me = this.activePlayer;
        if (this.isBangLike(card, me)) {
            if (!this.canPlayBang()) return false;
            return this.players.some((p) => p !== me && this.canReach(me, p));
        }
        // «Мимо!» (не у Бедовой Джейн) — только реакция, активно не разыгрывается.
        if (card instanceof Missed) return false;
        if (card instanceof Panic) {
            return this.players.some(
                (p) => p !== me && p.isAlive && this.distanceBetween(me, p) <= 1 && this.hasAnyCard(p),
            );
        }
        if (card instanceof CatBalou) {
            return this.players.some((p) => p !== me && p.isAlive && this.hasAnyCard(p));
        }
        if (card instanceof Jail) {
            return this.players.some((p) => this.canJail(p));
        }
        if (
            card instanceof Gatling ||
            card instanceof Indians ||
            card instanceof Duel
        ) {
            return this.otherLivingPlayers(me).length > 0;
        }
        if (card instanceof Beer) {
            // Пиво — только когда здоровье ниже максимума.
            return me.canHeal;
        }
        if (card instanceof Saloon) {
            // Салун имеет смысл, если хоть кто-то может вылечиться.
            return this.players.some((p) => p.isAlive && p.canHeal);
        }
        // Магазин, снаряжение, оружие и прочее можно сыграть всегда.
        return true;
    }

    // Лишние карты сверх лимита (карт на руке не больше здоровья) в конце хода.
    public excessCards(player: Player = this.activePlayer): number {
        return Math.max(0, player.hand.length - player.health);
    }

    // Завершить фазу розыгрыша и перейти к фазе сброса лишних карт.
    public endPlayPhase(): void {
        if (this.isBusy || this.phase !== "play") return;
        this.phase = "discard";
        this.log(`${this.activePlayer.name} завершает розыгрыш`);
    }

    // Сбросить лишнюю карту с руки. Доступно только в фазе сброса.
    public discardFromHand(card: Card): void {
        if (this.isBusy || this.phase !== "discard") return;
        const player = this.activePlayer;
        const index = player.hand.indexOf(card);
        if (index === -1) return;
        player.hand.splice(index, 1);
        this.deck.discard(card);
    }

    // Выставить оружие: прежнее (если это не Кольт) уходит в сброс.
    private equipWeapon(player: Player, weapon: Weapon): void {
        if (player.weapon !== null && !player.weapon.isDefault) {
            this.deck.discard(player.weapon);
        }
        player.weapon = weapon;
    }

    // Джонни Киш: когда он вводит синюю карту в игру (снаряжение/оружие),
    // одноимённые карты сбрасываются из зон снаряжения/оружия ДРУГИХ игроков.
    // Своя зона Джонни и любые руки не затрагиваются.
    private onCardEntersPlay(player: Player, card: Card): void {
        if (!player.character?.discardSameName) return;
        for (const p of this.players) {
            // Зону самого Джонни не трогаем.
            if (p === player) continue;
            // Одноимённое снаряжение у другого игрока (кроме только что выложенной карты).
            const kept: Equipment[] = [];
            for (const eq of p.equipment) {
                if (eq.name === card.name && eq !== card) {
                    this.deck.discard(eq);
                    this.log(`Джонни Киш: «${eq.name}» у ${p.name} сброшено из игры`);
                } else {
                    kept.push(eq);
                }
            }
            p.equipment = kept;
            // Одноимённое оружие у другого игрока.
            if (p.weapon && p.weapon.name === card.name && p.weapon !== card) {
                this.deck.discard(p.weapon);
                this.log(`Джонни Киш: «${p.weapon.name}» у ${p.name} сброшено из игры`);
                p.weapon = null;
            }
        }
    }

    // Выставить снаряжение: дубликат того же типа уходит в сброс.
    private equipEquipment(player: Player, equipment: Equipment): void {
        const existing = player.equipment.find((e) => e.kind === equipment.kind);
        if (existing) {
            this.deck.discard(existing);
            player.equipment = player.equipment.filter((e) => e !== existing);
        }
        player.equipment.push(equipment);
    }

    // --- Разрешение выстрела «Бэнг!»/«Гатлинг» ---------------------------

    private startShot(shooter: Player, targets: Player[], allowBarrel: boolean): void {
        const [first, ...rest] = targets;
        if (!first) return;
        this.pendingShot = {
            shooter,
            target: first,
            barrelSaved: false,
            barrelUsed: false,
            queue: rest,
            allowBarrel,
            missedPlayed: 0,
            dodgeCheckUsed: false,
        };
    }

    // Перейти к следующей цели в очереди выстрела, либо завершить эффект.
    private advanceShot(): void {
        const shot = this.pendingShot;
        if (!shot) return;
        const next = shot.queue.shift();
        if (next) {
            this.pendingShot = {
                shooter: shot.shooter,
                target: next,
                barrelSaved: false,
                barrelUsed: false,
                queue: shot.queue,
                allowBarrel: shot.allowBarrel,
                missedPlayed: 0,
                dodgeCheckUsed: false,
            };
        } else {
            this.pendingShot = null;
        }
    }

    // Сколько «Мимо!» нужно цели, чтобы отбиться (Ангельские Глазки — 2).
    public missedRequired(target: Player): number {
        return target.character?.requiresTwoMissed ? 2 : 1;
    }

    // Карта проверки (Бочка/Тюрьма/Динамит/уклонение). Счастливчик Люк
    // Начинает проверку. Для Счастливчика Люка вскрывает 2 карты и ставит
    // паузу (pendingLuckyCheck) — карту выберет игрок. Возвращает true, если
    // проверка приостановлена (UI должен дождаться выбора).
    // Иначе тянет 1 карту, кладёт в сброс и вызывает apply(card).
    private beginCheck(
        player: Player,
        kind: PendingLuckyCheck["kind"],
        apply: (card: Card | null) => void,
    ): boolean {
        if (player.character?.luckyCheck) {
            const options = this.deck.draw(2);
            if (options.length > 0) {
                this.pendingLuckyCheck = { kind, options };
                this.log(
                    `Счастливчик Люк (${player.name}) вскрывает 2 карты при проверке`,
                );
                return true;
            }
        }
        const [drawn] = this.deck.draw(1);
        if (drawn) this.deck.discard(drawn);
        apply(drawn ?? null);
        return false;
    }

    // Игрок-Счастливчик выбрал карту проверки — применяем выбор.
    public resolveLuckyCheck(chosen: Card): void {
        const pending = this.pendingLuckyCheck;
        if (!pending) return;
        // Невыбранные карты уходят в сброс; выбранная тоже (проверка её «открывает»).
        for (const c of pending.options) this.deck.discard(c);
        this.pendingLuckyCheck = null;
        switch (pending.kind) {
            case "barrel":
                this.applyBarrelCheck(chosen);
                break;
            case "dodge":
                this.applyDodgeCheck(chosen);
                break;
            case "dynamite":
                this.applyDynamiteCheck(chosen);
                break;
            case "jail":
                this.applyJailCheck(chosen);
                break;
        }
    }

    // Может ли текущая цель отбиться бочкой.
    public canUseBarrel(): boolean {
        const shot = this.pendingShot;
        return (
            !!shot &&
            shot.allowBarrel &&
            !shot.barrelUsed &&
            shot.target.hasEquipment("barrel")
        );
    }

    // Цель тянет карту из бочки. Для Счастливчика Люка — пауза на выбор карты.
    // Возвращает вытянутую карту, либо null (в т.ч. когда ждём выбор Люка).
    public useBarrel(): Card | null {
        if (!this.canUseBarrel()) return null;
        const shot = this.pendingShot!;
        shot.barrelUsed = true;
        const captured: { card: Card | null } = { card: null };
        this.beginCheck(shot.target, "barrel", (card) => {
            captured.card = card;
            this.applyBarrelCheck(card);
        });
        return captured.card;
    }

    // Применить результат проверки бочки: черва засчитывается как «Мимо!».
    private applyBarrelCheck(card: Card | null): void {
        const shot = this.pendingShot;
        if (!shot) return;
        if (card && card.suit === "hearts") {
            shot.missedPlayed += 1;
            if (shot.missedPlayed >= this.missedRequired(shot.target)) {
                shot.barrelSaved = true;
            }
        }
    }

    // Человек-Без-Имени: проверка-уклонение. Черва — попадание отменяется.
    public canUseDodgeCheck(): boolean {
        const shot = this.pendingShot;
        return (
            !!shot &&
            !shot.dodgeCheckUsed &&
            !!shot.target.character?.dodgeCheckHearts
        );
    }

    public useDodgeCheck(): { card: Card | null; dodged: boolean; pending: boolean } {
        if (!this.canUseDodgeCheck())
            return { card: null, dodged: false, pending: false };
        const shot = this.pendingShot!;
        shot.dodgeCheckUsed = true;
        const captured: { card: Card | null } = { card: null };
        const paused = this.beginCheck(shot.target, "dodge", (card) => {
            captured.card = card;
            this.applyDodgeCheck(card);
        });
        const dodged = captured.card?.suit === "hearts";
        return { card: captured.card, dodged, pending: paused };
    }

    // Применить результат проверки-уклонения: черва отменяет попадание.
    private applyDodgeCheck(card: Card | null): void {
        const shot = this.pendingShot;
        if (!shot) return;
        if (card && card.suit === "hearts") {
            this.log(`${shot.target.name} (Человек-Без-Имени) уклоняется проверкой`);
            this.advanceShot();
        }
    }

    // Карты, которыми цель может отбиться («Мимо!»; для Бедовой Джейн — и «Бэнг!»).
    public dodgeCards(target: Player): Card[] {
        return target.hand.filter(
            (c) =>
                c instanceof Missed ||
                (target.character?.missedAsBang && c instanceof Bang),
        );
    }

    // Цель играет «Мимо!» (или «Бэнг!» как «Мимо!»). Для Ангельских Глазок нужно 2.
    public playMissed(card: Card): void {
        const shot = this.pendingShot;
        if (!shot) return;
        const isDodge =
            card instanceof Missed ||
            (shot.target.character?.missedAsBang && card instanceof Bang);
        if (!isDodge) return;
        const index = shot.target.hand.indexOf(card);
        if (index === -1) return;
        shot.target.hand.splice(index, 1);
        this.deck.discard(card);
        shot.missedPlayed += 1;
        this.log(`${shot.target.name} отбивается «${card.name}»`);
        if (shot.missedPlayed >= this.missedRequired(shot.target)) {
            this.advanceShot();
        }
    }

    // Цель не отбивается — получает урон. Возможна гибель (или спасение Пивом).
    public resolveShot(): void {
        const shot = this.pendingShot;
        if (!shot) return;
        const target = shot.target;
        if (shot.barrelSaved) {
            this.advanceShot();
            return;
        }
        const shooter = shot.shooter;
        this.advanceShot();
        this.dealDamage(target, 1, `выстрел от ${shooter.name}`, shooter);
    }

    // Спасён бочкой — переходим к следующей цели.
    public dismissShot(): void {
        this.advanceShot();
    }

    // --- «Индейцы» -------------------------------------------------------

    private startIndians(shooter: Player, targets: Player[]): void {
        const [first, ...rest] = targets;
        if (!first) return;
        this.pendingIndians = { shooter, target: first, queue: rest };
    }

    private advanceIndians(): void {
        const ind = this.pendingIndians;
        if (!ind) return;
        const next = ind.queue.shift();
        if (next) {
            this.pendingIndians = { shooter: ind.shooter, target: next, queue: ind.queue };
        } else {
            this.pendingIndians = null;
        }
    }

    // Цель «Индейцев» сбрасывает «Бэнг!» — урона нет.
    public indiansDiscardBang(card: Bang): void {
        const ind = this.pendingIndians;
        if (!ind) return;
        const index = ind.target.hand.indexOf(card);
        if (index === -1) return;
        ind.target.hand.splice(index, 1);
        this.deck.discard(card);
        this.advanceIndians();
    }

    // Цель «Индейцев» не сбрасывает «Бэнг!» — теряет 1 HP.
    public indiansTakeHit(): void {
        const ind = this.pendingIndians;
        if (!ind) return;
        const target = ind.target;
        const shooter = ind.shooter;
        this.advanceIndians();
        this.dealDamage(target, 1, "Индейцы", shooter);
    }

    // --- «Паника»/«Красотка» --------------------------------------------

    // Забрать/сбросить случайную карту с руки цели.
    public stealFromHand(): Card | null {
        const steal = this.pendingSteal;
        if (!steal || steal.target.hand.length === 0) return null;
        // Случайная карта с руки (по индексу, чтобы зависеть только от размера руки).
        const idx = Math.floor(Math.random() * steal.target.hand.length);
        const [card] = steal.target.hand.splice(idx, 1);
        this.applySteal(card);
        return card;
    }

    // Забрать/сбросить выставленное оружие цели.
    public stealWeapon(): Card | null {
        const steal = this.pendingSteal;
        if (!steal || !steal.target.weapon || steal.target.weapon.isDefault) {
            return null;
        }
        const card = steal.target.weapon;
        steal.target.weapon = null;
        this.applySteal(card);
        return card;
    }

    // Забрать/сбросить выбранное снаряжение цели.
    public stealEquipment(equipment: Equipment): Card | null {
        const steal = this.pendingSteal;
        if (!steal) return null;
        const index = steal.target.equipment.indexOf(equipment);
        if (index === -1) return null;
        steal.target.equipment.splice(index, 1);
        this.applySteal(equipment);
        return equipment;
    }

    // Применить результат: забрать себе (Паника) либо сбросить (Красотка).
    private applySteal(card: Card): void {
        const steal = this.pendingSteal!;
        if (steal.mode === "steal") {
            steal.actor.hand.push(card);
        } else {
            this.deck.discard(card);
        }
        this.pendingSteal = null;
    }

    // --- «Магазин» -------------------------------------------------------

    private startStore(starter: Player): void {
        const order = this.livingFrom(starter);
        const offered = this.deck.draw(order.length);
        const [current, ...queue] = order;
        this.pendingStore = { offered, current, queue };
    }

    // Текущий игрок «Магазина» забирает выбранную карту.
    public takeFromStore(card: Card): Card | null {
        const store = this.pendingStore;
        if (!store) return null;
        const index = store.offered.indexOf(card);
        if (index === -1) return null;
        store.offered.splice(index, 1);
        store.current.hand.push(card);

        const next = store.queue.shift();
        if (next && store.offered.length > 0) {
            store.current = next;
        } else {
            this.pendingStore = null;
        }
        return card;
    }

    // Живые игроки по кругу, начиная с указанного.
    private livingFrom(starter: Player): Player[] {
        const living = this.players.filter((p) => p.isAlive);
        const start = living.indexOf(starter);
        if (start === -1) return living;
        return [...living.slice(start), ...living.slice(0, start)];
    }

    // --- «Дуэль» ---------------------------------------------------------

    // Текущий участник дуэли сбрасывает «Бэнг!» — ход переходит сопернику.
    public duelPlayBang(card: Bang): void {
        const duel = this.pendingDuel;
        if (!duel) return;
        const index = duel.current.hand.indexOf(card);
        if (index === -1) return;
        duel.current.hand.splice(index, 1);
        this.deck.discard(card);
        // Меняем местами: отвечать должен соперник.
        this.pendingDuel = {
            challenger: duel.challenger,
            current: duel.opponent,
            opponent: duel.current,
        };
    }

    // Текущий участник не сбрасывает «Бэнг!» — теряет 1 HP, дуэль завершена.
    public duelGiveUp(): void {
        const duel = this.pendingDuel;
        if (!duel) return;
        const loser = duel.current;
        const winner = duel.opponent;
        this.pendingDuel = null;
        this.dealDamage(loser, 1, "Дуэль", winner);
    }

    // --- «Динамит» -------------------------------------------------------

    // Проверка динамита в начале хода. Возвращает вытянутую карту и факт взрыва.
    public resolveDynamite(): { card: Card | null; exploded: boolean } {
        const player = this.pendingDynamite;
        this.pendingDynamite = null;
        if (!player) return { card: null, exploded: false };

        const dynamite = player.equipment.find((e) => e instanceof Dynamite);
        if (!dynamite) {
            this.afterDynamitePhase();
            return { card: null, exploded: false };
        }

        const captured: { card: Card | null } = { card: null };
        this.beginCheck(player, "dynamite", (card) => {
            captured.card = card;
            this.applyDynamiteCheck(card);
        });
        const exploded = isDynamiteBlast(captured.card);
        return { card: captured.card, exploded };
    }

    // Применить результат проверки динамита (игрок — активный).
    private applyDynamiteCheck(card: Card | null): void {
        const player = this.activePlayer;
        const dynamite = player.equipment.find((e) => e instanceof Dynamite);
        if (!dynamite) {
            this.afterDynamitePhase();
            return;
        }

        if (isDynamiteBlast(card)) {
            player.equipment = player.equipment.filter((e) => e !== dynamite);
            this.deck.discard(dynamite);
            this.log(`Динамит взорвался у ${player.name}`);
            this.dealDamage(player, 3, "Динамит");
            if (this.pendingDeath === player) return;
            if (player.isAlive) this.afterDynamitePhase();
            else this.turnDrawPending = false;
            return;
        }

        // Безопасно: динамит уходит следующему по часовой стрелке.
        player.equipment = player.equipment.filter((e) => e !== dynamite);
        const next = this.clockwiseFrom(player);
        if (next) next.equipment.push(dynamite as Equipment);
        this.log(`Динамит у ${player.name} не сработал и перешёл к ${next?.name ?? "?"}`);
        this.afterDynamitePhase();
    }

    // --- «Тюрьма» --------------------------------------------------------

    // Проверка тюрьмы в начале хода. Возвращает вытянутую карту и факт освобождения.
    public resolveJail(): { card: Card | null; freed: boolean } {
        const player = this.pendingJail;
        this.pendingJail = null;
        if (!player) return { card: null, freed: false };

        const jail = player.equipment.find((e) => e instanceof Jail);
        if (!jail) {
            this.drawTurnCard();
            return { card: null, freed: false };
        }

        // Тюрьма всегда уходит в сброс после проверки.
        player.equipment = player.equipment.filter((e) => e !== jail);
        this.deck.discard(jail);

        const captured: { card: Card | null } = { card: null };
        this.beginCheck(player, "jail", (card) => {
            captured.card = card;
            this.applyJailCheck(card);
        });
        const freed = captured.card?.suit === "hearts";
        return { card: captured.card, freed };
    }

    // Применить результат проверки тюрьмы (игрок — активный).
    private applyJailCheck(card: Card | null): void {
        const player = this.activePlayer;
        const freed = !!card && card.suit === "hearts";
        if (freed) {
            this.log(`${player.name} выходит из тюрьмы и продолжает ход`);
            this.drawTurnCard();
        } else {
            // Ход пропускается: набора нет, ход переходит дальше.
            this.log(`${player.name} пропускает ход (тюрьма)`);
            this.turnDrawPending = false;
            this.passTurnAfterJail();
        }
    }

    // Передать ход дальше после пропуска по тюрьме.
    private passTurnAfterJail(): void {
        const alive = this.players;
        const currentIndex = alive.indexOf(this.activePlayer);
        let nextIndex = (currentIndex + 1) % alive.length;
        while (!alive[nextIndex].isAlive && nextIndex !== currentIndex) {
            nextIndex = (nextIndex + 1) % alive.length;
        }
        this.activePlayer = alive[nextIndex];
        this.startTurn();
    }

    // Постоянные пассивки, которые проверяются после каждого действия.
    // Сюзи Лафайет: оставшись без карт, немедленно берёт карту из колоды.
    // Срабатывает только в фазе розыгрыша (не во время сброса лишних карт).
    public applyContinuousPassives(): void {
        if (this.isBusy || this.phase !== "play") return;
        for (const p of this.players) {
            if (p.isAlive && p.character?.drawWhenEmpty && p.hand.length === 0) {
                p.hand.push(...this.deck.draw(1));
                this.log(`Сюзи Лафайет (${p.name}) берёт карту, оставшись без карт`);
            }
        }
    }

    // --- Условия победы --------------------------------------------------

    // Проверяет цели ролей. Если кто-то победил — заполняет result.
    // Возвращает результат либо null.
    public checkWinConditions(): GameResult | null {
        if (this.result) return this.result;
        const living = this.players.filter((p) => p.isAlive);
        const has = (kind: RoleKind) =>
            living.some((p) => p.role?.kind === kind);

        const sheriff = this.players.find((p) => p.role?.kind === "sheriff");
        const sheriffAlive = has("sheriff");
        const outlawsAlive = has("outlaw");
        const renegadeAlive = has("renegade");

        let result: GameResult | null = null;

        // Ренегат остался последним.
        if (living.length === 1 && living[0].role?.kind === "renegade") {
            result = { winner: living[0], side: "ренегат" };
        }
        // Шериф погиб — побеждают бандиты (и ренегат, если это он остался).
        else if (!sheriffAlive) {
            const outlaw = this.players.find((p) => p.role?.kind === "outlaw");
            if (outlaw) {
                result = { winner: outlaw, side: "бандиты" };
            }
        }
        // Все бандиты и ренегат мертвы — побеждают шериф и помощники.
        else if (!outlawsAlive && !renegadeAlive && sheriff) {
            result = { winner: sheriff, side: "помощники" };
        }

        if (result) {
            this.result = result;
            this.log(
                `Победа: ${result.winner.name} (${result.winner.role?.name}) — сторона «${result.side}»`,
            );
        }
        return result;
    }

    // Следующий живой игрок по часовой стрелке (по порядку в массиве).
    private clockwiseFrom(player: Player): Player | null {
        const living = this.players.filter((p) => p.isAlive);
        if (living.length === 0) return null;
        const idx = living.indexOf(player);
        if (idx === -1) return living[0];
        return living[(idx + 1) % living.length];
    }

    // --- Грань смерти (Пиво) --------------------------------------------

    // Игрок на грани смерти играет Пиво — выживает с 1 HP.
    public useBeerToSurvive(): boolean {
        const player = this.pendingDeath;
        if (!player) return false;
        const beer = player.hand.find((card) => card instanceof Beer);
        if (!beer) return false;
        player.hand.splice(player.hand.indexOf(beer), 1);
        this.deck.discard(beer);
        player.health = 1;
        this.pendingDeath = null;
        this.pendingDeathKiller = null;
        // Если набор карты хода был отложен (взрыв динамита) — добираем.
        this.drawTurnCard();
        return true;
    }

    // Игрок отказывается от Пива — гибнет.
    public acceptDeath(): void {
        const player = this.pendingDeath;
        const killer = this.pendingDeathKiller;
        this.pendingDeath = null;
        this.pendingDeathKiller = null;
        if (player) this.handleDeath(player, killer);
        // Отложенный набор отменяется: погибший не добирает карту.
        this.turnDrawPending = false;
    }

    // Нанести урон игроку: лог, добор по способности Бутча Кэссиди,
    // проверка гибели (со спасением Пивом). killer — кто нанёс урон (для награды).
    private dealDamage(
        player: Player,
        amount: number,
        source: string,
        killer: Player | null = null,
    ): void {
        const before = player.health;
        player.health -= amount;
        const lost = Math.max(0, before - Math.max(0, player.health));
        this.log(
            `${player.name} теряет ${amount} ♥ (${source}), осталось ${Math.max(0, player.health)}`,
        );
        // Бутч Кэссиди: за каждую потерянную единицу здоровья тянет карту.
        if (player.character?.drawOnDamage && lost > 0) {
            player.hand.push(...this.deck.draw(lost));
        }
        // Джанго: за каждую потерянную ♥ тянет карту с руки атакующего.
        if (player.character?.stealOnDamage && killer && killer !== player && lost > 0) {
            for (let i = 0; i < lost && killer.hand.length > 0; i++) {
                const idx = Math.floor(Math.random() * killer.hand.length);
                const [stolen] = killer.hand.splice(idx, 1);
                player.hand.push(stolen);
            }
            this.log(`Джанго (${player.name}) забирает карту(ы) у ${killer.name}`);
        }
        if (player.health <= 0) {
            if (player.hasCardKind("beer")) {
                this.pendingDeath = player;
                this.pendingDeathKiller = killer;
            } else {
                this.handleDeath(player, killer);
            }
        }
    }

    // Награда за устранение бандита: убийца берёт 3 карты из колоды.
    private rewardForOutlaw(victim: Player, killer: Player | null): void {
        if (
            victim.role?.kind === "outlaw" &&
            killer &&
            killer !== victim &&
            killer.isAlive
        ) {
            killer.hand.push(...this.deck.draw(3));
            this.log(
                `${killer.name} устранил бандита ${victim.name} и берёт 3 карты в награду`,
            );
        }
    }

    // Гибель игрока при 0 HP: карты уходят в сброс, игрок выбывает.
    // killer — кто его убил (для награды за устранение бандита).
    private handleDeath(player: Player, killer: Player | null = null): void {
        if (player.isAlive) return;
        const roleName = player.role?.name ?? "?";
        this.log(`${player.name} (${roleName}) выбывает из игры`);
        this.recentDeaths.push({ name: player.name, role: roleName });
        // Награду выдаём до сброса карт погибшего (берём из колоды).
        this.rewardForOutlaw(player, killer);

        // Большой Змей: забирает все карты погибшего себе на руку.
        const looter = this.players.find(
            (p) => p !== player && p.isAlive && p.character?.lootOnAnyDeath,
        );
        if (looter) {
            const loot: Card[] = [...player.hand, ...player.equipment];
            if (player.weapon && !player.weapon.isDefault) loot.push(player.weapon);
            looter.hand.push(...loot);
            if (loot.length > 0) {
                this.log(
                    `Большой Змей (${looter.name}) забирает ${loot.length} карт(ы) погибшего ${player.name}`,
                );
            }
        } else {
            this.deck.discard(...player.hand, ...player.equipment);
            if (player.weapon && !player.weapon.isDefault) {
                this.deck.discard(player.weapon);
            }
        }
        player.hand = [];
        player.equipment = [];
        player.weapon = null;
        this.players = this.players.filter((p) => p !== player);
        // Если выбыл активный игрок — ход переходит дальше.
        if (this.activePlayer === player && this.players.length > 0) {
            this.activePlayer = this.players[0];
        }
    }

    public toSnapshot(): GameSnapshot {
        return {
            players: this.players.map((player) => player.toSnapshot()),
            activePlayerIndex: this.players.indexOf(this.activePlayer),
            deck: this.deck.getItems().map((card) => card.toSnapshot()),
            discard: this.deck.getDiscard().map((card) => card.toSnapshot()),
            history: this.history,
            phase: this.phase,
        };
    }

    public static fromSnapshot(snapshot: GameSnapshot): Game {
        const players = snapshot.players.map((player) =>
            Player.fromSnapshot(player),
        );
        const deck = new Deck<Card>(
            snapshot.deck.map((card) => cardFromSnapshot(card)),
            snapshot.discard.map((card) => cardFromSnapshot(card)),
        );
        const game = new Game(players, deck);

        const activeIndex = snapshot.activePlayerIndex;
        if (activeIndex >= 0 && activeIndex < players.length) {
            game.activePlayer = players[activeIndex];
        }
        game.history = snapshot.history ?? [];
        game.phase = snapshot.phase ?? "play";
        game.checkWinConditions();

        return game;
    }
}

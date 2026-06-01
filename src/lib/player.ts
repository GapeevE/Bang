import type { Card, CardSnapshot } from "@/lib/cards/card";
import { cardFromSnapshot } from "@/lib/cards/cardRegistry";
import { Character, type CharacterSnapshot } from "@/lib/characters/character";
import type { Equipment } from "@/lib/cards/equipment";
import { Role, type RoleSnapshot } from "@/lib/characters/role";
import { createColt, Weapon } from "@/lib/cards/weapon";

// Сериализованное представление игрока для localStorage.
export type PlayerSnapshot = {
    name: string;
    color: string;
    health: number;
    maxHealth: number;
    hand: CardSnapshot[];
    equipment: CardSnapshot[];
    weapon: CardSnapshot | null;
    bangsPlayedThisTurn: number;
    role: RoleSnapshot | null;
    character: CharacterSnapshot | null;
};

export class Player {
    public name: string;
    public color: string;
    public hand: Card[];
    // Выставленное оружие-карта. null => действует базовый Кольт .45.
    public weapon: Weapon | null;
    public equipment: Equipment[];
    public role: Role | null;
    public character: Character | null;
    public health: number;
    // Максимальный запас здоровья (потолок для лечения).
    public maxHealth: number;
    // Сколько «Бэнг!» сыграно в текущем ходу (для правила «1 Бэнг за ход»).
    public bangsPlayedThisTurn: number;
    // Использована ли способность «любая карта как Магазин» в этом ходу (Дядя Уилл).
    public usedAnyAsStore: boolean = false;

    constructor(name: string, color: string, health: number) {
        this.name = name;
        this.color = color;
        this.health = health;
        this.maxHealth = health;
        this.hand = [];
        this.weapon = null;
        this.equipment = [];
        this.role = null;
        this.character = null;
        this.bangsPlayedThisTurn = 0;
    }

    // Активное оружие игрока: выставленная карта либо базовый Кольт .45.
    public get activeWeapon(): Weapon {
        return this.weapon ?? createColt();
    }

    public get isAlive(): boolean {
        return this.health > 0;
    }

    // Можно ли лечиться (здоровье ниже максимума).
    public get canHeal(): boolean {
        return this.health < this.maxHealth;
    }

    // Восстановить здоровье, не превышая максимум.
    public heal(amount: number): void {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    // Есть ли у игрока снаряжение указанного типа.
    public hasEquipment(kind: Equipment["kind"]): boolean {
        return this.equipment.some((item) => item.kind === kind);
    }

    // Есть ли в руке карта указанного типа.
    public hasCardKind(kind: Card["kind"]): boolean {
        return this.hand.some((card) => card.kind === kind);
    }

    public toSnapshot(): PlayerSnapshot {
        return {
            name: this.name,
            color: this.color,
            health: this.health,
            maxHealth: this.maxHealth,
            hand: this.hand.map((card) => card.toSnapshot()),
            equipment: this.equipment.map((card) => card.toSnapshot()),
            weapon: this.weapon?.toSnapshot() ?? null,
            bangsPlayedThisTurn: this.bangsPlayedThisTurn,
            role: this.role?.toSnapshot() ?? null,
            character: this.character?.toSnapshot() ?? null,
        };
    }

    public static fromSnapshot(snapshot: PlayerSnapshot): Player {
        const player = new Player(snapshot.name, snapshot.color, snapshot.health);
        player.maxHealth = snapshot.maxHealth ?? snapshot.health;
        player.hand = snapshot.hand.map((card) => cardFromSnapshot(card));
        player.equipment = snapshot.equipment.map(
            (card) => cardFromSnapshot(card) as Equipment,
        );
        player.weapon =
            snapshot.weapon === null
                ? null
                : (cardFromSnapshot(snapshot.weapon) as Weapon);
        player.bangsPlayedThisTurn = snapshot.bangsPlayedThisTurn ?? 0;
        player.role = snapshot.role ? Role.fromSnapshot(snapshot.role) : null;
        player.character = snapshot.character
            ? Character.fromSnapshot(snapshot.character)
            : null;
        return player;
    }
}

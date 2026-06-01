import { Card, type CardKind, type CardSnapshot, type CardValue, type Suit } from "@/lib/cards/card";

export class Weapon extends Card {
    public readonly kind: CardKind = "weapon";
    // Дальность стрельбы оружия.
    public range: number;
    // Снимает ограничение «1 Бэнг! за ход» (Волканик).
    public unlimitedBang: boolean;
    // Кольт .45 — базовое оружие-заглушка, не является картой (не уходит в сброс).
    public isDefault: boolean;

    constructor(
        name: string,
        suit: Suit,
        value: CardValue,
        range: number,
        options: {
            description?: string;
            unlimitedBang?: boolean;
            isDefault?: boolean;
        } = {},
    ) {
        super(name, suit, value, options.description);
        this.range = range;
        this.unlimitedBang = options.unlimitedBang ?? false;
        this.isDefault = options.isDefault ?? false;
    }

    public override toSnapshot(): CardSnapshot {
        return {
            ...super.toSnapshot(),
            range: this.range,
            unlimitedBang: this.unlimitedBang,
        };
    }
}

// Базовое оружие игрока: Кольт .45, дальность 1. Не карта — в колоду/сброс не попадает.
export function createColt(): Weapon {
    return new Weapon("Кольт .45", "spades", 2, 1, {
        description: "Базовое оружие. Дальность 1.",
        isDefault: true,
    });
}

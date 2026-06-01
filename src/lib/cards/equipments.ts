import { type CardKind, type CardValue, type Suit } from "@/lib/cards/card";
import { Equipment } from "@/lib/cards/equipment";

// Бочка — даёт шанс «Мимо!»: при выстреле тянем карту, черва спасает.
export class Barrel extends Equipment {
    public readonly kind: CardKind = "barrel";

    constructor(suit: Suit, value: CardValue) {
        super(
            "Бочка",
            suit,
            value,
            "При выстреле по вам тяните карту из колоды: черва считается за «Мимо!».",
        );
    }
}

// Мустанг — другие игроки видят вас на расстояние на 1 больше.
export class Mustang extends Equipment {
    public readonly kind: CardKind = "mustang";

    constructor(suit: Suit, value: CardValue) {
        super(
            "Мустанг",
            suit,
            value,
            "Расстояние от других игроков до вас увеличивается на 1.",
        );
    }
}

// Прицел — вы видите всех остальных игроков на расстояние на 1 меньше.
export class Scope extends Equipment {
    public readonly kind: CardKind = "scope";

    constructor(suit: Suit, value: CardValue) {
        super(
            "Прицел",
            suit,
            value,
            "Расстояние от вас до других игроков уменьшается на 1.",
        );
    }
}

// Динамит — в начале своего хода проверка: пики 2-9 → −3 ♥ и сброс,
// иначе передаётся следующему игроку по часовой стрелке.
export class Dynamite extends Equipment {
    public readonly kind: CardKind = "dynamite";

    constructor(suit: Suit, value: CardValue) {
        super(
            "Динамит",
            suit,
            value,
            "В начале вашего хода тяните карту: пики 2–9 — взрыв (−3 ♥), иначе динамит переходит к следующему игроку.",
        );
    }
}

// Тюрьма — кладётся на другого игрока. В начале его хода проверка:
// черва — освобождается и ходит, иначе пропускает ход. Тюрьма уходит в сброс.
export class Jail extends Equipment {
    public readonly kind: CardKind = "jail";

    constructor(suit: Suit, value: CardValue) {
        super(
            "Тюрьма",
            suit,
            value,
            "В начале своего хода тяните карту: черва — освобождение, иначе ход пропускается.",
        );
    }
}

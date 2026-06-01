import { Card, type CardKind, type CardValue, type Suit } from "@/lib/cards/card";

// Дилижанс — взять 2 карты из колоды.
export class Stagecoach extends Card {
    public readonly kind: CardKind = "stagecoach";

    constructor(suit: Suit, value: CardValue) {
        super("Дилижанс", suit, value, "Возьмите 2 карты из колоды.");
    }
}

// Уэллс Фарго — взять 3 карты из колоды.
export class WellsFargo extends Card {
    public readonly kind: CardKind = "wellsfargo";

    constructor(suit: Suit, value: CardValue) {
        super("Уэллс Фарго", suit, value, "Возьмите 3 карты из колоды.");
    }
}

// Пиво — восстановить 1 единицу здоровья (не выше максимума).
export class Beer extends Card {
    public readonly kind: CardKind = "beer";

    constructor(suit: Suit, value: CardValue) {
        super(
            "Пиво",
            suit,
            value,
            "Восстанавливает 1 единицу здоровья (не выше максимума).",
        );
    }
}

// Красотка — заставляет любого игрока (без учёта расстояния) сбросить карту.
export class CatBalou extends Card {
    public readonly kind: CardKind = "catbalou";

    constructor(suit: Suit, value: CardValue) {
        super(
            "Красотка",
            suit,
            value,
            "Заставьте любого игрока сбросить карту с руки, оружие или снаряжение.",
        );
    }
}

// Паника — забрать карту у игрока на расстоянии 1 себе на руку.
export class Panic extends Card {
    public readonly kind: CardKind = "panic";

    constructor(suit: Suit, value: CardValue) {
        super(
            "Паника",
            suit,
            value,
            "Заберите карту у игрока на расстоянии 1 (случайную с руки либо его оружие/снаряжение).",
        );
    }
}

// Индейцы — каждый игрок сбрасывает «Бэнг!» либо теряет 1 единицу здоровья.
export class Indians extends Card {
    public readonly kind: CardKind = "indians";

    constructor(suit: Suit, value: CardValue) {
        super(
            "Индейцы",
            suit,
            value,
            "Каждый другой игрок сбрасывает «Бэнг!» либо теряет 1 единицу здоровья.",
        );
    }
}

// Гатлинг — выстрел «Бэнг!» по всем остальным игрокам сразу.
export class Gatling extends Card {
    public readonly kind: CardKind = "gatling";

    constructor(suit: Suit, value: CardValue) {
        super(
            "Гатлинг",
            suit,
            value,
            "Выстрел «Бэнг!» по всем остальным игрокам (каждый может ответить «Мимо!»).",
        );
    }
}

// Магазин — вскрыть карты по числу живых игроков, каждый берёт одну по очереди.
export class GeneralStore extends Card {
    public readonly kind: CardKind = "generalstore";

    constructor(suit: Suit, value: CardValue) {
        super(
            "Магазин",
            suit,
            value,
            "Вскройте карты по числу живых игроков; каждый по очереди берёт одну.",
        );
    }
}

// Дуэль — вызвать игрока; по очереди сбрасывают «Бэнг!», кто не смог — теряет 1 ♥.
export class Duel extends Card {
    public readonly kind: CardKind = "duel";

    constructor(suit: Suit, value: CardValue) {
        super(
            "Дуэль",
            suit,
            value,
            "Вызовите игрока. По очереди сбрасывайте «Бэнг!»; кто первым не сможет — теряет 1 единицу здоровья.",
        );
    }
}

// Салун — все живые игроки восстанавливают 1 единицу здоровья.
export class Saloon extends Card {
    public readonly kind: CardKind = "saloon";

    constructor(suit: Suit, value: CardValue) {
        super(
            "Салун",
            suit,
            value,
            "Все игроки восстанавливают 1 единицу здоровья (не выше максимума).",
        );
    }
}

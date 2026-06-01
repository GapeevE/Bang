// Масть карты.
export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

// Значение карты: 2-10 либо фигурные/туз.
export type CardValue =
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | "J"
    | "Q"
    | "K"
    | "A";

// Тип карты — дискриминатор для сериализации/восстановления из localStorage.
export type CardKind =
    | "bang"
    | "missed"
    | "weapon"
    | "barrel"
    | "mustang"
    | "scope"
    | "dynamite"
    | "jail"
    | "stagecoach"
    | "wellsfargo"
    | "beer"
    | "catbalou"
    | "panic"
    | "indians"
    | "gatling"
    | "generalstore"
    | "duel"
    | "saloon";

// Сериализованное представление карты.
export type CardSnapshot = {
    kind: CardKind;
    name: string;
    suit: Suit;
    value: CardValue;
    description?: string;
    range?: number;
    unlimitedBang?: boolean;
};

export abstract class Card {
    public abstract readonly kind: CardKind;
    public suit: Suit;
    public value: CardValue;
    public name: string;
    public description?: string;

    constructor(
        name: string,
        suit: Suit,
        value: CardValue,
        description?: string,
    ) {
        this.name = name;
        this.suit = suit;
        this.value = value;
        this.description = description;
    }

    public toSnapshot(): CardSnapshot {
        return {
            kind: this.kind,
            name: this.name,
            suit: this.suit,
            value: this.value,
            description: this.description,
        };
    }
}

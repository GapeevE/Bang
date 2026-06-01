import { Card, type CardKind, type CardValue, type Suit } from "@/lib/cards/card";

const MISSED_NAME = "Мимо!";
const MISSED_DESCRIPTION =
    "Отменяет один выстрел «Бэнг!», направленный на вас. Разыгрывается в ответ.";

export class Missed extends Card {
    public readonly kind: CardKind = "missed";

    constructor(
        suit: Suit,
        value: CardValue,
        description: string = MISSED_DESCRIPTION,
    ) {
        super(MISSED_NAME, suit, value, description);
    }
}

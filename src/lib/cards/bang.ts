import { Card, type CardKind, type CardValue, type Suit } from "@/lib/cards/card";

const BANG_NAME = "Бэнг!";
const BANG_DESCRIPTION =
    "Выстрел по игроку в пределах дальности. Цель должна сыграть «Мимо!», иначе теряет единицу здоровья.";

export class Bang extends Card {
    public readonly kind: CardKind = "bang";

    constructor(suit: Suit, value: CardValue, description: string = BANG_DESCRIPTION) {
        super(BANG_NAME, suit, value, description);
    }
}

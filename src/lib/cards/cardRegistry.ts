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
import { Card, type CardSnapshot } from "@/lib/cards/card";
import { Equipment } from "@/lib/cards/equipment";
import { Barrel, Dynamite, Jail, Mustang, Scope } from "@/lib/cards/equipments";
import { Missed } from "@/lib/cards/missed";
import { Weapon } from "@/lib/cards/weapon";

const SUIT_SYMBOL: Record<string, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
};

// «ЗначениеМасть» без пробела, напр. «J♣».
export function cardSuitValue(card: Card): string {
    return `${card.value}${SUIT_SYMBOL[card.suit] ?? card.suit}`;
}

// «Имя (ЗначениеМасть)».
export function cardLabel(card: Card): string {
    return `${card.name} (${cardSuitValue(card)})`;
}

// «Название - ЗначениеМасть» (для сброса/руки).
export function cardNameSuitValue(card: Card): string {
    return `${card.name} - ${cardSuitValue(card)}`;
}

// Снаряжение и оружие — синяя обводка, простые карты — коричневая.
export function isBlueCard(card: Card): boolean {
    return card instanceof Equipment || card instanceof Weapon;
}

export function cardBorderClass(card: Card): string {
    return isBlueCard(card) ? "border-blue-500" : "border-amber-700";
}

// Требует ли карта выбора цели при розыгрыше.
export function cardNeedsTarget(card: Card): boolean {
    return card instanceof Bang;
}

// Восстанавливает инстанс карты из снапшота по полю kind.
export function cardFromSnapshot(snapshot: CardSnapshot): Card {
    switch (snapshot.kind) {
        case "bang":
            return new Bang(snapshot.suit, snapshot.value, snapshot.description);
        case "missed":
            return new Missed(snapshot.suit, snapshot.value, snapshot.description);
        case "weapon":
            return new Weapon(snapshot.name, snapshot.suit, snapshot.value, snapshot.range ?? 1, {
                description: snapshot.description,
                unlimitedBang: snapshot.unlimitedBang,
            });
        case "barrel":
            return new Barrel(snapshot.suit, snapshot.value);
        case "mustang":
            return new Mustang(snapshot.suit, snapshot.value);
        case "scope":
            return new Scope(snapshot.suit, snapshot.value);
        case "dynamite":
            return new Dynamite(snapshot.suit, snapshot.value);
        case "jail":
            return new Jail(snapshot.suit, snapshot.value);
        case "stagecoach":
            return new Stagecoach(snapshot.suit, snapshot.value);
        case "wellsfargo":
            return new WellsFargo(snapshot.suit, snapshot.value);
        case "beer":
            return new Beer(snapshot.suit, snapshot.value);
        case "catbalou":
            return new CatBalou(snapshot.suit, snapshot.value);
        case "panic":
            return new Panic(snapshot.suit, snapshot.value);
        case "indians":
            return new Indians(snapshot.suit, snapshot.value);
        case "gatling":
            return new Gatling(snapshot.suit, snapshot.value);
        case "generalstore":
            return new GeneralStore(snapshot.suit, snapshot.value);
        case "duel":
            return new Duel(snapshot.suit, snapshot.value);
        case "saloon":
            return new Saloon(snapshot.suit, snapshot.value);
    }
}

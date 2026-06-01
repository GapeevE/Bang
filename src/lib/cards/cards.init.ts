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
import type { Card } from "@/lib/cards/card";
import { Barrel, Dynamite, Jail, Mustang, Scope } from "@/lib/cards/equipments";
import { Missed } from "@/lib/cards/missed";
import { Weapon } from "@/lib/cards/weapon";

// Оружие. Описание оружия содержит его дальность.
const weaponDescription = (range: number) => `Дальность стрельбы: ${range}.`;
const VOLCANIC_DESCRIPTION =
    "Дальность стрельбы: 1. Позволяет разыгрывать любое число карт «Бэнг!» за ход.";

function createWeapons(): Card[] {
    return [
        new Weapon("Скофилд", "clubs", "J", 2, { description: weaponDescription(2) }),
        new Weapon("Карабин", "clubs", "A", 4, { description: weaponDescription(4) }),
        new Weapon("Винчестер", "spades", 8, 5, { description: weaponDescription(5) }),
        new Weapon("Скофилд", "spades", "K", 2, { description: weaponDescription(2) }),
        new Weapon("Ремингтон", "clubs", "K", 3, { description: weaponDescription(3) }),
        new Weapon("Скофилд", "clubs", "Q", 2, { description: weaponDescription(2) }),
        new Weapon("Волканик", "clubs", 10, 1, {
            unlimitedBang: true,
            description: VOLCANIC_DESCRIPTION,
        }),
        new Weapon("Волканик", "spades", 10, 1, {
            unlimitedBang: true,
            description: VOLCANIC_DESCRIPTION,
        }),
    ];
}

// Карты «Бэнг!» — самая частая карта в базовой колоде (25 штук).
function createBangs(): Card[] {
    return [
        new Bang("hearts", "A"),
        new Bang("hearts", "Q"),
        new Bang("hearts", "K"),
        new Bang("diamonds", "A"),
        new Bang("diamonds", 2),
        new Bang("diamonds", 3),
        new Bang("diamonds", 4),
        new Bang("diamonds", 5),
        new Bang("diamonds", 6),
        new Bang("diamonds", 7),
        new Bang("diamonds", 8),
        new Bang("diamonds", 9),
        new Bang("diamonds", 10),
        new Bang("diamonds", "J"),
        new Bang("diamonds", "Q"),
        new Bang("diamonds", "K"),
        new Bang("clubs", 2),
        new Bang("clubs", 3),
        new Bang("clubs", 4),
        new Bang("clubs", 5),
        new Bang("clubs", 6),
        new Bang("clubs", 7),
        new Bang("clubs", 8),
        new Bang("clubs", 9),
        new Bang("spades", "A"),
    ];
}

// Карты «Мимо!» — реакция на «Бэнг!» (12 штук в базовой колоде).
function createMisses(): Card[] {
    return [
        new Missed("clubs", 10),
        new Missed("clubs", "J"),
        new Missed("clubs", "Q"),
        new Missed("clubs", "K"),
        new Missed("clubs", "A"),
        new Missed("spades", 2),
        new Missed("spades", 3),
        new Missed("spades", 4),
        new Missed("spades", 5),
        new Missed("spades", 6),
        new Missed("spades", 7),
        new Missed("spades", 8),
    ];
}

// Карты снаряжения — выкладываются перед игроком и действуют постоянно.
function createEquipments(): Card[] {
    return [
        new Barrel("spades", "K"),
        new Barrel("spades", "Q"),
        new Mustang("hearts", 8),
        new Mustang("hearts", 9),
        new Scope("spades", "A"),
        new Dynamite("hearts", 2),
        new Jail("spades", "J"),
        new Jail("spades", 10),
        new Jail("hearts", 4),
    ];
}

// Карты действий: Дилижанс (×2), Уэллс Фарго (×1), Пиво (×6),
// Красотка (×4), Паника (×4), Индейцы (×2), Гатлинг (×1).
function createActions(): Card[] {
    return [
        new Stagecoach("spades", 9),
        new Stagecoach("spades", 9),
        new WellsFargo("hearts", 3),
        new Beer("hearts", 6),
        new Beer("hearts", 7),
        new Beer("hearts", 8),
        new Beer("hearts", 9),
        new Beer("hearts", 10),
        new Beer("hearts", "J"),
        new CatBalou("hearts", "K"),
        new CatBalou("diamonds", "J"),
        new CatBalou("diamonds", 9),
        new CatBalou("diamonds", 10),
        new Panic("hearts", "J"),
        new Panic("hearts", "Q"),
        new Panic("hearts", "A"),
        new Panic("diamonds", 8),
        new Indians("diamonds", "K"),
        new Indians("diamonds", "A"),
        new Gatling("hearts", 10),
        new GeneralStore("spades", "Q"),
        new GeneralStore("clubs", 9),
        new Duel("diamonds", "Q"),
        new Duel("spades", "J"),
        new Duel("clubs", 8),
        new Saloon("hearts", 5),
    ];
}

// Карты, которыми инициализируется колода Card.
export function createCards(): Card[] {
    return [
        ...createWeapons(),
        ...createBangs(),
        ...createMisses(),
        ...createEquipments(),
        ...createActions(),
    ];
}

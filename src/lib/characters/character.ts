// Персонаж игрока: имя, стартовое здоровье и пассивные модификаторы.
export type CharacterKind =
    | "uncleWill"
    | "calamityJanet"
    | "willyTheKid"
    | "butchCassidy"
    | "elusiveJoe"
    | "johnnyKisch"
    | "suzyLafayette"
    | "namelessMan"
    | "madDog"
    | "tomKetchum"
    | "coldHeartRosa"
    | "kitCarson"
    | "jesseJames"
    | "tuco"
    | "angelEyes"
    | "luckyLuke"
    | "bigSnake"
    | "django";

export type CharacterSnapshot = {
    kind: CharacterKind;
};

type CharacterMeta = {
    name: string;
    health: number;
    description: string;
    // Раз в ход может сыграть любую карту как «Магазин» (Дядя Уилл).
    anyCardAsGeneralStore?: boolean;
    // Может играть «Мимо!» как «Бэнг!» и наоборот (Бедовая Джейн).
    missedAsBang?: boolean;
    // Может играть сколько угодно «Бэнг!» за ход (Малыш Билли).
    unlimitedBang?: boolean;
    // При потере 1 ♥ тянет карту из колоды (Бутч Кэссиди).
    drawOnDamage?: boolean;
    // Для соперников находится на +1 дистанции (Неуловимый Джо).
    extraDistance?: boolean;
    // При вводе карты в игру все одноимённые сбрасываются (Джонни Киш).
    discardSameName?: boolean;
    // Как только остаётся без карт — берёт карту (Сюзи Лафайет).
    drawWhenEmpty?: boolean;
    // Для соперников находится на −1 дистанции (Хладнокровная Рози).
    closerDistance?: boolean;
    // При попадании может проверкой отменить его, если выпала черва (Человек-Без-Имени).
    dodgeCheckHearts?: boolean;
    // Чтобы отменить его попадание, цели нужно 2 «Мимо!» (Ангельские Глазки).
    requiresTwoMissed?: boolean;
    // 2-я добранная карта вскрывается: черва/бубна → ещё одна карта (Бешеный Пёс).
    revealSecondDrawBonus?: boolean;
    // За каждую потерянную ♥ тянет карту с руки атакующего (Джанго).
    stealOnDamage?: boolean;
    // При любой смерти забирает все карты погибшего (Большой Змей).
    lootOnAnyDeath?: boolean;
    // В любой момент может сбросить 2 карты, чтобы восстановить 1 ♥ (Том Кетчум).
    discardTwoToHeal?: boolean;
    // Тип специального набора карт в фазе набора.
    // kitCarson — тянет 3, оставляет 2, 1 наверх; jesseJames — первая карта с руки соперника;
    // tuco — первая карта из сброса.
    specialDraw?: "kitCarson" | "jesseJames" | "tuco";
    // При любой проверке вскрывает 2 верхние карты и выбирает одну (Счастливчик Люк).
    luckyCheck?: boolean;
};

const CHARACTER_META: Record<CharacterKind, CharacterMeta> = {
    uncleWill: {
        name: "Дядя Уилл",
        health: 4,
        description: "Раз в свой ход может сыграть любую карту как «Магазин».",
        anyCardAsGeneralStore: true,
    },
    calamityJanet: {
        name: "Бедовая Джейн",
        health: 4,
        description: "Может играть «Мимо!» как «Бэнг!» и наоборот.",
        missedAsBang: true,
    },
    willyTheKid: {
        name: "Малыш Билли",
        health: 4,
        description: "В свой ход может играть сколько угодно карт «Бэнг!».",
        unlimitedBang: true,
    },
    butchCassidy: {
        name: "Бутч Кэссиди",
        health: 4,
        description: "Каждый раз, теряя единицу здоровья, тянет карту из колоды.",
        drawOnDamage: true,
    },
    elusiveJoe: {
        name: "Неуловимый Джо",
        health: 3,
        description: "Для всех соперников находится на расстоянии +1.",
        extraDistance: true,
    },
    johnnyKisch: {
        name: "Джонни Киш",
        health: 4,
        description:
            "Когда вводит карту в игру, все карты с таким же названием сбрасываются.",
        discardSameName: true,
    },
    suzyLafayette: {
        name: "Сюзи Лафайет",
        health: 4,
        description: "Как только остаётся без карт, берёт карту из колоды.",
        drawWhenEmpty: true,
    },
    namelessMan: {
        name: "Человек-Без-Имени",
        health: 4,
        description:
            "При попадании может сделать проверку: черва — попадание отменяется.",
        dodgeCheckHearts: true,
    },
    madDog: {
        name: "Бешеный Пёс",
        health: 4,
        description:
            "В фазе набора вскрывает вторую карту: черва или бубна — берёт ещё одну.",
        revealSecondDrawBonus: true,
    },
    tomKetchum: {
        name: "Том Кетчум",
        health: 4,
        description:
            "В любой момент может сбросить 2 карты, чтобы восстановить 1 ♥.",
        discardTwoToHeal: true,
    },
    coldHeartRosa: {
        name: "Хладнокровная Рози",
        health: 4,
        description: "Для неё все соперники на расстоянии на 1 меньше обычного.",
        closerDistance: true,
    },
    kitCarson: {
        name: "Кит Карсон",
        health: 4,
        description:
            "В фазе набора тянет 3 карты, 2 оставляет, 1 возвращает наверх колоды.",
        specialDraw: "kitCarson",
    },
    jesseJames: {
        name: "Джесси Джеймс",
        health: 4,
        description:
            "В фазе набора первую карту может взять с руки любого соперника.",
        specialDraw: "jesseJames",
    },
    tuco: {
        name: "Туко",
        health: 4,
        description: "В фазе набора первую карту может взять с верха стопки сброса.",
        specialDraw: "tuco",
    },
    angelEyes: {
        name: "Ангельские Глазки",
        health: 4,
        description: "Чтобы отменить его попадание, нужно 2 карты «Мимо!».",
        requiresTwoMissed: true,
    },
    luckyLuke: {
        name: "Счастливчик Люк",
        health: 4,
        description:
            "При любой проверке вскрывает 2 верхние карты колоды и выбирает одну.",
        luckyCheck: true,
    },
    bigSnake: {
        name: "Большой Змей",
        health: 4,
        description:
            "Когда любой персонаж убит, забирает на руку все его карты (рука, снаряжение, оружие).",
        lootOnAnyDeath: true,
    },
    django: {
        name: "Джанго",
        health: 3,
        description:
            "За каждую потерянную ♥ тянет карту с руки соперника, из-за которого лишился здоровья.",
        stealOnDamage: true,
    },
};

export class Character {
    public readonly kind: CharacterKind;

    constructor(kind: CharacterKind) {
        this.kind = kind;
    }

    private get meta(): CharacterMeta {
        return CHARACTER_META[this.kind];
    }

    public get name(): string {
        return this.meta.name;
    }
    public get health(): number {
        return this.meta.health;
    }
    public get description(): string {
        return this.meta.description;
    }
    public get anyCardAsGeneralStore(): boolean {
        return !!this.meta.anyCardAsGeneralStore;
    }
    public get missedAsBang(): boolean {
        return !!this.meta.missedAsBang;
    }
    public get unlimitedBang(): boolean {
        return !!this.meta.unlimitedBang;
    }
    public get drawOnDamage(): boolean {
        return !!this.meta.drawOnDamage;
    }
    public get extraDistance(): boolean {
        return !!this.meta.extraDistance;
    }
    public get discardSameName(): boolean {
        return !!this.meta.discardSameName;
    }
    public get drawWhenEmpty(): boolean {
        return !!this.meta.drawWhenEmpty;
    }
    public get closerDistance(): boolean {
        return !!this.meta.closerDistance;
    }
    public get dodgeCheckHearts(): boolean {
        return !!this.meta.dodgeCheckHearts;
    }
    public get requiresTwoMissed(): boolean {
        return !!this.meta.requiresTwoMissed;
    }
    public get revealSecondDrawBonus(): boolean {
        return !!this.meta.revealSecondDrawBonus;
    }
    public get stealOnDamage(): boolean {
        return !!this.meta.stealOnDamage;
    }
    public get lootOnAnyDeath(): boolean {
        return !!this.meta.lootOnAnyDeath;
    }
    public get discardTwoToHeal(): boolean {
        return !!this.meta.discardTwoToHeal;
    }
    public get specialDraw(): "kitCarson" | "jesseJames" | "tuco" | undefined {
        return this.meta.specialDraw;
    }
    public get luckyCheck(): boolean {
        return !!this.meta.luckyCheck;
    }

    public toSnapshot(): CharacterSnapshot {
        return { kind: this.kind };
    }

    public static fromSnapshot(snapshot: CharacterSnapshot): Character {
        return new Character(snapshot.kind);
    }
}

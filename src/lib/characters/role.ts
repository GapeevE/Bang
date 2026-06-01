// Роль игрока в партии.
export type RoleKind = "sheriff" | "deputy" | "outlaw" | "renegade";

export type RoleSnapshot = {
    kind: RoleKind;
};

const ROLE_META: Record<RoleKind, { name: string; goal: string; side: string }> = {
    sheriff: {
        name: "Шериф",
        goal: "Убить всех бандитов и ренегата.",
        side: "помощники",
    },
    deputy: {
        name: "Помощник шерифа",
        goal: "Защитить шерифа, убить всех бандитов и ренегата.",
        side: "помощники",
    },
    outlaw: {
        name: "Бандит",
        goal: "Убить шерифа.",
        side: "бандиты",
    },
    renegade: {
        name: "Ренегат",
        goal: "Остаться последним.",
        side: "ренегат",
    },
};

export class Role {
    public readonly kind: RoleKind;

    constructor(kind: RoleKind) {
        this.kind = kind;
    }

    public get name(): string {
        return ROLE_META[this.kind].name;
    }

    public get goal(): string {
        return ROLE_META[this.kind].goal;
    }

    // Сторона победы (для поздравления): «помощники» / «бандиты» / «ренегат».
    public get side(): string {
        return ROLE_META[this.kind].side;
    }

    public toSnapshot(): RoleSnapshot {
        return { kind: this.kind };
    }

    public static fromSnapshot(snapshot: RoleSnapshot): Role {
        return new Role(snapshot.kind);
    }
}

// Раздаёт роли по числу игроков (по правилам Bang).
// 4: шериф, ренегат, 2 бандита. 5: + помощник. 6: + бандит. 7: + помощник.
export function rolesForCount(count: number): RoleKind[] {
    const byCount: Record<number, RoleKind[]> = {
        4: ["sheriff", "renegade", "outlaw", "outlaw"],
        5: ["sheriff", "renegade", "outlaw", "outlaw", "deputy"],
        6: ["sheriff", "renegade", "outlaw", "outlaw", "outlaw", "deputy"],
        7: ["sheriff", "renegade", "outlaw", "outlaw", "outlaw", "deputy", "deputy"],
    };
    return byCount[count] ?? byCount[4];
}

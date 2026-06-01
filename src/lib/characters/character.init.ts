import { Character } from "@/lib/characters/character";

// Персонажи, которыми инициализируется игра (раздаются случайно).
export function createCharacters(): Character[] {
    return [
        new Character("uncleWill"),
        new Character("calamityJanet"),
        new Character("willyTheKid"),
        new Character("butchCassidy"),
        new Character("elusiveJoe"),
        new Character("johnnyKisch"),
        new Character("suzyLafayette"),
        new Character("namelessMan"),
        new Character("madDog"),
        new Character("tomKetchum"),
        new Character("coldHeartRosa"),
        new Character("kitCarson"),
        new Character("jesseJames"),
        new Character("tuco"),
        new Character("angelEyes"),
        new Character("luckyLuke"),
        new Character("bigSnake"),
        new Character("django"),
    ];
}

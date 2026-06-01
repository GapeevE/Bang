export class Deck<T> {
    private items: T[];
    // Стопка сброса — сыгранные карты.
    private discardPile: T[];

    constructor(init: T[], discard: T[] = []) {
        this.items = init;
        this.discardPile = discard;
    }

    public getItems() {
        return this.items;
    }

    public getDiscard() {
        return this.discardPile;
    }

    public get size(): number {
        return this.items.length;
    }

    // Тасовка колоды на месте (алгоритм Фишера — Йетса).
    public shuffle(): void {
        this.shuffleItems(this.items);
    }

    private shuffleItems(arr: T[]): void {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    // Кладёт карты в стопку сброса.
    public discard(...cards: T[]): void {
        this.discardPile.push(...cards);
    }

    // Кладёт карту наверх колоды (для Кита Карсона).
    public putOnTop(card: T): void {
        this.items.unshift(card);
    }

    // Снимает верхнюю карту со стопки сброса (для Туко). null, если сброс пуст.
    public takeFromDiscardTop(): T | null {
        return this.discardPile.pop() ?? null;
    }

    // Снимает count карт с верха колоды и возвращает их.
    // Если колода пустеет — замешивает сброс обратно в колоду.
    public draw(count: number = 1): T[] {
        const drawn: T[] = [];
        for (let i = 0; i < count; i++) {
            if (this.items.length === 0) {
                this.refillFromDiscard();
            }
            // Колода и сброс пусты — больше тянуть нечего.
            if (this.items.length === 0) break;
            drawn.push(this.items.shift()!);
        }
        return drawn;
    }

    // Замешивает стопку сброса обратно в колоду.
    private refillFromDiscard(): void {
        if (this.discardPile.length === 0) return;
        this.items = this.discardPile;
        this.discardPile = [];
        this.shuffleItems(this.items);
    }
}

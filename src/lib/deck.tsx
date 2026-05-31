export class Deck<T> {
    private items: T[];

    constructor(init: T[]) {
        this.setItems(init);
    }

    private setItems(init: T[]) {
        this.items = init;
    }

    public getItems() {
        return this.items;
    }
}
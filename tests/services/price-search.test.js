import SearchService from "../../src/services/price-search.service";
describe("SearchService", () => {
    it("should return the correct buy and sell prices and amounts", () => {
        const orderbook = {
            asks: [
                [100, 10],
                [101, 20],
                [102, 30],
            ],
            bids: [
                [99, 10],
                [98, 20],
                [97, 30],
            ],
        };
        const target = 30;
        const searchService = new SearchService(target);
        const result = searchService.execute(orderbook);
        expect(result).toEqual({
            buyPrice: 101,
            buyAmount: 30,
            sellPrice: 98,
            sellAmount: 30,
        });
    });
    it("should return zero on amount and price if target not reached", () => {
        const orderbook = {
            asks: [
                [100, 10],
                [101, 20],
                [102, 30],
            ],
            bids: [
                [99, 10],
                [98, 20],
                [97, 30],
            ],
        };
        const target = 1000;
        const searchService = new SearchService(target);
        const result = searchService.execute(orderbook);
        expect(result).toEqual({
            buyPrice: 0,
            buyAmount: 0,
            sellPrice: 0,
            sellAmount: 0,
        });
    });
    it("should return the correct buy and sell prices and amounts when orderbook is empty", () => {
        const orderbook = {
            asks: [],
            bids: [],
        };
        const target = 100;
        const searchService = new SearchService(target);
        const result = searchService.execute(orderbook);
        expect(result).toEqual({
            buyPrice: 0,
            buyAmount: 0,
            sellPrice: 0,
            sellAmount: 0,
        });
    });
});

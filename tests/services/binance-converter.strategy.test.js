import { createClient } from "redis";
import { BinanceConverterStrategy } from "../../src/services/price-converter/strategies/binance-converter.strategy";
describe("BinanceConverterStrategy", () => {
    const redisClient = createClient();
    const baseCurrency = "USDT";
    const strategy = new BinanceConverterStrategy({ url: "redis://localhost:6379" }, baseCurrency);
    describe("convert", () => {
        const rawOrderbook = {
            bids: [["100", "1"], ["99", "2"]],
            asks: [["101", "3"], ["102", "4"]],
            lastUpdateId: 1,
        };
        it("should convert the orderbook to IDR", async () => {
            redisClient.set(baseCurrency, "14000");
            const orderbook = await strategy.convert(rawOrderbook);
            expect(orderbook.bids).toEqual([
                [1400000, 1400000],
                [1386000, 2772000],
            ]);
            expect(orderbook.asks).toEqual([
                [1414000, 4230000],
                [1428000, 5712000],
            ]);
        });
        it("should throw an error if the base currency price is not available", async () => {
            redisClient.del(baseCurrency);
            await expect(strategy.convert(rawOrderbook)).rejects.toThrow("BASE_CURRENCY source not available");
        });
    });
});

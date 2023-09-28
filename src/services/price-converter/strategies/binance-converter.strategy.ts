import {  createClient } from "redis";
import { ConverterStrategy } from "..";
import { BinanceRawOrder, BinanceRawOrderbook, Order, Orderbook } from "../../../types";

const BASE_CURRENCY = process.env.BASE_CURRENCY || "USDT";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export class BinanceConverterStrategy implements ConverterStrategy {
    private redisClient =  createClient({ url: REDIS_URL });

    async setup() {
        await this.redisClient.connect();
    }

    async convert(orderbook: BinanceRawOrderbook): Promise<Orderbook> {
        return {
            bids: await this.modify(orderbook.bids),
            asks: await this.modify(orderbook.asks),
        };
    }

    async modify(orders: Array<BinanceRawOrder>): Promise<Array<Order>> {
        const BASE_CURRENCY_PRICE = await this.redisClient.get(BASE_CURRENCY);
        if (!BASE_CURRENCY_PRICE) throw new Error("BASE_CURRENCY source not available");
        return orders.map(([price, amount]) => {
            const priceInIDR = +price * +BASE_CURRENCY_PRICE!;
            const amountInIDR = +amount * priceInIDR;

            return [priceInIDR, amountInIDR];
        });
    }
}

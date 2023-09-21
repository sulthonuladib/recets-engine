import client from "amqplib";
import { RedisClientType, createClient } from "redis";

import {
    Order,
    Orderbook,
    BinanceRawOrder,
    RawOrderbook,
    BinanceRawOrderbook,
    RawOrder,
} from "./types";

const REDIS_URL = process.env.REDIS_URL
if (!REDIS_URL) throw new Error("REDIS_URL is not defined");
const AMQP_URL = process.env.AMQP_URL
if (!AMQP_URL) throw new Error("AMQP_URL is not defined");
const BASE_CURRENCY = process.env.BASE_CURRENCY
if (!BASE_CURRENCY) throw new Error("BASE_CURRENCY is not defined");

console.log("[CONVERTER] BASE_CURRENCY", BASE_CURRENCY);

const redis = createClient({ url: REDIS_URL });
const connection = await client.connect(AMQP_URL);
console.log("[CONVERTER] Connected to AMQP");

const consumer = await connection.createChannel();
await consumer.assertQueue("convert-service");

const producer = await connection.createChannel();
await producer.assertQueue("search-service");

await redis.connect();
console.log("[CONVERTER] Connected to Redis");

export enum Exchange {
    Binance = "binance",
    Indodax = "indodax",
}

interface ConverterStrategy {
    modify(order: Array<RawOrder>): Promise<Array<Order>>;
    convert(orderbook: RawOrderbook): Promise<Orderbook>;
}

class BinanceConverterStrategy implements ConverterStrategy {
    async convert(orderbook: BinanceRawOrderbook): Promise<Orderbook> {
        return {
            bids: await this.modify(orderbook.bids),
            asks: await this.modify(orderbook.asks),
        };
    }

    async modify(orders: Array<BinanceRawOrder>): Promise<Array<Order>> {
        // NOTE: can use your own base currency trade pair
        const BASE_CURRENCY_PRICE = await redis.get(BASE_CURRENCY as string)
        if (!BASE_CURRENCY_PRICE) throw new Error("BASE_CURRENCY source not available");
        return orders.map(([price, amount]) => {
            const priceInIDR = +price * +BASE_CURRENCY_PRICE!;
            const amountInIDR = +amount * priceInIDR;

            return [priceInIDR, amountInIDR];
        });
    }
}

class IndodaxConverterStrategy implements ConverterStrategy {
    modify(order: RawOrder[]): Promise<Order[]> {
        throw new Error("Method not implemented.");
    }
    convert(orderbook: RawOrderbook): Promise<Orderbook> {
        throw new Error("Method not implemented.");
    }
}

class ConverterFactory {
    static create(exchange: Exchange): ConverterStrategy {
        switch (exchange) {
            case Exchange.Binance:
                return new BinanceConverterStrategy();
            case Exchange.Indodax:
                return new IndodaxConverterStrategy();
            default:
                throw new Error("Unknown exchange");
        }
    }
}

console.log("[CONVERTER] Started");

await consumer.consume("convert-service", async (message) => {
    if (!message) return;
    const payload = JSON.parse(message.content.toString()) as {
        coin: string;
        exchange: Exchange;
    } & RawOrderbook;
    const factory = ConverterFactory.create(payload.exchange);
    const result = await factory.convert(payload);
    console.log(`[${payload.exchange}]:[${payload.coin}]`, result);

    consumer.ack(message);
    producer.sendToQueue("search-service", Buffer.from(JSON.stringify({
        coin: payload.coin,
        exchange: payload.exchange,
        orderbook: result,
    })));
});

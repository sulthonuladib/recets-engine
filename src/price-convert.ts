import client from "amqplib";
import { createClient } from "redis";

import {
    Order,
    Orderbook,
    BinanceRawOrder,
    RawOrderbook,
    BinanceRawOrderbook,
    RawOrder,
} from "./types";

export enum Exchange {
    Binance = "binance",
    Indodax = "indodax",
}

interface ConverterStrategy {
    modify(order: Array<RawOrder>): Array<Order>;
    convert(orderbook: RawOrderbook): Orderbook;
}

class BinanceConverterStrategy implements ConverterStrategy {
    convert(orderbook: BinanceRawOrderbook): Orderbook {
        return {
            bids: this.modify(orderbook.bids),
            asks: this.modify(orderbook.asks),
        };
    }

    modify(orders: Array<BinanceRawOrder>): Array<Order> {
        return orders.map(([price, amount]) => {
            return [parseFloat(price), parseFloat(amount)];
        });
    }
}

class IndodaxConverterStrategy implements ConverterStrategy {
    modify(_order: RawOrder[]): Order[] {
        throw new Error("Method not implemented.");
    }
    convert(_orderbook: RawOrderbook): Orderbook {
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

const REDIS_URL = process.env.REDIS_URL
const AMQP_URL = process.env.AMQP_URL
if (!REDIS_URL) throw new Error("REDIS_URL is not defined");
if (!AMQP_URL) throw new Error("AMQP_URL is not defined");

const redis = createClient({ url: REDIS_URL });
const connection = await client.connect(AMQP_URL);
const consumer = await connection.createChannel();

const producer = await connection.createChannel();
await producer.assertQueue("search-service");

await redis.connect();

await consumer.consume("convert-service", (message) => {
    if (!message) return;
    const payload = JSON.parse(message.content.toString()) as {
        coin: string;
        exchange: Exchange;
    } & RawOrderbook;
    const factory = ConverterFactory.create(payload.exchange);
    const result = factory.convert(payload);
    console.log(result);

    consumer.ack(message);
    producer.sendToQueue("search-service", Buffer.from(JSON.stringify({
        coin: payload.coin,
        exchange: payload.exchange,
        orderbook: result,
    })));
});

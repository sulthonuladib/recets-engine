import client from "amqplib";
import { ConverterStrategyFactory } from "./services/price-converter";
import { Exchange, RawOrderbook } from "./types";

const AMQP_URL = process.env.AMQP_URL
if (!AMQP_URL) throw new Error("AMQP_URL is not defined");
const BASE_CURRENCY = process.env.BASE_CURRENCY
if (!BASE_CURRENCY) throw new Error("BASE_CURRENCY is not defined");

const connection = await client.connect(AMQP_URL);
const consumer = await connection.createChannel();
const producer = await connection.createChannel();
await consumer.assertQueue("convert-service");
await producer.assertQueue("search-service");

const converterStrategyFactory = new ConverterStrategyFactory();
await converterStrategyFactory.register(Exchange.Binance);
// await converterStrategyFactory.register(Exchange.Indodax);

await consumer.consume("convert-service", async (message) => {
    if (!message) return;
    const payload = JSON.parse(message.content.toString()) as {
        coin: string;
        exchange: Exchange;
    } & RawOrderbook;
    const factory = converterStrategyFactory.get(payload.exchange);
    const result = await factory.convert(payload);
    console.log(`[${payload.exchange}]:[${payload.coin}]`, result);

    consumer.ack(message);
    producer.sendToQueue("search-service", Buffer.from(JSON.stringify({
        coin: payload.coin,
        exchange: payload.exchange,
        orderbook: result,
    })));
});

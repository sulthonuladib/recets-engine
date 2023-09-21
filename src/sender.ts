import { Schema, createConnection } from "mongoose";

// NOTE: you can use your own database for your subscription list
const DB_URL = process.env.MONGO_URL;
if (!DB_URL) throw new Error("MONGO_URL is not defined");

const schema = new Schema({
    symbol: { type: String, required: true, unique: true },
    binance: { type: Boolean, default: false },
    indodax: { type: Boolean, default: false },
    huobi: { type: Boolean, default: false },
    reku: { type: Boolean, default: false },
    bybit: { type: Boolean, default: false },
    okx: { type: Boolean, default: false },
    kucoin: { type: Boolean, default: false },
    reason: { type: String, required: false, default: "" },
});
schema.set("toJSON", {
    transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
    },
});
const conn = createConnection(DB_URL);
const ActiveCoin = conn.model("active_coin", schema);
const coins = await ActiveCoin.find({ binance: true });
const subs = coins
    .map((coin) => {
        return `${coin.symbol}usdt@depth20@100ms`;
    })
    .join("/");

import { BinanceRawOrderbook } from "./types";
import client from "amqplib";

import WebSocket, { RawData } from "ws";

type Message = {
    stream: string;
    data: BinanceRawOrderbook;
};

const socket = new WebSocket(
    "wss://stream.binance.com:9443/stream?streams=" + subs
);
const connection = await client.connect("amqp://localhost:5672");
const channel = await connection.createChannel();
await channel.assertQueue("convert-service");

socket.on("open", function () {
    console.log("Connected to WebSocket");
});

socket.on("message", function (event) {
    console.log(event);
    const message = parseMessage(event);
    if (!message) {
        console.error("Failed to parse message");
        return;
    }
    const coin = message.stream.split("@").shift()!.split("usdt").shift()!;

    channel.sendToQueue(
        "convert-service",
        Buffer.from(
            JSON.stringify({
                coin,
                exchange: "binance",
                ...message.data,
            })
        )
    );
});

socket.on("close", function () {
    console.log("Disconnected from WebSocket");
});

socket.on("error", function () {
    console.log("Error from WebSocket");
});

socket.on("ping", function () {
    console.log("Ping from WebSocket");
    socket.pong();
});

setInterval(function () {
    console.log("Sending ping to WebSocket");
    socket.ping();
}, 30000);

function parseMessage(message: RawData): Message | null {
    try {
        const result = JSON.parse(message.toString());
        return result;
    } catch (error: unknown) {
        console.error(error);
        return null;
    }
}

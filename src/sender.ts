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

console.log("[SENDER:BINANCE] subscribtion", coins.map((coin) => coin.symbol), coins.length);
import { BinanceRawOrderbook } from "./types";
import client from "amqplib";

import WebSocket, { RawData } from "ws";

type Message = {
    stream: string;
    data: BinanceRawOrderbook;
};

console.log("[SENDER:BINANCE] Connecting to WebSocket");
console.log(
    "[SENDER:BINANCE] Subscribe to",
    "\n" + coins.map((coin) => coin.symbol).join(","),
    "\n[SENDER:BINANCE] Total coins: " + coins.length.toString()
);
const socket = new WebSocket(
    "wss://stream.binance.com:9443/stream?streams=" + subs
);
const connection = await client.connect("amqp://localhost:5672");
const channel = await connection.createChannel();
await channel.assertQueue("convert-service");

socket.on("open", function() {
    console.log("[SENDER:BINANCE] Connected to WebSocket");
});

socket.on("message", function(event) {
    const message = parseMessage(event);
    if (!message) {
        console.error("[SENDER:BINANCE] Failed to parse message");
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

socket.on("close", function() {
    console.log("[SENDER:BINANCE] Disconnected from WebSocket");
});

socket.on("error", function() {
    console.log("[SENDER:BINANCE] Error from WebSocket");
});

socket.on("ping", function() {
    console.log("[SENDER:BINANCE] Ping from WebSocket");
    socket.pong();
});

setInterval(function() {
    console.log("[SENDER:BINANCE] Sending ping to WebSocket");
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

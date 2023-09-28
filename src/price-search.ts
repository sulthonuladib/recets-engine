import client from 'amqplib';
import { Kafka } from 'kafkajs';

import { SearchPayload } from './types';
import SearchService from './services/price-search.service';

const target = 100;
const searchService = new SearchService(target);
const consumerChannelName = "search-service";
const connection = await client.connect("amqp://localhost:5672");
const consumer = await connection.createChannel();

const KAFKA_PRODUCER_CONFIG = {
    clientId: 'search-service',
    brokers: ['localhost:9094']
}
const kafka = new Kafka(KAFKA_PRODUCER_CONFIG);
const producer = kafka.producer({
    allowAutoTopicCreation: true,
});
await producer.connect();

console.log("[SEARCH] Connected to AMQP");
console.log("[SEARCH] Started");

await consumer.consume(consumerChannelName, async (message) => {
    if (!message) return;
    const { exchange, coin, orderbook } = JSON.parse(
        message.content.toString()
    ) as SearchPayload;
    consumer.ack(message);
    const result = searchService.execute(orderbook);

    await producer.send({
        topic: 'your-kafka-topic-name',
        messages: [
            {
                value: JSON.stringify({
                    // _id: `${exchange}-${coin}`,
                    ...result,
                    coin,
                    exchange
                })
            }
        ]
    });
});

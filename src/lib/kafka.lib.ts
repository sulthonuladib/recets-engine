import { Kafka, Producer, Consumer, KafkaMessage, KafkaConfig } from "kafkajs";

export class KafkaClient {
  private producer!: Producer;
  private consumer!: Consumer;

  constructor(private config: KafkaConfig) {}

  public async connect(): Promise<void> {
    const kafka = new Kafka(this.config);
    this.producer = kafka.producer();
    this.consumer = kafka.consumer({ groupId: "search-group" });
    await this.producer.connect();
    await this.consumer.connect();
  }

  public async consume(
    topic: string,
    onMessage: (message: KafkaMessage) => Promise<void>
  ): Promise<void> {
    await this.consumer.subscribe({ topic, fromBeginning: true });
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (!message) return;
        await onMessage(message);
      },
    });
  }

  public async produce(
    topic: string,
    messages: Array<KafkaMessage>
  ): Promise<void> {
    await this.producer.send({ topic, messages });
  }
}

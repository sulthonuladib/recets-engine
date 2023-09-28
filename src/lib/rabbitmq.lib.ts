import * as amqp from 'amqplib';

export class RabbitMQLib {
    private connection!: amqp.Connection;
    private channel!: amqp.Channel;

    constructor(private url: string) {
        this.connect()
    }

    public async connect(): Promise<void> {
        this.connection = await amqp.connect(this.url);
        this.channel = await this.connection.createChannel();
    }

    public async consume(queue: string, onMessage: (message: amqp.ConsumeMessage | null) => Promise<void>): Promise<void> {
        await this.channel.consume(queue, onMessage);
    }

    public ack(message: amqp.ConsumeMessage): void {
        this.channel.ack(message);
    }
}
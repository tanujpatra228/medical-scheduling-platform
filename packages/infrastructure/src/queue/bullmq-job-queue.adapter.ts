import { Queue } from "bullmq";
import type { IJobQueuePort } from "@msp/application";

export interface RedisConnectionConfig {
  host: string;
  port: number;
}

export class BullMQJobQueueAdapter implements IJobQueuePort {
  private readonly queues = new Map<string, Queue>();

  constructor(private readonly redisConfig: RedisConnectionConfig) {}

  async enqueue(
    queueName: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const queue = this.getOrCreateQueue(queueName);
    await queue.add(queueName, data);
  }

  async schedule(
    queueName: string,
    data: Record<string, unknown>,
    delayMs: number,
  ): Promise<void> {
    const queue = this.getOrCreateQueue(queueName);
    await queue.add(queueName, data, { delay: delayMs });
  }

  async close(): Promise<void> {
    const closePromises = Array.from(this.queues.values()).map((q) =>
      q.close(),
    );
    await Promise.all(closePromises);
    this.queues.clear();
  }

  private getOrCreateQueue(queueName: string): Queue {
    let queue = this.queues.get(queueName);
    if (!queue) {
      queue = new Queue(queueName, {
        connection: {
          host: this.redisConfig.host,
          port: this.redisConfig.port,
        },
      });
      this.queues.set(queueName, queue);
    }
    return queue;
  }
}

import { Worker, type Processor } from "bullmq";

export interface WorkerRegistryConfig {
  host: string;
  port: number;
}

export class BullMQWorkerRegistry {
  private readonly workers: Worker[] = [];

  constructor(private readonly redisConfig: WorkerRegistryConfig) {}

  registerWorker(queueName: string, processor: Processor): Worker {
    const worker = new Worker(queueName, processor, {
      connection: {
        host: this.redisConfig.host,
        port: this.redisConfig.port,
      },
    });

    worker.on("failed", (job, err) => {
      console.error(
        `[Worker:${queueName}] Job ${job?.id} failed:`,
        err.message,
      );
    });

    this.workers.push(worker);
    return worker;
  }

  async closeAll(): Promise<void> {
    const closePromises = this.workers.map((w) => w.close());
    await Promise.all(closePromises);
    this.workers.length = 0;
  }
}

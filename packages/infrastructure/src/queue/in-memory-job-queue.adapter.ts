import type { IJobQueuePort } from "@msp/application";

export interface StoredJob {
  queueName: string;
  data: Record<string, unknown>;
  delayMs?: number;
  enqueuedAt: Date;
}

export class InMemoryJobQueueAdapter implements IJobQueuePort {
  private readonly jobs: StoredJob[] = [];

  async enqueue(
    queueName: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    this.jobs.push({ queueName, data, enqueuedAt: new Date() });
  }

  async schedule(
    queueName: string,
    data: Record<string, unknown>,
    delayMs: number,
  ): Promise<void> {
    this.jobs.push({ queueName, data, delayMs, enqueuedAt: new Date() });
  }

  getJobs(queueName?: string): readonly StoredJob[] {
    if (queueName) {
      return this.jobs.filter((j) => j.queueName === queueName);
    }
    return this.jobs;
  }

  clear(): void {
    this.jobs.length = 0;
  }
}

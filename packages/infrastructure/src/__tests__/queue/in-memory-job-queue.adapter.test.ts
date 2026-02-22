import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryJobQueueAdapter } from "../../queue/in-memory-job-queue.adapter";

describe("InMemoryJobQueueAdapter", () => {
  let adapter: InMemoryJobQueueAdapter;

  beforeEach(() => {
    adapter = new InMemoryJobQueueAdapter();
  });

  it("should store enqueued jobs", async () => {
    await adapter.enqueue("email-dispatch", { to: "user@test.com" });

    const jobs = adapter.getJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].queueName).toBe("email-dispatch");
    expect(jobs[0].data).toEqual({ to: "user@test.com" });
    expect(jobs[0].delayMs).toBeUndefined();
  });

  it("should store scheduled jobs with delay", async () => {
    await adapter.schedule("reminders", { id: "123" }, 86400000);

    const jobs = adapter.getJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].delayMs).toBe(86400000);
  });

  it("should filter jobs by queue name", async () => {
    await adapter.enqueue("queue-a", { a: 1 });
    await adapter.enqueue("queue-b", { b: 2 });
    await adapter.enqueue("queue-a", { a: 3 });

    const filtered = adapter.getJobs("queue-a");
    expect(filtered).toHaveLength(2);
    expect(filtered.every((j) => j.queueName === "queue-a")).toBe(true);
  });

  it("should return all jobs when no filter is provided", async () => {
    await adapter.enqueue("queue-a", { a: 1 });
    await adapter.enqueue("queue-b", { b: 2 });

    expect(adapter.getJobs()).toHaveLength(2);
  });

  it("should clear all jobs", async () => {
    await adapter.enqueue("q1", {});
    await adapter.enqueue("q2", {});

    adapter.clear();
    expect(adapter.getJobs()).toHaveLength(0);
  });
});

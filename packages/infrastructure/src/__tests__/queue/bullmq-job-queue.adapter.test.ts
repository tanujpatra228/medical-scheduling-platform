import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAdd = vi.fn().mockResolvedValue({});
const mockClose = vi.fn().mockResolvedValue(undefined);

vi.mock("bullmq", () => {
  return {
    Queue: class MockQueue {
      add = mockAdd;
      close = mockClose;
      constructor(..._args: unknown[]) {}
    },
  };
});

import { BullMQJobQueueAdapter } from "../../queue/bullmq-job-queue.adapter";

describe("BullMQJobQueueAdapter", () => {
  let adapter: BullMQJobQueueAdapter;

  beforeEach(() => {
    mockAdd.mockClear();
    mockClose.mockClear();
    adapter = new BullMQJobQueueAdapter({ host: "localhost", port: 6379 });
  });

  it("should add a job on enqueue", async () => {
    await adapter.enqueue("test-queue", { foo: "bar" });
    expect(mockAdd).toHaveBeenCalledWith("test-queue", { foo: "bar" });
  });

  it("should reuse the same queue instance for the same queue name", async () => {
    await adapter.enqueue("test-queue", { a: 1 });
    await adapter.enqueue("test-queue", { b: 2 });

    expect(mockAdd).toHaveBeenCalledTimes(2);
  });

  it("should schedule a job with delay", async () => {
    await adapter.schedule("test-queue", { x: 1 }, 5000);
    expect(mockAdd).toHaveBeenCalledWith("test-queue", { x: 1 }, { delay: 5000 });
  });

  it("should close all queues", async () => {
    await adapter.enqueue("q1", {});
    await adapter.enqueue("q2", {});
    await adapter.close();

    expect(mockClose).toHaveBeenCalledTimes(2);
  });
});

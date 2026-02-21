import { describe, it, expect, vi, beforeEach } from "vitest";
import { RedisCacheAdapter } from "../../cache/redis-cache.adapter";

const mockRedisInstance = {
  connect: vi.fn().mockResolvedValue(undefined),
  quit: vi.fn().mockResolvedValue("OK"),
  get: vi.fn(),
  set: vi.fn().mockResolvedValue("OK"),
  setex: vi.fn().mockResolvedValue("OK"),
  del: vi.fn().mockResolvedValue(1),
  scan: vi.fn(),
};

vi.mock("ioredis", () => {
  return {
    default: class MockRedis {
      constructor() {
        return mockRedisInstance;
      }
    },
  };
});

describe("RedisCacheAdapter", () => {
  let adapter: RedisCacheAdapter;
  const mockClient = mockRedisInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default resolved values after clearAllMocks
    mockClient.connect.mockResolvedValue(undefined);
    mockClient.quit.mockResolvedValue("OK");
    mockClient.set.mockResolvedValue("OK");
    mockClient.setex.mockResolvedValue("OK");
    mockClient.del.mockResolvedValue(1);

    adapter = new RedisCacheAdapter({ host: "localhost", port: 6379 });
  });

  describe("get", () => {
    it("should return parsed value when key exists", async () => {
      mockClient.get.mockResolvedValue(JSON.stringify({ name: "test" }));

      const result = await adapter.get<{ name: string }>("key1");

      expect(result).toEqual({ name: "test" });
      expect(mockClient.get).toHaveBeenCalledWith("key1");
    });

    it("should return null when key does not exist", async () => {
      mockClient.get.mockResolvedValue(null);

      const result = await adapter.get("missing");

      expect(result).toBeNull();
    });

    it("should return null for invalid JSON", async () => {
      mockClient.get.mockResolvedValue("not-valid-json");

      const result = await adapter.get("bad-key");

      expect(result).toBeNull();
    });
  });

  describe("set", () => {
    it("should set value without TTL", async () => {
      await adapter.set("key1", { data: "value" });

      expect(mockClient.set).toHaveBeenCalledWith(
        "key1",
        JSON.stringify({ data: "value" }),
      );
    });

    it("should set value with TTL using setex", async () => {
      await adapter.set("key1", { data: "value" }, 300);

      expect(mockClient.setex).toHaveBeenCalledWith(
        "key1",
        300,
        JSON.stringify({ data: "value" }),
      );
    });
  });

  describe("delete", () => {
    it("should delete a key", async () => {
      await adapter.delete("key1");

      expect(mockClient.del).toHaveBeenCalledWith("key1");
    });
  });

  describe("deletePattern", () => {
    it("should scan and delete matching keys", async () => {
      mockClient.scan
        .mockResolvedValueOnce(["10", ["key:1", "key:2"]])
        .mockResolvedValueOnce(["0", ["key:3"]]);

      await adapter.deletePattern("key:*");

      expect(mockClient.scan).toHaveBeenCalledTimes(2);
      expect(mockClient.del).toHaveBeenCalledWith("key:1", "key:2");
      expect(mockClient.del).toHaveBeenCalledWith("key:3");
    });

    it("should handle no matching keys", async () => {
      mockClient.scan.mockResolvedValueOnce(["0", []]);

      await adapter.deletePattern("nonexistent:*");

      expect(mockClient.del).not.toHaveBeenCalled();
    });
  });

  describe("connect/disconnect", () => {
    it("should connect", async () => {
      await adapter.connect();

      expect(mockClient.connect).toHaveBeenCalled();
    });

    it("should disconnect", async () => {
      await adapter.disconnect();

      expect(mockClient.quit).toHaveBeenCalled();
    });
  });
});

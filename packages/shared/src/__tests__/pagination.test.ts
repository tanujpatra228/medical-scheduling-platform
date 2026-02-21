import { describe, it, expect } from "vitest";
import { createPaginatedResult } from "../types/pagination";

describe("createPaginatedResult", () => {
  it("should calculate totalPages correctly", () => {
    const result = createPaginatedResult(["a", "b"], 10, { page: 1, limit: 2 });
    expect(result.totalPages).toBe(5);
    expect(result.total).toBe(10);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(2);
    expect(result.data).toEqual(["a", "b"]);
  });

  it("should handle empty data", () => {
    const result = createPaginatedResult([], 0, { page: 1, limit: 20 });
    expect(result.totalPages).toBe(0);
    expect(result.data).toEqual([]);
  });

  it("should round up totalPages", () => {
    const result = createPaginatedResult(["a"], 3, { page: 1, limit: 2 });
    expect(result.totalPages).toBe(2);
  });
});

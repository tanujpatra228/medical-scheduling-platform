import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    root: ".",
    include: ["src/__tests__/integration/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@api": path.resolve(__dirname, "src"),
      "@msp/shared": path.resolve(__dirname, "../../packages/shared/src"),
      "@msp/domain": path.resolve(__dirname, "../../packages/domain/src"),
      "@msp/application": path.resolve(__dirname, "../../packages/application/src"),
      "@msp/infrastructure": path.resolve(__dirname, "../../packages/infrastructure/src"),
    },
  },
});

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@msp/shared": path.resolve(__dirname, "../shared/src"),
      "@msp/domain": path.resolve(__dirname, "../domain/src"),
      "@msp/application": path.resolve(__dirname, "../application/src"),
    },
  },
});

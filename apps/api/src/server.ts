import { createApp } from "./app";
import { config } from "./config/environment";

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(
    `[API] Server running on port ${config.port} in ${config.nodeEnv} mode`
  );
});

function handleShutdown(signal: string): void {
  console.log(`[API] ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("[API] Server closed.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

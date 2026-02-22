import { createApp } from "./app";
import { createContainer, type Container } from "./container";
import { config } from "./config/environment";

let container: Container | undefined;

async function main(): Promise<void> {
  try {
    container = await createContainer();
    console.log("[API] Container initialized (DB connected).");
  } catch (err) {
    console.error("[API] Failed to initialize container:", err);
    console.warn("[API] Starting in health-only mode (no DB).");
  }

  const app = createApp(container);

  const server = app.listen(config.port, () => {
    console.log(
      `[API] Server running on port ${config.port} in ${config.nodeEnv} mode`
    );
  });

  function handleShutdown(signal: string): void {
    console.log(`[API] ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      if (container) {
        if (container.workerRegistry) {
          await container.workerRegistry.closeAll();
          console.log("[API] Worker registry closed.");
        }
        if (container.jobQueue.close) {
          await container.jobQueue.close();
          console.log("[API] Job queue closed.");
        }
        await container.dataSource.destroy();
        console.log("[API] Database connection closed.");
      }
      console.log("[API] Server closed.");
      process.exit(0);
    });
  }

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
}

main();

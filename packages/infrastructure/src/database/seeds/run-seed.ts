import { createDataSource } from "../data-source";
import { seedDevelopmentData } from "./development-seed";

async function main(): Promise<void> {
  console.log("Initializing database connection...");

  const dataSource = createDataSource({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    username: process.env.DB_USERNAME || "msp_user",
    password: process.env.DB_PASSWORD || "msp_password",
    database: process.env.DB_NAME || "msp_dev",
    ssl: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log("Database connected. Running seed...");
    await seedDevelopmentData(dataSource);
    console.log("Seed completed!");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log("Database connection closed.");
    }
  }
}

main();

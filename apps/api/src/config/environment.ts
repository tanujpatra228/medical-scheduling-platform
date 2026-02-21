import dotenv from "dotenv";
import { z } from "zod/v4";

dotenv.config();

const DEFAULT_PORT = 3001;
const DEFAULT_API_PREFIX = "/api/v1";
const DEFAULT_CORS_ORIGIN = "*";

const NodeEnvironment = z.enum(["development", "production", "test"]);

const environmentSchema = z.object({
  PORT: z
    .string()
    .default(String(DEFAULT_PORT))
    .transform(Number)
    .pipe(z.number().int().positive()),
  NODE_ENV: NodeEnvironment.default("development"),
  API_PREFIX: z.string().startsWith("/").default(DEFAULT_API_PREFIX),
  CORS_ORIGIN: z.string().default(DEFAULT_CORS_ORIGIN),
});

type Environment = z.infer<typeof environmentSchema>;

function loadEnvironment(): Environment {
  const result = environmentSchema.safeParse(process.env);

  if (!result.success) {
    const formattedErrors = z.prettifyError(result.error);
    console.error("Invalid environment configuration:\n", formattedErrors);
    process.exit(1);
  }

  return result.data;
}

const environment = loadEnvironment();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  apiPrefix: string;
  corsOrigin: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
}

export const config: Readonly<AppConfig> = Object.freeze({
  port: environment.PORT,
  nodeEnv: environment.NODE_ENV,
  apiPrefix: environment.API_PREFIX,
  corsOrigin: environment.CORS_ORIGIN,
  isProduction: environment.NODE_ENV === "production",
  isDevelopment: environment.NODE_ENV === "development",
  isTest: environment.NODE_ENV === "test",
});

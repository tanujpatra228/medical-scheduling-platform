import dotenv from "dotenv";
import { z } from "zod/v4";

dotenv.config();

const DEFAULT_PORT = 3001;
const DEFAULT_API_PREFIX = "/api/v1";
const DEFAULT_CORS_ORIGIN = "*";
const DEFAULT_DB_HOST = "localhost";
const DEFAULT_DB_PORT = 5432;
const DEFAULT_DB_USERNAME = "msp_user";
const DEFAULT_DB_PASSWORD = "msp_password";
const DEFAULT_DB_NAME = "msp_dev";
const DEFAULT_REDIS_HOST = "localhost";
const DEFAULT_REDIS_PORT = 6379;
const DEFAULT_SMTP_HOST = "localhost";
const DEFAULT_SMTP_PORT = 1025;
const DEFAULT_SMTP_FROM = "noreply@msp.local";
const DEFAULT_JWT_EXPIRES_IN = "15m";
const DEFAULT_JWT_REFRESH_EXPIRES_IN = "7d";

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

  DB_HOST: z.string().default(DEFAULT_DB_HOST),
  DB_PORT: z
    .string()
    .default(String(DEFAULT_DB_PORT))
    .transform(Number)
    .pipe(z.number().int().positive()),
  DB_USERNAME: z.string().default(DEFAULT_DB_USERNAME),
  DB_PASSWORD: z.string().default(DEFAULT_DB_PASSWORD),
  DB_NAME: z.string().default(DEFAULT_DB_NAME),

  REDIS_HOST: z.string().default(DEFAULT_REDIS_HOST),
  REDIS_PORT: z
    .string()
    .default(String(DEFAULT_REDIS_PORT))
    .transform(Number)
    .pipe(z.number().int().positive()),

  JWT_SECRET: z.string().default("dev-secret-change-in-production"),
  JWT_EXPIRES_IN: z.string().default(DEFAULT_JWT_EXPIRES_IN),
  JWT_REFRESH_EXPIRES_IN: z.string().default(DEFAULT_JWT_REFRESH_EXPIRES_IN),

  SMTP_HOST: z.string().default(DEFAULT_SMTP_HOST),
  SMTP_PORT: z
    .string()
    .default(String(DEFAULT_SMTP_PORT))
    .transform(Number)
    .pipe(z.number().int().positive()),
  SMTP_SECURE: z.string().default("false").transform((v) => v === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default(DEFAULT_SMTP_FROM),
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

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
}

export interface RedisConfig {
  host: string;
  port: number;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
  from: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  apiPrefix: string;
  corsOrigin: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  database: DatabaseConfig;
  redis: RedisConfig;
  jwt: JwtConfig;
  smtp: SmtpConfig;
}

export const config: Readonly<AppConfig> = Object.freeze({
  port: environment.PORT,
  nodeEnv: environment.NODE_ENV,
  apiPrefix: environment.API_PREFIX,
  corsOrigin: environment.CORS_ORIGIN,
  isProduction: environment.NODE_ENV === "production",
  isDevelopment: environment.NODE_ENV === "development",
  isTest: environment.NODE_ENV === "test",
  database: Object.freeze({
    host: environment.DB_HOST,
    port: environment.DB_PORT,
    username: environment.DB_USERNAME,
    password: environment.DB_PASSWORD,
    name: environment.DB_NAME,
  }),
  redis: Object.freeze({
    host: environment.REDIS_HOST,
    port: environment.REDIS_PORT,
  }),
  jwt: Object.freeze({
    secret: environment.JWT_SECRET,
    expiresIn: environment.JWT_EXPIRES_IN,
    refreshExpiresIn: environment.JWT_REFRESH_EXPIRES_IN,
  }),
  smtp: Object.freeze({
    host: environment.SMTP_HOST,
    port: environment.SMTP_PORT,
    secure: environment.SMTP_SECURE,
    ...(environment.SMTP_USER && environment.SMTP_PASS
      ? { auth: { user: environment.SMTP_USER, pass: environment.SMTP_PASS } }
      : {}),
    from: environment.SMTP_FROM,
  }),
});

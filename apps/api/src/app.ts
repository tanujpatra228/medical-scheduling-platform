import express, { Express, RequestHandler } from "express";
import { config } from "./config/environment";
import { requestIdMiddleware } from "./middleware/request-id";
import { notFoundHandler } from "./middleware/not-found";
import { globalErrorHandler } from "./middleware/error-handler";
import { registerRoutes } from "./routes";
import type { Container } from "./container";
import { openApiSpec } from "./swagger";

const MAX_REQUEST_BODY_SIZE = "10kb";

export function createApp(container?: Container): Express {
  const app = express();

  app.use(express.json({ limit: MAX_REQUEST_BODY_SIZE }));
  app.use(corsMiddleware);
  app.use(requestIdMiddleware);

  app.use(config.apiPrefix, registerRoutes(container));

  if (!config.isProduction) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const swaggerUi = require("swagger-ui-express") as typeof import("swagger-ui-express");
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  }

  app.use(notFoundHandler);
  // Express 5 types require explicit cast for error handlers (4-arg middleware)
  app.use(globalErrorHandler as unknown as RequestHandler);

  return app;
}

const corsMiddleware: RequestHandler = (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", config.corsOrigin);
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Request-Id"
  );
  res.setHeader("Access-Control-Expose-Headers", "X-Request-Id");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
};

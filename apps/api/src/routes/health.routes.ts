import { Router, RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { config } from "../config/environment";

const healthRouter: Router = Router();

const handleHealthCheck: RequestHandler = (_req, res, _next) => {
  res.status(StatusCodes.OK).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  });
};

healthRouter.get("/health", handleHealthCheck);

export { healthRouter };

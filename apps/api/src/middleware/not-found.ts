import { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { ErrorCode } from "../errors/app-error";

export const notFoundHandler: RequestHandler = (req, res, _next) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    error: {
      code: ErrorCode.NOT_FOUND,
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
};

import { ErrorRequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError, ErrorCode } from "../errors/app-error";
import { config } from "../config/environment";

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

function buildErrorResponse(error: AppError): ErrorResponse {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details !== undefined && { details: error.details }),
    },
  };
}

function buildUnknownErrorResponse(): ErrorResponse {
  return {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: "An unexpected error occurred",
    },
  };
}

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next
) => {
  if (config.isDevelopment) {
    console.error(`[Error] ${err.message}`, err.stack);
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json(buildErrorResponse(err));
    return;
  }

  console.error("[Unhandled Error]", err);

  res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json(buildUnknownErrorResponse());
};

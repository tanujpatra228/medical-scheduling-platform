import { ErrorRequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError, ErrorCode } from "../errors/app-error";
import { DomainError } from "@msp/domain";
import { config } from "../config/environment";

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

const DOMAIN_ERROR_STATUS_MAP: Record<string, number> = {
  EMAIL_ALREADY_EXISTS: StatusCodes.CONFLICT,
  INVALID_CREDENTIALS: StatusCodes.UNAUTHORIZED,
  INVALID_REFRESH_TOKEN: StatusCodes.UNAUTHORIZED,
};

const BOOKING_ERROR_STATUS_MAP: Record<string, number> = {
  SlotAlreadyBookedError: StatusCodes.CONFLICT,
  AppointmentNotFoundError: StatusCodes.NOT_FOUND,
  DoctorNotFoundForBookingError: StatusCodes.NOT_FOUND,
  PatientNotFoundForBookingError: StatusCodes.NOT_FOUND,
};

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

function buildDomainErrorResponse(error: DomainError): ErrorResponse {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
    },
  };
}

function buildBookingErrorResponse(err: Error): ErrorResponse {
  const code = err.constructor.name.replace(/Error$/, "").toUpperCase();
  return {
    success: false,
    error: {
      code,
      message: err.message,
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

  if (err instanceof DomainError) {
    const statusCode =
      DOMAIN_ERROR_STATUS_MAP[err.code] ?? StatusCodes.BAD_REQUEST;
    res.status(statusCode).json(buildDomainErrorResponse(err));
    return;
  }

  const bookingStatus = BOOKING_ERROR_STATUS_MAP[err.constructor?.name ?? ""];
  if (bookingStatus) {
    res.status(bookingStatus).json(buildBookingErrorResponse(err));
    return;
  }

  console.error("[Unhandled Error]", err);

  res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json(buildUnknownErrorResponse());
};

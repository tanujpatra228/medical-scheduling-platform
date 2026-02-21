import { StatusCodes } from "http-status-codes";

export enum ErrorCode {
  BAD_REQUEST = "BAD_REQUEST",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    isOperational = true,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message = "Bad request", details?: unknown): AppError {
    return new AppError(
      message,
      StatusCodes.BAD_REQUEST,
      ErrorCode.BAD_REQUEST,
      true,
      details
    );
  }

  static notFound(message = "Resource not found"): AppError {
    return new AppError(
      message,
      StatusCodes.NOT_FOUND,
      ErrorCode.NOT_FOUND,
      true
    );
  }

  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError(
      message,
      StatusCodes.UNAUTHORIZED,
      ErrorCode.UNAUTHORIZED,
      true
    );
  }

  static forbidden(message = "Forbidden"): AppError {
    return new AppError(
      message,
      StatusCodes.FORBIDDEN,
      ErrorCode.FORBIDDEN,
      true
    );
  }

  static internal(message = "Internal server error"): AppError {
    return new AppError(
      message,
      StatusCodes.INTERNAL_SERVER_ERROR,
      ErrorCode.INTERNAL_ERROR,
      false
    );
  }
}

import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

const REQUEST_ID_HEADER = "X-Request-Id";

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = randomUUID();

  (req as Request & { id: string }).id = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
}

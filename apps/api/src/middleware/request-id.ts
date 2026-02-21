import { RequestHandler } from "express";
import { randomUUID } from "crypto";

const REQUEST_ID_HEADER = "X-Request-Id";

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const requestId = randomUUID();

  (req as typeof req & { id: string }).id = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
};

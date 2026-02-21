import { RequestHandler } from "express";
import { z } from "zod/v4";

type ValidationTarget = "body" | "params" | "query";

export function validate(
  schema: z.ZodType,
  target: ValidationTarget = "body"
): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: errors,
        },
      });
      return;
    }

    req.validatedBody = target === "body" ? result.data : req.validatedBody;
    req.validatedParams =
      target === "params" ? result.data : req.validatedParams;
    req.validatedQuery = target === "query" ? result.data : req.validatedQuery;

    next();
  };
}

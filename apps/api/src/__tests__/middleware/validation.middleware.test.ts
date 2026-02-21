import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { z } from "zod/v4";
import { validate } from "@api/middleware/validation.middleware";

function createAppWithBodyValidation(schema: z.ZodType) {
  const app = express();
  app.use(express.json());

  app.post("/test", validate(schema, "body"), (req, res) => {
    res.status(200).json({ data: req.validatedBody });
  });

  return app;
}

function createAppWithQueryValidation(schema: z.ZodType) {
  const app = express();

  app.get("/test", validate(schema, "query"), (req, res) => {
    res.status(200).json({ data: req.validatedQuery });
  });

  return app;
}

function createAppWithParamsValidation(schema: z.ZodType) {
  const app = express();

  app.get("/test/:id", validate(schema, "params"), (req, res) => {
    res.status(200).json({ data: req.validatedParams });
  });

  return app;
}

describe("Validation Middleware", () => {
  describe("body validation", () => {
    const bodySchema = z.object({
      name: z.string().min(1),
      email: z.email(),
    });

    it("returns 400 with validation errors for invalid body", async () => {
      const app = createAppWithBodyValidation(bodySchema);

      const response = await request(app)
        .post("/test")
        .send({ name: "", email: "not-an-email" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.message).toBe("Request validation failed");
      expect(response.body.error.details).toBeInstanceOf(Array);
      expect(response.body.error.details.length).toBeGreaterThan(0);
    });

    it("returns 400 when required fields are missing", async () => {
      const app = createAppWithBodyValidation(bodySchema);

      const response = await request(app).post("/test").send({});

      expect(response.status).toBe(400);
      expect(response.body.error.details).toBeInstanceOf(Array);
    });

    it("passes through and attaches validated data for valid body", async () => {
      const app = createAppWithBodyValidation(bodySchema);

      const validData = { name: "John Doe", email: "john@example.com" };
      const response = await request(app).post("/test").send(validData);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(validData);
    });

    it("strips unknown fields from validated data", async () => {
      const strictSchema = z.object({
        name: z.string(),
      });
      const app = createAppWithBodyValidation(strictSchema);

      const response = await request(app)
        .post("/test")
        .send({ name: "John", extraField: "should-be-stripped" });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ name: "John" });
      expect(response.body.data.extraField).toBeUndefined();
    });

    it("includes path and message in validation error details", async () => {
      const app = createAppWithBodyValidation(bodySchema);

      const response = await request(app)
        .post("/test")
        .send({ name: "Valid", email: "bad" });

      expect(response.status).toBe(400);
      const detail = response.body.error.details.find(
        (d: { path: string }) => d.path === "email"
      );
      expect(detail).toBeDefined();
      expect(detail.message).toBeDefined();
    });
  });

  describe("query validation", () => {
    const querySchema = z.object({
      page: z.coerce.number().min(1),
      limit: z.coerce.number().min(1).max(100),
    });

    it("validates query parameters successfully", async () => {
      const app = createAppWithQueryValidation(querySchema);

      const response = await request(app).get("/test?page=1&limit=10");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ page: 1, limit: 10 });
    });

    it("returns 400 for invalid query parameters", async () => {
      const app = createAppWithQueryValidation(querySchema);

      const response = await request(app).get("/test?page=-1&limit=200");

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("params validation", () => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    it("validates route params successfully", async () => {
      const app = createAppWithParamsValidation(paramsSchema);
      const validUuid = "550e8400-e29b-41d4-a716-446655440000";

      const response = await request(app).get(`/test/${validUuid}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ id: validUuid });
    });

    it("returns 400 for invalid route params", async () => {
      const app = createAppWithParamsValidation(paramsSchema);

      const response = await request(app).get("/test/not-a-uuid");

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});

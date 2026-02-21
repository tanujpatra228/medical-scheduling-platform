import { describe, it, expect } from "vitest";
import express, { type RequestHandler } from "express";
import request from "supertest";
import { requireRole } from "@api/middleware/rbac.middleware";

function createAppWithRbac(
  allowedRoles: string[],
  user?: { userId: string; clinicId: string; role: string }
) {
  const app = express();

  // Middleware to simulate authenticated user context
  const injectUser: RequestHandler = (req, _res, next) => {
    if (user) {
      req.user = user;
    }
    next();
  };

  app.get(
    "/protected",
    injectUser,
    requireRole(...allowedRoles),
    (_req, res) => {
      res.status(200).json({ message: "Access granted" });
    }
  );

  return app;
}

describe("RBAC Middleware", () => {
  it("returns 401 when no user context is present", async () => {
    const app = createAppWithRbac(["admin"]);

    const response = await request(app).get("/protected");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
  });

  it("returns 403 when user role is not in the allowed list", async () => {
    const user = { userId: "u1", clinicId: "c1", role: "patient" };
    const app = createAppWithRbac(["admin", "doctor"], user);

    const response = await request(app).get("/protected");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "You do not have permission to access this resource",
      },
    });
  });

  it("passes through when user role matches a single allowed role", async () => {
    const user = { userId: "u1", clinicId: "c1", role: "admin" };
    const app = createAppWithRbac(["admin"], user);

    const response = await request(app).get("/protected");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Access granted");
  });

  it("passes through when user role matches one of multiple allowed roles", async () => {
    const user = { userId: "u1", clinicId: "c1", role: "doctor" };
    const app = createAppWithRbac(["admin", "doctor", "nurse"], user);

    const response = await request(app).get("/protected");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Access granted");
  });

  it("rejects when user has a different role than all allowed roles", async () => {
    const user = { userId: "u1", clinicId: "c1", role: "receptionist" };
    const app = createAppWithRbac(["admin", "doctor"], user);

    const response = await request(app).get("/protected");

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("handles case-sensitive role matching", async () => {
    const user = { userId: "u1", clinicId: "c1", role: "Admin" };
    const app = createAppWithRbac(["admin"], user);

    const response = await request(app).get("/protected");

    // "Admin" !== "admin" - roles are case-sensitive
    expect(response.status).toBe(403);
  });
});

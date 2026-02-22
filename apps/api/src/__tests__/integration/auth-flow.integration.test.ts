import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import type { DataSource } from "@msp/infrastructure";
import type { Express } from "express";
import { createTestDataSource, truncateAllTables, seedTestClinic } from "./helpers/test-database";
import { createTestContainer } from "./helpers/test-container";
import { createApp } from "../../app";

const TEST_CLINIC_ID = "a0000000-0000-4000-8000-000000000001";
const API_PREFIX = "/api/v1";

describe("Auth Flow Integration", () => {
  let dataSource: DataSource;
  let app: Express;

  beforeAll(async () => {
    dataSource = createTestDataSource();
    await dataSource.initialize();
  });

  beforeEach(async () => {
    await truncateAllTables(dataSource);
    await seedTestClinic(dataSource, TEST_CLINIC_ID);
    const container = createTestContainer(dataSource);
    app = createApp(container);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  const registerPayload = {
    clinicId: TEST_CLINIC_ID,
    email: "patient@test.com",
    password: "SecurePassword123!",
    firstName: "John",
    lastName: "Doe",
  };

  async function registerUser(payload = registerPayload) {
    return request(app)
      .post(`${API_PREFIX}/auth/register`)
      .send(payload);
  }

  async function loginUser(email = registerPayload.email, password = registerPayload.password) {
    return request(app)
      .post(`${API_PREFIX}/auth/login`)
      .send({ clinicId: TEST_CLINIC_ID, email, password });
  }

  it("full lifecycle: register → login → refresh → access protected route", async () => {
    // Step 1: Register
    const registerRes = await registerUser();
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);
    expect(registerRes.body.data.accessToken).toBeDefined();
    expect(registerRes.body.data.refreshToken).toBeDefined();
    expect(registerRes.body.data.user.email).toBe("patient@test.com");
    expect(registerRes.body.data.user.role).toBe("PATIENT");

    // Step 2: Login
    const loginRes = await loginUser();
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.accessToken).toBeDefined();
    expect(loginRes.body.data.refreshToken).toBeDefined();

    // Step 3: Refresh token
    const refreshRes = await request(app)
      .post(`${API_PREFIX}/auth/refresh`)
      .send({ refreshToken: loginRes.body.data.refreshToken });
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).toBeDefined();

    // Step 4: Access protected route with new access token
    const protectedRes = await request(app)
      .get(`${API_PREFIX}/clinics/me`)
      .set("Authorization", `Bearer ${refreshRes.body.data.accessToken}`);
    expect(protectedRes.status).toBe(200);
    expect(protectedRes.body.success).toBe(true);
  });

  it("old refresh token is rejected after rotation", async () => {
    const registerRes = await registerUser();
    const originalRefreshToken = registerRes.body.data.refreshToken;

    // Use the refresh token to get a new pair
    const refreshRes = await request(app)
      .post(`${API_PREFIX}/auth/refresh`)
      .send({ refreshToken: originalRefreshToken });
    expect(refreshRes.status).toBe(200);

    // Try to use the old refresh token again — should fail
    const secondRefreshRes = await request(app)
      .post(`${API_PREFIX}/auth/refresh`)
      .send({ refreshToken: originalRefreshToken });
    expect(secondRefreshRes.status).toBe(401);
  });

  it("duplicate email returns 409", async () => {
    await registerUser();

    const duplicateRes = await registerUser();
    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
  });

  it("wrong password returns 401", async () => {
    await registerUser();

    const loginRes = await loginUser("patient@test.com", "WrongPassword!");
    expect(loginRes.status).toBe(401);
    expect(loginRes.body.success).toBe(false);
  });

  it("missing token returns 401 on protected route", async () => {
    const res = await request(app)
      .get(`${API_PREFIX}/clinics/me`);
    expect(res.status).toBe(401);
  });

  it("invalid token returns 401 on protected route", async () => {
    const res = await request(app)
      .get(`${API_PREFIX}/clinics/${TEST_CLINIC_ID}`)
      .set("Authorization", "Bearer invalid-token-here");
    expect(res.status).toBe(401);
  });
});

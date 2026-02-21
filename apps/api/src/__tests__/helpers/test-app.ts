import request from 'supertest';
import { createApp } from '@api/app';

/**
 * Creates a fresh Express application instance for testing.
 * Uses the real createApp() factory to ensure tests exercise
 * the actual middleware stack and route configuration.
 */
export function createTestApp() {
  return createApp();
}

/**
 * Creates a supertest request wrapper around a fresh test app.
 * Each call produces an isolated app instance, ensuring test independence.
 */
export function createTestRequest() {
  const app = createTestApp();
  return request(app);
}

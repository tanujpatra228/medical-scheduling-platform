import { describe, it, expect } from 'vitest';
import { createTestRequest } from './helpers/test-app';
import { config } from '@api/config/environment';

const HEALTH_PATH = `${config.apiPrefix}/health`;

describe('GET /health', () => {
  it('returns 200 status', async () => {
    const response = await createTestRequest().get(HEALTH_PATH);

    expect(response.status).toBe(200);
  });

  it('returns JSON with status "ok"', async () => {
    const response = await createTestRequest().get(HEALTH_PATH);

    expect(response.body.status).toBe('ok');
  });

  it('returns timestamp as a valid ISO 8601 string', async () => {
    const response = await createTestRequest().get(HEALTH_PATH);

    const { timestamp } = response.body;
    expect(typeof timestamp).toBe('string');
    expect(new Date(timestamp).toISOString()).toBe(timestamp);
  });

  it('returns uptime as a number', async () => {
    const response = await createTestRequest().get(HEALTH_PATH);

    expect(typeof response.body.uptime).toBe('number');
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('returns environment as a string', async () => {
    const response = await createTestRequest().get(HEALTH_PATH);

    expect(typeof response.body.environment).toBe('string');
    expect(response.body.environment.length).toBeGreaterThan(0);
  });

  it('includes X-Request-Id header in response', async () => {
    const response = await createTestRequest().get(HEALTH_PATH);

    expect(response.headers['x-request-id']).toBeDefined();
    expect(typeof response.headers['x-request-id']).toBe('string');
  });
});

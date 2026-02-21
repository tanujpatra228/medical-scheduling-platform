import { describe, it, expect } from 'vitest';
import { createTestRequest } from '../helpers/test-app';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('Request ID Middleware', () => {
  it('adds X-Request-Id header to the response', async () => {
    const response = await createTestRequest().get('/health');

    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('X-Request-Id is a valid UUID v4 format', async () => {
    const response = await createTestRequest().get('/health');

    const requestId = response.headers['x-request-id'];
    expect(requestId).toMatch(UUID_V4_REGEX);
  });

  it('generates a unique ID for each request', async () => {
    const response1 = await createTestRequest().get('/health');
    const response2 = await createTestRequest().get('/health');

    const id1 = response1.headers['x-request-id'];
    const id2 = response2.headers['x-request-id'];

    expect(id1).not.toBe(id2);
  });

  it('includes X-Request-Id on error responses as well', async () => {
    const response = await createTestRequest().get('/nonexistent-route');

    expect(response.headers['x-request-id']).toBeDefined();
    expect(response.headers['x-request-id']).toMatch(UUID_V4_REGEX);
  });
});

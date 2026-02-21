import { describe, it, expect } from 'vitest';
import { createTestRequest } from '../helpers/test-app';

describe('Not Found Middleware', () => {
  it('returns 404 for unknown routes', async () => {
    const response = await createTestRequest().get('/this-route-does-not-exist');

    expect(response.status).toBe(404);
  });

  it('returns JSON error response in the correct format', async () => {
    const response = await createTestRequest().get('/nonexistent-endpoint');

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code');
    expect(response.body.error).toHaveProperty('message');
  });

  it('returns NOT_FOUND error code', async () => {
    const response = await createTestRequest().get('/unknown');

    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 for unknown routes with various HTTP methods', async () => {
    const postResponse = await createTestRequest().post('/nonexistent');
    const putResponse = await createTestRequest().put('/nonexistent');
    const deleteResponse = await createTestRequest().delete('/nonexistent');

    expect(postResponse.status).toBe(404);
    expect(putResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
  });
});

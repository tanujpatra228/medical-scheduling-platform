import { describe, it, expect } from 'vitest';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { AppError } from '@api/errors/app-error';
import { globalErrorHandler } from '@api/middleware/error-handler';

/**
 * Creates a minimal Express app with a route that throws the given error,
 * followed by the error handler middleware. This isolates the error handler
 * behavior without depending on the full app setup.
 */
function createAppWithError(error: Error) {
  const app = express();

  app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
    next(error);
  });

  app.use(globalErrorHandler);

  return app;
}

describe('Error Handler Middleware', () => {
  it('handles AppError and returns the correct status code', async () => {
    const appError = AppError.badRequest('Invalid email format');
    const app = createAppWithError(appError);

    const response = await request(app).get('/test');

    expect(response.status).toBe(400);
  });

  it('returns the correct JSON shape for AppError', async () => {
    const appError = AppError.notFound('User not found');
    const app = createAppWithError(appError);

    const response = await request(app).get('/test');

    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'User not found',
      },
    });
  });

  it('handles unknown errors and returns 500', async () => {
    const unknownError = new Error('Something unexpected');
    const app = createAppWithError(unknownError);

    const response = await request(app).get('/test');

    expect(response.status).toBe(500);
  });

  it('returns consistent error shape for unknown errors', async () => {
    const unknownError = new Error('Something unexpected');
    const app = createAppWithError(unknownError);

    const response = await request(app).get('/test');

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code');
    expect(response.body.error).toHaveProperty('message');
  });

  it('does not include stack trace in production mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      const appError = AppError.internal('Server failure');
      const app = createAppWithError(appError);

      const response = await request(app).get('/test');

      expect(response.body.error.stack).toBeUndefined();
      expect(response.body.stack).toBeUndefined();
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('handles AppError with various status codes correctly', async () => {
    const forbiddenError = AppError.forbidden('Not allowed');
    const app = createAppWithError(forbiddenError);

    const response = await request(app).get('/test');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Not allowed',
      },
    });
  });
});

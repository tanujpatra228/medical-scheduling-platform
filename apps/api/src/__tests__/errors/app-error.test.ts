import { describe, it, expect } from 'vitest';
import { AppError } from '@api/errors/app-error';

describe('AppError', () => {
  it('creates an error with correct statusCode, message, and code', () => {
    const error = new AppError('Validation failed', 422, 'VALIDATION_ERROR' as any);

    expect(error.statusCode).toBe(422);
    expect(error.message).toBe('Validation failed');
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('defaults isOperational to true', () => {
    const error = new AppError('Bad request', 400, 'BAD_REQUEST' as any);

    expect(error.isOperational).toBe(true);
  });

  it('allows isOperational to be set to false', () => {
    const error = new AppError('Unexpected', 500, 'INTERNAL_ERROR' as any, false);

    expect(error.isOperational).toBe(false);
  });

  it('extends the native Error class', () => {
    const error = new AppError('Test error', 400, 'BAD_REQUEST' as any);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it('has a proper stack trace', () => {
    const error = new AppError('Test error', 400, 'BAD_REQUEST' as any);

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('AppError');
  });

  describe('static factory methods', () => {
    it('badRequest() creates a 400 error', () => {
      const error = AppError.badRequest('Invalid input');

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.isOperational).toBe(true);
    });

    it('notFound() creates a 404 error', () => {
      const error = AppError.notFound('Resource not found');

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.isOperational).toBe(true);
    });

    it('unauthorized() creates a 401 error', () => {
      const error = AppError.unauthorized('Not authenticated');

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Not authenticated');
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.isOperational).toBe(true);
    });

    it('forbidden() creates a 403 error', () => {
      const error = AppError.forbidden('Access denied');

      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Access denied');
      expect(error.code).toBe('FORBIDDEN');
      expect(error.isOperational).toBe(true);
    });

    it('internal() creates a 500 error with isOperational false', () => {
      const error = AppError.internal('Server failure');

      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Server failure');
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(false);
    });
  });
});

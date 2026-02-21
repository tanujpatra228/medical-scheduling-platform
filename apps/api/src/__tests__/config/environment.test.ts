import { describe, it, expect } from 'vitest';
import { config } from '@api/config/environment';

const VALID_ENVIRONMENTS = ['development', 'production', 'test'] as const;

describe('Environment Configuration', () => {
  it('config object has all required properties', () => {
    expect(config).toHaveProperty('port');
    expect(config).toHaveProperty('nodeEnv');
    expect(config).toHaveProperty('apiPrefix');
    expect(config).toHaveProperty('corsOrigin');
  });

  it('port is a number', () => {
    expect(typeof config.port).toBe('number');
    expect(Number.isFinite(config.port)).toBe(true);
  });

  it('port is a valid port number', () => {
    expect(config.port).toBeGreaterThan(0);
    expect(config.port).toBeLessThanOrEqual(65535);
  });

  it('nodeEnv is one of the allowed values', () => {
    expect(VALID_ENVIRONMENTS).toContain(config.nodeEnv);
  });

  it('apiPrefix starts with /', () => {
    expect(config.apiPrefix.startsWith('/')).toBe(true);
  });

  it('corsOrigin is defined', () => {
    expect(config.corsOrigin).toBeDefined();
  });
});

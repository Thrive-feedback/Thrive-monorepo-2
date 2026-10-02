import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { apiBaseUrl } = await import('./api-client.service');

describe('apiBaseUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads API_BASE_URL without a trailing slash', () => {
    vi.stubEnv('API_BASE_URL', 'http://localhost:3000/');

    expect(apiBaseUrl()).toBe('http://localhost:3000');
  });

  it('names the variable when it is missing', () => {
    vi.stubEnv('API_BASE_URL', '');

    expect(() => apiBaseUrl()).toThrow('API_BASE_URL is not set');
  });
});

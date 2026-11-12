import { afterEach, describe, expect, it, vi } from 'vitest';
import { webUrl } from './web-url.util';

describe('webUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads WEB_URL as an origin, with or without a trailing slash', () => {
    vi.stubEnv('WEB_URL', 'https://thriveteam.app/');

    expect(webUrl().href).toBe('https://thriveteam.app/');
  });

  it('names the variable when it is missing', () => {
    vi.stubEnv('WEB_URL', '');

    expect(() => webUrl()).toThrow('WEB_URL is not set');
  });

  it.each([
    'thriveteam.app',
    'https://thriveteam.app/home',
    'https://thriveteam.app/?ref=x',
    'ftp://thriveteam.app',
  ])('refuses %s, which is not an origin alone', (value) => {
    vi.stubEnv('WEB_URL', value);

    expect(() => webUrl()).toThrow('WEB_URL must be an origin alone');
  });
});

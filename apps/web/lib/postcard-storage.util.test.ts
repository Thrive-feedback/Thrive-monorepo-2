import { afterEach, describe, expect, it, vi } from 'vitest';
import { postcardStorageHost } from './postcard-storage.util';

describe('postcardStorageHost', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads NEXT_PUBLIC_POSTCARD_STORAGE_HOST', () => {
    vi.stubEnv('NEXT_PUBLIC_POSTCARD_STORAGE_HOST', 'project.supabase.co');

    expect(postcardStorageHost()).toBe('project.supabase.co');
  });

  it('names the variable when it is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_POSTCARD_STORAGE_HOST', '');

    expect(() => postcardStorageHost()).toThrow(
      'NEXT_PUBLIC_POSTCARD_STORAGE_HOST is not set',
    );
  });

  it('refuses an address where a host name belongs', () => {
    vi.stubEnv(
      'NEXT_PUBLIC_POSTCARD_STORAGE_HOST',
      'https://project.supabase.co',
    );

    expect(() => postcardStorageHost()).toThrow('must be a host name alone');
  });
});

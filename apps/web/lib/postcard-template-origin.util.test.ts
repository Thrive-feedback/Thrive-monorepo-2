import { afterEach, describe, expect, it, vi } from 'vitest';
import { postcardTemplateHost } from './postcard-template-origin.util';

describe('postcardTemplateHost', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads NEXT_PUBLIC_POSTCARD_TEMPLATE_HOST', () => {
    vi.stubEnv('NEXT_PUBLIC_POSTCARD_TEMPLATE_HOST', 'project.supabase.co');

    expect(postcardTemplateHost()).toBe('project.supabase.co');
  });

  it('names the variable when it is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_POSTCARD_TEMPLATE_HOST', '');

    expect(() => postcardTemplateHost()).toThrow(
      'NEXT_PUBLIC_POSTCARD_TEMPLATE_HOST is not set',
    );
  });

  it('refuses an address where a host name belongs', () => {
    vi.stubEnv(
      'NEXT_PUBLIC_POSTCARD_TEMPLATE_HOST',
      'https://project.supabase.co',
    );

    expect(() => postcardTemplateHost()).toThrow('must be a host name alone');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LOCALE_COOKIE_NAME } from './locale.constant';

const cookieStore = { set: vi.fn() };
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));

const { setLocale } = await import('./locale.action');

describe('setLocale', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('remembers a known language past the end of the visit', async () => {
    await setLocale('th');

    expect(cookieStore.set).toHaveBeenCalledWith(
      LOCALE_COOKIE_NAME,
      'th',
      expect.objectContaining({ maxAge: expect.any(Number), sameSite: 'lax' }),
    );
  });

  it.each(['fr', '', null, { locale: 'th' }])(
    'refuses %j and remembers nothing',
    async (value) => {
      await expect(setLocale(value)).rejects.toThrow();
      expect(cookieStore.set).not.toHaveBeenCalled();
    },
  );
});

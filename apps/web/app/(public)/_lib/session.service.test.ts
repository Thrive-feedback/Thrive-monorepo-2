import { beforeEach, describe, expect, it, vi } from 'vitest';

const GET = vi.fn();
const requestHeaders = new Headers();

vi.mock('server-only', () => ({}));
vi.mock('react', async (actual) => ({
  ...(await actual<typeof import('react')>()),
  // Outside a server render `cache` would hold one answer for the whole test file.
  cache: <T>(fn: T) => fn,
}));
vi.mock('next/headers', () => ({ headers: async () => requestHeaders }));
vi.mock('@/lib/api-client.service', () => ({ apiClient: () => ({ GET }) }));

const { readSession } = await import('./session.service');

describe('readSession', () => {
  beforeEach(() => {
    GET.mockReset();
    requestHeaders.delete('cookie');
  });

  it("asks the API with the browser's cookie and never caches the answer", async () => {
    requestHeaders.set('cookie', 'thrive.session_token=abc');
    GET.mockResolvedValue({
      data: { account: { email: 'ann@acme.test', name: 'Ann Lee' } },
    });

    expect(await readSession()).toEqual({
      email: 'ann@acme.test',
      name: 'Ann Lee',
    });
    expect(GET).toHaveBeenCalledWith('/v1/sessions/current', {
      params: { header: { cookie: 'thrive.session_token=abc' } },
      cache: 'no-store',
    });
  });

  it('is null when the API says nobody is signed in', async () => {
    GET.mockResolvedValue({ data: { account: null } });

    expect(await readSession()).toBeNull();
    expect(GET).toHaveBeenCalledWith('/v1/sessions/current', {
      params: { header: { cookie: undefined } },
      cache: 'no-store',
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieJar = new Map<string, string>();
const cookieStore = {
  get: (name: string) =>
    cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
  set: vi.fn((name: string, value: string) => cookieJar.set(name, value)),
  delete: vi.fn((name: string) => cookieJar.delete(name)),
};

vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

const { readMockAccount, signIn, signOut } = await import(
  './mock-session.service'
);

describe('mock session', () => {
  beforeEach(() => {
    cookieJar.clear();
    vi.clearAllMocks();
  });

  it('has nobody signed in before sign-in', async () => {
    expect(await readMockAccount()).toBeNull();
  });

  it('signs in as the sample company Account and moves on to Introduce yourself', async () => {
    await expect(signIn()).rejects.toThrow(
      'redirect:/register/introduce-yourself',
    );

    expect(await readMockAccount()).toEqual({ email: 'tony@stark.com' });
    expect(cookieStore.set).toHaveBeenCalledWith(
      expect.any(String),
      'tony@stark.com',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
    );
  });

  it('refuses a hand-made cookie for an Account that is not a sample', async () => {
    await expect(signIn()).rejects.toThrow();
    for (const name of cookieJar.keys()) {
      cookieJar.set(name, 'someone@else.com');
    }

    expect(await readMockAccount()).toBeNull();
  });

  it('signs out back to the sign-in page', async () => {
    await expect(signIn()).rejects.toThrow();

    await expect(signOut()).rejects.toThrow('redirect:/login');

    expect(await readMockAccount()).toBeNull();
  });
});

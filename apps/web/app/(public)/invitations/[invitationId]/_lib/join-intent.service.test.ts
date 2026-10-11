/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestHeaders = new Headers();
const jar = new Map<string, string>();
const cookieStore = {
  get: (name: string) =>
    jar.has(name) ? { name, value: jar.get(name) } : undefined,
  set: vi.fn((name: string, value: string) => {
    jar.set(name, value);
  }),
  delete: vi.fn((name: string) => {
    jar.delete(name);
  }),
};

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => requestHeaders,
  cookies: async () => cookieStore,
}));

const { forgetJoinIntent, hasJoinIntentFor, rememberJoinIntent } = await import(
  './join-intent.service'
);

const INVITATION_ID = '0199a0f0-0000-7000-8000-000000000001';
const OTHER_INVITATION_ID = '0199a0f0-0000-7000-8000-000000000002';

beforeEach(() => {
  jar.clear();
  requestHeaders.set('origin', 'https://thrive.test');
});

describe('the intent to join an Invitation', () => {
  it('is held for the Invitation the person chose, and no other', async () => {
    await rememberJoinIntent(INVITATION_ID);

    expect(await hasJoinIntentFor(INVITATION_ID)).toBe(true);
    expect(await hasJoinIntentFor(OTHER_INVITATION_ID)).toBe(false);
  });

  it('is absent until the person chooses', async () => {
    expect(await hasJoinIntentFor(INVITATION_ID)).toBe(false);
  });

  it('is gone once spent', async () => {
    await rememberJoinIntent(INVITATION_ID);

    await forgetJoinIntent();

    expect(await hasJoinIntentFor(INVITATION_ID)).toBe(false);
  });
});

/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs — see `teammates.service.test.ts`.
 */
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));

const { readLinkedAccounts } = await import('./linked-accounts.service');

const LINKED_ON = '2026-10-31T03:00:00.000Z';

function theApiAnswers(body: unknown, init?: ResponseInit) {
  server.use(
    http.get(`${TEST_API_BASE_URL}/v1/linked-accounts/mine`, () =>
      HttpResponse.json(body as Record<string, unknown>, init),
    ),
  );
}

describe('readLinkedAccounts', () => {
  it('lists each chat account the person has linked', async () => {
    theApiAnswers({
      items: [
        {
          provider: 'DISCORD',
          externalUsername: 'ann#0001',
          linkedAt: LINKED_ON,
        },
      ],
    });

    expect(await readLinkedAccounts()).toEqual([
      {
        provider: 'DISCORD',
        externalUsername: 'ann#0001',
        linkedAt: LINKED_ON,
      },
    ]);
  });

  it('reads as nothing linked when the API refuses', async () => {
    theApiAnswers(
      { error: { code: 'INTERNAL', message: 'No.', correlationId: 'test' } },
      { status: 500 },
    );

    expect(await readLinkedAccounts()).toEqual([]);
  });
});

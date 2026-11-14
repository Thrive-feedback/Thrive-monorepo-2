/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs — see `teammates.service.test.ts`.
 */
import { HttpResponse, http } from 'msw';
import { expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));

const { readFeatureFlags } = await import('./feature-flags.service');

it.each([
  ['true', true],
  ['false', false],
] as const)(
  'reads a dashboard flag of %p as %p',
  async (wire, showsDashboard) => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/v1/feature-flags`, () =>
        HttpResponse.json({ USER_DASHBOARD_FLAG: wire }),
      ),
    );

    expect(await readFeatureFlags()).toEqual({ showsDashboard });
  },
);

it('hides the dashboard when the API cannot say, rather than failing the page', async () => {
  server.use(
    http.get(`${TEST_API_BASE_URL}/v1/feature-flags`, () =>
      HttpResponse.json(
        { code: 'INTERNAL', message: 'Something went wrong.' },
        { status: 500 },
      ),
    ),
  );

  expect(await readFeatureFlags()).toEqual({ showsDashboard: false });
});

it('hides the dashboard when the API cannot be reached', async () => {
  server.use(
    http.get(`${TEST_API_BASE_URL}/v1/feature-flags`, () =>
      HttpResponse.error(),
    ),
  );

  expect(await readFeatureFlags()).toEqual({ showsDashboard: false });
});

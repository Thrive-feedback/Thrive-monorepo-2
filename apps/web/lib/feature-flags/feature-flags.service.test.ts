/**
 * @vitest-environment node
 *
 * Server code, so it is tested where it runs — see `teammates.service.test.ts`.
 */
import { delay, HttpResponse, http } from 'msw';
import { afterEach, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));

const { FLAG_READ_TIMEOUT_MS, readDeploymentFlags, readFeatureFlags } =
  await import('./feature-flags.service');

const ALL_OFF = { showsDashboard: false, showsHrLanding: false };

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * An API that takes the request and never answers, with the read's time limit under the test's
 * hand: `timeUp` is the moment the limit passes, so no test waits on a real clock.
 */
function stallTheApi() {
  const limit = new AbortController();
  const timeout = vi
    .spyOn(AbortSignal, 'timeout')
    .mockReturnValue(limit.signal);
  server.use(
    http.get(`${TEST_API_BASE_URL}/v1/feature-flags`, async () => {
      await delay('infinite');
      return HttpResponse.json({});
    }),
  );
  return {
    timeout,
    timeUp: () => limit.abort(new DOMException('timed out', 'TimeoutError')),
  };
}

it.each([
  ['true', true],
  ['false', false],
] as const)(
  'reads a dashboard flag of %p as %p',
  async (wire, showsDashboard) => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/v1/feature-flags`, () =>
        HttpResponse.json({
          USER_DASHBOARD_FLAG: wire,
          HR_LANDING_FLAG: 'false',
        }),
      ),
    );

    expect(await readFeatureFlags()).toEqual({ ...ALL_OFF, showsDashboard });
  },
);

it.each([
  ['true', true],
  ['false', false],
] as const)(
  'reads an HR front page flag of %p as %p',
  async (wire, showsHrLanding) => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/v1/feature-flags`, () =>
        HttpResponse.json({
          USER_DASHBOARD_FLAG: 'false',
          HR_LANDING_FLAG: wire,
        }),
      ),
    );

    expect(await readFeatureFlags()).toEqual({ ...ALL_OFF, showsHrLanding });
  },
);

it('keeps the HR front page off when an older API does not name it yet', async () => {
  server.use(
    http.get(`${TEST_API_BASE_URL}/v1/feature-flags`, () =>
      HttpResponse.json({ USER_DASHBOARD_FLAG: 'true' }),
    ),
  );

  expect(await readFeatureFlags()).toEqual({
    showsDashboard: true,
    showsHrLanding: false,
  });
});

it('hides every flagged page when the API cannot say, rather than failing the page', async () => {
  server.use(
    http.get(`${TEST_API_BASE_URL}/v1/feature-flags`, () =>
      HttpResponse.json(
        { code: 'INTERNAL', message: 'Something went wrong.' },
        { status: 500 },
      ),
    ),
  );

  expect(await readFeatureFlags()).toEqual(ALL_OFF);
});

it('hides every flagged page when the API cannot be reached', async () => {
  server.use(
    http.get(`${TEST_API_BASE_URL}/v1/feature-flags`, () =>
      HttpResponse.error(),
    ),
  );

  expect(await readFeatureFlags()).toEqual(ALL_OFF);
});

it('reports what the deployment answered, for a page that shows the flags', async () => {
  server.use(
    http.get(`${TEST_API_BASE_URL}/v1/feature-flags`, () =>
      HttpResponse.json({
        USER_DASHBOARD_FLAG: 'true',
        HR_LANDING_FLAG: 'false',
      }),
    ),
  );

  expect(await readDeploymentFlags()).toEqual({
    showsDashboard: true,
    showsHrLanding: false,
  });
});

it.each([
  [
    'answers with an error',
    () =>
      HttpResponse.json(
        { code: 'INTERNAL', message: 'Something went wrong.' },
        { status: 500 },
      ),
  ],
  ['cannot be reached', () => HttpResponse.error()],
])(
  'says it could not read the flags when the API %s, rather than calling them off',
  async (_case, answer) => {
    server.use(http.get(`${TEST_API_BASE_URL}/v1/feature-flags`, answer));

    expect(await readDeploymentFlags()).toBeNull();
  },
);

it('gives up on an API that does not answer in time, so a page waiting on it shows every flag off', async () => {
  const { timeout, timeUp } = stallTheApi();

  const read = readFeatureFlags();
  timeUp();

  expect(await read).toEqual(ALL_OFF);
  expect(timeout).toHaveBeenCalledWith(FLAG_READ_TIMEOUT_MS);
});

it('says it could not read the flags when the API does not answer in time', async () => {
  const { timeUp } = stallTheApi();

  const read = readDeploymentFlags();
  timeUp();

  expect(await read).toBeNull();
});

it('gives up on an API whose answer stops part-way when the time limit passes, just as on one that never answers', async () => {
  // The time limit passing while the body is read rejects the read with a `TimeoutError`, outside
  // the client's own error handling; the body here fails that way at once, so no clock is needed.
  server.use(
    http.get(
      `${TEST_API_BASE_URL}/v1/feature-flags`,
      () =>
        new HttpResponse(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('{"USER_'));
              controller.error(new DOMException('timed out', 'TimeoutError'));
            },
          }),
          { headers: { 'Content-Type': 'application/json' } },
        ),
    ),
  );

  expect(await readFeatureFlags()).toEqual(ALL_OFF);
  expect(await readDeploymentFlags()).toBeNull();
});

import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server, TEST_API_BASE_URL } from '@/lib/test/msw-server';
import { HomeDayJumpProvider } from './home-day-jump';

vi.stubEnv('API_BASE_URL', TEST_API_BASE_URL);
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ cookie: 'thrive.session_token=abc' }),
}));

const { HomeWeek } = await import('./home-week');

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const DAYS = `${TEST_API_BASE_URL}/v1/workspaces/${WORKSPACE_ID}/feed-items/days`;
const MEMBERSHIP = {
  workspace: { id: WORKSPACE_ID, name: 'Acme' },
  role: 'MEMBER',
} as const;

type Counts = {
  offeredFeedback: number;
  requestedFeedback: number;
  kudos: number;
};
const none: Counts = { offeredFeedback: 0, requestedFeedback: 0, kudos: 0 };

/** The API's last seven days, Sunday 22 November last, Sunday holding `today`. */
function theWeek(today: Counts) {
  const days = [
    '2026-11-16',
    '2026-11-17',
    '2026-11-18',
    '2026-11-19',
    '2026-11-20',
    '2026-11-21',
  ].map((day) => ({ day, ...none }));
  return {
    days: [...days, { day: '2026-11-22', ...today }],
    totals: today,
  };
}

async function drawTheWeek(show: 'all' | 'shared', today: Counts) {
  server.use(http.get(DAYS, () => HttpResponse.json(theWeek(today))));
  render(
    <HomeDayJumpProvider>
      {await HomeWeek({ membership: MEMBERSHIP, show })}
    </HomeDayJumpProvider>,
  );
}

describe('HomeWeek', () => {
  it('says what the week held, leaving out a kind it held none of', async () => {
    await drawTheWeek('all', {
      offeredFeedback: 2,
      requestedFeedback: 0,
      kudos: 3,
    });

    expect(
      screen.getByText(
        (_, element) =>
          element?.textContent === 'In the last 7 days: 2 offered and 3 Kudos.',
      ),
    ).toBeVisible();
  });

  it('never counts Kudos under Shared with me', async () => {
    // Even were the API to count some, Shared with me never says Kudos.
    await drawTheWeek('shared', {
      offeredFeedback: 1,
      requestedFeedback: 1,
      kudos: 2,
    });

    expect(
      screen.getByText(
        (_, element) =>
          element?.textContent ===
          'In the last 7 days: 1 offered and 1 answer.',
      ),
    ).toBeVisible();
  });

  it('says so when the week held nothing', async () => {
    await drawTheWeek('all', none);

    expect(
      screen.getByText('Nothing written in the last 7 days yet.'),
    ).toBeVisible();
  });

  it('marks today on the ribbon, and lets no quiet day be pressed', async () => {
    await drawTheWeek('all', {
      offeredFeedback: 1,
      requestedFeedback: 0,
      kudos: 0,
    });

    expect(screen.getByRole('button', { name: /^Today 22/ })).toHaveAttribute(
      'aria-current',
      'date',
    );
    expect(
      screen.getByRole('button', { name: /^Wednesday 18, nothing written/ }),
    ).toBeDisabled();
  });

  it('draws nothing when the API could not count the week, and the band keeps its heading', async () => {
    server.use(
      http.get(DAYS, () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL', message: 'Broke.' } },
          { status: 500 },
        ),
      ),
    );
    const { container } = render(
      <HomeDayJumpProvider>
        {await HomeWeek({ membership: MEMBERSHIP, show: 'all' })}
      </HomeDayJumpProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

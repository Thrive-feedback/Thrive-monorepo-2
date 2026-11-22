import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { ROUTES } from '@/lib/routes.constant';
import { ComposeDrawer } from './compose-drawer';

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => ROUTES.waiting,
}));
vi.mock(
  '@/app/(signed-in)/(sidebar)/_lib/send-postcard-actions.service',
  () => ({
    sendPostcardFeedback: vi.fn(),
    sendPostcardRequest: vi.fn(),
    sendKudosCard: vi.fn(),
  }),
);

const WORKSPACE_ID = 'workspace-acme';
const TEAMMATES: readonly Teammate[] = [
  {
    accountId: 'mali',
    name: 'Mali Sombat',
    email: 'mali@acme.test',
    photoUrl: null,
    slug: 'mali',
    displayName: 'Mali',
  },
];
const WRITER = { name: 'Ann', photoUrl: null };

describe('ComposeDrawer', () => {
  function drawOnPhone() {
    render(
      <ComposeDrawer
        workspaceId={WORKSPACE_ID}
        teammates={TEAMMATES}
        workspaceGoals={[]}
        writer={WRITER}
      />,
    );
  }

  it('offers the three things to write in a sheet titled Write something', async () => {
    const user = userEvent.setup();
    drawOnPhone();

    await user.click(screen.getByRole('button', { name: 'Write something' }));

    const sheet = screen.getByRole('dialog', { name: 'Write something' });
    expect(
      within(sheet)
        .getAllByRole('button')
        .map((choice) => choice.textContent),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Ask for feedback'),
        expect.stringContaining('Give feedback'),
        expect.stringContaining('Give kudos'),
      ]),
    );
  });

  it('puts the sheet away and opens the card that was chosen', async () => {
    const user = userEvent.setup();
    drawOnPhone();

    await user.click(screen.getByRole('button', { name: 'Write something' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Write something' })).getByRole(
        'button',
        { name: /Ask for feedback/ },
      ),
    );

    expect(
      await screen.findByRole(
        'dialog',
        { name: 'Ask for feedback' },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('dialog', { name: 'Write something' }),
    ).not.toBeInTheDocument();
  });
});

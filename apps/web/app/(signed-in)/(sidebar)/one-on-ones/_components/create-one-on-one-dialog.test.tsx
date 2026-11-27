import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from '@/components/atoms/toaster';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { ROUTES } from '@/lib/routes.constant';

const push = vi.fn();
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push, refresh: vi.fn() }),
}));
const inviteToOneOnOne = vi.fn();
vi.mock(
  '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-actions.service',
  () => ({
    inviteToOneOnOne: (...args: unknown[]) => inviteToOneOnOne(...args),
  }),
);

const { CreateOneOnOneDialog } = await import(
  '@/app/(signed-in)/(sidebar)/one-on-ones/_components/create-one-on-one-dialog'
);
const { OneOnOnesCreate } = await import(
  '@/app/(signed-in)/(sidebar)/one-on-ones/_components/one-on-ones-create'
);

const NEW_ID = '0196b4c8-0000-7000-8000-000000000009';

const TEAMMATES: Teammate[] = [
  {
    accountId: 'account-mint',
    name: 'Mint Boonmee',
    displayName: 'Mint',
    email: 'mint@acme.test',
    photoUrl: null,
    slug: 'mint',
  },
  {
    accountId: 'account-leo',
    name: 'Leo Santos',
    displayName: 'Leo',
    email: 'leo@acme.test',
    photoUrl: null,
    slug: 'leo',
  },
];

function draw() {
  render(
    <>
      <CreateOneOnOneDialog
        open
        onOpenChange={() => {}}
        workspaceId="workspace-acme"
        teammates={TEAMMATES}
        unavailable={new Map([['account-leo', 'You already have a 1:1']])}
        trigger={<button type="button">Create 1:1</button>}
      />
      <Toaster />
    </>,
  );
}

beforeEach(() => {
  push.mockClear();
  inviteToOneOnOne.mockReset().mockResolvedValue({ ok: true, id: NEW_ID });
});

describe('CreateOneOnOneDialog', () => {
  it('creates a 1:1 in two steps, on the default schedule, and opens it', async () => {
    draw();

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    await userEvent.click(screen.getByRole('radio', { name: /Mint Boonmee/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      screen.getByRole('dialog', { name: 'A 1:1 with Mint Boonmee' }),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole('button', { name: 'Send invitation' }),
    );

    expect(inviteToOneOnOne).toHaveBeenCalledExactlyOnceWith(
      'workspace-acme',
      'account-mint',
      expect.objectContaining({ cadence: 'WEEKLY', weekday: 4 }),
      '',
    );
    expect(push).toHaveBeenCalledWith(ROUTES.oneOnOneWith(NEW_ID));
  });

  it('keeps somebody the person already meets in the list, but not to be chosen', () => {
    draw();

    expect(screen.getByRole('radio', { name: /Leo Santos/ })).toBeDisabled();
    expect(screen.getByText('You already have a 1:1')).toBeVisible();
  });

  it('finds a teammate by name', async () => {
    draw();

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Find a teammate' }),
      'leo',
    );

    expect(
      screen.queryByRole('radio', { name: /Mint Boonmee/ }),
    ).not.toBeInTheDocument();
  });

  it('sends what the person would like to talk about with the invitation', async () => {
    draw();

    await userEvent.click(screen.getByRole('radio', { name: /Mint Boonmee/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.type(
      screen.getByRole('textbox', {
        name: 'Anything you’d like to talk about?',
      }),
      'Career advice',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Send invitation' }),
    );

    expect(inviteToOneOnOne).toHaveBeenCalledExactlyOnceWith(
      'workspace-acme',
      'account-mint',
      expect.not.objectContaining({ templateKey: expect.anything() }),
      'Career advice',
    );
  });

  it('stays open, with the choice made, when the invitation is refused', async () => {
    inviteToOneOnOne.mockResolvedValue({
      ok: false,
      message: 'You already have a 1:1 with this person.',
    });
    draw();
    await userEvent.click(screen.getByRole('radio', { name: /Mint Boonmee/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    await userEvent.click(
      screen.getByRole('button', { name: 'Send invitation' }),
    );

    expect(
      await screen.findByText('You already have a 1:1 with this person.'),
    ).toBeVisible();
    expect(push).not.toHaveBeenCalled();
    expect(
      screen.getByRole('dialog', { name: 'A 1:1 with Mint Boonmee' }),
    ).toBeVisible();
  });

  it('gives focus back to Create 1:1 when it is closed without sending', async () => {
    render(
      <OneOnOnesCreate
        workspaceId="workspace-acme"
        teammates={TEAMMATES}
        unavailable={[]}
      />,
    );

    const create = screen.getByRole('button', { name: 'Create 1:1' });
    await userEvent.click(create);
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(create).toHaveFocus());
  });
});

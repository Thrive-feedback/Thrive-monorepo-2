import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { ROUTES } from '@/lib/routes.constant';
import { TeammatesDirectory } from './teammates-directory';

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => ROUTES.teammates,
}));
vi.mock(
  '@/app/(signed-in)/(sidebar)/_lib/send-postcard-actions.service',
  () => ({
    sendPostcardFeedback: vi.fn(),
    sendPostcardRequest: vi.fn(),
    sendKudosCard: vi.fn(),
  }),
);

function teammate(
  name: string,
  slug: string | null,
  overrides: Partial<Teammate> = {},
): Teammate {
  return {
    accountId: name.toLowerCase().replace(/\s/g, '-'),
    name,
    email: `${name.toLowerCase().replace(/\s/g, '.')}@acme.test`,
    photoUrl: null,
    slug,
    displayName: slug === null ? null : (name.split(' ')[0] ?? null),
    ...overrides,
  };
}

const MALI = teammate('Mali Sombat', 'mali');
const KRIT = teammate('Krit Chan', 'krit');
/** Joined, but has not introduced themselves, so has no handle yet. */
const NEWCOMER = teammate('nok@acme.test', null, { email: 'nok@acme.test' });

/** The person reading the page, whose name falls in the middle, so being pinned first would show. */
const YOU = teammate('Lek Wong', 'lek', { email: 'lek@acme.test' });

/** Twenty-three people, named so they sort as numbered. */
const CROWD = Array.from({ length: 23 }, (_, index) =>
  teammate(`Person ${String(index + 1).padStart(2, '0')}`, `p${index + 1}`),
);

function draw(
  people: readonly Teammate[] = [MALI, NEWCOMER, YOU, KRIT],
  { isAdmin = false } = {},
) {
  render(
    <TeammatesDirectory
      people={people}
      teammates={people.filter((person) => person !== YOU)}
      workspaceId="workspace-acme"
      workspaceName="Acme"
      workspaceGoals={[]}
      writer={{ name: 'Lek', photoUrl: null }}
      isAdmin={isAdmin}
    />,
  );
}

/** Opens a card from a row's button, and waits for its code to arrive. */
async function openFrom(
  user: ReturnType<typeof userEvent.setup>,
  button: string,
  card: string,
) {
  await user.click(screen.getByRole('button', { name: button }));
  return screen.findByRole('dialog', { name: card }, { timeout: 5000 });
}

/** Closes the card open, answering its "Close without sending?", and waits for it to go. */
async function closeCard(
  user: ReturnType<typeof userEvent.setup>,
  card: string,
) {
  await user.click(
    within(screen.getByRole('dialog', { name: card })).getByRole('button', {
      name: 'Close',
    }),
  );
  const asking = await screen.findByRole('dialog', {
    name: 'Close without sending?',
  });
  await user.click(
    within(asking).getByRole('button', { name: /^(Close|Discard)$/ }),
  );
  await waitFor(() =>
    expect(
      screen.queryByRole('dialog', { name: card }),
    ).not.toBeInTheDocument(),
  );
}

/** The names on the list, top to bottom, as each row's Give names them. */
function listed() {
  return within(screen.getByRole('list', { name: 'Teammates' }))
    .getAllByRole('button', { name: /^Give .* feedback$/ })
    .map((give) =>
      give.getAttribute('aria-label')?.replace(/^Give (.*) feedback$/, '$1'),
    );
}

describe('TeammatesDirectory', () => {
  it('lists everyone by name, each with Give, Ask and Kudos', () => {
    draw();

    expect(listed()).toEqual(['Krit Chan', 'Mali Sombat', 'nok@acme.test']);
    const mali = screen
      .getAllByRole('listitem')
      .find((row) => row.textContent?.includes('Mali Sombat'));
    if (!mali) {
      throw new Error('Mali is not listed.');
    }
    expect(
      within(mali)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual([
      'Give Mali Sombat feedback',
      'Ask Mali Sombat for feedback',
      'Give Mali Sombat kudos',
    ]);
  });

  it('lists the person among the rest by name, marked You, with nothing to write to themselves', () => {
    draw();

    const rows = within(screen.getByRole('list', { name: 'Teammates' }))
      .getAllByRole('listitem')
      .map((row) => row.textContent);
    expect(rows).toEqual([
      expect.stringContaining('Krit Chan'),
      expect.stringContaining('Lek Wong'),
      expect.stringContaining('Mali Sombat'),
      expect.stringContaining('nok@acme.test'),
    ]);
    const you = within(screen.getByRole('list', { name: 'Teammates' }))
      .getAllByRole('listitem')
      .find((row) => row.textContent?.includes('Lek Wong'));
    if (!you) {
      throw new Error('The person is not listed.');
    }
    expect(within(you).getByText('You')).toBeVisible();
    expect(within(you).queryByRole('button')).not.toBeInTheDocument();
  });

  it('finds the person too when they search for themselves', async () => {
    const user = userEvent.setup();
    draw();

    await user.type(
      screen.getByRole('searchbox', { name: 'Search teammates' }),
      'lek',
    );

    expect(
      within(screen.getByRole('list', { name: 'Teammates' })).getByText('You'),
    ).toBeVisible();
  });

  it('never offers the person as who a card is for', async () => {
    const user = userEvent.setup();
    draw();

    const card = await openFrom(
      user,
      'Give Mali Sombat feedback',
      'Give feedback',
    );
    await user.click(
      within(card).getByRole('button', { name: /^Choose who it's for/ }),
    );

    expect(
      screen.queryByRole('checkbox', { name: /Lek Wong/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /Krit Chan/ }),
    ).toBeInTheDocument();
  });

  it('finds teammates by name, email or @handle as it is typed', async () => {
    const user = userEvent.setup();
    draw();
    const search = screen.getByRole('searchbox', { name: 'Search teammates' });

    await user.type(search, 'sombat');
    expect(listed()).toEqual(['Mali Sombat']);

    await user.clear(search);
    await user.type(search, '@krit');
    expect(listed()).toEqual(['Krit Chan']);

    await user.clear(search);
    await user.type(search, 'nok@');
    expect(listed()).toEqual(['nok@acme.test']);
  });

  it('says when nobody matches, and clears the search back to everyone', async () => {
    const user = userEvent.setup();
    draw();
    const search = screen.getByRole('searchbox', { name: 'Search teammates' });

    await user.type(search, 'zed');

    expect(screen.getByRole('status')).toHaveTextContent(
      'Nobody matches “zed”.',
    );
    expect(
      screen.queryByRole('list', { name: 'Teammates' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(search).toHaveValue('');
    expect(search).toHaveFocus();
    expect(listed()).toHaveLength(3);
  });

  it('shows ten at a time, turned by Next and Previous', async () => {
    const user = userEvent.setup();
    draw(CROWD);

    expect(listed()).toHaveLength(10);
    expect(listed()[0]).toBe('Person 01');
    expect(screen.getByText('Page 1 of 3')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Previous page' }),
    ).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.getByText('Page 3 of 3')).toBeVisible();
    expect(listed()).toEqual(['Person 21', 'Person 22', 'Person 23']);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    await user.click(screen.getByRole('button', { name: 'Previous page' }));

    expect(screen.getByText('Page 1 of 3')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Previous page' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toHaveFocus();
  });

  it('goes back to the first page when the search changes', async () => {
    const user = userEvent.setup();
    draw(CROWD);

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await user.type(
      screen.getByRole('searchbox', { name: 'Search teammates' }),
      'person',
    );

    expect(screen.getByText('Page 1 of 3')).toBeVisible();
    expect(listed()[0]).toBe('Person 01');
  });

  it('shows no pages for a list that fits on one', () => {
    draw();

    expect(
      screen.queryByRole('navigation', { name: 'Pages of teammates' }),
    ).not.toBeInTheDocument();
  });

  it('opens Give feedback already for the teammate it was pressed on', async () => {
    const user = userEvent.setup();
    draw();

    await user.click(
      screen.getByRole('button', { name: 'Give Mali Sombat feedback' }),
    );

    const card = await screen.findByRole(
      'dialog',
      { name: 'Give feedback' },
      { timeout: 5000 },
    );
    expect(
      within(card).getByRole('button', { name: /Chosen: Mali Sombat/ }),
    ).toBeInTheDocument();
    expect(
      within(card).queryByRole('button', { name: /Chosen: Krit Chan/ }),
    ).not.toBeInTheDocument();
  });

  it('opens Ask for feedback with the teammate it was pressed on asked', async () => {
    const user = userEvent.setup();
    draw();

    await user.click(
      screen.getByRole('button', { name: 'Ask Krit Chan for feedback' }),
    );

    const card = await screen.findByRole(
      'dialog',
      { name: 'Ask for feedback' },
      { timeout: 5000 },
    );
    expect(
      within(card).getByRole('button', { name: /Chosen: Krit Chan/ }),
    ).toBeInTheDocument();
  });

  it('opens the Kudos card with the teammate it was pressed on already @mentioned', async () => {
    const user = userEvent.setup();
    draw();

    await user.click(
      screen.getByRole('button', { name: 'Give Mali Sombat kudos' }),
    );

    await screen.findByRole(
      'dialog',
      { name: 'Give kudos' },
      { timeout: 5000 },
    );
    expect(screen.getByRole('textbox', { name: 'Your Kudos' })).toHaveValue(
      '@mali ',
    );
  });

  it('gives focus back to the button a card was opened from once it closes', async () => {
    const user = userEvent.setup();
    draw();

    await openFrom(user, 'Give Mali Sombat feedback', 'Give feedback');
    await closeCard(user, 'Give feedback');

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Give Mali Sombat feedback' }),
      ).toHaveFocus(),
    );
  });

  it('never carries one card’s teammate over to the next', async () => {
    const user = userEvent.setup();
    draw();

    await openFrom(user, 'Give Mali Sombat feedback', 'Give feedback');
    await closeCard(user, 'Give feedback');
    const ask = await openFrom(
      user,
      'Ask Krit Chan for feedback',
      'Ask for feedback',
    );

    expect(
      within(ask).getByRole('button', { name: /Chosen: Krit Chan/ }),
    ).toBeInTheDocument();
    expect(
      within(ask).queryByRole('button', { name: /Chosen: Mali Sombat/ }),
    ).not.toBeInTheDocument();
  });

  it('opens Give blank of words after a Kudos for somebody else', async () => {
    const user = userEvent.setup();
    draw();

    await openFrom(user, 'Give Mali Sombat kudos', 'Give kudos');
    await closeCard(user, 'Give kudos');
    const give = await openFrom(
      user,
      'Give Krit Chan feedback',
      'Give feedback',
    );

    expect(
      within(give).getByRole('textbox', { name: 'Your feedback' }),
    ).toHaveValue('');
    expect(
      within(give).getByRole('button', { name: /Chosen: Krit Chan/ }),
    ).toBeInTheDocument();
  });

  it('keeps Kudos for a teammate with no handle unavailable, saying why, and opens nothing', async () => {
    const user = userEvent.setup();
    draw();
    const kudos = screen.getByRole('button', {
      name: 'Give nok@acme.test kudos',
    });

    expect(kudos).toHaveAttribute('aria-disabled', 'true');
    expect(kudos).toHaveAccessibleDescription(
      'Kudos reach nok@acme.test once they’ve introduced themselves.',
    );

    // A tap on a phone, as iOS Safari delivers it: a click with no hover, and no focus on the button,
    // so neither of the tooltip's own ways in can show the reason; only the press itself can.
    // user-event cannot press without hovering or focusing, which is why this is `fireEvent`.
    fireEvent.click(kudos);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Kudos reach nok@acme.test once they’ve introduced themselves.',
    );

    await user.pointer({
      keys: '[TouchA]',
      target: screen.getByRole('searchbox', { name: 'Search teammates' }),
    });

    await waitFor(() =>
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: 'Give nok@acme.test feedback' }),
    ).not.toHaveAttribute('aria-disabled');
  });

  it('tells an Admin with nobody else in the Workspace to invite people', () => {
    draw([YOU], { isAdmin: true });

    expect(screen.getByText('Nobody else is in Acme yet.')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Invite people' })).toHaveAttribute(
      'href',
      ROUTES.settings.teammates,
    );
  });

  it('tells a Member with nobody else in the Workspace that an Admin invites people', () => {
    draw([YOU]);

    expect(screen.getByText('Nobody else is in Acme yet.')).toBeVisible();
    expect(screen.getByText(/An Admin can invite them/)).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Invite people' }),
    ).not.toBeInTheDocument();
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { photosWill } from '@/lib/test/photos-will';
import { MemberPickerDialog } from './member-picker-dialog';

const TEAMMATES: readonly Teammate[] = [
  {
    accountId: 'mali',
    name: 'Mali Sombat',
    email: 'mali@acme.test',
    photoUrl: null,
    slug: 'mali',
    displayName: 'Mali',
  },
  {
    accountId: 'krit',
    name: 'Krit Chan',
    email: 'krit@acme.test',
    photoUrl: null,
    slug: 'krit',
    displayName: 'Krit',
  },
  {
    accountId: 'chai',
    name: 'chai.s@acme.test',
    email: 'chai.s@acme.test',
    photoUrl: null,
    slug: null,
    displayName: null,
  },
];

function Harness({
  teammates = TEAMMATES,
  initial = [],
  single,
  onDone = () => {},
  onCancel,
}: {
  teammates?: readonly Teammate[];
  initial?: readonly string[];
  single?: boolean;
  onDone?: (accountIds: readonly string[]) => void;
  onCancel?: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState(initial);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <MemberPickerDialog
        teammates={teammates}
        value={value}
        title="Choose who to ask"
        description="They each answer in their own words."
        open={open}
        single={single}
        onOpenChange={setOpen}
        onDone={(accountIds) => {
          setValue(accountIds);
          onDone(accountIds);
        }}
        onCancel={onCancel}
      />
    </>
  );
}

const search = () =>
  screen.getByRole('searchbox', { name: /search by name or email/i });
const box = (name: string) => screen.getByRole('checkbox', { name });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MemberPickerDialog', () => {
  it("shows each teammate's Google photo beside their name", async () => {
    photosWill('load');
    const photo = 'https://lh3.googleusercontent.com/a/krit=s96-c';
    render(
      <Harness
        teammates={TEAMMATES.map((teammate) =>
          teammate.accountId === 'krit'
            ? { ...teammate, photoUrl: photo }
            : teammate,
        )}
      />,
    );

    const dialog = screen.getByRole('dialog');
    await vi.waitFor(() =>
      expect(dialog.querySelector('img')).toHaveAttribute('src', photo),
    );
    expect(screen.getByText('MS')).toBeInTheDocument();
  });

  it('opens named by its title, with the search field ready to type in', () => {
    render(<Harness />);

    expect(
      screen.getByRole('dialog', { name: 'Choose who to ask' }),
    ).toHaveAccessibleDescription('They each answer in their own words.');
    expect(search()).toHaveFocus();
  });

  it('lists everyone with their email, and counts who is ticked', async () => {
    render(<Harness initial={['krit']} />);

    expect(box('Mali Sombat')).toHaveAccessibleDescription('mali@acme.test');
    expect(box('Krit Chan')).toBeChecked();
    expect(screen.getByText('1 chosen')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Mali Sombat'));

    expect(box('Mali Sombat')).toBeChecked();
    expect(screen.getByText('2 chosen')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Done (2)' })).toBeEnabled();
  });

  it('ticks each @handle once a space finishes it, and clears it from the field', async () => {
    render(<Harness />);

    await userEvent.type(search(), '@mali @Chai.s ');

    expect(box('Mali Sombat')).toBeChecked();
    expect(box('chai.s@acme.test')).toBeChecked();
    expect(box('Krit Chan')).not.toBeChecked();
    expect(search()).toHaveValue('');
  });

  it('ticks everyone a pasted line names, and says which handle named nobody', async () => {
    render(<Harness />);

    await userEvent.click(search());
    await userEvent.paste('@mali, @krit @xyz');

    expect(box('Mali Sombat')).toBeChecked();
    expect(box('Krit Chan')).toBeChecked();
    expect(search()).toHaveValue('@xyz ');
    expect(search()).toHaveAccessibleDescription('Nobody is @xyz.');
  });

  it('filters by the word being typed, and Enter ticks the one person left', async () => {
    render(<Harness />);

    await userEvent.type(search(), 'som');

    const list = screen.getByRole('list', { name: 'Teammates' });
    expect(within(list).getAllByRole('checkbox')).toHaveLength(1);

    await userEvent.keyboard('{Enter}');

    expect(box('Mali Sombat')).toBeChecked();
    expect(search()).toHaveValue('');
  });

  it('says when nobody matches', async () => {
    render(<Harness />);

    await userEvent.type(search(), 'zzz');

    expect(screen.getByText('Nobody matches “zzz”.')).toBeInTheDocument();
  });

  it('hands back who is chosen on Done', async () => {
    const onDone = vi.fn();
    render(<Harness onDone={onDone} />);

    await userEvent.click(box('Krit Chan'));
    await userEvent.click(box('Mali Sombat'));
    await userEvent.click(screen.getByRole('button', { name: 'Done (2)' }));

    expect(onDone).toHaveBeenCalledWith(['krit', 'mali']);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('forgets the ticks on Cancel and on Escape', async () => {
    const onCancel = vi.fn();
    const onDone = vi.fn();
    render(<Harness initial={['krit']} onDone={onDone} onCancel={onCancel} />);

    await userEvent.click(box('Mali Sombat'));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(box('Mali Sombat')).not.toBeChecked();
    expect(box('Krit Chan')).toBeChecked();

    await userEvent.click(box('Mali Sombat'));
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onDone).not.toHaveBeenCalled();
  });

  it('chooses one person when only one can be, the last handle typed among them', async () => {
    const onDone = vi.fn();
    render(<Harness single initial={['krit']} onDone={onDone} />);

    expect(screen.getByRole('radio', { name: 'Krit Chan' })).toBeChecked();
    expect(screen.queryByText('1 chosen')).not.toBeInTheDocument();

    await userEvent.type(search(), '@mali @chai.s ');

    expect(
      screen.getByRole('radio', { name: 'chai.s@acme.test' }),
    ).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Krit Chan' })).not.toBeChecked();
    expect(
      screen.getByRole('radio', { name: 'Mali Sombat' }),
    ).not.toBeChecked();

    await userEvent.click(screen.getByText('Mali Sombat'));
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));

    expect(onDone).toHaveBeenCalledWith(['mali']);
  });

  it('says so when nobody else is in the Workspace', () => {
    render(<Harness teammates={[]} />);

    expect(
      screen.getByText('Nobody else is in your Workspace yet.'),
    ).toBeInTheDocument();
  });
});

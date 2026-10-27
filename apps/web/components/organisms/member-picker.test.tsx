import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MemberPicker } from './member-picker';

const BEN = '0199a0f0-0000-7000-8000-00000000000b';
const CARA = '0199a0f0-0000-7000-8000-00000000000c';
const TEAMMATES = [
  {
    accountId: BEN,
    name: 'Ben Carter',
    email: 'ben@acme.test',
    photoUrl: null,
    slug: 'ben',
    displayName: 'Ben',
  },
  {
    accountId: CARA,
    name: 'Cara Diaz',
    email: 'cara@acme.test',
    photoUrl: null,
    slug: 'cara',
    displayName: 'Cara',
  },
];

function Harness({
  initial = '',
  errorMessage,
  onChange = () => {},
}: {
  initial?: string;
  errorMessage?: string;
  onChange?: (accountId: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <form aria-label="Give feedback">
      <MemberPicker
        teammates={TEAMMATES}
        value={value}
        errorMessage={errorMessage}
        onChange={(accountId) => {
          setValue(accountId);
          onChange(accountId);
        }}
      />
    </form>
  );
}

/** What the form would send now. */
function sent() {
  const form = screen.getByRole('form', { name: 'Give feedback' });
  if (!(form instanceof HTMLFormElement)) {
    throw new Error('The picker is not in a form.');
  }
  return new FormData(form);
}

const picker = () =>
  screen.getByRole('button', { name: /^Choose who it is for/ });

describe('MemberPicker', () => {
  it('is the "+" alone, named by what it does, while nobody is chosen', () => {
    render(<Harness />);

    expect(picker()).toHaveAccessibleName('Choose who it is for');
  });

  it('shows the teammate chosen as a face, and names them', () => {
    render(<Harness initial={CARA} />);

    expect(picker()).toHaveAccessibleName(
      'Choose who it is for. Chosen: Cara Diaz',
    );
    expect(screen.getByText('CD')).toBeInTheDocument();
  });

  it('chooses one person in the dialog, and choosing another replaces them', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Harness onChange={handleChange} />);

    await user.click(picker());
    const dialog = screen.getByRole('dialog', { name: 'Choose who it is for' });
    expect(dialog).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Ben Carter' }));
    await user.click(screen.getByRole('radio', { name: 'Cara Diaz' }));

    expect(screen.getByRole('radio', { name: 'Ben Carter' })).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(handleChange).toHaveBeenCalledExactlyOnceWith(CARA);
    expect(picker()).toHaveAccessibleName(
      'Choose who it is for. Chosen: Cara Diaz',
    );
    expect(picker()).toHaveFocus();
  });

  it('sends the Account id chosen with the form, and nothing before', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(sent().has('receiverAccountId')).toBe(false);

    await user.click(picker());
    await user.click(screen.getByRole('radio', { name: 'Ben Carter' }));
    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(sent().getAll('receiverAccountId')).toEqual([BEN]);
  });

  it('says what is wrong on the button itself, and announces it as invalid', () => {
    render(<Harness errorMessage="Pick who it is for." />);

    expect(picker()).toHaveAttribute('aria-invalid', 'true');
    expect(picker()).toHaveAccessibleDescription('Pick who it is for.');
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemberMultiPicker } from './member-multi-picker';

const BEN = '0199a0f0-0000-7000-8000-00000000000b';
const CARA = '0199a0f0-0000-7000-8000-00000000000c';

const TEAMMATES = [
  {
    accountId: BEN,
    name: 'Ben Carter',
    email: 'ben@acme.test',
    slug: null,
    displayName: null,
  },
  {
    accountId: CARA,
    name: 'Cara Diaz',
    email: 'cara@acme.test',
    slug: null,
    displayName: null,
  },
];

function picker(
  props: Partial<React.ComponentProps<typeof MemberMultiPicker>> = {},
) {
  return (
    <MemberMultiPicker
      teammates={TEAMMATES}
      value={[]}
      onChange={vi.fn()}
      {...props}
    />
  );
}

function trigger(name: RegExp = /^Choose who to ask/) {
  return screen.getByRole('button', { name });
}

describe('MemberMultiPicker', () => {
  it('is the "+" alone, asking who to ask, while nobody is picked', () => {
    render(picker());

    expect(trigger(/^Choose who to ask$/)).toBeInTheDocument();
  });

  it('names everyone picked, and opens the dialog on them', async () => {
    const user = userEvent.setup();
    render(picker({ value: [BEN, CARA] }));

    await user.click(trigger(/Chosen: Ben Carter and Cara Diaz$/));

    const dialog = screen.getByRole('dialog', { name: 'Choose who to ask' });
    expect(dialog).toHaveAccessibleDescription(
      'They each answer in their own words.',
    );
    expect(screen.getByRole('checkbox', { name: 'Ben Carter' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Cara Diaz' })).toBeChecked();
  });

  it('hands on who is picked once Done is pressed, and not before', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(picker({ value: [BEN], onChange }));

    await user.click(trigger());
    await user.click(screen.getByRole('checkbox', { name: 'Cara Diaz' }));
    await user.click(screen.getByRole('checkbox', { name: 'Ben Carter' }));

    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Done (1)' }));

    expect(onChange).toHaveBeenCalledWith([CARA]);
    await waitFor(() => expect(trigger()).toHaveFocus());
  });

  it('sends every person picked as a field of its own', () => {
    const { container } = render(<form>{picker({ value: [BEN, CARA] })}</form>);
    const form = container.querySelector('form');
    if (!form) {
      throw new Error('No form was drawn.');
    }

    expect(new FormData(form).getAll('giverAccountIds')).toEqual([BEN, CARA]);
  });

  it('says what is wrong, tied to the button', () => {
    render(picker({ errorMessage: 'Pick at least one person to ask.' }));

    expect(trigger()).toHaveAttribute('aria-invalid', 'true');
    expect(trigger()).toHaveAccessibleDescription(
      'Pick at least one person to ask.',
    );
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemberMultiPicker } from './member-multi-picker';

const BEN = '0199a0f0-0000-7000-8000-00000000000b';
const CARA = '0199a0f0-0000-7000-8000-00000000000c';

const TEAMMATES = [
  { accountId: BEN, name: 'Ben Carter', slug: null, displayName: null },
  { accountId: CARA, name: 'Cara Diaz', slug: null, displayName: null },
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

function trigger() {
  return screen.getByRole('button', { name: /Who do you want to ask/ });
}

describe('MemberMultiPicker', () => {
  it('asks who to ask, and shows nobody picked yet', () => {
    render(picker());

    expect(trigger()).toHaveTextContent('Pick teammates');
    expect(screen.queryByRole('list', { name: 'Picked' })).toBeNull();
  });

  it('adds a teammate when they are ticked, keeping the menu open for the next', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(picker({ value: [BEN], onChange }));

    await user.click(trigger());
    await user.click(
      screen.getByRole('menuitemcheckbox', { name: 'Cara Diaz' }),
    );

    expect(onChange).toHaveBeenCalledWith([BEN, CARA]);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('takes a teammate off when they are unticked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(picker({ value: [BEN, CARA], onChange }));

    await user.click(trigger());
    await user.click(
      screen.getByRole('menuitemcheckbox', { name: 'Ben Carter' }),
    );

    expect(onChange).toHaveBeenCalledWith([CARA]);
  });

  it('shows each person picked as a chip that can be removed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(picker({ value: [BEN, CARA], onChange }));

    expect(trigger()).toHaveTextContent('2 picked');
    expect(screen.getByRole('list', { name: 'Picked' })).toHaveTextContent(
      'Ben CarterCara Diaz',
    );

    await user.click(screen.getByRole('button', { name: 'Remove Cara Diaz' }));

    expect(onChange).toHaveBeenCalledWith([BEN]);
  });

  it('sends every person picked as a field of its own', () => {
    const { container } = render(<form>{picker({ value: [BEN, CARA] })}</form>);
    const form = container.querySelector('form');
    if (!form) {
      throw new Error('No form was drawn.');
    }

    expect(new FormData(form).getAll('giverAccountIds')).toEqual([BEN, CARA]);
  });

  it('says what is wrong, tied to the trigger', () => {
    render(picker({ errorMessage: 'Pick at least one person to ask.' }));

    expect(trigger()).toHaveAttribute('aria-invalid', 'true');
    expect(trigger()).toHaveAccessibleDescription(
      'Pick at least one person to ask.',
    );
  });
});

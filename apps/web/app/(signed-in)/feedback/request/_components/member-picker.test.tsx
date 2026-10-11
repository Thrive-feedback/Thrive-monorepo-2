import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemberPicker } from './member-picker';

const TEAMMATES = [
  { accountId: '0199a0f0-0000-7000-8000-00000000000b', name: 'Ben Carter' },
  { accountId: '0199a0f0-0000-7000-8000-00000000000c', name: 'Cara Diaz' },
];

function picker(
  props: Partial<React.ComponentProps<typeof MemberPicker>> = {},
) {
  return (
    <MemberPicker
      teammates={TEAMMATES}
      value=""
      onChange={vi.fn()}
      {...props}
    />
  );
}

function trigger() {
  return screen.getByRole('combobox', { name: /Who do you want to ask/ });
}

describe('MemberPicker', () => {
  it('asks who to ask, and shows nobody chosen yet', () => {
    render(picker());

    expect(trigger()).toHaveTextContent('Pick a teammate');
  });

  it('names the teammate who is chosen', () => {
    render(picker({ value: TEAMMATES[1]?.accountId ?? '' }));

    expect(trigger()).toHaveTextContent('Cara Diaz');
  });

  it('offers every teammate it was given, and hands back the one picked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(picker({ onChange: handleChange }));

    await user.click(trigger());
    expect(screen.getAllByRole('option')).toHaveLength(2);
    await user.click(screen.getByRole('option', { name: 'Ben Carter' }));

    expect(handleChange).toHaveBeenCalledExactlyOnceWith(
      TEAMMATES[0]?.accountId,
    );
  });

  it('says what is wrong on the control itself, and announces it as invalid', () => {
    render(picker({ errorMessage: 'Pick who to ask.' }));

    expect(trigger()).toHaveAttribute('aria-invalid', 'true');
    expect(trigger()).toHaveAccessibleDescription('Pick who to ask.');
  });
});

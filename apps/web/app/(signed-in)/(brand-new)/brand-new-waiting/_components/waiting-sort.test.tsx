import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WaitingSort } from './waiting-sort';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

const theOrder = () => screen.getByRole('combobox', { name: 'Sort by' });

beforeEach(() => {
  push.mockClear();
});

describe('WaitingSort', () => {
  it('shows the order the list is in', () => {
    render(<WaitingSort sort="oldest" />);

    expect(theOrder()).toHaveTextContent('Oldest first');
  });

  it.each([
    ['newest', 'Oldest first', '/brand-new-waiting?sort=oldest'],
    ['oldest', 'Newest first', '/brand-new-waiting'],
  ] as const)(
    'keeps the order chosen in the address, from %s',
    async (sort, name, address) => {
      const user = userEvent.setup();
      render(<WaitingSort sort={sort} />);

      await user.click(theOrder());
      await user.click(screen.getByRole('option', { name }));

      expect(push).toHaveBeenCalledExactlyOnceWith(address);
    },
  );
});

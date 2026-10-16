import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeDialog } from './home-dialog';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

function renderDialog() {
  render(
    <HomeDialog
      title="Your feedback request"
      close={{ href: '/home?tab=my-requests' }}
    >
      <p>What came back</p>
    </HomeDialog>,
  );
}

describe('HomeDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is open, named by its title, with what it was given inside', () => {
    renderDialog();

    const dialog = screen.getByRole('dialog', {
      name: 'Your feedback request',
    });
    expect(dialog).toHaveTextContent('What came back');
  });

  it('closes from its button and drops itself from the address', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(replace).toHaveBeenCalledWith('/home?tab=my-requests', {
      scroll: false,
    });
  });

  it('closes on Escape too', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(replace).toHaveBeenCalledWith('/home?tab=my-requests', {
      scroll: false,
    });
  });

  it('closes in place when it is given a callback instead of an address', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <HomeDialog title="Give your feedback" close={{ onSelect }}>
        <p>The box</p>
      </HomeDialog>,
    );

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onSelect).toHaveBeenCalledOnce();
    expect(replace).not.toHaveBeenCalled();
  });
});

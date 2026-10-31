import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { KudosDialog } from './kudos-dialog';

// In a file of its own: Motion reads this once, the first time anything asks.
beforeAll(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  }));
});

const MALI = {
  accountId: 'mali',
  name: 'Mali Sombat',
  email: 'mali@acme.test',
  photoUrl: null,
  slug: 'mali',
  displayName: 'Mali',
};

describe('KudosDialog, with reduced motion', () => {
  it('has the card pinned with no movement, and the same way on from it', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <KudosDialog
        teammates={[MALI]}
        workspaceGoals={[]}
        open
        onOpenChange={onOpenChange}
        onSend={vi.fn().mockResolvedValue(true)}
        onGoToBoard={vi.fn()}
        onBackToHome={() => onOpenChange(false)}
      />,
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Your Kudos' }),
      '@mali thank you.',
    );
    await user.click(screen.getByRole('button', { name: 'Done' }));

    await user.click(screen.getByRole('button', { name: /^Send kudos/ }));

    expect(
      await screen.findByRole('button', { name: 'Back to home' }),
    ).toBeInTheDocument();
    expect(document.querySelector('[data-pin-board]')).not.toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

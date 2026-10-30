import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { PostcardDialog } from './postcard-dialog';

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

describe('PostcardDialog, with reduced motion', () => {
  it('sends without a postmark or a flight, and closes at once', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(true);
    const onOpenChange = vi.fn();
    render(
      <PostcardDialog
        title="Give feedback"
        teammates={[MALI]}
        workspaceGoals={[]}
        writer={{ name: 'Ann', photoUrl: null }}
        defaultRecipientAccountIds={['mali']}
        open
        onOpenChange={onOpenChange}
        onSend={onSend}
      />,
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Your feedback' }),
      'Thank you.',
    );
    await user.click(screen.getByRole('button', { name: 'Done' }));

    await user.click(screen.getByRole('button', { name: /^Send feedback/ }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(document.querySelector('[data-postmark]')).toBeNull();
    expect(document.querySelector('[data-contrail-reveal]')).toBeNull();
  });
});

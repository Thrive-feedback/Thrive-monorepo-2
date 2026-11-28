import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InfoTip } from '@/components/molecules/info-tip';

const WORDS = 'This part is different for everyone who opens it.';

function drawn() {
  render(<InfoTip about="For you" words={WORDS} />);
  return screen.getByRole('button', { name: 'About For you' });
}

/** The tip as it shows: Radix draws it in a portal, beside a copy for screen readers. */
function shownTip() {
  return screen.queryByRole('tooltip');
}

afterEach(() => {
  vi.useRealTimers();
});

describe('InfoTip', () => {
  it('reads its words to a screen reader on the button itself', () => {
    expect(drawn()).toHaveAccessibleDescription(WORDS);
  });

  it('opens on a press, and closes on a second press', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const button = drawn();

    await user.click(button);
    expect(shownTip()).toHaveTextContent(WORDS);
    // Past the tooltip's hover delay, as a person would be before pressing again.
    await act(() => vi.advanceTimersByTimeAsync(400));

    await user.click(button);
    await waitFor(() => expect(shownTip()).toBeNull());
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    await user.click(drawn());
    expect(shownTip()).toHaveTextContent(WORDS);

    await user.keyboard('{Escape}');
    await waitFor(() => expect(shownTip()).toBeNull());
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useOneOnOneAction } from '@/app/(signed-in)/(sidebar)/_lib/use-one-on-one-action';
import { StayInShowcase } from '@/app/ui-showcase/_components/stay-in-showcase';
import { Toaster } from '@/components/atoms/toaster';

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

/** A press that would write to a 1:1, as the showcase's panels have. */
function Writes({
  action,
  onRefused,
}: {
  action: () => Promise<{ ok: true }>;
  onRefused: () => void;
}) {
  const { run } = useOneOnOneAction();
  return (
    <button type="button" onClick={() => run(action, { onRefused })}>
      Start meeting
    </button>
  );
}

function pressed(name: string): boolean {
  // `fireEvent` answers false when something held the press (preventDefault).
  return fireEvent.click(screen.getByRole('link', { name }));
}

describe('StayInShowcase', () => {
  it('holds a press on a link into the app, and lets links within the showcase through', () => {
    render(
      <StayInShowcase>
        <a href="/one-on-ones?with=mint">
          <span>Mint</span>
        </a>
        <a href="/ui-showcase/one-on-ones/missed">Open Missed 1:1s</a>
        <a href="#summaries">Summaries</a>
      </StayInShowcase>,
    );

    expect(pressed('Mint')).toBe(false);
    expect(pressed('Open Missed 1:1s')).toBe(true);
    expect(pressed('Summaries')).toBe(true);
  });

  it('sends nothing to the server, whose Workspace the sample one is not, and says so', async () => {
    const action = vi.fn(async () => ({ ok: true as const }));
    const onRefused = vi.fn();
    render(
      <StayInShowcase>
        <Writes action={action} onRefused={onRefused} />
        <Toaster />
      </StayInShowcase>,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Start meeting' }),
    );

    expect(action).not.toHaveBeenCalled();
    expect(
      await screen.findByText('In the showcase, nothing is sent.'),
    ).toBeVisible();
    // What waited on it is told it did not go, so the sample stays as it was.
    expect(onRefused).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ComposeAction } from './compose-action';

vi.mock('server-only', () => ({}));

type DialogStandInProps = {
  open: boolean;
  onSent?: () => void;
  onCloseAutoFocus?: (event: Event) => void;
};

/** A dialog standing in for a card: it says which it is, and can be sent or closed. */
function dialogStandIn(name: string) {
  return function DialogStandIn({
    open,
    onSent,
    onCloseAutoFocus,
  }: DialogStandInProps) {
    return open ? (
      <>
        <p>{name}</p>
        <button
          type="button"
          onClick={() => {
            onSent?.();
            onCloseAutoFocus?.(new Event('close'));
          }}
        >
          Sent
        </button>
        <button
          type="button"
          onClick={() => onCloseAutoFocus?.(new Event('close'))}
        >
          Cancelled
        </button>
      </>
    ) : null;
  };
}

vi.mock(
  '@/app/(signed-in)/(sidebar)/_components/compose-postcard-dialog',
  () => ({
    warmPostcardDialog: vi.fn(),
    ComposePostcardDialog: ({
      title,
      ...rest
    }: DialogStandInProps & { title: string }) =>
      dialogStandIn(`${title} card`)(rest),
  }),
);
vi.mock('@/app/(signed-in)/(sidebar)/_components/compose-kudos-dialog', () => ({
  warmKudosDialog: vi.fn(),
  ComposeKudosDialog: (props: DialogStandInProps) =>
    dialogStandIn('Kudos card')(props),
}));

const HEADING_ID = 'page-heading';

function renderIt(choice: 'ask' | 'give' | 'kudos' = 'ask') {
  return render(
    <>
      <h1 id={HEADING_ID} tabIndex={-1}>
        Received
      </h1>
      <ComposeAction
        choice={choice}
        workspaceId="w-1"
        teammates={[]}
        workspaceGoals={[]}
        writer={{ name: 'Ann Lee', photoUrl: null }}
        returnFocusTo={HEADING_ID}
      />
    </>,
  );
}

describe('ComposeAction', () => {
  it.each([
    ['ask', 'Ask for feedback', 'bg-action-tertiary'],
    ['give', 'Give feedback', 'bg-action-primary'],
    ['kudos', 'Give kudos', 'bg-action-secondary'],
  ] as const)(
    "offers the one card %s writes, in that card's colour",
    (choice, name, fill) => {
      renderIt(choice);

      expect(screen.getAllByRole('button')).toHaveLength(1);
      expect(screen.getByRole('button', { name })).toHaveClass(fill);
    },
  );

  it('opens the card it names', async () => {
    const user = userEvent.setup();
    renderIt('kudos');

    await user.click(screen.getByRole('button', { name: 'Give kudos' }));

    expect(screen.getByText('Kudos card')).toBeVisible();
  });

  it('sends focus to the title once a card is sent, because this button is about to go', async () => {
    const user = userEvent.setup();
    renderIt();
    await user.click(screen.getByRole('button', { name: 'Ask for feedback' }));

    await user.click(screen.getByRole('button', { name: 'Sent' }));

    expect(screen.getByRole('heading', { name: 'Received' })).toHaveFocus();
  });

  it('leaves focus to the dialog when the card was only closed', async () => {
    const user = userEvent.setup();
    renderIt();
    await user.click(screen.getByRole('button', { name: 'Ask for feedback' }));

    await user.click(screen.getByRole('button', { name: 'Cancelled' }));

    expect(screen.getByRole('heading', { name: 'Received' })).not.toHaveFocus();
  });
});

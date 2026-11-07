import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GIVEN_HEADING_ID } from '@/app/(signed-in)/(sidebar)/_lib/personal-items-side.constant';
import { GiveFeedbackButton } from './give-feedback-button';

vi.mock('server-only', () => ({}));
vi.mock(
  '@/app/(signed-in)/(sidebar)/_components/compose-postcard-dialog',
  () => ({
    warmPostcardDialog: vi.fn(),
    ComposePostcardDialog: ({
      title,
      open,
      onSent,
      onCloseAutoFocus,
    }: {
      title: string;
      open: boolean;
      onSent: () => void;
      onCloseAutoFocus: (event: Event) => void;
    }) =>
      open ? (
        <>
          <p>{title}</p>
          <button
            type="button"
            onClick={() => {
              onSent();
              onCloseAutoFocus(new Event('close'));
            }}
          >
            Sent
          </button>
          <button
            type="button"
            onClick={() => onCloseAutoFocus(new Event('close'))}
          >
            Cancelled
          </button>
        </>
      ) : null,
  }),
);

describe('GiveFeedbackButton', () => {
  function renderIt() {
    return render(
      <>
        <h1 id={GIVEN_HEADING_ID} tabIndex={-1}>
          Given
        </h1>
        <GiveFeedbackButton
          workspaceId="w-1"
          teammates={[]}
          workspaceGoals={[]}
          writer={{ name: 'Ann Lee', photoUrl: null }}
        />
      </>,
    );
  }

  it('opens the postcard for giving Feedback', async () => {
    const user = userEvent.setup();
    renderIt();

    await user.click(screen.getByRole('button', { name: 'Give feedback' }));

    expect(screen.getByText('Give feedback', { selector: 'p' })).toBeVisible();
  });

  it('sends focus to the title once a card is sent, because this button is about to go', async () => {
    const user = userEvent.setup();
    renderIt();
    await user.click(screen.getByRole('button', { name: 'Give feedback' }));

    await user.click(screen.getByRole('button', { name: 'Sent' }));

    expect(screen.getByRole('heading', { name: 'Given' })).toHaveFocus();
  });

  it('leaves focus to the dialog when the card was only closed', async () => {
    const user = userEvent.setup();
    renderIt();
    await user.click(screen.getByRole('button', { name: 'Give feedback' }));

    await user.click(screen.getByRole('button', { name: 'Cancelled' }));

    expect(screen.getByRole('heading', { name: 'Given' })).not.toHaveFocus();
  });
});

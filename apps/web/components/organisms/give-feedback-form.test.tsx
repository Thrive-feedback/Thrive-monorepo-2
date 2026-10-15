import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GiveFeedbackAction } from '@/lib/feedback/give-feedback-state.type';
import { GiveFeedbackForm } from './give-feedback-form';

const giveFeedback = vi.fn<GiveFeedbackAction>();

const BEN = '0199a0f0-0000-7000-8000-00000000000b';
const CARA = '0199a0f0-0000-7000-8000-00000000000c';
const TEAMMATES = [
  { accountId: BEN, name: 'Ben Carter' },
  { accountId: CARA, name: 'Cara Diaz' },
];

/** What the action was sent, each field with every value it carries. */
function sentFormData() {
  const formData = giveFeedback.mock.calls[0]?.[1];
  return formData
    ? Object.fromEntries(
        [...new Set(formData.keys())].map((key) => [key, formData.getAll(key)]),
      )
    : undefined;
}

async function pickReceiver(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('combobox', { name: /Who is it for\?/ }));
  await user.click(screen.getByRole('option', { name: 'Ben Carter' }));
}

async function fillIn(user: ReturnType<typeof userEvent.setup>) {
  await pickReceiver(user);
  await user.type(
    screen.getByRole('textbox', { name: /What is it about\?/ }),
    'The customer demo',
  );
  await user.type(
    screen.getByRole('textbox', { name: /Your feedback/ }),
    'You kept it calm.',
  );
}

describe('GiveFeedbackForm', () => {
  beforeEach(() => {
    giveFeedback.mockReset();
    giveFeedback.mockResolvedValue({});
  });

  it('says what is missing, and sends nothing', async () => {
    const user = userEvent.setup();
    render(<GiveFeedbackForm teammates={TEAMMATES} action={giveFeedback} />);

    await user.click(screen.getByRole('button', { name: 'Send feedback' }));

    expect(screen.getByText('Pick who it is for.')).toBeInTheDocument();
    expect(screen.getByText('Add a Topic.')).toBeInTheDocument();
    expect(screen.getByText('Write your feedback.')).toBeInTheDocument();
    expect(giveFeedback).not.toHaveBeenCalled();
  });

  it('is shared with only the Receiver unless the Giver chooses otherwise', () => {
    render(<GiveFeedbackForm teammates={TEAMMATES} action={giveFeedback} />);

    expect(screen.getByRole('radio', { name: 'Only them' })).toBeChecked();
  });

  it('asks who to share it with, leaving out the Receiver', async () => {
    const user = userEvent.setup();
    render(<GiveFeedbackForm teammates={TEAMMATES} action={giveFeedback} />);

    await pickReceiver(user);
    await user.click(screen.getByRole('radio', { name: 'Selected people' }));

    expect(
      screen.getByRole('checkbox', { name: 'Cara Diaz' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Ben Carter' })).toBeNull();
  });

  it('needs at least one person when sharing with selected people', async () => {
    const user = userEvent.setup();
    render(<GiveFeedbackForm teammates={TEAMMATES} action={giveFeedback} />);

    await fillIn(user);
    await user.click(screen.getByRole('radio', { name: 'Selected people' }));
    await user.click(screen.getByRole('button', { name: 'Send feedback' }));

    expect(
      screen.getByText('Pick at least one person to share it with.'),
    ).toBeInTheDocument();
    expect(giveFeedback).not.toHaveBeenCalled();
  });

  it('sends who it is for, the Topic, the feedback and who else may read it', async () => {
    const user = userEvent.setup();
    render(<GiveFeedbackForm teammates={TEAMMATES} action={giveFeedback} />);

    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Send feedback' }));

    expect(giveFeedback).toHaveBeenCalledOnce();
    expect(sentFormData()).toEqual({
      receiverAccountId: [BEN],
      topic: ['The customer demo'],
      body: ['You kept it calm.'],
      visibility: ['ONLY_ME'],
    });
  });

  it('sends the people picked to share it with', async () => {
    const user = userEvent.setup();
    render(<GiveFeedbackForm teammates={TEAMMATES} action={giveFeedback} />);

    await fillIn(user);
    await user.click(screen.getByRole('radio', { name: 'Selected people' }));
    await user.click(screen.getByRole('checkbox', { name: 'Cara Diaz' }));
    await user.click(screen.getByRole('button', { name: 'Send feedback' }));

    expect(sentFormData()).toMatchObject({
      visibility: ['SELECTED_PEOPLE'],
      selectedAccountIds: [CARA],
    });
  });

  it('keeps what was written when the API refuses, and says why', async () => {
    const user = userEvent.setup();
    giveFeedback.mockResolvedValue({
      formError: 'That teammate is no longer in your Workspace.',
    });
    render(<GiveFeedbackForm teammates={TEAMMATES} action={giveFeedback} />);

    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Send feedback' }));

    expect(
      await screen.findByText('That teammate is no longer in your Workspace.'),
    ).toHaveAttribute('role', 'alert');
    expect(screen.getByRole('textbox', { name: /Your feedback/ })).toHaveValue(
      'You kept it calm.',
    );
  });
});

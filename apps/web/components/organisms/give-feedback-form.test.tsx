import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GiveFeedbackAction } from '@/lib/feedback/give-feedback-state.type';
import { GiveFeedbackForm } from './give-feedback-form';

const giveFeedback = vi.fn<GiveFeedbackAction>();

const BEN = '0199a0f0-0000-7000-8000-00000000000b';
const CARA = '0199a0f0-0000-7000-8000-00000000000c';
const TEAMMATES = [
  {
    accountId: BEN,
    name: 'Ben Carter',
    email: 'ben@acme.test',
    photoUrl: null,
    slug: null,
    displayName: null,
  },
  {
    accountId: CARA,
    name: 'Cara Diaz',
    email: 'cara@acme.test',
    photoUrl: null,
    slug: null,
    displayName: null,
  },
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

function receiversButton() {
  return screen.getByRole('button', { name: /^Choose who it's for/ });
}

/** Opens who it is for, ticks each person, and presses Done. */
async function pickReceivers(
  user: ReturnType<typeof userEvent.setup>,
  ...names: string[]
) {
  await user.click(receiversButton());
  for (const name of names) {
    await user.click(screen.getByRole('checkbox', { name }));
  }
  await user.click(screen.getByRole('button', { name: /^Done/ }));
}

async function fillIn(user: ReturnType<typeof userEvent.setup>) {
  await pickReceivers(user, 'Ben Carter');
  await user.type(
    screen.getByRole('textbox', { name: /Your feedback/ }),
    'You kept it calm.',
  );
}

function peopleButton() {
  return screen.getByRole('button', { name: /^Choose who else can read/ });
}

/** Ticks or unticks each person in the open dialog, then presses Done. */
async function tickAndDone(
  user: ReturnType<typeof userEvent.setup>,
  ...names: string[]
) {
  for (const name of names) {
    await user.click(screen.getByRole('checkbox', { name }));
  }
  await user.click(screen.getByRole('button', { name: /^Done/ }));
}

/** The one button by Send that says, and opens, who else can read it. */
function audienceButton() {
  return screen.getByRole('button', { name: /^Who else can read it:/ });
}

async function openAudience(user: ReturnType<typeof userEvent.setup>) {
  await user.click(audienceButton());
}

describe('GiveFeedbackForm', () => {
  beforeEach(() => {
    giveFeedback.mockReset();
    giveFeedback.mockResolvedValue({});
  });

  it('says what is missing, and sends nothing', async () => {
    const user = userEvent.setup();
    render(
      <GiveFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={giveFeedback}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Send feedback' }));

    expect(screen.getByText('Pick who it is for.')).toBeInTheDocument();
    expect(screen.getByText('Write your feedback.')).toBeInTheDocument();
    expect(giveFeedback).not.toHaveBeenCalled();
  });

  it('is shared with only the Receiver unless the Giver chooses otherwise', async () => {
    const user = userEvent.setup();
    render(
      <GiveFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={giveFeedback}
      />,
    );

    expect(audienceButton()).toHaveAccessibleName(
      'Who else can read it: Only them',
    );

    await openAudience(user);

    expect(screen.getByRole('radio', { name: 'Only them' })).toBeChecked();
  });

  it('asks who to share it with, leaving out the Receiver', async () => {
    const user = userEvent.setup();
    render(
      <GiveFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={giveFeedback}
      />,
    );

    await pickReceivers(user, 'Ben Carter');
    await openAudience(user);
    await user.click(screen.getByRole('radio', { name: 'Selected people' }));

    expect(
      screen.getByRole('dialog', { name: 'Choose who else can read' }),
    ).toHaveAccessibleDescription('Ben Carter and you can always read it.');
    expect(
      screen.getByRole('checkbox', { name: 'Cara Diaz' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Ben Carter' })).toBeNull();
  });

  it('gives it to several people at once, none of whom is somebody to share it with', async () => {
    const user = userEvent.setup();
    render(
      <GiveFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={giveFeedback}
      />,
    );

    await pickReceivers(user, 'Cara Diaz', 'Ben Carter');

    expect(receiversButton()).toHaveAccessibleName(
      "Choose who it's for. Chosen: Cara Diaz and Ben Carter",
    );
    await openAudience(user);
    await user.click(screen.getByRole('radio', { name: 'Selected people' }));
    expect(
      screen.getByRole('dialog', { name: 'Choose who else can read' }),
    ).toHaveAccessibleDescription(
      'Cara Diaz, Ben Carter, and you can always read it.',
    );
    expect(screen.queryByRole('checkbox', { name: 'Ben Carter' })).toBeNull();
    expect(screen.queryByRole('checkbox', { name: 'Cara Diaz' })).toBeNull();
  });

  it('needs at least one person when sharing with selected people', async () => {
    const user = userEvent.setup();
    render(
      <GiveFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={giveFeedback}
      />,
    );

    await fillIn(user);
    await openAudience(user);
    await user.click(screen.getByRole('radio', { name: 'Selected people' }));
    await tickAndDone(user, 'Cara Diaz');
    await user.click(peopleButton());
    await tickAndDone(user, 'Cara Diaz');
    await user.click(screen.getByRole('button', { name: 'Send feedback' }));

    expect(
      screen.getByText('Pick at least one person to share it with.'),
    ).toBeInTheDocument();
    expect(peopleButton()).toHaveFocus();
    expect(giveFeedback).not.toHaveBeenCalled();
  });

  it('sends who it is for, the Feedback message and who else may read it', async () => {
    const user = userEvent.setup();
    render(
      <GiveFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={giveFeedback}
      />,
    );

    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Send feedback' }));

    expect(giveFeedback).toHaveBeenCalledOnce();
    expect(sentFormData()).toEqual({
      receiverAccountIds: [BEN],
      message: ['You kept it calm.'],
      visibility: ['ONLY_ME'],
    });
  });

  it('sends the people picked to share it with', async () => {
    const user = userEvent.setup();
    render(
      <GiveFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={giveFeedback}
      />,
    );

    await fillIn(user);
    await openAudience(user);
    await user.click(screen.getByRole('radio', { name: 'Selected people' }));
    await tickAndDone(user, 'Cara Diaz');
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
    render(
      <GiveFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={giveFeedback}
      />,
    );

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

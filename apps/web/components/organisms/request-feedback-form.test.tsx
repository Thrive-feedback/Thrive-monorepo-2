import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestFeedbackState } from '@/lib/feedback/request-feedback-state.type';
import { RequestFeedbackForm } from './request-feedback-form';

const requestFeedback =
  vi.fn<
    (
      previous: RequestFeedbackState,
      formData: FormData,
    ) => Promise<RequestFeedbackState>
  >();

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

function trigger() {
  return screen.getByRole('button', { name: /^Choose who to ask/ });
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

function messageField() {
  return screen.getByRole('textbox', {
    name: /What would you like feedback on/,
  });
}

function sendButton() {
  return screen.getByRole('button', { name: 'Send request' });
}

/** What the action was sent, as the plain pairs the API will receive. */
function sentFormData() {
  const formData = requestFeedback.mock.calls[0]?.[1];
  return formData ? Object.fromEntries(formData.entries()) : undefined;
}

function sentSelectedPeople() {
  return requestFeedback.mock.calls[0]?.[1].getAll('selectedAccountIds');
}

async function fillIn(user: ReturnType<typeof userEvent.setup>) {
  await pickBen(user);
  await user.type(messageField(), 'my sprint review talk');
}

async function pick(
  user: ReturnType<typeof userEvent.setup>,
  ...names: string[]
) {
  await user.click(trigger());
  await tickAndDone(user, ...names);
}

async function pickBen(user: ReturnType<typeof userEvent.setup>) {
  await pick(user, 'Ben Carter');
}

/** The one button by Send that says, and opens, who else can read it. */
function audienceButton() {
  return screen.getByRole('button', { name: /^Who else can read it:/ });
}

async function openAudience(user: ReturnType<typeof userEvent.setup>) {
  await user.click(audienceButton());
}

describe('RequestFeedbackForm', () => {
  beforeEach(() => {
    requestFeedback.mockReset();
    requestFeedback.mockResolvedValue({});
  });

  it('asks for a teammate and a Request message, and offers to send', () => {
    render(
      <RequestFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={requestFeedback}
      />,
    );

    expect(trigger()).toBeInTheDocument();
    expect(messageField()).toBeInTheDocument();
    expect(sendButton()).toHaveAttribute('type', 'submit');
  });

  it('sends the chosen teammate and the Request message once both are given', async () => {
    const user = userEvent.setup();
    render(
      <RequestFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={requestFeedback}
      />,
    );

    await pickBen(user);
    await user.type(messageField(), 'my sprint review talk');
    await user.click(sendButton());

    expect(requestFeedback).toHaveBeenCalledOnce();
    expect(sentFormData()).toEqual({
      giverAccountIds: BEN,
      message: 'my sprint review talk',
      visibility: 'EVERYONE',
    });
  });

  it('shares the answers with everyone in the Workspace unless the Requester chooses otherwise, and says so', async () => {
    const user = userEvent.setup();
    render(
      <RequestFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={requestFeedback}
      />,
    );

    expect(audienceButton()).toHaveAccessibleName(
      'Who else can read it: Everyone in the Workspace',
    );

    await openAudience(user);

    expect(
      screen.getByRole('radio', { name: 'Everyone in the Workspace' }),
    ).toBeChecked();
    expect(
      screen.getByText(
        /Everyone in your Workspace can read what they send back\./,
      ),
    ).toBeInTheDocument();
  });

  it('says the people picked can also read what comes back', async () => {
    const user = userEvent.setup();
    render(
      <RequestFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={requestFeedback}
      />,
    );

    await openAudience(user);

    await user.click(screen.getByRole('radio', { name: 'Selected people' }));

    expect(
      screen.getByText(
        /The people you pick can also read what they send back\./,
      ),
    ).toBeInTheDocument();
  });

  it('says everyone in the Workspace can read what comes back', async () => {
    const user = userEvent.setup();
    render(
      <RequestFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={requestFeedback}
      />,
    );

    await openAudience(user);

    await user.click(
      screen.getByRole('radio', { name: 'Everyone in the Workspace' }),
    );

    expect(
      screen.getByText(
        /Everyone in your Workspace can read what they send back\./,
      ),
    ).toBeInTheDocument();
  });

  it('asks who to share it with, the teammates being asked included', async () => {
    const user = userEvent.setup();
    render(
      <RequestFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={requestFeedback}
      />,
    );

    await pickBen(user);
    await openAudience(user);
    await user.click(screen.getByRole('radio', { name: 'Selected people' }));

    expect(
      screen.getByRole('dialog', { name: 'Choose who else can read' }),
    ).toHaveAccessibleDescription('You can always read what they send back.');
    expect(
      screen.getByRole('checkbox', { name: 'Cara Diaz' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Ben Carter' }),
    ).toBeInTheDocument();
  });

  it('asks everyone picked, as one request', async () => {
    const user = userEvent.setup();
    render(
      <RequestFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={requestFeedback}
      />,
    );

    await pick(user, 'Ben Carter', 'Cara Diaz');
    await user.type(messageField(), 'my sprint review talk');
    await user.click(sendButton());

    expect(
      requestFeedback.mock.calls[0]?.[1].getAll('giverAccountIds'),
    ).toEqual([BEN, CARA]);
  });

  it('lets a picked teammate be taken off again before sending', async () => {
    const user = userEvent.setup();
    render(
      <RequestFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={requestFeedback}
      />,
    );

    await pick(user, 'Ben Carter', 'Cara Diaz');
    await pick(user, 'Ben Carter');
    await user.type(messageField(), 'my sprint review talk');
    await user.click(sendButton());

    expect(
      requestFeedback.mock.calls[0]?.[1].getAll('giverAccountIds'),
    ).toEqual([CARA]);
  });

  it('sends the people picked to read the answers', async () => {
    const user = userEvent.setup();
    render(
      <RequestFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={requestFeedback}
      />,
    );

    await fillIn(user);
    await openAudience(user);
    await user.click(screen.getByRole('radio', { name: 'Selected people' }));
    await tickAndDone(user, 'Cara Diaz');

    expect(peopleButton()).toHaveAccessibleName(
      'Choose who else can read. Chosen: Cara Diaz',
    );

    await user.click(sendButton());

    expect(sentFormData()?.visibility).toBe('SELECTED_PEOPLE');
    expect(sentSelectedPeople()).toEqual([CARA]);
  });

  it('needs at least one person when sharing with selected people, and puts focus there', async () => {
    const user = userEvent.setup();
    render(
      <RequestFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={requestFeedback}
      />,
    );

    await fillIn(user);
    await openAudience(user);
    await user.click(screen.getByRole('radio', { name: 'Selected people' }));
    await tickAndDone(user, 'Cara Diaz');
    await user.click(peopleButton());
    await tickAndDone(user, 'Cara Diaz');
    await user.click(sendButton());

    expect(
      screen.getByText('Pick at least one person to share it with.'),
    ).toBeInTheDocument();
    expect(peopleButton()).toHaveFocus();
    expect(peopleButton()).toHaveAttribute('aria-invalid', 'true');
    expect(requestFeedback).not.toHaveBeenCalled();
  });

  it('puts the choice back when Selected people is left with nobody picked', async () => {
    const user = userEvent.setup();
    render(
      <RequestFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={requestFeedback}
      />,
    );

    await openAudience(user);
    await user.click(
      screen.getByRole('radio', { name: 'Everyone in the Workspace' }),
    );
    await user.click(screen.getByRole('radio', { name: 'Selected people' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(
      screen.getByRole('radio', { name: 'Everyone in the Workspace' }),
    ).toBeChecked();
    expect(
      screen.queryByRole('button', { name: /^Choose who else can read/ }),
    ).not.toBeInTheDocument();
  });

  it('refuses an empty form, says what is missing on both fields, and sends nothing', async () => {
    const user = userEvent.setup();
    render(
      <RequestFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={requestFeedback}
      />,
    );

    await user.click(sendButton());

    expect(
      screen.getByText('Pick at least one person to ask.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Write what you would like feedback on.'),
    ).toBeInTheDocument();
    expect(requestFeedback).not.toHaveBeenCalled();
  });

  it('asks for the Request message when only the teammate is chosen', async () => {
    const user = userEvent.setup();
    render(
      <RequestFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={requestFeedback}
      />,
    );

    await pickBen(user);
    await user.click(sendButton());

    expect(
      screen.getByText('Write what you would like feedback on.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Pick at least one person to ask.')).toBeNull();
    expect(requestFeedback).not.toHaveBeenCalled();
  });

  it('asks who to ask when only the Request message is typed, and puts focus there', async () => {
    const user = userEvent.setup();
    render(
      <RequestFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={requestFeedback}
      />,
    );

    await user.type(messageField(), 'my sprint review talk');
    await user.click(sendButton());

    expect(
      screen.getByText('Pick at least one person to ask.'),
    ).toBeInTheDocument();
    expect(trigger()).toHaveFocus();
    expect(requestFeedback).not.toHaveBeenCalled();
  });

  it('treats a Request message of only spaces as none', async () => {
    const user = userEvent.setup();
    render(
      <RequestFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={requestFeedback}
      />,
    );

    await pickBen(user);
    await user.type(messageField(), '   ');
    await user.click(sendButton());

    expect(
      screen.getByText('Write what you would like feedback on.'),
    ).toBeInTheDocument();
    expect(requestFeedback).not.toHaveBeenCalled();
  });

  it('keeps what was picked and typed when the API refuses, and says why', async () => {
    const user = userEvent.setup();
    requestFeedback.mockResolvedValue({
      formError: 'That teammate is no longer in your Workspace.',
    });
    render(
      <RequestFeedbackForm
        teammates={TEAMMATES}
        workspaceGoals={[]}
        action={requestFeedback}
      />,
    );

    await pickBen(user);
    await user.type(messageField(), 'my sprint review talk');
    await user.click(sendButton());

    expect(
      await screen.findByText('That teammate is no longer in your Workspace.'),
    ).toHaveAttribute('role', 'alert');
    expect(trigger()).toHaveAccessibleName(
      'Choose who to ask. Chosen: Ben Carter',
    );
    expect(messageField()).toHaveValue('my sprint review talk');
  });

  it('still shows the form when there is nobody to ask, and says why in the dialog', async () => {
    const user = userEvent.setup();
    render(
      <RequestFeedbackForm
        teammates={[]}
        workspaceGoals={[]}
        action={requestFeedback}
      />,
    );

    expect(messageField()).toBeInTheDocument();
    expect(sendButton()).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();

    await user.click(trigger());

    expect(
      screen.getByText('Nobody else is in your Workspace yet.'),
    ).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestFeedbackState } from '@/app/(signed-in)/(member)/home/_lib/request-feedback-state.type';
import { RequestFeedbackForm } from './request-feedback-form';

const requestFeedback =
  vi.fn<
    (
      previous: RequestFeedbackState,
      formData: FormData,
    ) => Promise<RequestFeedbackState>
  >();
vi.mock(
  '@/app/(signed-in)/(member)/home/_lib/request-feedback-actions.service',
  () => ({
    requestFeedback: (previous: RequestFeedbackState, formData: FormData) =>
      requestFeedback(previous, formData),
  }),
);

const BEN = '0199a0f0-0000-7000-8000-00000000000b';
const TEAMMATES = [{ accountId: BEN, name: 'Ben Carter' }];

function trigger() {
  return screen.getByRole('combobox', { name: /Who do you want to ask/ });
}

function topicField() {
  return screen.getByRole('textbox', { name: /What should they talk about/ });
}

function sendButton() {
  return screen.getByRole('button', { name: 'Send request' });
}

/** What the action was sent, as the plain pairs the API will receive. */
function sentFormData() {
  const formData = requestFeedback.mock.calls[0]?.[1];
  return formData ? Object.fromEntries(formData.entries()) : undefined;
}

async function pickBen(user: ReturnType<typeof userEvent.setup>) {
  await user.click(trigger());
  await user.click(screen.getByRole('option', { name: 'Ben Carter' }));
}

describe('RequestFeedbackForm', () => {
  beforeEach(() => {
    requestFeedback.mockReset();
    requestFeedback.mockResolvedValue({});
  });

  it('asks for a teammate and a Topic, and offers to send', () => {
    render(<RequestFeedbackForm teammates={TEAMMATES} />);

    expect(trigger()).toBeInTheDocument();
    expect(topicField()).toBeInTheDocument();
    expect(sendButton()).toHaveAttribute('type', 'submit');
  });

  it('sends the chosen teammate and the Topic once both are given', async () => {
    const user = userEvent.setup();
    render(<RequestFeedbackForm teammates={TEAMMATES} />);

    await pickBen(user);
    await user.type(topicField(), 'my sprint review talk');
    await user.click(sendButton());

    expect(requestFeedback).toHaveBeenCalledOnce();
    expect(sentFormData()).toEqual({
      giverAccountId: BEN,
      topic: 'my sprint review talk',
    });
  });

  it('refuses an empty form, says what is missing on both fields, and sends nothing', async () => {
    const user = userEvent.setup();
    render(<RequestFeedbackForm teammates={TEAMMATES} />);

    await user.click(sendButton());

    expect(screen.getByText('Pick who to ask.')).toBeInTheDocument();
    expect(screen.getByText('Add a Topic.')).toBeInTheDocument();
    expect(requestFeedback).not.toHaveBeenCalled();
  });

  it('asks for the Topic when only the teammate is chosen', async () => {
    const user = userEvent.setup();
    render(<RequestFeedbackForm teammates={TEAMMATES} />);

    await pickBen(user);
    await user.click(sendButton());

    expect(screen.getByText('Add a Topic.')).toBeInTheDocument();
    expect(screen.queryByText('Pick who to ask.')).toBeNull();
    expect(requestFeedback).not.toHaveBeenCalled();
  });

  it('asks who to ask when only the Topic is typed, and puts focus there', async () => {
    const user = userEvent.setup();
    render(<RequestFeedbackForm teammates={TEAMMATES} />);

    await user.type(topicField(), 'my sprint review talk');
    await user.click(sendButton());

    expect(screen.getByText('Pick who to ask.')).toBeInTheDocument();
    expect(trigger()).toHaveFocus();
    expect(requestFeedback).not.toHaveBeenCalled();
  });

  it('treats a Topic of only spaces as no Topic', async () => {
    const user = userEvent.setup();
    render(<RequestFeedbackForm teammates={TEAMMATES} />);

    await pickBen(user);
    await user.type(topicField(), '   ');
    await user.click(sendButton());

    expect(screen.getByText('Add a Topic.')).toBeInTheDocument();
    expect(requestFeedback).not.toHaveBeenCalled();
  });

  it('keeps what was picked and typed when the API refuses, and says why', async () => {
    const user = userEvent.setup();
    requestFeedback.mockResolvedValue({
      formError: 'That teammate is no longer in your Workspace.',
    });
    render(<RequestFeedbackForm teammates={TEAMMATES} />);

    await pickBen(user);
    await user.type(topicField(), 'my sprint review talk');
    await user.click(sendButton());

    expect(
      await screen.findByText('That teammate is no longer in your Workspace.'),
    ).toHaveAttribute('role', 'alert');
    expect(trigger()).toHaveTextContent('Ben Carter');
    expect(topicField()).toHaveValue('my sprint review talk');
  });

  it('still shows the form when there is nobody to ask', () => {
    render(<RequestFeedbackForm teammates={[]} />);

    expect(trigger()).toHaveTextContent('Pick a teammate');
    expect(topicField()).toBeInTheDocument();
    expect(sendButton()).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });
});

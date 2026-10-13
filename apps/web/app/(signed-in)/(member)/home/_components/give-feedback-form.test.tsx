import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const toastInfo = vi.fn();
vi.mock('sonner', () => ({
  toast: { info: (...args: unknown[]) => toastInfo(...args) },
}));

const { GiveFeedbackForm } = await import('./give-feedback-form');

const TEAMMATES = [
  { accountId: 'a-ben', name: 'Ben Carter' },
  { accountId: 'a-cara', name: 'Cara Diaz' },
];

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
    toastInfo.mockClear();
  });

  it('says what is missing, and sends nothing', async () => {
    const user = userEvent.setup();
    render(<GiveFeedbackForm teammates={TEAMMATES} />);

    await user.click(screen.getByRole('button', { name: 'Send feedback' }));

    expect(screen.getByText('Pick who it is for.')).toBeInTheDocument();
    expect(screen.getByText('Add a Topic.')).toBeInTheDocument();
    expect(screen.getByText('Write your feedback.')).toBeInTheDocument();
    expect(toastInfo).not.toHaveBeenCalled();
  });

  it('is shared with only the Receiver unless the Giver chooses otherwise', () => {
    render(<GiveFeedbackForm teammates={TEAMMATES} />);

    expect(screen.getByRole('radio', { name: 'Only them' })).toBeChecked();
  });

  it('asks who to share it with, leaving out the Receiver', async () => {
    const user = userEvent.setup();
    render(<GiveFeedbackForm teammates={TEAMMATES} />);

    await pickReceiver(user);
    await user.click(screen.getByRole('radio', { name: 'Selected people' }));

    expect(
      screen.getByRole('checkbox', { name: 'Cara Diaz' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Ben Carter' })).toBeNull();
  });

  it('needs at least one person when sharing with selected people', async () => {
    const user = userEvent.setup();
    render(<GiveFeedbackForm teammates={TEAMMATES} />);

    await fillIn(user);
    await user.click(screen.getByRole('radio', { name: 'Selected people' }));
    await user.click(screen.getByRole('button', { name: 'Send feedback' }));

    expect(
      screen.getByText('Pick at least one person to share it with.'),
    ).toBeInTheDocument();
    expect(toastInfo).not.toHaveBeenCalled();
  });

  it('says nothing was sent yet, then clears the form', async () => {
    const user = userEvent.setup();
    render(<GiveFeedbackForm teammates={TEAMMATES} />);

    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Send feedback' }));

    expect(toastInfo).toHaveBeenCalledWith(
      expect.stringContaining('nothing was sent'),
      expect.anything(),
    );
    expect(
      screen.getByRole('textbox', { name: /What is it about\?/ }),
    ).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /Your feedback/ })).toHaveValue(
      '',
    );
  });
});

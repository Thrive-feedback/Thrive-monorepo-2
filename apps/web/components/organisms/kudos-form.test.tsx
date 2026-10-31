import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GiveKudosAction } from '@/lib/feedback/give-kudos-state.type';
import { KudosForm } from './kudos-form';

const giveKudos = vi.fn<GiveKudosAction>();

const TEAMMATES = [
  {
    accountId: '0199a0f0-0000-7000-8000-00000000000b',
    name: 'Ben Carter',
    email: 'ben@acme.test',
    photoUrl: null,
    slug: 'ben',
    displayName: 'Ben',
  },
  {
    accountId: '0199a0f0-0000-7000-8000-00000000000c',
    name: 'Cara Diaz',
    email: 'cara@acme.test',
    photoUrl: null,
    slug: 'cara',
    displayName: 'Cara',
  },
];

function renderForm() {
  render(
    <KudosForm
      teammates={TEAMMATES}
      workspaceGoals={[]}
      workspaceName="Acme"
      action={giveKudos}
    />,
  );
  return {
    message: screen.getByRole('textbox', { name: /Your Kudos/ }),
    send: screen.getByRole('button', { name: 'Send Kudos' }),
  };
}

describe('KudosForm', () => {
  beforeEach(() => {
    giveKudos.mockReset();
    giveKudos.mockResolvedValue({});
  });

  it('waits to send until something is written, naming a teammate or not', async () => {
    const user = userEvent.setup();
    const { message, send } = renderForm();
    expect(send).toBeDisabled();

    await user.type(message, 'Great launch, everyone.');

    expect(send).toBeEnabled();
  });

  it('counts down what is left of 280 characters, and stops at too many', async () => {
    const user = userEvent.setup();
    const { message, send } = renderForm();

    expect(screen.getByText('280 characters left')).toBeInTheDocument();

    await user.type(message, '@ben ');
    await user.paste('a'.repeat(280));

    expect(screen.getByText('5 characters over')).toBeInTheDocument();
    expect(send).toBeDisabled();
  });

  it('sends what was written', async () => {
    const user = userEvent.setup();
    const { message, send } = renderForm();

    await user.type(message, '@ben and @cara carried the launch.');
    await user.click(send);

    expect(giveKudos.mock.calls[0]?.[1].get('message')).toBe(
      '@ben and @cara carried the launch.',
    );
  });

  it('says why the API refused it, keeping what was typed', async () => {
    giveKudos.mockResolvedValue({
      formError: 'Mention at least one teammate with @.',
    });
    const user = userEvent.setup();
    const { message, send } = renderForm();

    await user.type(message, '@ben carried the launch.');
    await user.click(send);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Mention at least one teammate with @.',
    );
    expect(message).toHaveValue('@ben carried the launch.');
  });
});

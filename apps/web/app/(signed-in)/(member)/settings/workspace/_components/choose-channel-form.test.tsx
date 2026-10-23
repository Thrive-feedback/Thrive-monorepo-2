import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChooseChannelForm } from './choose-channel-form';

const chooseChannel = vi.fn();
vi.mock(
  '@/app/(signed-in)/(member)/settings/workspace/_lib/integration-actions.service',
  () => ({
    chooseChannel: (...args: unknown[]) => chooseChannel(...args),
  }),
);

const CHANNELS = [
  { id: 'channel-general', name: 'general' },
  { id: 'channel-standups', name: 'standups' },
] as const;

const CLEAN_ADDRESS = '/settings/workspace/integrations/discord/callback';

function renderForm(
  channels: readonly { id: string; name: string }[] = CHANNELS,
) {
  render(
    <ChooseChannelForm
      segment="discord"
      label="Discord"
      spaceName="Acme HQ"
      channels={channels}
      installation="signed-installation"
      cleanAddress={CLEAN_ADDRESS}
    />,
  );
}

beforeEach(() => {
  chooseChannel.mockReset();
  window.history.replaceState(null, '', '/callback?code=a-code&state=a-state');
});

describe('ChooseChannelForm', () => {
  it('says which server Thrive is in, and who will be able to read the posts', () => {
    renderForm();

    expect(screen.getByText(/Thrive is in/)).toHaveTextContent(
      'everyone who can read that channel will see who gave Feedback to whom and what it was about — never the Feedback itself',
    );
  });

  it('drops the code the tool put in the address, so it cannot be reloaded or shared', () => {
    renderForm();

    expect(window.location.search).toBe('');
    expect(window.location.pathname).toBe(CLEAN_ADDRESS);
  });

  it('connects the channel the Admin chose', async () => {
    const user = userEvent.setup();
    chooseChannel.mockReturnValue(new Promise(() => undefined));
    renderForm();

    await user.click(screen.getByRole('combobox', { name: 'Channel' }));
    await user.click(screen.getByRole('option', { name: '#standups' }));
    await user.click(
      screen.getByRole('button', { name: 'Connect this channel' }),
    );

    expect(chooseChannel).toHaveBeenCalledWith(
      'discord',
      'signed-installation',
      'channel-standups',
    );
  });

  it('offers the first channel until another is chosen', async () => {
    const user = userEvent.setup();
    chooseChannel.mockReturnValue(new Promise(() => undefined));
    renderForm();

    await user.click(
      screen.getByRole('button', { name: 'Connect this channel' }),
    );

    expect(chooseChannel).toHaveBeenCalledWith(
      'discord',
      'signed-installation',
      'channel-general',
    );
  });

  it('says nothing was connected when the tool would not take the message', async () => {
    const user = userEvent.setup();
    chooseChannel.mockResolvedValue({
      ok: false,
      message:
        "Thrive couldn't post in that channel, so nothing was connected. Check the bot can see it and post in it, then try another channel.",
    });
    renderForm();

    await user.click(
      screen.getByRole('button', { name: 'Connect this channel' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'nothing was connected',
    );
  });

  it('asks for a text channel instead of an empty list when the server has none', () => {
    renderForm([]);

    expect(
      screen.getByText(/has no text channel Thrive can post in/),
    ).toHaveTextContent('Add one in Acme HQ, then connect again.');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});

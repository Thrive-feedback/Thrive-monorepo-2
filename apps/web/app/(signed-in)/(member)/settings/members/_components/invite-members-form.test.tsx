import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InviteMembersState } from '@/app/(signed-in)/(member)/settings/members/_lib/invite-members-state.type';

const inviteMembers =
  vi.fn<(emails: readonly string[]) => Promise<InviteMembersState>>();
vi.mock(
  '@/app/(signed-in)/(member)/settings/members/_lib/invitation-actions.service',
  () => ({
    inviteMembers: (emails: readonly string[]) => inviteMembers(emails),
  }),
);

const { InviteMembersForm } = await import('./invite-members-form');

function box() {
  return screen.getByRole('textbox', { name: /Email addresses/ });
}

async function send(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(box(), text);
  await user.click(screen.getByRole('button', { name: 'Send invites' }));
}

describe('InviteMembersForm', () => {
  beforeEach(() => {
    inviteMembers.mockReset();
  });

  it('names what is not an address, and sends nothing', async () => {
    const user = userEvent.setup();
    render(<InviteMembersForm />);

    await send(user, 'ben@acme.test, cara');

    expect(screen.getByText('Not an email address: cara')).toBeInTheDocument();
    expect(box()).toHaveFocus();
    expect(inviteMembers).not.toHaveBeenCalled();
  });

  it('asks for an address when the box is empty', async () => {
    const user = userEvent.setup();
    render(<InviteMembersForm />);

    await user.click(screen.getByRole('button', { name: 'Send invites' }));

    expect(
      screen.getByText('Add at least one email address.'),
    ).toBeInTheDocument();
    expect(inviteMembers).not.toHaveBeenCalled();
  });

  it('refuses more than ten at once', async () => {
    const user = userEvent.setup();
    render(<InviteMembersForm />);

    await send(
      user,
      Array.from({ length: 11 }, (_, i) => `p${i}@acme.test`).join(','),
    );

    expect(
      screen.getByText('You can invite up to 10 people at a time.'),
    ).toBeInTheDocument();
    expect(inviteMembers).not.toHaveBeenCalled();
  });

  it('sends each address once, and says what happened to each', async () => {
    const user = userEvent.setup();
    inviteMembers.mockResolvedValue({
      results: [
        { email: 'ben@acme.test', outcome: 'invited' },
        { email: 'cara@acme.test', outcome: 'already_invited' },
      ],
    });
    render(<InviteMembersForm />);

    await send(user, 'ben@acme.test,cara@acme.test,ben@acme.test');

    expect(inviteMembers).toHaveBeenCalledWith([
      'ben@acme.test',
      'cara@acme.test',
    ]);
    const list = screen.getByRole('list', { name: 'What happened' });
    expect(list).toHaveTextContent('ben@acme.testInvitation sent');
    expect(list).toHaveTextContent(
      'cara@acme.testalready has a pending Invitation',
    );
    expect(box()).toHaveValue('');
  });

  it('keeps an address whose email could not go out, to send again', async () => {
    const user = userEvent.setup();
    inviteMembers.mockResolvedValue({
      results: [
        { email: 'ben@acme.test', outcome: 'invited' },
        { email: 'cara@acme.test', outcome: 'failed' },
      ],
    });
    render(<InviteMembersForm />);

    await send(user, 'ben@acme.test, cara@acme.test');

    expect(box()).toHaveValue('cara@acme.test');
  });

  it('shows why the whole send was refused, and keeps what was typed', async () => {
    const user = userEvent.setup();
    inviteMembers.mockResolvedValue({
      formError: 'Only the Owner and Admins can invite teammates.',
    });
    render(<InviteMembersForm />);

    await send(user, 'ben@acme.test');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Only the Owner and Admins can invite teammates.',
    );
    expect(box()).toHaveValue('ben@acme.test');
  });
});

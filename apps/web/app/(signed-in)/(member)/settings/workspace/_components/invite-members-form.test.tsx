import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InviteMembersState } from '@/app/(signed-in)/(member)/settings/workspace/_lib/invite-members-state.type';
import type { Invitee } from '@/lib/invitations/invite-emails.util';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';

const inviteMembers =
  vi.fn<
    (
      workspaceId: string,
      invitations: readonly Invitee[],
    ) => Promise<InviteMembersState>
  >();
vi.mock(
  '@/app/(signed-in)/(member)/settings/workspace/_lib/invitation-actions.service',
  () => ({
    inviteMembers: (workspaceId: string, invitations: readonly Invitee[]) =>
      inviteMembers(workspaceId, invitations),
  }),
);

const { InviteMembersForm } = await import('./invite-members-form');

type User = ReturnType<typeof userEvent.setup>;

function sendButton() {
  return screen.getByRole('button', { name: 'Send invites' });
}

async function pick(user: User, select: string, option: string) {
  await user.click(screen.getByRole('combobox', { name: select }));
  await user.click(screen.getByRole('option', { name: option }));
}

describe('InviteMembersForm', () => {
  beforeEach(() => {
    inviteMembers.mockReset();
  });

  it('opens on One by one, with Paste a list beside it', () => {
    render(<InviteMembersForm workspaceId={WORKSPACE_ID} />);

    expect(screen.getByRole('tab', { name: 'One by one' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Paste a list' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });
});

describe('inviting one by one', () => {
  beforeEach(() => {
    inviteMembers.mockReset();
  });

  function emailField(position: number) {
    return screen.getByRole('textbox', { name: `Email address ${position}` });
  }

  it('sends each person with the Role picked beside them, Member unless changed', async () => {
    const user = userEvent.setup();
    inviteMembers.mockResolvedValue({
      results: [
        { email: 'ben@acme.test', outcome: 'invited' },
        { email: 'cara@acme.test', outcome: 'invited' },
      ],
    });
    render(<InviteMembersForm workspaceId={WORKSPACE_ID} />);
    await user.type(emailField(1), 'ben@acme.test');
    await user.click(screen.getByRole('button', { name: 'Add another' }));
    await user.type(emailField(2), 'cara@acme.test');
    await pick(user, 'Role for email address 2', 'Admin');

    await user.click(sendButton());

    expect(inviteMembers).toHaveBeenCalledWith(WORKSPACE_ID, [
      { email: 'ben@acme.test', role: 'MEMBER' },
      { email: 'cara@acme.test', role: 'ADMIN' },
    ]);
    expect(
      screen.getByRole('list', { name: 'What happened' }),
    ).toHaveTextContent('ben@acme.testInvitation sent');
  });

  it('flags a field that is not an address, and sends nothing', async () => {
    const user = userEvent.setup();
    render(<InviteMembersForm workspaceId={WORKSPACE_ID} />);
    await user.type(emailField(1), 'cara');

    await user.click(sendButton());

    expect(emailField(1)).toHaveAccessibleDescription(
      'Enter a valid email address.',
    );
    expect(inviteMembers).not.toHaveBeenCalled();
  });

  it('keeps an address whose email could not go out, with its Role, to send again', async () => {
    const user = userEvent.setup();
    inviteMembers.mockResolvedValue({
      results: [{ email: 'cara@acme.test', outcome: 'failed' }],
    });
    render(<InviteMembersForm workspaceId={WORKSPACE_ID} />);
    await user.type(emailField(1), 'cara@acme.test');
    await pick(user, 'Role for email address 1', 'Admin');

    await user.click(sendButton());

    expect(
      await screen.findByDisplayValue('cara@acme.test'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Role for email address 1' }),
    ).toHaveTextContent('Admin');
  });
});

describe('inviting from a pasted list', () => {
  beforeEach(() => {
    inviteMembers.mockReset();
  });

  async function openList(user: User) {
    render(<InviteMembersForm workspaceId={WORKSPACE_ID} />);
    await user.click(screen.getByRole('tab', { name: 'Paste a list' }));
  }

  function box() {
    return screen.getByRole('textbox', { name: /Email addresses/ });
  }

  async function send(user: User, text: string) {
    await user.type(box(), text);
    await user.click(sendButton());
  }

  it('names what is not an address, and sends nothing', async () => {
    const user = userEvent.setup();
    await openList(user);

    await send(user, 'ben@acme.test, cara');

    expect(screen.getByText('Not an email address: cara')).toBeInTheDocument();
    expect(box()).toHaveFocus();
    expect(inviteMembers).not.toHaveBeenCalled();
  });

  it('asks for an address when the box is empty', async () => {
    const user = userEvent.setup();
    await openList(user);

    await user.click(sendButton());

    expect(
      screen.getByText('Add at least one email address.'),
    ).toBeInTheDocument();
    expect(inviteMembers).not.toHaveBeenCalled();
  });

  it('refuses more than ten at once', async () => {
    const user = userEvent.setup();
    await openList(user);

    await send(
      user,
      Array.from({ length: 11 }, (_, i) => `p${i}@acme.test`).join(','),
    );

    expect(
      screen.getByText('You can invite up to 10 people at a time.'),
    ).toBeInTheDocument();
    expect(inviteMembers).not.toHaveBeenCalled();
  });

  it('sends each address once as a Member, and says what happened to each', async () => {
    const user = userEvent.setup();
    inviteMembers.mockResolvedValue({
      results: [
        { email: 'ben@acme.test', outcome: 'invited' },
        { email: 'cara@acme.test', outcome: 'already_invited' },
      ],
    });
    await openList(user);

    await send(user, 'ben@acme.test,cara@acme.test,ben@acme.test');

    expect(inviteMembers).toHaveBeenCalledWith(WORKSPACE_ID, [
      { email: 'ben@acme.test', role: 'MEMBER' },
      { email: 'cara@acme.test', role: 'MEMBER' },
    ]);
    const list = screen.getByRole('list', { name: 'What happened' });
    expect(list).toHaveTextContent('ben@acme.testInvitation sent');
    expect(list).toHaveTextContent(
      'cara@acme.testalready has a pending Invitation',
    );
    expect(box()).toHaveValue('');
  });

  it('sends everyone with the one Role picked for the list', async () => {
    const user = userEvent.setup();
    inviteMembers.mockResolvedValue({ results: [] });
    await openList(user);
    await pick(user, 'Role for everyone', 'Admin');

    await send(user, 'ben@acme.test, cara@acme.test');

    expect(inviteMembers).toHaveBeenCalledWith(WORKSPACE_ID, [
      { email: 'ben@acme.test', role: 'ADMIN' },
      { email: 'cara@acme.test', role: 'ADMIN' },
    ]);
  });

  it('keeps an address whose email could not go out, to send again', async () => {
    const user = userEvent.setup();
    inviteMembers.mockResolvedValue({
      results: [
        { email: 'ben@acme.test', outcome: 'invited' },
        { email: 'cara@acme.test', outcome: 'failed' },
      ],
    });
    await openList(user);

    await send(user, 'ben@acme.test, cara@acme.test');

    expect(box()).toHaveValue('cara@acme.test');
  });

  it('shows why the whole send was refused, and keeps what was typed', async () => {
    const user = userEvent.setup();
    inviteMembers.mockResolvedValue({
      formError: 'Only Admins can invite teammates.',
    });
    await openList(user);

    await send(user, 'ben@acme.test');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Only Admins can invite teammates.',
    );
    expect(box()).toHaveValue('ben@acme.test');
  });
});

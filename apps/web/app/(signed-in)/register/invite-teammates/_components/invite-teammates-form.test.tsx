import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  InviteResult,
  SendInvitationsState,
} from '@/app/(signed-in)/register/invite-teammates/_lib/invite-teammates-state.type';
import { InviteTeammatesForm } from './invite-teammates-form';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const sendInvitations =
  vi.fn<(emails: readonly string[]) => Promise<SendInvitationsState>>();
vi.mock(
  '@/app/(signed-in)/register/invite-teammates/_lib/invitation-actions.service',
  () => ({
    sendInvitations: (emails: readonly string[]) => sendInvitations(emails),
  }),
);

/** The API answers each address with the outcome the test names, `invited` by default. */
function apiAnswers(outcomes: Record<string, InviteResult['outcome']> = {}) {
  sendInvitations.mockImplementation(async (emails) => ({
    results: emails.map((email) => ({
      email: email.toLowerCase(),
      outcome: outcomes[email.toLowerCase()] ?? 'invited',
    })),
  }));
}

function emailField(position: number) {
  return screen.getByRole('textbox', { name: `Email address ${position}` });
}

function emailFields() {
  return screen.getAllByRole('textbox', { name: /^Email address \d+$/ });
}

function button(name: string) {
  return screen.getByRole('button', { name });
}

describe('InviteTeammatesForm', () => {
  beforeEach(() => {
    push.mockClear();
    sendInvitations.mockReset();
    apiAnswers();
  });

  it('opens with one empty Email address field', () => {
    render(<InviteTeammatesForm />);

    expect(emailFields()).toHaveLength(1);
    expect(emailField(1)).toHaveValue('');
  });

  it('adds one more field with Add another, and focuses it', async () => {
    const user = userEvent.setup();
    render(<InviteTeammatesForm />);

    await user.click(button('Add another'));

    expect(emailFields()).toHaveLength(2);
    expect(emailField(2)).toHaveFocus();
  });

  it('removes any field, moving focus to the one that takes its place', async () => {
    const user = userEvent.setup();
    render(<InviteTeammatesForm />);
    await user.type(emailField(1), 'pepper@stark.com');
    await user.click(button('Add another'));
    await user.type(emailField(2), 'happy@stark.com');

    await user.click(button('Remove email address 1'));

    expect(emailFields()).toHaveLength(1);
    expect(emailField(1)).toHaveValue('happy@stark.com');
    expect(emailField(1)).toHaveFocus();
  });

  it('keeps the last field', () => {
    render(<InviteTeammatesForm />);

    expect(
      screen.queryByRole('button', { name: /^Remove/ }),
    ).not.toBeInTheDocument();
  });

  it('flags a malformed address under its field, sends nothing and focuses it', async () => {
    const user = userEvent.setup();
    render(<InviteTeammatesForm />);
    await user.type(emailField(1), 'pepper@stark.com');
    await user.click(button('Add another'));
    await user.type(emailField(2), 'happy');

    await user.click(button('Send invites & Done'));

    expect(emailField(1)).not.toHaveAttribute('aria-invalid');
    expect(emailField(2)).toHaveAttribute('aria-invalid', 'true');
    expect(emailField(2)).toHaveAccessibleDescription(
      'Enter a valid email address.',
    );
    expect(emailField(2)).toHaveFocus();
    expect(sendInvitations).not.toHaveBeenCalled();
  });

  it('checks the format as soon as the field is left', async () => {
    const user = userEvent.setup();
    render(<InviteTeammatesForm />);
    await user.type(emailField(1), 'happy');

    expect(emailField(1)).not.toHaveAttribute('aria-invalid');

    await user.tab();

    expect(emailField(1)).toHaveAttribute('aria-invalid', 'true');
    expect(emailField(1)).toHaveAccessibleDescription(
      'Enter a valid email address.',
    );
  });

  it('does not flag an empty field when it is left', async () => {
    const user = userEvent.setup();
    render(<InviteTeammatesForm />);

    await user.click(emailField(1));
    await user.tab();

    expect(emailField(1)).not.toHaveAttribute('aria-invalid');
  });

  it('clears a field’s flag once it is edited', async () => {
    const user = userEvent.setup();
    render(<InviteTeammatesForm />);
    await user.type(emailField(1), 'happy');
    await user.click(button('Send invites & Done'));

    await user.type(emailField(1), '@stark.com');

    expect(emailField(1)).not.toHaveAttribute('aria-invalid');
  });

  it('disables Send invites & Done until a field holds an address', async () => {
    const user = userEvent.setup();
    render(<InviteTeammatesForm />);

    expect(button('Send invites & Done')).toBeDisabled();

    await user.type(emailField(1), '   ');
    expect(button('Send invites & Done')).toBeDisabled();

    await user.type(emailField(1), 'pepper@stark.com');
    expect(button('Send invites & Done')).toBeEnabled();

    await user.clear(emailField(1));
    expect(button('Send invites & Done')).toBeDisabled();
  });

  it('sends each address once, ignoring empty fields, then lists what happened to each', async () => {
    const user = userEvent.setup();
    apiAnswers({ 'happy@stark.com': 'already_member' });
    render(<InviteTeammatesForm />);
    await user.type(emailField(1), 'pepper@stark.com');
    await user.click(button('Add another'));
    await user.click(button('Add another'));
    await user.type(emailField(3), 'PEPPER@stark.com');
    await user.click(button('Add another'));
    await user.type(emailField(4), 'happy@stark.com');

    await user.click(button('Send invites & Done'));

    expect(sendInvitations).toHaveBeenCalledWith([
      'pepper@stark.com',
      'happy@stark.com',
    ]);
    const heading = await screen.findByRole('heading', { name: 'Invitations' });
    expect(heading).toHaveFocus();
    expect(screen.getByText('Invitation sent')).toBeInTheDocument();
    expect(
      screen.getByText('is already in this Workspace'),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('goes Home on Continue once the Invitations are sent', async () => {
    const user = userEvent.setup();
    render(<InviteTeammatesForm />);
    await user.type(emailField(1), 'pepper@stark.com');
    await user.click(button('Send invites & Done'));

    await user.click(await screen.findByRole('button', { name: 'Continue' }));

    expect(push).toHaveBeenCalledWith('/home');
  });

  it('keeps only the addresses that could not be sent, flagged, so sending again retries just those', async () => {
    const user = userEvent.setup();
    apiAnswers({ 'happy@stark.com': 'failed' });
    render(<InviteTeammatesForm />);
    await user.type(emailField(1), 'pepper@stark.com');
    await user.click(button('Add another'));
    await user.type(emailField(2), 'happy@stark.com');

    await user.click(button('Send invites & Done'));

    expect(
      await screen.findByDisplayValue('happy@stark.com'),
    ).toBeInTheDocument();
    expect(emailFields()).toHaveLength(1);
    expect(emailField(1)).toHaveAccessibleDescription(
      "Couldn't send. Try again.",
    );
    expect(emailField(1)).toHaveFocus();

    apiAnswers();
    await user.click(button('Send invites & Done'));

    expect(sendInvitations).toHaveBeenLastCalledWith(['happy@stark.com']);
    expect(
      await screen.findByRole('heading', { name: 'Invitations' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Invitation sent')).toHaveLength(2);
  });

  it('says why when the whole send is refused', async () => {
    const user = userEvent.setup();
    sendInvitations.mockResolvedValue({
      formError: 'Only the Owner and Admins can invite teammates.',
    });
    render(<InviteTeammatesForm />);
    await user.type(emailField(1), 'pepper@stark.com');

    await user.click(button('Send invites & Done'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Only the Owner and Admins can invite teammates.',
    );
    expect(emailField(1)).toHaveValue('pepper@stark.com');
  });

  it('stops offering another field at ten, and says more can be invited from Settings', async () => {
    const user = userEvent.setup();
    render(<InviteTeammatesForm />);

    for (let added = 1; added < 10; added++) {
      await user.click(button('Add another'));
    }

    expect(emailFields()).toHaveLength(10);
    expect(
      screen.queryByRole('button', { name: 'Add another' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'You can invite up to 10 now — invite more anytime from Settings.',
      ),
    ).toBeInTheDocument();
  });

  it('goes Home on Skip & Done', async () => {
    const user = userEvent.setup();
    render(<InviteTeammatesForm />);

    await user.click(button('Skip & Done'));

    expect(push).toHaveBeenCalledWith('/home');
  });
});

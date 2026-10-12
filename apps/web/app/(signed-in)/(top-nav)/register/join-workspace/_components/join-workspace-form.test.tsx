import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InvitationChoice } from '@/app/(signed-in)/(top-nav)/register/join-workspace/_lib/invitation-choice.util';
import type { JoinWorkspaceState } from '@/app/(signed-in)/(top-nav)/register/join-workspace/_lib/join-workspace-state.type';
import { JoinWorkspaceForm } from './join-workspace-form';

const acceptInvitation =
  vi.fn<
    (
      previous: JoinWorkspaceState,
      formData: FormData,
    ) => Promise<JoinWorkspaceState>
  >();
vi.mock(
  '@/app/(signed-in)/(top-nav)/register/join-workspace/_lib/invitation-actions.service',
  () => ({
    acceptInvitation: (previous: JoinWorkspaceState, formData: FormData) =>
      acceptInvitation(previous, formData),
  }),
);

beforeEach(() => {
  acceptInvitation.mockReset();
});

const ACME: InvitationChoice = {
  invitationId: '0199a0f0-0000-7000-8000-000000000001',
  workspaceName: 'Acme',
  initial: 'A',
  detail: '3 members · Invited 2 days ago',
};
const GLOBEX: InvitationChoice = {
  invitationId: '0199a0f0-0000-7000-8000-000000000002',
  workspaceName: 'Globex',
  initial: 'G',
  detail: '1 member · Invited today',
};

describe('JoinWorkspaceForm', () => {
  it('offers each Workspace with its size and when the Invitation came', () => {
    render(<JoinWorkspaceForm choices={[ACME, GLOBEX]} />);

    expect(
      screen.getByRole('radio', { name: 'Acme' }),
    ).toHaveAccessibleDescription('3 members · Invited 2 days ago');
    expect(screen.getByRole('radio', { name: 'Globex' })).toBeInTheDocument();
  });

  it('keeps Join disabled until a Workspace is chosen', async () => {
    const user = userEvent.setup();
    render(<JoinWorkspaceForm choices={[ACME, GLOBEX]} />);
    const join = screen.getByRole('button', { name: 'Join' });

    expect(join).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: 'Globex' }));
    expect(join).toBeEnabled();
  });

  it('lets only one Workspace be chosen', async () => {
    const user = userEvent.setup();
    render(<JoinWorkspaceForm choices={[ACME, GLOBEX]} />);

    await user.click(screen.getByRole('radio', { name: 'Acme' }));
    await user.click(screen.getByRole('radio', { name: 'Globex' }));

    expect(screen.getByRole('radio', { name: 'Acme' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Globex' })).toBeChecked();
  });

  it('starts with the only Invitation chosen', () => {
    render(<JoinWorkspaceForm choices={[ACME]} />);

    expect(screen.getByRole('radio', { name: 'Acme' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Join' })).toBeEnabled();
  });

  it('joins the chosen Workspace', async () => {
    acceptInvitation.mockResolvedValue({});
    const user = userEvent.setup();
    render(<JoinWorkspaceForm choices={[ACME, GLOBEX]} />);

    await user.click(screen.getByRole('radio', { name: 'Globex' }));
    await user.click(screen.getByRole('button', { name: 'Join' }));

    expect(acceptInvitation.mock.calls[0]?.[1].get('invitationId')).toBe(
      GLOBEX.invitationId,
    );
  });

  it('says so when the chosen Invitation is no longer Pending', async () => {
    acceptInvitation.mockResolvedValue({ refusal: 'noLongerPending' });
    const user = userEvent.setup();
    render(<JoinWorkspaceForm choices={[ACME]} />);

    await user.click(screen.getByRole('button', { name: 'Join' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That Invitation is no longer available.',
    );
  });

  it('forgets a choice that left the list after it was read again', () => {
    const { rerender } = render(<JoinWorkspaceForm choices={[ACME]} />);

    rerender(<JoinWorkspaceForm choices={[GLOBEX]} />);

    expect(screen.getByRole('radio', { name: 'Globex' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Join' })).toBeDisabled();
  });

  it('offers creating a new Workspace instead', () => {
    render(<JoinWorkspaceForm choices={[ACME]} />);

    expect(
      screen.getByRole('link', { name: 'No, create a new Workspace' }),
    ).toHaveAttribute('href', '/register/create-workspace');
  });
});

import { describe, expect, it } from 'bun:test';
import { FakeClock } from '@test/support/clock.fake';
import {
  FakeInvitationQuery,
  FakeProfileNamePort,
} from '@test/support/workspace.fakes';
import type { InvitationStatusValue } from '../../domain/value-object/invitation-status.vo';
import { InvitationNotFoundError } from '../workspace.errors';
import { GetInvitationUseCase } from './get-invitation.use-case';

const INVITATION_ID = '0199a0f0-0000-7000-8000-000000000001';
const NOW = new Date('2026-10-10T03:00:00Z');

function setUp(status: InvitationStatusValue = 'PENDING') {
  const invitationQuery = new FakeInvitationQuery();
  invitationQuery.details.set(INVITATION_ID, {
    invitationId: INVITATION_ID,
    workspace: { id: '0199a0f0-0000-7000-8000-0000000000aa', name: 'Acme' },
    inviterAccountId: 'account-ann',
    email: 'somchai@acme.co',
    status,
  });
  const profileNamePort = new FakeProfileNamePort();
  const useCase = new GetInvitationUseCase(
    invitationQuery,
    profileNamePort,
    new FakeClock(NOW),
  );
  return { profileNamePort, useCase };
}

describe('reading an Invitation from its link', () => {
  it('names the Workspace and the inviter, and masks the invited address', async () => {
    const { profileNamePort, useCase } = setUp();
    profileNamePort.fullNames.set('account-ann', 'Ann Lee');

    expect(await useCase.execute({ invitationId: INVITATION_ID })).toEqual({
      workspaceName: 'Acme',
      inviterName: 'Ann Lee',
      invitedEmailMasked: 's•••@acme.co',
      status: 'PENDING',
    });
  });

  it('answers no inviter name while the inviter has not introduced themselves', async () => {
    const { useCase } = setUp();

    const invitation = await useCase.execute({ invitationId: INVITATION_ID });

    expect(invitation.inviterName).toBeNull();
  });

  it('says when the Invitation can no longer be accepted', async () => {
    const { useCase } = setUp('REVOKED');

    const invitation = await useCase.execute({ invitationId: INVITATION_ID });

    expect(invitation.status).toBe('REVOKED');
  });

  it('is refused for an id no Invitation has', async () => {
    const { useCase } = setUp();

    await expect(
      useCase.execute({ invitationId: '0199a0f0-0000-7000-8000-00000000ffff' }),
    ).rejects.toThrow(InvitationNotFoundError);
  });
});

import { describe, expect, it } from 'bun:test';
import { WebConfig } from '@app/config/configuration';
import { FakeClock } from '@test/support/clock.fake';
import { FakeEmailSender } from '@test/support/email-sender.fake';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import {
  FakeAccountByEmailPort,
  FakeInvitationQuery,
  FakeMembershipQuery,
  FakeProfileNamePort,
  FakeWorkspaceInviting,
} from '@test/support/workspace.fakes';
import type { InvitationStatusValue } from '../../domain/value-object/invitation-status.vo';
import type { MemberRoleValue } from '../../domain/value-object/member-role.vo';
import {
  InvitationAlreadyAcceptedError,
  InvitationResentTooSoonError,
} from '../../domain/workspace.errors';
import { InvitationDelivery } from '../service/invitation-delivery.service';
import { ReturningMembers } from '../service/returning-members.service';
import {
  AlreadyAMemberError,
  InvitationNotFoundError,
  NotAllowedToResendInvitationsError,
} from '../workspace.errors';
import { ResendInvitationUseCase } from './resend-invitation.use-case';

const INVITATION_ID = '0199a0f0-0000-7000-8000-000000000001';
const NEW_INVITATION_ID = '0199a0f0-0000-7000-8000-000000000002';
const ACME = { id: '0199a0f0-0000-7000-8000-0000000000aa', name: 'Acme' };
const OTHER = { id: '0199a0f0-0000-7000-8000-0000000000bb', name: 'Other' };
const ANN_COOKIE = 'thrive.session_token=ann';
const NOW = new Date('2026-10-10T03:00:00Z');
const AN_HOUR_AGO = new Date('2026-10-10T02:00:00Z');
const A_MINUTE_AGO = new Date('2026-10-10T02:59:00Z');
const NEXT_WEEK = new Date('2026-10-17T03:00:00Z');
const SOMCHAI = 'somchai@acme.co';

function setUp(
  options: {
    status?: InvitationStatusValue;
    workspace?: { id: string; name: string };
    lastSentAt?: Date;
    role?: MemberRoleValue;
  } = {},
) {
  const status = options.status ?? 'PENDING';
  const workspaceInviting = new FakeWorkspaceInviting(
    NEXT_WEEK,
    NEW_INVITATION_ID,
  );
  workspaceInviting.pending.set(INVITATION_ID, SOMCHAI);
  if (status === 'EXPIRED') {
    workspaceInviting.expired.add(INVITATION_ID);
  }
  const invitationQuery = new FakeInvitationQuery();
  invitationQuery.details.set(INVITATION_ID, {
    invitationId: INVITATION_ID,
    workspace: options.workspace ?? ACME,
    inviterAccountId: 'account-ann',
    email: SOMCHAI,
    role: options.role ?? 'MEMBER',
    status,
    lastSentAt: options.lastSentAt ?? AN_HOUR_AGO,
  });
  const emailSender = new FakeEmailSender();
  const profileNamePort = new FakeProfileNamePort();
  profileNamePort.displayNames.set('account-ann', 'Ann');
  const clock = new FakeClock(NOW);
  const accountByEmailPort = new FakeAccountByEmailPort();
  const membershipQuery = new FakeMembershipQuery();
  const useCase = new ResendInvitationUseCase(
    workspaceInviting,
    invitationQuery,
    new InvitationDelivery(
      emailSender,
      profileNamePort,
      clock,
      new WebConfig('https://thrive.test'),
    ),
    new ReturningMembers(accountByEmailPort, membershipQuery),
    new FakeUnitOfWork(),
    clock,
  );
  return {
    workspaceInviting,
    accountByEmailPort,
    membershipQuery,
    emailSender,
    useCase,
  };
}

function resend(role: MemberRoleValue = 'ADMIN') {
  return {
    accountId: 'account-ann',
    resenderEmail: 'ann@acme.co',
    credential: ANN_COOKIE,
    membership: { workspace: ACME, role },
    invitationId: INVITATION_ID,
  };
}

describe('resending a Pending Invitation', () => {
  it('lets an Admin send it again, extending the same Invitation', async () => {
    const { workspaceInviting, emailSender, useCase } = setUp();

    const resent = await useCase.execute(resend('ADMIN'));

    expect(resent).toEqual({
      invitationId: INVITATION_ID,
      expiresAt: NEXT_WEEK,
    });
    expect(emailSender.sent).toHaveLength(1);
    expect(emailSender.sent[0]).toMatchObject({
      to: SOMCHAI,
      fromName: 'Ann',
      replyTo: 'ann@acme.co',
    });
    expect(emailSender.sent[0]?.text).toContain(
      `https://thrive.test/invitations/${INVITATION_ID}`,
    );
    expect(workspaceInviting.revoked).toEqual([]);
  });

  it('sends it again with the Role it was first sent with', async () => {
    const { workspaceInviting, useCase } = setUp({ role: 'ADMIN' });

    await useCase.execute(resend());

    expect(workspaceInviting.reissues.map((r) => r.role)).toEqual(['ADMIN']);
  });

  it('records the send, so the cooldown starts again', async () => {
    const { workspaceInviting, useCase } = setUp();

    await useCase.execute(resend());

    expect(workspaceInviting.sentAt.get(INVITATION_ID)).toEqual(NOW);
  });

  it('keys the email to this send, so the transport never takes it for a retry of the last', async () => {
    const { emailSender, useCase } = setUp();

    await useCase.execute(resend());

    expect(emailSender.sent[0]?.idempotencyKey).toBe(
      `${INVITATION_ID}:${NOW.toISOString()}`,
    );
  });
});

describe('resending a Pending Invitation whose email does not go out', () => {
  it('puts back when it was last sent, so the cooldown does not hold it back', async () => {
    const { workspaceInviting, emailSender, useCase } = setUp();
    emailSender.failingFor.add(SOMCHAI);

    await expect(useCase.execute(resend())).rejects.toThrow();
    expect(workspaceInviting.sentAt.get(INVITATION_ID)).toEqual(AN_HOUR_AGO);
    expect(workspaceInviting.revoked).toEqual([]);
  });
});

describe('resending an expired Invitation', () => {
  it('sends a new Invitation and revokes the expired one', async () => {
    const { workspaceInviting, emailSender, useCase } = setUp({
      status: 'EXPIRED',
    });

    const resent = await useCase.execute(resend());

    expect(resent.invitationId).toBe(NEW_INVITATION_ID);
    expect(emailSender.sent[0]?.text).toContain(
      `https://thrive.test/invitations/${NEW_INVITATION_ID}`,
    );
    expect(workspaceInviting.revoked).toEqual([
      { credential: ANN_COOKIE, invitationId: INVITATION_ID },
    ]);
  });

  it('still answers the new Invitation when the expired one cannot be revoked, since its email went out', async () => {
    const { workspaceInviting, emailSender, useCase } = setUp({
      status: 'EXPIRED',
    });
    workspaceInviting.revokeFailsFor.add(INVITATION_ID);

    const resent = await useCase.execute(resend());

    expect(resent.invitationId).toBe(NEW_INVITATION_ID);
    expect(emailSender.sent).toHaveLength(1);
  });

  it('keeps the expired one, and revokes the new one, when the email does not go out', async () => {
    const { workspaceInviting, emailSender, useCase } = setUp({
      status: 'EXPIRED',
    });
    emailSender.failingFor.add(SOMCHAI);

    await expect(useCase.execute(resend())).rejects.toThrow();
    expect(workspaceInviting.revoked).toEqual([
      { credential: ANN_COOKIE, invitationId: NEW_INVITATION_ID },
    ]);
  });
});

describe('refusing to resend an Invitation', () => {
  it('refuses a Member with no management rights', async () => {
    const { emailSender, useCase } = setUp();

    await expect(useCase.execute(resend('MEMBER'))).rejects.toThrow(
      NotAllowedToResendInvitationsError,
    );
    expect(emailSender.sent).toEqual([]);
  });

  it("answers another Workspace's Invitation as not found", async () => {
    const { emailSender, useCase } = setUp({ workspace: OTHER });

    await expect(useCase.execute(resend())).rejects.toThrow(
      InvitationNotFoundError,
    );
    expect(emailSender.sent).toEqual([]);
  });

  it('refuses one already accepted', async () => {
    const { useCase } = setUp({ status: 'ACCEPTED' });

    await expect(useCase.execute(resend())).rejects.toThrow(
      InvitationAlreadyAcceptedError,
    );
  });

  it('refuses one whose address has joined the Workspace meanwhile', async () => {
    const { workspaceInviting, emailSender, useCase } = setUp({
      status: 'EXPIRED',
    });
    workspaceInviting.members.add(SOMCHAI);

    await expect(useCase.execute(resend())).rejects.toThrow(
      AlreadyAMemberError,
    );
    expect(emailSender.sent).toEqual([]);
  });

  it('refuses one sent moments ago', async () => {
    const { emailSender, useCase } = setUp({ lastSentAt: A_MINUTE_AGO });

    await expect(useCase.execute(resend())).rejects.toThrow(
      InvitationResentTooSoonError,
    );
    expect(emailSender.sent).toEqual([]);
  });

  it('resends for someone Deactivated in the Workspace as an Invitation back', async () => {
    const { workspaceInviting, accountByEmailPort, membershipQuery, useCase } =
      setUp();
    accountByEmailPort.accounts.push({
      accountId: 'account-somchai',
      email: SOMCHAI,
    });
    membershipQuery.memberships.push({
      accountId: 'account-somchai',
      workspace: ACME,
      role: 'MEMBER',
      deactivatedAt: NOW,
    });

    await useCase.execute(resend());

    expect(workspaceInviting.reissuesBack.map((r) => r.email)).toEqual([
      SOMCHAI,
    ]);
    expect(workspaceInviting.reissues).toEqual([]);
  });
});

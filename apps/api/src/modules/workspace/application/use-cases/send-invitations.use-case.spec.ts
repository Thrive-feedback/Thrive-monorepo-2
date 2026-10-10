import { describe, expect, it } from 'bun:test';
import { WebConfig } from '@app/config/configuration';
import { FakeClock } from '@test/support/clock.fake';
import { FakeEmailSender } from '@test/support/email-sender.fake';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import {
  FakeProfileNamePort,
  FakeWorkspaceInviting,
} from '@test/support/workspace.fakes';
import type { MemberRoleValue } from '../../domain/value-object/member-role.vo';
import { TooManyInvitationsError } from '../../domain/workspace.errors';
import { NotAllowedToInviteError } from '../workspace.errors';
import { SendInvitationsUseCase } from './send-invitations.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const ANN_COOKIE = 'thrive.session_token=ann';
const NOW = new Date('2026-10-10T03:00:00Z');
const EXPIRES_AT = new Date('2026-10-17T03:00:00Z');
const FIRST_INVITATION_ID = '0199a0f0-0000-7000-8000-000000000001';
const SECOND_INVITATION_ID = '0199a0f0-0000-7000-8000-000000000002';

function request(
  overrides: Partial<{ role: MemberRoleValue; emails: string[] }> = {},
) {
  return {
    accountId: 'account-ann',
    inviterEmail: 'ann@acme.co',
    credential: ANN_COOKIE,
    membership: {
      workspace: { id: WORKSPACE_ID, name: 'Acme' },
      role: overrides.role ?? 'OWNER',
    },
    emails: overrides.emails ?? ['ben@acme.co'],
  };
}

function setUp() {
  const workspaceInviting = new FakeWorkspaceInviting(
    EXPIRES_AT,
    FIRST_INVITATION_ID,
    SECOND_INVITATION_ID,
  );
  const emailSender = new FakeEmailSender();
  const profileNamePort = new FakeProfileNamePort();
  profileNamePort.fullNames.set('account-ann', 'Ann Lee');
  const unitOfWork = new FakeUnitOfWork();
  const useCase = new SendInvitationsUseCase(
    workspaceInviting,
    emailSender,
    profileNamePort,
    unitOfWork,
    new FakeClock(NOW),
    new WebConfig('https://thrive.test'),
  );
  return {
    workspaceInviting,
    emailSender,
    profileNamePort,
    unitOfWork,
    useCase,
  };
}

describe('sending Invitations to a Workspace', () => {
  it('lets the Owner invite, and sends the Invitation from them', async () => {
    const { emailSender, useCase } = setUp();

    const outcomes = await useCase.execute(request());

    expect(outcomes).toEqual([
      {
        email: 'ben@acme.co',
        outcome: 'invited',
        invitationId: FIRST_INVITATION_ID,
        expiresAt: EXPIRES_AT,
      },
    ]);
    expect(emailSender.sent).toHaveLength(1);
    expect(emailSender.sent[0]).toMatchObject({
      to: 'ben@acme.co',
      fromName: 'Ann Lee',
      replyTo: 'ann@acme.co',
      subject: 'Ann Lee invited you to join Acme on Thrive',
    });
    expect(emailSender.sent[0]?.text).toContain(
      `https://thrive.test/invitations/${FIRST_INVITATION_ID}`,
    );
  });

  it('lets an Admin invite', async () => {
    const { useCase } = setUp();

    const outcomes = await useCase.execute(request({ role: 'ADMIN' }));

    expect(outcomes.map((o) => o.outcome)).toEqual(['invited']);
  });

  it('refuses a Member with no management rights, and stores and sends nothing', async () => {
    const { workspaceInviting, emailSender, useCase } = setUp();

    await expect(useCase.execute(request({ role: 'MEMBER' }))).rejects.toThrow(
      NotAllowedToInviteError,
    );
    expect(workspaceInviting.requests).toEqual([]);
    expect(emailSender.sent).toEqual([]);
  });

  it('answers each address on its own, in the order they were sent', async () => {
    const { workspaceInviting, useCase } = setUp();
    workspaceInviting.members.add('cat@acme.co');
    workspaceInviting.pending.set('earlier', 'dan@acme.co');

    const outcomes = await useCase.execute(
      request({ emails: ['ben@acme.co', 'cat@acme.co', 'dan@acme.co'] }),
    );

    expect(outcomes.map((o) => [o.email, o.outcome])).toEqual([
      ['ben@acme.co', 'invited'],
      ['cat@acme.co', 'already_member'],
      ['dan@acme.co', 'already_invited'],
    ]);
  });

  it('emails only the addresses it actually invited', async () => {
    const { workspaceInviting, emailSender, useCase } = setUp();
    workspaceInviting.members.add('cat@acme.co');

    await useCase.execute(request({ emails: ['ben@acme.co', 'cat@acme.co'] }));

    expect(emailSender.sent.map((m) => m.to)).toEqual(['ben@acme.co']);
  });

  it('revokes an Invitation whose email did not go out, and reports it failed', async () => {
    const { workspaceInviting, emailSender, useCase } = setUp();
    emailSender.failingFor.add('cat@acme.co');

    const outcomes = await useCase.execute(
      request({ emails: ['ben@acme.co', 'cat@acme.co'] }),
    );

    expect(outcomes.map((o) => [o.email, o.outcome])).toEqual([
      ['ben@acme.co', 'invited'],
      ['cat@acme.co', 'failed'],
    ]);
    expect(workspaceInviting.revoked).toEqual([
      { credential: ANN_COOKIE, invitationId: SECOND_INVITATION_ID },
    ]);
  });

  it('invites one mailbox once, however it was written', async () => {
    const { workspaceInviting, useCase } = setUp();

    await useCase.execute(request({ emails: ['Ben@Acme.co', ' ben@acme.co'] }));

    expect(workspaceInviting.requests.map((r) => r.email)).toEqual([
      'ben@acme.co',
    ]);
  });

  it('refuses more than ten people in one send', async () => {
    const { useCase } = setUp();
    const eleven = Array.from({ length: 11 }, (_, i) => `t${i}@acme.co`);

    await expect(useCase.execute(request({ emails: eleven }))).rejects.toThrow(
      TooManyInvitationsError,
    );
  });

  it('stores the Invitations serialized on the Workspace, on the inviter session', async () => {
    const { workspaceInviting, unitOfWork, useCase } = setUp();

    await useCase.execute(request());

    expect(unitOfWork.opened).toEqual([
      { serializeOn: `workspace-invitations:${WORKSPACE_ID}` },
    ]);
    expect(workspaceInviting.requests).toEqual([
      {
        credential: ANN_COOKIE,
        workspaceId: WORKSPACE_ID,
        email: 'ben@acme.co',
      },
    ]);
  });

  it('still answers an address failed when its Invitation cannot be revoked either', async () => {
    const { workspaceInviting, emailSender, useCase } = setUp();
    emailSender.failingFor.add('cat@acme.co');
    workspaceInviting.revokeFails = true;

    const outcomes = await useCase.execute(
      request({ emails: ['ben@acme.co', 'cat@acme.co'] }),
    );

    expect(outcomes.map((o) => [o.email, o.outcome])).toEqual([
      ['ben@acme.co', 'invited'],
      ['cat@acme.co', 'failed'],
    ]);
  });

  it('names the inviter by their email when they have no Profile', async () => {
    const { emailSender, profileNamePort, useCase } = setUp();
    profileNamePort.fullNames.clear();

    await useCase.execute(request());

    expect(emailSender.sent[0]).toMatchObject({
      fromName: 'ann@acme.co',
      subject: 'ann@acme.co invited you to join Acme on Thrive',
    });
  });
});

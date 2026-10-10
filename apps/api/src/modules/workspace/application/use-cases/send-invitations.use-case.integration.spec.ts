import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { PrismaUnitOfWork } from '@app/infrastructure/database/prisma-unit-of-work.adapter';
import { SystemClock } from '@app/infrastructure/system-clock.adapter';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { FakeEmailSender } from '@test/support/email-sender.fake';
import { FakeProfileNamePort } from '@test/support/workspace.fakes';
import {
  type SignedInAccount,
  WorkspaceFixtures,
} from '@test/support/workspace.integration-fixtures';
import { BetterAuthWorkspaceInvitingAdapter } from '../../infrastructure/adapter/better-auth-workspace-inviting.adapter';
import { PrismaMembershipQuery } from '../../infrastructure/query/prisma-membership.query';
import {
  NotAllowedToInviteError,
  WorkspaceNotFoundError,
} from '../workspace.errors';
import { ResolveMembershipUseCase } from './resolve-membership.use-case';
import { SendInvitationsUseCase } from './send-invitations.use-case';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const prismaTransactionContext = new PrismaTransactionContext(prismaService);
const auth = createAuth(
  prismaService,
  configuration.auth,
  new UuidIdGenerator(),
);
const emailSender = new FakeEmailSender();
const sendInvitationsUseCase = new SendInvitationsUseCase(
  new BetterAuthWorkspaceInvitingAdapter(auth),
  emailSender,
  new FakeProfileNamePort(),
  new PrismaUnitOfWork(prismaService, prismaTransactionContext),
  new SystemClock(),
  configuration.web,
);
const resolveMembershipUseCase = new ResolveMembershipUseCase(
  new PrismaMembershipQuery(prismaTransactionContext),
);
const fixtures = new WorkspaceFixtures(prismaService, auth, configuration);

afterAll(async () => {
  await fixtures.removeAll();
  await prismaService.$disconnect();
});

/** Invites as `inviter`, resolving their membership the way the route's guard does. */
async function inviteAs(
  inviter: SignedInAccount,
  workspaceId: string,
  emails: string[],
) {
  const membership = await resolveMembershipUseCase.execute({
    accountId: inviter.accountId,
    workspaceId,
  });
  return sendInvitationsUseCase.execute({
    accountId: inviter.accountId,
    inviterEmail: inviter.email,
    credential: inviter.credential,
    membership,
    emails,
  });
}

async function aWorkspaceWith(role: 'admin' | 'member') {
  const owner = await fixtures.aSignedInAccount('invite-owner');
  const workspaceId = await fixtures.aWorkspace(owner);
  const colleague = await fixtures.aSignedInAccount(`invite-${role}`);
  await fixtures.addMember(workspaceId, colleague, role);
  return { owner, workspaceId, colleague };
}

describe('who may invite people into a Workspace', () => {
  it('lets an Admin invite', async () => {
    const { workspaceId, colleague: admin } = await aWorkspaceWith('admin');

    const outcomes = await inviteAs(admin, workspaceId, ['cat@acme.test']);

    expect(outcomes.map((o) => o.outcome)).toEqual(['invited']);
  });

  it('refuses a Member with no management rights, and stores nothing', async () => {
    const { workspaceId, colleague: member } = await aWorkspaceWith('member');

    await expect(
      inviteAs(member, workspaceId, ['cat@acme.test']),
    ).rejects.toThrow(NotAllowedToInviteError);
    expect(
      await prismaService.invitation.count({ where: { workspaceId } }),
    ).toBe(0);
  });

  it('refuses the Owner of one Workspace inviting into another, as not found', async () => {
    const { owner } = await aWorkspaceWith('member');
    const { workspaceId: otherWorkspaceId } = await aWorkspaceWith('member');

    await expect(
      inviteAs(owner, otherWorkspaceId, ['cat@acme.test']),
    ).rejects.toThrow(WorkspaceNotFoundError);
  });
});

describe('inviting from two tabs at once', () => {
  it('leaves one Pending Invitation for an address both name', async () => {
    const { owner, workspaceId } = await aWorkspaceWith('member');

    const results = await Promise.all([
      inviteAs(owner, workspaceId, ['dan@acme.test']),
      inviteAs(owner, workspaceId, ['dan@acme.test']),
    ]);

    expect(
      results
        .flat()
        .map((o) => o.outcome)
        .sort(),
    ).toEqual(['already_invited', 'invited']);
    expect(
      await prismaService.invitation.count({
        where: { workspaceId, email: 'dan@acme.test', status: 'pending' },
      }),
    ).toBe(1);
  });
});

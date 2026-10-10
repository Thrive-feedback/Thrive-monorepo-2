import { describe, expect, it } from 'bun:test';
import type { ExecutionContext } from '@nestjs/common';
import { FakeMembershipQuery } from '@test/support/workspace.fakes';
import { ResolveMembershipUseCase } from '../application/use-cases/resolve-membership.use-case';
import { WorkspaceNotFoundError } from '../application/workspace.errors';
import {
  type MembershipRequest,
  WorkspaceMemberGuard,
} from './workspace-member.guard';

const ACME_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const GLOBEX_ID = '0199a0f0-0000-7000-8000-0000000000bb';

function contextFor(request: Partial<MembershipRequest>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function guard(): WorkspaceMemberGuard {
  const membershipQuery = new FakeMembershipQuery();
  membershipQuery.memberships.push({
    accountId: 'account-ann',
    workspace: { id: ACME_ID, name: 'Acme' },
    role: 'OWNER',
  });
  return new WorkspaceMemberGuard(
    new ResolveMembershipUseCase(membershipQuery),
  );
}

function requestTo(workspaceId: string): Partial<MembershipRequest> {
  return {
    params: { workspaceId },
    actor: { accountId: 'account-ann', email: 'ann@acme.test' },
  };
}

describe('the Workspace member guard', () => {
  it('lets a Member through and hands the route their membership', async () => {
    const request = requestTo(ACME_ID);

    expect(await guard().canActivate(contextFor(request))).toBe(true);
    expect(request.membership).toEqual({
      workspace: { id: ACME_ID, name: 'Acme' },
      role: 'OWNER',
    });
  });

  it('refuses a Workspace the caller is not a Member of, as not found', async () => {
    await expect(
      guard().canActivate(contextFor(requestTo(GLOBEX_ID))),
    ).rejects.toThrow(WorkspaceNotFoundError);
  });

  it('refuses a malformed Workspace id the same way', async () => {
    await expect(
      guard().canActivate(contextFor(requestTo('not-an-id'))),
    ).rejects.toThrow(WorkspaceNotFoundError);
  });
});

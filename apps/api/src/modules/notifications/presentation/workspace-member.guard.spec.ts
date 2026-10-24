import { describe, expect, it } from 'bun:test';
import type { ExecutionContext } from '@nestjs/common';
import { FakeWorkspaceMembershipPort } from '@test/support/feedback.fakes';
import { WorkspaceNotFoundError } from '../application/notifications.errors';
import {
  type WorkspaceAccessRequest,
  WorkspaceMemberGuard,
} from './workspace-member.guard';

const ACME_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const GLOBEX_ID = '0199a0f0-0000-7000-8000-0000000000bb';
const ANN = 'account-ann';
const BEN = 'account-ben';

function contextFor(
  request: Partial<WorkspaceAccessRequest>,
): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

/** Ann is an Admin of Acme, Ben an ordinary Member of it, and neither is in Globex. */
function guard(): WorkspaceMemberGuard {
  return new WorkspaceMemberGuard(
    new FakeWorkspaceMembershipPort()
      .withAdmins(ACME_ID, ANN)
      .with(ACME_ID, BEN),
  );
}

function requestTo(
  workspaceId: string,
  accountId = ANN,
): Partial<WorkspaceAccessRequest> {
  return {
    params: { workspaceId },
    actor: { accountId, email: `${accountId}@acme.test` },
  };
}

describe('the Workspace member guard of Notifications', () => {
  it('lets an ordinary Member through, so they can read their own bell', async () => {
    const request = requestTo(ACME_ID, BEN);

    expect(await guard().canActivate(contextFor(request))).toBe(true);
    expect(request.workspaceAccess).toEqual({ workspaceId: ACME_ID });
  });

  it('says nothing about a Role, because no route here is an Admin’s', async () => {
    const request = requestTo(ACME_ID);

    await guard().canActivate(contextFor(request));

    expect(request.workspaceAccess).toEqual({ workspaceId: ACME_ID });
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

  it('refuses a caller with no session the same way', async () => {
    await expect(
      guard().canActivate(contextFor({ params: { workspaceId: ACME_ID } })),
    ).rejects.toThrow(WorkspaceNotFoundError);
  });
});

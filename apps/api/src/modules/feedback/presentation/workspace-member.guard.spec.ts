import { describe, expect, it } from 'bun:test';
import type { ActorRequest } from '@app/shared/presentation/actor';
import type { ExecutionContext } from '@nestjs/common';
import { FakeWorkspaceMembershipPort } from '@test/support/feedback.fakes';
import { WorkspaceNotFoundError } from '../application/feedback-request.errors';
import { WorkspaceMemberGuard } from './workspace-member.guard';

const ACME_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const GLOBEX_ID = '0199a0f0-0000-7000-8000-0000000000bb';
const ANN = 'account-ann';

function contextFor(request: Partial<ActorRequest>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function guard(): WorkspaceMemberGuard {
  return new WorkspaceMemberGuard(
    new FakeWorkspaceMembershipPort().with(ACME_ID, ANN),
  );
}

function requestTo(
  workspaceId: string,
  signedIn = true,
): Partial<ActorRequest> {
  return {
    params: { workspaceId },
    ...(signedIn && { actor: { accountId: ANN, email: 'ann@acme.test' } }),
  };
}

describe('the guard on Feedback routes', () => {
  it('lets a Member of the Workspace in the path through', async () => {
    expect(await guard().canActivate(contextFor(requestTo(ACME_ID)))).toBe(
      true,
    );
  });

  it('refuses a Member of another Workspace, as if it did not exist', async () => {
    await expect(
      guard().canActivate(contextFor(requestTo(GLOBEX_ID))),
    ).rejects.toThrow(WorkspaceNotFoundError);
  });

  it('refuses a malformed Workspace id the same way, before the store is asked', async () => {
    await expect(
      guard().canActivate(contextFor(requestTo('not-an-id'))),
    ).rejects.toThrow(WorkspaceNotFoundError);
  });

  it('refuses a caller with no session, whatever Workspace they name', async () => {
    await expect(
      guard().canActivate(contextFor(requestTo(ACME_ID, false))),
    ).rejects.toThrow(WorkspaceNotFoundError);
  });
});

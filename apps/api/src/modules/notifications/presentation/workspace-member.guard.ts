import { WorkspaceMembershipPort } from '@app/modules/workspace';
import type { ActorRequest } from '@app/shared/presentation/actor';
import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { z } from 'zod';
import { WorkspaceNotFoundError } from '../application/notifications.errors';

/** What the guard resolved about the caller, for the handler and its use case to read. */
export interface WorkspaceAccess {
  readonly workspaceId: string;
}

export interface WorkspaceAccessRequest extends ActorRequest {
  workspaceAccess?: WorkspaceAccess;
}

const workspaceIdSchema = z.uuid();

/**
 * On a route under `/v1/workspaces/:workspaceId`: refuses anyone who is not a Member of that
 * Workspace. It runs before the validation pipe, so it checks the id itself; a malformed one is
 * just another Workspace the caller is not in.
 *
 * It answers membership and nothing else. No route here is an Admin's — a Member reads and
 * clears their own bell, and nobody else's — so asking whether they are one would be a second
 * query on the read the bell makes every minute, bought for a fact nothing uses.
 *
 * Workspace has a guard doing the membership half, deliberately not reused: a module may reach
 * another only through what it publishes, and Workspace publishes the facts, not the HTTP code
 * that turns one into a refusal (ADR 0037).
 */
@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(
    private readonly workspaceMembershipPort: WorkspaceMembershipPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<WorkspaceAccessRequest>();
    const workspaceId = workspaceIdSchema.safeParse(request.params.workspaceId);
    if (!request.actor || !workspaceId.success) {
      throw new WorkspaceNotFoundError();
    }
    const isMember = await this.workspaceMembershipPort.isMemberOf({
      workspaceId: workspaceId.data,
      accountId: request.actor.accountId,
    });
    if (!isMember) {
      throw new WorkspaceNotFoundError();
    }
    request.workspaceAccess = { workspaceId: workspaceId.data };
    return true;
  }
}

/**
 * The caller's access to the Workspace in the path. Only on a route behind
 * {@link WorkspaceMemberGuard}, which has already refused anyone who is not a Member there.
 */
export const CurrentWorkspaceAccess = createParamDecorator(
  (_data: unknown, context: ExecutionContext): WorkspaceAccess => {
    const { workspaceAccess } = context
      .switchToHttp()
      .getRequest<WorkspaceAccessRequest>();
    if (!workspaceAccess) {
      throw new Error(
        'CurrentWorkspaceAccess was read on a route WorkspaceMemberGuard did not check.',
      );
    }
    return workspaceAccess;
  },
);

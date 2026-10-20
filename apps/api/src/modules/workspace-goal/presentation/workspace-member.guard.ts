import { WorkspaceMembershipPort } from '@app/modules/workspace';
import type { ActorRequest } from '@app/shared/presentation/actor';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { z } from 'zod';
import { WorkspaceNotFoundError } from '../application/workspace-goal.errors';

const workspaceIdSchema = z.uuid();

/**
 * On a route under `/v1/workspaces/:workspaceId`: refuses anyone who is not a Member of that
 * Workspace, so no Workspace Goal use case can run outside one. It runs before the validation pipe,
 * so it checks the id itself; a malformed one is just another Workspace the caller is not in.
 *
 * Workspace has a guard doing the same job, deliberately not reused: a module may reach another
 * only through what it publishes, and Workspace publishes whether somebody is a Member, not the
 * HTTP code that turns that into a refusal.
 */
@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(
    private readonly workspaceMembershipPort: WorkspaceMembershipPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ActorRequest>();
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
    return true;
  }
}
